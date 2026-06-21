/**
 * Internal Secret Guard
 * Protects cron/service-role endpoints. Accepts either:
 *   - X-Internal-Secret header matching INTERNAL_SECRET env, OR
 *   - Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY> (used by pg_cron via net.http_post)
 */

export function requireInternalSecret(
  req: Request,
  corsHeaders: Record<string, string>
): Response | null {
  // Allow service-role JWT (used by pg_cron schedulers)
  const authHeader = req.headers.get("Authorization") || "";
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (serviceRole && authHeader === `Bearer ${serviceRole}`) {
    return null;
  }

  const expected = Deno.env.get("INTERNAL_SECRET");
  if (!expected) {
    return new Response(
      JSON.stringify({ error: "Server misconfigured", message: "INTERNAL_SECRET not set" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const got = req.headers.get("X-Internal-Secret");
  if (!got || got !== expected) {
    return new Response(
      JSON.stringify({ error: "Unauthorized", message: "Missing or invalid internal secret" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return null; // Allowed
}
