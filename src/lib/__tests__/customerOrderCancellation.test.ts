import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readCustomerCancellation, cancelCustomerUnpaidOrder, retryCustomerCancellation, hasUnresolvedCancellation } from '../customerOrderCancellation';
const state = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn(() => { throw new Error('No direct writes permitted'); }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: state }));
const revision = '2026-10-20T00:00:00Z';
const options = { eligible: true as const, orderId: 'synthetic-order', expectedUpdatedAt: revision };
beforeEach(() => vi.clearAllMocks());
describe('customer cancellation server boundary', () => {
  it.each(['PGRST202', '42883'])('keeps unavailable command %s closed without table fallback', async code => {
    state.rpc.mockResolvedValue({ error: { code }, data: null });
    expect(await readCustomerCancellation('synthetic-order')).toEqual({ eligible: false, reason: 'unavailable' });
    expect(state.from).not.toHaveBeenCalled();
  });
  it('does not turn a denied read into eligibility', async () => {
    state.rpc.mockResolvedValue({ error: { code: '42501' }, data: null });
    await expect(readCustomerCancellation('synthetic-order')).rejects.toThrow('cancellation_check_failed');
  });
  it.each([null, [], { version: 2 }, { version: 1, order_id: 'foreign', eligible: true, expected_updated_at: revision }, { version: 1, order_id: 'synthetic-order', eligible: true, expected_updated_at: 'invalid' }])('rejects malformed or foreign eligibility %j', async data => {
    state.rpc.mockResolvedValue({ error: null, data });
    await expect(readCustomerCancellation('synthetic-order')).rejects.toThrow('invalid_cancellation_contract');
  });
  it('accepts only the server-issued order revision', async () => {
    state.rpc.mockResolvedValue({ error: null, data: { version: 1, order_id: options.orderId, eligible: true, expected_updated_at: revision } });
    expect(await readCustomerCancellation(options.orderId)).toEqual(options);
    expect(state.rpc).toHaveBeenCalledWith('get_customer_order_cancellation', { p_order_id: options.orderId });
  });
  it('preserves a server refusal for paid/started/ambiguous orders', async () => {
    state.rpc.mockResolvedValue({ error: null, data: { version: 1, order_id: options.orderId, eligible: false } });
    expect(await readCustomerCancellation(options.orderId)).toEqual({ eligible: false, reason: 'not_eligible' });
  });
  it('preserves an explicit unavailable governor response', async () => {
    state.rpc.mockResolvedValue({ error: null, data: { version: 1, order_id: options.orderId, eligible: false, reason: 'unavailable' } });
    expect(await readCustomerCancellation(options.orderId)).toEqual({ eligible: false, reason: 'unavailable' });
  });
  it('passes only order, revision and retry identity, never a client actor or status', async () => {
    state.rpc.mockResolvedValue({ error: null, data: { version: 1, order_id: options.orderId, status: 'cancelled', request_id: 'retry-one', history_id: 'history-one', already_cancelled: false } });
    expect(await cancelCustomerUnpaidOrder(options, 'retry-one')).toEqual({ orderId: options.orderId, requestId: 'retry-one', historyId: 'history-one', alreadyCancelled: false });
    expect(state.rpc).toHaveBeenCalledWith('cancel_customer_unpaid_order', { p_order_id: options.orderId, p_expected_updated_at: revision, p_request_id: 'retry-one' });
    expect(state.from).not.toHaveBeenCalled();
  });
  it.each([null, { version: 1, order_id: 'synthetic-order', status: 'pending' }, { version: 1, order_id: 'foreign', status: 'cancelled', request_id: 'retry-one', history_id: 'one', already_cancelled: false }, { version: 1, order_id: 'synthetic-order', status: 'cancelled', request_id: 'other', history_id: 'one', already_cancelled: false }, { version: 1, order_id: 'synthetic-order', status: 'cancelled', request_id: 'retry-one', history_id: '', already_cancelled: false }])('never reports success for incomplete/foreign command result %j', async data => {
    state.rpc.mockResolvedValue({ error: null, data });
    await expect(cancelCustomerUnpaidOrder(options, 'retry-one')).rejects.toThrow('cancellation_not_confirmed');
  });
  it('keeps transport errors uncertain, without secondary history writes', async () => {
    state.rpc.mockResolvedValue({ error: { code: '57014' }, data: null });
    await expect(cancelCustomerUnpaidOrder(options, 'retry-one')).rejects.toThrow('cancellation_not_confirmed');
    expect(state.from).not.toHaveBeenCalled();
  });
});

