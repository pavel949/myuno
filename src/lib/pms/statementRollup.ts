// Pure villa-level owner statement rollup. NO imports: this file is mirrored
// byte-for-byte to supabase/functions/_shared/pms-statement-rollup.ts.
// All money is computed in integer satang and returned as baht (2 decimals).

export interface StatementKey { id: string; parentId: string | null; isBookable?: boolean }
export interface StatementBooking {
  propertyId: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number | null;
  status: string | null;
}
export interface StatementFinancial { propertyId: string; type: string; amount: number; referenceType: string | null }
export interface KeyLine { propertyId: string; revenue: number; nights: number }
export interface VillaStatement {
  villaId: string;
  keyIds: string[];
  roomRevenue: number;
  otherIncome: number;
  expenses: number;
  managementFee: number | null;
  netToOwner: number;
  occupiedNights: number;
  availableNights: number;
  perKey: KeyLine[];
  warnings: string[];
}

const DAY_MS = 86_400_000;
const COUNTED_STATUSES = ['confirmed', 'checked_in', 'checked_out', 'completed'];

function dayNumber(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS);
}

function toSatang(baht: number): number {
  return Math.round(baht * 100);
}

function toBaht(satang: number): number {
  return satang / 100;
}

/** Night indices [i0,i1) of the stay that fall inside the period; null if none. */
function nightWindow(
  checkIn: string,
  checkOut: string,
  periodStart: string,
  periodEndInclusive: string,
): { i0: number; i1: number; total: number } | null {
  const inDay = dayNumber(checkIn);
  const total = dayNumber(checkOut) - inDay;
  if (total <= 0) return null;
  const i0 = Math.max(0, dayNumber(periodStart) - inDay);
  const i1 = Math.min(total, dayNumber(periodEndInclusive) + 1 - inDay);
  return i1 > i0 ? { i0, i1, total } : null;
}

export function nightsInPeriod(
  checkIn: string,
  checkOut: string,
  periodStart: string,
  periodEndInclusive: string,
): number {
  const w = nightWindow(checkIn, checkOut, periodStart, periodEndInclusive);
  return w ? w.i1 - w.i0 : 0;
}

function prorateSatang(b: StatementBooking, periodStart: string, periodEndInclusive: string): number {
  const w = nightWindow(b.checkIn, b.checkOut, periodStart, periodEndInclusive);
  if (!w || b.totalAmount == null) return 0;
  const total = toSatang(b.totalAmount);
  const base = Math.floor(total / w.total);
  const remainder = total - base * w.total;
  const extra = Math.max(0, Math.min(w.i1, remainder) - w.i0);
  return base * (w.i1 - w.i0) + extra;
}

export function prorateRevenue(b: StatementBooking, periodStart: string, periodEndInclusive: string): number {
  return toBaht(prorateSatang(b, periodStart, periodEndInclusive));
}

interface RollupArgs {
  keys: readonly StatementKey[];
  bookings: readonly StatementBooking[];
  financials: readonly StatementFinancial[];
  periodStart: string;
  periodEnd: string;
  commissionRateByVilla: ReadonlyMap<string, number | null>;
}

function villaIdOf(propertyId: string, byId: ReadonlyMap<string, StatementKey>): string | null {
  const k = byId.get(propertyId);
  return k ? (k.parentId ?? k.id) : null;
}

function sumFinancials(list: readonly StatementFinancial[], pick: (f: StatementFinancial) => boolean): number {
  return list.filter(pick).reduce((s, f) => s + toSatang(f.amount), 0);
}

function sellableKeyIds(villaId: string, keys: readonly StatementKey[]): string[] {
  const children = keys.filter(k => k.parentId === villaId);
  const bookable = children.filter(k => k.isBookable !== false).map(k => k.id);
  return bookable.length > 0 ? bookable : [villaId];
}

function buildLines(keyIds: string[], bookings: readonly StatementBooking[], a: RollupArgs): KeyLine[] {
  const order = [...keyIds];
  for (const b of bookings) if (!order.includes(b.propertyId)) order.push(b.propertyId);
  return order.map(propertyId => {
    const own = bookings.filter(b => b.propertyId === propertyId);
    return {
      propertyId,
      revenue: toBaht(own.reduce((s, b) => s + prorateSatang(b, a.periodStart, a.periodEnd), 0)),
      nights: own.reduce((s, b) => s + nightsInPeriod(b.checkIn, b.checkOut, a.periodStart, a.periodEnd), 0),
    };
  });
}

function buildVillaStatement(villaId: string, a: RollupArgs, byId: ReadonlyMap<string, StatementKey>): VillaStatement {
  const bookings = a.bookings.filter(
    b => b.status != null && COUNTED_STATUSES.includes(b.status) && villaIdOf(b.propertyId, byId) === villaId,
  );
  const fin = a.financials.filter(f => villaIdOf(f.propertyId, byId) === villaId);
  const keyIds = sellableKeyIds(villaId, a.keys);
  const perKey = buildLines(keyIds, bookings, a);
  const roomSatang = bookings.reduce((s, b) => s + prorateSatang(b, a.periodStart, a.periodEnd), 0);
  const otherSatang = sumFinancials(fin, f => f.type === 'income' && f.referenceType !== 'booking');
  const expenseSatang = sumFinancials(fin, f => f.type === 'expense');
  const rate = a.commissionRateByVilla.get(villaId) ?? null;
  const feeSatang = rate == null ? null : Math.round(rate * (roomSatang + otherSatang));
  const days = dayNumber(a.periodEnd) - dayNumber(a.periodStart) + 1;
  return {
    villaId,
    keyIds,
    roomRevenue: toBaht(roomSatang),
    otherIncome: toBaht(otherSatang),
    expenses: toBaht(expenseSatang),
    managementFee: feeSatang == null ? null : toBaht(feeSatang),
    netToOwner: toBaht(roomSatang + otherSatang - expenseSatang - (feeSatang ?? 0)),
    occupiedNights: perKey.reduce((s, l) => s + l.nights, 0),
    availableNights: Math.max(0, days) * keyIds.length,
    perKey,
    warnings: feeSatang == null ? ['fee_rate_missing'] : [],
  };
}

export function rollupVillaStatements(a: RollupArgs): VillaStatement[] {
  const byId = new Map(a.keys.map(k => [k.id, k] as const));
  return a.keys.filter(k => k.parentId == null).map(v => buildVillaStatement(v.id, a, byId));
}
