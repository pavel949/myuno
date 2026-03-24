// Cron: mark pending orders older than 2h as abandoned; expire Stripe Checkout Sessions.
import { createStripeClient } from "../_shared/stripe.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { requireInternalSecret } from '../_shared/internal-secret.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-secret",
};

const PENDING_MAX_AGE_HOURS = 2;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Internal/cron guard
    const guardResponse = requireInternalSecret(req, corsHeaders);
    if (guardResponse) return guardResponse;
    
    const supabase = createServiceClient();
    const cutoff = new Date(Date.now() - PENDING_MAX_AGE_HOURS * 60 * 60 * 1000).toISOString();

    const { data: orders, error: fetchError } = await supabase
      .from("orders")
      .select("id, metadata")
      .eq("status", "pending")
      .lt("created_at", cutoff);

    if (fetchError) {
      console.error("[cleanup-abandoned-orders] Fetch error:", fetchError);
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = createStripeClient();
    let expired = 0;

    for (const order of orders ?? []) {
      const sessionId =
        (order.metadata as Record<string, unknown> | null)?.stripe_session_id as string | undefined;
      if (sessionId) {
        try {
          await stripe.checkout.sessions.expire(sessionId);
          expired++;
        } catch (e) {
          console.warn("[cleanup-abandoned-orders] Expire session failed:", sessionId, e);
        }
      }

      await supabase
        .from("orders")
        .update({ status: "abandoned" })
        .eq("id", order.id);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        updated: orders?.length ?? 0,
        sessions_expired: expired,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[cleanup-abandoned-orders]", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
