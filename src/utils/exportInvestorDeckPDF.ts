/**
 * Generate a branded PDF investor deck using jsPDF.
 * Layout: Cover → Executive Summary → KPIs → DCF table → Charts (rendered as text/tables, no images)
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ComputedPnL } from '@/lib/finance/financialModelMath';
import type { DcfResult } from '@/lib/finance/dcfMath';

export interface InvestorDeckInput {
  language?: 'ru' | 'en';
  property: {
    name: string;
    type?: string;
    bedrooms?: number;
    district?: string;
    propertyValue?: number;
  };
  year: number;
  scenario: string;
  computed: ComputedPnL;
  dcf?: DcfResult | null;
  ownerName?: string;
}

const BRAND = {
  primary: [13, 110, 79] as [number, number, number],   // emerald
  accent: [78, 123, 255] as [number, number, number],
  success: [16, 185, 129] as [number, number, number],
  danger: [239, 68, 68] as [number, number, number],
  muted: [115, 115, 115] as [number, number, number],
  ink: [15, 23, 42] as [number, number, number],
};

function fmt(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '—';
  if (Math.abs(v) >= 1_000_000) return `THB ${(v / 1_000_000).toFixed(2)}M`;
  if (Math.abs(v) >= 1_000) return `THB ${(v / 1_000).toFixed(0)}K`;
  return `THB ${Math.round(v).toLocaleString()}`;
}
function pct(v: number | null | undefined, d = 1): string {
  if (v == null || !Number.isFinite(v)) return '—';
  return `${(v * 100).toFixed(d)}%`;
}

export function generateInvestorDeckPDF(input: InvestorDeckInput): Blob {
  const isRu = input.language === 'ru';
  const T = (ru: string, en: string) => isRu ? ru : en;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // ====== COVER ======
  doc.setFillColor(...BRAND.ink);
  doc.rect(0, 0, W, H, 'F');
  doc.setFillColor(...BRAND.primary);
  doc.rect(0, 0, W, 8, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('myUNO', 15, 25);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(180, 180, 200);
  doc.text(T('Финансовая модель', 'Financial Model'), 15, 31);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  const titleLines = doc.splitTextToSize(input.property.name || 'Property', W - 30);
  doc.text(titleLines, 15, H / 2 - 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(200, 200, 220);
  const subParts: string[] = [];
  if (input.property.type) subParts.push(input.property.type);
  if (input.property.bedrooms) subParts.push(`${input.property.bedrooms} ${T('сп.', 'BR')}`);
  if (input.property.district) subParts.push(input.property.district);
  if (subParts.length) doc.text(subParts.join(' · '), 15, H / 2 + 10);

  doc.setFontSize(10);
  doc.setTextColor(140, 140, 160);
  doc.text(`${T('Год', 'Year')}: ${input.year}   ·   ${T('Сценарий', 'Scenario')}: ${input.scenario}`, 15, H / 2 + 18);

  // Footer cover
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 140);
  doc.text(T('Конфиденциально. Подготовлено myUNO Property Management.', 'Confidential. Prepared by myUNO Property Management.'), 15, H - 15);
  doc.text(new Date().toISOString().split('T')[0], W - 15, H - 15, { align: 'right' });

  // ====== EXEC SUMMARY ======
  doc.addPage();
  drawHeader(doc, T('Резюме для инвестора', 'Executive Summary'), input);

  let y = 40;
  doc.setTextColor(...BRAND.ink);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(T('Ключевые показатели (год)', 'Key metrics (annual)'), 15, y);
  y += 7;

  const t = input.computed.totals;
  const k = input.computed.kpis;

  const kpiRows = [
    [T('Валовый доход', 'Gross Revenue'), fmt(t.grossRevenue)],
    [T('OpEx', 'OpEx'), fmt(t.totalOpEx)],
    [T('NOI', 'NOI'), fmt(t.noi)],
    [T('Чистая прибыль', 'Net Income'), fmt(t.netIncome)],
    [T('Средняя загрузка', 'Avg occupancy'), pct(t.avgOccupancy, 0)],
    [T('Средний ADR', 'Avg ADR'), fmt(t.avgAdr) + '/night'],
    ['Cap Rate', pct(k.capRate)],
    ['Cash-on-Cash', pct(k.cashOnCash)],
    ['DSCR', k.dscr != null ? k.dscr.toFixed(2) + 'x' : '—'],
    [T('Безуб. загрузка', 'Break-even occupancy'), pct(k.breakEvenOccupancy, 0)],
  ];
  autoTable(doc, {
    startY: y,
    head: [[T('Метрика', 'Metric'), T('Значение', 'Value')]],
    body: kpiRows,
    headStyles: { fillColor: BRAND.primary, fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
    theme: 'striped',
    margin: { left: 15, right: 15 },
  });

  // DCF block
  if (input.dcf) {
    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...BRAND.ink);
    doc.text(T('Прогноз доходности (DCF)', 'Return forecast (DCF)'), 15, finalY);

    const dcfRows = [
      ['IRR (levered)', pct(input.dcf.totals.irr)],
      ['NPV', fmt(input.dcf.totals.npv)],
      ['MOIC', input.dcf.totals.moic ? input.dcf.totals.moic.toFixed(2) + 'x' : '—'],
      [T('Окупаемость', 'Payback'), input.dcf.totals.payback ? input.dcf.totals.payback.toFixed(1) + ' ' + T('лет', 'yrs') : '—'],
      [T('Терминальная стоимость', 'Terminal value'), fmt(input.dcf.totals.terminalValue)],
      [T('Чистая выручка от продажи', 'Net exit proceeds'), fmt(input.dcf.totals.netExitProceeds)],
      [T('Сумма распределений', 'Sum of distributions'), fmt(input.dcf.totals.sumDistributions)],
    ];
    autoTable(doc, {
      startY: finalY + 5,
      head: [[T('Показатель', 'Metric'), T('Значение', 'Value')]],
      body: dcfRows,
      headStyles: { fillColor: BRAND.accent, fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
      theme: 'striped',
      margin: { left: 15, right: 15 },
    });
  }

  drawFooter(doc, 1);

  // ====== MONTHLY P&L ======
  doc.addPage();
  drawHeader(doc, T('Помесячный P&L', 'Monthly P&L'), input);
  y = 40;

  const months = input.computed.months;
  const pnlBody: (string | number)[][] = [
    [T('Доход', 'Revenue'), ...input.computed.grossRevenuePerMonth.map(v => fmt(v))],
    [T('Расходы', 'OpEx'), ...input.computed.totalOpExPerMonth.map(v => fmt(v))],
    ['NOI', ...input.computed.noiPerMonth.map(v => fmt(v))],
    [T('Чистая прибыль', 'Net Income'), ...input.computed.netIncomePerMonth.map(v => fmt(v))],
  ];
  autoTable(doc, {
    startY: y,
    head: [[T('Метрика', 'Metric'), ...months]],
    body: pnlBody,
    headStyles: { fillColor: BRAND.primary, fontSize: 7 },
    bodyStyles: { fontSize: 7 },
    columnStyles: { 0: { fontStyle: 'bold' } },
    theme: 'striped',
    margin: { left: 8, right: 8 },
    styles: { cellPadding: 1.5 },
  });

  // Top expense categories
  const topCats = [...input.computed.expensesByCategory]
    .map(c => ({ category: c.category, total: c.monthly.reduce((s, x) => s + x, 0) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  if (topCats.length) {
    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...BRAND.ink);
    doc.text(T('Топ статей расходов (год)', 'Top expense categories (annual)'), 15, finalY);
    autoTable(doc, {
      startY: finalY + 4,
      head: [[T('Категория', 'Category'), T('Сумма', 'Amount'), '% OpEx']],
      body: topCats.map(c => [
        c.category,
        fmt(c.total),
        ((c.total / Math.max(t.totalOpEx, 1)) * 100).toFixed(1) + '%',
      ]),
      headStyles: { fillColor: BRAND.muted, fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
      theme: 'striped',
      margin: { left: 15, right: 15 },
    });
  }
  drawFooter(doc, 2);

  // ====== DCF YEAR-BY-YEAR ======
  if (input.dcf) {
    doc.addPage();
    drawHeader(doc, T('DCF — год за годом', 'DCF — year-by-year'), input);
    autoTable(doc, {
      startY: 40,
      head: [[T('Год', 'Year'), 'NOI', T('Чист. прибыль', 'Net Income'), T('Терминал', 'Terminal'), 'Net CF', 'PV']],
      body: input.dcf.rows.map(r => [
        `Y${r.year}`,
        fmt(r.noi),
        fmt(r.netIncome),
        r.terminalValue > 0 ? fmt(r.terminalValue) : '—',
        fmt(r.netCashFlow),
        fmt(r.pv),
      ]),
      headStyles: { fillColor: BRAND.accent, fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right', fontStyle: 'bold' }, 5: { halign: 'right' } },
      theme: 'striped',
      margin: { left: 15, right: 15 },
    });
    drawFooter(doc, 3);
  }

  // ====== ASSUMPTIONS & DISCLAIMER ======
  doc.addPage();
  drawHeader(doc, T('Допущения и оговорки', 'Assumptions & Disclaimer'), input);
  y = 40;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...BRAND.ink);
  const disclaimer = T(
    'Настоящий документ подготовлен на основании плановых показателей и допущений собственника. Фактические результаты могут существенно отличаться вследствие изменения рыночных условий, сезонности, регуляторной среды и операционных факторов. Документ не является публичной офертой и не заменяет независимую финансовую экспертизу. Все суммы указаны в тайских батах (THB), если не указано иное.',
    'This document is based on planned figures and assumptions provided by the owner. Actual results may differ materially due to market conditions, seasonality, regulatory changes, and operational factors. This is not a public offer and does not replace independent financial due diligence. All amounts in Thai Baht (THB) unless stated otherwise.'
  );
  const disclaimerLines = doc.splitTextToSize(disclaimer, W - 30);
  doc.text(disclaimerLines, 15, y);
  drawFooter(doc, doc.getNumberOfPages());

  return doc.output('blob');
}

function drawHeader(doc: jsPDF, title: string, input: InvestorDeckInput) {
  const W = doc.internal.pageSize.getWidth();
  doc.setFillColor(...BRAND.primary);
  doc.rect(0, 0, W, 6, 'F');
  doc.setTextColor(...BRAND.muted);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`myUNO · ${input.property.name} · ${input.year} · ${input.scenario}`, 15, 14);
  doc.setTextColor(...BRAND.ink);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(title, 15, 26);
  doc.setDrawColor(...BRAND.primary);
  doc.setLineWidth(0.5);
  doc.line(15, 30, W - 15, 30);
}

function drawFooter(doc: jsPDF, pageNum: number) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  doc.setTextColor(...BRAND.muted);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('myuno.app · Confidential', 15, H - 8);
  doc.text(`${pageNum}`, W - 15, H - 8, { align: 'right' });
}

export function downloadPdfBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
