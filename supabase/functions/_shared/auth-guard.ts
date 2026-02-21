/**
 * Shared Auth Guard for Edge Functions
 * Validates JWT tokens and extracts user identity.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

export interface AuthResult {
  user: { id: string; email?: string; role?: string };
}

/**
 * Require authenticated user. Returns user or a 401 Response.
 */
export async function requireAuth(
  req: Request,
  corsHeaders: Record<string, string>
): Promise<AuthResult | Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Unauthorized", message: "Missing or invalid Authorization header" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const token = authHeader.replace("Bearer ", "");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized", message: "Invalid or expired token" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return {
    user: {
      id: data.user.id,
      email: data.user.email,
      role: data.user.role,
    },
  };
}

/**
 * Optional auth — returns user if token present and valid, null otherwise.
 */
export async function optionalAuth(
  req: Request
): Promise<{ id: string; email?: string } | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.replace("Bearer ", "");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;

  return { id: data.user.id, email: data.user.email };
}