it('replays uncertain commands before new eligibility with the same request across callers', async () => {
 const orderId = 'uncertain-reopen-order';
 state.rpc.mockImplementation(async (name: string, args: Record<string, string>) => {
  if (name === 'get_customer_order_cancellation') return { error: null, data: { version: 1, order_id: orderId, eligible: true, expected_updated_at: revision } };
  if (state.rpc.mock.calls.filter(c => c[0] === 'cancel_customer_unpaid_order').length === 1) throw new Error('timeout');
  return { error: null, data: { version: 1, order_id: orderId, request_id: args.p_request_id, history_id: args.p_request_id, status: 'cancelled', already_cancelled: true } };
 });
 await expect(retryCustomerCancellation('actor-reopen', orderId)).rejects.toThrow('timeout');
 await expect(retryCustomerCancellation('actor-reopen', orderId)).resolves.toMatchObject({ alreadyCancelled: true });
 const calls = state.rpc.mock.calls.filter(c => c[0] === 'cancel_customer_unpaid_order');
 expect(calls[0][1]).toEqual(calls[1][1]); expect(state.rpc.mock.calls.filter(c => c[0] === 'get_customer_order_cancellation')).toHaveLength(1);
});

function deferred<T>() { let resolve!: (value: T) => void; let reject!: (error: Error) => void; const promise = new Promise<T>((yes, no) => { resolve=yes; reject=no; }); return { promise, resolve, reject }; }
it('single-flights truly concurrent callers across delayed eligibility and uncertain command retries', async () => {
 const orderId='concurrent-order', actor='concurrent-actor';
 const eligibility=deferred<{ data: unknown; error: null }>(); const uncertain=deferred<{ data: unknown; error: null }>();
 state.rpc.mockImplementation((name: string) => name==='get_customer_order_cancellation' ? eligibility.promise : uncertain.promise);
 const first=retryCustomerCancellation(actor,orderId); const second=retryCustomerCancellation(actor,orderId);
 expect(first).toBe(second); await Promise.resolve(); expect(state.rpc).toHaveBeenCalledTimes(1);
 eligibility.resolve({ error:null,data:{version:1,order_id:orderId,eligible:true,expected_updated_at:revision} });
 await vi.waitFor(()=>expect(state.rpc).toHaveBeenCalledTimes(2));
 const original=state.rpc.mock.calls[1][1]; const settled=Promise.allSettled([first,second]); uncertain.reject(new Error('uncertain'));
 expect((await settled).map(r=>r.status)).toEqual(['rejected','rejected']); expect(hasUnresolvedCancellation(actor,orderId)).toBe(true);
 const recovery=deferred<{ data: unknown; error: null }>(); state.rpc.mockImplementation(()=>recovery.promise);
 const retryOne=retryCustomerCancellation(actor,orderId); const retryTwo=retryCustomerCancellation(actor,orderId); expect(retryOne).toBe(retryTwo);
 await vi.waitFor(()=>expect(state.rpc).toHaveBeenCalledTimes(3)); expect(state.rpc.mock.calls[2][1]).toEqual(original);
 recovery.resolve({error:null,data:{version:1,order_id:orderId,request_id:original.p_request_id,history_id:original.p_request_id,status:'cancelled',already_cancelled:true}});
 expect(await Promise.all([retryOne,retryTwo])).toHaveLength(2); expect(hasUnresolvedCancellation(actor,orderId)).toBe(false);
});
it.each(['actor','order'])('does not let concurrent success for another %s erase an uncertain command', async scope => {
 const orderId=`isolated-${scope}-order`, otherOrder=scope==='order'?`${orderId}-other`:orderId, otherActor=scope==='actor'?'actor-two':'actor-one'; const one=deferred<{data:unknown;error:null}>(); const two=deferred<{data:unknown;error:null}>();
 state.rpc.mockImplementationOnce(()=>one.promise).mockImplementationOnce(()=>two.promise);
 const first=retryCustomerCancellation('actor-one',orderId,{...options,orderId}); const second=retryCustomerCancellation(otherActor,otherOrder,{...options,orderId:otherOrder});
 await vi.waitFor(()=>expect(state.rpc).toHaveBeenCalledTimes(2));
 const args=state.rpc.mock.calls[0][1]; expect(args.p_request_id).not.toBe(state.rpc.mock.calls[1][1].p_request_id);
 const settled=Promise.allSettled([first,second]);
 one.resolve({error:null,data:{version:1,order_id:orderId,request_id:args.p_request_id,history_id:args.p_request_id,status:'cancelled',already_cancelled:false}}); two.reject(new Error('uncertain actor two'));
 expect((await settled).map(r=>r.status)).toEqual(['fulfilled','rejected']);
 expect(hasUnresolvedCancellation('actor-one',orderId)).toBe(false); expect(hasUnresolvedCancellation(otherActor,otherOrder)).toBe(true);
});
