/**
 * Pure financial model math — no React, no I/O.
 * All amounts in THB unless stated otherwise.
 */

export interface MonthDriver {
  adr: number;            // Average Daily Rate
  occupancy: number;      // 0..1 (e.g. 0.65 = 65%)
  nights: number;         // available nights in month
  cleaningFeePerBooking?: number;
  bookingsCount?: number; // override; otherwise estimated as occupancy*nights/avgStay
  otherIncomePct?: number; // 0..1, % of base revenue
  avgStayNights?: number; // default 4
}

export interface Drivers {
  months: MonthDriver[]; // length 12
}

export interface CapExItem {
  id: string;
  name: string;
  amount: number;
  month: number;        // 1..12
  lifespanYears: number;
  category?: string;
}

export interface LoanItem {
  id: string;
  principal: number;
  annualRatePct: number;
  termMonths: number;
  monthlyPayment?: number; // if absent, computed
  startMonth?: number;     // 1..12, default 1
}

export interface Assumptions {
  taxRatePct?: number;        // % of net income to set aside
  mgmtFeePct?: number;        // % of revenue
  channelFeePct?: number;     // % of revenue (Booking/Airbnb commission)
  propertyValue?: number;     // for Cap Rate
  cashInvested?: number;      // for Cash-on-Cash
  scenarioMultipliers?: {
    revenue?: number;         // e.g. 1.15 for optimistic
    cost?: number;            // e.g. 0.95 for optimistic (lower costs)
  };
}

export interface ExpenseRow {
  category: string;
  monthly: number[]; // 12 entries
}

export interface ComputedPnL {
  months: string[]; // labels
  revenuePerMonth: number[];
  cleaningRevenuePerMonth: number[];
  otherRevenuePerMonth: number[];
  grossRevenuePerMonth: number[];
  expensesByCategory: ExpenseRow[];
  totalOpExPerMonth: number[];
  noiPerMonth: number[];
  ebitdaPerMonth: number[];
  netIncomePerMonth: number[];
  totals: {
    grossRevenue: number;
    totalOpEx: number;
    noi: number;
    ebitda: number;
    netIncome: number;
    avgOccupancy: number;
    avgAdr: number;
  };
  kpis: {
    capRate: number | null;       // NOI / propertyValue
    cashOnCash: number | null;    // (Net + interest add-back) / cashInvested -> simplified to NOI / cashInvested
    dscr: number | null;          // NOI / annual debt service
    grossMarginPct: number;       // NOI / GrossRevenue
    breakEvenOccupancy: number | null; // occupancy needed to cover OpEx
  };
}

const MONTH_LABELS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function emptyDrivers(year: number = new Date().getFullYear()): Drivers {
  return {
    months: Array.from({ length: 12 }, (_, i) => ({
      adr: 0,
      occupancy: 0.6,
      nights: new Date(year, i + 1, 0).getDate(),
      cleaningFeePerBooking: 0,
      otherIncomePct: 0,
      avgStayNights: 4,
    })),
  };
}

export function computeMonthlyAmortization(loans: LoanItem[]): number[] {
  const out = Array(12).fill(0);
  loans.forEach(l => {
    const r = (l.annualRatePct / 100) / 12;
    const n = l.termMonths;
    const pmt = l.monthlyPayment ?? (r > 0 ? (l.principal * r) / (1 - Math.pow(1 + r, -n)) : l.principal / n);
    const start = (l.startMonth ?? 1) - 1;
    for (let i = start; i < 12; i++) out[i] += pmt;
  });
  return out;
}

export function annualDebtService(loans: LoanItem[]): number {
  return computeMonthlyAmortization(loans).reduce((s, x) => s + x, 0);
}

export function computeCapExDepreciation(items: CapExItem[]): number[] {
  const monthly = Array(12).fill(0);
  items.forEach(c => {
    if (!c.lifespanYears || c.lifespanYears <= 0) return;
    const monthlyDep = c.amount / (c.lifespanYears * 12);
    // depreciation starts from purchase month forward (within year)
    for (let i = (c.month - 1); i < 12; i++) monthly[i] += monthlyDep;
  });
  return monthly;
}

