/**
 * Real Estate Revenue Engine (RERE) — canonical model.
 *
 * 4 stages of the foreigner real-estate funnel, each with explicit monetisation:
 *  1. Discovery     — free, top-of-funnel
 *  2. Trust         — paid verification (ClearView, fair-price, due diligence)
 *  3. Transaction   — commissions on resale / new-build / investment / rentals
 *  4. Post-tx (LTV) — Property Care, Owner Pro, MC Studio, Concierge
 *
 * Rates are mirrored in `system_settings` (key `revenue:*`) and read at runtime
 * via `useRevenueRates`. Hard-coded values here are defaults only.
 *
 * Tone: gov-tech. No "best", no "premium". Numbers explicit.
 */

export type RevenueStream =
  | 'R1_transaction'
  | 'R2_trust'
  | 'R3_subscription'
  | 'R4_lead'
  | 'R5_operate';

export type WhoPays = 'buyer' | 'seller' | 'guest' | 'host' | 'developer' | 'owner' | 'tenant' | 'platform';

export interface BiText {
  ru: string;
  en: string;
}

export interface RevenueLineItem {
  /** Stable id, used in `system_settings.key` as `revenue:<id>` */
  id: string;
  stream: RevenueStream;
  label: BiText;
  /** Either a percentage (0-100) OR a fixed amount in `currency`. */
  rate: number;
  rateKind: 'percent' | 'fixed';
  currency?: 'THB' | 'USD';
  whoPays: WhoPays;
  /** Optional minimum fee, same currency. */
  minFee?: number;
  /** Optional plain-text note shown next to the rate. */
  note?: BiText;
}

export interface RereStage {
  id: 'discovery' | 'trust' | 'transaction' | 'post_tx';
  order: 1 | 2 | 3 | 4;
  title: BiText;
  subtitle: BiText;
  /** What the user does in this stage. */
  description: BiText;
  /** Items monetised at this stage (empty for Discovery). */
  items: RevenueLineItem[];
}

// ── Stage 2 · Trust-as-a-Service ──────────────────────────────────────────────
export const TRUST_ITEMS: RevenueLineItem[] = [
  {
    id: 'trust_clearview',
    stream: 'R2_trust',
    label: { ru: 'ClearView — рейтинг проекта', en: 'ClearView project rating' },
    rate: 120000,
    rateKind: 'fixed',
    currency: 'THB',
    whoPays: 'developer',
    note: { ru: 'Срок отчёта: 15 рабочих дней', en: 'Report turnaround: 15 business days' },
  },
  {
    id: 'trust_fairprice',
    stream: 'R2_trust',
    label: { ru: 'Оценка справедливости цены', en: 'Fair-price assessment' },
    rate: 9900,
    rateKind: 'fixed',
    currency: 'THB',
    whoPays: 'buyer',
    note: { ru: 'Срок отчёта: 5 рабочих дней', en: 'Report turnaround: 5 business days' },
  },
  {
    id: 'trust_roi',
    stream: 'R2_trust',
    label: { ru: 'Отчёт ROI по объекту', en: 'Investment ROI report' },
    rate: 14900,
    rateKind: 'fixed',
    currency: 'THB',
    whoPays: 'buyer',
    note: { ru: 'Срок отчёта: 7 рабочих дней', en: 'Report turnaround: 7 business days' },
  },
  {
    id: 'trust_duediligence',
    stream: 'R2_trust',
    label: { ru: 'Юридический Due Diligence', en: 'Legal due diligence' },
    rate: 35000,
    rateKind: 'fixed',
    currency: 'THB',
    whoPays: 'buyer',
    note: { ru: 'Срок отчёта: 10 рабочих дней', en: 'Report turnaround: 10 business days' },
  },
  {
    id: 'trust_worldcheck',
    stream: 'R2_trust',
    label: { ru: 'WorldCheck KYC / AML', en: 'WorldCheck KYC / AML screening' },
    rate: 4900,
    rateKind: 'fixed',
    currency: 'THB',
    whoPays: 'buyer',
    note: {
      ru: 'Обязательно для сделок от 200 000 USD',
      en: 'Required for deals from USD 200 000',
    },
  },
];

