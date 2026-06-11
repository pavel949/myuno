/**
 * Transfer markup multiplier.
 * Reads `vertical_commission_rules` where vertical='transfer' (or 'transport').
 * `base_commission` is expected as a percentage (e.g. 35 for 35% markup).
 * Falls back to 35% if no row or table missing.
 *
 * Vendor payout = total / multiplier, platform fee = total - vendor payout.
 */
import { createServiceClient } from "./supabase.ts";

const FALLBACK_PCT = 35;
let _cache: { multiplier: number; ts: number } | null = null;
const TTL_MS = 5 * 60 * 1000;

export async function getTransferMarkupMultiplier(): Promise<number> {
  if (_cache && Date.now() - _cache.ts < TTL_MS) return _cache.multiplier;
  let pct = FALLBACK_PCT;
  try {
    const sb = createServiceClient();
    const { data } = await sb
      .from("vertical_commission_rules")
      .select("base_commission, vertical, is_active")
      .in("vertical", ["transfer", "transport"])
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    if (data && typeof data.base_commission === "number" && data.base_commission > 0) {
      pct = data.base_commission;
    }
  } catch (e) {
    console.warn("[transfer-commission] lookup failed, using fallback", e);
  }
  const multiplier = 1 + pct / 100;
  _cache = { multiplier, ts: Date.now() };
  return multiplier;
}
