import { describe, expect, it, vi } from 'vitest';
import { propertyReservationReceipt, readPropertyReservationReceipt } from '../propertyReservationReceipt';

const row = () => ({ success: true, replayed: false,
  order: { id: 'order-a', status: 'pending', start_at: '2026-11-01T14:00:00+07:00', end_at: '2026-11-04T12:00:00+07:00', updated_at: '2026-10-25T04:00:00.123456Z' },
  order_items: [{ item_type: 'property', resource_id: 'physical-a' }],
  order_participants: [{ role: 'guest', name: 'Synthetic guest', phone: null, email: null }],
});
describe('canonical property receipt reader', () => {
  it('reads the PR160 checked contract by exact order id without raw bookings fallback', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: row(), error: null });
    expect(await readPropertyReservationReceipt({ rpc }, 'order-a')).toEqual(row());
    expect(rpc).toHaveBeenCalledExactlyOnceWith('read_property_reservation_checked', { p_order_id: 'order-a' });
  });
  it('fails closed on missing RPC or unauthorized actor', async () => {
    for (const message of ['function not found', 'reservation_contract_unavailable']) {
      const rpc = vi.fn().mockResolvedValue({ data: null, error: new Error(message) });
      await expect(readPropertyReservationReceipt({ rpc }, 'order-a')).rejects.toThrow(message);
      expect(rpc).toHaveBeenCalledTimes(1);
    }
  });
  it('rejects a different guest/order receipt', () => {
    expect(() => propertyReservationReceipt(row(), 'order-b')).toThrow('could not be verified');
  });
  it.each([
    () => ({ ...row(), order_items: [{ item_type: 'property_rental', resource_id: 'physical-a' }] }),
    () => ({ ...row(), order_items: [] }),
    () => ({ ...row(), order_participants: [] }),
    () => ({ ...row(), order_participants: [{ role: 'primary', name: 'Wrong canonical role' }] }),
    () => ({ ...row(), order: { ...row().order, status: 'paid' } }),
    () => ({ ...row(), order: { ...row().order, end_at: row().order.start_at } }),
  ])('rejects incomplete or incompatible acknowledgments', malformed => {
    expect(() => propertyReservationReceipt(malformed(), 'order-a')).toThrow('could not be verified');
  });
});
