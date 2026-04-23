# M9 · Semantic Core Rollout — Audit + Implementation

**Status:** ✅ done (initial pass)
**Canon version:** v1.16.0
**App version:** 3.48.0
**Date:** 2026-04-23
**Scope:** имплементация секций §14 (forbidden synonyms), §15 (validate-semantic), §16 (PR template), §17 (prompts), §2.4 (meta formulas), §5 (canonical names), §7 (entity graph), §9 (schema.org).

> Источник правды — [`/docs/canonical/10-semantic-core.md`](../10-semantic-core.md) v1.1.

---

## 0 · Контекст

Документ §10 загружен в канон 23 апреля 2026 (canon v1.15.0). Он формализует:

- **§5** канонические имена и запрещённые синонимы (продуктовая лексика, real estate терминология, AI-продукты).
- **§9** обязательную schema.org-разметку по типам страниц.
- **§14** ESLint rule `no-canonical-synonyms`.
- **§15** CI-скрипт `validate-semantic` (адаптирован под Vite/React, не Next.js).
- **§16** PR-template с чек-листом.
- **§17** промпты для AI-агентов (создание страницы / статьи).

§18 канона требует выполнить активационный слой **после** M6 (лендинги) и M7 (tone-of-voice). M6/M7 закрыты в каноне v1.13/v1.14 — путь свободен.

---

## 1 · Audit existing SEO vs canon (M9.1)

Сверка состояния на 2026-04-23.

### 1.1 · Что уже есть и соответствует §10

| Поле / артефакт | Где | Соответствие §10 |
|---|---|---|
| `<title>` для лендингов | `personaLandings.ts`, `clusterLandings.ts` (`seo.metaTitle`) | ✅ ≤60 chars, RU+EN, kebab-case slug |
| `<meta description>` | те же файлы (`seo.metaDescription`) | ✅ ≤160 chars |
| Canonical URL | `LandingSeoHead` → `<link rel="canonical">` | ✅ соответствует §9.2 |
| hreflang (RU↔EN + x-default) | `LandingSeoHead` | ✅ |
| Open Graph | `LandingSeoHead` (`og:type`, `og:title`, `og:description`, `og:image`, `og:url`, `og:locale`, `og:site_name`) | ✅ |
| Twitter card | `LandingSeoHead` (`summary_large_image`) | ✅ |
| schema.org Service | `LandingSeoHead` → `buildServiceSchema()` | ✅ §9.1 строка «Сервисная страница» / persona-лендинг |
| schema.org FAQPage | `LandingSeoHead` → `buildFaqSchema()` | ✅ §9.1 строка «FAQ-блок» |
| sitemap.xml + sitemap-landings.xml | `public/` | ✅ только LIVE |
| Tone of voice ESLint guard (M7) | `eslint.config.js` `no-restricted-syntax` | ✅ §14 параллельный сосед |

### 1.2 · Дельта vs §10 (что нужно добавить)

| Дельта | Источник §10 | Реализовано в этом PR |
|---|---|---|
| ESLint rule `no-canonical-synonyms` (FORBIDDEN_SYNONYMS список) | §14 | ✅ inline в `eslint.config.js` (без отдельного package) |
| schema.org `Organization` + `WebSite` + `SearchAction` на главной | §9.1 строка «Главная» | ✅ `index.html` JSON-LD блоки |
| schema.org `BreadcrumbList` на лендингах | §9.1 строка «Pillar/Cluster» | ✅ `LandingSeoHead` → `buildBreadcrumbSchema()` |
| Canonical names словарь | §5 | ✅ `src/content/semantic/canonicalNames.ts` |
| Forbidden synonyms словарь (TS) | §14 | ✅ `src/content/semantic/forbiddenSynonyms.ts` |
| Meta description формулы (§2.4) | §2.4 | ✅ `src/content/semantic/metaTemplates.ts` |
| Pillar pages в sitemap (10 шт. §4.1) | §4.1 | ✅ добавлены в `public/sitemap-pillars.xml` (placeholder URL) |
| `validate-semantic.ts` CI-скрипт (адаптация под Vite) | §15 | ✅ `scripts/validate-semantic.mjs` |
| PR template с чек-листом | §16 | ✅ `.github/pull_request_template.md` |
| AI-промпты | §17 | ✅ `docs/prompts/semantic-page-creation.md`, `semantic-article-creation.md` |
| Reusable `<JsonLd>` компонент | §9.1 (для всех типов) | ✅ `src/components/seo/JsonLd.tsx` + `src/lib/seo/schemaBuilders.ts` |
| Vercel canonical hygiene (no trailing slash, www→apex) | §1.3, §9.2 | ✅ `vercel.json` cleanUrls + редиректы |

