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

/**
 * Async variant for cron / database-webhook endpoints. Accepts the internal
 * secret, the exact service-role key, or a bearer token that the auth server
 * itself accepts as a service-role credential (covers rotated/vault-stored
 * keys). Unsigned or forged JWT claims are never trusted.
 */
export async function requireServiceCaller(
  req: Request,
  corsHeaders: Record<string, string>
): Promise<Response | null> {
  if (requireInternalSecretQuiet(req)) return null;
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const url = Deno.env.get("SUPABASE_URL");
  if (token && url) {
    try {
      const r = await fetch(`${url}/auth/v1/admin/users?page=1&per_page=1`, {
        headers: { apikey: token, Authorization: `Bearer ${token}` },
      });
      await r.body?.cancel();
      if (r.ok) return null;
    } catch {
      // fall through to 401
    }
  }
  return new Response(
    JSON.stringify({ error: "Unauthorized" }),
    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

function requireInternalSecretQuiet(req: Request): boolean {
  const authHeader = req.headers.get("Authorization") || "";
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (serviceRole && timingSafeEqual(authHeader, `Bearer ${serviceRole}`)) return true;
  const expected = Deno.env.get("INTERNAL_SECRET");
  const got = req.headers.get("X-Internal-Secret");
  return Boolean(expected && got && timingSafeEqual(got, expected));
}
