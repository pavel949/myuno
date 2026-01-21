// Unified email templates for myUNO platform

export const ORDER_TYPE_LABELS: Record<string, { en: string; ru: string; emoji: string }> = {
  restaurant: { en: 'Restaurant Order', ru: 'Заказ в ресторане', emoji: '🍽️' },
  flowers: { en: 'Flower Delivery', ru: 'Доставка цветов', emoji: '💐' },
  yacht: { en: 'Yacht Charter', ru: 'Аренда яхты', emoji: '🛥️' },
  tour: { en: 'Tour Booking', ru: 'Бронирование тура', emoji: '🗺️' },
  transport: { en: 'Transport', ru: 'Трансфер', emoji: '🚗' },
  cleaning: { en: 'Cleaning Service', ru: 'Услуги клининга', emoji: '🧹' },
  beauty: { en: 'Beauty Service', ru: 'Услуги красоты', emoji: '💅' },
  medical: { en: 'Medical Appointment', ru: 'Медицинский прием', emoji: '🏥' },
  pet: { en: 'Pet Service', ru: 'Услуги для питомцев', emoji: '🐾' },
  education: { en: 'Education', ru: 'Образование', emoji: '📚' },
  legal: { en: 'Legal Service', ru: 'Юридические услуги', emoji: '⚖️' },
  event: { en: 'Event Booking', ru: 'Бронирование мероприятия', emoji: '🎉' },
  property: { en: 'Property Rental', ru: 'Аренда недвижимости', emoji: '🏠' },
  water_activity: { en: 'Water Activity', ru: 'Водные развлечения', emoji: '🌊' },
  general: { en: 'Order', ru: 'Заказ', emoji: '📦' },
};

interface BaseEmailData {
  customerName: string;
  orderNumber: string;
  orderType: string;
  totalAmount: number;
  currency: string;
  language?: 'en' | 'ru';
}

interface OrderConfirmationData extends BaseEmailData {
  items?: Array<{ name: string; quantity: number; price: number }>;
  scheduledAt?: string;
  trackingUrl?: string;
}

interface OrderCancellationData extends BaseEmailData {
  reason?: string;
  refundAmount?: number;
}

interface WalletTopUpData {
  customerName: string;
  amount: number;
  currency: string;
  newBalance: number;
  language?: 'en' | 'ru';
}

const baseStyles = `
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background: #f3f4f6; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%); color: white; padding: 32px 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
    .header p { margin: 8px 0 0 0; opacity: 0.9; font-size: 16px; }
    .content { padding: 32px 24px; }
    .order-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .order-number { font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
    .order-value { font-size: 24px; font-weight: 700; color: #1f2937; margin: 4px 0; }
    .label { font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .value { font-size: 16px; color: #1f2937; margin-bottom: 16px; }
    .total-row { display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-top: 2px solid #e5e7eb; margin-top: 16px; }
    .total-label { font-size: 16px; font-weight: 600; color: #374151; }
    .total-amount { font-size: 28px; font-weight: 700; color: #059669; }
    .items-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    .items-table th { text-align: left; padding: 12px 8px; background: #f3f4f6; font-size: 12px; text-transform: uppercase; color: #6b7280; }
    .items-table td { padding: 12px 8px; border-bottom: 1px solid #e5e7eb; }
    .button { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 16px 0; }
    .footer { background: #1f2937; color: #9ca3af; padding: 24px; text-align: center; font-size: 14px; }
    .footer a { color: #a78bfa; }
    .success-badge { display: inline-block; background: #dcfce7; color: #166534; padding: 6px 12px; border-radius: 20px; font-size: 14px; font-weight: 600; }
    .cancelled-badge { display: inline-block; background: #fee2e2; color: #991b1b; padding: 6px 12px; border-radius: 20px; font-size: 14px; font-weight: 600; }
  </style>
`;

