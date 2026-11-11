import { describe, it, expect, vi } from 'vitest';
import { ManualBookingRequestIdentity, createManualBooking } from './manualPropertyBooking';
const input = { property_id: 'home', check_in: '2026-11-10', check_out: '2026-11-13', total_amount: 0 };
const reply = { success: true, replayed: false, order: { id: 'request', status: 'confirmed', start_at: '2026-11-10T07:00:00Z', end_at: '2026-11-13T05:00:00Z' }, order_items: [{ item_type: 'property', resource_id: 'home' }], order_participants: [{ role: 'guest', name: 'Guest', phone: null, email: null }] };
describe('manual PMS command client contract', () => {
  it('retains the request identity across a failed transport, including reordered input keys', async () => {
    const identity = new ManualBookingRequestIdentity();
    const id = identity.forIntent('actor', input);
    await expect(createManualBooking({ rpc: vi.fn().mockRejectedValue(Error('connection interrupted')) }, id, input)).rejects.toThrow('connection interrupted');
    expect(identity.forIntent('actor', { total_amount: 0, check_out: input.check_out, check_in: input.check_in, property_id: 'home' })).toBe(id);
  });
  it('changes the request identity when the actor, property or payload changes', () => {
    const identity = new ManualBookingRequestIdentity();
    const first = identity.forIntent('actor', input);
    const second = identity.forIntent('other', input);
    const third = identity.forIntent('other', { ...input, property_id: 'elsewhere' });
    expect(new Set([first, second, third, identity.forIntent('other', { ...input, notes: 'changed' })]).size).toBe(4);
  });
  it('resets only an acknowledged intent, preserving a newer draft', () => {
    const identity = new ManualBookingRequestIdentity();
    const old = identity.forIntent('actor', input);
    const next = identity.forIntent('actor', { ...input, notes: 'next' });
    identity.acknowledge(old);
    expect(identity.forIntent('actor', { ...input, notes: 'next' })).toBe(next);
    identity.acknowledge(next);
    expect(identity.forIntent('actor', { ...input, notes: 'next' })).not.toBe(next);
  });
  it('uses one RPC and returns the actual server status and replay flag', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: { ...reply, replayed: true, order: { ...reply.order, status: 'pending' } }, error: null });
    expect(await createManualBooking({ rpc }, 'request', input)).toMatchObject({ replayed: true, order: { status: 'pending' } });
    expect(rpc).toHaveBeenCalledExactlyOnceWith('create_manual_property_booking', { p_request_id: 'request', p_property_id: 'home', p_input: { check_in: input.check_in, check_out: input.check_out, total_amount: 0 } });
  });
  it('surfaces a missing or denied RPC without calling a table writer', async () => {
    const from = vi.fn();
    await expect(createManualBooking({ rpc: vi.fn().mockResolvedValue({ data: null, error: Error('function unavailable') }), from }, 'request', input)).rejects.toThrow('function unavailable');
    expect(from).not.toHaveBeenCalled();
  });
  it.each([null, { success: true }, { ...reply, order: { ...reply.order, id: 'other' } }, { ...reply, order_items: [] }, { ...reply, order_participants: [] }, { ...reply, order: { ...reply.order, status: 'paid' } }])('rejects incomplete or misleading acknowledgements: %j', async data => {
    await expect(createManualBooking({ rpc: vi.fn().mockResolvedValue({ data, error: null }) }, 'request', input)).rejects.toThrow('acknowledgement is incomplete');
  });
});
