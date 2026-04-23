/**
 * @module content/semantic/searchClusters
 * @description 12 search-query clusters from §6 of the Semantic Core.
 *
 * Used by:
 *  - SEO Lead (`/docs/seo/keyword-map.csv` is the long form; this is the canonical short form).
 *  - AI concierge routing (entity graph §7.3).
 *  - validate-semantic CI (cluster coverage check).
 */

import type { LifecycleSlug, SituationClusterSlug } from './taxonomy';

export type SearchClusterPriority = 'P0' | 'P1' | 'P2';

export interface SearchCluster {
  /** §6.x reference. */
  id: string;
  /** Human-readable name. */
  name: string;
  lifecycle: LifecycleSlug[] | 'all';
  cluster: SituationClusterSlug[];
  language: ('ru' | 'en')[];
  priority: SearchClusterPriority;
  /** Sample primary queries (5\u201310 representative phrases). */
  sampleQueriesRu: string[];
  sampleQueriesEn: string[];
  /** Canonical pages (pillar first, then cluster pages). */
  canonicalPages: string[];
}

export const SEARCH_CLUSTERS: readonly SearchCluster[] = [
  {
    id: '6.1',
    name: 'Покупка недвижимости в Таиланде',
    lifecycle: ['scout', 'snowbird', 'resident'],
    cluster: ['investing', 'buying'],
    language: ['ru', 'en'],
    priority: 'P0',
    sampleQueriesRu: ['купить квартиру в Таиланде', 'покупка квартиры на Пхукете', 'off-plan Таиланд', 'freehold Таиланд иностранец'],
    sampleQueriesEn: ['buy condo Phuket', 'foreign ownership Thailand', 'buying property in Thailand as foreigner', 'off-plan Phuket'],
    canonicalPages: ['/guides/buying-property-thailand', '/property', '/newbuilds', '/guides/foreign-ownership-thailand'],
  },
  {
    id: '6.2',
    name: 'Due diligence / проверка застройщика',
    lifecycle: ['scout', 'snowbird', 'resident'],
    cluster: ['investing'],
    language: ['ru', 'en'],
    priority: 'P0',
    sampleQueriesRu: ['проверка застройщика Таиланд', 'due diligence Пхукет', 'рейтинг застройщиков Пхукет', 'надёжный застройщик Пхукет'],
    sampleQueriesEn: ['Phuket developer rating', 'off-plan due diligence Thailand', 'how to vet a Phuket developer'],
    canonicalPages: ['/guides/off-plan-due-diligence', '/clearview'],
  },
  {
    id: '6.3',
    name: 'Визы Таиланда',
    lifecycle: ['scout', 'nomad', 'settler', 'snowbird'],
    cluster: ['stay-longer', 'compliance'],
    language: ['ru', 'en'],
    priority: 'P0',
    sampleQueriesRu: ['виза в Таиланд', 'DTV виза', 'LTR виза Таиланд', 'Thailand Elite visa стоимость'],
    sampleQueriesEn: ['Thailand DTV visa', 'LTR visa Thailand', 'digital nomad visa Thailand'],
    canonicalPages: ['/guides/visas-thailand', '/visa/quiz'],
  },
  {
    id: '6.4',
    name: 'Налоги иностранца в Таиланде',
    lifecycle: ['resident', 'absentee', 'nomad'],
    cluster: ['compliance'],
    language: ['ru', 'en'],
    priority: 'P1',
    sampleQueriesRu: ['налог на аренду Таиланд', 'ДТТ Россия Таиланд', 'PND 90 91', 'налоговый резидент Таиланда'],
    sampleQueriesEn: ['Thailand tax foreigner', 'rental income tax Thailand', 'tax residency Thailand'],
    canonicalPages: ['/guides/taxes-thailand-foreigner'],
  },
  {
    id: '6.5',
    name: 'TM30 и 90-day reporting',
    lifecycle: ['nomad', 'settler', 'resident'],
    cluster: ['compliance'],
    language: ['ru', 'en'],
    priority: 'P1',
    sampleQueriesRu: ['TM30 Таиланд', 'штраф TM30', '90 day reporting Таиланд'],
    sampleQueriesEn: ['TM30 Thailand', '90-day reporting Thailand', 'TM30 online'],
    canonicalPages: ['/guides/tm30-thailand'],
  },
  {
    id: '6.6',
    name: 'Аренда long-term Пхукет',
    lifecycle: ['nomad', 'settler', 'resident'],
    cluster: ['stay-longer', 'settle'],
    language: ['ru', 'en'],
    priority: 'P0',
    sampleQueriesRu: ['снять виллу Пхукет долгосрочно', 'аренда квартиры Пхукет на год', 'long term rental Phuket'],
    sampleQueriesEn: ['long term rental Phuket', 'monthly rental Phuket', 'apartment for rent Bang Tao'],
    canonicalPages: ['/guides/rental-phuket-str-ltr', '/property?intent=rent-long'],
  },
  {
    id: '6.7',
    name: 'Управление недвижимостью Пхукет',
    lifecycle: ['absentee', 'resident'],
    cluster: ['manage'],
    language: ['ru', 'en'],
    priority: 'P1',
    sampleQueriesRu: ['управляющая компания Пхукет', 'сдать квартиру Пхукет в управление', 'channel manager Airbnb Phuket'],
    sampleQueriesEn: ['property management Phuket', 'channel manager Phuket', 'rental management Phuket'],
    canonicalPages: ['/guides/property-management-phuket', '/owner'],
  },
  {
    id: '6.8',
    name: 'Открытие банковского счёта',
    lifecycle: ['settler', 'nomad'],
    cluster: ['settle', 'compliance'],
    language: ['ru', 'en'],
    priority: 'P1',
    sampleQueriesRu: ['открыть счёт в банке Таиланд иностранцу', 'Bangkok Bank foreign account'],
    sampleQueriesEn: ['Bangkok Bank foreign account', 'Kasikorn foreign account', 'Thai bank account for foreigner'],
    canonicalPages: ['/guides/bank-account-thailand'],
  },
  {
    id: '6.9',
    name: 'Обмен валют и переводы',
    lifecycle: ['tourist', 'nomad', 'resident'],
    cluster: ['arrival', 'compliance'],
    language: ['ru', 'en'],
    priority: 'P2',
    sampleQueriesRu: ['обмен валют Пхукет', 'где менять деньги Пхукет', 'USDT в THB'],
    sampleQueriesEn: ['Phuket exchange rate', 'best exchange rate Phuket', 'USDT to THB'],
    canonicalPages: ['/arrive/exchange-bot'],
  },
  {
    id: '6.10',
    name: 'Экстренное / SOS',
    lifecycle: 'all',
    cluster: ['emergency'],
    language: ['ru', 'en'],
    priority: 'P0',
    sampleQueriesRu: ['туристическая полиция Пхукет телефон', 'скорая Пхукет', 'потерял паспорт Таиланд'],
    sampleQueriesEn: ['emergency number Phuket', 'tourist police Phuket', 'lost passport Thailand'],
    canonicalPages: ['/sos'],
  },
  {
    id: '6.11',
    name: 'Районы Пхукета',
    lifecycle: ['scout', 'snowbird', 'settler'],
    cluster: ['arrival', 'investing', 'settle'],
    language: ['ru', 'en'],
    priority: 'P1',
    sampleQueriesRu: ['Bang Tao обзор', 'Rawai vs Kata', 'где лучше жить на Пхукете'],
    sampleQueriesEn: ['Bang Tao guide', 'Rawai vs Kata', 'best area to live Phuket'],
    canonicalPages: ['/guides/areas/where-to-live-phuket'],
  },
  {
    id: '6.12',
    name: 'myUNO как бренд',
    lifecycle: 'all',
    cluster: ['arrival', 'investing'],
    language: ['ru', 'en'],
    priority: 'P0',
    sampleQueriesRu: ['myUNO', 'myUNO Phuket', 'ClearView Ignatev', 'Ignatev Estate'],
    sampleQueriesEn: ['myUNO', 'myUNO Phuket', 'Ignatev ClearView', 'Phuket super-app'],
    canonicalPages: ['/', '/about', '/clearview'],
  },
] as const;
