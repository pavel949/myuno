/**
 * Public environment validation (Vite `import.meta.env`).
 * Production builds fail fast if Supabase URL/key are missing (CI + deploy).
 * Development: soft warning only so local hacking without .env still runs.
 */
import { z } from 'zod';
import { logger } from '@/lib/logger';

/** Preferred key name + legacy alias support. */
export function getSupabasePublishableKey(): string | undefined {
  return (
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ||
    undefined
  );
}

const prodPublicEnvSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(20, 'Supabase publishable/anon key required'),
});

export function validatePublicEnv(): void {
  if (import.meta.env.MODE === 'test') return;

  const raw = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL?.trim(),
    VITE_SUPABASE_PUBLISHABLE_KEY: getSupabasePublishableKey(),
  };

  const hasUrl = Boolean(raw.VITE_SUPABASE_URL);
  const hasKey = Boolean(raw.VITE_SUPABASE_PUBLISHABLE_KEY);
  if (!hasUrl || !hasKey) {
    const hint = 'Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or legacy VITE_SUPABASE_ANON_KEY).';
    logger.error(`[env] Missing Supabase env. ${hint}`);
    throw new Error(`[env] Missing Supabase configuration. ${hint}`);
  }

  const parsed = prodPublicEnvSchema.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
    throw new Error(`[env] Invalid public environment: ${msg}`);
  }
}
