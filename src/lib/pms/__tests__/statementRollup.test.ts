import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  nightsInPeriod,
  prorateRevenue,
  rollupVillaStatements,
  type StatementBooking,
  type StatementFinancial,
  type StatementKey,
} from '../statementRollup';

const satang = (n: number) => Math.round(n * 100);
const bk = (propertyId: string, checkIn: string, checkOut: string, totalAmount: number | null, status: string | null = 'confirmed'): StatementBooking =>
  ({ propertyId, checkIn, checkOut, totalAmount, status });
const fin = (propertyId: string, type: string, amount: number, referenceType: string | null = null): StatementFinancial =>
  ({ propertyId, type, amount, referenceType });

describe('nightsInPeriod', () => {
  it('should count only the nights inside the period (Jan 28 -> Feb 3 in January)', () => {
    expect(nightsInPeriod('2026-01-28', '2026-02-03', '2026-01-01', '2026-01-31')).toBe(4);
  });

  it('should count only the nights inside the period (Jan 28 -> Feb 3 in February)', () => {
    expect(nightsInPeriod('2026-01-28', '2026-02-03', '2026-02-01', '2026-02-28')).toBe(2);
  });

  it('should be 0 when the stay ends on the period start', () => {
    expect(nightsInPeriod('2026-01-25', '2026-02-01', '2026-02-01', '2026-02-28')).toBe(0);
  });

  it('should include the last night of an inclusive period end', () => {
    expect(nightsInPeriod('2026-01-30', '2026-02-02', '2026-01-01', '2026-01-31')).toBe(2);
  });
});

describe('prorateRevenue', () => {
  it('should split a 6-night 6000 stay into 3000 + 3000 across the month boundary', () => {
    const b = bk('A', '2026-01-29', '2026-02-04', 6000);
    expect([prorateRevenue(b, '2026-01-01', '2026-01-31'), prorateRevenue(b, '2026-02-01', '2026-02-28')]).toEqual([3000, 3000]);
  });

  it('should split Jan 28 -> Feb 3 total 6000 into 4000 + 2000 (4 and 2 nights)', () => {
    const b = bk('A', '2026-01-28', '2026-02-03', 6000);
    expect([prorateRevenue(b, '2026-01-01', '2026-01-31'), prorateRevenue(b, '2026-02-01', '2026-02-28')]).toEqual([4000, 2000]);
  });

  it('should make odd-satang parts sum exactly to the total', () => {
    const b = bk('A', '2026-01-30', '2026-02-02', 100.01);
    const jan = prorateRevenue(b, '2026-01-01', '2026-01-31');
    const feb = prorateRevenue(b, '2026-02-01', '2026-02-28');
    expect(satang(jan) + satang(feb)).toBe(10001);
  });

  it('should give remainder satangs to the earliest nights', () => {
    const b = bk('A', '2026-01-30', '2026-02-02', 100.01);
    expect(prorateRevenue(b, '2026-01-01', '2026-01-31')).toBe(66.68);
  });

  it('should return 0 for a null total', () => {
    expect(prorateRevenue(bk('A', '2026-01-10', '2026-01-12', null), '2026-01-01', '2026-01-31')).toBe(0);
  });

  it('should return the full total for a stay fully inside the period', () => {
    expect(prorateRevenue(bk('A', '2026-01-10', '2026-01-13', 9000), '2026-01-01', '2026-01-31')).toBe(9000);
  });
});

