/**
 * Quick smoke-test for calculateModel().
 * Run with: npx tsx src/lib/finance/__test_run__.ts
 */
import {
  calculateModel,
  DEFAULT_INPUTS,
  type ModelInputs,
  annualDebtService,
  irr,
  npv,
} from './calculations';

// ─── Test case ────────────────────────────────────────────────────────────────
// Purchase price:   5,000,000 THB
// Total costs:        500,000 THB  (as renovation/fit-out)
// Monthly rent:        45,000 THB
// Occupancy:              75 %
// Monthly opex:         8,000 THB  (split across 4 categories)
// Holding period:          10 years
// No loan
// Rent growth:             3 % / yr
// Expense growth:          2 % / yr
// Exit price:       7,500,000 THB  → implies ~4.14% annual appreciation

// Derive appreciation rate to hit exit price in 10 years
const exitPrice = 7_500_000;
const purchasePrice = 5_000_000;
const holdingPeriod = 10;
const impliedAppreciation = (Math.pow(exitPrice / purchasePrice, 1 / holdingPeriod) - 1) * 100;

const inputs: ModelInputs = {
  ...DEFAULT_INPUTS,
  purchasePrice,
  transferFeeRate: 0,        // zero out default fees
  legalFee: 0,
  agentFeeRate: 0,
  renovationBudget: 500_000, // <- the 500K total costs
  furnitureEquipment: 0,
  loanAmount: 0,
  interestRate: 0,
  loanTermYears: 0,
  monthlyRent: 45_000,
  occupancyRate: 75,
  managementFeeRate: 0,      // not specified in test case
  annualRentGrowth: 3,
  utilities:   2_000,        // 8,000 / month split evenly
  maintenance: 2_000,
  insurance:   2_000,
  hoa:         2_000,
  annualExpenseGrowth: 2,
  holdingPeriod,
  propertyAppreciation: impliedAppreciation,
  useExitCapRate: false,
  discountRate: 8,
};

const R = calculateModel(inputs);

// ─── Output ───────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  isFinite(n) && !isNaN(n)
    ? `฿ ${Math.round(n).toLocaleString('en-US')}`
    : '—';
const pct = (n: number) =>
  isFinite(n) && !isNaN(n) ? `${n.toFixed(2)}%` : '—';
const yr = (n: number) =>
  isFinite(n) && !isNaN(n) ? `${n.toFixed(1)} yrs` : 'Never (operating CF only)';

console.log('\n══════════════════════════════════════════════════');
console.log('  ASSET FINANCIAL MODEL — TEST CASE');
console.log('══════════════════════════════════════════════════\n');

console.log('── INVESTMENT SUMMARY ──────────────────────────');
console.log(`  Purchase price         ${fmt(inputs.purchasePrice)}`);
console.log(`  Total costs (reno)     ${fmt(R.acquisitionCosts + inputs.renovationBudget)}`);
console.log(`  Total investment       ${fmt(R.totalInvestment)}`);
console.log(`  Equity invested        ${fmt(R.equityInvested)}`);
console.log(`  Loan amount            ${fmt(inputs.loanAmount)}`);

console.log('\n── YEAR 1 INCOME STATEMENT ─────────────────────');
console.log(`  Gross annual income    ${fmt(R.grossAnnualIncome)}`);
console.log(`    Monthly rent ×12×occ ${fmt(inputs.monthlyRent)} × 12 × ${inputs.occupancyRate}%`);
console.log(`  Annual opex            ${fmt(R.totalAnnualOpex)}`);
console.log(`  NOI                    ${fmt(R.noi)}`);
console.log(`  Annual debt service    ${fmt(R.annualDebtService)}`);
console.log(`  Net cash flow          ${fmt(R.netCashFlow)}`);

console.log('\n── KEY PERFORMANCE INDICATORS ──────────────────');
console.log(`  Cap Rate               ${pct(R.capRate)}       (NOI ÷ purchase price)`);
console.log(`  Gross Yield            ${pct(R.grossYield)}       (gross income ÷ purchase price)`);
console.log(`  Cash-on-Cash           ${pct(R.cashOnCashReturn)}       (net CF ÷ equity)`);
console.log(`  IRR                    ${pct(R.irr)}       (over ${holdingPeriod} yrs incl. exit)`);
console.log(`  NPV @ 8%               ${fmt(R.npv)}`);
console.log(`  Equity Multiple        ${isFinite(R.equityMultiple) ? R.equityMultiple.toFixed(2) + '×' : '—'}`);
console.log(`  Payback (ops CF only)  ${yr(R.paybackYears)}`);
console.log(`  Break-even occupancy   ${pct(R.breakEvenOccupancy)}`);

console.log('\n── EXIT ANALYSIS ───────────────────────────────');
console.log(`  Implied appreciation   ${pct(impliedAppreciation)}   /yr`);
console.log(`  Exit sale price        ${fmt(R.exitSalePrice)}`);
console.log(`  Exit proceeds          ${fmt(R.exitProceeds)}`);

console.log('\n── YEAR-BY-YEAR PROJECTION ─────────────────────');
console.log(
  '  Yr  Gross Income    Opex       NOI        Net CF     Cum CF (ops)  Property Value'
);
for (const row of R.yearRows) {
  const cumCFOps = row.cumulativeCashFlow; // cumulative from -equity
  const tag = row.isBreakEvenYear ? ' ← BREAK-EVEN' : row.isExitYear ? ' ← EXIT' : '';
  console.log(
    `  ${String(row.year).padStart(2)}  ` +
    `${String(Math.round(row.grossIncome)).padStart(10)}    ` +
    `${String(Math.round(row.totalExpenses)).padStart(8)}   ` +
    `${String(Math.round(row.noi)).padStart(8)}   ` +
    `${String(Math.round(row.netCashFlow)).padStart(8)}   ` +
    `${String(Math.round(cumCFOps)).padStart(12)}    ` +
    `${String(Math.round(row.propertyValue)).padStart(12)}` +
    tag
  );
  if (row.isExitYear && row.exitProceeds !== undefined) {
    console.log(
      `      Exit proceeds: ${fmt(row.exitProceeds)}  ` +
      `Total Year-10 return: ${fmt(row.totalReturnThisYear ?? 0)}`
    );
  }
}

console.log('\n── VALIDATION vs EXPECTED ──────────────────────');
const expected = { capRate: 8, payback: [9, 11], irr: [12, 15] };
console.log(`  Cap Rate:  ${pct(R.capRate)}  (expected ~${expected.capRate}%)`);
console.log(`  Payback:   ${yr(R.paybackYears)}  (expected ~9-11 yrs; note: ops CF only, no exit)`);
console.log(`  IRR:       ${pct(R.irr)}  (expected ~12-15%)`);
console.log(`\n  ⚠  Deltas explained below.`);
console.log('══════════════════════════════════════════════════\n');
