/** Request submission does not itself confirm service arrangements or a response SLA. */
export const serviceRequestConfirmationNote = {
  ru: 'Цена, время и исполнитель требуют подтверждения после отправки заявки.',
  en: 'Price, time and provider require confirmation after you submit your request.',
  th: 'ราคา เวลา และผู้ให้บริการต้องได้รับการยืนยันหลังจากส่งคำขอ',
} as const;

export function getServiceRequestConfirmationNote(language: string): string {
  return serviceRequestConfirmationNote[language === 'ru' || language === 'th' ? language : 'en'];
}
