// Updates public.currency_rates daily from a free FX API.
// Base = THB. Targets: USD, EUR, RUB (extend via TARGETS env or query param).
// Uses UPSERT with source='api'. No auth required (invoked by pg_cron).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_TARGETS = ["USD", "EUR", "RUB"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // Primary provider: open.er-api.com (free, no key, daily updates)
    const base = "THB";
    let rates: Record<string, number> | null = null;
    let provider = "open.er-api.com";

    try {
      const r = await fetch(`https://open.er-api.com/v6/latest/${base}`);
      const j = await r.json();
      if (j?.result === "success" && j.rates) {
        rates = j.rates;
      } else {
        throw new Error(`open.er-api error: ${JSON.stringify(j).slice(0, 200)}`);
      }
    } catch (e) {
      // Fallback: exchangerate.host
      provider = "exchangerate.host";
      const r2 = await fetch(`https://api.exchangerate.host/latest?base=${base}`);
      const j2 = await r2.json();
      if (!j2?.rates) throw new Error(`both providers failed: ${(e as Error).message}`);
      rates = j2.rates;
    }

    const targets = DEFAULT_TARGETS;
    const rows = targets
      .filter((t) => rates![t] != null)
      .map((t) => ({
        base_currency: base,
        target_currency: t,
        rate: Number(rates![t]),
        source: "api",
        updated_at: new Date().toISOString(),
        updated_by: null,
      }));

    if (rows.length === 0) throw new Error("No target rates returned from provider");

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
