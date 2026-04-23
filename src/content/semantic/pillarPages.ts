/**
 * @module content/semantic/pillarPages
 * @description 10 pillar pages from §4.1 of the Semantic Core (Y1 priority).
 *
 * Each pillar is the canonical anchor for one search cluster from §6.
 * Length target: 2 500\u20134 000 words per pillar (content task, not code).
 *
 * In this codebase the URLs are reserved (sitemap-pillars.xml). Bodies will
 * be written under M9d (pillar content sprint). Until then, slug owners are
 * tracked here so that internal links can reference them safely.
 */

import type { BilingualString } from '@/lib/landings/types';

export interface PillarPage {
  /** Path relative to host root, no trailing slash, kebab-case english. */
  slug: string;
  /** Reference to the §6 cluster this pillar anchors. */
  cluster: string;
  /** H1 — the primary search query of the cluster, in client language. */
  h1: BilingualString;
  /** ≤60 chars per language. */
  metaTitle: BilingualString;
  /** ≤160 chars per language. */
  metaDescription: BilingualString;
  /** Status: `placeholder` while body is unwritten; `live` when content exists. */
  status: 'placeholder' | 'live';
}

export const PILLAR_PAGES: readonly PillarPage[] = [
  {
    slug: '/guides/buying-property-thailand',
    cluster: '6.1',
    h1: { ru: 'Покупка недвижимости в Таиланде иностранцем', en: 'Buying property in Thailand as a foreigner' },
    metaTitle: { ru: 'Покупка недвижимости в Таиланде иностранцем — myUNO', en: 'Buying property in Thailand as a foreigner — myUNO' },
    metaDescription: {
      ru: 'Покупка недвижимости в Таиланде иностранцем: freehold, leasehold, налоги, эскроу. Пошаговый гайд от myUNO.',
      en: 'Buying property in Thailand as a foreigner: freehold, leasehold, taxes, escrow. Step-by-step guide from myUNO.',
    },
    status: 'placeholder',
  },
  {
    slug: '/guides/foreign-ownership-thailand',
    cluster: '6.1',
    h1: { ru: 'Foreign ownership в Таиланде: freehold, leasehold, структуры', en: 'Foreign ownership in Thailand: freehold, leasehold, structures' },
    metaTitle: { ru: 'Foreign ownership Таиланд: freehold vs leasehold — myUNO', en: 'Foreign ownership Thailand: freehold vs leasehold — myUNO' },
    metaDescription: {
      ru: 'Структуры владения недвижимостью в Таиланде для иностранца: freehold, leasehold 30+30+30, тайская компания, BVI. Сравнение по налогам и наследованию.',
      en: 'Foreign ownership structures in Thailand: freehold, leasehold 30+30+30, Thai company, BVI. Compared on tax and inheritance.',
    },
    status: 'placeholder',
  },
  {
    slug: '/guides/visas-thailand',
    cluster: '6.3',
    h1: { ru: 'Визы Таиланда для долгого пребывания: DTV, LTR, Elite, Non-B', en: 'Thailand long-stay visas: DTV, LTR, Elite, Non-B' },
    metaTitle: { ru: 'Визы Таиланда: DTV, LTR, Elite, Non-B — myUNO', en: 'Thailand visas: DTV, LTR, Elite, Non-B — myUNO' },
    metaDescription: {
      ru: 'Визы Таиланда для долгого пребывания: DTV, LTR, Thailand Elite, Non-B. Стоимость, сроки, документы, продление. Гайд myUNO.',
      en: 'Thailand long-stay visas: DTV, LTR, Thailand Elite, Non-B. Cost, timing, documents, extension. myUNO guide.',
    },
    status: 'placeholder',
  },
  {
    slug: '/guides/taxes-thailand-foreigner',
    cluster: '6.4',
    h1: { ru: 'Налоги иностранца в Таиланде и ДТТ', en: 'Foreigner taxes in Thailand and double-tax treaties' },
    metaTitle: { ru: 'Налоги иностранца в Таиланде: ДТТ, аренда, резидентство — myUNO', en: 'Thailand foreigner taxes: DTT, rental, residency — myUNO' },
    metaDescription: {
      ru: 'Налоги иностранца в Таиланде: подоходный, аренда, ДТТ с РФ и ЕС, налоговое резидентство. Подача PND 90/91. Гайд myUNO.',
      en: 'Foreigner taxes in Thailand: income, rental, double-tax treaty with Russia and the EU, tax residency, PND 90/91 filing. myUNO guide.',
    },
    status: 'placeholder',
  },
  {
    slug: '/guides/property-management-phuket',
    cluster: '6.7',
    h1: { ru: 'Управление недвижимостью на Пхукете', en: 'Property management on Phuket' },
    metaTitle: { ru: 'Управление недвижимостью на Пхукете — myUNO PM', en: 'Property management on Phuket — myUNO PM' },
    metaDescription: {
      ru: 'Управление недвижимостью на Пхукете: STR, LTR, channel manager, отчётность. Прозрачные расходы, ежемесячный отчёт владельцу.',
      en: 'Property management on Phuket: STR, LTR, channel manager, reporting. Transparent costs, monthly owner statement.',
    },
    status: 'placeholder',
  },
  {
    slug: '/guides/off-plan-due-diligence',
    cluster: '6.2',
    h1: { ru: 'Due diligence off-plan проекта на Пхукете', en: 'Off-plan project due diligence on Phuket' },
    metaTitle: { ru: 'Due diligence off-plan Пхукет: ClearView — myUNO', en: 'Off-plan due diligence Phuket: ClearView — myUNO' },
    metaDescription: {
      ru: 'Проверка off-plan застройщика на Пхукете: 8 категорий ClearView, рейтинг AAA\u2013BB, отчёт за 5 рабочих дней.',
      en: 'Off-plan developer due diligence on Phuket: 8 ClearView categories, AAA\u2013BB rating, report in 5 working days.',
    },
    status: 'placeholder',
  },
  {
    slug: '/guides/tm30-thailand',
    cluster: '6.5',
    h1: { ru: 'TM30 в Таиланде: 24-hour reporting иностранца', en: 'TM30 in Thailand: 24-hour foreigner reporting' },
    metaTitle: { ru: 'TM30 Таиланд: подача, штрафы, онлайн — myUNO', en: 'TM30 Thailand: filing, fines, online — myUNO' },
    metaDescription: {
      ru: 'TM30-регистрация в Таиланде: что это, как подать онлайн, штрафы за просрочку. Автоматическая подача от myUNO.',
      en: 'TM30 registration in Thailand: what it is, how to file online, late-filing fines. Auto-filing from myUNO.',
    },
    status: 'placeholder',
  },
  {
    slug: '/guides/rental-phuket-str-ltr',
    cluster: '6.6',
    h1: { ru: 'Аренда на Пхукете: STR vs LTR', en: 'Renting on Phuket: STR vs LTR' },
    metaTitle: { ru: 'Аренда на Пхукете: long-term и short-term — myUNO', en: 'Renting on Phuket: long-term and short-term — myUNO' },
    metaDescription: {
      ru: 'Аренда жилья на Пхукете: long-term и short-term. Договор, депозит, escrow, районы. Без скрытых комиссий агента.',
      en: 'Renting on Phuket: long-term and short-term. Contract, deposit, escrow, areas. No hidden agent fees.',
    },
    status: 'placeholder',
  },
  {
    slug: '/guides/bank-account-thailand',
    cluster: '6.8',
    h1: { ru: 'Открытие банковского счёта в Таиланде иностранцу', en: 'Opening a Thai bank account as a foreigner' },
    metaTitle: { ru: 'Банковский счёт в Таиланде иностранцу — myUNO', en: 'Thai bank account for foreigners — myUNO' },
    metaDescription: {
      ru: 'Bangkok Bank, Kasikorn, SCB: документы, требования, сроки. Открытие счёта без work permit.',
      en: 'Bangkok Bank, Kasikorn, SCB: documents, requirements, timing. Account opening without a work permit.',
    },
    status: 'placeholder',
  },
  {
    slug: '/guides/areas/where-to-live-phuket',
    cluster: '6.11',
    h1: { ru: 'Где жить на Пхукете: гид по районам', en: 'Where to live on Phuket: area guide' },
    metaTitle: { ru: 'Где жить на Пхукете: районы — myUNO', en: 'Where to live on Phuket: areas — myUNO' },
    metaDescription: {
      ru: 'Гид по районам Пхукета: Bang Tao, Kamala, Surin, Laguna, Rawai, Cherngtalay. Цены, инфраструктура, под кого подходит.',
      en: 'Phuket area guide: Bang Tao, Kamala, Surin, Laguna, Rawai, Cherngtalay. Prices, infrastructure, who fits where.',
    },
    status: 'placeholder',
  },
] as const;
