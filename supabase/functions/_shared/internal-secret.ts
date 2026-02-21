/**
 * Internal Secret Guard
 * Protects cron/service-role endpoints by requiring X-Internal-Secret header.
 */

export function requireInternalSecret(
  req: Request,
  corsHeaders: Record<string, string>
): Response | null {
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
