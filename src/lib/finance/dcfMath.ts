/**
 * Multi-year DCF, IRR, NPV, Payback, MOIC engine.
 * Pure math — no React, no I/O.
 */

export interface DcfInput {
  year0NOI: number;            // Year-1 NOI (THB)
  year0NetIncome: number;      // Year-1 Net Income (after debt service & D&A)
  initialInvestment: number;   // Cash invested up-front (THB), positive
  holdYears: number;           // 1..30
  noiGrowthPct: number;        // annual NOI growth, e.g. 0.04 = 4%
  exitCapRatePct: number;      // exit cap rate, e.g. 0.07 = 7%
  discountRatePct: number;     // discount rate for NPV, e.g. 0.10 = 10%
  sellingCostPct?: number;     // % of terminal sale price (default 3%)
  loanBalanceAtExit?: number;  // remaining principal at exit
}

export interface DcfYearRow {
  year: number;
  noi: number;
  netIncome: number;
  terminalValue: number; // 0 except final year
  netCashFlow: number;   // netIncome + terminalValue - sellingCosts - loanPayoff (final year only)
  discountFactor: number;
  pv: number;            // present value of netCashFlow
}

export interface DcfResult {
  rows: DcfYearRow[];
  totals: {
    npv: number;                    // NPV at discountRate
    irr: number | null;             // levered IRR (0..1) — null if no convergence
    payback: number | null;         // years to recover initial investment (linear)
    moic: number;                   // (sum of distributions + terminal proceeds) / initial
    terminalValue: number;          // gross terminal sale price
    netExitProceeds: number;        // terminal − selling costs − loan payoff
    sumDistributions: number;       // sum of yearly netIncome over hold
  };
}

/**
 * Compute IRR via Newton-Raphson with bisection fallback.
 * cashflows[0] is initial outflow (negative), cashflows[1..] are inflows.
 */
export function computeIRR(cashflows: number[], guess = 0.1): number | null {
  if (!cashflows.length || cashflows[0] >= 0) return null;
  const npvAt = (rate: number) => cashflows.reduce((s, cf, t) => s + cf / Math.pow(1 + rate, t), 0);
  const npvDeriv = (rate: number) => cashflows.reduce((s, cf, t) => s - (t * cf) / Math.pow(1 + rate, t + 1), 0);

  // Newton-Raphson
  let rate = guess;
  for (let i = 0; i < 100; i++) {
    const f = npvAt(rate);
    const fp = npvDeriv(rate);
    if (Math.abs(fp) < 1e-12) break;
    const next = rate - f / fp;
    if (!Number.isFinite(next)) break;
    if (Math.abs(next - rate) < 1e-7) return next;
    rate = next;
    if (rate < -0.99) rate = -0.99;
  }
  // Bisection fallback in [-0.99, 10]
  let lo = -0.99, hi = 10;
  let fLo = npvAt(lo), fHi = npvAt(hi);
  if (fLo * fHi > 0) return null;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const fMid = npvAt(mid);
    if (Math.abs(fMid) < 1e-4) return mid;
    if (fLo * fMid < 0) { hi = mid; fHi = fMid; }
    else { lo = mid; fLo = fMid; }
  }
  return (lo + hi) / 2;
}

export function computeNPV(cashflows: number[], discountRate: number): number {
  return cashflows.reduce((s, cf, t) => s + cf / Math.pow(1 + discountRate, t), 0);
}

export function computeDCF(input: DcfInput): DcfResult {
  const {
    year0NOI, year0NetIncome, initialInvestment, holdYears,
    noiGrowthPct, exitCapRatePct, discountRatePct,
    sellingCostPct = 0.03, loanBalanceAtExit = 0,
  } = input;

  const rows: DcfYearRow[] = [];
  let cumulativeCash = -initialInvestment;
  let payback: number | null = null;

  for (let y = 1; y <= holdYears; y++) {
    const growth = Math.pow(1 + noiGrowthPct, y - 1);
    const noi = year0NOI * growth;
    const netIncome = year0NetIncome * growth;
    const isFinal = y === holdYears;

    let terminalValue = 0;
    let netCashFlow = netIncome;

    if (isFinal && exitCapRatePct > 0) {
      // Terminal value based on year+1 NOI (going-in cap method)
      const noiNext = noi * (1 + noiGrowthPct);
      terminalValue = noiNext / exitCapRatePct;
      const sellingCosts = terminalValue * sellingCostPct;
      const netExit = terminalValue - sellingCosts - loanBalanceAtExit;
      netCashFlow = netIncome + netExit;
    }

    const discountFactor = 1 / Math.pow(1 + discountRatePct, y);
    const pv = netCashFlow * discountFactor;
    rows.push({ year: y, noi, netIncome, terminalValue, netCashFlow, discountFactor, pv });

    if (payback === null) {
      const before = cumulativeCash;
      cumulativeCash += netIncome; // payback uses operating cash, not exit proceeds
      if (before < 0 && cumulativeCash >= 0) {
        const fraction = -before / Math.max(netIncome, 0.0001);
        payback = (y - 1) + Math.min(1, fraction);
      }
    }
  }

  const cashflowsForIRR = [-initialInvestment, ...rows.map(r => r.netCashFlow)];
  const npv = computeNPV(cashflowsForIRR, discountRatePct);
  const irr = computeIRR(cashflowsForIRR);
  const sumDistributions = rows.reduce((s, r) => s + r.netIncome, 0);
  const lastRow = rows[rows.length - 1];
  const terminalValue = lastRow?.terminalValue ?? 0;
  const sellingCosts = terminalValue * sellingCostPct;
  const netExitProceeds = terminalValue - sellingCosts - loanBalanceAtExit;
  const moic = initialInvestment > 0 ? (sumDistributions + netExitProceeds) / initialInvestment : 0;

  return {
    rows,
    totals: { npv, irr, payback, moic, terminalValue, netExitProceeds, sumDistributions },
  };
}

