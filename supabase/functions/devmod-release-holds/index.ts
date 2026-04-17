/**
 * devmod-release-holds — Release expired soft holds
 *
 * Called by Supabase cron scheduler every minute.
 * Delegates to the devmod_release_expired_holds() DB function which:
 *   1. Marks expired unit_holds as released (released_at = now(), released_reason = 'expired')
 *   2. Transitions those project_units back to 'available' (if still in soft_hold)
 *
 * Schedule: every 1 minute
 * Deploy: supabase functions deploy devmod-release-holds
 *
 * To schedule via Supabase Dashboard:
 *   Edge Functions → devmod-release-holds → Schedule → "* * * * *"
 *
 * Or via pg_cron (if preferred):
 *   SELECT cron.schedule('release-holds', '* * * * *',
 *     $$ SELECT net.http_post('https://<project>.supabase.co/functions/v1/devmod-release-holds',
 *       '{}', '{"Content-Type":"application/json","Authorization":"Bearer <service_key>"}') $$);
 */

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

  try {
    const { data, error } = await supabase.rpc("devmod_release_expired_holds");

    if (error) {
      console.error("[devmod-release-holds] RPC error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const released = data as number ?? 0;
    if (released > 0) {
      console.log(`[devmod-release-holds] Released ${released} expired soft holds`);
    }

    return new Response(
      JSON.stringify({ success: true, released }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[devmod-release-holds] Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
