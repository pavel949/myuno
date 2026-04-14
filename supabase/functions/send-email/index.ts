// Deno.serve used (native edge runtime)
// Unified email service for myUNO — single entry point for all transactional emails
import { Resend } from 'npm:resend@2.0.0';
import { createClient } from '../_shared/supabase.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://myuno.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── Design tokens ───
const BRAND = {
  primary: '#4A5899',
  primaryLight: '#6B7DC3',
  success: '#059669',
  warning: '#d97706',
  danger: '#dc2626',
  bg: '#f8f9fc',
  cardBg: '#ffffff',
  text: '#1f2937',
  muted: '#6b7280',
  border: '#e5e7eb',
  font: "'Space Grotesk', 'DM Sans', 'Segoe UI', Arial, sans-serif",
};

const baseStyles = `
<style>
  body { font-family: ${BRAND.font}; line-height: 1.6; color: ${BRAND.text}; margin: 0; padding: 0; background: ${BRAND.bg}; }
  .container { max-width: 600px; margin: 0 auto; background: ${BRAND.cardBg}; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
  .header { background: linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.primaryLight} 100%); color: white; padding: 32px 24px; text-align: center; }
  .header h1 { margin: 0; font-size: 24px; font-weight: 700; font-family: 'Space Grotesk', sans-serif; }
  .header p { margin: 8px 0 0; opacity: 0.9; font-size: 15px; }
  .content { padding: 32px 24px; }
  .card { background: #f9fafb; border: 1px solid ${BRAND.border}; border-radius: 12px; padding: 20px; margin: 20px 0; }
  .badge { display: inline-block; padding: 5px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; }
  .badge-success { background: #dcfce7; color: #166534; }
  .badge-warning { background: #fef3c7; color: #92400e; }
  .badge-danger { background: #fee2e2; color: #991b1b; }
  .badge-info { background: #dbeafe; color: #1e40af; }
  .label { font-size: 12px; font-weight: 600; color: ${BRAND.muted}; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .value { font-size: 16px; color: ${BRAND.text}; margin-bottom: 16px; }
  .btn { display: inline-block; background: linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.primaryLight} 100%); color: white !important; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; }
  .total-row { display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-top: 2px solid ${BRAND.border}; margin-top: 16px; }
  .footer { background: #1f2937; color: #9ca3af; padding: 24px; text-align: center; font-size: 13px; }
  .footer a { color: #93a3f8; text-decoration: none; }
  .divider { border: 0; border-top: 1px solid ${BRAND.border}; margin: 24px 0; }
  .tip-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 16px; margin: 16px 0; }
</style>
`;

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[m] || m);
}

function footerHtml(lang: string) {
  const t = lang === 'ru'
    ? { tagline: 'myUNO — Ваш консьерж на Пхукете', unsub: 'Настройки уведомлений' }
    : { tagline: 'myUNO — Your Phuket Concierge', unsub: 'Notification settings' };
  return `
    <div class="footer">
      <p style="margin:0">${t.tagline}</p>
      <p style="margin:8px 0 0;font-size:12px">
        <a href="https://myuno.app">myuno.app</a> · <a href="mailto:support@myuno.app">support@myuno.app</a>
      </p>
      <p style="margin:8px 0 0;font-size:11px">
        <a href="https://myuno.app/account/settings">${t.unsub}</a>
      </p>
    </div>`;
}

