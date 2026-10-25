import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ contacts: new Map<string, Record<string, unknown>>(), deals: new Map<string, Record<string, unknown>>(), inserts: [] as string[], failDeal: '', failContact: '', onEmailRead: null as null | (() => void), onContact: null as null | (() => void) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: (table: string) => {
  const filters: Record<string, unknown> = {}; let payload: Record<string, unknown> | undefined;
  const rows = table === 'crm_contacts' ? state.contacts : state.deals;
  const run = async () => {
    if (payload) {
      state.inserts.push(table);
      if (table === 'agent_deals' && state.failDeal === 'before') { state.failDeal = ''; return { data: null, error: Error('offline') }; }
      if (rows.has(String(payload.id))) return { data: null, error: { code: '23505' } };
      rows.set(String(payload.id), { ...payload });
      if (table === 'crm_contacts') state.onContact?.();
      if (table === 'agent_deals' && state.failDeal === 'after') { state.failDeal = ''; return { data: null, error: Error('response lost') }; }
      if (table === 'crm_contacts' && state.failContact === 'after') { state.failContact = ''; return { data: null, error: Error('response lost') }; }
      return { data: { ...payload }, error: null };
    }
    if (filters.email) state.onEmailRead?.();
    return { data: [...rows.values()].find(row => Object.entries(filters).every(([k, v]) => row[k] === v)) || null, error: null };
  };
  const q = { select: () => q, eq: (k: string, v: unknown) => { filters[k] = v; return q; }, is: (k: string, v: unknown) => { filters[k] = v; return q; },
    insert: (p: Record<string, unknown>) => { payload = p; return q; }, single: run, maybeSingle: run };
  return q;
} } }));
import { recoverDealCreation, readDealAttempt, saveDealAttempt, type DealCreationAttempt } from './dealCreationRecovery';
const make = (): DealCreationAttempt => ({ version: 1, actorId: 'actor-a', companyId: 'company-a', contactId: 'contact-a', dealId: 'deal-a', contact: { first_name: 'Synthetic', email: null }, contactPatch: null, deal: { company_id: 'company-a', agent_id: 'actor-a', client_name: 'Synthetic' } });
beforeEach(() => { state.contacts.clear(); state.deals.clear(); state.inserts.length = 0; state.failDeal = ''; state.failContact = ''; state.onContact = null; state.onEmailRead = null; sessionStorage.clear(); });
describe('staged CRM creation recovery with canonical primary keys', () => {
  it('retries a failed deal without another no-email contact', async () => {
    const a = make(); saveDealAttempt(a); state.failDeal = 'before';
    await expect(recoverDealCreation(a, () => true)).rejects.toThrow('offline');
    const result = await recoverDealCreation(readDealAttempt(a.actorId, a.companyId)!, () => true);
    expect(result.deal.id).toBe('deal-a'); expect(state.contacts.size).toBe(1); expect(state.deals.size).toBe(1);
    expect(state.inserts.filter(t => t === 'crm_contacts')).toHaveLength(1);
  });
  it.each(['crm_contacts', 'agent_deals'])('recovers a lost %s insert acknowledgement without duplicate rows', async table => {
    const a = make(); saveDealAttempt(a);
    if (table === 'crm_contacts') state.failContact = 'after'; else state.failDeal = 'after';
    await expect(recoverDealCreation(a, () => true)).rejects.toThrow('response lost');
    const r = await recoverDealCreation(readDealAttempt(a.actorId, a.companyId)!, () => true);
    expect(r.deal.contact_id).toBe('contact-a'); expect(state.contacts.size).toBe(1); expect(state.deals.size).toBe(1);
    expect(state.inserts.filter(t => t === table)).toHaveLength(1);
  });
  it('reuses canonical company/email contact and journals its actual id before deal creation', async () => {
    state.contacts.set('existing', { id: 'existing', company_id: 'company-a', email: 'same@example.test' });
    const a = make(); a.contact!.email = 'same@example.test'; saveDealAttempt(a);
    await recoverDealCreation(a, () => true);
    expect(readDealAttempt(a.actorId, a.companyId)?.contactId).toBe('existing');
    expect(state.deals.get('deal-a')?.contact_id).toBe('existing'); expect(state.contacts.size).toBe(1);
  });
  it('stops between stages if actor/company context changes after the contact committed', async () => {
    let current = true; state.onContact = () => { current = false; };
    const a = make(); saveDealAttempt(a);
    await expect(recoverDealCreation(a, () => current)).rejects.toThrow('actor or company changed');
    expect(state.deals.size).toBe(0); expect(state.contacts.size).toBe(1);
    expect(readDealAttempt('actor-b', 'company-a')).toBeNull(); expect(readDealAttempt('actor-a', 'company-b')).toBeNull();
  });
  it('stops before contact insert if actor changes during the canonical email lookup', async () => {
    const a = make(); a.contact!.email = 'new@example.test'; let current = true;
    state.onEmailRead = () => { current = false; };
    await expect(recoverDealCreation(a, () => current)).rejects.toThrow('actor or company changed');
    expect(state.inserts).toHaveLength(0);
  });
  it('never accepts a mismatched deal receipt or creates replacement rows', async () => {
    const a = make(); state.deals.set(a.dealId, { id: a.dealId, company_id: a.companyId, agent_id: 'other', contact_id: a.contactId });
    await expect(recoverDealCreation(a, () => true)).rejects.toThrow('not confirmed'); expect(state.inserts).toHaveLength(0);
  });
  it('blocks writes for a linked contact unavailable in this company', async () => {
    const a = make(); a.contact = null;
    await expect(recoverDealCreation(a, () => true)).rejects.toThrow('Linked contact is unavailable'); expect(state.inserts).toHaveLength(0);
  });
  it('does not overwrite an invalid saved operation', () => {
    const a = make(); saveDealAttempt({ ...a, deal: { company_id: 'other', agent_id: a.actorId } });
    expect(() => readDealAttempt(a.actorId, a.companyId)).toThrow('Invalid CRM');
  });
});
