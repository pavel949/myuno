/**
 * @module i18n/uiStrings
 * @description Canonical UI strings dictionary (M7 · Track B).
 *
 * Source: `docs/canonical/03-tone-of-voice.md` §13 (canonical examples) and §14
 * (forbidden words). All strings here are guaranteed to satisfy the ESLint
 * `no-restricted-syntax` rule for tone-of-voice violations.
 *
 * Usage:
 *   import { uiStrings } from '@/i18n/uiStrings';
 *   const { language } = useLanguage();
 *   button.label = uiStrings.cta.details[language];
 *
 * NOTE: This is *additive* — it does not replace `src/i18n/{ru,en,th}.ts`.
 * Existing screens migrate incrementally. New code should prefer `uiStrings`.
 */

export type UiStringLang = 'ru' | 'en' | 'th';

interface Trilingual {
  ru: string;
  en: string;
  /** Thai — machine-translated, pending native review (see th.machine-pending.json). */
  th: string;
}

export const uiStrings = {
  cta: {
    primary: { ru: 'Начать', en: 'Start', th: 'เริ่มต้น' } satisfies Trilingual,
    submit: { ru: 'Отправить', en: 'Submit', th: 'ส่ง' } satisfies Trilingual,
    details: { ru: 'Подробнее', en: 'Details', th: 'รายละเอียด' } satisfies Trilingual,
    contact: { ru: 'Написать нам', en: 'Contact us', th: 'ติดต่อเรา' } satisfies Trilingual,
    /** Canonical replacement for «Узнать больше». */
    learnMore: { ru: 'Подробнее', en: 'Learn more', th: 'เรียนรู้เพิ่มเติม' } satisfies Trilingual,
    retry: { ru: 'Повторить', en: 'Try again', th: 'ลองอีกครั้ง' } satisfies Trilingual,
    cancel: { ru: 'Отменить', en: 'Cancel', th: 'ยกเลิก' } satisfies Trilingual,
    save: { ru: 'Сохранить', en: 'Save', th: 'บันทึก' } satisfies Trilingual,
    close: { ru: 'Закрыть', en: 'Close', th: 'ปิด' } satisfies Trilingual,
    chooseOptions: {
      ru: 'Подберём подходящие варианты',
      en: 'We will pick suitable options',
      th: 'เราจะเลือกตัวเลือกที่เหมาะสมให้คุณ',
    } satisfies Trilingual,
  },
  empty: {
    noProperties: {
      ru: 'Пока нет объектов. Когда появятся — увидите их здесь.',
      en: 'No properties yet. They will appear here once added.',
      th: 'ยังไม่มีรายการ เมื่อมีรายการจะแสดงที่นี่',
    } satisfies Trilingual,
    noTransactions: {
      ru: 'История пуста. Первая транзакция появится после оплаты.',
      en: 'History is empty. Your first transaction will appear after payment.',
      th: 'ยังไม่มีประวัติ รายการแรกจะปรากฏหลังการชำระเงิน',
    } satisfies Trilingual,
    noResults: {
      ru: 'Ничего не нашли. Попробуйте смягчить фильтры.',
      en: 'Nothing found. Try relaxing the filters.',
      th: 'ไม่พบผลลัพธ์ ลองปรับตัวกรองให้กว้างขึ้น',
    } satisfies Trilingual,
    noNotifications: {
      ru: 'Уведомлений нет. Здесь появятся обновления по заявкам и бронированиям.',
      en: 'No notifications. Updates on your requests and bookings will appear here.',
      th: 'ไม่มีการแจ้งเตือน อัปเดตคำขอและการจองจะแสดงที่นี่',
    } satisfies Trilingual,
  },
  errors: {
    network: {
      ru: 'Не удалось отправить. Проверьте соединение и попробуйте снова. Если ошибка повторяется — напишите нам.',
      en: 'Could not send. Check your connection and try again. If the error persists — contact us.',
      th: 'ส่งไม่สำเร็จ โปรดตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง หากยังเกิดข้อผิดพลาด โปรดติดต่อเรา',
    } satisfies Trilingual,
    generic: {
      ru: 'Не получилось выполнить действие. Попробуйте ещё раз через минуту.',
      en: 'Action could not be completed. Please try again in a minute.',
      th: 'ดำเนินการไม่สำเร็จ โปรดลองอีกครั้งในอีกสักครู่',
    } satisfies Trilingual,
    validation: {
      ru: 'Проверьте поля, отмеченные красным.',
      en: 'Please review the fields highlighted in red.',
      th: 'โปรดตรวจสอบช่องที่ทำเครื่องหมายสีแดง',
    } satisfies Trilingual,
    unauthorized: {
      ru: 'Нужно войти, чтобы продолжить.',
      en: 'Sign in to continue.',
      th: 'กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ',
    } satisfies Trilingual,
    notFound: {
      ru: 'Не нашли запрашиваемую страницу.',
      en: 'We could not find the page you requested.',
      th: 'ไม่พบหน้าที่คุณค้นหา',
    } satisfies Trilingual,
    paymentFailed: {
      ru: 'Платёж не прошёл. Деньги не списаны. Проверьте карту или выберите другой способ.',
      en: 'Payment did not go through. No funds were charged. Try another card or method.',
      th: 'การชำระเงินไม่สำเร็จ ไม่มีการตัดเงิน โปรดลองบัตรอื่นหรือวิธีอื่น',
    } satisfies Trilingual,
  },
  success: {
    paymentSent: {
      ru: 'Платёж отправлен. Деньги в escrow до подтверждения.',
      en: 'Payment sent. Funds are held in escrow until confirmation.',
      th: 'ส่งการชำระเงินแล้ว เงินจะถูกพักไว้จนกว่าจะยืนยัน',
    } satisfies Trilingual,
    profileSaved: {
      ru: 'Профиль обновлён.',
      en: 'Profile updated.',
      th: 'อัปเดตโปรไฟล์แล้ว',
    } satisfies Trilingual,
    requestSent: {
      ru: 'Заявка отправлена. Менеджер свяжется в течение 2 часов.',
      en: 'Request sent. A manager will reach out within 2 hours.',
      th: 'ส่งคำขอแล้ว ผู้จัดการจะติดต่อกลับภายใน 2 ชั่วโมง',
    } satisfies Trilingual,
    copied: {
      ru: 'Скопировано.',
      en: 'Copied.',
      th: 'คัดลอกแล้ว',
    } satisfies Trilingual,
  },
} as const;

export type UiStringsKey =
  | keyof typeof uiStrings.cta
  | keyof typeof uiStrings.empty
  | keyof typeof uiStrings.errors
  | keyof typeof uiStrings.success;
