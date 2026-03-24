/**
 * React Query / Supabase often surface PostgrestError as a plain object, not `Error`.
 */
export function formatQueryError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === 'object') {
    const o = err as Record<string, unknown>;
    if (typeof o.message === 'string' && o.message.trim()) return o.message;
    const code = typeof o.code === 'string' ? o.code : '';
    const details = typeof o.details === 'string' ? o.details : '';
    const hint = typeof o.hint === 'string' ? o.hint : '';
    const joined = [code, details, hint].filter(Boolean).join(' — ');
    if (joined) return joined;
  }
  try {
    return JSON.stringify(err);
  } catch {
    return 'Unknown error';
  }
}
