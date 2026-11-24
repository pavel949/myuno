/**
 * Edge functions answer failures with `{ error, code }`. supabase-js wraps a
 * non-2xx reply in an error whose `context` is the raw Response; this reads the
 * machine code so the UI can explain the failure instead of showing a generic one.
 */
export async function readFunctionErrorCode(error: unknown): Promise<string | null> {
  if (typeof error !== 'object' || error === null || !('context' in error)) return null;
  const context = error.context;
  if (!(context instanceof Response)) return null;
  try {
    const body: unknown = await context.clone().json();
    return typeof body === 'object' && body !== null && 'code' in body && typeof body.code === 'string' ? body.code : null;
  } catch {
    return null;
  }
}