function wrapTemplate(headerBg: string, headerEmoji: string, heading: string, subheading: string, body: string, lang: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">${baseStyles}</head>
<body><div class="container">
  <div class="header" style="background:linear-gradient(135deg,${headerBg} 0%,${headerBg}cc 100%)">
    <h1>${headerEmoji} ${heading}</h1>
    ${subheading ? `<p>${subheading}</p>` : ''}
  </div>
  <div class="content">${body}</div>
  ${footerHtml(lang)}
</div></body></html>`;
}

// ─── Template generators ───

interface TemplateData {
  customerName?: string;
  language?: 'en' | 'ru';
  [key: string]: unknown;
}

function generateWelcome(d: TemplateData) {
  const l = d.language || 'en';
  const name = d.customerName || 'Friend';
  const t = l === 'ru' ? {
    subject: 'Добро пожаловать в myUNO! 🎉',
    heading: 'Добро пожаловать!',
    sub: `Привет, ${name}!`,
    body: `<p>Мы рады приветствовать вас на myUNO — вашем личном консьерже на Пхукете.</p>
      <div class="tip-box"><h3 style="margin:0 0 8px;color:#1e40af">🚀 С чего начать?</h3>
        <ul style="margin:0;padding-left:20px">
          <li>Забронируйте яхту или тур</li>
          <li>Найдите идеальное жильё</li>
          <li>Закажите доставку цветов или еды</li>
          <li>Запишитесь к врачу или в салон красоты</li>
        </ul>
      </div>
      <div style="text-align:center"><a href="https://myuno.app" class="btn">Открыть myUNO →</a></div>`,
  } : {
    subject: 'Welcome to myUNO! 🎉',
    heading: 'Welcome!',
    sub: `Hi ${name}!`,
    body: `<p>We're excited to have you on myUNO — your personal Phuket concierge.</p>
      <div class="tip-box"><h3 style="margin:0 0 8px;color:#1e40af">🚀 Getting started</h3>
        <ul style="margin:0;padding-left:20px">
          <li>Book a yacht or tour</li>
          <li>Find your perfect property</li>
          <li>Order flower or food delivery</li>
          <li>Schedule medical or beauty appointments</li>
        </ul>
      </div>
      <div style="text-align:center"><a href="https://myuno.app" class="btn">Open myUNO →</a></div>`,
  };
  return { subject: t.subject, html: wrapTemplate(BRAND.primary, '🎉', t.heading, t.sub, t.body, l) };
}

function generateBookingConfirmation(d: TemplateData) {
  const l = d.language || 'en';
  const name = d.customerName || '';
  const orderNumber = d.orderNumber as string || '';
  const serviceName = d.serviceName as string || '';
  const date = d.date as string || '';
  const amount = d.amount as number || 0;
  const currency = d.currency as string || 'THB';
  const t = l === 'ru' ? {
    subject: `Бронирование подтверждено #${orderNumber}`,
    heading: 'Бронирование подтверждено',
    sub: `Привет, ${name}!`,
    orderLabel: 'Номер заказа', service: 'Услуга', dateLabel: 'Дата', total: 'Итого',
    viewBtn: 'Мои бронирования',
  } : {
    subject: `Booking Confirmed #${orderNumber}`,
    heading: 'Booking Confirmed',
    sub: `Hi ${name}!`,
    orderLabel: 'Order Number', service: 'Service', dateLabel: 'Date', total: 'Total',
    viewBtn: 'View My Bookings',
  };
  const body = `
    <div class="card">
      <span class="badge badge-success">✓ ${l === 'ru' ? 'Подтверждено' : 'Confirmed'}</span>
      <div style="margin-top:16px"><div class="label">${t.orderLabel}</div><div class="value" style="font-size:20px;font-weight:700">#${orderNumber}</div></div>
      ${serviceName ? `<div class="label">${t.service}</div><div class="value">${escapeHtml(serviceName)}</div>` : ''}
      ${date ? `<div class="label">${t.dateLabel}</div><div class="value">📅 ${date}</div>` : ''}
      <div class="total-row"><span style="font-weight:600">${t.total}</span><span style="font-size:24px;font-weight:700;color:${BRAND.success}">${amount.toLocaleString()} ${currency}</span></div>
    </div>
    <div style="text-align:center"><a href="https://myuno.app/bookings" class="btn">${t.viewBtn} →</a></div>`;
  return { subject: t.subject, html: wrapTemplate(BRAND.success, '✅', t.heading, t.sub, body, l) };
}

function generatePaymentReceipt(d: TemplateData) {
  const l = d.language || 'en';
  const name = d.customerName || '';
  const orderNumber = d.orderNumber as string || '';
  const amount = d.amount as number || 0;
  const currency = d.currency as string || 'THB';
  const t = l === 'ru' ? {
    subject: `Оплата получена #${orderNumber}`,
    heading: 'Оплата получена',
    sub: `Привет, ${name}!`,
    label: 'Сумма', orderLabel: 'Заказ',
  } : {
    subject: `Payment Received #${orderNumber}`,
    heading: 'Payment Received',
    sub: `Hi ${name}!`,
    label: 'Amount', orderLabel: 'Order',
  };
  const body = `
    <div class="card">
      <span class="badge badge-success">✓ ${l === 'ru' ? 'Оплачено' : 'Paid'}</span>
      <div style="margin-top:16px"><div class="label">${t.orderLabel}</div><div class="value" style="font-weight:700">#${orderNumber}</div></div>
      <div class="label">${t.label}</div>
      <div style="font-size:28px;font-weight:700;color:${BRAND.success}">${amount.toLocaleString()} ${currency}</div>
    </div>`;
  return { subject: t.subject, html: wrapTemplate(BRAND.success, '💳', t.heading, t.sub, body, l) };
}

