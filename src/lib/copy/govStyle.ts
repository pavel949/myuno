/**
 * Gov-style copy glossary — service-cabinet tone (Госуслуги / ГосТех).
 *
 * Rules (canonical, see mem://style/gov-tone-standard):
 * 1. Impersonal constructions. No "you receive / you get".
 * 2. Every abbreviation is decoded on first mention.
 * 3. Buttons are nominal phrases, not imperatives.
 * 4. Section headings are service labels ("Услуги", "Уведомления").
 * 5. No metaphors ("закрывает", "направления", "инфраструктура") in UI.
 * 6. Numbers and timeframes are explicit.
 *
 * This file is a reference — components import individual constants
 * or inline the equivalent text directly.
 */

export const GOV_LABELS = {
  notice: { ru: 'Уведомление', en: 'Notice' },
  services: { ru: 'Услуги', en: 'Services' },
  servicesByProfile: {
    ru: 'Услуги по вашему профилю',
    en: 'Services for your profile',
  },
  allServicesSorted: {
    ru: 'Все сервисы. Сортировка по вашему профилю.',
    en: 'All services. Sorted by your profile.',
  },
  helpDesk: { ru: 'Справочная служба', en: 'Help desk' },
  goToSection: { ru: 'Перейти к разделу', en: 'Go to section' },
  postpone: { ru: 'Отложить', en: 'Postpone' },
  contactHelpDesk: { ru: 'Обращение в справочную', en: 'Contact help desk' },
  rolesAndOrder: {
    ru: 'Категории и порядок отображения',
    en: 'Categories and display order',
  },
  serviceCount: (n: number) => ({
    ru: `${n} сервисов`,
    en: `${n} services`,
  }),
} as const;

export const GOV_GLOSSARY = {
  // Term decoding for first mention
  TM30: { ru: 'уведомление о месте пребывания (TM30)', en: 'place-of-stay notice (TM30)' },
  WP: { ru: 'разрешение на работу', en: 'work permit' },
  LTR: { ru: 'долгосрочная виза LTR', en: 'long-term visa (LTR)' },
  DTV: { ru: 'виза цифрового кочевника DTV', en: 'digital nomad visa (DTV)' },
  SOS: { ru: 'экстренная помощь', en: 'emergency assistance' },
  PMS: { ru: 'управление объектом и размещением', en: 'property and listing management' },
  offplan: { ru: 'объекты на стадии строительства', en: 'properties under construction' },
} as const;
