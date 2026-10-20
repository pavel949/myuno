import { describe, expect, it } from 'vitest';
import { buildComplexHierarchy, type KeyProperty } from '../complexHierarchy';
import type { BlockedDate, HeldBooking } from '../bookingConflicts';
import type { CalendarHealth } from '../icalHealth';
import {
  buildAvailabilityGrid,
  effectiveNightlyRate,
  type RateInputs,
  type SeasonRate,
} from '../availabilityGrid';

function key(id: string, parentId: string | null = null, over: Partial<KeyProperty> = {}): KeyProperty {
  return {
    id, parentId, projectId: 'p', ownerId: null, unitNumber: id, title: id, titleRu: null,
    isBookable: true, isActive: true, pricePerNight: 1000, currency: 'THB', ...over,
  };
}
const d = (day: number) => `2026-11-${String(day).padStart(2, '0')}`;
const now = new Date('2026-11-01T00:00:00Z');
const noRates = new Map<string, RateInputs>();

function booking(id: string, propertyId: string, inDay: number, outDay: number, status: string | null = 'confirmed'): HeldBooking {
  return { id, propertyId, checkIn: d(inDay), checkOut: d(outDay), status, source: 'direct', guestName: 'G' };
}

interface GridOpts {
  rows?: KeyProperty[];
  bookings?: HeldBooking[];
  blocks?: BlockedDate[];
  from?: string;
  days?: number;
  rates?: Map<string, RateInputs>;
  unresolvedConflicts?: { propertyId: string; start: string; end: string }[];
  calendars?: CalendarHealth[];
}
// Family F: bookable villa V + rooms RA, RB. Independent whole villa W.
const family = () => [key('V'), key('RA', 'V'), key('RB', 'V'), key('W')];
function grid(o: GridOpts = {}) {
  return buildAvailabilityGrid({
    hierarchy: buildComplexHierarchy(o.rows ?? family()),
    from: o.from ?? d(1), days: o.days ?? 14,
    bookings: o.bookings ?? [], blocks: o.blocks ?? [], rates: o.rates ?? noRates,
    unresolvedConflicts: o.unresolvedConflicts ?? [], calendars: o.calendars ?? [], now,
  });
}
const cell = (g: ReturnType<typeof grid>, keyId: string, day: number) =>
  g.rows.find((r) => r.key.id === keyId)!.cells.find((c) => c.date === d(day))!;

describe('effectiveNightlyRate', () => {
  const season = (start: string, end: string, rate: number, active: boolean | null = true): SeasonRate =>
    ({ start_date: start, end_date: end, nightly_rate: rate, is_active: active });
  const inputs = (over: Partial<RateInputs> = {}): RateInputs =>
    ({ pricePerNight: 1000, seasons: [], overrides: new Map(), ...over });

  it('should fall back to pricePerNight when nothing else applies', () => {
    expect(effectiveNightlyRate(d(5), inputs())).toBe(1000);
  });

  it('should use the season over the base price', () => {
    expect(effectiveNightlyRate(d(5), inputs({ seasons: [season(d(1), d(10), 2000)] }))).toBe(2000);
  });

  it('should use the override over the season', () => {
    const r = inputs({ seasons: [season(d(1), d(10), 2000)], overrides: new Map([[d(5), 3000]]) });
    expect(effectiveNightlyRate(d(5), r)).toBe(3000);
  });

  it('should treat season end_date as inclusive', () => {
    expect(effectiveNightlyRate(d(10), inputs({ seasons: [season(d(1), d(10), 2000)] }))).toBe(2000);
  });

  it('should not apply a season the day after it ends', () => {
    expect(effectiveNightlyRate(d(11), inputs({ seasons: [season(d(1), d(10), 2000)] }))).toBe(1000);
  });

  it('should pick the latest-starting season when seasons overlap', () => {
    const r = inputs({ seasons: [season(d(1), d(20), 2000), season(d(5), d(8), 2500)] });
    expect(effectiveNightlyRate(d(6), r)).toBe(2500);
  });

  it('should pick the latest-starting season regardless of array order', () => {
    const r = inputs({ seasons: [season(d(5), d(8), 2500), season(d(1), d(20), 2000)] });
    expect(effectiveNightlyRate(d(6), r)).toBe(2500);
  });

  it('should ignore inactive seasons', () => {
    expect(effectiveNightlyRate(d(5), inputs({ seasons: [season(d(1), d(10), 2000, false)] }))).toBe(1000);
  });

  it('should return null when there is no override, season or base price', () => {
    expect(effectiveNightlyRate(d(5), inputs({ pricePerNight: null }))).toBeNull();
  });
});

