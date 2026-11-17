/** Review-only worker core. No endpoint, credentials, scheduler or network implementation. */
export interface ClaimedInquiryEvent {
  id: string; request_id: string; admitted_actor_id: string; claim_token: string; destination: string;
  source: 'property_inquiries'; channel: 'email';
}
export interface PersistedInquiry {
  id: string; property_id: string; user_id: string; status: string | null;
  name: string; email: string | null; phone: string | null; message: string | null;
  check_in: string | null; check_out: string | null; guests: number | null;
}
export type HandoffOutcome = 'queued' | 'suppressed' | 'failed' | 'uncertain';
export interface InquiryWorkerDependencies {
  claim(): Promise<ClaimedInquiryEvent | null>;
  loadInquiry(id: string): Promise<PersistedInquiry | null>;
  readAdminEmails(): Promise<unknown>;
  // Must preserve existing sender suppression/unsubscribe/queue behavior, not raw enqueue_email.
  enqueueTransactionalEmail(input: {
    templateName: 'property-inquiry-admin'; recipientEmail: string; idempotencyKey: string;
    templateData: { inquiry: PersistedInquiry; adminUrl: string };
  }): Promise<{ data: unknown; error: unknown }>;
  complete(id: string, claimToken: string, outcome: HandoffOutcome): Promise<boolean>;
}
function emails(value: unknown): string[] | null {
  try { if (typeof value === 'string') value = JSON.parse(value); } catch { return null; }
  if (!Array.isArray(value) || !value.length || value.length > 10
    || value.some(item => typeof item !== 'string' || item.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.trim()))) return null;
  return [...new Set(value.map(item => item.trim().toLowerCase()))];
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function runPropertyInquiryWorker(deps: InquiryWorkerDependencies): Promise<'idle' | HandoffOutcome> {
  const event = await deps.claim();
  if (!event) return 'idle';
  const finish = async (outcome: HandoffOutcome): Promise<HandoffOutcome> => {
    try { return await deps.complete(event.id,event.claim_token,outcome) ? outcome : 'uncertain'; }
    catch { return 'uncertain'; }
  };
  let inquiry: PersistedInquiry | null;
  let recipients: string[] | null;
  try {
    if (event.source !== 'property_inquiries' || event.channel !== 'email' || !uuid.test(event.request_id)) return finish('suppressed');
    inquiry = await deps.loadInquiry(event.request_id);
    recipients = emails(await deps.readAdminEmails());
  } catch { return finish('failed'); } // No enqueue attempted, retry is safe.
  if (!recipients) return finish('failed');
  if (!inquiry || inquiry.id !== event.request_id || inquiry.status !== 'pending'
    || inquiry.user_id !== event.admitted_actor_id || !uuid.test(inquiry.property_id) || !uuid.test(inquiry.user_id)
    || !recipients.includes(event.destination.trim().toLowerCase())) return finish('suppressed');
  try {
    const { data, error } = await deps.enqueueTransactionalEmail({
      templateName: 'property-inquiry-admin', recipientEmail:event.destination.trim().toLowerCase(),
      idempotencyKey:`myuno-property-inquiry-email:${event.id}`,
      templateData:{ inquiry, adminUrl:`https://myuno.app/admin/inbox?source=property_inquiries&request=${encodeURIComponent(inquiry.id)}` },
    });
    if (!error && data && typeof data === 'object') {
      const result = data as Record<string,unknown>;
      if (result.success === true && result.queued === true) return finish('queued');
      if (result.success === false && result.reason === 'email_suppressed') return finish('suppressed');
    }
    return finish('uncertain'); // Missing/ambiguous acknowledgment may hide successful enqueue.
  } catch { return finish('uncertain'); }
}
