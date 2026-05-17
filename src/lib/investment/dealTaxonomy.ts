/**
 * Investment Hub — Deal taxonomy (universal capital marketplace)
 * Single source of truth for deal_intent, deal categories, capital ranges, stages.
 */

export type DealIntent =
  | 'raise_capital'
  | 'find_buyer'
  | 'find_partner'
  | 'pitch_idea'
  | 'business_sale'
  | 'other';

export type DealStage = 'idea' | 'pre_revenue' | 'operating' | 'profitable' | 'exiting';

export type CapitalRangeKey = 'sub_100k' | '100k_500k' | '500k_2m' | '2m_10m' | '10m_plus';

export type InvestorType = 'individual' | 'family_office' | 'fund' | 'corporate' | 'other';

export type DealPipelineStatus =
  | 'submitted' | 'under_review' | 'anonymized' | 'published'
  | 'interest_received' | 'matched' | 'term_sheet' | 'closed' | 'dead';

export interface DealIntentOption {
  key: DealIntent;
  labelEn: string;
  labelRu: string;
  descriptionEn: string;
  descriptionRu: string;
  icon: string;
}

export const DEAL_INTENTS: DealIntentOption[] = [
  { key: 'raise_capital',  icon: '💰', labelEn: 'List a developer project', labelRu: 'Разместить проект девелопера', descriptionEn: 'Developer project profile for buyer club introductions', descriptionRu: 'Профиль проекта девелопера для представлений buyer club' },
  { key: 'find_buyer',     icon: '🤝', labelEn: 'Find a buyer / exit',         labelRu: 'Найти покупателя / выход',  descriptionEn: 'Selling a business or asset',           descriptionRu: 'Продаю бизнес или актив' },
  { key: 'find_partner',   icon: '🧩', labelEn: 'Find a partner / co-buyer',   labelRu: 'Найти партнёра / соинвестора', descriptionEn: 'Looking for an operating or capital partner', descriptionRu: 'Ищу операционного или финансового партнёра' },
  { key: 'pitch_idea',     icon: '💡', labelEn: 'Submit an idea / startup',    labelRu: 'Подать идею / стартап',     descriptionEn: 'Early-stage concept project profile',   descriptionRu: 'Профиль проекта на ранней стадии' },
  { key: 'business_sale',  icon: '🏪', labelEn: 'List a business for sale',    labelRu: 'Выставить бизнес на продажу', descriptionEn: 'Operating business for sale',         descriptionRu: 'Действующий бизнес на продажу' },
  { key: 'other',          icon: '⚙️', labelEn: 'Other',                       labelRu: 'Другое',                    descriptionEn: 'Custom deal type',                      descriptionRu: 'Другой тип сделки' },
];

export interface DealCategoryGroup {
  key: string;
  labelEn: string;
  labelRu: string;
  options: { key: string; labelEn: string; labelRu: string }[];
}

