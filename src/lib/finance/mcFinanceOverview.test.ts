import { describe, expect, it } from 'vitest';
import { bangkokTodayISO } from '../hotelDates';
import { financeOverviewMonths, readFinanceRecordPages, summarizeFinanceRecords, type FinanceRecord } from './mcFinanceOverview';

const row = (date: string, amount: number, fields: Partial<FinanceRecord> = {}): FinanceRecord => ({
  transaction_date: date, transaction_type: 'income', category: 'rent', currency: 'THB', amount, ...fields,
});

describe('management-company finance records', () => {
  it('reports only bounded records, not future booking entries as current or realized income', () => {
    const paidByBookingTrigger = {
      ...row('2026-12-15', 197000), status: 'paid', verification_status: 'unverified',
    };
    const months = summarizeFinanceRecords([
      ...Array.from({ length: 200 }, () => paidByBookingTrigger),
      { ...row('2026-11-02', 12000), status: 'paid', verification_status: 'unverified' },
      row('2026-11-25', 430000),
      row('2026-10-31', 19000),
      row('2026-11-19', 1200, { transaction_type: 'expense' }),
    ], '2026-11-19');

    expect(months[5]).toEqual({
      start: '2026-11-01',
      byCurrency: [{ currency: 'THB', recordedIncome: 12000, recordedExpenses: 1200 }],
      omittedRecords: 0,
    });
    expect(months[4].byCurrency[0].recordedIncome).toBe(19000);
    expect(months[5]).not.toHaveProperty('realizedIncome');
    expect(months[5]).not.toHaveProperty('netProfit');
  });

  it('uses Bangkok civil boundaries independently of the browser clock zone and clips as of today', () => {
    const before = bangkokTodayISO(new Date('2026-12-31T16:59:59Z'));
    const after = bangkokTodayISO(new Date('2026-12-31T17:00:00Z'));
    expect(before).toBe('2026-12-31');
    expect(after).toBe('2027-01-01');
    expect(financeOverviewMonths(after)[5]).toEqual({
      start: '2027-01-01', endExclusive: '2027-02-01',
    });
    const rows = [row('2026-12-31', 10), row('2027-01-01', 20), row('2027-01-02', 30)];
    expect(summarizeFinanceRecords(rows, before)[5].byCurrency[0].recordedIncome).toBe(10);
    expect(summarizeFinanceRecords(rows, after)[5].byCurrency[0].recordedIncome).toBe(20);
  });

  it('separates native currencies and excludes deposits and malformed entries', () => {
    const month = summarizeFinanceRecords([
      row('2026-11-01', 99, { currency: 'usd' }),
      row('2026-11-02', 10, { transaction_type: 'expense' }),
      row('2026-11-03', 800, { category: 'deposit' }),
      row('2026-11-04', 999, { transaction_type: 'deposit' }),
      row('2026-11-05', 40, { currency: null }),
      row('2026-11-06', Number.NaN),
    ], '2026-11-19')[5];

    expect(month.byCurrency).toEqual([
      { currency: 'THB', recordedIncome: null, recordedExpenses: 10 },
      { currency: 'USD', recordedIncome: 99, recordedExpenses: null },
    ]);
    expect(month.omittedRecords).toBe(2);
  });

  it('distinguishes no recorded amount from an actual zero-valued record', () => {
    expect(summarizeFinanceRecords([], '2026-11-19')[5].byCurrency).toEqual([]);
    expect(summarizeFinanceRecords([row('2026-11-19', 0)], '2026-11-19')[5].byCurrency).toEqual([
      { currency: 'THB', recordedIncome: 0, recordedExpenses: null },
    ]);
  });
});

describe('finance records reader', () => {
  it('keeps reading past short provider-capped pages', async () => {
    const ids: (string | null)[] = [];
    const rows = await readFinanceRecordPages(async after => {
      ids.push(after);
      return !after ? { rows: [{ id: 'a' }], remaining: 2 }
        : { rows: [{ id: 'b' }], remaining: 1 };
    });
    expect(ids).toEqual([null, 'a']);
    expect(rows).toEqual([{ id: 'a' }, { id: 'b' }]);
  });

  it('fails closed when paging is incomplete or repeats a cursor', async () => {
    await expect(readFinanceRecordPages(async () => ({ rows: [], remaining: null }))).rejects.toThrow();
    await expect(readFinanceRecordPages(async () => ({ rows: [], remaining: 1 }))).rejects.toThrow();
    await expect(readFinanceRecordPages(async () => ({
      rows: [{ id: 'a' }], remaining: 2,
    }))).rejects.toThrow();
  });
});