function generatePaymentFailed(d: TemplateData) {
  const l = d.language || 'en';
  const name = d.customerName || '';
  const orderNumber = d.orderNumber as string || '';
  const retryUrl = d.retryUrl as string || 'https://myuno.app/bookings';
  const t = l === 'ru' ? {
    subject: `Ошибка оплаты #${orderNumber}`,
    heading: 'Ошибка оплаты',
    sub: `${name}, оплата не прошла`,
    body: `<div class="card"><span class="badge badge-danger">⚠ Не оплачено</span>
      <div style="margin-top:16px"><div class="label">Заказ</div><div class="value" style="font-weight:700">#${orderNumber}</div></div>
      <p>Попробуйте ещё раз или используйте другой способ оплаты.</p></div>
      <div style="text-align:center"><a href="${retryUrl}" class="btn">Повторить оплату →</a></div>`,
  } : {
    subject: `Payment Failed #${orderNumber}`,
    heading: 'Payment Failed',
    sub: `${name}, your payment didn't go through`,
    body: `<div class="card"><span class="badge badge-danger">⚠ Unpaid</span>
      <div style="margin-top:16px"><div class="label">Order</div><div class="value" style="font-weight:700">#${orderNumber}</div></div>
      <p>Please try again or use a different payment method.</p></div>
      <div style="text-align:center"><a href="${retryUrl}" class="btn">Retry Payment →</a></div>`,
  };
  return { subject: t.subject, html: wrapTemplate(BRAND.danger, '❌', t.heading, t.sub, t.body, l) };
}

function generateBookingReminder(d: TemplateData) {
  const l = d.language || 'en';
  const name = d.customerName || '';
  const serviceName = d.serviceName as string || '';
  const date = d.date as string || '';
  const t = l === 'ru' ? {
    subject: `Напоминание: ${serviceName} завтра`,
    heading: 'Напоминание о бронировании',
    sub: `Привет, ${name}!`,
    body: `<div class="card">
      <span class="badge badge-info">⏰ Завтра</span>
      <div style="margin-top:16px"><div class="label">Услуга</div><div class="value">${escapeHtml(serviceName)}</div></div>
      <div class="label">Дата и время</div><div class="value">📅 ${date}</div></div>
      <div style="text-align:center"><a href="https://myuno.app/bookings" class="btn">Мои бронирования →</a></div>`,
  } : {
    subject: `Reminder: ${serviceName} tomorrow`,
    heading: 'Booking Reminder',
    sub: `Hi ${name}!`,
    body: `<div class="card">
      <span class="badge badge-info">⏰ Tomorrow</span>
      <div style="margin-top:16px"><div class="label">Service</div><div class="value">${escapeHtml(serviceName)}</div></div>
      <div class="label">Date & Time</div><div class="value">📅 ${date}</div></div>
      <div style="text-align:center"><a href="https://myuno.app/bookings" class="btn">My Bookings →</a></div>`,
  };
  return { subject: t.subject, html: wrapTemplate(BRAND.primary, '⏰', t.heading, t.sub, t.body, l) };
}

