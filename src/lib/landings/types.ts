/**
 * @module landings/types
 * @description M6 · Track B.1 — типы для конфигов persona/cluster лендингов.
 *
 * Источник правды:
 *  - `docs/canonical/01-segmentation-framework.md` §4 (25 персон P1..P25)
 *  - `docs/canonical/01-segmentation-framework.md` §5 (10 жизненных кластеров A..J)
 *  - `docs/canonical/03-tone-of-voice.md` §14 (чек-лист текста)
 *  - `docs/canonical/04-implementation-protocol.md` §M6 (требование к лендингам)
 *  - `docs/canonical/audits/M6-persona-landings.md` §3 · Трек B
 *
 * ВАЖНО — два понятия «cluster» в проекте:
 *  1. `ClusterId` (`src/types/canonical.ts`) — 6 surface-кластеров
 *     (arrive/live/manage/invest/legal/build) для UI-навигации и токенов цвета.
 *  2. `LandingClusterCode` (этот файл) — 10 **жизненных** кластеров A..J
 *     из §5 канона (Arrival, Extension, Settlement, Investment, Transaction,
 *     Operations, Compliance, Emergency, Lifestyle, Exit). Это то, что §M6
 *     требует под `/cluster/:cluster`.
 * Не смешивать. Маппинг A..J → arrive/live/... для токенов цвета — отдельная
 * задача шага B.6 (`<LandingSeoHead />` / theme).
 *
 * Все строки UI — bilingual `{ ru, en }`. Никаких fallback на render —
 * см. `docs/CONTENT_STYLE.md` §9.
 */

import type { PersonaCode } from '@/types/canonical';

/* ------------------------------------------------------------------ */
/*  Cluster codes — A..J (life-cycle clusters from §5 framework)      */
/* ------------------------------------------------------------------ */

/** 10 жизненных кластеров из §5 канона. Используется только для лендингов. */
export type LandingClusterCode =
  | 'A' // Arrival & Orientation
  | 'B' // Extension & Transition
  | 'C' // Settlement
  | 'D' // Investment Consideration
  | 'E' // Transaction
  | 'F' // Ownership & Operations
  | 'G' // Compliance & Legal
  | 'H' // Emergency
  | 'I' // Lifestyle
  | 'J'; // Exit & Re-entry

export const LANDING_CLUSTER_CODES: readonly LandingClusterCode[] = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
] as const;

export function isLandingClusterCode(value: string | null | undefined): value is LandingClusterCode {
  if (!value) return false;
  return (LANDING_CLUSTER_CODES as readonly string[]).includes(value);
}

/* ------------------------------------------------------------------ */
/*  Common building blocks                                            */
/* ------------------------------------------------------------------ */

/** Обязательная двуязычная строка. RU и EN не подменяются друг другом. */
export interface BilingualString {
  ru: string;
  en: string;
}

/** Статус публикации лендинга. `draft` → 404 на роуте (трек B.4/B.5). */
export type LandingStatus = 'live' | 'draft';

/**
 * Ссылка на услугу из канонического каталога §02. `slug` — стабильный
 * идентификатор услуги в `02-service-catalogue-v2.md` / DB. `intent` —
 * необязательный квалификатор (например, 'rent' vs 'sale').
 */
export interface LandingServiceRef {
  slug: string;
  /** Локализованное название карточки услуги. */
  label: BilingualString;
  /** Короткое описание (≤12 слов / ≤90 chars согласно CONTENT_STYLE §3). */
  oneLiner?: BilingualString;
  /** Прямая ссылка (внутренний маршрут платформы). */
  href: string;
}

/** Опциональный bundle — собранный пакет услуг с ценой. */
export interface LandingBundle {
  slug: string;
  title: BilingualString;
  /** Состав пакета — список slug'ов из `LandingServiceRef.slug`. */
  includes: string[];
  /** Сумма в THB. Не локализуем — `฿{amount}` рендерит компонент. */
  priceThb: number;
  /** Условия (длительность, ограничения). */
  terms?: BilingualString;
}

export interface LandingFaqEntry {
  q: BilingualString;
  a: BilingualString;
}

/**
 * Основной CTA. Tone-of-voice §14: глагол действия, без «узнать больше».
 * Если процесс платный — рекомендация §7 CONTENT_STYLE: показать сумму.
 */
export interface LandingCta {
  label: BilingualString;
  /** Куда ведёт (внутренний роут или абсолютный URL). */
  href: string;
  /** Опциональная подпись под CTA («Без обязательств», «12 мин ответ»). */
  subtitle?: BilingualString;
}

/** Open Graph / SEO мета. hreflang RU↔EN — обязательно для live лендингов. */
export interface LandingSeo {
  /** ≤60 символов EN, ≤60 RU. CONTENT_STYLE §3. */
  metaTitle: BilingualString;
  /** ≤160 символов. */
  metaDescription: BilingualString;
  /** Абсолютный URL OG-image (1200×630). */
  ogImage: string;
  /** Канонический URL без trailing slash. Используется hreflang. */
  canonicalPath: string;
  /** Ссылки на альтернативные языки. RU↔EN обязательно. */
  hreflangAlternates: { lang: 'ru' | 'en'; href: string }[];
}

