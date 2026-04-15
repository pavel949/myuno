/**
 * Human-readable PostgREST / Supabase client errors for CRM and API surfaces.
 */
export function formatPostgrestError(error: unknown): string {
  if (error == null) return 'Unknown error';
  if (typeof error === 'object' && error !== null) {
    const e = error as {
      message?: string;
      details?: string;
      hint?: string;
      code?: string;
    };
    const segments: string[] = [];
    if (e.code) segments.push(e.code);
    if (e.message) segments.push(e.message);
    if (e.details) segments.push(e.details);
    if (e.hint) segments.push(e.hint);
    if (segments.length > 0) return segments.join(' — ');
  }
  if (error instanceof Error) return error.message;
  return String(error);
}
