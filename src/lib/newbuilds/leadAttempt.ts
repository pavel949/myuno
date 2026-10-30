/** Keep a retry on the same primary key, including after a tab reload.
 * Store only a digest and random ID, never contact details. No public SELECT
 * permission is assumed; a duplicate response is not proof of acceptance.
 */
export async function leadAttempt(payload: Record<string, unknown>): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(payload)));
  const fingerprint = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  const key = `myuno-nb-lead-attempt:${fingerprint}`;
  const saved = sessionStorage.getItem(key);
  if (saved && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(saved)) return saved;
  const id = crypto.randomUUID();
  // Fail before the write if retry identity cannot be persisted.
  sessionStorage.setItem(key, id);
  return id;
}
