/**
 * @module calculations
 * @description Pure financial model calculation functions for MC Asset Financial Models.
 *
 * All functions are stateless and side-effect-free — safe to call in render cycles.
 * Units: THB (Thai Baht), percentages as plain numbers (e.g. 8 = 8%), years as integers.
 *
 * Formulas reference:
 *   NOI        = Gross Income − Operating Expenses
 *   Cap Rate   = NOI ÷ Purchase Price
 *   CoC Return = Net Cash Flow (after debt) ÷ Equity Invested
 *   IRR        = Newton-Raphson root-find on NPV(r) = 0
 *   NPV        = Σ CFt / (1+r)^t  −  initial equity
 *   Debt Svc   = P × r / (1 − (1+r)^−n)  [annual, fixed-rate]
 *   Rem. Bal.  = P × [(1+r)^n − (1+r)^t] / [(1+r)^n − 1]
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type ScenarioKey = 'conservative' | 'base' | 'optimistic';

/** All editable inputs for the financial model. */
export interface ModelInputs {
  // ── Acquisition ──────────────────────────────────────────────────────────
  purchasePrice: number;         // THB
  transferFeeRate: number;       // % of purchase price (Thailand: 2%)
  legalFee: number;              // THB fixed
  agentFeeRate: number;          // % of purchase price (Thailand: 3%)
  renovationBudget: number;      // THB
  furnitureEquipment: number;    // THB

  // ── Financing (set loanAmount = 0 for all-cash) ───────────────────────────
  loanAmount: number;            // THB
  interestRate: number;          // % per annum (e.g. 5.5)
  loanTermYears: number;         // years (e.g. 20)

  // ── Revenue ───────────────────────────────────────────────────────────────
  monthlyRent: number;           // THB / month at 100% occupancy
  occupancyRate: number;         // 0–100
  managementFeeRate: number;     // % of effective gross income
  annualRentGrowth: number;      // % per year (applied from Year 2 onward)

  // ── Operating Expenses (monthly, THB each) ────────────────────────────────
  utilities: number;
  maintenance: number;
  insurance: number;
  hoa: number;
  annualExpenseGrowth: number;   // % per year (applied from Year 2 onward)

  // ── Exit ──────────────────────────────────────────────────────────────────
  holdingPeriod: number;         // years, 1–20
  propertyAppreciation: number;  // % per year (for appreciation-based exit)
  exitCapRate: number;           // % — alternative exit valuation (NOI ÷ cap rate)
  useExitCapRate: boolean;       // if true, exit price = final year NOI / exitCapRate

  // ── Analysis ──────────────────────────────────────────────────────────────
  discountRate: number;          // % for NPV (default 8)
}

/** Scenario-level overrides (applied on top of base ModelInputs). */
export interface ScenarioOverrides {
  occupancyRate?: number;
  monthlyRent?: number;
  annualRentGrowth?: number;
  annualExpenseGrowth?: number;
  propertyAppreciation?: number;
}

/** One row in the year-by-year projection table. */
export interface YearRow {
  year: number;
  grossIncome: number;           // Effective gross income (rent × occupancy)
  managementFee: number;         // % of grossIncome
  operatingExpenses: number;     // utilities + maint + insurance + HOA (grown)
  totalExpenses: number;         // managementFee + operatingExpenses
  noi: number;                   // grossIncome − totalExpenses
  debtService: number;           // fixed annual mortgage payment
  netCashFlow: number;           // noi − debtService
  cumulativeCashFlow: number;    // running sum of netCashFlow from Year 1
  propertyValue: number;         // appreciation-based value
  remainingLoanBalance: number;
  equity: number;                // propertyValue − remainingLoanBalance
  isBreakEvenYear: boolean;      // first year cumulative CF crosses 0
  isExitYear: boolean;
  exitSalePrice?: number;        // only set in final row
  exitProceeds?: number;         // exitSalePrice − remainingLoanBalance
  totalReturnThisYear?: number;  // netCashFlow + exitProceeds (final year only)
}

/** All computed outputs for a single scenario. */
export interface ModelResults {
  // ── Investment summary ────────────────────────────────────────────────────
  acquisitionCosts: number;      // transfer + legal + agent fees
  totalInvestment: number;       // purchasePrice + acquisitionCosts + reno + furniture
  equityInvested: number;        // totalInvestment − loanAmount
  loanToValue: number;           // % (loanAmount / purchasePrice)

