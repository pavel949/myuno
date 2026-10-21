import { describe, expect, it } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { filterCheckoutSnapshot, linkCheckoutSession, type LinkOrder, type LinkPorts, type LinkSession } from '../../../supabase/functions/_shared/checkout-session-link';
const order = (): LinkOrder => ({ id: 'order', customer_user_id: 'actor', total_amount: 1200, currency: 'THB', status: 'pending', metadata: { transfer_type: 'airport', route: { destination: 'A' } } });
const session = (id = 'new'): LinkSession => ({ id, status: 'open', payment_status: 'unpaid', amount_total: 120000, currency: 'thb', metadata: { order_id: 'order', user_id: 'actor', type: 'order_payment' }, url: 'https://checkout.stripe.com/test' });
function fixture() {
  let current = order();
  const calls = { create: 0, expire: [] as string[], cas: 0 };
  const ports: LinkPorts = {
    read: async () => structuredClone(current), retrieve: async id => session(id),
    create: async () => { calls.create++; return session(); },
    cas: async (snapshot, next) => { calls.cas++; if (JSON.stringify(snapshot) !== JSON.stringify(current)) return 'conflict'; current = { ...current, metadata: next }; return 'stored'; },
    expire: async id => { calls.expire.push(id); return { ...session(id), status: 'expired', url: null }; },
  };
  return { ports, calls, get current() { return current; }, set current(value: LinkOrder) { current = value; } };
}
describe('checkout session link lifecycle (no provider or database network)', () => {
  it('preserves nested transport metadata and stores only a verified session', async () => {
    const f = fixture(); expect((await linkCheckoutSession(order(), 'actor', f.ports)).ok).toBe(true);
    expect(f.current.metadata).toEqual({ ...order().metadata as object, stripe_session_id: 'new' });
  });
  it('retries against concurrently changed JSON metadata without losing fields', async () => {
    const f = fixture(); const cas = f.ports.cas; f.ports.cas = async (snapshot, next) => {
      if (!f.calls.cas) { f.current = { ...f.current, metadata: { ...f.current.metadata as object, note: 'concurrent' } }; f.calls.cas++; return 'conflict'; }
      return cas(snapshot, next);
    };
    expect((await linkCheckoutSession(order(), 'actor', f.ports)).ok).toBe(true);
    expect(f.current.metadata).toMatchObject({ transfer_type: 'airport', note: 'concurrent', stripe_session_id: 'new' });
  });
  it('does not overwrite a competing pointer; retires only its own open session', async () => {
    const f = fixture(); f.ports.cas = async () => { f.current.metadata = { stripe_session_id: 'winner' }; return 'conflict'; };
    expect(await linkCheckoutSession(order(), 'actor', f.ports)).toEqual({ ok: false, reason: 'session_conflict' });
    expect(f.current.metadata).toEqual({ stripe_session_id: 'winner' }); expect(f.calls.expire).toEqual(['new']);
  });
  it('recovers acknowledgement loss only after reading the committed owned pointer', async () => {
    const f = fixture(); const cas = f.ports.cas; f.ports.cas = async (snapshot, next) => { await cas(snapshot, next); return 'unknown'; };
    expect((await linkCheckoutSession(order(), 'actor', f.ports)).ok).toBe(true); expect(f.calls.expire).toEqual([]);
  });
  it('unknown DB outcome with old read returns no URL and never expires', async () => {
    const f = fixture(); f.ports.cas = async () => 'unknown';
    expect(await linkCheckoutSession(order(), 'actor', f.ports)).toEqual({ ok: false, reason: 'reconciliation_required' }); expect(f.calls.expire).toEqual([]);
  });
  it('unknown DB outcome plus competing pointer still does not expire', async () => {
    const f = fixture(); f.ports.cas = async () => { f.current.metadata = { stripe_session_id: 'other' }; throw Error('ack lost'); };
    expect((await linkCheckoutSession(order(), 'actor', f.ports)).ok).toBe(false); expect(f.calls.expire).toEqual([]);
  });
  it('verified existing open session is reused without creating a customer/session', async () => {
    const f = fixture(); f.current.metadata = { stripe_session_id: 'old' };
    expect(await linkCheckoutSession(f.current, 'actor', f.ports)).toMatchObject({ ok: true, session: { id: 'old' } }); expect(f.calls.create).toBe(0);
  });
  it('verified expired session may be replaced', async () => {
    const f = fixture(); f.current.metadata = { stripe_session_id: 'old' };
    f.ports.retrieve = async id => ({ ...session(id), status: id === 'old' ? 'expired' : 'open' });
    expect((await linkCheckoutSession(f.current, 'actor', f.ports)).ok).toBe(true); expect(f.current.metadata).toEqual({ stripe_session_id: 'new' });
  });
  it.each(['complete', null])('existing status %s cannot be replaced', async status => {
    const f = fixture(); f.current.metadata = { stripe_session_id: 'old' }; f.ports.retrieve = async id => ({ ...session(id), status });
    expect((await linkCheckoutSession(f.current, 'actor', f.ports)).ok).toBe(false); expect(f.calls.create).toBe(0);
  });
  it.each([{ amount_total: 1 }, { currency: 'usd' }, { metadata: { order_id: 'foreign', user_id: 'actor', type: 'order_payment' } }, { payment_status: 'paid' }])('existing mismatched session fails closed %j', async patch => {
    const f = fixture(); f.current.metadata = { stripe_session_id: 'old' }; f.ports.retrieve = async id => ({ ...session(id), ...patch });
    expect((await linkCheckoutSession(f.current, 'actor', f.ports)).ok).toBe(false); expect(f.calls.create).toBe(0);
  });
  it.each([{ customer_user_id: 'foreign' }, { customer_user_id: null }, { status: 'confirmed' }, { metadata: [] }, { metadata: 'unknown' }, { metadata: { stripe_session_id: null } }])('unknown/nonowned/nonpayable order never calls provider %j', async patch => {
    const f = fixture(); expect((await linkCheckoutSession({ ...order(), ...patch }, 'actor', f.ports)).ok).toBe(false); expect(f.calls.create).toBe(0);
  });
  it('null SQL metadata is supported without treating arbitrary JSON scalars as metadata', async () => {
    const f = fixture(); f.current.metadata = null;
    expect((await linkCheckoutSession(f.current, 'actor', f.ports)).ok).toBe(true); expect(f.current.metadata).toEqual({ stripe_session_id: 'new' });
  });
  it('retirement exception is reconciliation, never a usable URL', async () => {
    const f = fixture(); f.ports.cas = async () => { f.current.metadata = { stripe_session_id: 'other' }; return 'conflict'; }; f.ports.expire = async () => { throw Error('provider unavailable'); };
    expect(await linkCheckoutSession(order(), 'actor', f.ports)).toEqual({ ok: false, reason: 'reconciliation_required' });
  });
  it('completion during retirement is not cancelled', async () => {
    const f = fixture(); f.ports.cas = async () => { f.current.metadata = { stripe_session_id: 'other' }; return 'conflict'; }; f.ports.retrieve = async id => ({ ...session(id), status: 'complete' });
    expect((await linkCheckoutSession(order(), 'actor', f.ports)).ok).toBe(false); expect(f.calls.expire).toEqual([]);
  });
  it('read failure after uncertain write neither cancels nor returns URL', async () => {
    const f = fixture(); f.ports.cas = async () => 'unknown'; f.ports.read = async () => { throw Error('db unavailable'); };
    expect((await linkCheckoutSession(order(), 'actor', f.ports)).ok).toBe(false); expect(f.calls.expire).toEqual([]);
  });
  it.each([{ id: '' }, { metadata: { order_id: 'order', user_id: 'foreign', type: 'order_payment' } }, { amount_total: 1 }, { status: 'complete' }, { payment_status: 'paid' }, { url: null }])('new unverified provider session fails closed %j', async patch => {
    const f = fixture(); f.ports.create = async () => ({ ...session(), ...patch });
    expect(await linkCheckoutSession(order(), 'actor', f.ports)).toEqual({ ok: false, reason: 'reconciliation_required' }); expect(f.calls.cas).toBe(0); expect(f.calls.expire).toEqual([]);
  });
  it('existing open pointer changed before reread is not exposed', async () => {
    const f = fixture(); const initial = { ...order(), metadata: { stripe_session_id: 'old' } }; f.current.metadata = { stripe_session_id: 'winner' };
    expect((await linkCheckoutSession(initial, 'actor', f.ports)).ok).toBe(false); expect(f.calls.create).toBe(0); expect(f.calls.expire).toEqual([]);
  });
  it('unknown reread after known CAS failure cannot retire a session', async () => {
    const f = fixture(); f.ports.cas = async () => 'conflict'; f.ports.read = async () => null;
    expect((await linkCheckoutSession(order(), 'actor', f.ports)).ok).toBe(false); expect(f.calls.expire).toEqual([]);
  });
  it('actual SDK serializes exact JSONB snapshot, owner, quote, status and affected rows', async () => {
    let request: Request | undefined;
    const client = createClient('https://synthetic.invalid', 'synthetic', { auth: { persistSession: false, storageKey: 'checkout-cas-object' }, global: { fetch: async (url, init) => { request = new Request(url, init); return new Response('[{"id":"order"}]', { status: 200, headers: { 'Content-Type': 'application/json' } }); } } });
    const snapshot = order(); const result = await filterCheckoutSnapshot(client.from('orders').update({ metadata: { ...snapshot.metadata as object, stripe_session_id: 'new' } }), snapshot).select('id');
    const params = new URL(request!.url).searchParams;
    expect(params.get('metadata')).toBe(`eq.${JSON.stringify(snapshot.metadata)}`); expect(params.get('customer_user_id')).toBe('eq.actor');
    expect(params.get('total_amount')).toBe('eq.1200'); expect(params.get('currency')).toBe('eq.THB'); expect(params.get('status')).toBe('eq.pending'); expect(result.data).toEqual([{ id: 'order' }]);
    expect(await request!.json()).toEqual({ metadata: { ...snapshot.metadata as object, stripe_session_id: 'new' } });
  });
  it('actual SDK emits IS NULL for SQL-null metadata', async () => {
    let address = ''; const client = createClient('https://synthetic.invalid', 'synthetic', { auth: { persistSession: false, storageKey: 'checkout-cas-null' }, global: { fetch: async url => { address = String(url); return new Response('[]', { headers: { 'Content-Type': 'application/json' } }); } } });
    await filterCheckoutSnapshot(client.from('orders').update({ metadata: {} }), { ...order(), metadata: null }).select('id'); expect(new URL(address).searchParams.get('metadata')).toBe('is.null');
  });
});
