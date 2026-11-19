// Customer "received" email — localized
const CUSTOMER_RECEIVED = {
  ru: {
    subject: (n: string) => `Заявка #${n} получена — ожидает подтверждения`,
    title: 'Спасибо! Заявка на трансфер принята',
    orderLabel: 'Номер заявки',
    routeLabel: 'Маршрут',
    dateLabel: 'Дата',
    operatorLine: 'Команда myUNO проверит детали и свяжется с вами для подтверждения.',
    amountLabel: 'Сумма',
    locale: 'ru-RU',
  },
  en: {
    subject: (n: string) => `Request #${n} received — awaiting confirmation`,
    title: 'Thank you! Your transfer request has been received',
    orderLabel: 'Request number',
    routeLabel: 'Route',
    dateLabel: 'Date',
    operatorLine: 'The myUNO team will review the details and contact you to confirm.',
    amountLabel: 'Total',
    locale: 'en-GB',
  },
  th: {
    subject: (n: string) => `รับคำขอ #${n} แล้ว — รอการยืนยัน`,
    title: 'ขอบคุณ! เราได้รับคำขอจองรถรับส่งของคุณแล้ว',
    orderLabel: 'หมายเลขคำขอ',
    routeLabel: 'เส้นทาง',
    dateLabel: 'วันที่',
    operatorLine: 'ทีม myUNO จะตรวจสอบรายละเอียดและติดต่อคุณเพื่อยืนยัน',
    amountLabel: 'ยอดรวม',
    locale: 'th-TH',
  },
} as const;

export function transferReceiptLanguage(value: unknown) {
  return value === 'en' || value === 'th' ? value : 'ru';
}

export function transferCustomerReceiptCopy(language: ReturnType<typeof transferReceiptLanguage>) {
  return CUSTOMER_RECEIVED[language];
}