export const DEAL_CATEGORIES: DealCategoryGroup[] = [
  {
    key: 'real_assets', labelEn: 'Real Assets', labelRu: 'Недвижимость и земля',
    options: [
      { key: 'residential_dev',  labelEn: 'Residential development', labelRu: 'Жилая застройка' },
      { key: 'commercial_dev',   labelEn: 'Commercial development',  labelRu: 'Коммерческая застройка' },
      { key: 'land_raw',         labelEn: 'Land (raw / entitled)',   labelRu: 'Земля (сырая / с разрешениями)' },
      { key: 'hotel_resort_dev', labelEn: 'Hotel / Resort (project)', labelRu: 'Отель / Резорт (проект)' },
      { key: 'villa_condo_offmarket', labelEn: 'Villa / Condo (off-market)', labelRu: 'Вилла / Кондо (off-market)' },
      { key: 'industrial',       labelEn: 'Industrial / Warehouse',  labelRu: 'Индустриальная / Склады' },
    ],
  },
  {
    key: 'hospitality', labelEn: 'Hospitality & Lifestyle', labelRu: 'Гостеприимство и образ жизни',
    options: [
      { key: 'hotel_resort_op',  labelEn: 'Hotel / Resort (operating)', labelRu: 'Отель / Резорт (действующий)' },
      { key: 'restaurant_fnb',   labelEn: 'Restaurant / F&B',        labelRu: 'Ресторан / F&B' },
      { key: 'beach_club',       labelEn: 'Beach Club / Entertainment', labelRu: 'Бич-клаб / Развлечения' },
      { key: 'spa_wellness',     labelEn: 'Spa / Wellness',          labelRu: 'Спа / Велнес' },
      { key: 'retail',           labelEn: 'Retail',                  labelRu: 'Розница' },
    ],
  },
  {
    key: 'business_equity', labelEn: 'Business & Equity', labelRu: 'Бизнес и доли',
    options: [
      { key: 'business_sale',    labelEn: 'Operating business sale', labelRu: 'Продажа действующего бизнеса' },
      { key: 'minority_stake',   labelEn: 'Business investment / minority stake', labelRu: 'Инвестиция / миноритарная доля' },
      { key: 'franchise',        labelEn: 'Franchise opportunity',   labelRu: 'Франшиза' },
      { key: 'mbo',              labelEn: 'Management buyout',       labelRu: 'Management buyout' },
      { key: 'import_export',    labelEn: 'Import / Export',         labelRu: 'Импорт / Экспорт' },
    ],
  },
  {
    key: 'ventures', labelEn: 'Ventures & Ideas', labelRu: 'Стартапы и идеи',
    options: [
      { key: 'startup_early',    labelEn: 'Early-stage startup',     labelRu: 'Стартап ранней стадии' },
      { key: 'tech_app',         labelEn: 'Tech / App',              labelRu: 'Tech / App' },
      { key: 'social_enterprise', labelEn: 'Social enterprise',      labelRu: 'Социальное предприятие' },
      { key: 'project_pitch',    labelEn: 'Project profile (pre-ideation)', labelRu: 'Профиль проекта (пре-идея)' },
    ],
  },
  {
    key: 'other', labelEn: 'Other', labelRu: 'Другое',
    options: [
      { key: 'fund_spv',         labelEn: 'Fund / SPV participation', labelRu: 'Фонд / SPV' },
      { key: 'debt_mezz',        labelEn: 'Debt / Mezzanine',        labelRu: 'Долг / Мезонин' },
      { key: 'custom',           labelEn: 'Custom / Other',          labelRu: 'Другое' },
    ],
  },
];

export const ALL_CATEGORY_OPTIONS = DEAL_CATEGORIES.flatMap((g) => g.options.map((o) => ({ ...o, group: g.key })));

export interface CapitalRangeOption {
  key: CapitalRangeKey;
  labelShort: string;
  labelEn: string;
  labelRu: string;
  midpointUsd: number;
}

export const CAPITAL_RANGES: CapitalRangeOption[] = [
  { key: 'sub_100k',  labelShort: '< $100K',     labelEn: 'Less than $100K',  labelRu: 'До $100K',   midpointUsd: 50_000 },
  { key: '100k_500k', labelShort: '$100K–$500K', labelEn: '$100K – $500K',    labelRu: '$100K–$500K', midpointUsd: 300_000 },
  { key: '500k_2m',   labelShort: '$500K–$2M',   labelEn: '$500K – $2M',      labelRu: '$500K–$2M',   midpointUsd: 1_250_000 },
  { key: '2m_10m',    labelShort: '$2M–$10M',    labelEn: '$2M – $10M',       labelRu: '$2M–$10M',    midpointUsd: 6_000_000 },
  { key: '10m_plus',  labelShort: '$10M+',       labelEn: '$10M+',            labelRu: '$10M+',       midpointUsd: 15_000_000 },
];

export const DEAL_STAGES: { key: DealStage; labelEn: string; labelRu: string }[] = [
  { key: 'idea',        labelEn: 'Idea',         labelRu: 'Идея' },
  { key: 'pre_revenue', labelEn: 'Pre-revenue',  labelRu: 'До выручки' },
  { key: 'operating',   labelEn: 'Operating',    labelRu: 'Действующий' },
  { key: 'profitable',  labelEn: 'Profitable',   labelRu: 'Прибыльный' },
  { key: 'exiting',     labelEn: 'Exiting',      labelRu: 'На выходе' },
];

