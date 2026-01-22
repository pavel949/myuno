// Property-specific email templates for myUNO platform

interface PropertyBookingEmailData {
  customerName: string;
  orderNumber: string;
  propertyTitle: string;
  propertyImage?: string;
  propertyAddress?: string;
  checkIn: string; // ISO date string
  checkOut: string;
  checkInTime?: string;
  checkOutTime?: string;
  nights: number;
  guests: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount?: number;
  balanceDueDate?: string;
  securityDeposit?: number;
  currency: string;
  houseRules?: string[];
  hostName?: string;
  hostPhone?: string;
  voucherUrl?: string;
  calendarUrl?: string;
  language?: 'en' | 'ru';
}

const baseStyles = `
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background: #f3f4f6; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; padding: 32px 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
    .header p { margin: 8px 0 0 0; opacity: 0.9; font-size: 16px; }
    .content { padding: 32px 24px; }
    .property-card { border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb; margin: 20px 0; }
    .property-image { width: 100%; height: 200px; object-fit: cover; }
    .property-info { padding: 16px; }
    .property-title { font-size: 20px; font-weight: 700; margin: 0 0 8px 0; }
    .property-address { font-size: 14px; color: #6b7280; margin: 0; }
    .dates-grid { display: flex; background: #f9fafb; border-radius: 8px; margin: 16px 0; }
    .date-box { flex: 1; padding: 16px; text-align: center; }
    .date-box:first-child { border-right: 1px solid #e5e7eb; }
    .date-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .date-value { font-size: 18px; font-weight: 700; color: #1f2937; }
    .date-time { font-size: 12px; color: #6b7280; margin-top: 4px; }
    .summary-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f3f4f6; }
    .summary-row:last-child { border-bottom: none; }
    .summary-label { color: #6b7280; }
    .summary-value { font-weight: 600; }
    .total-row { display: flex; justify-content: space-between; padding: 16px; background: #f0f9ff; border-radius: 8px; margin-top: 16px; }
    .total-label { font-size: 16px; font-weight: 600; color: #0284c7; }
    .total-amount { font-size: 24px; font-weight: 700; color: #0284c7; }
    .paid-badge { display: inline-block; background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .pending-badge { display: inline-block; background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .rules-box { background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin: 20px 0; }
    .rules-title { font-weight: 600; color: #92400e; margin: 0 0 8px 0; font-size: 14px; }
    .rules-list { margin: 0; padding-left: 20px; color: #78350f; font-size: 14px; }
    .host-box { background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 20px 0; }
    .host-label { font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px; }
    .host-name { font-size: 16px; font-weight: 600; margin: 0; }
    .host-phone { font-size: 14px; color: #0284c7; margin-top: 4px; }
    .button { display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 8px 4px; }
    .button-outline { display: inline-block; background: white; color: #0284c7 !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; border: 2px solid #0284c7; margin: 8px 4px; }
    .footer { background: #1f2937; color: #9ca3af; padding: 24px; text-align: center; font-size: 14px; }
    .footer a { color: #60a5fa; }
  </style>
`;