/* ------------------------------------------------------------------ */
/*  Persona Landing                                                   */
/* ------------------------------------------------------------------ */

/**
 * Конфиг одного persona-лендинга `/for/:slug`.
 *
 * — `personaCode` (P1..P25) обязателен и должен совпадать с §4 канона.
 * — `slug` — kebab-case, человеко-читаемый (`tourists`, `hnw`, `pet-owners`).
 * — `pains` / `services` / `faq` могут быть пустыми только если `status='draft'`.
 * — `status='draft'` → роут `/for/:slug` отдаёт 404 (трек B.4).
 */
export interface PersonaLanding {
  /** Канонический код P1..P25. */
  personaCode: PersonaCode;
  /** URL slug. Должен быть уникален в рамках `personaLandings.ts`. */
  slug: string;
  /** Статус публикации. `draft` → 404. */
  status: LandingStatus;
  /** H1 страницы. Глагол / задача в первой позиции (CONTENT_STYLE §4). */
  h1: BilingualString;
  /** Подзаголовок hero (1 предложение, ≤25 слов RU). */
  subtitle: BilingualString;
  /** 3–5 проблем целевой персоны. Конкретно, без urgency. */
  pains: BilingualString[];
  /** Услуги, которые покрывают `pains`. Слаги соответствуют §02 каталога. */
  services: LandingServiceRef[];
  /** Опциональный пакет — выгода относительно поштучной покупки. */
  bundle?: LandingBundle;
  /** 4–8 вопросов. Tone §14: прямые ответы, без заискивания. */
  faq: LandingFaqEntry[];
  /** Основной CTA. */
  primaryCta: LandingCta;
  /** Опциональный второстепенный CTA. */
  secondaryCta?: LandingCta;
  /** SEO-блок. Обязателен для `live`, опционален для `draft`. */
  seo?: LandingSeo;
}

/* ------------------------------------------------------------------ */
/*  Cluster Landing                                                   */
/* ------------------------------------------------------------------ */

/**
 * Конфиг одного cluster-лендинга `/cluster/:slug`.
 *
 * — `clusterCode` (A..J) обязателен и должен совпадать с §5 канона.
 * — `slug` — kebab-case (`arrival`, `investment`, `operations`).
 * — `relatedPersonas` — список `PersonaCode`, для которых кластер актуален.
 *   Используется для cross-link «Лендинги по персонам ↗».
 */
export interface ClusterLanding {
  /** Канонический код A..J. */
  clusterCode: LandingClusterCode;
  /** URL slug. Должен быть уникален в рамках `clusterLandings.ts`. */
  slug: string;
  /** Статус публикации. `draft` → 404. */
  status: LandingStatus;
  /** H1 страницы. */
  h1: BilingualString;
  /** Подзаголовок hero. */
  subtitle: BilingualString;
  /**
   * Lifecycle-фразы из §5 («Регистрация прибытия» / «Контроль расходов» / …).
   * Каждая — task-first, без маркетинга.
   */
  jobs: BilingualString[];
  /** Услуги кластера из §02 каталога. */
  services: LandingServiceRef[];
  /** Опциональный пакет. */
  bundle?: LandingBundle;
  /** FAQ — преимущественно процедурные вопросы. */
  faq: LandingFaqEntry[];
  /** Основной CTA. */
  primaryCta: LandingCta;
  /** Опциональный secondary CTA. */
  secondaryCta?: LandingCta;
  /** Связанные персоны (для cross-link блока). */
  relatedPersonas: PersonaCode[];
  /** SEO-блок. Обязателен для `live`. */
  seo?: LandingSeo;
}

/* ------------------------------------------------------------------ */
/*  Type guards & helpers                                             */
/* ------------------------------------------------------------------ */

/**
 * `live` лендинг должен иметь непустые pains/services/faq + SEO.
 * Используется при загрузке конфига и в роуте B.4 для решения 200 vs 404.
 */
export function isLivePersonaLanding(landing: PersonaLanding): boolean {
  if (landing.status !== 'live') return false;
  if (!landing.seo) return false;
  if (landing.pains.length === 0) return false;
  if (landing.services.length === 0) return false;
  if (landing.faq.length === 0) return false;
  return true;
}

export function isLiveClusterLanding(landing: ClusterLanding): boolean {
  if (landing.status !== 'live') return false;
  if (!landing.seo) return false;
  if (landing.jobs.length === 0) return false;
  if (landing.services.length === 0) return false;
  if (landing.faq.length === 0) return false;
  return true;
}

/** Поиск лендинга по slug. Возвращает `undefined`, если slug не найден. */
export function findPersonaLandingBySlug(
  list: readonly PersonaLanding[],
  slug: string,
): PersonaLanding | undefined {
  return list.find((l) => l.slug === slug);
}

export function findClusterLandingBySlug(
  list: readonly ClusterLanding[],
  slug: string,
): ClusterLanding | undefined {
  return list.find((l) => l.slug === slug);
}
