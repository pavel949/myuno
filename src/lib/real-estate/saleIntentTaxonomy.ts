/**
 * Taxonomy for sale-side real-estate options (intent / quick-sale / transfer fee / title deed).
 * Mirrors validate_property_tracks() trigger in DB. Keep enum values in sync.
 */

export type SaleIntent = 'standard' | 'assignment' | 'quick_sale';
export type TransferFeeSplit = 'buyer' | 'seller' | '50_50';
export type EscrowProvider = 'platform' | 'lawyer' | 'bank' | 'other';
export type QuickSaleReason =
  | 'relocation'
  | 'divorce'
  | 'financial'
  | 'business'
  | 'inheritance'
  | 'health'
  | 'other';
export type TitleDeedType =
  | 'chanote'
  | 'nor_sor_3_gor'
  | 'nor_sor_3'
  | 'sor_kor_1'
  | 'leasehold'
  | 'company_owned'
  | 'other';
export type SpaStage =
  | 'reservation'
  | 'booking'
  | 'contract_signed'
  | 'dbd_registered'
  | 'transferred';
export type TenancyMode = 'short' | 'medium' | 'long';

export interface BiLabel {
  en: string;
  ru: string;
}

export const TENANCY_MODES: Array<{ value: TenancyMode } & BiLabel & { desc: BiLabel }> = [
  {
    value: 'short',
    en: 'Short-term (nightly)',
    ru: 'Краткосрочно (посуточно)',
    desc: { en: '1–29 nights · tourists', ru: '1–29 ночей · туристы' },
  },
  {
    value: 'medium',
    en: 'Medium-term (1+ month)',
    ru: 'Среднесрочно (1+ месяц)',
    desc: { en: '30–179 nights · digital nomads', ru: '30–179 ночей · цифровые кочевники' },
  },
  {
    value: 'long',
    en: 'Long-term (6+ months)',
    ru: 'Долгосрочно (6+ месяцев)',
    desc: { en: '6m / 12m contract · expats', ru: 'Контракт 6/12 мес · экспаты' },
  },
];

export const SALE_INTENTS: Array<{ value: SaleIntent } & BiLabel & { desc: BiLabel }> = [
  {
    value: 'standard',
    en: 'Standard sale',
    ru: 'Обычная продажа',
    desc: { en: 'Ready property, normal timeline', ru: 'Готовый объект, обычные сроки' },
  },
  {
    value: 'assignment',
    en: 'Assignment of rights',
    ru: 'Переуступка прав',
    desc: { en: 'Off-plan / under construction', ru: 'Новостройка, не достроена' },
  },
  {
    value: 'quick_sale',
    en: 'Quick / distressed sale',
    ru: 'Срочная продажа',
    desc: { en: 'Below market, fast deal', ru: 'Ниже рынка, быстрая сделка' },
  },
];

export const TRANSFER_FEE_SPLITS: Array<{ value: TransferFeeSplit } & BiLabel> = [
  { value: '50_50', en: '50 / 50 (standard)', ru: '50 / 50 (стандарт)' },
  { value: 'seller', en: 'Seller pays', ru: 'Платит продавец' },
  { value: 'buyer', en: 'Buyer pays', ru: 'Платит покупатель' },
];

export const ESCROW_PROVIDERS: Array<{ value: EscrowProvider } & BiLabel & { desc: BiLabel }> = [
  {
    value: 'platform',
    en: 'myUNO escrow',
    ru: 'Эскроу myUNO',
    desc: { en: '0.5% fee, regulated', ru: 'Комиссия 0,5%, под контролем' },
  },
  {
    value: 'lawyer',
    en: 'Independent lawyer',
    ru: 'Независимый юрист',
    desc: { en: 'Buyer-chosen attorney', ru: 'Юрист по выбору покупателя' },
  },
  {
    value: 'bank',
    en: 'Bank escrow',
    ru: 'Банковский эскроу',
    desc: { en: 'SCB / Bangkok Bank', ru: 'SCB / Bangkok Bank' },
  },
  {
    value: 'other',
    en: 'Other',
    ru: 'Другой',
    desc: { en: 'Specify in details', ru: 'Уточнить в описании' },
  },
];

export const QUICK_SALE_REASONS: Array<{ value: QuickSaleReason } & BiLabel> = [
  { value: 'relocation', en: 'Relocation', ru: 'Переезд' },
  { value: 'financial', en: 'Financial reasons', ru: 'Финансовые причины' },
  { value: 'divorce', en: 'Divorce / family', ru: 'Развод / семья' },
  { value: 'business', en: 'Business needs', ru: 'Нужды бизнеса' },
  { value: 'inheritance', en: 'Inheritance', ru: 'Наследство' },
  { value: 'health', en: 'Health reasons', ru: 'Здоровье' },
  { value: 'other', en: 'Other', ru: 'Другое' },
];

export const TITLE_DEED_TYPES: Array<{ value: TitleDeedType } & BiLabel & { desc: BiLabel }> = [
  {
    value: 'chanote',
    en: 'Chanote (Nor Sor 4)',
    ru: 'Чанот (Nor Sor 4)',
    desc: { en: 'Full freehold title — gold standard', ru: 'Полная собственность — золотой стандарт' },
  },
  {
    value: 'nor_sor_3_gor',
    en: 'Nor Sor 3 Gor',
    ru: 'Nor Sor 3 Gor',
    desc: { en: 'Confirmed title, can upgrade to chanote', ru: 'Подтверждённое право, можно обновить до chanote' },
  },
  {
    value: 'nor_sor_3',
    en: 'Nor Sor 3',
    ru: 'Nor Sor 3',
    desc: { en: 'Less precise boundaries', ru: 'Менее точные границы' },
  },
  {
    value: 'sor_kor_1',
    en: 'Sor Kor 1',
    ru: 'Sor Kor 1',
    desc: { en: 'Possessory claim only', ru: 'Только декларация владения' },
  },
  {
    value: 'leasehold',
    en: 'Leasehold (30y registered)',
    ru: 'Лизхолд (30 лет, зарег.)',
    desc: { en: 'Long-term lease registered at Land Office', ru: 'Долгосрочная аренда в Земельном офисе' },
  },
  {
    value: 'company_owned',
    en: 'Thai company-owned',
    ru: 'Через тайскую компанию',
    desc: { en: 'Land held via Thai LLC', ru: 'Земля на тайской компании' },
  },
  {
    value: 'other',
    en: 'Other',
    ru: 'Другое',
    desc: { en: '', ru: '' },
  },
];

export const SPA_STAGES: Array<{ value: SpaStage } & BiLabel> = [
  { value: 'reservation', en: 'Reservation only', ru: 'Только бронь' },
  { value: 'booking', en: 'Booking deposit paid', ru: 'Бук. депозит внесён' },
  { value: 'contract_signed', en: 'SPA signed', ru: 'SPA подписан' },
  { value: 'dbd_registered', en: 'DBD-registered', ru: 'Зарегистрирован в DBD' },
  { value: 'transferred', en: 'Title transferred', ru: 'Право собственности оформлено' },
];

export function getTenancyLabel(value: TenancyMode, isRu: boolean): string {
  const item = TENANCY_MODES.find(t => t.value === value);
  if (!item) return value;
  return isRu ? item.ru : item.en;
}

export function getSaleIntentLabel(value: SaleIntent | null | undefined, isRu: boolean): string {
  if (!value) return '';
  const item = SALE_INTENTS.find(t => t.value === value);
  if (!item) return value;
  return isRu ? item.ru : item.en;
}
