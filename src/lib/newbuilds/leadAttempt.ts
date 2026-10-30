/** Per-tab retry identity, never a server receipt or authorization boundary. */
export interface LeadAttempt { id: string; state: 'pending' | 'completed' }
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function attemptKey(payload: Record<string, unknown>): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(payload)));
  const fingerprint = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  return `myuno-nb-lead-attempt:${fingerprint}`;
}
function readAttempt(key: string): LeadAttempt | null {
  const saved = sessionStorage.getItem(key);
  if (!saved) return null;
  // Preserve retries stored by the earlier client format.
  if (uuid.test(saved)) return { id: saved, state: 'pending' };
  try {
    const value = JSON.parse(saved);
    if (typeof value?.id === 'string' && uuid.test(value.id) && ['pending', 'completed'].includes(value.state)) return value;
  } catch { /* Invalid local data is not a receipt. */ }
  return null;
}
function persist(key: string, attempt: LeadAttempt): LeadAttempt {
  // Fail before a write if retry identity cannot be persisted. No contact data.
  sessionStorage.setItem(key, JSON.stringify(attempt));
  return attempt;
}
export async function leadAttempt(payload: Record<string, unknown>): Promise<LeadAttempt> {
  const key = await attemptKey(payload);
  return readAttempt(key) ?? persist(key, { id: crypto.randomUUID(), state: 'pending' });
}
/** Call only after an acknowledged insert; never after a timeout/duplicate. */
export async function completeLeadAttempt(payload: Record<string, unknown>, id: string): Promise<void> {
  const key = await attemptKey(payload);
  if (readAttempt(key)?.id !== id) throw new Error('Lead attempt changed');
  persist(key, { id, state: 'completed' });
}
/** Only an explicit new-enquiry action may rotate a completed attempt. */
export async function startNewLeadAttempt(payload: Record<string, unknown>, completedId: string): Promise<void> {
  const key = await attemptKey(payload);
  const saved = readAttempt(key);
  if (saved?.id !== completedId || saved.state !== 'completed') throw new Error('Previous lead is not confirmed');
  persist(key, { id: crypto.randomUUID(), state: 'pending' });
}
