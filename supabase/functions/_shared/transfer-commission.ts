/**
 * Transfer markup multiplier.
 * Reads `vertical_commission_rules` where vertical='transfer' (or 'transport').
 *
 * NOTE: `base_commission` is stored with INCONSISTENT units across rows — some
 * verticals use a fraction (transfer=0.10, property_management=0.30) and others
 * a whole percent (property_sale=5). We normalise here: any value < 1 is treated
 * as a fraction (×100), otherwise as a whole percent. This guards against the
 * previous off-by-100 bug where 0.10 produced a 0.1% markup instead of 10%.
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
      // Normalise mixed units: < 1 means a fraction (0.10 → 10%), otherwise it
      // is already a whole percent (5 → 5%).
      pct = data.base_commission < 1 ? data.base_commission * 100 : data.base_commission;
    }
  } catch (e) {
    console.warn("[transfer-commission] lookup failed, using fallback", e);
  }
  const multiplier = 1 + pct / 100;
  _cache = { multiplier, ts: Date.now() };
  return multiplier;
}
