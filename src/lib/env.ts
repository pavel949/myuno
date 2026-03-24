/**
 * Public environment validation (Vite `import.meta.env`).
 * Production builds fail fast if Supabase URL/key are missing (CI + deploy).
 * Development: soft warning only so local hacking without .env still runs.
 */
import { z } from 'zod';
import { logger } from '@/lib/logger';

const prodPublicEnvSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(20, 'Supabase publishable/anon key required'),
});

export function validatePublicEnv(): void {
  if (import.meta.env.MODE === 'test') return;

  const raw = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  };

  if (!import.meta.env.PROD) {
    const hasUrl = Boolean(raw.VITE_SUPABASE_URL?.trim());
    const hasKey = Boolean(raw.VITE_SUPABASE_PUBLISHABLE_KEY?.trim());
    if (!hasUrl || !hasKey) {
      logger.warn(
        '[env] Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY — copy .env.example to .env'
      );
    }
    return;
  }

  const parsed = prodPublicEnvSchema.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
    throw new Error(`[env] Invalid public environment: ${msg}`);
  }
}
