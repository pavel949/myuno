import { describe, expect, it, vi } from 'vitest';
import { loadICalInventoryBlocks } from '@/lib/icalInventoryBlocks';

const block = (extra: Record<string, unknown> = {}) => ({
  id: 'block-a', property_id: 'home-a', source: 'ical', status: 'blocked', source_calendar_id: 'calendar-a', external_id: 'event-a',
  check_in: '2026-11-01', check_out: '2026-11-04', order_id: null, marketplace_booking_id: null, total_amount: null, ...extra,
});
function client(rows: unknown[] | null = [], error: unknown = null, count: number | null = rows?.length ?? 0) {
  const trace: { op: string; args: unknown[] }[] = [];
  const q = Object.fromEntries(['select', 'eq', 'in', 'is', 'order', 'lt', 'gt'].map(op => [op, (...args: unknown[]) => { trace.push({ op, args }); return q; }]));
  q.then = (resolve: (result: unknown) => void) => Promise.resolve(resolve({ data: rows, error, count }));
  const from = vi.fn(() => q);
  return { sb: { from } as never, trace, from };
}

describe('read-only canonical iCal block projection', () => {
  it('scopes both request and projection to exact authorized properties', async () => {
    const { sb, trace } = client([block(), block({ id: 'foreign', property_id: 'home-b' })]);
    const result = await loadICalInventoryBlocks(sb, ['home-a']);
    expect(result.map(row => row.id)).toEqual(['block-a']);
    expect(trace).toContainEqual({ op: 'in', args: ['property_id', ['home-a']] });
    expect(trace).toContainEqual({ op: 'eq', args: ['source', 'ical'] });
    expect(trace).toContainEqual({ op: 'eq', args: ['status', 'blocked'] });
    expect(result[0]).not.toHaveProperty('guest_name');
    expect(result[0]).not.toHaveProperty('total_amount');
  });
  it('empty scope never becomes all', async () => {
    const { sb, from } = client([block()]);
    expect(await loadICalInventoryBlocks(sb, [])).toEqual([]); expect(from).not.toHaveBeenCalled();
  });
  it('deduplicates row and calendar-event identity without conflating properties', async () => {
    const { sb } = client([block(), block(), block({ id: 'same-uid-row' }), block({ id: 'other-property', property_id: 'home-b' })]);
    expect((await loadICalInventoryBlocks(sb, ['home-a', 'home-b'])).map(row => row.id)).toEqual(['block-a', 'other-property']);
  });
  it('keeps commercial and unknown guest bookings out of the block overlay', async () => {
    const { sb } = client([block(), block({ id: 'linked', order_id: 'order-a' }), block({ id: 'stay', status: 'confirmed' }), block({ id: 'manual', source: 'manual' })]);
    expect((await loadICalInventoryBlocks(sb, ['home-a'])).map(row => row.id)).toEqual(['block-a']);
  });
  it('range uses half-open civil dates and excludes turnover departures', async () => {
    const { sb, trace } = client([block(), block({ id: 'departed', external_id: 'past', check_in: '2026-10-30', check_out: '2026-11-01' }), block({ id: 'future', external_id: 'future', check_in: '2026-11-04', check_out: '2026-11-05' })]);
    expect((await loadICalInventoryBlocks(sb, ['home-a'], { from: '2026-11-01', to: '2026-11-04' })).map(row => row.id)).toEqual(['block-a']);
    expect(trace).toContainEqual({ op: 'lt', args: ['check_in', '2026-11-04'] });
    expect(trace).toContainEqual({ op: 'gt', args: ['check_out', '2026-11-01'] });
  });
  it('failed data is an error, never proof of available dates', async () => {
    const { sb } = client([], Error('Synthetic read error'));
    await expect(loadICalInventoryBlocks(sb, ['home-a'])).rejects.toThrow('Synthetic read error');
  });
  it('ambiguous money or missing provenance requires reconciliation', async () => {
    for (const extra of [{ total_amount: 693000 }, { source_calendar_id: null }, { external_id: null }]) {
      const { sb } = client([block(extra)]);
      await expect(loadICalInventoryBlocks(sb, ['home-a'])).rejects.toThrow(/reconciliation/i);
    }
  });
});


it('truncated or unknown inventory results cannot imply available dates', async () => {
  for (const [rows, count] of [[[], 1], [[block()], 2], [null, 0], [[block()], null]] as [unknown[] | null, number | null][]) {
    const { sb } = client(rows, null, count);
    await expect(loadICalInventoryBlocks(sb, ['home-a'])).rejects.toThrow(/incomplete/i);
  }
});