  // ── Year-1 income statement ───────────────────────────────────────────────
  grossAnnualIncome: number;
  managementFee: number;
  totalAnnualOpex: number;
  totalAnnualExpenses: number;   // management + opex
  noi: number;
  annualDebtService: number;
  netCashFlowBeforeDebt: number; // NOI (= CF before debt)
  netCashFlow: number;           // NOI − debt service

  // ── Performance KPIs ─────────────────────────────────────────────────────
  capRate: number;               // % (NOI ÷ purchasePrice)
  cashOnCashReturn: number;      // % (net CF ÷ equity invested)
  grossYield: number;            // % (gross annual income ÷ purchase price)
  roi: number;                   // % (net CF ÷ totalInvestment)
  paybackYears: number;          // years until cumulative CF ≥ equityInvested
  irr: number;                   // % (over holding period incl. exit)
  npv: number;                   // THB at discountRate
  equityMultiple: number;        // total distributions ÷ equity invested
  breakEvenOccupancy: number;    // % (minimum occupancy to cover all costs)

  // ── Exit ──────────────────────────────────────────────────────────────────
  exitSalePrice: number;
  exitProceeds: number;          // exitSalePrice − remaining loan at exit

  // ── Year-by-year table ────────────────────────────────────────────────────
  yearRows: YearRow[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Default inputs
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_INPUTS: ModelInputs = {
  purchasePrice: 5_000_000,
  transferFeeRate: 2,
  legalFee: 30_000,
  agentFeeRate: 3,
  renovationBudget: 300_000,
  furnitureEquipment: 200_000,
  loanAmount: 0,
  interestRate: 5.5,
  loanTermYears: 20,
  monthlyRent: 35_000,
  occupancyRate: 75,
  managementFeeRate: 15,
  annualRentGrowth: 3,
  utilities: 3_000,
  maintenance: 2_000,
  insurance: 1_500,
  hoa: 2_500,
  annualExpenseGrowth: 3,
  holdingPeriod: 5,
  propertyAppreciation: 5,
  exitCapRate: 6,
  useExitCapRate: false,
  discountRate: 8,
};

export const SCENARIO_PRESETS: Record<ScenarioKey, ScenarioOverrides> = {
  conservative: {
    occupancyRate: 60,
    annualRentGrowth: 1,
    annualExpenseGrowth: 5,
    propertyAppreciation: 3,
  },
  base: {
    occupancyRate: 75,
    annualRentGrowth: 3,
    annualExpenseGrowth: 3,
    propertyAppreciation: 5,
  },
  optimistic: {
    occupancyRate: 90,
    annualRentGrowth: 5,
    annualExpenseGrowth: 2,
    propertyAppreciation: 8,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fixed annual mortgage payment (constant payment, fixed rate).
 * Returns 0 if loanAmount ≤ 0 or rate = 0.
 */
export function annualDebtService(
  loanAmount: number,
  annualRatePct: number,
  termYears: number,
): number {
  if (loanAmount <= 0 || termYears <= 0) return 0;
  if (annualRatePct <= 0) return loanAmount / termYears; // interest-free
  const r = annualRatePct / 100;
  return loanAmount * (r / (1 - Math.pow(1 + r, -termYears)));
}

/**
 * Outstanding loan balance after `yearsPaid` full annual payments.
 * Uses the standard amortization remaining-balance formula.
 */
export function remainingLoanBalance(
  loanAmount: number,
  annualRatePct: number,
  termYears: number,
  yearsPaid: number,
): number {
  if (loanAmount <= 0) return 0;
  if (yearsPaid >= termYears) return 0;
  if (annualRatePct <= 0) {
    // interest-free: straight-line paydown
    return Math.max(0, loanAmount - (loanAmount / termYears) * yearsPaid);
  }
  const r = annualRatePct / 100;
  const n = termYears;
  const t = yearsPaid;
  return loanAmount * ((Math.pow(1 + r, n) - Math.pow(1 + r, t)) / (Math.pow(1 + r, n) - 1));
}

/**
 * Net Present Value of a cash-flow stream at discount rate `r` (pct).
 * cashFlows[0] is the t=0 outflow (negative = initial investment).
 */
export function npv(cashFlows: number[], discountRatePct: number): number {
  const r = discountRatePct / 100;
  return cashFlows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + r, t), 0);
}

/**
 * Internal Rate of Return via Newton-Raphson iteration.
 * cashFlows[0] must be negative (initial outflow).
 * Returns NaN if no convergence (e.g. all-negative flows, trivial projects).
 */
export function irr(cashFlows: number[], maxIterations = 200, tolerance = 1e-8): number {
  if (cashFlows.length < 2) return NaN;

  // Quick sanity: need at least one sign change
  const hasPositive = cashFlows.some((v) => v > 0);
  const hasNegative = cashFlows.some((v) => v < 0);
  if (!hasPositive || !hasNegative) return NaN;

  // Initial guess — use simple ROI as seed
  const totalIn = cashFlows.slice(1).reduce((a, b) => a + Math.max(0, b), 0);
  const outflow = Math.abs(cashFlows[0]);
  const n = cashFlows.length - 1;
  let r = Math.pow(totalIn / outflow, 1 / n) - 1;

  // Clamp seed to a sane range
  r = Math.max(-0.5, Math.min(r, 5));

  for (let i = 0; i < maxIterations; i++) {
    // NPV at current rate
    let pv = 0;
    let dpv = 0; // derivative dNPV/dr
    for (let t = 0; t < cashFlows.length; t++) {
      const discount = Math.pow(1 + r, t);
      pv += cashFlows[t] / discount;
      if (t > 0) dpv -= (t * cashFlows[t]) / (discount * (1 + r));
    }

    if (Math.abs(dpv) < 1e-14) break; // degenerate derivative

    const rNext = r - pv / dpv;

    if (Math.abs(rNext - r) < tolerance) {
      // Converged — sanity-check result is in a meaningful range
      if (rNext < -1 || rNext > 100) return NaN;
      return rNext * 100; // return as percentage
    }
    r = rNext;

    // Escape divergence
    if (!isFinite(r) || r < -1) return NaN;
  }

  return NaN; // did not converge
}

/**
 * Payback period in years: first year where cumulative net cash flow ≥ 0.
 * Returns Infinity if payback never occurs within the projection horizon.
 * Interpolates fractionally for more precision.
 */
export function paybackPeriod(yearRows: YearRow[]): number {
  for (let i = 0; i < yearRows.length; i++) {
    if (yearRows[i].cumulativeCashFlow >= 0) {
      if (i === 0) return yearRows[0].year;
      const prev = yearRows[i - 1].cumulativeCashFlow;
      const curr = yearRows[i].cumulativeCashFlow;
      // Linear interpolation within the year
      const fraction = Math.abs(prev) / (Math.abs(prev) + curr);
      return yearRows[i].year - 1 + fraction;
    }
  }
  return Infinity;
}

/**
 * Minimum occupancy rate (%) needed so that NOI ≥ annual debt service (break-even).
 * If no loan, break-even is occupancy where NOI = 0.
 *
 * Derivation:
 *   grossIncome(occ) = monthlyRent × 12 × occ
 *   managementFee    = grossIncome × mgrRate
 *   opex             = fixed (does not depend on occupancy)
 *   NOI              = grossIncome × (1 − mgrRate) − opex
 *   breakEven:       NOI = debtService
 *   occ              = (debtService + opex) / (monthlyRent × 12 × (1 − mgrRate))
 */
export function breakEvenOccupancy(
  monthlyRent: number,
  managementFeeRatePct: number,
  annualOpex: number,
  debtService: number,
): number {
  const grossPotential = monthlyRent * 12;
  const mgrRate = managementFeeRatePct / 100;
  const denominator = grossPotential * (1 - mgrRate);
  if (denominator <= 0) return 100;
  const occ = ((debtService + annualOpex) / denominator) * 100;
  return Math.min(100, Math.max(0, occ));
}

// ─────────────────────────────────────────────────────────────────────────────
// Main calculation engine
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Applies scenario overrides on top of base inputs.
 * Scenario only overrides revenue/expense/growth fields — never acquisition or financing.
 */
export function applyScenario(
  base: ModelInputs,
  overrides: ScenarioOverrides,
): ModelInputs {
  return { ...base, ...overrides };
}

/**
 * Full financial model calculation.
 * Returns all KPIs, year-by-year rows, and exit analysis.
 */
export function calculateModel(inputs: ModelInputs): ModelResults {
  const {
    purchasePrice,
    transferFeeRate,
    legalFee,
    agentFeeRate,
    renovationBudget,
    furnitureEquipment,
    loanAmount,
    interestRate,
    loanTermYears,
    monthlyRent,
    occupancyRate,
    managementFeeRate,
    annualRentGrowth,
    utilities,
    maintenance,
    insurance,
    hoa,
    annualExpenseGrowth,
    holdingPeriod,
    propertyAppreciation,
    exitCapRate,
    useExitCapRate,
    discountRate,
  } = inputs;

  // ── Investment summary ────────────────────────────────────────────────────

  const transferFee = (purchasePrice * transferFeeRate) / 100;
  const agentFee = (purchasePrice * agentFeeRate) / 100;
  const acquisitionCosts = transferFee + legalFee + agentFee;
  const totalInvestment = purchasePrice + acquisitionCosts + renovationBudget + furnitureEquipment;
  const equityInvested = Math.max(0, totalInvestment - loanAmount);
  const loanToValue = purchasePrice > 0 ? (loanAmount / purchasePrice) * 100 : 0;

  // ── Year-1 income statement ───────────────────────────────────────────────

  const yr1GrossIncome = monthlyRent * 12 * (occupancyRate / 100);
  const yr1ManagementFee = yr1GrossIncome * (managementFeeRate / 100);
  const yr1MonthlyOpex = utilities + maintenance + insurance + hoa;
  const yr1AnnualOpex = yr1MonthlyOpex * 12;
  const yr1TotalExpenses = yr1ManagementFee + yr1AnnualOpex;
  const yr1Noi = yr1GrossIncome - yr1TotalExpenses;
  const debtService = annualDebtService(loanAmount, interestRate, loanTermYears);
  const yr1NetCF = yr1Noi - debtService;

  // ── KPIs ─────────────────────────────────────────────────────────────────

  const capRate = purchasePrice > 0 ? (yr1Noi / purchasePrice) * 100 : 0;
  const grossYield = purchasePrice > 0 ? (yr1GrossIncome / purchasePrice) * 100 : 0;
  const cashOnCashReturn = equityInvested > 0 ? (yr1NetCF / equityInvested) * 100 : 0;
  const roi = totalInvestment > 0 ? (yr1NetCF / totalInvestment) * 100 : 0;

  const breakEven = breakEvenOccupancy(monthlyRent, managementFeeRate, yr1AnnualOpex, debtService);

  // ── Year-by-year projection ───────────────────────────────────────────────

  const years = Math.max(1, Math.min(20, Math.round(holdingPeriod)));
  const rentGrowth = 1 + annualRentGrowth / 100;
  const expenseGrowth = 1 + annualExpenseGrowth / 100;
  const appreciation = 1 + propertyAppreciation / 100;

  const yearRows: YearRow[] = [];
  let cumulativeCF = -equityInvested; // start negative by equity invested
  let breakEvenMarked = false;

  for (let yr = 1; yr <= years; yr++) {
    // Grow rent and occupancy from base (Year 1 = base, growth starts Year 2)
    const growthFactor = yr === 1 ? 1 : Math.pow(rentGrowth, yr - 1);
    const expFactor = yr === 1 ? 1 : Math.pow(expenseGrowth, yr - 1);

    const grossIncome = monthlyRent * 12 * (occupancyRate / 100) * growthFactor;
    const managementFee = grossIncome * (managementFeeRate / 100);
    const operatingExpenses = yr1AnnualOpex * expFactor;
    const totalExpenses = managementFee + operatingExpenses;
    const noi = grossIncome - totalExpenses;
    const netCashFlow = noi - debtService;

    cumulativeCF += netCashFlow;

    const propertyValue = purchasePrice * Math.pow(appreciation, yr);
    const loanBalance = remainingLoanBalance(loanAmount, interestRate, loanTermYears, yr);
    const equity = propertyValue - loanBalance;

    const isExitYear = yr === years;
    const isBreakEvenYear = !breakEvenMarked && cumulativeCF >= 0;
    if (isBreakEvenYear) breakEvenMarked = true;

    const row: YearRow = {
      year: yr,
      grossIncome,
      managementFee,
      operatingExpenses,
      totalExpenses,
      noi,
      debtService,
      netCashFlow,
      cumulativeCashFlow: cumulativeCF,
      propertyValue,
      remainingLoanBalance: loanBalance,
      equity,
      isBreakEvenYear,
      isExitYear,
    };

    if (isExitYear) {
      // Exit valuation
      const finalNoi = noi;
      let exitSalePrice: number;
      if (useExitCapRate && exitCapRate > 0) {
        exitSalePrice = finalNoi / (exitCapRate / 100);
      } else {
        exitSalePrice = propertyValue;
      }
      const exitProceeds = exitSalePrice - loanBalance;
      row.exitSalePrice = exitSalePrice;
      row.exitProceeds = exitProceeds;
      row.totalReturnThisYear = netCashFlow + exitProceeds;
    }

    yearRows.push(row);
  }

  // ── IRR & NPV ─────────────────────────────────────────────────────────────

  // Build cash-flow stream for IRR:
  //   t=0: −equityInvested
  //   t=1..N-1: annual net cash flow
  //   t=N: net cash flow + exit proceeds
  const lastRow = yearRows[yearRows.length - 1];
  const exitProceeds = lastRow.exitProceeds ?? 0;

  const irrCashFlows: number[] = [
    -equityInvested,
    ...yearRows.slice(0, -1).map((r) => r.netCashFlow),
    lastRow.netCashFlow + exitProceeds,
  ];

  const irrResult = equityInvested > 0 ? irr(irrCashFlows) : NaN;

  // NPV discounts the same cash flow stream
  const npvResult = equityInvested > 0 ? npv(irrCashFlows, discountRate) : 0;

  // ── Equity multiple ───────────────────────────────────────────────────────
  // (total cash received including exit) / equity invested
  const totalCashReceived =
    yearRows.reduce((sum, r) => sum + r.netCashFlow, 0) + exitProceeds;
  const equityMultiple = equityInvested > 0 ? totalCashReceived / equityInvested : 0;

  // ── Payback period ────────────────────────────────────────────────────────
  // Re-build cumulative from zero (payback against equity invested)
  let runningCF = 0;
  const paybackRows: YearRow[] = yearRows.map((r) => {
    runningCF += r.netCashFlow;
    return { ...r, cumulativeCashFlow: runningCF - equityInvested };
  });
  const paybackYrs = paybackPeriod(paybackRows);

  // ─────────────────────────────────────────────────────────────────────────

  return {
    acquisitionCosts,
    totalInvestment,
    equityInvested,
    loanToValue,

    grossAnnualIncome: yr1GrossIncome,
    managementFee: yr1ManagementFee,
    totalAnnualOpex: yr1AnnualOpex,
    totalAnnualExpenses: yr1TotalExpenses,
    noi: yr1Noi,
    annualDebtService: debtService,
    netCashFlowBeforeDebt: yr1Noi,
    netCashFlow: yr1NetCF,

    capRate,
    cashOnCashReturn,
    grossYield,
    roi,
    paybackYears: paybackYrs,
    irr: isFinite(irrResult) && !isNaN(irrResult) ? irrResult : NaN,
    npv: npvResult,
    equityMultiple,
    breakEvenOccupancy: breakEven,

    exitSalePrice: lastRow.exitSalePrice ?? lastRow.propertyValue,
    exitProceeds,

    yearRows,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Convenience: calculate all three scenarios at once
// ─────────────────────────────────────────────────────────────────────────────

export interface ScenarioResults {
  conservative: ModelResults;
  base: ModelResults;
  optimistic: ModelResults;
}

/**
 * Computes Conservative / Base / Optimistic results from a single set of
 * base inputs and per-scenario overrides (user-customisable).
 */
export function calculateScenarios(
  baseInputs: ModelInputs,
  overrides: Record<ScenarioKey, ScenarioOverrides>,
): ScenarioResults {
  return {
    conservative: calculateModel(applyScenario(baseInputs, overrides.conservative)),
    base: calculateModel(applyScenario(baseInputs, overrides.base)),
    optimistic: calculateModel(applyScenario(baseInputs, overrides.optimistic)),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Expense breakdown helper (for pie chart)
// ─────────────────────────────────────────────────────────────────────────────

export interface ExpenseSlice {
  key: string;
  labelEn: string;
  labelRu: string;
  value: number;       // annual THB
  percentage: number;  // % of total expenses
}

export function expenseBreakdown(inputs: ModelInputs, results: ModelResults): ExpenseSlice[] {
  const { utilities, maintenance, insurance, hoa } = inputs;
  const total = results.totalAnnualExpenses;

  const slices: Omit<ExpenseSlice, 'percentage'>[] = [
    { key: 'management', labelEn: 'Management Fee', labelRu: 'Управление', value: results.managementFee },
    { key: 'utilities',  labelEn: 'Utilities',       labelRu: 'Коммунальные', value: utilities * 12 },
    { key: 'maintenance',labelEn: 'Maintenance',     labelRu: 'Обслуживание', value: maintenance * 12 },
    { key: 'insurance',  labelEn: 'Insurance',        labelRu: 'Страховка',   value: insurance * 12 },
    { key: 'hoa',        labelEn: 'HOA Fees',         labelRu: 'Взносы HOA',  value: hoa * 12 },
  ];

  return slices
    .filter((s) => s.value > 0)
    .map((s) => ({ ...s, percentage: total > 0 ? (s.value / total) * 100 : 0 }));
}
