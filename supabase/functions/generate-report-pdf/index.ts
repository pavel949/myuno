// Deno.serve used (native edge runtime)
import { createClient } from "../_shared/supabase.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

interface ReportData {
  income: {
    total: number;
    by_category: Record<string, number>;
    transactions: Array<{
      id: string;
      date: string;
      amount: number;
      category: string;
      description: string;
    }>;
  };
  expenses: {
    total: number;
    by_category: Record<string, number>;
    transactions: Array<{
      id: string;
      date: string;
      amount: number;
      category: string;
      description: string;
      vendor?: string;
    }>;
  };
  occupancy: {
    nights_booked: number;
    total_nights: number;
    rate: number;
    bookings_count: number;
  };
  bookings: Array<{
    id: string;
    guest_name: string;
    check_in: string;
    check_out: string;
    total_amount: number;
    source: string;
  }>;
  maintenance: Array<{
    id: string;
    type: string;
    cost: number;
    date: string;
    description: string;
  }>;
  net_income: number;
  roi_percent?: number;
  mom_change?: number;
  highlights?: string[];
  recommendations?: string[];
}

interface GenerateRequest {
  reportId: string;
  language?: 'en' | 'ru';
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { reportId, language = 'ru' }: GenerateRequest = await req.json();

    if (!reportId) {
      throw new Error("Report ID is required");
    }

    // Fetch report with property data
    const { data: report, error: reportError } = await supabase
      .from("property_reports")
      .select(`
        *,
        property:owner_properties(id, title, title_ru, address, city)
      `)
      .eq("id", reportId)
      .single();

    if (reportError || !report) {
      throw new Error("Report not found");
    }

    const data = report.data as ReportData;
    const isRu = language === 'ru';
    const propertyTitle = isRu 
      ? (report.property?.title_ru || report.property?.title) 
      : report.property?.title;

    // Generate HTML content for PDF
    const html = generateReportHtml({
      report,
      data,
      propertyTitle: propertyTitle || 'Property',
      isRu,
    });

