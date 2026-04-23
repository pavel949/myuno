/**
 * @module content/semantic/canonicalNames
 * @description Canonical entity names from `docs/canonical/10-semantic-core.md` §5.
 *
 * Single source of truth for product / platform / real-estate lexicon.
 * Read by:
 *  - `forbiddenSynonyms.ts` (target side of every forbidden→canonical pair).
 *  - `eslint.config.js` (regex that blocks synonyms).
 *  - `scripts/validate-semantic.mjs` (page metadata audit).
 *  - AI prompts in `docs/prompts/*` (citation source).
 *
 * Rule: every public string in product UI / SEO / press must use these names.
 * Never localise product names (myUNO, ClearView, Chanote stay as-is in RU).
 */

// ────────────────────────────────────────────────────────────────────
// §5.1 · Platform layers
// ────────────────────────────────────────────────────────────────────

export const PLATFORM_NAMES = {
  platform: 'myUNO',
  realEstateCore: 'myUNO Invest',
  stay: 'myUNO Stay',
  personalAccount: 'myUNO App',
  ownerTools: 'myUNO Owner',
  pmTools: 'myUNO PM',
  hnwMandate: 'Ignatev Capital',
  ratingSystem: 'ClearView™',
  developerPortal: 'myUNO Developers',
} as const;

export type PlatformName = (typeof PLATFORM_NAMES)[keyof typeof PLATFORM_NAMES];

// ────────────────────────────────────────────────────────────────────
// §5.2 · AI products (internal brand → canonical user phrase)
// ────────────────────────────────────────────────────────────────────

export interface AiProductName {
  /** Internal brand (press / geek-facing). */
  brand: string;
  /** Canonical user-facing phrase. */
  canonical: { ru: string; en: string };
}

export const AI_PRODUCTS: readonly AiProductName[] = [
  { brand: 'ContractAI', canonical: { ru: 'анализ договора', en: 'contract review' } },
  { brand: 'DueDiligence AI', canonical: { ru: 'проверка проекта', en: 'project due diligence' } },
  { brand: 'FloodScore', canonical: { ru: 'оценка риска затопления', en: 'flood risk score' } },
  { brand: 'ChanoteCheck', canonical: { ru: 'проверка титула собственности', en: 'title deed check' } },
  { brand: 'VisaTrack', canonical: { ru: 'отслеживание визы', en: 'visa tracker' } },
  { brand: 'TM30 Auto', canonical: { ru: 'автоматическая TM30 регистрация', en: 'TM30 auto-filing' } },
  { brand: 'TaxNav', canonical: { ru: 'налоговый навигатор', en: 'tax navigator' } },
  { brand: 'BankPass', canonical: { ru: 'открытие банковского счёта', en: 'bank account opening' } },
  { brand: 'ExchangeBot', canonical: { ru: 'обмен валюты', en: 'currency exchange' } },
  { brand: 'RentMatch', canonical: { ru: 'подбор аренды', en: 'rental matching' } },
  { brand: 'DepositSafe', canonical: { ru: 'эскроу депозита', en: 'deposit escrow' } },
  { brand: 'StaySync', canonical: { ru: 'channel manager', en: 'channel manager' } },
  { brand: 'PropertySearch', canonical: { ru: 'поиск недвижимости', en: 'property search' } },
  { brand: 'MediFind', canonical: { ru: 'поиск клиники', en: 'clinic finder' } },
  { brand: 'SafeEats', canonical: { ru: 'верифицированные рестораны', en: 'verified restaurants' } },
  { brand: 'MotoGuard', canonical: { ru: 'защита при аренде мотобайка', en: 'motorbike protection' } },
  { brand: 'Phuket Price Index', canonical: { ru: 'Phuket Residential Price Index', en: 'Phuket Residential Price Index' } },
] as const;

// ────────────────────────────────────────────────────────────────────
// §5.3 · Real-estate lexicon (canonical → list of forbidden replacements)
// ────────────────────────────────────────────────────────────────────

