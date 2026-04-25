import jsPDF from 'jspdf';
import autoTable, { type CellHookData } from 'jspdf-autotable';
import { loadCyrillicFont } from './pdfFonts';
import type { ReportData } from '@/hooks/usePropertyReports';

// jspdf-autotable mutates the doc with `lastAutoTable`. Type it locally instead of casting to any.
type DocWithAutoTable = jsPDF & { lastAutoTable: { finalY: number } };
const finalY = (doc: jsPDF): number => (doc as DocWithAutoTable).lastAutoTable.finalY;

// Management-report extras carried on ReportData but not always present in core type.
type ReportDataExt = ReportData & {
  management_commission?: number;
  owner_net_income?: number;
};

interface GeneratePdfOptions {
  propertyTitle: string;
  reportType: string;
  periodStart: string;
  periodEnd: string;
  data: ReportData;
  language?: 'en' | 'ru';
  currency?: string;
  isManagement?: boolean;
}

const translations = {
  en: {
    title: 'Property Report',
    perBookingTitle: 'Per-Booking Report',
    managementTitle: 'Management Report',
    ownerStatementTitle: 'Owner Statement',
    pnlTitle: 'Profit & Loss Report',
    period: 'Period',
    summary: 'Summary',
    income: 'Income',
    expenses: 'Expenses',
    netIncome: 'Net Income',
    occupancy: 'Occupancy',
    nightsBooked: 'Nights Booked',
    totalNights: 'Total Nights',
    occupancyRate: 'Occupancy Rate',
    bookingsCount: 'Bookings Count',
    incomeBreakdown: 'Income by Category',
    expenseBreakdown: 'Expenses by Category',
    maintenanceSection: 'Maintenance & Works',
    bookings: 'Bookings',
    guestName: 'Guest',
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    amount: 'Amount',
    source: 'Source',
    transactions: 'Transactions',
    date: 'Date',
    category: 'Category',
    description: 'Description',
    vendor: 'Vendor',
    type: 'Type',
    cost: 'Cost',
    managementCommission: 'Management Commission',
    ownerNetIncome: 'Owner Net Income',
    generatedOn: 'Generated on',
    page: 'Page',
    // P&L
    grossProfit: 'Gross Profit',
    costOfServices: 'Cost of Services',
    operatingExpenses: 'Operating Expenses',
    operatingIncome: 'Operating Income',
    expenseRatio: 'Expense Ratio',
    profitMargin: 'Profit Margin',
    // Owner Statement
    totalRevenue: 'Total Revenue',
    deductions: 'Deductions',
    netPayout: 'Net Payout to Owner',
    payoutSummary: 'Payout Summary',
    // Deposits
    bookingDeposits: 'Booking Deposits (Prepayments)',
    expected: 'Expected',
    received: 'Received',
    unpaid: 'Unpaid',
    securityDeposits: 'Security Deposits (Refundable)',
    totalReceived: 'Total Received',
    totalReturned: 'Total Returned',
    totalHeld: 'Currently Held',
    depositDeductions: 'Deductions from Deposits',
    depositGuest: 'Guest',
    depositReceived: 'Received',
    depositReturned: 'Returned',
    depositDeducted: 'Deducted',
    depositStatus: 'Status',
    deposit: 'Deposit',
  },
  ru: {
    title: 'Отчёт по объекту',
    perBookingTitle: 'Отчёт по заездам',
    managementTitle: 'Управленческий отчёт',
    ownerStatementTitle: 'Отчёт собственнику',
    pnlTitle: 'Отчёт о прибылях и убытках',
    period: 'Период',
    summary: 'Сводка',
    income: 'Доход',
    expenses: 'Расходы',
    netIncome: 'Чистый доход',
    occupancy: 'Заполняемость',
    nightsBooked: 'Ночей забронировано',
    totalNights: 'Всего ночей',
    occupancyRate: 'Заполняемость',
    bookingsCount: 'Количество броней',
    incomeBreakdown: 'Доход по категориям',
    expenseBreakdown: 'Расходы по категориям',
    maintenanceSection: 'Работы и обслуживание',
    bookings: 'Бронирования',
    guestName: 'Гость',
    checkIn: 'Заезд',
    checkOut: 'Выезд',
    amount: 'Сумма',
    source: 'Источник',
    transactions: 'Транзакции',
    date: 'Дата',
    category: 'Категория',
    description: 'Описание',
    vendor: 'Поставщик',
    type: 'Тип',
    cost: 'Стоимость',
    managementCommission: 'Комиссия УК',
    ownerNetIncome: 'Доход собственника',
    generatedOn: 'Сгенерировано',
    page: 'Страница',
    // P&L
    grossProfit: 'Валовая прибыль',
    costOfServices: 'Себестоимость услуг',
    operatingExpenses: 'Операционные расходы',
    operatingIncome: 'Операционная прибыль',
    expenseRatio: 'Коэффициент расходов',
    profitMargin: 'Маржа прибыли',
    // Owner Statement
    totalRevenue: 'Общий доход',
    deductions: 'Удержания',
    netPayout: 'К выплате собственнику',
    payoutSummary: 'Итоги выплаты',
    // Deposits
    bookingDeposits: 'Депозиты бронирования (предоплаты)',
    expected: 'Ожидается',
    received: 'Получено',
    unpaid: 'Не оплачено',
    securityDeposits: 'Возвратные залоги',
    totalReceived: 'Всего получено',
    totalReturned: 'Возвращено',
    totalHeld: 'Удерживается',
    depositDeductions: 'Удержания из залогов',
    depositGuest: 'Гость',
    depositReceived: 'Получено',
    depositReturned: 'Возвращено',
    depositDeducted: 'Удержано',
    depositStatus: 'Статус',
    deposit: 'Депозит',
  },
};