// ── Stage 3 · Transaction commissions ─────────────────────────────────────────
export const TRANSACTION_ITEMS: RevenueLineItem[] = [
  {
    id: 'newbuild_commission',
    stream: 'R1_transaction',
    label: { ru: 'Новостройка / Off-plan', en: 'New-build / Off-plan' },
    rate: 6,
    rateKind: 'percent',
    currency: 'THB',
    whoPays: 'developer',
    note: { ru: 'Стандарт рынка: 5–7%', en: 'Market range: 5–7%' },
  },
  {
    id: 'resale_commission',
    stream: 'R1_transaction',
    label: { ru: 'Вторичная недвижимость (resale)', en: 'Resale property' },
    rate: 3,
    rateKind: 'percent',
    currency: 'THB',
    whoPays: 'seller',
    minFee: 120000,
    note: { ru: 'Минимальная комиссия: ฿120 000', en: 'Minimum fee: THB 120 000' },
  },
  {
    id: 'investment_deal_fee',
    stream: 'R1_transaction',
    label: { ru: 'Инвестиционная сделка от 200 000 USD', en: 'Investment deal from USD 200 000' },
    rate: 2,
    rateKind: 'percent',
    currency: 'USD',
    whoPays: 'buyer',
  },
  {
    id: 'escrow_fee',
    stream: 'R1_transaction',
    label: { ru: 'Эскроу-сопровождение сделки', en: 'Deal escrow handling' },
    rate: 0.5,
    rateKind: 'percent',
    currency: 'USD',
    whoPays: 'buyer',
  },
  {
    id: 'longterm_commission',
    stream: 'R1_transaction',
    label: { ru: 'Долгосрочная аренда / зимовка 30+ дней', en: 'Long-term rent / wintering 30+ days' },
    rate: 50,
    rateKind: 'percent',
    currency: 'THB',
    whoPays: 'owner',
    note: { ru: '50% от первого месяца аренды', en: '50% of the first month' },
  },
  {
    id: 'str_guest_fee',
    stream: 'R1_transaction',
    label: { ru: 'Краткосрочная аренда — комиссия гостя', en: 'Short-term rental — guest service fee' },
    rate: 12,
    rateKind: 'percent',
    currency: 'THB',
    whoPays: 'guest',
  },
  {
    id: 'str_host_fee',
    stream: 'R1_transaction',
    label: { ru: 'Краткосрочная аренда — комиссия хоста', en: 'Short-term rental — host fee' },
    rate: 3,
    rateKind: 'percent',
    currency: 'THB',
    whoPays: 'host',
  },
];

// ── Stage 4 · Post-transaction / LTV ──────────────────────────────────────────
export const POST_TX_ITEMS: RevenueLineItem[] = [
  {
    id: 'property_care_fee',
    stream: 'R5_operate',
    label: { ru: 'Property Care — заказ услуг', en: 'Property Care — services markup' },
    rate: 10,
    rateKind: 'percent',
    currency: 'THB',
    whoPays: 'owner',
    note: { ru: 'Комиссия от стоимости услуги', en: 'Markup on service price' },
  },
  {
    id: 'full_management',
    stream: 'R5_operate',
    label: { ru: 'Управление под ключ', en: 'Full management 70/30' },
    rate: 30,
    rateKind: 'percent',
    currency: 'THB',
    whoPays: 'owner',
    note: { ru: '70% владельцу / 30% оператору от чистого дохода', en: '70/30 split of net revenue' },
  },
  {
    id: 'owner_pro_subscription',
    stream: 'R3_subscription',
    label: { ru: 'Owner Pro — подписка', en: 'Owner Pro — subscription' },
    rate: 19,
    rateKind: 'fixed',
    currency: 'USD',
    whoPays: 'owner',
    note: { ru: 'В месяц / 1 объект', en: 'Per month / 1 property' },
  },
  {
    id: 'mc_studio_subscription',
    stream: 'R3_subscription',
    label: { ru: 'MC Studio — подписка для УК', en: 'MC Studio — subscription' },
    rate: 99,
    rateKind: 'fixed',
    currency: 'USD',
    whoPays: 'owner',
    note: { ru: 'В месяц / до 25 объектов', en: 'Per month / up to 25 properties' },
  },
];

