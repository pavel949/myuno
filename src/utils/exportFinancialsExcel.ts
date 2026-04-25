import type { PropertyFinancialFull } from '@/hooks/usePropertyFinancials';
import type { BudgetVsActual } from '@/hooks/usePropertyBudgets';
import type { PropertyReport } from '@/hooks/usePropertyReports';
import type { Worksheet, Workbook, Cell, Column } from 'exceljs';

// ExcelJS is loaded lazily to avoid 918KB in the main bundle

function autoWidth(ws: Worksheet) {
  ws.columns.forEach((col: Partial<Column>) => {
    let max = 12;
    col.eachCell?.({ includeEmpty: false }, (cell: Cell) => {
      const len = String(cell.value ?? '').length + 2;
      if (len > max) max = len;
    });
    col.width = Math.min(max, 40);
  });
}

function styledHeader(ws: Worksheet) {
  const HEADER_FILL = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF1A73E8' } };
  const HEADER_FONT = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  const row = ws.getRow(1);
  row.eachCell((cell: Cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  row.height = 24;
}

// ========== 1. Transactions Export ==========
export async function exportTransactionsExcel(
  transactions: PropertyFinancialFull[],
  language: 'ru' | 'en' = 'ru',
  filename?: string
) {
  const ExcelJS = await import('exceljs');
  const wb = new ExcelJS.Workbook();
  wb.creator = 'myUNO';
  wb.created = new Date();

  const isRu = language === 'ru';
  const ws = wb.addWorksheet(isRu ? 'Транзакции' : 'Transactions');

  ws.columns = [
    { header: isRu ? 'Дата' : 'Date', key: 'date' },
    { header: isRu ? 'Тип' : 'Type', key: 'type' },
    { header: isRu ? 'Категория' : 'Category', key: 'category' },
    { header: isRu ? 'Сумма' : 'Amount', key: 'amount' },
    { header: isRu ? 'Валюта' : 'Currency', key: 'currency' },
    { header: isRu ? 'Описание' : 'Description', key: 'description' },
    { header: isRu ? 'Поставщик' : 'Vendor', key: 'vendor' },
    { header: isRu ? 'Объект' : 'Property', key: 'property' },
    { header: isRu ? 'Способ оплаты' : 'Payment Method', key: 'payment_method' },
    { header: isRu ? 'Статус' : 'Status', key: 'status' },
  ];

  transactions.forEach(t => {
    ws.addRow({
      date: t.transaction_date,
      type: t.transaction_type,
      category: t.category || '',
      amount: Number(t.amount),
      currency: t.currency || 'THB',
      description: (isRu ? t.description_ru : t.description) || t.description || '',
      vendor: t.vendor_name || '',
      property: t.property?.title || '',
      payment_method: t.payment_method || '',
      status: t.status || '',
    });
  });

  ws.getColumn('amount').numFmt = '#,##0.00';

  const totalIncome = transactions
    .filter(t => t.transaction_type === 'income')
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = transactions
    .filter(t => t.transaction_type === 'expense')
    .reduce((s, t) => s + Number(t.amount), 0);

  ws.addRow({});
  ws.addRow({ date: isRu ? 'ИТОГО Доход' : 'TOTAL Income', amount: totalIncome });
  ws.addRow({ date: isRu ? 'ИТОГО Расход' : 'TOTAL Expense', amount: totalExpense });
  ws.addRow({ date: isRu ? 'Чистый доход' : 'Net Income', amount: totalIncome - totalExpense });

  styledHeader(ws);
  autoWidth(ws);

  await downloadWorkbook(wb, filename || `transactions_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// ========== 2. Budget vs Actual Export ==========
export async function exportBudgetExcel(
  data: BudgetVsActual[],
  propertyTitle: string,
  month: string,
  language: 'ru' | 'en' = 'ru',
  filename?: string
) {
  const ExcelJS = await import('exceljs');
  const wb = new ExcelJS.Workbook();
  wb.creator = 'myUNO';
  const isRu = language === 'ru';
  const ws = wb.addWorksheet(isRu ? 'Бюджет План/Факт' : 'Budget Plan/Actual');

  ws.mergeCells('A1:E1');
  ws.getCell('A1').value = `${isRu ? 'Бюджет' : 'Budget'}: ${propertyTitle}`;
  ws.getCell('A1').font = { bold: true, size: 14 };
  ws.mergeCells('A2:E2');
  ws.getCell('A2').value = `${isRu ? 'Месяц' : 'Month'}: ${month}`;
  ws.getCell('A2').font = { size: 11, color: { argb: 'FF666666' } };

  const HEADER_FILL = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF1A73E8' } };
  const HEADER_FONT = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };

  ws.getRow(4).values = [
    isRu ? 'Категория' : 'Category',
    isRu ? 'Тип' : 'Type',
    isRu ? 'План' : 'Plan',
    isRu ? 'Факт' : 'Actual',
    isRu ? 'Отклонение' : 'Variance',
    '%',
  ];
  ws.getRow(4).eachCell((cell: Cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  data.forEach(row => {
    const r = ws.addRow([
      row.category,
      row.transaction_type === 'income' ? (isRu ? 'Доход' : 'Income') : (isRu ? 'Расход' : 'Expense'),
      row.planned,
      row.actual,
      row.variance,
      row.variancePercent,
    ]);

    const varianceCell = r.getCell(5);
    if (row.variance < 0) {
      varianceCell.font = { color: { argb: 'FFDC2626' } };
    } else if (row.variance > 0) {
      varianceCell.font = { color: { argb: 'FF16A34A' } };
    }
  });

  const totalPlanned = data.reduce((s, r) => s + (r.transaction_type === 'expense' ? -r.planned : r.planned), 0);
  const totalActual = data.reduce((s, r) => s + (r.transaction_type === 'expense' ? -r.actual : r.actual), 0);
  ws.addRow([]);
  const totRow = ws.addRow([
    isRu ? 'ИТОГО (Доходы - Расходы)' : 'TOTAL (Income - Expenses)',
    '',
    totalPlanned,
    totalActual,
    totalPlanned - totalActual,
    '',
  ]);
  totRow.font = { bold: true };

  ['C', 'D', 'E'].forEach(col => {
    ws.getColumn(col).numFmt = '#,##0';
  });
  ws.getColumn('F').numFmt = '0"%"';

  autoWidth(ws);

  await downloadWorkbook(wb, filename || `budget_${month}.xlsx`);
}

// ========== 3. Report Export ==========
export async function exportReportExcel(
  report: PropertyReport,
  language: 'ru' | 'en' = 'ru',
  filename?: string
) {
  const ExcelJS = await import('exceljs');
  const wb = new ExcelJS.Workbook();
  wb.creator = 'myUNO';
  const isRu = language === 'ru';
  const d = report.data;

  const ws1 = wb.addWorksheet(isRu ? 'Сводка' : 'Summary');
  ws1.getCell('A1').value = isRu ? 'Отчёт по объекту' : 'Property Report';
  ws1.getCell('A1').font = { bold: true, size: 14 };
  ws1.getCell('A2').value = report.property?.title || '';
  ws1.getCell('A3').value = `${report.period_start} — ${report.period_end}`;
  ws1.getCell('A3').font = { color: { argb: 'FF666666' } };

  const HEADER_FILL = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF1A73E8' } };
  const HEADER_FONT = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };

  ws1.getRow(5).values = [isRu ? 'Показатель' : 'Metric', isRu ? 'Значение' : 'Value'];
  ws1.getRow(5).eachCell((c: Cell) => { c.fill = HEADER_FILL; c.font = HEADER_FONT; });

  const summaryRows: Array<Array<string | number>> = [
    [isRu ? 'Доход' : 'Income', d.income.total],
    [isRu ? 'Расходы' : 'Expenses', d.expenses.total],
    [isRu ? 'Чистый доход' : 'Net Income', d.net_income],
    [isRu ? 'Заполняемость' : 'Occupancy', `${d.occupancy.rate}%`],
    [isRu ? 'Бронирований' : 'Bookings', d.occupancy.bookings_count],
  ];
  if (d.management_commission) summaryRows.push([isRu ? 'Комиссия УК' : 'Mgmt Commission', d.management_commission]);
  if (d.owner_payout) summaryRows.push([isRu ? 'К выплате собственнику' : 'Owner Payout', d.owner_payout]);

  summaryRows.forEach(r => ws1.addRow(r));
  ws1.getColumn('B').numFmt = '#,##0';
  autoWidth(ws1);

  if (d.income.transactions.length > 0) {
    const ws2 = wb.addWorksheet(isRu ? 'Доходы' : 'Income');
    ws2.columns = [
      { header: isRu ? 'Дата' : 'Date', key: 'date' },
      { header: isRu ? 'Категория' : 'Category', key: 'category' },
      { header: isRu ? 'Сумма' : 'Amount', key: 'amount' },
      { header: isRu ? 'Описание' : 'Description', key: 'description' },
    ];
    d.income.transactions.forEach((t) => ws2.addRow(t));
    ws2.getColumn('amount').numFmt = '#,##0';
    styledHeader(ws2);
    autoWidth(ws2);
  }

  if (d.expenses.transactions.length > 0) {
    const ws3 = wb.addWorksheet(isRu ? 'Расходы' : 'Expenses');
    ws3.columns = [
      { header: isRu ? 'Дата' : 'Date', key: 'date' },
      { header: isRu ? 'Категория' : 'Category', key: 'category' },
      { header: isRu ? 'Сумма' : 'Amount', key: 'amount' },
      { header: isRu ? 'Описание' : 'Description', key: 'description' },
      { header: isRu ? 'Поставщик' : 'Vendor', key: 'vendor' },
    ];
    d.expenses.transactions.forEach((t) => ws3.addRow(t));
    ws3.getColumn('amount').numFmt = '#,##0';
    styledHeader(ws3);
    autoWidth(ws3);
  }

  await downloadWorkbook(wb, filename || `report_${report.period_start}.xlsx`);
}

// ========== Helper: download workbook ==========
async function downloadWorkbook(wb: Workbook, filename: string) {
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
