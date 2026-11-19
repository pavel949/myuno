/**
 * Operational records, not realized P&L. The booking trigger can label rows
 * "paid" without settlement; even ledger copies of those rows inherit that gap.
 * Do not infer cash, profit or receipts from this projection.
 */
export interface FinanceRecord {
  transaction_date: string;
  transaction_type: string;
  category: string | null;
  amount: number;
  currency: string | null;
}

interface CurrencyAmount {
  currency: string;
  recordedIncome: number | null;
  recordedExpenses: number | null;
}

export function financeOverviewMonths(asOf: string) {
  const [year, month] = asOf.split('-').map(Number);
  const monthStart = (offset: number) =>
    new Date(Date.UTC(year, month - 1 + offset, 1)).toISOString().slice(0, 10);
  return Array.from({ length: 6 }, (_, index) => ({
    start: monthStart(index - 5),
    endExclusive: monthStart(index - 4),
  }));
}

export function summarizeFinanceRecords(rows: readonly FinanceRecord[], asOf: string) {
  return financeOverviewMonths(asOf).map(({ start, endExclusive }) => {
    const totals = new Map<string, CurrencyAmount>();
    let omittedRecords = 0;

    for (const row of rows) {
      if (row.transaction_date < start || row.transaction_date >= endExclusive ||
          row.transaction_date > asOf) continue;
      if (row.transaction_type !== 'income' && row.transaction_type !== 'expense') continue;
      // Security deposits are liabilities, including legacy rows typed as income.
      if (row.transaction_type === 'income' && row.category === 'deposit') continue;
      const currency = row.currency?.trim().toUpperCase();
      if (!currency || !/^[A-Z]{3}$/.test(currency) || !Number.isFinite(row.amount)) {
        omittedRecords++;
        continue;
      }
      const total = totals.get(currency) ?? { currency, recordedIncome: null, recordedExpenses: null };
      if (row.transaction_type === 'income') total.recordedIncome = (total.recordedIncome ?? 0) + row.amount;
      else total.recordedExpenses = (total.recordedExpenses ?? 0) + row.amount;
      totals.set(currency, total);
    }

    return {
      start,
      byCurrency: [...totals.values()].sort((a, b) => a.currency.localeCompare(b.currency)),
      omittedRecords,
    };
  });
}

export type FinanceOverviewMonth = ReturnType<typeof summarizeFinanceRecords>[number];

export async function readFinanceRecordPages<T extends { id: string }>(
  loadPage: (afterId: string | null) => Promise<{ rows: T[]; remaining: number | null }>,
): Promise<T[]> {
  const records: T[] = [];
  let afterId: string | null = null;
  while (true) {
    // remaining is the exact count since the keyset cursor; never treat a
    // provider-imposed shorter page as the end of the data.
    const page = await loadPage(afterId);
    if (page.remaining === null || page.remaining < page.rows.length) {
      throw new Error('Incomplete finance records');
    }
    for (const row of page.rows) {
      if (!row.id || (afterId !== null && row.id <= afterId)) throw new Error('Invalid finance cursor');
      records.push(row);
      afterId = row.id;
    }
    if (page.remaining === page.rows.length) return records;
    if (page.rows.length === 0) throw new Error('Incomplete finance records');
  }
}
