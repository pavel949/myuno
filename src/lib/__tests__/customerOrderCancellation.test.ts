import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readCustomerCancellation, cancelCustomerUnpaidOrder, retryCustomerCancellation } from '../customerOrderCancellation';
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
