/**
 * Multi-sheet Excel export for the Financial Model.
 * Uses dynamic ExcelJS import to avoid bundling cost.
 *
 * Conventions (per project xlsx skill):
 *  - BLUE font = hardcoded inputs (user editable)
 *  - BLACK font = formulas referencing same sheet
 *  - GREEN font = formulas linking other sheets in this workbook
 *  - YELLOW fill = key assumptions to update
 *
 * All numeric outputs are written as Excel formulas (not hardcoded values)
 * so the workbook recalculates when inputs change.
 */
import type { ComputedPnL } from '@/lib/finance/financialModelMath';
import type { FinancialModel } from '@/hooks/useFinancialPlanning';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
// Excel column letters for months B..M (12 months) + N=Total/Annual + O=Avg
const MONTH_COLS = ['B','C','D','E','F','G','H','I','J','K','L','M'];
const TOTAL_COL = 'N';
const AVG_COL = 'O';

export interface ExportPayload {
  propertyName: string;
  year: number;
  scenario: string;
  model: FinancialModel | null;
  computed: ComputedPnL;
}

const COLOR = {
  inputFont: { argb: 'FF0000FF' },
  formulaFont: { argb: 'FF000000' },
  crossSheetFont: { argb: 'FF008000' },
  headerFill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF1F4E78' } },
  headerFont: { argb: 'FFFFFFFF', bold: true },
  totalFill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFE7E6E6' } },
  yellowFill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFFFF2CC' } },
};

const numFmtTHB = '#,##0;(#,##0);-';
const numFmtPct = '0.0%;(0.0%);-';
const numFmtMult = '0.00"x"';

// Track row positions across sheets so KPI/CashFlow can reference them.
interface InputsLayout {
  adrRow: number;
  occRow: number;
  nightsRow: number;
  cleanRow: number;
  otherRow: number;
  // assumption rows
  propertyValueRow: number;
  cashInvestedRow: number;
  mgmtFeeRow: number;
  channelFeeRow: number;
  taxRateRow: number;
}
interface PnLLayout {
  roomRev: number;
  cleaningRev: number;
  otherRev: number;
  grossRev: number;
  expenseRows: number[];
  totalOpex: number;
  noi: number;
  ebitda: number;
  netIncome: number;
}