describe('buildAvailabilityGrid structure', () => {
  it('should emit one row per sellable key', () => {
    expect(grid().rows.map((r) => r.key.id).sort()).toEqual(['RA', 'RB', 'V', 'W']);
  });

  it('should emit one cell per day', () => {
    expect(grid({ days: 7 }).rows[0].cells).toHaveLength(7);
  });

  it('should emit one totals entry per day', () => {
    expect(grid({ days: 7 }).totals).toHaveLength(7);
  });

  it('should skip non-bookable villa rows', () => {
    const g = grid({ rows: [key('V', null, { isBookable: false }), key('RA', 'V')] });
    expect(g.rows.map((r) => r.key.id)).toEqual(['RA']);
  });

  it('should attach the effective rate to each cell', () => {
    const rates = new Map([['W', { pricePerNight: 1000, seasons: [], overrides: new Map([[d(3), 4200]]) }]]);
    expect(cell(grid({ rates }), 'W', 3).rate).toBe(4200);
  });
});

describe('buildAvailabilityGrid cell states', () => {
  it('should be free with no bookings', () => {
    expect(cell(grid(), 'W', 3).state).toBe('free');
  });

  it('should be arrival on check-in, booked in between, departure on check-out', () => {
    const g = grid({ bookings: [booking('b1', 'W', 3, 6)] });
    expect([cell(g, 'W', 3).state, cell(g, 'W', 4).state, cell(g, 'W', 6).state]).toEqual(['arrival', 'booked', 'departure']);
  });

  it('should be free the day after check-out', () => {
    expect(cell(grid({ bookings: [booking('b1', 'W', 3, 6)] }), 'W', 7).state).toBe('free');
  });

  it('should carry booking id, source and guest on a booked cell', () => {
    const c = cell(grid({ bookings: [booking('b1', 'W', 3, 6)] }), 'W', 4);
    expect([c.bookingId, c.source, c.guestName]).toEqual(['b1', 'direct', 'G']);
  });

  it('should be turnover when one stay ends the day another starts', () => {
    const g = grid({ bookings: [booking('b1', 'W', 3, 6), booking('b2', 'W', 6, 9)] });
    expect(cell(g, 'W', 6).state).toBe('turnover');
  });

  it('should be blocked on a manual block', () => {
    expect(cell(grid({ blocks: [{ propertyId: 'W', date: d(4) }] }), 'W', 4).state).toBe('blocked');
  });

  it('should ignore cancelled bookings', () => {
    expect(cell(grid({ bookings: [booking('b1', 'W', 3, 6, 'cancelled')] }), 'W', 4).state).toBe('free');
  });

  it('should mark rooms family_held when the villa is booked', () => {
    const g = grid({ bookings: [booking('b1', 'V', 5, 9)] });
    expect([cell(g, 'RA', 6).state, cell(g, 'RB', 7).state]).toEqual(['family_held', 'family_held']);
  });

  it('should mark the villa family_held when a room is booked', () => {
    const g = grid({ bookings: [booking('b1', 'RA', 5, 9)] });
    expect(cell(g, 'V', 6).state).toBe('family_held');
  });

  it('should NOT mark a sibling room family_held', () => {
    const g = grid({ bookings: [booking('b1', 'RA', 5, 9)] });
    expect(cell(g, 'RB', 6).state).toBe('free');
  });

  it('should not mark an unrelated villa family_held', () => {
    const g = grid({ bookings: [booking('b1', 'V', 5, 9)] });
    expect(cell(g, 'W', 6).state).toBe('free');
  });

  it('should not hold family past the booking check-out', () => {
    const g = grid({ bookings: [booking('b1', 'V', 5, 9)] });
    expect(cell(g, 'RA', 9).state).not.toBe('family_held');
  });

  it('should clip a booking that started before the window', () => {
    const g = grid({ from: d(5), days: 7, bookings: [booking('b1', 'W', 1, 8)] });
    const states = g.rows.find((r) => r.key.id === 'W')!.cells.map((c) => c.state);
    expect(states).toEqual(['booked', 'booked', 'booked', 'departure', 'free', 'free', 'free']);
  });

  it('should clip a booking that ends after the window', () => {
    const g = grid({ from: d(1), days: 3, bookings: [booking('b1', 'W', 2, 20)] });
    expect(g.rows.find((r) => r.key.id === 'W')!.cells.map((c) => c.state)).toEqual(['free', 'arrival', 'booked']);
  });

  it('should set conflict=true on cells covered by an unresolved conflict', () => {
    const g = grid({ unresolvedConflicts: [{ propertyId: 'W', start: d(6), end: d(8) }] });
    expect(cell(g, 'W', 6).conflict).toBe(true);
  });

  it('should leave conflict=false outside unresolved conflicts', () => {
    const g = grid({ unresolvedConflicts: [{ propertyId: 'W', start: d(6), end: d(8) }] });
    expect([cell(g, 'W', 12).conflict, cell(g, 'V', 6).conflict]).toEqual([false, false]);
  });
});