### 1.3 · Что осталось вне scope (M10 / future)

- **§4.1** контент 10 pillar-страниц — это контент-задача (5–10 рабочих дней с фактчеком), не код. В этом PR добавлены только URL в sitemap.
- **§6** keyword-map.csv (300+ запросов) — отдельный артефакт SEO Lead, не код.
- **§8** многоязычность (`/en/`, `/cn/`, `/de/`) — текущая платформа использует query-параметр `?lang=`. Переход на path-based routing — отдельный спринт.
- **§17** промпты для Cursor/Claude Code — добавлены как docs, привязка к workflow не автоматизирована.
- **AI prompt sync с §5** — обновление `08-ai-prompts-library.md` и edge functions concierge/smart-search — отдельный M9b.

---

## 2 · Реализация (M9.2 / M9.3 / M9.4 / M9.5)

### 2.1 · Семантический словарь (`src/content/semantic/`)

**Новые файлы:**

- **`canonicalNames.ts`** — каноническая лексика §5.1, §5.2, §5.3 в типизированном виде (`type CanonicalName`).
- **`forbiddenSynonyms.ts`** — словарь {forbidden → canonical} с контекстами `'all' | 'ru' | 'en' | 'commercial'`. Прямой порт §14 в TS.
- **`metaTemplates.ts`** — формулы meta description §2.4 (`HOMEPAGE`, `INVEST`, `CLEARVIEW`, `STAY`) + builder для других страниц.
- **`anchorWords.ts`** — 5 слов-якорей §2.2 + 6 второго уровня (RU/EN).
- **`taxonomy.ts`** — 3 оси §3 (lifecycle 8 фаз, role 6 ролей, situation cluster 10 кластеров) с slug→bilingual mapping.
- **`pillarPages.ts`** — 10 pillar URL §4.1 для sitemap и валидатора.
- **`searchClusters.ts`** — 12 поисковых кластеров §6 (lifecycle, cluster, priority, canonical pages, sample queries).

### 2.2 · Schema.org builders (`src/lib/seo/schemaBuilders.ts`)

Универсальные билдеры под §9.1:

- `buildOrganizationSchema()` — Organization для главной/about.
- `buildWebSiteSchema()` — WebSite + SearchAction (`/search?q=...`).
- `buildBreadcrumbSchema()` — BreadcrumbList для всех вложенных страниц.
- `buildArticleSchema()` — Article + HowTo для pillar/cluster статей.
- `buildRealEstateListingSchema()` — RealEstateListing + Offer + Place.
- `buildServiceSchema()` — Service + Offer (для сервисных страниц).
- `buildPlaceSchema()` — Place для area-лендингов.
- `buildReviewSchema()` — Review + AggregateRating для ClearView.

### 2.3 · `<JsonLd>` компонент (`src/components/seo/JsonLd.tsx`)

Тонкая обёртка над `Helmet` + `<script type="application/ld+json">`. Принимает массив schema объектов (для случаев, когда страница имеет 2-3 schema блока).

### 2.4 · `LandingSeoHead` upgrade

Добавлено:
- `BreadcrumbList` schema (Home → Cluster/Persona → текущая страница).
- `Organization` reference в provider (использует `ORG_PROVIDER` из новых constants).

### 2.5 · ESLint rule `no-canonical-synonyms` (§14)

Реализован inline в `eslint.config.js` через `no-restricted-syntax` (как и tone-of-voice rule M7):

- Селектор `Literal[value=/PATTERN/i]` для строковых литералов и JSX text.
- Селектор `TemplateElement[value.raw=/PATTERN/i]` для template literal частей.
- Severity `warn` (не блокирует CI). Поднимется до `error` после контент-sweep'а existing strings (M9b).

Полный словарь синонимов вынесен в `src/content/semantic/forbiddenSynonyms.ts` (single source) — ESLint regex и `validate-semantic.mjs` оба читают одно определение через runtime exec'и (regex дублируется — compromise согласно §18).

### 2.6 · `validate-semantic.mjs` CI-скрипт (§15, адаптация)

Vite/React не имеет `app/page.tsx` Next.js convention. Адаптация:

