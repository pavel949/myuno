/** Notification outcome is separate from the durable consultation receipt.
 * No automatic retry: a timeout may mean a provider already accepted the message.
 */
export type LeadNotificationStatus = 'accepted' | 'unconfirmed';
export async function observeLeadNotification(
  invoke: () => Promise<{ data: unknown; error: unknown }>,
  timeoutMs = 10000,
): Promise<LeadNotificationStatus> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve().then(invoke).then(({ data, error }): LeadNotificationStatus => {
        if (error || !data || typeof data !== 'object') return 'unconfirmed';
        const response = data as { success?: boolean; partial?: boolean };
        return response.success === true && response.partial !== true ? 'accepted' : 'unconfirmed';
      }).catch((): LeadNotificationStatus => 'unconfirmed'),
      new Promise<LeadNotificationStatus>(resolve => {
        timer = setTimeout(() => resolve('unconfirmed'), timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
