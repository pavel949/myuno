import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ contacts: new Map<string, Record<string, unknown>>(), deals: new Map<string, Record<string, unknown>>(), inserts: [] as string[], failDeal: '', failContact: '', readError: '', patchError: null as null | { code?: string; message: string }, nullPatchReceipt: false, startStates: [] as unknown[], onDealRead: null as null | (() => void), onEmailRead: null as null | (() => void), onContact: null as null | (() => void) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: (table: string) => {
  const filters: Record<string, unknown> = {}; let payload: Record<string, unknown> | undefined; let patch: Record<string, unknown> | undefined;
  const rows = table === 'crm_contacts' ? state.contacts : state.deals;
  const run = async () => {
    if (patch) {
      if (state.patchError) return { data: null, error: state.patchError };
      const row = rows.get(String(filters.id)); if (row) Object.assign(row, patch);
      return { data: state.nullPatchReceipt ? null : row || null, error: null };
    }
    if (payload) {
      state.inserts.push(table);
      if (table === 'agent_deals') state.startStates.push(JSON.parse(sessionStorage.getItem(`crm-deal-attempt:v1:${payload.agent_id}:${payload.company_id}`) || 'null')?.dealWriteState);
      if (table === 'agent_deals' && state.failDeal === 'before') { state.failDeal = ''; return { data: null, error: Error('offline') }; }
      if (rows.has(String(payload.id))) return { data: null, error: { code: '23505' } };
      rows.set(String(payload.id), { ...payload });
      if (table === 'crm_contacts') state.onContact?.();
      if (table === 'agent_deals' && state.failDeal === 'after') { state.failDeal = ''; return { data: null, error: Error('response lost') }; }
      if (table === 'crm_contacts' && state.failContact === 'after') { state.failContact = ''; return { data: null, error: Error('response lost') }; }
      return { data: { ...payload }, error: null };
    }
    if (state.readError === table) return { data: null, error: Error('Synthetic read denied') };
    if (table === 'agent_deals') state.onDealRead?.();
    if (filters.email) state.onEmailRead?.();
    return { data: [...rows.values()].find(row => Object.entries(filters).every(([k, v]) => row[k] === v)) || null, error: null };
  };
  const q = { select: () => q, eq: (k: string, v: unknown) => { filters[k] = v; return q; }, is: (k: string, v: unknown) => { filters[k] = v; return q; },
    update: (p: Record<string, unknown>) => { patch = p; return q; },
    insert: (p: Record<string, unknown>) => { payload = p; return q; }, single: run, maybeSingle: run };
  return q;
} } }));
import { canDiscardUnsubmittedDeal, discardUnsubmittedDeal, recoverDealCreation, readDealAttempt, saveDealAttempt, type DealCreationAttempt } from './dealCreationRecovery';
const make = (): DealCreationAttempt => { const a: DealCreationAttempt = { version: 1, actorId: 'actor-a', companyId: 'company-a', contactId: 'contact-a', dealId: 'deal-a', contact: { first_name: 'Synthetic', email: null }, contactPatch: null, dealWriteState: 'not_started', deal: { company_id: 'company-a', agent_id: 'actor-a', client_name: 'Synthetic' } }; saveDealAttempt(a); return a; };
beforeEach(() => { state.contacts.clear(); state.deals.clear(); state.inserts.length = 0; state.failDeal = ''; state.failContact = ''; state.onContact = null; state.onEmailRead = null; state.onDealRead = null; state.readError = ''; state.patchError = null; state.nullPatchReceipt = false; state.startStates.length = 0; sessionStorage.clear(); });
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