export function generatePropertyBookingEmail(data: PropertyBookingEmailData): { subject: string; html: string } {
  const lang = data.language || 'ru';
  
  const texts = {
    en: {
      subject: `Booking Confirmed! ${data.propertyTitle} - #${data.orderNumber}`,
      greeting: `Hi ${data.customerName}!`,
      confirmed: 'Your booking is confirmed',
      subtitle: 'Everything is ready for your stay',
      checkIn: 'Check-in',
      checkOut: 'Check-out',
      from: 'from',
      by: 'by',
      nights: 'nights',
      guests: 'guests',
      accommodation: 'Accommodation',
      paid: 'Paid',
      balance: 'Balance due',
      securityDeposit: 'Security deposit',
      refundable: '(refundable)',
      total: 'Total',
      houseRules: 'House Rules',
      host: 'Your Host',
      viaMyuno: 'via myUNO',
      downloadVoucher: 'Download Voucher',
      addToCalendar: 'Add to Calendar',
      questions: 'Questions? Contact us anytime',
      footer: 'myUNO — Your Phuket Concierge',
    },
    ru: {
      subject: `Бронирование подтверждено! ${data.propertyTitle} - #${data.orderNumber}`,
      greeting: `Привет, ${data.customerName}!`,
      confirmed: 'Ваше бронирование подтверждено',
      subtitle: 'Всё готово к вашему приезду',
      checkIn: 'Заезд',
      checkOut: 'Выезд',
      from: 'с',
      by: 'до',
      nights: 'ночей',
      guests: 'гостей',
      accommodation: 'Проживание',
      paid: 'Оплачено',
      balance: 'К оплате',
      securityDeposit: 'Залоговый депозит',
      refundable: '(возвращается)',
      total: 'Итого',
      houseRules: 'Правила дома',
      host: 'Ваш хозяин',
      viaMyuno: 'через myUNO',
      downloadVoucher: 'Скачать ваучер',
      addToCalendar: 'Добавить в календарь',
      questions: 'Вопросы? Свяжитесь с нами',
      footer: 'myUNO — Ваш консьерж на Пхукете',
    },
  };
  
  const t = texts[lang];
  
  const checkInDate = new Date(data.checkIn);
  const checkOutDate = new Date(data.checkOut);
  
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'long' 
    };
    return date.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', options);
  };

  const houseRulesHtml = data.houseRules && data.houseRules.length > 0 
    ? `
      <div class="rules-box">
        <p class="rules-title">📋 ${t.houseRules}</p>
        <ul class="rules-list">
          ${data.houseRules.map(rule => `<li>${escapeHtml(rule)}</li>`).join('')}
        </ul>
      </div>
    `
    : '';

  const hostHtml = data.hostName 
    ? `
      <div class="host-box">
        <p class="host-label">👤 ${t.host}</p>
        <p class="host-name">${escapeHtml(data.hostName)} <span style="color: #6b7280; font-weight: normal;">${t.viaMyuno}</span></p>
        ${data.hostPhone ? `<p class="host-phone">📞 ${data.hostPhone}</p>` : ''}
      </div>
    `
    : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${baseStyles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏠 ${t.confirmed}</h1>
          <p>${t.subtitle}</p>
        </div>
        
        <div class="content">
          <p style="font-size: 18px; margin-bottom: 24px;">${t.greeting}</p>
          
          <!-- Property Card -->
          <div class="property-card">
            ${data.propertyImage ? `<img src="${data.propertyImage}" alt="${escapeHtml(data.propertyTitle)}" class="property-image" />` : ''}
            <div class="property-info">
              <h2 class="property-title">${escapeHtml(data.propertyTitle)}</h2>
              ${data.propertyAddress ? `<p class="property-address">📍 ${escapeHtml(data.propertyAddress)}</p>` : ''}
            </div>
          </div>
          
          <!-- Dates -->
          <div class="dates-grid">
            <div class="date-box">
              <div class="date-label">${t.checkIn}</div>
              <div class="date-value">${formatDate(checkInDate)}</div>
              <div class="date-time">${t.from} ${data.checkInTime || '14:00'}</div>
            </div>
            <div class="date-box">
              <div class="date-label">${t.checkOut}</div>
              <div class="date-value">${formatDate(checkOutDate)}</div>
              <div class="date-time">${t.by} ${data.checkOutTime || '11:00'}</div>
            </div>
          </div>
          
          <div style="display: flex; gap: 16px; margin: 16px 0; font-size: 14px; color: #6b7280;">
            <span>📅 ${data.nights} ${t.nights}</span>
            <span>👥 ${data.guests} ${t.guests}</span>
          </div>
          
          <!-- Payment Summary -->
          <div style="margin: 24px 0;">
            <div class="summary-row">
              <span class="summary-label">${t.accommodation}</span>
              <span class="summary-value">${data.currency} ${data.totalAmount.toLocaleString()}</span>
            </div>
            
            <div class="summary-row">
              <span class="summary-label">
                ${t.paid} <span class="paid-badge">✓</span>
              </span>
              <span class="summary-value" style="color: #16a34a;">${data.currency} ${data.paidAmount.toLocaleString()}</span>
            </div>
            
            ${data.balanceAmount && data.balanceAmount > 0 ? `
              <div class="summary-row">
                <span class="summary-label">
                  ${t.balance} ${data.balanceDueDate ? `(${new Date(data.balanceDueDate).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short' })})` : ''}
                  <span class="pending-badge">⏳</span>
                </span>
                <span class="summary-value">${data.currency} ${data.balanceAmount.toLocaleString()}</span>
              </div>
            ` : ''}
            
            ${data.securityDeposit && data.securityDeposit > 0 ? `
              <div class="summary-row">
                <span class="summary-label">🔒 ${t.securityDeposit} ${t.refundable}</span>
                <span class="summary-value">${data.currency} ${data.securityDeposit.toLocaleString()}</span>
              </div>
            ` : ''}
            
            <div class="total-row">
              <span class="total-label">${t.total}</span>
              <span class="total-amount">${data.currency} ${(data.totalAmount + (data.securityDeposit || 0)).toLocaleString()}</span>
            </div>
          </div>
          
          ${houseRulesHtml}
          
          ${hostHtml}
          
          <!-- Action Buttons -->
          <div style="text-align: center; margin: 32px 0;">
            ${data.voucherUrl ? `<a href="${data.voucherUrl}" class="button">📄 ${t.downloadVoucher}</a>` : ''}
            ${data.calendarUrl ? `<a href="${data.calendarUrl}" class="button-outline">📅 ${t.addToCalendar}</a>` : ''}
          </div>
          
          <p style="color: #6b7280; text-align: center; font-size: 14px;">${t.questions}</p>
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

  return { subject: t.subject, html };
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