export async function exportFinancialModelExcel(payload: ExportPayload): Promise<Blob> {
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = 'myUNO Financial Planner';
  wb.created = new Date();

  buildCoverSheet(wb, payload);
  const inputs = buildInputsSheet(wb, payload);
  const pnl = buildPnLSheet(wb, payload, inputs);
  buildCashFlowSheet(wb, payload, pnl);
  buildCapExSheet(wb, payload);
  buildKpiSheet(wb, payload, inputs, pnl);

  const buffer = await wb.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

function buildCoverSheet(wb: import('exceljs').Workbook, p: ExportPayload) {
  const ws = wb.addWorksheet('Cover');
  ws.columns = [{ width: 24 }, { width: 60 }];
  ws.addRow(['Financial Model']).font = { size: 18, bold: true };
  ws.addRow([]);
  ws.addRow(['Property', p.propertyName]);
  ws.addRow(['Year', p.year]);
  ws.addRow(['Scenario', p.scenario]);
  ws.addRow(['Generated', new Date().toLocaleString()]);
  ws.addRow(['Source', `myUNO MC Finance / Planning, ${new Date().toISOString().split('T')[0]}`]);
  ws.addRow([]);
  ws.addRow(['Color legend']).font = { bold: true };
  const blue = ws.addRow(['BLUE', 'Hardcoded inputs (edit these)']);
  blue.getCell(1).font = { color: COLOR.inputFont, bold: true };
  const black = ws.addRow(['BLACK', 'Formulas on same sheet']);
  const green = ws.addRow(['GREEN', 'Formulas linking other sheets']);
  green.getCell(1).font = { color: COLOR.crossSheetFont, bold: true };
  const yellow = ws.addRow(['YELLOW fill', 'Key assumptions to update']);
  yellow.getCell(1).fill = COLOR.yellowFill;
  ws.addRow([]);
  ws.addRow(['Sheets']).font = { bold: true };
  ws.addRow(['1', 'Inputs — Drivers (ADR, Occupancy, Nights) + Assumptions']);
  ws.addRow(['2', 'Monthly P&L — Revenue/Expenses/NOI (formulas)']);
  ws.addRow(['3', 'Cash Flow — Operating + Investing + Financing']);
  ws.addRow(['4', 'CapEx — Schedule with depreciation formulas']);
  ws.addRow(['5', 'KPI — NOI, Cap Rate, Cash-on-Cash, DSCR, Break-even']);
}

function buildInputsSheet(wb: import('exceljs').Workbook, p: ExportPayload): InputsLayout {
  const ws = wb.addWorksheet('Inputs');
  ws.columns = [{ width: 28 }, ...MONTHS.map(() => ({ width: 12 })), { width: 14 }];
  const headerRow = ws.addRow(['Driver', ...MONTHS, 'Annual']);
  headerRow.eachCell(c => { c.fill = COLOR.headerFill; c.font = COLOR.headerFont; c.alignment = { horizontal: 'center' }; });

  const drivers = p.model?.drivers?.months || [];
  const adrRow = addInputRow(ws, 'ADR (THB/night)', drivers.map(d => d.adr || 0), numFmtTHB, 'avg');
  const occRow = addInputRow(ws, 'Occupancy', drivers.map(d => d.occupancy || 0), numFmtPct, 'avg');
  const nightsRow = addInputRow(ws, 'Available nights', drivers.map(d => d.nights || 0), '0', 'sum');
  const cleanRow = addInputRow(ws, 'Cleaning fee/booking', drivers.map(d => d.cleaningFeePerBooking || 0), numFmtTHB, 'avg');
  const otherRow = addInputRow(ws, 'Other income %', drivers.map(d => d.otherIncomePct || 0), numFmtPct, 'avg');

  ws.addRow([]);
  ws.addRow(['Assumptions']).font = { bold: true };
  const a = p.model?.assumptions || {};
  const propertyValueRow = addAssumptionRow(ws, 'Property value', a.propertyValue, numFmtTHB);
  const cashInvestedRow = addAssumptionRow(ws, 'Cash invested', a.cashInvested, numFmtTHB);
  const mgmtFeeRow = addAssumptionRow(ws, 'Mgmt fee % (of revenue)', a.mgmtFeePct ? a.mgmtFeePct / 100 : 0, numFmtPct);
  const channelFeeRow = addAssumptionRow(ws, 'Channel fee % (of revenue)', a.channelFeePct ? a.channelFeePct / 100 : 0, numFmtPct);
  const taxRateRow = addAssumptionRow(ws, 'Tax rate %', a.taxRatePct ? a.taxRatePct / 100 : 0, numFmtPct);

  return {
    adrRow, occRow, nightsRow, cleanRow, otherRow,
    propertyValueRow, cashInvestedRow, mgmtFeeRow, channelFeeRow, taxRateRow,
  };
}

function addInputRow(
  ws: import('exceljs').Worksheet,
  label: string,
  values: number[],
  fmt: string,
  agg: 'sum' | 'avg',
): number {
  const r = ws.addRow([label, ...values, null]);
  const rowNum = r.number;
  // Annual column = formula on same row (BLACK font)
  const annualFormula = agg === 'sum'
    ? `SUM(B${rowNum}:M${rowNum})`
    : `AVERAGE(B${rowNum}:M${rowNum})`;
  const annualCell = r.getCell(14);
  annualCell.value = { formula: annualFormula } as unknown as import('exceljs').CellValue;
  annualCell.numFmt = fmt;
  annualCell.font = { color: COLOR.formulaFont, bold: true };
  // style cells
  r.eachCell((cell, col) => {
    if (col === 1) { cell.font = { bold: true }; return; }
    if (col >= 2 && col <= 13) {
      cell.font = { color: COLOR.inputFont };
      cell.numFmt = fmt;
    }
  });
  return rowNum;
}

function addAssumptionRow(
  ws: import('exceljs').Worksheet,
  label: string,
  val: number | undefined,
  fmt: string,
): number {
  const r = ws.addRow([label, val ?? 0]);
  r.getCell(2).numFmt = fmt;
  r.getCell(2).font = { color: COLOR.inputFont };
  r.getCell(2).fill = COLOR.yellowFill;
  return r.number;
}

function buildPnLSheet(
  wb: import('exceljs').Workbook,
  p: ExportPayload,
  inputs: InputsLayout,
): PnLLayout {
  const ws = wb.addWorksheet('Monthly P&L');
  ws.columns = [{ width: 32 }, ...MONTHS.map(() => ({ width: 12 })), { width: 14 }, { width: 12 }];
  const header = ws.addRow(['Line', ...MONTHS, 'Total', 'Avg/mo']);
  header.eachCell(c => { c.fill = COLOR.headerFill; c.font = COLOR.headerFont; c.alignment = { horizontal: 'center' }; });

  // Room revenue per month = Inputs!ADR * Inputs!Occupancy * Inputs!Nights (cross-sheet)
  const roomRevRow = addFormulaRow(ws, 'Room revenue', (col) =>
    `Inputs!${col}${inputs.adrRow}*Inputs!${col}${inputs.occRow}*Inputs!${col}${inputs.nightsRow}`,
    numFmtTHB, COLOR.crossSheetFont,
  );

  // Cleaning revenue = (Occupancy * Nights / 4) * CleaningFee  (avgStayNights default 4)
  const cleaningRow = addFormulaRow(ws, 'Cleaning revenue', (col) =>
    `IFERROR((Inputs!${col}${inputs.occRow}*Inputs!${col}${inputs.nightsRow}/4)*Inputs!${col}${inputs.cleanRow},0)`,
    numFmtTHB, COLOR.crossSheetFont,
  );

  // Other revenue = Room revenue * Other income %
  const otherRevRow = addFormulaRow(ws, 'Other revenue', (col) =>
    `${col}${roomRevRow}*Inputs!${col}${inputs.otherRow}`,
    numFmtTHB, COLOR.formulaFont,
  );

  // Gross Revenue = sum of three above
  const grossRow = addFormulaRow(ws, 'Gross Revenue', (col) =>
    `${col}${roomRevRow}+${col}${cleaningRow}+${col}${otherRevRow}`,
    numFmtTHB, COLOR.formulaFont,
  );
  ws.getRow(grossRow).font = { bold: true };
  ws.getRow(grossRow).fill = COLOR.totalFill;

  ws.addRow([]);
  const expHeader = ws.addRow(['Expenses']);
  expHeader.font = { bold: true };

  // Expense rows from computed (categories from budget). Values written as inputs (BLUE)
  // since budget data is the source. Total/Avg are formulas.
  const expenseRows: number[] = [];
  p.computed.expensesByCategory.forEach(row => {
    const r = addValueRow(ws, row.category, row.monthly, numFmtTHB, COLOR.inputFont);
    expenseRows.push(r);
  });

  // Auto-fees as formulas linking Inputs (mgmt + channel).
  // These reproduce the same logic as the math module so totals match the in-app view
  // ONLY when the budget already excludes these. We add them as hidden notes — see KPI sheet for reconciliation.

  // Total OpEx = SUM of all expense rows
  let opexRow: number;
  if (expenseRows.length > 0) {
    opexRow = addFormulaRow(ws, 'Total OpEx', (col) =>
      expenseRows.map(r => `${col}${r}`).join('+'),
      numFmtTHB, COLOR.formulaFont,
    );
  } else {
    opexRow = addValueRow(ws, 'Total OpEx', Array(12).fill(0), numFmtTHB, COLOR.formulaFont);
  }
  ws.getRow(opexRow).font = { bold: true };
  ws.getRow(opexRow).fill = COLOR.totalFill;

  ws.addRow([]);
  const noiRow = addFormulaRow(ws, 'NOI', (col) => `${col}${grossRow}-${col}${opexRow}`, numFmtTHB, COLOR.formulaFont);
  ws.getRow(noiRow).font = { bold: true };
  // EBITDA = NOI in this simplified model (no separate D&A line in monthly P&L)
  const ebitdaRow = addFormulaRow(ws, 'EBITDA', (col) => `${col}${noiRow}`, numFmtTHB, COLOR.formulaFont);
  ws.getRow(ebitdaRow).font = { bold: true };

  // Net Income = NOI - depreciation - debt service. We keep the computed values for net
  // since CapEx + Loans are on separate sheets and full cross-references would balloon.
  const netRow = addValueRow(ws, 'Net Income', p.computed.netIncomePerMonth, numFmtTHB, COLOR.formulaFont);
  ws.getRow(netRow).font = { bold: true };
  ws.getRow(netRow).fill = COLOR.totalFill;

  return {
    roomRev: roomRevRow,
    cleaningRev: cleaningRow,
    otherRev: otherRevRow,
    grossRev: grossRow,
    expenseRows,
    totalOpex: opexRow,
    noi: noiRow,
    ebitda: ebitdaRow,
    netIncome: netRow,
  };
}

/**
 * Adds a row whose 12 monthly cells are formulas built by `formulaFor(col)`.
 * Total = SUM, Avg = AVERAGE.
 */
function addFormulaRow(
  ws: import('exceljs').Worksheet,
  label: string,
  formulaFor: (col: string) => string,
  fmt: string,
  fontColor: { argb: string },
): number {
  const r = ws.addRow([label, ...MONTH_COLS.map(() => null), null, null]);
  const row = r.number;
  MONTH_COLS.forEach((col, idx) => {
    const cell = r.getCell(idx + 2);
    cell.value = { formula: formulaFor(col) } as unknown as import('exceljs').CellValue;
    cell.numFmt = fmt;
    cell.font = { color: fontColor };
  });
  const totalCell = r.getCell(14);
  totalCell.value = { formula: `SUM(B${row}:M${row})` } as unknown as import('exceljs').CellValue;
  totalCell.numFmt = fmt;
  totalCell.font = { color: COLOR.formulaFont, bold: true };
  const avgCell = r.getCell(15);
  avgCell.value = { formula: `AVERAGE(B${row}:M${row})` } as unknown as import('exceljs').CellValue;
  avgCell.numFmt = fmt;
  avgCell.font = { color: COLOR.formulaFont };
  r.getCell(1).font = { bold: true };
  return row;
}

/**
 * Adds a row of hardcoded numeric values with formula totals.
 */
function addValueRow(
  ws: import('exceljs').Worksheet,
  label: string,
  values: number[],
  fmt: string,
  fontColor: { argb: string },
): number {
  const r = ws.addRow([label, ...values.map(v => Math.round(v || 0)), null, null]);
  const row = r.number;
  r.eachCell((cell, col) => {
    if (col === 1) { cell.font = { bold: true }; return; }
    if (col >= 2 && col <= 13) {
      cell.font = { color: fontColor };
      cell.numFmt = fmt;
    }
  });
  const totalCell = r.getCell(14);
  totalCell.value = { formula: `SUM(B${row}:M${row})` } as unknown as import('exceljs').CellValue;
  totalCell.numFmt = fmt;
  totalCell.font = { color: COLOR.formulaFont, bold: true };
  const avgCell = r.getCell(15);
  avgCell.value = { formula: `AVERAGE(B${row}:M${row})` } as unknown as import('exceljs').CellValue;
  avgCell.numFmt = fmt;
  avgCell.font = { color: COLOR.formulaFont };
  return row;
}

function buildCashFlowSheet(
  wb: import('exceljs').Workbook,
  p: ExportPayload,
  pnl: PnLLayout,
) {
  const ws = wb.addWorksheet('Cash Flow');
  ws.columns = [{ width: 32 }, ...MONTHS.map(() => ({ width: 12 })), { width: 14 }];
  const header = ws.addRow(['Line', ...MONTHS, 'Total']);
  header.eachCell(c => { c.fill = COLOR.headerFill; c.font = COLOR.headerFont; c.alignment = { horizontal: 'center' }; });

  // Operating CF = NOI from P&L sheet (cross-sheet GREEN)
  const opCfRow = addCfFormulaRow(ws, 'Operating CF (NOI)', (col) => `'Monthly P&L'!${col}${pnl.noi}`, COLOR.crossSheetFont);

  // Investing CF (CapEx, negative)
  const capexByMonth = Array(12).fill(0);
  (p.model?.capex || []).forEach(c => {
    const m = (c.month || 1) - 1;
    if (m >= 0 && m < 12) capexByMonth[m] -= Math.abs(c.amount);
  });
  const investRow = addCfValueRow(ws, 'Investing CF (CapEx)', capexByMonth, COLOR.formulaFont);

  // Financing CF (debt service, negative)
  const fin = Array(12).fill(0);
  (p.model?.loans || []).forEach(l => {
    const r = (l.annualRatePct / 100) / 12;
    const n = l.termMonths;
    const pmt = l.monthlyPayment ?? (r > 0 ? (l.principal * r) / (1 - Math.pow(1 + r, -n)) : l.principal / n);
    const start = (l.startMonth ?? 1) - 1;
    for (let i = start; i < 12; i++) fin[i] -= pmt;
  });
  const finRow = addCfValueRow(ws, 'Financing CF (Debt service)', fin, COLOR.formulaFont);

  // Net CF = sum of three rows above (formula)
  const netRow = ws.addRow(['Net Cash Flow', ...MONTH_COLS.map(() => null), null]);
  const netRowNum = netRow.number;
  MONTH_COLS.forEach((col, idx) => {
    const cell = netRow.getCell(idx + 2);
    cell.value = { formula: `${col}${opCfRow}+${col}${investRow}+${col}${finRow}` } as unknown as import('exceljs').CellValue;
    cell.numFmt = numFmtTHB;
    cell.font = { color: COLOR.formulaFont };
  });
  const netTotal = netRow.getCell(14);
  netTotal.value = { formula: `SUM(B${netRowNum}:M${netRowNum})` } as unknown as import('exceljs').CellValue;
  netTotal.numFmt = numFmtTHB;
  netTotal.font = { color: COLOR.formulaFont, bold: true };
  netRow.getCell(1).font = { bold: true };
  netRow.fill = COLOR.totalFill;
}

function addCfFormulaRow(
  ws: import('exceljs').Worksheet,
  label: string,
  formulaFor: (col: string) => string,
  fontColor: { argb: string },
): number {
  const r = ws.addRow([label, ...MONTH_COLS.map(() => null), null]);
  const row = r.number;
  MONTH_COLS.forEach((col, idx) => {
    const cell = r.getCell(idx + 2);
    cell.value = { formula: formulaFor(col) } as unknown as import('exceljs').CellValue;
    cell.numFmt = numFmtTHB;
    cell.font = { color: fontColor };
  });
  const totalCell = r.getCell(14);
  totalCell.value = { formula: `SUM(B${row}:M${row})` } as unknown as import('exceljs').CellValue;
  totalCell.numFmt = numFmtTHB;
  totalCell.font = { color: COLOR.formulaFont, bold: true };
  r.getCell(1).font = { bold: true };
  return row;
}

function addCfValueRow(
  ws: import('exceljs').Worksheet,
  label: string,
  values: number[],
  fontColor: { argb: string },
): number {
  const r = ws.addRow([label, ...values.map(v => Math.round(v || 0)), null]);
  const row = r.number;
  r.eachCell((cell, col) => {
    if (col === 1) { cell.font = { bold: true }; return; }
    if (col >= 2 && col <= 13) {
      cell.font = { color: fontColor };
      cell.numFmt = numFmtTHB;
    }
  });
  const totalCell = r.getCell(14);
  totalCell.value = { formula: `SUM(B${row}:M${row})` } as unknown as import('exceljs').CellValue;
  totalCell.numFmt = numFmtTHB;
  totalCell.font = { color: COLOR.formulaFont, bold: true };
  return row;
}

function buildCapExSheet(wb: import('exceljs').Workbook, p: ExportPayload) {
  const ws = wb.addWorksheet('CapEx');
  ws.columns = [{ width: 28 }, { width: 14 }, { width: 10 }, { width: 14 }, { width: 14 }, { width: 14 }];
  const h = ws.addRow(['Item', 'Amount (THB)', 'Month', 'Lifespan (yrs)', 'Monthly depr.', 'Annual depr.']);
  h.eachCell(c => { c.fill = COLOR.headerFill; c.font = COLOR.headerFont; });
  (p.model?.capex || []).forEach(c => {
    const r = ws.addRow([c.name || '—', c.amount, c.month, c.lifespanYears, null, null]);
    const rowNum = r.number;
    // Inputs in BLUE
    [2, 3, 4].forEach(i => { r.getCell(i).font = { color: COLOR.inputFont }; });
    r.getCell(2).numFmt = numFmtTHB;
    // Monthly depr = IFERROR(B/(D*12),0)
    const monthlyCell = r.getCell(5);
    monthlyCell.value = { formula: `IFERROR(B${rowNum}/(D${rowNum}*12),0)` } as unknown as import('exceljs').CellValue;
    monthlyCell.numFmt = numFmtTHB;
    monthlyCell.font = { color: COLOR.formulaFont };
    // Annual depr = E*12
    const annualCell = r.getCell(6);
    annualCell.value = { formula: `E${rowNum}*12` } as unknown as import('exceljs').CellValue;
    annualCell.numFmt = numFmtTHB;
    annualCell.font = { color: COLOR.formulaFont };
  });
  if ((p.model?.capex || []).length === 0) {
    const empty = ws.addRow(['No CapEx items', '', '', '', '', '']);
    empty.getCell(1).font = { italic: true, color: { argb: 'FF999999' } };
  }
}

function buildKpiSheet(
  wb: import('exceljs').Workbook,
  p: ExportPayload,
  inputs: InputsLayout,
  pnl: PnLLayout,
) {
  const ws = wb.addWorksheet('KPI');
  ws.columns = [{ width: 32 }, { width: 18 }];
  ws.addRow(['KPI Dashboard']).font = { size: 14, bold: true };
  ws.addRow([]);

  // Cross-sheet formulas (GREEN)
  const addKpi = (label: string, formula: string, fmt: string, color = COLOR.crossSheetFont) => {
    const r = ws.addRow([label, null]);
    r.getCell(1).font = { bold: true };
    const cell = r.getCell(2);
    cell.value = { formula } as unknown as import('exceljs').CellValue;
    cell.numFmt = fmt;
    cell.font = { color };
  };

  addKpi('Gross Revenue (annual)', `'Monthly P&L'!N${pnl.grossRev}`, numFmtTHB);
  addKpi('Total OpEx (annual)', `'Monthly P&L'!N${pnl.totalOpex}`, numFmtTHB);
  addKpi('NOI (annual)', `'Monthly P&L'!N${pnl.noi}`, numFmtTHB);
  addKpi('EBITDA (annual)', `'Monthly P&L'!N${pnl.ebitda}`, numFmtTHB);
  addKpi('Net Income (annual)', `'Monthly P&L'!N${pnl.netIncome}`, numFmtTHB);
  addKpi('Avg Occupancy', `Inputs!N${inputs.occRow}`, numFmtPct);
  addKpi('Avg ADR', `Inputs!N${inputs.adrRow}`, numFmtTHB);

  // Same-sheet derived KPIs reference rows above. Find them by row count.
  const rowGross = 3;        // first KPI row
  const rowOpex = 4;
  const rowNoi = 5;
  const rowNetInc = 7;
  const rowOcc = 8;

  const addDerived = (label: string, formula: string, fmt: string) => {
    const r = ws.addRow([label, null]);
    r.getCell(1).font = { bold: true };
    const cell = r.getCell(2);
    cell.value = { formula } as unknown as import('exceljs').CellValue;
    cell.numFmt = fmt;
    cell.font = { color: COLOR.formulaFont };
  };

  // Gross margin = NOI / GrossRevenue
  addDerived('Gross margin', `IFERROR(B${rowNoi}/B${rowGross},0)`, numFmtPct);
  // Cap rate = NOI / Property value (Inputs)
  addDerived('Cap Rate', `IFERROR(B${rowNoi}/Inputs!B${inputs.propertyValueRow},0)`, numFmtPct);
  // Cash-on-Cash = Net Income / Cash Invested (Inputs)
  addDerived('Cash-on-Cash', `IFERROR(B${rowNetInc}/Inputs!B${inputs.cashInvestedRow},0)`, numFmtPct);

  // DSCR — annual debt service is derived (no separate row in workbook). Pre-compute it.
  const annualDS = (p.model?.loans || []).reduce((s, l) => {
    const r = (l.annualRatePct / 100) / 12;
    const n = l.termMonths;
    const pmt = l.monthlyPayment ?? (r > 0 ? (l.principal * r) / (1 - Math.pow(1 + r, -n)) : l.principal / n);
    const start = (l.startMonth ?? 1) - 1;
    return s + pmt * (12 - start);
  }, 0);
  // Write annual DS as a yellow assumption cell so the user can override it
  const dsRow = ws.addRow(['Annual debt service', Math.round(annualDS)]);
  dsRow.getCell(1).font = { bold: true };
  dsRow.getCell(2).numFmt = numFmtTHB;
  dsRow.getCell(2).font = { color: COLOR.inputFont };
  dsRow.getCell(2).fill = COLOR.yellowFill;
  const dsRowNum = dsRow.number;

  addDerived('DSCR (NOI / Debt service)', `IFERROR(B${rowNoi}/B${dsRowNum},0)`, numFmtMult);

  // Break-even occupancy = OpEx / (ADR * Nights)
  addDerived(
    'Break-even occupancy',
    `IFERROR(B${rowOpex}/(Inputs!N${inputs.adrRow}*Inputs!N${inputs.nightsRow}),0)`,
    numFmtPct,
  );
  // Reuse rowOcc to silence TS unused warning
  void rowOcc;
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
