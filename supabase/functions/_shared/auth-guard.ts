/**
 * Shared Auth Guard for Edge Functions
 * Validates JWT tokens and extracts user identity.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

export type AuthContext = {
  user: { id: string; email?: string | null };
};

/**
 * Return a 401 JSON response.
 */
export function unauthorized(
  corsHeaders: Record<string, string>,
  message = "Unauthorized"
): Response {
  return new Response(
    JSON.stringify({ error: "Unauthorized", message }),
    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

/**
 * Require authenticated user. Returns AuthContext or a Response (401/500).
 */
export async function requireAuth(
  req: Request,
  corsHeaders: Record<string, string>
): Promise<AuthContext | Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return unauthorized(corsHeaders, "Missing or invalid Authorization header");
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response(
      JSON.stringify({ error: "Server misconfigured", message: "Missing Supabase credentials" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    return unauthorized(corsHeaders, "Invalid or expired token");
  }

  return {
    user: {
      id: data.user.id,
      email: data.user.email ?? null,
    },
  };
}

/**
 * Optional auth — returns user info if token present and valid, null otherwise.
 */
export async function optionalAuth(
  req: Request
): Promise<{ id: string; email?: string | null } | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;

  return { id: data.user.id, email: data.user.email ?? null };
}
