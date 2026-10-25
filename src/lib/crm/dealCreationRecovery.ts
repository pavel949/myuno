import { supabase } from '@/integrations/supabase/client';
import type { TablesUpdate } from '@/integrations/supabase/types';
import { getOrCreateContactByEmail } from './getOrCreateContact';

type ContactPreferencePatch = Pick<TablesUpdate<'crm_contacts'>,
  'budget_min' | 'budget_max' | 'currency' | 'preferred_districts' | 'preferred_types' | 'bedrooms_min' | 'is_vip'>;

export interface DealCreationAttempt {
  version: 1;
  actorId: string;
  companyId: string;
  contactId: string;
  dealId: string;
  contact: Record<string, unknown> | null;
  deal: Record<string, unknown>;
  contactPatch: ContactPreferencePatch | null;
  /** Missing on older journals: unknown, never safe to discard. */
  dealWriteState?: 'not_started' | 'started';
  terminalReason?: 'contact_unavailable' | 'contact_patch_rejected';
}
export const dealAttemptKey = (actor: string, company: string) => `crm-deal-attempt:v1:${actor}:${company}`;

/** Session-local recovery journal, never an authorization source. Fail before writes if unavailable. */
export function saveDealAttempt(attempt: DealCreationAttempt) {
  sessionStorage.setItem(dealAttemptKey(attempt.actorId, attempt.companyId), JSON.stringify(attempt));
}
export function readDealAttempt(actor: string, company: string): DealCreationAttempt | null {
  const raw = sessionStorage.getItem(dealAttemptKey(actor, company));
  if (!raw) return null;
  const value = JSON.parse(raw) as DealCreationAttempt;
  if (value.version !== 1 || value.actorId !== actor || value.companyId !== company ||
      !value.contactId || !value.dealId || !value.deal || value.deal.company_id !== company || value.deal.agent_id !== actor) {
    throw new Error('Invalid CRM recovery record. Do not create another deal until the saved attempt is reconciled.');
  }
  return value;
}

export class DealRecoveryBlockedError extends Error {
  constructor(readonly reason: 'contact_unavailable' | 'contact_patch_rejected', readonly code?: string) {
    super(reason === 'contact_unavailable' ? 'Linked contact is unavailable in this company.' : 'Contact preference update was rejected.');
    this.name = 'DealRecoveryBlockedError';
  }
}

export function canDiscardUnsubmittedDeal(attempt: DealCreationAttempt): boolean {
  return attempt.contact === null && attempt.dealWriteState === 'not_started' &&
    (attempt.terminalReason === 'contact_unavailable' || attempt.terminalReason === 'contact_patch_rejected');
}

/** Discard only a diagnosed pre-insert intent. A successful empty read alone is never proof. */
export async function discardUnsubmittedDeal(attempt: DealCreationAttempt, isCurrent: () => boolean) {
  const verify = () => {
    if (!isCurrent()) throw new Error('CRM context changed.');
    const stored = readDealAttempt(attempt.actorId, attempt.companyId);
    if (!stored || stored.dealId !== attempt.dealId || !canDiscardUnsubmittedDeal(stored)) {
      throw new Error('This attempt requires reconciliation before it can be discarded.');
    }
  };
  verify();
  const { data, error } = await supabase.from('agent_deals').select('id').eq('id', attempt.dealId)
    .eq('company_id', attempt.companyId).maybeSingle();
  if (error || data) throw new Error('Could not confirm that this unsubmitted attempt can be discarded.');
  // A retry may have started while the read was pending. Recheck durable state after it.
  verify();
  sessionStorage.removeItem(dealAttemptKey(attempt.actorId, attempt.companyId));
}

