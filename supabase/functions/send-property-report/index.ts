// Deno.serve used (native edge runtime)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface SendReportRequest {
  reportId: string;
  recipientEmails: string[];
  language?: 'en' | 'ru';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { reportId, recipientEmails, language = 'ru' }: SendReportRequest = await req.json();

    if (!reportId || !recipientEmails?.length) {
      throw new Error("Report ID and recipient emails are required");
    }

    // Fetch report with property data
    const { data: report, error: reportError } = await supabase
      .from("property_reports")
      .select(`
        *,
        property:owner_properties(id, title, title_ru, address)
      `)
      .eq("id", reportId)
      .single();

    if (reportError || !report) {
      throw new Error("Report not found");
    }

    const isRu = language === 'ru';
    const propertyTitle = isRu 
      ? (report.property?.title_ru || report.property?.title) 
      : report.property?.title;

    const reportData = report.data as any;

    // Generate email HTML
    const { subject, html } = generateReportEmail({
      propertyTitle: propertyTitle || 'Property',
      periodStart: report.period_start,
      periodEnd: report.period_end,
      reportType: report.report_type,
      income: reportData.income?.total || 0,
      expenses: reportData.expenses?.total || 0,
      netIncome: reportData.net_income || 0,
      occupancyRate: reportData.occupancy?.rate || 0,
      bookingsCount: reportData.occupancy?.bookings_count || 0,
      pdfUrl: report.pdf_url,
      isRu,
    });

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "myUNO Reports <reports@uno.ae>",
      to: recipientEmails,
      subject,
      html,
    });

    console.log("Report email sent:", emailResponse);

    // Update report status
    await supabase
      .from("property_reports")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        sent_to: recipientEmails,
      })
      .eq("id", reportId);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.data?.id }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error sending report:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

function generateReportEmail(params: {
  propertyTitle: string;
  periodStart: string;
  periodEnd: string;
  reportType: string;
  income: number;
  expenses: number;
  netIncome: number;
  occupancyRate: number;
  bookingsCount: number;
  pdfUrl?: string;
  isRu: boolean;
}): { subject: string; html: string } {
  const {
    propertyTitle,
    periodStart,
    periodEnd,
    reportType,
    income,
    expenses,
    netIncome,
    occupancyRate,
    bookingsCount,
    pdfUrl,
    isRu,
  } = params;

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
    subject: isRu 
      ? `${reportTypeLabels[reportType]?.ru || 'Отчёт'}: ${propertyTitle}`
      : `${reportTypeLabels[reportType]?.en || 'Report'}: ${propertyTitle}`,
    greeting: isRu ? 'Здравствуйте!' : 'Hello!',
    intro: isRu 
      ? `Ваш отчёт по недвижимости готов к просмотру.`
      : `Your property report is ready for review.`,
    period: isRu ? 'Период' : 'Period',
    financialSummary: isRu ? 'Финансовая сводка' : 'Financial Summary',
    income: isRu ? 'Доход' : 'Income',
    expenses: isRu ? 'Расходы' : 'Expenses',
    netIncome: isRu ? 'Чистый доход' : 'Net Income',
    occupancy: isRu ? 'Заполняемость' : 'Occupancy',
    bookings: isRu ? 'Бронирований' : 'Bookings',
    viewReport: isRu ? 'Посмотреть полный отчёт' : 'View Full Report',
    downloadPdf: isRu ? 'Скачать PDF' : 'Download PDF',
    footer: isRu 
      ? 'Это автоматическое уведомление от myUNO'
      : 'This is an automated notification from myUNO',
  };

  const subject = t.subject;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background: #f3f4f6; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; padding: 32px 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
    .header .property { font-size: 18px; opacity: 0.9; margin-top: 8px; }
    .content { padding: 32px 24px; }
    .period-badge { display: inline-block; background: #f3f4f6; padding: 8px 16px; border-radius: 20px; font-size: 14px; color: #6b7280; margin-bottom: 24px; }
    .summary-grid { display: flex; flex-wrap: wrap; gap: 12px; margin: 24px 0; }
    .summary-card { flex: 1; min-width: 120px; background: #f9fafb; padding: 16px; border-radius: 8px; text-align: center; }
    .summary-label { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
    .summary-value { font-size: 20px; font-weight: 700; }
    .income { color: #16a34a; }
    .expense { color: #dc2626; }
    .net { color: #0284c7; }
    .occupancy-bar { height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; margin: 8px 0; }
    .occupancy-fill { height: 100%; background: #0ea5e9; border-radius: 4px; }
    .button { display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 8px 4px; }
    .button-outline { display: inline-block; background: white; color: #0284c7 !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; border: 2px solid #0284c7; margin: 8px 4px; }
    .footer { background: #1f2937; color: #9ca3af; padding: 24px; text-align: center; font-size: 14px; }
    .footer a { color: #60a5fa; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 ${reportTypeLabels[reportType]?.[isRu ? 'ru' : 'en'] || 'Report'}</h1>
      <div class="property">${escapeHtml(propertyTitle)}</div>
    </div>
    
    <div class="content">
      <p style="font-size: 18px;">${t.greeting}</p>
      <p>${t.intro}</p>
      
      <div class="period-badge">
        📅 ${t.period}: ${formatDate(periodStart)} — ${formatDate(periodEnd)}
      </div>
      
      <h3 style="margin: 24px 0 16px 0;">💰 ${t.financialSummary}</h3>
      
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-label">${t.income}</div>
          <div class="summary-value income">${formatCurrency(income)}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">${t.expenses}</div>
          <div class="summary-value expense">${formatCurrency(expenses)}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">${t.netIncome}</div>
          <div class="summary-value ${netIncome >= 0 ? 'income' : 'expense'}">${formatCurrency(netIncome)}</div>
        </div>
      </div>
      
      <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 24px 0;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 600;">🏠 ${t.occupancy}</span>
          <span style="color: #0284c7; font-weight: 700;">${occupancyRate}%</span>
        </div>
        <div class="occupancy-bar">
          <div class="occupancy-fill" style="width: ${Math.min(occupancyRate, 100)}%;"></div>
        </div>
        <div style="font-size: 14px; color: #6b7280;">${bookingsCount} ${t.bookings}</div>
      </div>
      
      <div style="text-align: center; margin: 32px 0;">
        ${pdfUrl ? `<a href="${pdfUrl}" class="button">📄 ${t.downloadPdf}</a>` : ''}
      </div>
    </div>
    
    <div class="footer">
      <p style="margin: 0;">${t.footer}</p>
      <p style="margin: 8px 0 0 0; font-size: 12px;">
        <a href="https://uno.ae">uno.ae</a> • 
        <a href="mailto:support@uno.ae">support@uno.ae</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;

  return { subject, html };
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

Deno.serve(handler);