const categoryLabels: Record<string, Record<string, string>> = {
  en: {
    rental: 'Rental',
    cleaning_fee: 'Cleaning Fee',
    extra_services: 'Extra Services',
    security_deposit: 'Security Deposit',
    other: 'Other',
    utilities: 'Utilities',
    cleaning: 'Cleaning',
    maintenance: 'Maintenance',
    repair: 'Repair',
    supplies: 'Supplies',
    commission: 'Commission',
    tax: 'Tax',
  },
  ru: {
    rental: 'Аренда',
    cleaning_fee: 'Уборка',
    extra_services: 'Доп. услуги',
    security_deposit: 'Депозит',
    other: 'Прочее',
    utilities: 'Коммунальные',
    cleaning: 'Уборка',
    maintenance: 'Обслуживание',
    repair: 'Ремонт',
    supplies: 'Расходники',
    commission: 'Комиссия',
    tax: 'Налоги',
  },
};

function formatCurrency(amount: number, currency = 'THB'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string, language: string = 'ru'): string {
  return new Date(dateString).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export async function generateReportPdf(options: GeneratePdfOptions): Promise<jsPDF> {
  const { propertyTitle, reportType, periodStart, periodEnd, data, language = 'ru', currency = 'THB' } = options;
  const isManagement = reportType === 'management' || options.isManagement;
  const isOwnerStatement = reportType === 'owner_statement';
  const isPnl = reportType === 'pnl';
  const isPerBooking = reportType === 'per_booking';
  const t = translations[language];
  const catLabels = categoryLabels[language];

  const doc = new jsPDF();
  await loadCyrillicFont(doc);
  const fontStyles = { font: 'Roboto' } as const;
  let yPosition = 20;

  // Header
  const titleText = isPerBooking ? t.perBookingTitle
    : isOwnerStatement ? t.ownerStatementTitle
    : isPnl ? t.pnlTitle
    : isManagement ? t.managementTitle
    : t.title;

  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text(titleText, 20, yPosition);
  
  yPosition += 10;
  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.text(propertyTitle, 20, yPosition);
  
  yPosition += 8;
  doc.setFontSize(11);
  doc.text(`${t.period}: ${formatDate(periodStart, language)} — ${formatDate(periodEnd, language)}`, 20, yPosition);
  
  yPosition += 15;

  // Summary Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, yPosition - 5, 180, 45, 3, 3, 'F');
  
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text(t.summary, 20, yPosition + 5);
  
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  
  // Summary columns
  const col1X = 25;
  const col2X = 85;
  const col3X = 145;
  
  doc.text(`${t.income}:`, col1X, yPosition + 15);
  doc.setTextColor(22, 163, 74); // green
  doc.text(formatCurrency(data.income.total, currency), col1X, yPosition + 22);
  
  doc.setTextColor(80, 80, 80);
  doc.text(`${t.expenses}:`, col2X, yPosition + 15);
  doc.setTextColor(220, 38, 38); // red
  doc.text(formatCurrency(data.expenses.total, currency), col2X, yPosition + 22);
  
  doc.setTextColor(80, 80, 80);
  doc.text(`${t.netIncome}:`, col3X, yPosition + 15);
  doc.setTextColor(data.net_income >= 0 ? 22 : 220, data.net_income >= 0 ? 163 : 38, data.net_income >= 0 ? 74 : 38);
  doc.text(formatCurrency(data.net_income, currency), col3X, yPosition + 22);
  
  doc.setTextColor(80, 80, 80);
  doc.text(`${t.occupancyRate}: ${data.occupancy.rate}%`, col1X, yPosition + 32);
  doc.text(`${t.bookingsCount}: ${data.occupancy.bookings_count}`, col2X, yPosition + 32);
  
  yPosition += 55;

  // Income by Category
  if (Object.keys(data.income.by_category).length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text(t.incomeBreakdown, 20, yPosition);
    yPosition += 5;
    
    const incomeData = Object.entries(data.income.by_category).map(([cat, amount]) => [
      catLabels[cat] || cat,
      formatCurrency(amount as number, currency),
    ]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [[t.category, t.amount]],
      body: incomeData,
      theme: 'striped',
      headStyles: { fillColor: [22, 163, 74] },
      margin: { left: 20, right: 20 },
      styles: { ...fontStyles },
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  // Expense by Category
  if (Object.keys(data.expenses.by_category).length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text(t.expenseBreakdown, 20, yPosition);
    yPosition += 5;
    
    const expenseData = Object.entries(data.expenses.by_category).map(([cat, amount]) => [
      catLabels[cat] || cat,
      formatCurrency(amount as number, currency),
    ]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [[t.category, t.amount]],
      body: expenseData,
      theme: 'striped',
      headStyles: { fillColor: [220, 38, 38] },
      margin: { left: 20, right: 20 },
      styles: { ...fontStyles },
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  // Bookings table
  if (data.bookings.length > 0) {
    // Check if need new page
    if (yPosition > 230) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text(t.bookings, 20, yPosition);
    yPosition += 5;
    
    const bookingsData = data.bookings.map(b => [
      b.guest_name,
      formatDate(b.check_in, language),
      formatDate(b.check_out, language),
      formatCurrency(b.total_amount, currency),
      b.source,
    ]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [[t.guestName, t.checkIn, t.checkOut, t.amount, t.source]],
      body: bookingsData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 20, right: 20 },
      styles: { fontSize: 9, ...fontStyles },
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  // ---- Booking Deposits (Prepayments) ----
  if (data.booking_deposits && data.booking_deposits.total_expected > 0) {
    if (yPosition > 230) { doc.addPage(); yPosition = 20; }

    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text(t.bookingDeposits, 20, yPosition);
    yPosition += 8;

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(15, yPosition - 5, 180, 30, 3, 3, 'F');
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`${t.expected}: ${formatCurrency(data.booking_deposits.total_expected, currency)}`, 25, yPosition + 5);
    doc.setTextColor(22, 163, 74);
    doc.text(`${t.received}: ${formatCurrency(data.booking_deposits.total_paid, currency)}`, 25, yPosition + 15);
    doc.setTextColor(220, 38, 38);
    const unpaidAmt = data.booking_deposits.total_expected - data.booking_deposits.total_paid;
    doc.text(`${t.unpaid}: ${formatCurrency(unpaidAmt, currency)} (${data.booking_deposits.unpaid_count})`, 110, yPosition + 15);
    yPosition += 40;

    // Per-booking deposit column in bookings table
    if (data.bookings.some(b => (b.deposit_amount || 0) > 0)) {
      const depositBookingRows = data.bookings
        .filter(b => (b.deposit_amount || 0) > 0)
        .map(b => [
          b.guest_name,
          formatCurrency(b.total_amount, currency),
          formatCurrency(b.deposit_amount || 0, currency),
          b.deposit_paid ? '✓' : '✗',
          formatCurrency(b.total_amount - (b.deposit_paid ? (b.deposit_amount || 0) : 0), currency),
        ]);

      autoTable(doc, {
        startY: yPosition,
        head: [[t.depositGuest, t.amount, t.deposit, t.depositStatus, language === 'ru' ? 'Остаток' : 'Balance']],
        body: depositBookingRows,
        theme: 'striped',
        headStyles: { fillColor: [234, 179, 8] },
        margin: { left: 20, right: 20 },
        styles: { fontSize: 9, ...fontStyles },
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 4: { halign: 'right' } },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }
  }

  // ---- Security Deposits (Refundable) ----
  if (data.security_deposits && data.security_deposits.total_received > 0) {
    if (yPosition > 200) { doc.addPage(); yPosition = 20; }

    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text(t.securityDeposits, 20, yPosition);
    yPosition += 8;

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(15, yPosition - 5, 180, 35, 3, 3, 'F');
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`${t.totalReceived}: ${formatCurrency(data.security_deposits.total_received, currency)}`, 25, yPosition + 5);
    doc.setTextColor(22, 163, 74);
    doc.text(`${t.totalReturned}: ${formatCurrency(data.security_deposits.total_returned, currency)}`, 25, yPosition + 15);
    doc.setTextColor(234, 179, 8);
    doc.text(`${t.totalHeld}: ${formatCurrency(data.security_deposits.total_held, currency)}`, 110, yPosition + 5);
    doc.setTextColor(220, 38, 38);
    doc.text(`${t.depositDeductions}: ${formatCurrency(data.security_deposits.deductions, currency)}`, 110, yPosition + 15);
    yPosition += 45;

    // Security deposit detail table
    if (data.security_deposits.items.length > 0) {
      const secRows = data.security_deposits.items.map(item => [
        item.guest_name,
        formatCurrency(item.received, currency),
        formatCurrency(item.returned, currency),
        formatCurrency(item.deducted, currency),
        item.status === 'returned' ? (language === 'ru' ? 'Возвращён' : 'Returned')
          : item.status === 'held' ? (language === 'ru' ? 'Удержан' : 'Held')
          : (language === 'ru' ? 'Частично' : 'Partial'),
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [[t.depositGuest, t.depositReceived, t.depositReturned, t.depositDeducted, t.depositStatus]],
        body: secRows,
        theme: 'striped',
        headStyles: { fillColor: [107, 114, 128] },
        margin: { left: 20, right: 20 },
        styles: { fontSize: 9, ...fontStyles },
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }
  }

  // Expense transactions
  if (data.expenses.transactions.length > 0) {
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text(`${t.expenses} — ${t.transactions}`, 20, yPosition);
    yPosition += 5;

    const transData = data.expenses.transactions.map(tr => [
      formatDate(tr.date, language),
      catLabels[tr.category] || tr.category,
      tr.vendor || '-',
      tr.description.substring(0, 30),
      formatCurrency(tr.amount, currency),
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [[t.date, t.category, t.vendor, t.description, t.amount]],
      body: transData,
      theme: 'striped',
      headStyles: { fillColor: [107, 114, 128] },
      margin: { left: 20, right: 20 },
      styles: { fontSize: 8, ...fontStyles },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  // ---- Management-specific sections ----
  if (isManagement) {
    // Maintenance / works done
    if (data.maintenance && data.maintenance.length > 0) {
      if (yPosition > 200) { doc.addPage(); yPosition = 20; }

      doc.setFontSize(12);
      doc.setTextColor(40, 40, 40);
      doc.text(t.maintenanceSection, 20, yPosition);
      yPosition += 5;

      const maintData = data.maintenance.map(m => [
        formatDate(m.date, language),
        catLabels[m.type] || m.type,
        m.description.substring(0, 40),
        formatCurrency(m.cost, currency),
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [[t.date, t.type, t.description, t.cost]],
        body: maintData,
        theme: 'striped',
        headStyles: { fillColor: [234, 88, 12] },
        margin: { left: 20, right: 20 },
        styles: { fontSize: 9, ...fontStyles },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }

    // Commission & owner net income box
    const mgmtCommission = (data as any).management_commission ?? 0;
    const ownerNet = (data as any).owner_net_income ?? data.net_income;
    if (mgmtCommission > 0) {
      if (yPosition > 240) { doc.addPage(); yPosition = 20; }

      doc.setFillColor(248, 250, 252);
      doc.roundedRect(15, yPosition - 5, 180, 35, 3, 3, 'F');

      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text(`${t.managementCommission}:`, 25, yPosition + 5);
      doc.setTextColor(220, 38, 38);
      doc.text(`-${formatCurrency(mgmtCommission, currency)}`, 110, yPosition + 5);

      doc.setTextColor(80, 80, 80);
      doc.text(`${t.ownerNetIncome}:`, 25, yPosition + 18);
      doc.setFontSize(12);
      doc.setTextColor(ownerNet >= 0 ? 22 : 220, ownerNet >= 0 ? 163 : 38, ownerNet >= 0 ? 74 : 38);
      doc.text(formatCurrency(ownerNet, currency), 110, yPosition + 18);

      yPosition += 45;
    }
  }

  // ---- P&L Report Section ----
  if (isPnl) {
    if (yPosition > 200) { doc.addPage(); yPosition = 20; }

    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text(t.pnlTitle, 20, yPosition);
    yPosition += 10;

    const costOfServices = data.expenses.transactions
      .filter(tr => ['cleaning', 'supplies', 'cleaning_fee'].includes(tr.category))
      .reduce((s, tr) => s + tr.amount, 0);
    const grossProfit = data.income.total - costOfServices;
    const operatingExpenses = data.expenses.total - costOfServices;
    const operatingIncome = grossProfit - operatingExpenses;
    const profitMargin = data.income.total > 0 ? Math.round((operatingIncome / data.income.total) * 100) : 0;
    const expenseRatio = data.income.total > 0 ? Math.round((data.expenses.total / data.income.total) * 100) : 0;

    const pnlRows = [
      [t.totalRevenue, '', formatCurrency(data.income.total, currency)],
      [t.costOfServices, `(${formatCurrency(costOfServices, currency)})`, ''],
      [t.grossProfit, '', formatCurrency(grossProfit, currency)],
      ['', '', ''],
      [t.operatingExpenses, `(${formatCurrency(operatingExpenses, currency)})`, ''],
      [t.operatingIncome, '', formatCurrency(operatingIncome, currency)],
      ['', '', ''],
      [t.expenseRatio, '', `${expenseRatio}%`],
      [t.profitMargin, '', `${profitMargin}%`],
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [['', '', t.amount]],
      body: pnlRows,
      theme: 'plain',
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      margin: { left: 20, right: 20 },
      styles: { fontSize: 10, ...fontStyles },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 80 }, 1: { halign: 'right', cellWidth: 50 }, 2: { halign: 'right', fontStyle: 'bold', cellWidth: 50 } },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  // ---- Owner Statement Section ----
  if (isOwnerStatement) {
    if (yPosition > 200) { doc.addPage(); yPosition = 20; }

    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text(t.payoutSummary, 20, yPosition);
    yPosition += 10;

    const mgmtComm = data.management_commission ?? 0;
    const payout = data.owner_payout ?? (data.income.total - data.expenses.total - mgmtComm);

    // Deductions table
    const deductionRows = (data.deductions || Object.entries(data.expenses.by_category).map(([cat, amt]) => ({
      category: cat, amount: amt as number, description: cat.replace(/_/g, ' '),
    }))).map(d => [
      catLabels[d.category] || d.category.replace(/_/g, ' '),
      `-${formatCurrency(d.amount, currency)}`,
    ]);

    if (mgmtComm > 0) {
      deductionRows.push([t.managementCommission, `-${formatCurrency(mgmtComm, currency)}`]);
    }

    const statementRows = [
      [t.totalRevenue, formatCurrency(data.income.total, currency)],
      ['', ''],
      ...deductionRows,
      ['', ''],
      [t.netPayout, formatCurrency(payout, currency)],
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [[t.description, t.amount]],
      body: statementRows,
      theme: 'striped',
      headStyles: { fillColor: [22, 163, 74] },
      margin: { left: 20, right: 20 },
      styles: { fontSize: 10, ...fontStyles },
      columnStyles: { 1: { halign: 'right' } },
      didParseCell: (hookData: any) => {
        // Bold the payout row
        if (hookData.section === 'body' && hookData.row.index === statementRows.length - 1) {
          hookData.cell.styles.fontStyle = 'bold';
          hookData.cell.styles.fontSize = 12;
        }
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Payout highlight box
    if (yPosition > 250) { doc.addPage(); yPosition = 20; }
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(15, yPosition - 5, 180, 25, 3, 3, 'F');
    doc.setFontSize(12);
    doc.setTextColor(22, 163, 74);
    doc.text(`${t.netPayout}: ${formatCurrency(payout, currency)}`, 25, yPosition + 8);
    yPosition += 35;
  }

  // ---- Per-Booking Report Section ----
  if (isPerBooking && data.bookings.length > 0) {
    if (yPosition > 200) { doc.addPage(); yPosition = 20; }

    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text(t.perBookingTitle, 20, yPosition);
    yPosition += 10;

    // Per-booking economics table
    const perBookingRows = data.bookings.map(b => {
      // Find expenses related to this booking period
      const bookingExpenses = data.expenses.transactions
        .filter(tr => tr.date >= b.check_in && tr.date <= b.check_out)
        .reduce((sum, tr) => sum + tr.amount, 0);
      const net = b.total_amount - bookingExpenses;
      return [
        b.guest_name,
        b.source || '-',
        formatDate(b.check_in, language),
        formatDate(b.check_out, language),
        formatCurrency(b.total_amount, currency),
        formatCurrency(bookingExpenses, currency),
        formatCurrency(net, currency),
      ];
    });

    const perBookingLabels = language === 'ru'
      ? [t.guestName, t.source, t.checkIn, t.checkOut, t.income, t.expenses, t.netIncome]
      : [t.guestName, t.source, t.checkIn, t.checkOut, 'Revenue', 'Expenses', 'Net'];

    autoTable(doc, {
      startY: yPosition,
      head: [perBookingLabels],
      body: perBookingRows,
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] },
      margin: { left: 15, right: 15 },
      styles: { fontSize: 8, ...fontStyles },
      columnStyles: {
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right', fontStyle: 'bold' },
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Per-booking totals
    const totalRevenue = data.bookings.reduce((s, b) => s + b.total_amount, 0);
    const avgPerBooking = data.bookings.length > 0 ? totalRevenue / data.bookings.length : 0;

    if (yPosition > 250) { doc.addPage(); yPosition = 20; }
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(15, yPosition - 5, 180, 30, 3, 3, 'F');
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`${language === 'ru' ? 'Всего заездов' : 'Total stays'}: ${data.bookings.length}`, 25, yPosition + 5);
    doc.text(`${language === 'ru' ? 'Общий доход' : 'Total revenue'}: ${formatCurrency(totalRevenue, currency)}`, 25, yPosition + 15);
    doc.text(`${language === 'ru' ? 'Средний чек' : 'Avg per booking'}: ${formatCurrency(avgPerBooking, currency)}`, 110, yPosition + 15);
    yPosition += 40;
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `${t.generatedOn} ${new Date().toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-GB')} | ${t.page} ${i}/${pageCount}`,
      20,
      285
    );
    doc.text('myUNO Property Management', 150, 285);
  }

  return doc;
}

export async function downloadReportPdf(options: GeneratePdfOptions, filename?: string): Promise<void> {
  const doc = await generateReportPdf(options);
  const name = filename || `report-${options.periodStart}-${options.periodEnd}.pdf`;
  doc.save(name);
}
