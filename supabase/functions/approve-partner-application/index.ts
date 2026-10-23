import { createClient } from "../_shared/supabase.ts";
import { requireAuth } from "../_shared/auth-guard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// No verified actor-bound atomic decision/activation contract exists in the
// registered source. Never resume the former multi-write activation saga.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const reply = (status: number, body: Record<string, unknown>) => new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
  try {
    const auth = await requireAuth(req, corsHeaders);
    if (auth instanceof Response) return auth;
    const client = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: admin, error } = await client.rpc("has_role", { _user_id: auth.user.id, _role: "admin" });
    if (error || admin !== true) return reply(403, { success: false, error: "Admin access required" });
    const body = await req.json().catch(() => null);
    if (!body || typeof body.application_id !== "string" || !body.application_id.trim()
      || (body.action !== undefined && body.action !== "approve" && body.action !== "reject")) {
      return reply(400, { success: false, error: "Valid application_id and approve/reject action required" });
    }
    // Identical retries, conflicting decisions and lost responses are all safe:
    // there is no decision write, activation, role grant or mail dispatch.
    return reply(503, {
      success: false, code: "partner_decision_contract_unavailable",
      error: "Partner decisions are paused pending a verified atomic activation contract.",
      decision_committed: false, vendor_granted: false,
      notification: { attempted: false, provider_accepted: false, delivered: false },
      retryable: false,
    });
  } catch {
    return reply(500, { success: false, error: "Partner decision could not be verified" });
  }
});
