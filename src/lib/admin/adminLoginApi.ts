/**
 * Admin password-login endpoint (optional custom flow).
 * Default: same-origin POST `/api/admin/login` (requires host proxy or serverless route).
 * Override with VITE_ADMIN_LOGIN_API_URL (e.g. Supabase Edge Function full URL).
 */
export function getAdminLoginApiUrl(): string {
  const raw = import.meta.env.VITE_ADMIN_LOGIN_API_URL as string | undefined;
  if (raw?.trim()) return raw.trim().replace(/\/$/, '');
  return '/api/admin/login';
}