export interface CanonicalLexEntry {
  canonical: string;
  /** Forbidden replacements; never appear in public RU text. */
  forbidden: string[];
  /** Optional context tag — `'commercial'` files require strict enforcement. */
  context: 'all' | 'ru' | 'en' | 'commercial';
}

export const RE_LEXICON: readonly CanonicalLexEntry[] = [
  { canonical: 'объект', forbidden: ['юнит', 'собственность'], context: 'ru' },
  { canonical: 'сделка', forbidden: ['приобретение', 'трансакция'], context: 'ru' },
  { canonical: 'покупатель', forbidden: ['инвестор-покупатель', 'клиент-покупатель'], context: 'ru' },
  { canonical: 'застройщик', forbidden: [], context: 'ru' /* «девелопер» допустимо параллельно */ },
  { canonical: 'Chanote', forbidden: ['чаноте'], context: 'ru' },
  { canonical: 'off-plan', forbidden: ['котлован'], context: 'all' },
  { canonical: 'Land Office', forbidden: ['Земельный департамент'], context: 'ru' },
  { canonical: 'TM30', forbidden: [], context: 'all' },
  { canonical: 'escrow', forbidden: ['гарантийный счёт'], context: 'ru' },
  { canonical: 'комиссия', forbidden: ['сбор'], context: 'commercial' },
] as const;

// ────────────────────────────────────────────────────────────────────
// §2.2 · Anchor words (5 primary + 6 secondary)
// ────────────────────────────────────────────────────────────────────

export const ANCHOR_WORDS_PRIMARY = [
  { ru: 'инфраструктура', en: 'infrastructure' },
  { ru: 'недвижимость', en: 'real estate' },
  { ru: 'сопровождение', en: 'navigation' },
  { ru: 'сделка', en: 'transaction' },
  { ru: 'соответствие', en: 'compliance' },
] as const;

export const ANCHOR_WORDS_SECONDARY = [
  { ru: 'доверие', en: 'trust' },
  { ru: 'иностранец', en: 'foreigner' },
  { ru: 'Пхукет', en: 'Phuket' },
  { ru: 'Таиланд', en: 'Thailand' },
  { ru: 'escrow', en: 'escrow' },
  { ru: 'AI-консьерж', en: 'AI-concierge' },
] as const;

// ────────────────────────────────────────────────────────────────────
// §2.1 · Positioning formula (single sentence)
// ────────────────────────────────────────────────────────────────────

export const POSITIONING_FORMULA = {
  ru: 'myUNO — цифровая инфраструктура для иностранцев в Юго-Восточной Азии, построенная вокруг операций с недвижимостью, по модели государственных услуг.',
  en: 'myUNO — digital infrastructure for foreigners in Southeast Asia, built around real-estate operations, in the manner of public services.',
} as const;

// ────────────────────────────────────────────────────────────────────
// §2.3 · Semantic defence (what myUNO is NOT — for about / press)
// ────────────────────────────────────────────────────────────────────

export const SEMANTIC_DEFENCE = {
  ru: [
    'Не риелторское агентство — myUNO сопровождает сделку, не продаёт листинги.',
    'Не маркетплейс услуг — это инфраструктура с курируемой партнёрской сетью.',
    'Не туристическое агентство.',
    'Не OTA-агрегатор краткосрочной аренды.',
    'Не инвестиционный фонд (Ignatev Capital — отдельный HNW-mandate).',
    'Не крипто-платформа.',
    'Не инфобизнес и не коучинговый проект.',
  ],
  en: [
    'Not a brokerage — myUNO accompanies the transaction, not the listing.',
    'Not a service marketplace — it is infrastructure with a curated partner network.',
    'Not a tourist agency.',
    'Not an OTA aggregator for short-term rentals.',
    'Not an investment fund (Ignatev Capital is a separate HNW mandate).',
    'Not a crypto platform.',
    'Not an info-product or coaching business.',
  ],
} as const;
