/**
 * Shared Supabase client for Edge Functions
 * Use this module to ensure consistent versioning across all functions.
 */

import { createClient } from "npm:@supabase/supabase-js@2.49.4";
export { createClient };
export type { SupabaseClient } from "npm:@supabase/supabase-js@2.49.4";

/**
 * Create a Supabase client with service role key
 * Use this for admin operations that bypass RLS
 */
export function createServiceClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Create a Supabase client with anon key
 * Use this for operations that respect RLS
 */
export function createAnonClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  return createClient(supabaseUrl, supabaseAnonKey);
}
