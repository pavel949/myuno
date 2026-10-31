import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { propertyBookingHoldsInventory, propertyOrderHoldsInventory } from '@/lib/propertyInventory';
import { verifyInventoryHold } from '../../../supabase/functions/_shared/inventory-hold';

describe('inventory status contract', () => {
  it.each(['cancelled', 'rejected', 'expired'])('%s releases booking inventory', status => {
    expect(propertyBookingHoldsInventory(status)).toBe(false);
  });
  it.each(['pending', 'confirmed', 'checked_in', 'checked_out', 'completed', 'no_show'])('%s retains booking inventory dates', status => {
    expect(propertyBookingHoldsInventory(status)).toBe(true);
  });
  it('null mirrors exclusion constraint SQL semantics', () => {
    expect(propertyBookingHoldsInventory(null)).toBe(false);
  });
  it('unknown non-null status fails conservatively', () => {
    expect(propertyBookingHoldsInventory('unexpected_status')).toBe(true);
  });
  it('refund is a money status, not a booking status', () => {
    expect(propertyOrderHoldsInventory('refunded')).toBe(false);
    expect(propertyBookingHoldsInventory('refunded')).toBe(true);
  });
  it('client and edge inventory predicates are byte-identical', () => {
    expect(readFileSync('src/lib/propertyInventory.ts')).toEqual(readFileSync('supabase/functions/_shared/property-inventory.ts'));
  });
});

describe('pre-payment compensation gate', () => {
  it('a held order reaches payment without cancellation', async () => {
    const cancel = vi.fn();
    expect(await verifyInventoryHold(async () => true, cancel)).toBe('held');
    expect(cancel).not.toHaveBeenCalled();
  });
  it('race loser must be cancelled before returning conflict', async () => {
    const cancel = vi.fn(async () => true);
    expect(await verifyInventoryHold(async () => false, cancel)).toBe('conflict');
    expect(cancel).toHaveBeenCalledOnce();
  });
  it('failed cancellation cannot be reported as successful compensation', async () => {
    expect(await verifyInventoryHold(async () => false, async () => false)).toBe('compensation_failed');
  });
});
it('keeps linked request receipts nonblocking until checked confirmation, preserving legacy pending holds', () => {
  const request = { request_contract: 'rental-request-v1' };
  expect(propertyOrderHoldsInventory('pending', request)).toBe(false);
  expect(propertyOrderHoldsInventory('draft', request)).toBe(false);
  expect(propertyOrderHoldsInventory('confirmed', request)).toBe(true);
  expect(propertyOrderHoldsInventory('cancelled', request)).toBe(false);
  expect(propertyOrderHoldsInventory('pending')).toBe(true);
  expect(propertyBookingHoldsInventory('pending')).toBe(true);
});