describe('buildAvailabilityGrid totals', () => {
  it('should satisfy freeKeys + occupiedKeys == row count on every day', () => {
    const g = grid({ bookings: [booking('b1', 'V', 3, 7), booking('b2', 'W', 5, 9)], blocks: [{ propertyId: 'RA', date: d(10) }] });
    expect(g.totals.every((t) => t.freeKeys + t.occupiedKeys === g.rows.length)).toBe(true);
  });

  it('should count family_held keys as occupied', () => {
    const g = grid({ bookings: [booking('b1', 'V', 5, 9)] });
    expect(g.totals.find((t) => t.date === d(6))!.occupiedKeys).toBe(3);
  });

  it('should count blocked keys as occupied', () => {
    const g = grid({ blocks: [{ propertyId: 'W', date: d(4) }] });
    expect(g.totals.find((t) => t.date === d(4))!.occupiedKeys).toBe(1);
  });

  it('should count arrivals and departures on their days', () => {
    const g = grid({ bookings: [booking('b1', 'W', 3, 6)] });
    const t = (day: number) => g.totals.find((x) => x.date === d(day))!;
    expect([t(3).arrivals, t(6).departures]).toEqual([1, 1]);
  });

  it('should not count a departure day as occupied', () => {
    const g = grid({ bookings: [booking('b1', 'W', 3, 6)] });
    expect(g.totals.find((x) => x.date === d(6))!.occupiedKeys).toBe(0);
  });
});

describe('buildAvailabilityGrid iCal status', () => {
  const cal = (propertyId: string, over: Partial<CalendarHealth> = {}): CalendarHealth =>
    ({ propertyId, lastSyncedAt: now.toISOString(), syncError: null, syncIntervalMinutes: 60, isActive: true, ...over });

  it('should be none for a key without calendars', () => {
    expect(grid().rows.find((r) => r.key.id === 'W')!.ical).toBe('none');
  });

  it('should reflect an erroring calendar on its key row', () => {
    const g = grid({ calendars: [cal('W', { syncError: 'x' })] });
    expect(g.rows.find((r) => r.key.id === 'W')!.ical).toBe('error');
  });

  it('should mark villaId on child rows with the villa id', () => {
    expect(grid().rows.find((r) => r.key.id === 'RA')!.villaId).toBe('V');
  });
});
