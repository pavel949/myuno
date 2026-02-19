import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ReportData } from '@/hooks/usePropertyReports';

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
    managementTitle: 'Management Report',
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
  },
  ru: {
    title: 'Отчёт по объекту',
    managementTitle: 'Управленческий отчёт',
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

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function generateReportPdf(options: GeneratePdfOptions): jsPDF {
  const { propertyTitle, reportType, periodStart, periodEnd, data, language = 'ru', currency = 'THB' } = options;
  const isManagement = reportType === 'management' || options.isManagement;
  const t = translations[language];
  const catLabels = categoryLabels[language];

  const doc = new jsPDF();
  let yPosition = 20;

  // Header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text(isManagement ? t.managementTitle : t.title, 20, yPosition);
  
  yPosition += 10;
  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.text(propertyTitle, 20, yPosition);
  
  yPosition += 8;
  doc.setFontSize(11);
  doc.text(`${t.period}: ${formatDate(periodStart)} — ${formatDate(periodEnd)}`, 20, yPosition);
  
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
      formatDate(b.check_in),
      formatDate(b.check_out),
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
      styles: { fontSize: 9 },
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 15;
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

    const transData = data.expenses.transactions.slice(0, 20).map(tr => [
      formatDate(tr.date),
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
      styles: { fontSize: 8 },
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
        formatDate(m.date),
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
        styles: { fontSize: 9 },
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

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `${t.generatedOn} ${new Date().toLocaleDateString('ru-RU')} | ${t.page} ${i}/${pageCount}`,
      20,
      285
    );
    doc.text('myUNO Property Management', 150, 285);
  }

  return doc;
}

export function downloadReportPdf(options: GeneratePdfOptions, filename?: string): void {
  const doc = generateReportPdf(options);
  const name = filename || `report-${options.periodStart}-${options.periodEnd}.pdf`;
  doc.save(name);
}