export function generateOrderConfirmationEmail(data: OrderConfirmationData): { subject: string; html: string } {
  const lang = data.language || 'en';
  const typeInfo = ORDER_TYPE_LABELS[data.orderType] || ORDER_TYPE_LABELS.general;
  const typeLabel = lang === 'ru' ? typeInfo.ru : typeInfo.en;
  
  const texts = {
    en: {
      subject: `Order Confirmed! #${data.orderNumber}`,
      greeting: `Hi ${data.customerName}!`,
      thankYou: 'Thank you for your order with myUNO',
      orderConfirmed: 'Your order has been confirmed',
      orderNumber: 'Order Number',
      orderType: 'Service Type',
      scheduledFor: 'Scheduled For',
      items: 'Order Details',
      item: 'Item',
      qty: 'Qty',
      price: 'Price',
      total: 'Total',
      trackOrder: 'Track Your Order',
      questions: 'Questions? Contact us anytime',
      footer: 'myUNO — Your Phuket Concierge',
    },
    ru: {
      subject: `Заказ подтверждён! #${data.orderNumber}`,
      greeting: `Привет, ${data.customerName}!`,
      thankYou: 'Спасибо за ваш заказ в myUNO',
      orderConfirmed: 'Ваш заказ подтверждён',
      orderNumber: 'Номер заказа',
      orderType: 'Тип услуги',
      scheduledFor: 'Запланировано на',
      items: 'Детали заказа',
      item: 'Услуга',
      qty: 'Кол-во',
      price: 'Цена',
      total: 'Итого',
      trackOrder: 'Отследить заказ',
      questions: 'Вопросы? Свяжитесь с нами',
      footer: 'myUNO — Ваш консьерж на Пхукете',
    },
  };
  
  const t = texts[lang];
  
  const scheduledDate = data.scheduledAt 
    ? new Date(data.scheduledAt).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  const itemsHtml = data.items && data.items.length > 0 
    ? `
      <div class="label">${t.items}</div>
      <table class="items-table">
        <thead>
          <tr>
            <th>${t.item}</th>
            <th>${t.qty}</th>
            <th>${t.price}</th>
          </tr>
        </thead>
        <tbody>
          ${data.items.map(item => `
            <tr>
              <td>${escapeHtml(item.name)}</td>
              <td>${item.quantity}</td>
              <td>${item.price} ${data.currency}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
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
          <h1>${typeInfo.emoji} ${t.orderConfirmed}</h1>
          <p>${t.thankYou}</p>
        </div>
        
        <div class="content">
          <p style="font-size: 18px;">${t.greeting}</p>
          
          <div class="order-card">
            <span class="success-badge">✓ ${lang === 'ru' ? 'Оплачено' : 'Paid'}</span>
            
            <div style="margin-top: 16px;">
              <div class="label">${t.orderNumber}</div>
              <div class="order-value">#${data.orderNumber}</div>
            </div>
            
            <div class="label">${t.orderType}</div>
            <div class="value">${typeInfo.emoji} ${typeLabel}</div>
            
            ${scheduledDate ? `
              <div class="label">${t.scheduledFor}</div>
              <div class="value">📅 ${scheduledDate}</div>
            ` : ''}
            
            ${itemsHtml}
            
            <div class="total-row">
              <span class="total-label">${t.total}</span>
              <span class="total-amount">${data.totalAmount} ${data.currency}</span>
            </div>
          </div>
          
          ${data.trackingUrl ? `
            <div style="text-align: center;">
              <a href="${data.trackingUrl}" class="button">${t.trackOrder} →</a>
            </div>
          ` : ''}
          
          <p style="color: #6b7280; text-align: center;">${t.questions}</p>
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

export function generateOrderCancellationEmail(data: OrderCancellationData): { subject: string; html: string } {
  const lang = data.language || 'en';
  const typeInfo = ORDER_TYPE_LABELS[data.orderType] || ORDER_TYPE_LABELS.general;
  
  const texts = {
    en: {
      subject: `Order Cancelled - #${data.orderNumber}`,
      greeting: `Hi ${data.customerName},`,
      cancelled: 'Your order has been cancelled',
      orderNumber: 'Order Number',
      reason: 'Reason',
      refundNote: 'A refund has been initiated',
      refundAmount: 'Refund Amount',
      contact: 'If you have questions, please contact our support team.',
      footer: 'myUNO — Your Phuket Concierge',
    },
    ru: {
      subject: `Заказ отменён - #${data.orderNumber}`,
      greeting: `Привет, ${data.customerName},`,
      cancelled: 'Ваш заказ был отменён',
      orderNumber: 'Номер заказа',
      reason: 'Причина',
      refundNote: 'Возврат средств инициирован',
      refundAmount: 'Сумма возврата',
      contact: 'Если у вас есть вопросы, свяжитесь с нашей службой поддержки.',
      footer: 'myUNO — Ваш консьерж на Пхукете',
    },
  };
  
  const t = texts[lang];

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
        <div class="header" style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);">
          <h1>❌ ${t.cancelled}</h1>
        </div>
        
        <div class="content">
          <p style="font-size: 18px;">${t.greeting}</p>
          
          <div class="order-card">
            <span class="cancelled-badge">${lang === 'ru' ? 'Отменён' : 'Cancelled'}</span>
            
            <div style="margin-top: 16px;">
              <div class="label">${t.orderNumber}</div>
              <div class="order-value">#${data.orderNumber}</div>
            </div>
            
            ${data.reason ? `
              <div class="label">${t.reason}</div>
              <div class="value">${escapeHtml(data.reason)}</div>
            ` : ''}
            
            ${data.refundAmount ? `
              <div style="background: #ecfdf5; padding: 16px; border-radius: 8px; margin-top: 16px;">
                <div class="label">${t.refundNote}</div>
                <div style="font-size: 20px; font-weight: 700; color: #059669;">${data.refundAmount} ${data.currency}</div>
              </div>
            ` : ''}
          </div>
          
          <p style="color: #6b7280;">${t.contact}</p>
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

export function generateWalletTopUpEmail(data: WalletTopUpData): { subject: string; html: string } {
  const lang = data.language || 'en';
  
  const texts = {
    en: {
      subject: `Wallet Top-Up Successful - ${data.amount} ${data.currency}`,
      greeting: `Hi ${data.customerName}!`,
      success: 'Your wallet has been topped up',
      amount: 'Amount Added',
      newBalance: 'New Balance',
      spendNote: 'Use your balance for any service on myUNO',
      footer: 'myUNO — Your Phuket Concierge',
    },
    ru: {
      subject: `Кошелёк пополнен - ${data.amount} ${data.currency}`,
      greeting: `Привет, ${data.customerName}!`,
      success: 'Ваш кошелёк пополнен',
      amount: 'Сумма пополнения',
      newBalance: 'Новый баланс',
      spendNote: 'Используйте баланс для любых услуг на myUNO',
      footer: 'myUNO — Ваш консьерж на Пхукете',
    },
  };
  
  const t = texts[lang];

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
        <div class="header" style="background: linear-gradient(135deg, #059669 0%, #10b981 100%);">
          <h1>💰 ${t.success}</h1>
        </div>
        
        <div class="content">
          <p style="font-size: 18px;">${t.greeting}</p>
          
          <div class="order-card">
            <span class="success-badge">✓ ${lang === 'ru' ? 'Успешно' : 'Success'}</span>
            
            <div style="margin-top: 16px;">
              <div class="label">${t.amount}</div>
              <div class="order-value" style="color: #059669;">+${data.amount} ${data.currency}</div>
            </div>
            
            <div class="total-row">
              <span class="total-label">${t.newBalance}</span>
              <span class="total-amount">${data.newBalance} ${data.currency}</span>
            </div>
          </div>
          
          <p style="color: #6b7280; text-align: center;">${t.spendNote}</p>
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