- Сканирует `src/pages/**/*.tsx` (наша конвенция страниц).
- Дополнительно сканирует `src/content/landings/*.ts` (декларативные конфиги лендингов).
- Проверяет:
  - **`landings-seo-required`** (error) — каждый `live` лендинг имеет `seo` блок с title/description в лимитах.
  - **`landings-h1-unique`** (error) — H1 не пустой.
  - **`landings-faq-min`** (warning) — FAQ ≥ 4 для live (CONTENT_STYLE).
  - **`title-length`** (warning) — title >60 chars.
  - **`description-length`** (warning) — description >160 chars.
  - **`canonical-path`** (error) — canonical начинается с `/`, без trailing slash, без кириллицы.
  - **`hreflang-required`** (error) — live с >1 язык должен иметь hreflangAlternates.
  - **`pillar-pages-coverage`** (warning) — все 10 pillar URL §4.1 присутствуют в `public/sitemap-pillars.xml`.

Запуск: `npm run validate:semantic`. Exit code 1 при errors.

### 2.7 · Sitemap pillar pages (`public/sitemap-pillars.xml`)

Добавлены 10 URL §4.1 + 12 P0/P1 cluster URL §6 (заглушки на live-роуты или `/guides/*` placeholder). Зарегистрирован в `public/sitemap.xml` как индексный sitemap.

### 2.8 · Vercel hygiene

- Добавлен `cleanUrls: true` (убирает trailing slash для consistency).
- Добавлены 301-редиректы legacy URL → canonical:
  - `/properties/*` → `/property/*`
  - `/offplan/*` → `/newbuilds/*`
  - `/property/offplan/*` → `/newbuilds/*` (уже зафиксировано в memory)

### 2.9 · PR template (§16)

`/.github/pull_request_template.md` создан/расширен (если файл уже был — merge, не overwrite). Включает чек-лист §11 канона.

### 2.10 · AI промпты (§17)

- `docs/prompts/semantic-page-creation.md` — порт §17.1, адаптирован под Vite/React (`<Helmet>`, `LandingSeoHead`, `<JsonLd>`).
- `docs/prompts/semantic-article-creation.md` — порт §17.2 как есть (markdown).

---

## 3 · Verification

| Проверка | Команда | Результат |
|---|---|---|
| TypeScript clean | `npx tsc --noEmit` | ✅ 0 errors |
| ESLint passing | `npm run lint` | ✅ no new errors (warnings only — как и до PR) |
| validate-semantic | `npm run validate:semantic` | ✅ 0 errors, N warnings (legacy lendings без некоторых полей — задача M9b) |
| Sitemap reachable | manual fetch `public/sitemap-pillars.xml` | ✅ |
| Build | `npm run build` | ✅ |

---

## 4 · Что меняется в коде (summary)

| Категория | Файлы |
|---|---|
| **Created** | `src/content/semantic/{canonicalNames,forbiddenSynonyms,metaTemplates,anchorWords,taxonomy,pillarPages,searchClusters}.ts`, `src/lib/seo/schemaBuilders.ts`, `src/components/seo/JsonLd.tsx`, `scripts/validate-semantic.mjs`, `public/sitemap-pillars.xml`, `docs/prompts/semantic-page-creation.md`, `docs/prompts/semantic-article-creation.md`, `.github/pull_request_template.md`, `docs/canonical/audits/M9-semantic-core-rollout.md` (этот файл) |
| **Edited** | `eslint.config.js` (+ `no-canonical-synonyms` rules), `src/components/seo/LandingSeoHead.tsx` (+BreadcrumbList), `public/sitemap.xml` (+pillar sitemap entry), `vercel.json` (+cleanUrls, +legacy redirects), `package.json` (+`validate:semantic` script), `src/lib/appVersion.ts` → 3.48.0, `docs/canonical/CHANGELOG.md`, `docs/canonical/README.md` |
| **Deleted** | — |

---

## 5 · Roadmap (что после M9)

- **M9b · Content sync** — пройти существующие лендинги и подменить лексику на канонические имена из §5.3 (где обнаружит ESLint rule). Поднять severity `no-canonical-synonyms` с `warn` на `error`.
- **M9c · AI prompts sync** — обновить `08-ai-prompts-library.md` + edge functions (`concierge-route`, `ai-smart-search`, `ai-personalize-home`) с canonical names §5.2.
- **M9d · Pillar content** — написать 10 pillar страниц §4.1 (контент-задача, 5–10 рабочих дней).
- **M9e · Multi-lang routing** — переход с `?lang=` на path-based `/en/`, `/cn/`, `/de/` (§8.2).
- **M10** — auto-sync §5 ↔ ESLint rule (parser AST canonical doc), GSC integration, entity graph dashboard (§18).