/** Existing RLS + primary keys remain final authority; this is staged recovery, not a transaction. */
export async function recoverDealCreation(
  attempt: DealCreationAttempt,
  isCurrent: () => boolean,
  persist: (attempt: DealCreationAttempt) => void = saveDealAttempt,
  onContactSaved: (kind: 'created' | 'updated') => void = () => {},
) {
  const assertCurrent = () => { if (!isCurrent()) throw new Error('CRM actor or company changed. Return to the original context to recover this attempt.'); };
  const receipt = (row: Record<string, unknown> | null, table: 'crm_contacts' | 'agent_deals') => {
    const expected = table === 'crm_contacts' ? attempt.contactId : attempt.dealId;
    if (!row || row.id !== expected || row.company_id !== attempt.companyId ||
        (table === 'agent_deals' && (row.agent_id !== attempt.actorId || row.contact_id !== attempt.contactId))) {
      throw new Error('CRM saved row was not confirmed. Retry the same attempt.');
    }
    return row;
  };
  const read = async (table: 'crm_contacts' | 'agent_deals', id: string) => {
    assertCurrent();
    const { data, error } = await supabase.from(table).select('*').eq('id', id).eq('company_id', attempt.companyId).maybeSingle();
    assertCurrent();
    if (error) throw error;
    return data as Record<string, unknown> | null;
  };

  let lastSavedContactId = attempt.contactId;
  const store = () => {
    assertCurrent();
    const stored = readDealAttempt(attempt.actorId, attempt.companyId);
    if (!stored || stored.dealId !== attempt.dealId) throw new Error('Saved attempt is unavailable. Reconcile before retrying.');
    if (stored.contactId !== lastSavedContactId && attempt.contactId === lastSavedContactId) attempt.contactId = stored.contactId;
    if (stored.contactPatch === null) attempt.contactPatch = null;
    // A second mounted recovery must never downgrade a started or legacy-unknown marker.
    if (stored.dealWriteState === 'started' || attempt.dealWriteState === 'started') attempt.dealWriteState = 'started';
    else if (stored.dealWriteState !== 'not_started' || attempt.dealWriteState !== 'not_started') attempt.dealWriteState = undefined;
    if (attempt.dealWriteState !== 'not_started') delete attempt.terminalReason;
    persist(attempt);
    lastSavedContactId = attempt.contactId;
  };
  // Synchronously revoke a previous discard diagnosis before any awaited retry work.
  delete attempt.terminalReason;
  store();
  const terminal = (reason: NonNullable<DealCreationAttempt['terminalReason']>) => {
    if (attempt.contact === null && attempt.dealWriteState === 'not_started') {
      attempt.terminalReason = reason;
      store();
    }
  };

  // Recover a committed deal before touching its contact or dispatching any side effect.
  const existingDeal = await read('agent_deals', attempt.dealId);
  if (existingDeal) return { deal: receipt(existingDeal, 'agent_deals'), createdDeal: false, createdContact: false };

  let createdContact = false;
  const existingContact = await read('crm_contacts', attempt.contactId);
  if (existingContact) receipt(existingContact, 'crm_contacts');
  else {
    if (!attempt.contact) {
      terminal('contact_unavailable');
      throw new DealRecoveryBlockedError('contact_unavailable');
    }
    assertCurrent();
    // Reuse canonical company/email dedupe. Explicit PK also protects no-email retries.
    const result = await getOrCreateContactByEmail<Record<string, unknown>>({
      ...attempt.contact, id: attempt.contactId, company_id: attempt.companyId, created_by: attempt.actorId,
    }, assertCurrent);
    assertCurrent();
    if (typeof result.contact?.id !== 'string' || result.contact.company_id !== attempt.companyId) {
      throw new Error('Contact receipt was not confirmed. Retry the same attempt.');
    }
    attempt.contactId = result.contact.id;
    createdContact = !result.existed;
    // Persist an email-deduped contact identity before proceeding to the deal.
    store();
    if (createdContact) onContactSaved('created');
  }
  assertCurrent();
  if (attempt.contactPatch) {
    const { data, error } = await supabase.from('crm_contacts').update(attempt.contactPatch)
      .eq('id', attempt.contactId).eq('company_id', attempt.companyId).select('*').single();
    assertCurrent();
    if (error) {
      // PostgreSQL statement rejection rolls back the UPDATE; transport errors prove nothing.
      if (['42501', '23502', '23503', '23514'].includes(error.code)) {
        terminal('contact_patch_rejected');
        throw new DealRecoveryBlockedError('contact_patch_rejected', error.code);
      }
      throw error;
    }
    receipt(data as Record<string, unknown>, 'crm_contacts');
    attempt.contactPatch = null;
    store();
    onContactSaved('updated');
  }
  assertCurrent();
  attempt.dealWriteState = 'started';
  delete attempt.terminalReason;
  store(); // Must be durable BEFORE issuing the deal insert, including rejected inserts.
  assertCurrent();
  const { data, error } = await supabase.from('agent_deals').insert({
    ...attempt.deal, id: attempt.dealId, company_id: attempt.companyId,
    agent_id: attempt.actorId, contact_id: attempt.contactId,
  } as never).select('*').single();
  assertCurrent();
  if (error) throw error;
  return { deal: receipt(data as Record<string, unknown>, 'agent_deals'), createdDeal: true, createdContact };
}
