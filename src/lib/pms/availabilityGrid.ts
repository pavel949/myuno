import { propertyBookingHoldsInventory } from '@/lib/propertyInventory';
import { addCivilDays } from './civilDate';
import type { BlockedDate, HeldBooking } from './bookingConflicts';
import type { ComplexHierarchy, KeyProperty } from './complexHierarchy';
import { worstIcalStatus, type CalendarHealth, type IcalStatus } from './icalHealth';

export type CellState = 'free' | 'booked' | 'blocked' | 'arrival' | 'departure' | 'turnover' | 'family_held';
export interface GridCell {
  date: string;
  state: CellState;
  bookingId: string | null;
  rate: number | null;
  source: string | null;
  guestName: string | null;
  conflict: boolean;
}
export interface SeasonRate { start_date: string; end_date: string; nightly_rate: number; is_active: boolean | null }
export interface RateInputs {
  pricePerNight: number | null;
  seasons: readonly SeasonRate[];
  overrides: ReadonlyMap<string, number>;
}
export interface GridRow { key: KeyProperty; villaId: string; isWholeVilla: boolean; cells: GridCell[]; ical: IcalStatus }
export interface DayTotals { date: string; freeKeys: number; occupiedKeys: number; arrivals: number; departures: number }

export function effectiveNightlyRate(date: string, r: RateInputs): number | null {
  const override = r.overrides.get(date);
  if (override !== undefined) return override;
  const covering = r.seasons
    .filter(s => s.is_active !== false && s.start_date <= date && date <= s.end_date)
    .sort((a, b) => (a.start_date < b.start_date ? 1 : a.start_date > b.start_date ? -1 : 0));
  return covering.length > 0 ? covering[0].nightly_rate : r.pricePerNight;
}

export interface GridInput {
  hierarchy: ComplexHierarchy;
  from: string;
  days: number;
  bookings: readonly HeldBooking[];
  blocks: readonly BlockedDate[];
  rates: ReadonlyMap<string, RateInputs>;
  unresolvedConflicts: readonly { propertyId: string; start: string; end: string }[];
  calendars: readonly CalendarHealth[];
  now: Date;
}

const OCCUPIED: ReadonlySet<CellState> = new Set(['booked', 'arrival', 'turnover', 'blocked', 'family_held']);

const covers = (b: HeldBooking, d: string) => b.checkIn <= d && d < b.checkOut;

function resolveCell(
  d: string,
  own: readonly HeldBooking[],
  familyHolds: readonly HeldBooking[],
  blocked: boolean,
): Pick<GridCell, 'state' | 'bookingId' | 'source' | 'guestName'> {
  const arriving = own.find(b => b.checkIn === d);
  const departing = own.find(b => b.checkOut === d);
  const staying = own.find(b => covers(b, d));
  const family = familyHolds.find(b => covers(b, d));
  const pick = (state: CellState, b: HeldBooking | undefined) => ({
    state, bookingId: b?.id ?? null, source: b?.source ?? null, guestName: b?.guestName ?? null,
  });
  if (arriving && departing) return pick('turnover', arriving);
  if (arriving) return pick('arrival', arriving);
  if (staying) return pick('booked', staying);
  if (blocked) return pick('blocked', undefined);
  if (family) return pick('family_held', family);
  if (departing) return pick('departure', departing);
  return pick('free', undefined);
}

function familyOf(key: KeyProperty, hierarchy: ComplexHierarchy): Set<string> {
  const ids = new Set<string>();
  const node = hierarchy.villas.find(v => v.villa.id === (key.parentId ?? key.id));
  if (!node) return ids;
  if (key.parentId) ids.add(node.villa.id);
  else node.keys.filter(k => k.id !== key.id).forEach(k => ids.add(k.id));
  return ids;
}

function hasConflict(a: GridInput, propertyId: string, d: string): boolean {
  return a.unresolvedConflicts.some(c => c.propertyId === propertyId && d >= c.start && (d < c.end || d === c.start));
}

function buildRow(a: GridInput, key: KeyProperty, villaId: string, dates: string[]): GridRow {
  const held = a.bookings.filter(b => propertyBookingHoldsInventory(b.status));
  const own = held.filter(b => b.propertyId === key.id);
  const family = familyOf(key, a.hierarchy);
  const familyHolds = held.filter(b => family.has(b.propertyId));
  const blockDates = new Set(a.blocks.filter(b => b.propertyId === key.id).map(b => b.date));
  const rate = a.rates.get(key.id);
  const cells = dates.map((date): GridCell => ({
    date,
    ...resolveCell(date, own, familyHolds, blockDates.has(date)),
    rate: rate ? effectiveNightlyRate(date, rate) : null,
    conflict: hasConflict(a, key.id, date),
  }));
  const ical = worstIcalStatus(a.calendars.filter(c => c.propertyId === key.id), a.now);
  return { key, villaId, isWholeVilla: key.id === villaId, cells, ical };
}

function buildTotals(rows: readonly GridRow[], dates: string[]): DayTotals[] {
  return dates.map((date, i) => {
    const states = rows.map(r => r.cells[i].state);
    const occupiedKeys = states.filter(s => OCCUPIED.has(s)).length;
    return {
      date,
      occupiedKeys,
      freeKeys: rows.length - occupiedKeys,
      arrivals: states.filter(s => s === 'arrival' || s === 'turnover').length,
      departures: states.filter(s => s === 'departure' || s === 'turnover').length,
    };
  });
}

export function buildAvailabilityGrid(a: GridInput): { rows: GridRow[]; totals: DayTotals[] } {
  const dates = Array.from({ length: Math.max(0, a.days) }, (_, i) => addCivilDays(a.from, i));
  const rows = a.hierarchy.villas.flatMap(node => node.keys.map(k => buildRow(a, k, node.villa.id, dates)));
  return { rows, totals: buildTotals(rows, dates) };
}