function generateReviewRequest(d: TemplateData) {
  const l = d.language || 'en';
  const name = d.customerName || '';
  const serviceName = d.serviceName as string || '';
  const reviewUrl = d.reviewUrl as string || 'https://myuno.app/bookings';
  const t = l === 'ru' ? {
    subject: `Как прошло? Оставьте отзыв о ${serviceName}`,
    heading: 'Как вам понравилось?',
    sub: `Привет, ${name}!`,
    body: `<p>Надеемся, вам понравилось! Ваш отзыв поможет другим пользователям.</p>
      <div class="card"><div class="label">Услуга</div><div class="value">${escapeHtml(serviceName)}</div>
      <div style="text-align:center;font-size:32px">⭐⭐⭐⭐⭐</div></div>
      <div style="text-align:center"><a href="${reviewUrl}" class="btn">Оставить отзыв →</a></div>`,
  } : {
    subject: `How was ${serviceName}? Leave a review`,
    heading: 'How was your experience?',
    sub: `Hi ${name}!`,
    body: `<p>We hope you enjoyed it! Your review helps other travelers.</p>
      <div class="card"><div class="label">Service</div><div class="value">${escapeHtml(serviceName)}</div>
      <div style="text-align:center;font-size:32px">⭐⭐⭐⭐⭐</div></div>
      <div style="text-align:center"><a href="${reviewUrl}" class="btn">Leave a Review →</a></div>`,
  };
  return { subject: t.subject, html: wrapTemplate(BRAND.primary, '⭐', t.heading, t.sub, t.body, l) };
}

function generateDocumentExpiry(d: TemplateData) {
  const l = d.language || 'en';
  const name = d.customerName || '';
  const docType = d.documentType as string || 'Document';
  const expiryDate = d.expiryDate as string || '';
  const daysLeft = d.daysLeft as number || 0;
  const urgencyColor = daysLeft <= 1 ? BRAND.danger : daysLeft <= 7 ? BRAND.warning : BRAND.primary;
  const t = l === 'ru' ? {
    subject: `⚠ ${docType} истекает через ${daysLeft} дн.`,
    heading: 'Срок документа истекает',
    sub: `${name}, обратите внимание`,
    body: `<div class="card" style="border-color:${urgencyColor}">
      <span class="badge" style="background:${urgencyColor}20;color:${urgencyColor}">⚠ Через ${daysLeft} дн.</span>
      <div style="margin-top:16px"><div class="label">Документ</div><div class="value">${escapeHtml(docType)}</div></div>
      <div class="label">Дата истечения</div><div class="value">📅 ${expiryDate}</div></div>
      <div style="text-align:center"><a href="https://myuno.app/account/documents" class="btn">Мои документы →</a></div>`,
  } : {
    subject: `⚠ ${docType} expires in ${daysLeft} days`,
    heading: 'Document Expiring Soon',
    sub: `${name}, please take action`,
    body: `<div class="card" style="border-color:${urgencyColor}">
      <span class="badge" style="background:${urgencyColor}20;color:${urgencyColor}">⚠ ${daysLeft} days left</span>
      <div style="margin-top:16px"><div class="label">Document</div><div class="value">${escapeHtml(docType)}</div></div>
      <div class="label">Expiry Date</div><div class="value">📅 ${expiryDate}</div></div>
      <div style="text-align:center"><a href="https://myuno.app/account/documents" class="btn">My Documents →</a></div>`,
  };
  return { subject: t.subject, html: wrapTemplate(urgencyColor, '⚠️', t.heading, t.sub, t.body, l) };
}

function generateRefundProcessed(d: TemplateData) {
  const l = d.language || 'en';
  const name = d.customerName || '';
  const orderNumber = d.orderNumber as string || '';
  const amount = d.amount as number || 0;
  const currency = d.currency as string || 'THB';
  const t = l === 'ru' ? {
    subject: `Возврат выполнен #${orderNumber}`,
    heading: 'Возврат средств',
    sub: `Привет, ${name}!`,
    body: `<div class="card"><span class="badge badge-success">✓ Возвращено</span>
      <div style="margin-top:16px"><div class="label">Заказ</div><div class="value" style="font-weight:700">#${orderNumber}</div></div>
      <div class="label">Сумма возврата</div>
      <div style="font-size:28px;font-weight:700;color:${BRAND.success}">${amount.toLocaleString()} ${currency}</div>
      <p style="color:${BRAND.muted};margin-top:12px">Средства поступят на карту в течение 5-10 рабочих дней.</p></div>`,
  } : {
    subject: `Refund Processed #${orderNumber}`,
    heading: 'Refund Processed',
    sub: `Hi ${name}!`,
    body: `<div class="card"><span class="badge badge-success">✓ Refunded</span>
      <div style="margin-top:16px"><div class="label">Order</div><div class="value" style="font-weight:700">#${orderNumber}</div></div>
      <div class="label">Refund Amount</div>
      <div style="font-size:28px;font-weight:700;color:${BRAND.success}">${amount.toLocaleString()} ${currency}</div>
      <p style="color:${BRAND.muted};margin-top:12px">Funds will arrive in 5-10 business days.</p></div>`,
  };
  return { subject: t.subject, html: wrapTemplate(BRAND.success, '💸', t.heading, t.sub, t.body, l) };
}

