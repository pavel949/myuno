/**
 * Internal Secret Guard
 * Protects cron/service-role endpoints. Accepts either:
 *   - X-Internal-Secret header matching INTERNAL_SECRET env, OR
 *   - Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY> (used by pg_cron via net.http_post)
 */

/**
 * Constant-time string comparison to avoid leaking secret length/contents via
 * timing side-channels. Always compares a fixed number of bytes; length
 * mismatch still folds into the accumulator so timing stays uniform.
 */
function timingSafeEqual(a: string, b: string): boolean {
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);
  // Mix length difference into the result without early-exit.
  let mismatch = aBytes.length ^ bBytes.length;
  const len = Math.max(aBytes.length, bBytes.length);
  for (let i = 0; i < len; i++) {
    mismatch |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0);
  }
  return mismatch === 0;
}

export function requireInternalSecret(
  req: Request,
  corsHeaders: Record<string, string>
): Response | null {
  // Allow service-role JWT (used by pg_cron schedulers)
  const authHeader = req.headers.get("Authorization") || "";
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (serviceRole && timingSafeEqual(authHeader, `Bearer ${serviceRole}`)) {
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
  if (!got || !timingSafeEqual(got, expected)) {
    return new Response(
      JSON.stringify({ error: "Unauthorized", message: "Missing or invalid internal secret" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return null; // Allowed
}
