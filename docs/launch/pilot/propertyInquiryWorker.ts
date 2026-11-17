/** Review-only orchestration. No endpoint, credentials, scheduler or network implementation. */
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
  // Internal SQL fence revalidates live claim/source/recipient and canonical suppression,
  // renders persisted data, enqueues and changes event state in ONE transaction.
  // Never adapt this to the generic public send-transactional-email handler.
  enqueueFenced(input: { dispatchId: string; claimToken: string }): Promise<{ data: unknown; error: unknown }>;
  complete(id: string, claimToken: string, outcome: 'uncertain'): Promise<boolean>;
}
export async function runPropertyInquiryWorker(deps: InquiryWorkerDependencies): Promise<'idle' | HandoffOutcome> {
  const event = await deps.claim();
  if (!event) return 'idle';
  try {
    const {data,error}=await deps.enqueueFenced({dispatchId:event.id,claimToken:event.claim_token});
    if (!error && data && typeof data==='object') {
      const result=data as Record<string,unknown>;
      if (result.outcome==='queued' || result.outcome==='suppressed' || result.outcome==='uncertain') return result.outcome;
      if (result.outcome==='failed' && result.retry_safe===true) return 'failed';
    }
  } catch { /* Queue may have committed before transport lost its response. */ }
  // Completion is fenced too: it cannot overwrite an event already atomically queued.
  try { await deps.complete(event.id,event.claim_token,'uncertain'); } catch { /* lease expiry remains conservative */ }
  return 'uncertain';
}