describe('discard only a proven unsubmitted selected-contact intent', () => {
  const selected = () => { const a = make(); a.contact = null; saveDealAttempt(a); return a; };
  it('diagnoses unavailable selected contact and permits discarding only the intent', async () => {
    const a = selected(); await expect(recoverDealCreation(a, () => true)).rejects.toThrow('Linked contact is unavailable');
    expect(canDiscardUnsubmittedDeal(readDealAttempt(a.actorId, a.companyId)!)).toBe(true);
    await discardUnsubmittedDeal(a, () => true);
    expect(readDealAttempt(a.actorId, a.companyId)).toBeNull(); expect(state.inserts).toEqual([]);
  });
  it.each(['42501', '23502', '23503', '23514'])('allows definitive SQL rejection %s before any deal insert', async code => {
    const a = selected(); a.contactPatch = { budget_min: 900 }; saveDealAttempt(a);
    state.contacts.set(a.contactId, { id: a.contactId, company_id: a.companyId, budget_min: 100 }); state.patchError = { code, message: 'Rejected statement' };
    await expect(recoverDealCreation(a, () => true)).rejects.toMatchObject({ code });
    expect(a.terminalReason).toBe('contact_patch_rejected'); await discardUnsubmittedDeal(a, () => true);
    expect(state.contacts.get(a.contactId)?.budget_min).toBe(100); expect(state.inserts).toEqual([]);
  });
  it.each(['network', 'unknown', 'null-receipt'])('refuses discard after ambiguous patch result %s', async kind => {
    const a = selected(); a.contactPatch = { budget_min: 900 }; saveDealAttempt(a);
    state.contacts.set(a.contactId, { id: a.contactId, company_id: a.companyId, budget_min: 100 });
    if (kind === 'null-receipt') state.nullPatchReceipt = true;
    else state.patchError = { ...(kind === 'unknown' ? { code: 'UNKNOWN' } : {}), message: 'Unconfirmed' };
    await expect(recoverDealCreation(a, () => true)).rejects.toBeTruthy();
    await expect(discardUnsubmittedDeal(a, () => true)).rejects.toThrow('requires reconciliation');
    expect(readDealAttempt(a.actorId, a.companyId)).not.toBeNull(); expect(state.inserts).toEqual([]);
  });
  it('keeps missing legacy progress unknown and never enables discard', async () => {
    const a = selected(); delete a.dealWriteState; saveDealAttempt(a);
    await expect(recoverDealCreation(a, () => true)).rejects.toThrow('Linked contact');
    expect(readDealAttempt(a.actorId, a.companyId)?.dealWriteState).toBeUndefined();
    await expect(discardUnsubmittedDeal(a, () => true)).rejects.toThrow('requires reconciliation');
  });
  it('persists started before insert and never discards an attempted deal after rejection', async () => {
    const a = make(); state.failDeal = 'before';
    await expect(recoverDealCreation(a, () => true)).rejects.toThrow('offline');
    expect(state.startStates).toEqual(['started']);
    await expect(discardUnsubmittedDeal(a, () => true)).rejects.toThrow('requires reconciliation');
  });
  it('fails before deal insert if the started marker cannot be saved', async () => {
    const a = make(); const persist = (v: DealCreationAttempt) => { if (v.dealWriteState === 'started') throw Error('Storage blocked'); saveDealAttempt(v); };
    await expect(recoverDealCreation(a, () => true, persist)).rejects.toThrow('Storage blocked');
    expect(state.inserts).toEqual(['crm_contacts']); expect(state.deals.size).toBe(0);
    await expect(discardUnsubmittedDeal(a, () => true)).rejects.toThrow('requires reconciliation');
  });
  it('refuses discard on read failure, actor switch, or a concurrently started retry', async () => {
    const a = selected(); await expect(recoverDealCreation(a, () => true)).rejects.toBeTruthy();
    state.readError = 'agent_deals'; await expect(discardUnsubmittedDeal(a, () => true)).rejects.toThrow('Could not confirm');
    state.readError = ''; await expect(discardUnsubmittedDeal(a, () => false)).rejects.toThrow('context changed');
    state.deals.set(a.dealId, { id: a.dealId, company_id: a.companyId });
    await expect(discardUnsubmittedDeal(a, () => true)).rejects.toThrow('Could not confirm');
    expect(readDealAttempt(a.actorId, a.companyId)).not.toBeNull();
  });
});

it('does not discard when a retry revokes the terminal diagnosis during the reconciliation read', async () => {
  const a = make(); a.contact = null; saveDealAttempt(a);
  await expect(recoverDealCreation(a, () => true)).rejects.toThrow('Linked contact');
  state.onDealRead = () => { const stored = readDealAttempt(a.actorId, a.companyId)!; delete stored.terminalReason; saveDealAttempt(stored); };
  await expect(discardUnsubmittedDeal(a, () => true)).rejects.toThrow('requires reconciliation');
  expect(readDealAttempt(a.actorId, a.companyId)).not.toBeNull(); expect(state.inserts).toEqual([]);
});
it('stops discard when the actor changes during the reconciliation read', async () => {
  const a = make(); a.contact = null; saveDealAttempt(a);
  await expect(recoverDealCreation(a, () => true)).rejects.toThrow('Linked contact');
  let current = true; state.onDealRead = () => { current = false; };
  await expect(discardUnsubmittedDeal(a, () => current)).rejects.toThrow('context changed');
  expect(readDealAttempt(a.actorId, a.companyId)).not.toBeNull();
});
it('never interprets an initial deal read failure as absence or permission to insert/discard', async () => {
  const a = make(); state.readError = 'agent_deals';
  await expect(recoverDealCreation(a, () => true)).rejects.toThrow('read denied');
  expect(state.inserts).toEqual([]); expect(canDiscardUnsubmittedDeal(readDealAttempt(a.actorId, a.companyId)!)).toBe(false);
});

it.each(['before', 'during'])('never downgrades another recovery started marker %s an awaited read', async when => {
  const a = make(); a.contact = null; saveDealAttempt(a);
  const markStarted = () => { const stored = readDealAttempt(a.actorId, a.companyId)!; stored.dealWriteState = 'started'; saveDealAttempt(stored); };
  if (when === 'before') markStarted(); else state.onDealRead = markStarted;
  await expect(recoverDealCreation(a, () => true)).rejects.toThrow('Linked contact');
  const saved = readDealAttempt(a.actorId, a.companyId)!;
  expect(saved.dealWriteState).toBe('started'); expect(saved.terminalReason).toBeUndefined();
  await expect(discardUnsubmittedDeal(a, () => true)).rejects.toThrow('requires reconciliation');
});

it('retains a canonical contact id already resolved by another mounted recovery', async () => {
  const a = make(); saveDealAttempt({ ...a, contactId: 'canonical-contact' });
  state.deals.set(a.dealId, { id: a.dealId, company_id: a.companyId, agent_id: a.actorId, contact_id: 'canonical-contact' });
  const result = await recoverDealCreation(a, () => true);
  expect(result.deal.contact_id).toBe('canonical-contact'); expect(readDealAttempt(a.actorId, a.companyId)?.contactId).toBe('canonical-contact');
  expect(state.inserts).toEqual([]);
});
