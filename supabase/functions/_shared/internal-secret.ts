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

/**
 * Accept either an internal-secret/service-role caller (cron, pg_cron, sibling
 * functions) OR an authenticated user with the "admin" role (manual admin-UI
 * triggers). Returns null on success, a Response on failure.
 */
export async function requireInternalOrAdmin(
  req: Request,
  corsHeaders: Record<string, string>
): Promise<Response | null> {
  // Fast path: internal secret or service-role JWT.
  const internalFail = requireInternalSecret(req, corsHeaders);
  if (!internalFail) return null;

  // Fall back to authenticated admin.
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return internalFail;

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseAnonKey || !serviceKey) return internalFail;

  const { createClient } = await import("npm:@supabase/supabase-js@2");
  const anon = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user } } = await anon.auth.getUser();
  if (!user) return internalFail;

  const svc = createClient(supabaseUrl, serviceKey);
  const { data: isAdmin } = await svc.rpc("has_role", {
    _user_id: user.id,
    _role: "admin",
  });
  if (!isAdmin) {
    return new Response(
      JSON.stringify({ error: "Forbidden", message: "Admin role required" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return null;
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
