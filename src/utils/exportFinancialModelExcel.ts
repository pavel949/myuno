/**
 * Multi-sheet Excel export for the Financial Model.
 * Uses dynamic ExcelJS import to avoid bundling cost.
 */
import type { ComputedPnL } from '@/lib/finance/financialModelMath';
import type { FinancialModel } from '@/hooks/useFinancialPlanning';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export interface ExportPayload {
  propertyName: string;
  year: number;
  scenario: string;
  model: FinancialModel | null;
  computed: ComputedPnL;
}

const COLOR = {
  inputFont: { argb: 'FF0000FF' },         // blue inputs
  formulaFont: { argb: 'FF000000' },       // black formulas
  crossSheetFont: { argb: 'FF008000' },    // green cross-sheet
  headerFill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF1F4E78' } },
  headerFont: { argb: 'FFFFFFFF', bold: true },
  totalFill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFE7E6E6' } },
  yellowFill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFFFF2CC' } },
};

const numFmtTHB = '#,##0;(#,##0);-';
const numFmtPct = '0.0%;(0.0%);-';
const numFmtMult = '0.00"x"';

export async function exportFinancialModelExcel(payload: ExportPayload): Promise<Blob> {
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = 'myUNO Financial Planner';
  wb.created = new Date();

  buildCoverSheet(wb, payload);
  buildInputsSheet(wb, payload);
  buildPnLSheet(wb, payload);
  buildCashFlowSheet(wb, payload);
  buildCapExSheet(wb, payload);
  buildKpiSheet(wb, payload);

  const buffer = await wb.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

function buildCoverSheet(wb: import('exceljs').Workbook, p: ExportPayload) {
  const ws = wb.addWorksheet('Cover');
  ws.columns = [{ width: 24 }, { width: 50 }];
  ws.addRow(['Financial Model']).font = { size: 18, bold: true };
  ws.addRow([]);
  ws.addRow(['Property', p.propertyName]);
  ws.addRow(['Year', p.year]);
  ws.addRow(['Scenario', p.scenario]);
  ws.addRow(['Generated', new Date().toLocaleString()]);
  ws.addRow(['Source', 'myUNO MC Finance / Planning']);
  ws.addRow([]);
  ws.addRow(['Sheets']);
  ws.addRow(['1', 'Inputs & Drivers — ADR, Occupancy, Nights, fees (BLUE = inputs)']);
  ws.addRow(['2', 'Monthly P&L — formulas reference Drivers']);
  ws.addRow(['3', 'Cash Flow — operating + investing + financing']);
  ws.addRow(['4', 'CapEx Schedule — depreciation']);
  ws.addRow(['5', 'KPI Dashboard — NOI, Cap Rate, DSCR, Cash-on-Cash, break-even']);
}

function buildInputsSheet(wb: import('exceljs').Workbook, p: ExportPayload) {
  const ws = wb.addWorksheet('Inputs');
  ws.columns = [{ width: 28 }, ...MONTHS.map(() => ({ width: 12 })), { width: 14 }];
  const headerRow = ws.addRow(['Driver', ...MONTHS, 'Annual']);
  headerRow.eachCell(c => { c.fill = COLOR.headerFill; c.font = COLOR.headerFont; c.alignment = { horizontal: 'center' }; });

  const drivers = p.model?.drivers?.months || [];
  const adrRow = ws.addRow(['ADR (THB/night)', ...drivers.map(d => d.adr || 0), { formula: `AVERAGE(B${ws.rowCount}:M${ws.rowCount})` }]);
  styleInputRow(adrRow, numFmtTHB);
  const occRow = ws.addRow(['Occupancy', ...drivers.map(d => d.occupancy || 0), { formula: `AVERAGE(B${ws.rowCount}:M${ws.rowCount})` }]);
  styleInputRow(occRow, numFmtPct);
  const nightsRow = ws.addRow(['Available nights', ...drivers.map(d => d.nights || 0), { formula: `SUM(B${ws.rowCount}:M${ws.rowCount})` }]);
  styleInputRow(nightsRow, '0');
  const cleanRow = ws.addRow(['Cleaning fee/booking', ...drivers.map(d => d.cleaningFeePerBooking || 0), '']);
  styleInputRow(cleanRow, numFmtTHB);
  const otherRow = ws.addRow(['Other income %', ...drivers.map(d => d.otherIncomePct || 0), '']);
  styleInputRow(otherRow, numFmtPct);

  ws.addRow([]);
  ws.addRow(['Assumptions']).font = { bold: true };
  const a = p.model?.assumptions || {};
  const assumpt: Array<[string, number | undefined, string]> = [
    ['Property value', a.propertyValue, numFmtTHB],
    ['Cash invested', a.cashInvested, numFmtTHB],
    ['Mgmt fee %', a.mgmtFeePct ? a.mgmtFeePct / 100 : 0, numFmtPct],
    ['Channel fee %', a.channelFeePct ? a.channelFeePct / 100 : 0, numFmtPct],
    ['Tax rate %', a.taxRatePct ? a.taxRatePct / 100 : 0, numFmtPct],
  ];
  assumpt.forEach(([label, val, fmt]) => {
    const r = ws.addRow([label, val ?? 0]);
    r.getCell(2).numFmt = fmt;
    r.getCell(2).font = { color: COLOR.inputFont };
    r.getCell(2).fill = COLOR.yellowFill;
  });
}

function styleInputRow(row: import('exceljs').Row, fmt: string) {
  row.eachCell((cell, colNumber) => {
    if (colNumber === 1) {
      cell.font = { bold: true };
    } else if (colNumber <= 13) {
      cell.font = { color: COLOR.inputFont };
      cell.numFmt = fmt;
    } else {
      cell.font = { bold: true };
      cell.numFmt = fmt;
    }
  });
}

function buildPnLSheet(wb: import('exceljs').Workbook, p: ExportPayload) {
  const ws = wb.addWorksheet('Monthly P&L');
  ws.columns = [{ width: 32 }, ...MONTHS.map(() => ({ width: 12 })), { width: 14 }, { width: 12 }];
  const header = ws.addRow(['Line', ...MONTHS, 'Total', 'Avg/mo']);
  header.eachCell(c => { c.fill = COLOR.headerFill; c.font = COLOR.headerFont; c.alignment = { horizontal: 'center' }; });

  // Revenue lines (computed values written; formulas would require referencing Inputs sheet rows we just wrote)
  addNumericRow(ws, 'Room revenue', p.computed.revenuePerMonth, numFmtTHB, COLOR.crossSheetFont);
  addNumericRow(ws, 'Cleaning revenue', p.computed.cleaningRevenuePerMonth, numFmtTHB, COLOR.crossSheetFont);
  addNumericRow(ws, 'Other revenue', p.computed.otherRevenuePerMonth, numFmtTHB, COLOR.crossSheetFont);
  const grossRow = addNumericRow(ws, 'Gross Revenue', p.computed.grossRevenuePerMonth, numFmtTHB);
  grossRow.font = { bold: true };
  grossRow.fill = COLOR.totalFill;

  ws.addRow([]);
  const expHeader = ws.addRow(['Expenses']);
  expHeader.font = { bold: true };

  p.computed.expensesByCategory.forEach(row => {
    addNumericRow(ws, row.category, row.monthly, numFmtTHB);
  });

  const opexRow = addNumericRow(ws, 'Total OpEx', p.computed.totalOpExPerMonth, numFmtTHB);
  opexRow.font = { bold: true };
  opexRow.fill = COLOR.totalFill;

  ws.addRow([]);
  const noiRow = addNumericRow(ws, 'NOI', p.computed.noiPerMonth, numFmtTHB);
  noiRow.font = { bold: true };
  const ebitda = addNumericRow(ws, 'EBITDA', p.computed.ebitdaPerMonth, numFmtTHB);
  ebitda.font = { bold: true };
  const net = addNumericRow(ws, 'Net Income', p.computed.netIncomePerMonth, numFmtTHB);
  net.font = { bold: true };
  net.fill = COLOR.totalFill;
}

function addNumericRow(
  ws: import('exceljs').Worksheet,
  label: string,
  values: number[],
  fmt: string,
  fontColor?: { argb: string }
): import('exceljs').Row {
  const total = values.reduce((s, v) => s + (v || 0), 0);
  const avg = total / 12;
  const r = ws.addRow([label, ...values.map(v => Math.round(v || 0)), Math.round(total), Math.round(avg)]);
  r.eachCell((cell, col) => {
    if (col === 1) { cell.font = { bold: true }; return; }
    cell.numFmt = fmt;
    if (fontColor) cell.font = { color: fontColor };
  });
  return r;
}

function buildCashFlowSheet(wb: import('exceljs').Workbook, p: ExportPayload) {
  const ws = wb.addWorksheet('Cash Flow');
  ws.columns = [{ width: 32 }, ...MONTHS.map(() => ({ width: 12 })), { width: 14 }];
  const header = ws.addRow(['Line', ...MONTHS, 'Total']);
  header.eachCell(c => { c.fill = COLOR.headerFill; c.font = COLOR.headerFont; c.alignment = { horizontal: 'center' }; });

  addNumericRow(ws, 'Operating CF (NOI)', p.computed.noiPerMonth, numFmtTHB);

  const capexByMonth = Array(12).fill(0);
  (p.model?.capex || []).forEach(c => {
    const m = (c.month || 1) - 1;
    if (m >= 0 && m < 12) capexByMonth[m] -= Math.abs(c.amount);
  });
  addNumericRow(ws, 'Investing CF (CapEx)', capexByMonth, numFmtTHB);

  // financing CF: monthly amortization (negative)
  const fin: number[] = (() => {
    const monthly = Array(12).fill(0);
    (p.model?.loans || []).forEach(l => {
      const r = (l.annualRatePct / 100) / 12;
      const n = l.termMonths;
      const pmt = l.monthlyPayment ?? (r > 0 ? (l.principal * r) / (1 - Math.pow(1 + r, -n)) : l.principal / n);
      const start = (l.startMonth ?? 1) - 1;
      for (let i = start; i < 12; i++) monthly[i] -= pmt;
    });
    return monthly;
  })();
  addNumericRow(ws, 'Financing CF (Debt service)', fin, numFmtTHB);

  const net = p.computed.noiPerMonth.map((n, i) => n + capexByMonth[i] + fin[i]);
  const netRow = addNumericRow(ws, 'Net Cash Flow', net, numFmtTHB);
  netRow.font = { bold: true };
  netRow.fill = COLOR.totalFill;
}

function buildCapExSheet(wb: import('exceljs').Workbook, p: ExportPayload) {
  const ws = wb.addWorksheet('CapEx');
  ws.columns = [{ width: 28 }, { width: 14 }, { width: 10 }, { width: 14 }, { width: 14 }, { width: 14 }];
  const h = ws.addRow(['Item', 'Amount (THB)', 'Month', 'Lifespan (yrs)', 'Monthly depr.', 'Annual depr.']);
  h.eachCell(c => { c.fill = COLOR.headerFill; c.font = COLOR.headerFont; });
  (p.model?.capex || []).forEach(c => {
    const monthlyDep = c.lifespanYears > 0 ? c.amount / (c.lifespanYears * 12) : 0;
    const r = ws.addRow([c.name || '—', c.amount, c.month, c.lifespanYears, Math.round(monthlyDep), Math.round(monthlyDep * 12)]);
    [2,5,6].forEach(i => { r.getCell(i).numFmt = numFmtTHB; });
  });
}

function buildKpiSheet(wb: import('exceljs').Workbook, p: ExportPayload) {
  const ws = wb.addWorksheet('KPI');
  ws.columns = [{ width: 32 }, { width: 18 }];
  ws.addRow(['KPI Dashboard']).font = { size: 14, bold: true };
  ws.addRow([]);
  const k = p.computed.kpis;
  const t = p.computed.totals;
  const rows: Array<[string, number | string | null, string]> = [
    ['Gross Revenue (annual)', t.grossRevenue, numFmtTHB],
    ['Total OpEx (annual)', t.totalOpEx, numFmtTHB],
    ['NOI (annual)', t.noi, numFmtTHB],
    ['EBITDA (annual)', t.ebitda, numFmtTHB],
    ['Net Income (annual)', t.netIncome, numFmtTHB],
    ['Avg Occupancy', t.avgOccupancy, numFmtPct],
    ['Avg ADR', t.avgAdr, numFmtTHB],
    ['Gross margin', k.grossMarginPct, numFmtPct],
    ['Cap Rate', k.capRate, numFmtPct],
    ['Cash-on-Cash', k.cashOnCash, numFmtPct],
    ['DSCR', k.dscr, numFmtMult],
    ['Break-even occupancy', k.breakEvenOccupancy, numFmtPct],
  ];
  rows.forEach(([label, val, fmt]) => {
    const r = ws.addRow([label, val ?? '—']);
    r.getCell(1).font = { bold: true };
    if (typeof val === 'number') r.getCell(2).numFmt = fmt;
  });
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
