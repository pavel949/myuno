// Updates public.currency_rates daily from a free FX API.
// Base = THB. Fixed targets: USD, EUR, RUB. Scheduler authority is checked
// before provider access or privileged client creation; activation is separate.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireInternalSecret } from "../_shared/internal-secret.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DEFAULT_TARGETS = ["USD", "EUR", "RUB"];

function validatedRates(payload: unknown, primary: boolean): Record<string, number> {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("Invalid currency provider batch");
  const body = payload as Record<string, unknown>;
  if (primary ? body.result !== "success" || body.base_code !== "THB" : body.success !== true || body.base !== "THB") {
    throw new Error("Invalid currency provider batch");
  }
  if (!body.rates || typeof body.rates !== "object" || Array.isArray(body.rates)) throw new Error("Invalid currency provider batch");
  const rates = body.rates as Record<string, unknown>;
  if (!Object.hasOwn(rates, "THB") || rates.THB !== 1) throw new Error("Invalid currency provider batch");
  const validated: Record<string, number> = {};
  for (const target of DEFAULT_TARGETS) {
    const rate = rates[target];
    // Match the existing numeric(12,6) storage contract, including values that
    // would round to zero. Never coerce strings/null or persist a partial batch.
    if (!Object.hasOwn(rates, target) || typeof rate !== "number" || !Number.isFinite(rate)
      || rate <= 0 || rate > 999999.999999 || Math.round(rate * 1e6) / 1e6 <= 0) {
      throw new Error("Invalid currency provider batch");
    }
    validated[target] = rate;
  }
  return validated;
}

async function readProvider(url: string, primary: boolean): Promise<Record<string, number>> {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Currency provider unavailable");
  return validatedRates(await response.json(), primary);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: { ...corsHeaders, Allow: "POST, OPTIONS" } });
  const denied = requireInternalSecret(req, corsHeaders);
  if (denied) return denied;

  try {
    // Primary provider: open.er-api.com (free, no key, daily updates)
    const base = "THB";
    let rates: Record<string, number> | null = null;
    let provider = "open.er-api.com";

    try {
      rates = await readProvider(`https://open.er-api.com/v6/latest/${base}`, true);
    } catch {
      // Keep the existing URL, but unknown/error/base-less schemas fail closed.
      // No API key or fallback schema is inferred from historical availability.
      provider = "exchangerate.host";
      rates = await readProvider(`https://api.exchangerate.host/latest?base=${base}`, false);
    }

    const targets = DEFAULT_TARGETS;
    const rows = targets
      .map((t) => ({
        base_currency: base,
        target_currency: t,
        rate: rates![t],
        source: "api",
        updated_at: new Date().toISOString(),
        updated_by: null,
      }));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const { error } = await supabase
      .from("currency_rates")
      .upsert(rows, { onConflict: "base_currency,target_currency" });

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, provider, base, updated: rows.length, rates: rows }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("update-currency-rates error:", e);
    return new Response(
      JSON.stringify({ success: false, error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