export function computePnL(opts: {
  drivers: Drivers;
  budgetExpenses: ExpenseRow[];     // 12-month plan per category
  budgetExtraIncome?: ExpenseRow[]; // additional income lines (if any)
  capex?: CapExItem[];
  loans?: LoanItem[];
  assumptions?: Assumptions;
}): ComputedPnL {
  const { drivers, budgetExpenses, budgetExtraIncome = [], capex = [], loans = [], assumptions = {} } = opts;
  const revMult = assumptions.scenarioMultipliers?.revenue ?? 1;
  const costMult = assumptions.scenarioMultipliers?.cost ?? 1;

  const revenuePerMonth = drivers.months.map(m => (m.adr || 0) * (m.occupancy || 0) * (m.nights || 0) * revMult);
  const cleaningRevenuePerMonth = drivers.months.map(m => {
    const stays = m.bookingsCount ?? ((m.occupancy || 0) * (m.nights || 0)) / Math.max(m.avgStayNights ?? 4, 1);
    return stays * (m.cleaningFeePerBooking ?? 0) * revMult;
  });
  const baseRev = revenuePerMonth;
  const otherRevenuePerMonth = drivers.months.map((m, i) => baseRev[i] * (m.otherIncomePct ?? 0));
  const extraIncomePerMonth = sumRows(budgetExtraIncome).map(v => v * revMult);

  const grossRevenuePerMonth = revenuePerMonth.map((r, i) =>
    r + cleaningRevenuePerMonth[i] + otherRevenuePerMonth[i] + (extraIncomePerMonth[i] || 0)
  );

  // Auto-fee categories (mgmt fee, channel fee) added as virtual expense rows if assumptions present
  const autoExpenses: ExpenseRow[] = [];
  if (assumptions.mgmtFeePct && assumptions.mgmtFeePct > 0) {
    autoExpenses.push({
      category: 'management_fee',
      monthly: grossRevenuePerMonth.map(r => r * (assumptions.mgmtFeePct! / 100)),
    });
  }
  if (assumptions.channelFeePct && assumptions.channelFeePct > 0) {
    autoExpenses.push({
      category: 'platform_fee',
      monthly: grossRevenuePerMonth.map(r => r * (assumptions.channelFeePct! / 100)),
    });
  }

  // Merge budget expenses with auto, by category (sum)
  const mergedExpenses = mergeExpenseRows([...budgetExpenses, ...autoExpenses]);
  // Apply cost multiplier
  const expensesScaled: ExpenseRow[] = mergedExpenses.map(r => ({
    category: r.category,
    monthly: r.monthly.map(v => v * costMult),
  }));

  const totalOpExPerMonth = sumRows(expensesScaled);
  const depreciation = computeCapExDepreciation(capex);
  const debtService = computeMonthlyAmortization(loans);

  const noiPerMonth = grossRevenuePerMonth.map((r, i) => r - totalOpExPerMonth[i]);
  const ebitdaPerMonth = noiPerMonth.slice(); // Simplified: NOI ~ EBITDA before D&A
  const netIncomePerMonth = noiPerMonth.map((n, i) => n - depreciation[i] - debtService[i]);

  const totGross = sum(grossRevenuePerMonth);
  const totOpex = sum(totalOpExPerMonth);
  const totNoi = sum(noiPerMonth);
  const totEbitda = sum(ebitdaPerMonth);
  const totNet = sum(netIncomePerMonth);

  const avgOcc = drivers.months.reduce((s, m) => s + (m.occupancy || 0), 0) / 12;
  const avgAdr = drivers.months.reduce((s, m) => s + (m.adr || 0), 0) / 12;

  const ds = annualDebtService(loans);

  const fixedAnnualOpex = totOpex; // simplification; in v2 split fixed/variable
  const annualNightCapacity = drivers.months.reduce((s, m) => s + (m.nights || 0), 0);
  const avgRevPerNight = (drivers.months.reduce((s, m) => s + (m.adr || 0) * (m.nights || 0), 0) / Math.max(annualNightCapacity, 1)) || 0;
  const breakEvenOcc = avgRevPerNight > 0
    ? Math.min(1, fixedAnnualOpex / (avgRevPerNight * annualNightCapacity))
    : null;

  return {
    months: MONTH_LABELS_EN,
    revenuePerMonth,
    cleaningRevenuePerMonth,
    otherRevenuePerMonth,
    grossRevenuePerMonth,
    expensesByCategory: expensesScaled,
    totalOpExPerMonth,
    noiPerMonth,
    ebitdaPerMonth,
    netIncomePerMonth,
    totals: {
      grossRevenue: totGross,
      totalOpEx: totOpex,
      noi: totNoi,
      ebitda: totEbitda,
      netIncome: totNet,
      avgOccupancy: avgOcc,
      avgAdr: avgAdr,
    },
    kpis: {
      capRate: assumptions.propertyValue && assumptions.propertyValue > 0 ? totNoi / assumptions.propertyValue : null,
      cashOnCash: assumptions.cashInvested && assumptions.cashInvested > 0 ? totNet / assumptions.cashInvested : null,
      dscr: ds > 0 ? totNoi / ds : null,
      grossMarginPct: totGross > 0 ? totNoi / totGross : 0,
      breakEvenOccupancy: breakEvenOcc,
    },
  };
}

function sum(arr: number[]): number {
  return arr.reduce((s, x) => s + (x || 0), 0);
}

function sumRows(rows: ExpenseRow[]): number[] {
  const out = Array(12).fill(0);
  rows.forEach(r => r.monthly.forEach((v, i) => { out[i] += (v || 0); }));
  return out;
}

function mergeExpenseRows(rows: ExpenseRow[]): ExpenseRow[] {
  const map = new Map<string, number[]>();
  rows.forEach(r => {
    const cur = map.get(r.category) || Array(12).fill(0);
    r.monthly.forEach((v, i) => { cur[i] = (cur[i] || 0) + (v || 0); });
    map.set(r.category, cur);
  });
  return Array.from(map.entries()).map(([category, monthly]) => ({ category, monthly }));
}

export function applyScenario(scenario: 'base' | 'optimistic' | 'pessimistic'): { revenue: number; cost: number } {
  if (scenario === 'optimistic') return { revenue: 1.15, cost: 0.95 };
  if (scenario === 'pessimistic') return { revenue: 0.80, cost: 1.10 };
  return { revenue: 1, cost: 1 };
}