// ── Stages ────────────────────────────────────────────────────────────────────
export const RERE_STAGES: RereStage[] = [
  {
    id: 'discovery',
    order: 1,
    title: { ru: 'Подбор', en: 'Discovery' },
    subtitle: { ru: 'Бесплатно', en: 'Free' },
    description: {
      ru: 'Каталог аренды, перепродажи и новостроек. Фильтры, карта, сравнение.',
      en: 'Catalogues for rent, resale and new-builds. Filters, map, comparison.',
    },
    items: [],
  },
  {
    id: 'trust',
    order: 2,
    title: { ru: 'Проверка', en: 'Trust' },
    subtitle: { ru: 'Платная верификация', en: 'Paid verification' },
    description: {
      ru: 'Независимая оценка проекта, цены, юридического статуса и контрагента.',
      en: 'Independent assessment of project, price, legal status and counterparty.',
    },
    items: TRUST_ITEMS,
  },
  {
    id: 'transaction',
    order: 3,
    title: { ru: 'Сделка', en: 'Transaction' },
    subtitle: { ru: 'Комиссия от сделки', en: 'Deal commission' },
    description: {
      ru: 'Сопровождение покупки, продажи или долгосрочной аренды до подписания.',
      en: 'Buy / sell / long-term rent support up to contract signing.',
    },
    items: TRANSACTION_ITEMS,
  },
  {
    id: 'post_tx',
    order: 4,
    title: { ru: 'Сопровождение', en: 'Post-transaction' },
    subtitle: { ru: 'Управление и сервис', en: 'Management & services' },
    description: {
      ru: 'Подписки и услуги для владельцев, управляющих компаний и арендаторов.',
      en: 'Subscriptions and services for owners, management companies, tenants.',
    },
    items: POST_TX_ITEMS,
  },
];

/** Flat list of all monetised items (used for `system_settings` seeding & lookups). */
export const RERE_ALL_ITEMS: RevenueLineItem[] = [
  ...TRUST_ITEMS,
  ...TRANSACTION_ITEMS,
  ...POST_TX_ITEMS,
];

export function getRereItem(id: string): RevenueLineItem | undefined {
  return RERE_ALL_ITEMS.find(item => item.id === id);
}

/** Format a rate for display: «3%» / «฿120 000» / «$19». */
export function formatRevenueRate(item: RevenueLineItem): string {
  if (item.rateKind === 'percent') return `${item.rate}%`;
  const symbol = item.currency === 'USD' ? '$' : '฿';
  const value = item.rate.toLocaleString('ru-RU').replace(/,/g, ' ');
  return `${symbol}${value}`;
}

/** Localised "who pays" label. */
export function formatWhoPays(who: WhoPays, isRu: boolean): string {
  const map: Record<WhoPays, BiText> = {
    buyer: { ru: 'покупатель', en: 'buyer' },
    seller: { ru: 'продавец', en: 'seller' },
    guest: { ru: 'гость', en: 'guest' },
    host: { ru: 'хост', en: 'host' },
    developer: { ru: 'застройщик', en: 'developer' },
    owner: { ru: 'владелец', en: 'owner' },
    tenant: { ru: 'арендатор', en: 'tenant' },
    platform: { ru: 'платформа', en: 'platform' },
  };
  return isRu ? map[who].ru : map[who].en;
}