    // For now, store HTML as a blob (actual PDF generation would require puppeteer)
    // In production, you'd use a service like Browserless or Puppeteer
    const fileName = `report-${reportId}-${Date.now()}.html`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("property-reports")
      .upload(fileName, new Blob([html], { type: "text/html" }), {
        contentType: "text/html",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      // Continue without file storage - report is still viewable
    }

    // Get public URL
    let pdfUrl = null;
    if (uploadData) {
      const { data: urlData } = supabase.storage
        .from("property-reports")
        .getPublicUrl(fileName);
      pdfUrl = urlData.publicUrl;
    }

    // Update report with PDF URL
    if (pdfUrl) {
      await supabase
        .from("property_reports")
        .update({ pdf_url: pdfUrl, status: "ready" })
        .eq("id", reportId);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        pdf_url: pdfUrl,
        html_preview: html.substring(0, 500) + "..." 
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error generating report PDF:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

function generateReportHtml(params: {
  report: any;
  data: ReportData;
  propertyTitle: string;
  isRu: boolean;
}): string {
  const { report, data, propertyTitle, isRu } = params;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(isRu ? 'ru-RU' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(isRu ? 'ru-RU' : 'en-US', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const reportTypeLabels: Record<string, { en: string; ru: string }> = {
    monthly: { en: 'Monthly Report', ru: 'Ежемесячный отчёт' },
    quarterly: { en: 'Quarterly Report', ru: 'Квартальный отчёт' },
    annual: { en: 'Annual Report', ru: 'Годовой отчёт' },
    custom: { en: 'Custom Report', ru: 'Отчёт за период' },
  };

  const t = {
    title: reportTypeLabels[report.report_type]?.[isRu ? 'ru' : 'en'] || 'Report',
    period: isRu ? 'Период' : 'Period',
    property: isRu ? 'Объект' : 'Property',
    financialSummary: isRu ? 'Финансовая сводка' : 'Financial Summary',
    income: isRu ? 'Доход' : 'Income',
    expenses: isRu ? 'Расходы' : 'Expenses',
    netIncome: isRu ? 'Чистый доход' : 'Net Income',
    occupancy: isRu ? 'Заполняемость' : 'Occupancy',
    nightsBooked: isRu ? 'Ночей забронировано' : 'Nights Booked',
    totalNights: isRu ? 'Всего ночей' : 'Total Nights',
    occupancyRate: isRu ? 'Процент заполняемости' : 'Occupancy Rate',
    bookingsCount: isRu ? 'Количество бронирований' : 'Number of Bookings',
    incomeByCategory: isRu ? 'Доходы по категориям' : 'Income by Category',
    expensesByCategory: isRu ? 'Расходы по категориям' : 'Expenses by Category',
    bookingsList: isRu ? 'Бронирования' : 'Bookings',
    guestName: isRu ? 'Гость' : 'Guest',
    dates: isRu ? 'Даты' : 'Dates',
    amount: isRu ? 'Сумма' : 'Amount',
    source: isRu ? 'Источник' : 'Source',
    maintenanceList: isRu ? 'Техобслуживание' : 'Maintenance',
    generatedAt: isRu ? 'Сгенерировано' : 'Generated',
    footer: isRu ? 'myUNO — Отчёт сформирован автоматически' : 'myUNO — Report generated automatically',
  };

  const incomeCategories = Object.entries(data.income.by_category || {})
    .map(([cat, amt]) => `<tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${cat}</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #16a34a;">${formatCurrency(amt)}</td></tr>`)
    .join('');

  const expenseCategories = Object.entries(data.expenses.by_category || {})
    .map(([cat, amt]) => `<tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${cat}</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #dc2626;">${formatCurrency(amt)}</td></tr>`)
    .join('');

  const bookingsRows = (data.bookings || [])
    .map(b => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${b.guest_name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${formatDate(b.check_in)} - ${formatDate(b.check_out)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(b.total_amount)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${b.source}</td>
      </tr>
    `)
    .join('');

  const maintenanceRows = (data.maintenance || [])
    .map(m => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${formatDate(m.date)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${m.type}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${m.description}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #dc2626;">${formatCurrency(m.cost)}</td>
      </tr>
    `)
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.title} - ${propertyTitle}</title>
  <style>
    * { box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Arial, sans-serif; 
      line-height: 1.6; 
      color: #1f2937; 
      margin: 0; 
      padding: 40px; 
      background: white;
    }
    .container { max-width: 800px; margin: 0 auto; }
    .header { 
      background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); 
      color: white; 
      padding: 32px; 
      border-radius: 12px;
      margin-bottom: 32px;
    }
    .header h1 { margin: 0; font-size: 28px; }
    .header .property { font-size: 20px; opacity: 0.9; margin-top: 8px; }
    .header .period { font-size: 14px; opacity: 0.8; margin-top: 4px; }
    .section { 
      background: #f9fafb; 
      border-radius: 12px; 
      padding: 24px; 
      margin-bottom: 24px;
    }
    .section-title { 
      font-size: 18px; 
      font-weight: 700; 
      margin: 0 0 16px 0;
      color: #374151;
    }
    .summary-grid { display: flex; gap: 16px; flex-wrap: wrap; }
    .summary-card {
      flex: 1;
      min-width: 150px;
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .summary-label { font-size: 13px; color: #6b7280; margin-bottom: 4px; }
    .summary-value { font-size: 24px; font-weight: 700; }
    .income { color: #16a34a; }
    .expense { color: #dc2626; }
    .net { color: #0284c7; }
    table { width: 100%; border-collapse: collapse; }
    th { 
      text-align: left; 
      padding: 12px 8px; 
      background: #e5e7eb; 
      font-size: 13px;
      font-weight: 600;
    }
    .footer {
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
    @media print {
      body { padding: 20px; }
      .section { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${t.title}</h1>
      <div class="property">${propertyTitle}</div>
      <div class="period">${t.period}: ${formatDate(report.period_start)} — ${formatDate(report.period_end)}</div>
    </div>
    
    <!-- Financial Summary -->
    <div class="section">
      <h2 class="section-title">📊 ${t.financialSummary}</h2>
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-label">${t.income}</div>
          <div class="summary-value income">${formatCurrency(data.income.total)}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">${t.expenses}</div>
          <div class="summary-value expense">${formatCurrency(data.expenses.total)}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">${t.netIncome}</div>
          <div class="summary-value ${data.net_income >= 0 ? 'income' : 'expense'}">${formatCurrency(data.net_income)}</div>
        </div>
      </div>
    </div>
    
    <!-- Occupancy -->
    <div class="section">
      <h2 class="section-title">🏠 ${t.occupancy}</h2>
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-label">${t.nightsBooked}</div>
          <div class="summary-value net">${data.occupancy.nights_booked}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">${t.totalNights}</div>
          <div class="summary-value">${data.occupancy.total_nights}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">${t.occupancyRate}</div>
          <div class="summary-value net">${data.occupancy.rate}%</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">${t.bookingsCount}</div>
          <div class="summary-value">${data.occupancy.bookings_count}</div>
        </div>
      </div>
    </div>
    
    <!-- Income by Category -->
    ${incomeCategories ? `
    <div class="section">
      <h2 class="section-title">💰 ${t.incomeByCategory}</h2>
      <table>
        ${incomeCategories}
      </table>
    </div>
    ` : ''}
    
    <!-- Expenses by Category -->
    ${expenseCategories ? `
    <div class="section">
      <h2 class="section-title">💸 ${t.expensesByCategory}</h2>
      <table>
        ${expenseCategories}
      </table>
    </div>
    ` : ''}
    
    <!-- Bookings -->
    ${bookingsRows ? `
    <div class="section">
      <h2 class="section-title">📅 ${t.bookingsList}</h2>
      <table>
        <thead>
          <tr>
            <th>${t.guestName}</th>
            <th>${t.dates}</th>
            <th style="text-align: right;">${t.amount}</th>
            <th>${t.source}</th>
          </tr>
        </thead>
        <tbody>
          ${bookingsRows}
        </tbody>
      </table>
    </div>
    ` : ''}
    
    <!-- Maintenance -->
    ${maintenanceRows ? `
    <div class="section">
      <h2 class="section-title">🔧 ${t.maintenanceList}</h2>
      <table>
        <thead>
          <tr>
            <th>${isRu ? 'Дата' : 'Date'}</th>
            <th>${isRu ? 'Тип' : 'Type'}</th>
            <th>${isRu ? 'Описание' : 'Description'}</th>
            <th style="text-align: right;">${isRu ? 'Стоимость' : 'Cost'}</th>
          </tr>
        </thead>
        <tbody>
          ${maintenanceRows}
        </tbody>
      </table>
    </div>
    ` : ''}
    
    <div class="footer">
      <p>${t.generatedAt}: ${new Date().toLocaleString(isRu ? 'ru-RU' : 'en-US')}</p>
      <p>${t.footer}</p>
    </div>
  </div>
</body>
</html>
  `;
}

Deno.serve(handler);
