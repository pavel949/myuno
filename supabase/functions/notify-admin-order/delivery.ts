/** Provider acceptance is not delivery. No retries on ambiguous failures. */
export type ChannelOutcome = 'accepted' | 'unconfirmed' | 'not_configured';
export async function attemptChannel(configured: boolean, send: () => Promise<void>, timeoutMs = 8000): Promise<ChannelOutcome> {
  if (!configured) return 'not_configured';
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve().then(send).then((): ChannelOutcome => 'accepted').catch((): ChannelOutcome => 'unconfirmed'),
      new Promise<ChannelOutcome>(resolve => { timer = setTimeout(() => resolve('unconfirmed'), timeoutMs); }),
    ]);
  } finally { clearTimeout(timer); }
}
export function emailAccepted(response: unknown): boolean {
  if (!response || typeof response !== 'object') return false;
  const { data, error } = response as { data?: { id?: unknown }; error?: unknown };
  return !error && typeof data?.id === 'string' && data.id.length > 0;
}
export function whatsAppAccepted(response: unknown): boolean {
  if (!response || typeof response !== 'object') return false;
  const { sent, id, error } = response as { sent?: unknown; id?: unknown; error?: unknown };
  return !error && (sent === true || sent === 'true') && (typeof id === 'string' && id.length > 0 || typeof id === 'number' && Number.isFinite(id) && id > 0);
}
