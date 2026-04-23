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

export type UiStringLang = 'ru' | 'en';

interface Bilingual {
  ru: string;
  en: string;
}

export const uiStrings = {
  cta: {
    primary: { ru: 'Начать', en: 'Start' } satisfies Bilingual,
    submit: { ru: 'Отправить', en: 'Submit' } satisfies Bilingual,
    details: { ru: 'Подробнее', en: 'Details' } satisfies Bilingual,
    contact: { ru: 'Написать нам', en: 'Contact us' } satisfies Bilingual,
    /** Canonical replacement for «Узнать больше». */
    learnMore: { ru: 'Подробнее', en: 'Learn more' } satisfies Bilingual,
    retry: { ru: 'Повторить', en: 'Try again' } satisfies Bilingual,
    cancel: { ru: 'Отменить', en: 'Cancel' } satisfies Bilingual,
    save: { ru: 'Сохранить', en: 'Save' } satisfies Bilingual,
    close: { ru: 'Закрыть', en: 'Close' } satisfies Bilingual,
    chooseOptions: {
      ru: 'Подберём подходящие варианты',
      en: 'We will pick suitable options',
    } satisfies Bilingual,
  },
  empty: {
    noProperties: {
      ru: 'Пока нет объектов. Когда появятся — увидите их здесь.',
      en: 'No properties yet. They will appear here once added.',
    } satisfies Bilingual,
    noTransactions: {
      ru: 'История пуста. Первая транзакция появится после оплаты.',
      en: 'History is empty. Your first transaction will appear after payment.',
    } satisfies Bilingual,
    noResults: {
      ru: 'Ничего не нашли. Попробуйте смягчить фильтры.',
      en: 'Nothing found. Try relaxing the filters.',
    } satisfies Bilingual,
    noNotifications: {
      ru: 'Уведомлений нет. Здесь появятся обновления по заявкам и бронированиям.',
      en: 'No notifications. Updates on your requests and bookings will appear here.',
    } satisfies Bilingual,
  },
  errors: {
    network: {
      ru: 'Не удалось отправить. Проверьте соединение и попробуйте снова. Если ошибка повторяется — напишите нам.',
      en: 'Could not send. Check your connection and try again. If the error persists — contact us.',
    } satisfies Bilingual,
    generic: {
      ru: 'Не получилось выполнить действие. Попробуйте ещё раз через минуту.',
      en: 'Action could not be completed. Please try again in a minute.',
    } satisfies Bilingual,
    validation: {
      ru: 'Проверьте поля, отмеченные красным.',
      en: 'Please review the fields highlighted in red.',
    } satisfies Bilingual,
    unauthorized: {
      ru: 'Нужно войти, чтобы продолжить.',
      en: 'Sign in to continue.',
    } satisfies Bilingual,
    notFound: {
      ru: 'Не нашли запрашиваемую страницу.',
      en: 'We could not find the page you requested.',
    } satisfies Bilingual,
    paymentFailed: {
      ru: 'Платёж не прошёл. Деньги не списаны. Проверьте карту или выберите другой способ.',
      en: 'Payment did not go through. No funds were charged. Try another card or method.',
    } satisfies Bilingual,
  },
  success: {
    paymentSent: {
      ru: 'Платёж отправлен. Деньги в escrow до подтверждения.',
      en: 'Payment sent. Funds are held in escrow until confirmation.',
    } satisfies Bilingual,
    profileSaved: {
      ru: 'Профиль обновлён.',
      en: 'Profile updated.',
    } satisfies Bilingual,
    requestSent: {
      ru: 'Заявка отправлена. Менеджер свяжется в течение 2 часов.',
      en: 'Request sent. A manager will reach out within 2 hours.',
    } satisfies Bilingual,
    copied: {
      ru: 'Скопировано.',
      en: 'Copied.',
    } satisfies Bilingual,
  },
} as const;

export type UiStringsKey =
  | keyof typeof uiStrings.cta
  | keyof typeof uiStrings.empty
  | keyof typeof uiStrings.errors
  | keyof typeof uiStrings.success;
