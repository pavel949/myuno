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
  /** Canonical results counter for MiniAppLayout.subtitle across all verticals. */
  resultsCount: (n: number) => ({
    ru: `Найдено: ${n}`,
    en: `${n} results`,
  }),
} as const;

/** Nominal-phrase button labels — never use imperatives in UI. */
export const GOV_BUTTONS = {
  open: { ru: 'Перейти к разделу', en: 'Go to section' },
  openShort: { ru: 'Перейти', en: 'Open' },
  all: { ru: 'Все записи', en: 'All entries' },
  list: { ru: 'Список', en: 'List' },
  browseDeals: { ru: 'Список сделок', en: 'Deal list' },
  submitDeal: { ru: 'Подача проекта', en: 'Project submission' },
  raiseCapital: { ru: 'Подача проекта', en: 'Project submission' },
  dashboard: { ru: 'Личный кабинет', en: 'Cabinet' },
  myOrders: { ru: 'Мои заказы', en: 'My orders' },
  backToCatalog: { ru: 'Вернуться в каталог', en: 'Back to catalog' },
  continue: { ru: 'Продолжить', en: 'Continue' },
} as const;

/** Monetisation labels — gov-tone, no marketing wording. */
export const MONETIZATION_LABELS = {
  feeBlock: { ru: 'Комиссия и сборы', en: 'Fees and commission' },
  whoPays: { ru: 'Кто платит', en: 'Paid by' },
  serviceOperator: { ru: 'Оператор сервиса', en: 'Service operator' },
  reportTurnaround: { ru: 'Срок отчёта', en: 'Report turnaround' },
  paymentMethod: { ru: 'Способ оплаты', en: 'Payment method' },
  refundPolicy: { ru: 'Условия возврата', en: 'Refund policy' },
  auditMarker: { ru: 'Аудит-маркер сделки', en: 'Transaction audit marker' },
  txId: { ru: 'Идентификатор операции', en: 'Transaction ID' },
  ledgerId: { ru: 'Запись в реестре', en: 'Ledger entry' },
  feeIncludedNote: {
    ru: 'Комиссия удерживается с продавца. Цена для покупателя не меняется.',
    en: 'Commission is withheld from the seller. The buyer pays the listed price.',
  },
} as const;

/** Real-estate trust labels — for ClearView, fair-price, due diligence. */
export const RE_TRUST_LABELS = {
  trustBlock: { ru: 'Проверка и оценка', en: 'Trust and assessment' },
  trustOneLiner: {
    ru: 'Независимая верификация проекта, цены и юридического статуса.',
    en: 'Independent verification of project, price and legal status.',
  },
  orderReport: { ru: 'Заказать отчёт', en: 'Order report' },
  sampleReport: { ru: 'Образец отчёта (PDF)', en: 'Sample report (PDF)' },
  ratedBadge: { ru: 'Проверено по методике ClearView', en: 'ClearView verified' },
  notRatedBadge: { ru: 'Не проверено по методике ClearView', en: 'Not ClearView rated' },
} as const;

/** ClearView product labels — for the dedicated landing. */
export const CLEARVIEW_LABELS = {
  productName: { ru: 'ClearView — рейтинг проекта', en: 'ClearView — project rating' },
  forDevelopers: { ru: 'Для застройщиков', en: 'For developers' },
  forBuyers: { ru: 'Для покупателей', en: 'For buyers' },
  methodology: { ru: 'Методика и критерии', en: 'Methodology and criteria' },
  applyButton: { ru: 'Подача проекта на рейтинг', en: 'Submit project for rating' },
  priceLine: { ru: 'Стоимость отчёта: ฿120 000', en: 'Report fee: THB 120 000' },
  scopeLine: {
    ru: '8 категорий: юридический статус, девелопер, строительство, локация, финансы, ROI, продажи, ликвидность.',
    en: '8 categories: legal, developer, construction, location, financial, ROI, sales, liquidity.',
  },
  yearOneNote: {
    ru: 'В 2025 году рейтинг присваивается только неброкеридж-проектам.',
    en: 'In 2025, ratings are issued for non-brokered projects only.',
  },
} as const;

/** Real-estate funnel — entry tracks for the home screen RealEstateEntry block. */
export const RE_ENTRY_LABELS = {
  blockTitle: {
    ru: 'Недвижимость на Пхукете',
    en: 'Real estate in Phuket',
  },
  blockSubtitle: {
    ru: 'Каталог, проверка проекта и сопровождение сделки.',
    en: 'Catalogue, project verification and deal support.',
  },
  trackRent: { ru: 'Аренда', en: 'Rent' },
  trackRentSub: {
    ru: 'Краткосрочная и долгосрочная аренда квартир и вилл.',
    en: 'Short-term and long-term apartments and villas.',
  },
  trackBuy: { ru: 'Покупка', en: 'Buy' },
  trackBuySub: {
    ru: 'Вторичная недвижимость, новостройки, проверка ClearView.',
    en: 'Resale, new-builds, ClearView verification.',
  },
  trackInvest: { ru: 'Инвестиции', en: 'Investment' },
  trackInvestSub: {
    ru: 'Сделки от 200 000 USD: ROI-отчёт, эскроу, защита через омбудсмена.',
    en: 'Deals from USD 200 000: ROI report, escrow, ombudsman protection.',
  },
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