function generateVendorOrder(d: TemplateData) {
  const l = d.language || 'en';
  const vendorName = d.vendorName as string || 'Partner';
  const orderNumber = d.orderNumber as string || '';
  const customerName = d.customerName || '';
  const amount = d.amount as number || 0;
  const currency = d.currency as string || 'THB';
  const serviceName = d.serviceName as string || '';
  const date = d.date as string || '';
  const t = l === 'ru' ? {
    subject: `Новый заказ #${orderNumber}`,
    heading: 'Новый заказ!',
    sub: `${vendorName}, у вас новый заказ`,
  } : {
    subject: `New Order #${orderNumber}`,
    heading: 'New Order!',
    sub: `${vendorName}, you have a new order`,
  };
  const body = `<div class="card"><span class="badge badge-warning">🔔 ${l === 'ru' ? 'Новый' : 'New'}</span>
    <div style="margin-top:16px"><div class="label">${l === 'ru' ? 'Заказ' : 'Order'}</div><div class="value" style="font-weight:700">#${orderNumber}</div></div>
    <div class="label">${l === 'ru' ? 'Клиент' : 'Customer'}</div><div class="value">${escapeHtml(customerName)}</div>
    ${serviceName ? `<div class="label">${l === 'ru' ? 'Услуга' : 'Service'}</div><div class="value">${escapeHtml(serviceName)}</div>` : ''}
    ${date ? `<div class="label">${l === 'ru' ? 'Дата' : 'Date'}</div><div class="value">📅 ${date}</div>` : ''}
    <div class="total-row"><span style="font-weight:600">${l === 'ru' ? 'Сумма' : 'Amount'}</span><span style="font-size:24px;font-weight:700;color:${BRAND.success}">${amount.toLocaleString()} ${currency}</span></div>
  </div>
  <div style="text-align:center"><a href="https://myuno.app/vendor/orders" class="btn">${l === 'ru' ? 'Открыть заказы' : 'View Orders'} →</a></div>`;
  return { subject: t.subject, html: wrapTemplate(BRAND.warning, '🔔', t.heading, t.sub, body, l) };
}

// ─── Template registry ───
const TEMPLATES: Record<string, (d: TemplateData) => { subject: string; html: string }> = {
  welcome: generateWelcome,
  'booking-confirmation': generateBookingConfirmation,
  'payment-receipt': generatePaymentReceipt,
  'payment-failed': generatePaymentFailed,
  'booking-reminder': generateBookingReminder,
  'review-request': generateReviewRequest,
  'document-expiry': generateDocumentExpiry,
  'refund-processed': generateRefundProcessed,
  'vendor-order': generateVendorOrder,
};

// ─── Main handler ───
interface SendEmailRequest {
  to: string | string[];
  template_id: string;
  template_data: TemplateData;
  locale?: 'en' | 'ru';
  subject_override?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth guard: allow internal calls (service role) or authenticated users
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) {
      console.error('[send-email] RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resend = new Resend(resendKey);
    const payload: SendEmailRequest = await req.json();
    const { to, template_id, template_data, locale, subject_override } = payload;

    if (!to || !template_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing "to" or "template_id"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const templateFn = TEMPLATES[template_id];
    if (!templateFn) {
      return new Response(
        JSON.stringify({ success: false, error: `Unknown template: ${template_id}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Apply locale
    const data = { ...template_data, language: locale || template_data.language || 'en' };
    const { subject, html } = templateFn(data);

    const recipients = Array.isArray(to) ? to : [to];

    console.log(`[send-email] Sending "${template_id}" to ${recipients.length} recipient(s)`);

    const emailResponse = await resend.emails.send({
      from: 'myUNO <noreply@resend.dev>',
      to: recipients,
      subject: subject_override || subject,
      html,
    });

    console.log(`[send-email] Sent successfully, id=${emailResponse.data?.id}`);

    return new Response(
      JSON.stringify({ success: true, email_id: emailResponse.data?.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[send-email] Error:', msg);
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