/**
 * Sensitivity (tornado) — vary one variable ±range, return NPV/IRR deltas.
 */
export interface SensitivityRow {
  variable: string;
  lowValue: number;
  highValue: number;
  lowNPV: number;
  highNPV: number;
  lowIRR: number | null;
  highIRR: number | null;
  spread: number;
}

export function computeSensitivity(base: DcfInput, deltaPct = 0.2): SensitivityRow[] {
  const variations: Array<{ key: keyof DcfInput; label: string }> = [
    { key: 'year0NOI', label: 'NOI (Year 1)' },
    { key: 'noiGrowthPct', label: 'NOI Growth %' },
    { key: 'exitCapRatePct', label: 'Exit Cap Rate' },
    { key: 'discountRatePct', label: 'Discount Rate' },
    { key: 'initialInvestment', label: 'Initial Investment' },
  ];

  const baseResult = computeDCF(base);

  return variations.map(({ key, label }) => {
    const baseValue = base[key] as number;
    const lowValue = baseValue * (1 - deltaPct);
    const highValue = baseValue * (1 + deltaPct);

    const lowInput = { ...base, [key]: lowValue };
    const highInput = { ...base, [key]: highValue };
    const lowR = computeDCF(lowInput);
    const highR = computeDCF(highInput);

    return {
      variable: label,
      lowValue,
      highValue,
      lowNPV: lowR.totals.npv,
      highNPV: highR.totals.npv,
      lowIRR: lowR.totals.irr,
      highIRR: highR.totals.irr,
      spread: Math.abs(highR.totals.npv - lowR.totals.npv),
    };
  }).sort((a, b) => b.spread - a.spread);
}

/**
 * Monte Carlo simulation — vary key inputs by triangular distribution.
 * Returns distribution of NPV and IRR.
 */
export interface MonteCarloResult {
  iterations: number;
  npvSamples: number[];
  irrSamples: number[];
  npvStats: { mean: number; median: number; p10: number; p90: number; stdev: number; probPositive: number };
  irrStats: { mean: number; median: number; p10: number; p90: number; stdev: number; probAbove: number };
  irrAboveTarget: number;
}

function triangular(min: number, mode: number, max: number): number {
  const u = Math.random();
  const c = (mode - min) / (max - min);
  if (u < c) return min + Math.sqrt(u * (max - min) * (mode - min));
  return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
}

function pct(arr: number[], p: number): number {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor(p * sorted.length)));
  return sorted[idx];
}

function stats(arr: number[]): { mean: number; median: number; p10: number; p90: number; stdev: number } {
  if (!arr.length) return { mean: 0, median: 0, p10: 0, p90: 0, stdev: 0 };
  const mean = arr.reduce((s, x) => s + x, 0) / arr.length;
  const variance = arr.reduce((s, x) => s + (x - mean) ** 2, 0) / arr.length;
  return {
    mean,
    median: pct(arr, 0.5),
    p10: pct(arr, 0.1),
    p90: pct(arr, 0.9),
    stdev: Math.sqrt(variance),
  };
}

export function runMonteCarlo(base: DcfInput, iterations = 1000, irrTarget = 0.12): MonteCarloResult {
  const npvSamples: number[] = [];
  const irrSamples: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const sample: DcfInput = {
      ...base,
      year0NOI: triangular(base.year0NOI * 0.8, base.year0NOI, base.year0NOI * 1.15),
      noiGrowthPct: triangular(Math.max(-0.05, base.noiGrowthPct - 0.04), base.noiGrowthPct, base.noiGrowthPct + 0.04),
      exitCapRatePct: triangular(Math.max(0.03, base.exitCapRatePct - 0.015), base.exitCapRatePct, base.exitCapRatePct + 0.02),
    };
    const r = computeDCF(sample);
    npvSamples.push(r.totals.npv);
    if (r.totals.irr !== null && Number.isFinite(r.totals.irr)) irrSamples.push(r.totals.irr);
  }

  const npvSt = stats(npvSamples);
  const irrSt = stats(irrSamples);
  const probPositive = npvSamples.filter(x => x > 0).length / Math.max(npvSamples.length, 1);
  const probAbove = irrSamples.filter(x => x >= irrTarget).length / Math.max(irrSamples.length, 1);

  return {
    iterations,
    npvSamples,
    irrSamples,
    npvStats: { ...npvSt, probPositive },
    irrStats: { ...irrSt, probAbove },
    irrAboveTarget: irrTarget,
  };
}