export const DEAL_STRUCTURES: { key: string; labelEn: string; labelRu: string }[] = [
  { key: 'equity',        labelEn: 'Equity',         labelRu: 'Доля в капитале' },
  { key: 'debt',          labelEn: 'Debt',           labelRu: 'Долг' },
  { key: 'revenue_share', labelEn: 'Revenue share',  labelRu: 'Revenue share' },
  { key: 'jv',            labelEn: 'Joint Venture',  labelRu: 'СП (JV)' },
  { key: 'asset_sale',    labelEn: 'Asset sale',     labelRu: 'Продажа актива' },
  { key: 'open',          labelEn: 'Open / flexible', labelRu: 'Открыт / гибко' },
];

export const INVESTOR_TYPES: { key: InvestorType; labelEn: string; labelRu: string }[] = [
  { key: 'individual',    labelEn: 'Individual investor', labelRu: 'Частный инвестор' },
  { key: 'family_office', labelEn: 'Family office',       labelRu: 'Family office' },
  { key: 'fund',          labelEn: 'Fund',                labelRu: 'Фонд' },
  { key: 'corporate',     labelEn: 'Corporate',           labelRu: 'Корпорация' },
  { key: 'other',         labelEn: 'Other',               labelRu: 'Другое' },
];

export const PIPELINE_STAGES: { key: DealPipelineStatus; labelEn: string; labelRu: string; color: string }[] = [
  { key: 'submitted',         labelEn: 'Submitted',         labelRu: 'Подана',           color: 'bg-slate-500/15 text-slate-300' },
  { key: 'under_review',      labelEn: 'Under Review',      labelRu: 'На рассмотрении',  color: 'bg-primary/15 text-primary' },
  { key: 'anonymized',        labelEn: 'Anonymized',        labelRu: 'Анонимизирована',  color: 'bg-primary/15 text-primary' },
  { key: 'published',         labelEn: 'Published',         labelRu: 'Опубликована',     color: 'bg-success/15 text-success' },
  { key: 'interest_received', labelEn: 'Interest Received', labelRu: 'Есть интерес',     color: 'bg-accent/15 text-accent' },
  { key: 'matched',           labelEn: 'Matched',           labelRu: 'Сматчено',         color: 'bg-accent/15 text-accent' },
  { key: 'term_sheet',        labelEn: 'Term Sheet',        labelRu: 'Term Sheet',       color: 'bg-primary/15 text-primary' },
  { key: 'closed',            labelEn: 'Closed',            labelRu: 'Закрыта',          color: 'bg-success/20 text-success' },
  { key: 'dead',              labelEn: 'Dead',              labelRu: 'Отвалилась',       color: 'bg-red-500/15 text-red-400' },
];

export function getCategoryLabel(key: string, lang: 'en' | 'ru' = 'en'): string {
  const found = ALL_CATEGORY_OPTIONS.find((o) => o.key === key);
  if (!found) return key;
  return lang === 'ru' ? found.labelRu : found.labelEn;
}

export function getIntentLabel(key: DealIntent, lang: 'en' | 'ru' = 'en'): string {
  const found = DEAL_INTENTS.find((o) => o.key === key);
  if (!found) return key;
  return lang === 'ru' ? found.labelRu : found.labelEn;
}

export function getCapitalRangeLabel(key: CapitalRangeKey): string {
  return CAPITAL_RANGES.find((c) => c.key === key)?.labelShort ?? key;
}

/** Heuristic suggested probability based on deal completeness */
export function suggestProbability(deal: {
  description_private?: string | null;
  documents_urls?: unknown[] | null;
  expected_irr?: number | null;
  capital_range?: CapitalRangeKey;
  deal_stage?: DealStage | null;
}): number {
  let score = 25;
  if (deal.description_private && deal.description_private.length > 200) score += 15;
  if (deal.documents_urls && deal.documents_urls.length > 0) score += 20;
  if (deal.expected_irr) score += 10;
  if (deal.deal_stage === 'operating' || deal.deal_stage === 'profitable') score += 15;
  if (deal.capital_range === '500k_2m' || deal.capital_range === '2m_10m') score += 10;
  return Math.min(100, score);
}
