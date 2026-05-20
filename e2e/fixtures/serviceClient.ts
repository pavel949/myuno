/**
 * Service-role Supabase client for E2E seed/teardown/verification.
 *
 * Requires env vars:
 *   - VITE_SUPABASE_URL (or SUPABASE_URL)
 *   - SUPABASE_SERVICE_ROLE_KEY
 *
 * Never import this from app code — only e2e fixtures/specs.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null = null;

export function getServiceClient(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      '[e2e] Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env. ' +
        'Set them in .env.e2e or CI secrets before running marketplace e2e tests.',
    );
  }
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

export function getE2ETestToken(): string {
  const token = process.env.E2E_TEST_TOKEN;
  if (!token) {
    throw new Error('[e2e] Missing E2E_TEST_TOKEN env (must match Supabase secret).');
  }
  return token;
}

export function getFunctionsBaseUrl(): string {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  if (!url) throw new Error('[e2e] Missing VITE_SUPABASE_URL');
  return `${url.replace(/\/$/, '')}/functions/v1`;
}