describe('rollupVillaStatements', () => {
  const keys: StatementKey[] = [
    { id: 'V', parentId: null, isBookable: false },
    { id: 'R1', parentId: 'V' },
    { id: 'R2', parentId: 'V' },
  ];
  const periodStart = '2026-01-01';
  const periodEnd = '2026-01-31';
  const bookings = [bk('R1', '2026-01-10', '2026-01-12', 2000), bk('R2', '2026-01-10', '2026-01-11', 1000)];
  const run = (over: Partial<Parameters<typeof rollupVillaStatements>[0]> = {}) =>
    rollupVillaStatements({
      keys, bookings, financials: [], periodStart, periodEnd,
      commissionRateByVilla: new Map([['V', 0.2]]), ...over,
    });

  it('should roll a villa and its rooms into one statement', () => {
    expect(run()).toHaveLength(1);
  });

  it('should sum room revenue across rooms', () => {
    expect(run()[0].roomRevenue).toBe(3000);
  });

  it('should make perKey sum exactly to roomRevenue', () => {
    const [s] = run();
    const sum = s.perKey.reduce((acc, k) => acc + satang(k.revenue), 0);
    expect(sum).toBe(satang(s.roomRevenue));
  });

  it('should attribute revenue to the right key', () => {
    const [s] = run();
    expect(s.perKey.find((k) => k.propertyId === 'R1')?.revenue).toBe(2000);
  });

  it('should count occupied nights across keys', () => {
    expect(run()[0].occupiedNights).toBe(3);
  });

  it('should compute availableNights as period days x room keys', () => {
    expect(run()[0].availableNights).toBe(62);
  });

  it('should compute availableNights as period days for a single-key villa', () => {
    const [s] = run({ keys: [{ id: 'W', parentId: null }], bookings: [], commissionRateByVilla: new Map([['W', 0.2]]) });
    expect(s.availableNights).toBe(31);
  });

  it('should exclude pending and cancelled bookings', () => {
    const [s] = run({ bookings: [...bookings, bk('R1', '2026-01-20', '2026-01-22', 5000, 'pending'), bk('R2', '2026-01-20', '2026-01-22', 5000, 'cancelled')] });
    expect(s.roomRevenue).toBe(3000);
  });

  it('should exclude bookings with NULL status', () => {
    const [s] = run({ bookings: [...bookings, bk('R1', '2026-01-20', '2026-01-22', 5000, null)] });
    expect(s.roomRevenue).toBe(3000);
  });

  it('should exclude referenceType booking income from otherIncome', () => {
    const [s] = run({ financials: [fin('R1', 'income', 9999, 'booking'), fin('R1', 'income', 500)] });
    expect(s.otherIncome).toBe(500);
  });

  it('should sum expenses', () => {
    const [s] = run({ financials: [fin('R2', 'expense', 200), fin('V', 'expense', 50)] });
    expect(s.expenses).toBe(250);
  });

  it('should take a 20% fee on room revenue plus other income', () => {
    const [s] = run({ financials: [fin('V', 'income', 500)] });
    expect(s.managementFee).toBe(700);
  });

  it('should compute netToOwner = revenue + other income - expenses - fee', () => {
    const [s] = run({ financials: [fin('V', 'income', 500), fin('R2', 'expense', 200)] });
    expect(s.netToOwner).toBe(2600);
  });

  it('should have no warnings when a rate is present', () => {
    expect(run()[0].warnings).toEqual([]);
  });

  it('should return null fee and fee_rate_missing warning when rate is null', () => {
    const [s] = run({ commissionRateByVilla: new Map([['V', null]]) });
    expect([s.managementFee, s.warnings]).toEqual([null, ['fee_rate_missing']]);
  });

  it('should not deduct a fee from netToOwner when rate is missing', () => {
    const [s] = run({ commissionRateByVilla: new Map() });
    expect(s.netToOwner).toBe(3000);
  });

  it('should round the fee to the satang', () => {
    const [s] = run({ bookings: [bk('R1', '2026-01-10', '2026-01-11', 33.33)], commissionRateByVilla: new Map([['V', 0.15]]) });
    expect(s.managementFee).toBe(5);
  });
});

describe('statementRollup mirror', () => {
  it('should be byte-identical to the edge-function _shared copy', () => {
    const root = join(__dirname, '..', '..', '..', '..');
    const a = readFileSync(join(root, 'src/lib/pms/statementRollup.ts'));
    const b = readFileSync(join(root, 'supabase/functions/_shared/pms-statement-rollup.ts'));
    expect(a.equals(b)).toBe(true);
  });
});
