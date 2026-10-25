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

  // Recover a committed deal before touching its contact or dispatching any side effect.
  const existingDeal = await read('agent_deals', attempt.dealId);
  if (existingDeal) return { deal: receipt(existingDeal, 'agent_deals'), createdDeal: false, createdContact: false };

  let createdContact = false;
  const existingContact = await read('crm_contacts', attempt.contactId);
  if (existingContact) receipt(existingContact, 'crm_contacts');
  else {
    if (!attempt.contact) throw new Error('Linked contact is unavailable in this company. No deal was created.');
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
    persist(attempt);
    if (createdContact) onContactSaved('created');
  }
  assertCurrent();
  if (attempt.contactPatch) {
    const { data, error } = await supabase.from('crm_contacts').update(attempt.contactPatch)
      .eq('id', attempt.contactId).eq('company_id', attempt.companyId).select('*').single();
    assertCurrent();
    if (error) throw error;
    receipt(data as Record<string, unknown>, 'crm_contacts');
    attempt.contactPatch = null;
    persist(attempt);
    onContactSaved('updated');
  }
  assertCurrent();
  const { data, error } = await supabase.from('agent_deals').insert({
    ...attempt.deal, id: attempt.dealId, company_id: attempt.companyId,
    agent_id: attempt.actorId, contact_id: attempt.contactId,
  } as never).select('*').single();
  assertCurrent();
  if (error) throw error;
  return { deal: receipt(data as Record<string, unknown>, 'agent_deals'), createdDeal: true, createdContact };
}
