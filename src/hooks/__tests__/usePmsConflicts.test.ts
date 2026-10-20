import { describe, expect, it, vi } from 'vitest';
import { loadFamilyHolds } from '../usePmsConflicts';
import { assertNoConflicts } from '@/lib/pms/bookingConflicts';

const data = vi.hoisted(() => ({
  properties: [
    { id: 'villa', parent_property_id: null, project_id: 'p', owner_id: null, unit_number: '1', title: 'V', title_en: 'V', title_ru: null, is_bookable_key: true, is_active: true, price_per_night: 1, currency: 'THB' },
    { id: 'room', parent_property_id: 'villa', project_id: 'p', owner_id: null, unit_number: '1A', title: 'R', title_en: 'R', title_ru: null, is_bookable_key: true, is_active: true, price_per_night: 1, currency: 'THB' },
  ],
  // Mirror trigger shape: external_id = order id, order_id may be null.
  bookings: [{ id: 'pb1', order_id: null, external_id: 'order-1', property_id: 'room', check_in: '2030-01-10', check_out: '2030-01-12', status: 'confirmed', source: null, guest_name: 'G' }],
}));

vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  from: (table: string) => {
    const rows = table === 'properties' ? data.properties : table === 'property_bookings' ? data.bookings : [];
    const chain: Record<string, unknown> = {};
    for (const m of ['select', 'eq', 'in', 'lt', 'gt', 'gte', 'not', 'or']) chain[m] = () => chain;
    chain.maybeSingle = async () => ({ data: rows[0] ?? null, error: null });
    chain.then = (res: (v: unknown) => unknown) => Promise.resolve({ data: rows, error: null }).then(res);
    return chain;
  },
} }));

describe('loadFamilyHolds', () => {
  it('reports a conflict with an existing booking when not editing it', async () => {
    const holds = await loadFamilyHolds('villa', '2030-01-10', '2030-01-12');
    expect(() => assertNoConflicts({ ...holds!, stay: { checkIn: '2030-01-10', checkOut: '2030-01-12' } })).toThrow();
  });

  it('ignores the booking being edited when matched by mirrored external_id', async () => {
    const holds = await loadFamilyHolds('villa', '2030-01-10', '2030-01-12', 'order-1');
    expect(holds!.bookings).toHaveLength(0);
    expect(() => assertNoConflicts({ ...holds!, stay: { checkIn: '2030-01-10', checkOut: '2030-01-12' } })).not.toThrow();
  });
});
