# Changelog · Canonical Documents

Все значимые изменения канонического набора документируются здесь.
Формат: [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/), SemVer.

---

## [1.24.0] — 2026-05-15

### Changed (typography canon sync with Design Bible v2)

**05-visual-design-system.md → v1.1**
- Display / headings: `Unbounded` (RU) + `Noto Serif` (EN) → **`Source Serif 4`** (оба языка, primary).
- Body / UI: `Golos Text` (RU) + `Noto Sans` (EN) → **`Geist`** (оба языка, primary).
- Mono / numerics: `JetBrains Mono` → **`IBM Plex Mono`**.
- Luxury (`/newbuilds`): добавлен **`Cormorant Garamond`** italic.
- Старые имена сохранены как fallback в font-family stack и как `--font-heading-ru` / `--font-body-ru` / etc. для обратной совместимости.

**PROJECT.md**
- §«Визуальный язык» и §«Stack» приведены к канону Bible.

**DESIGN.md**
- §Typography полностью обновлена, type-scale расширен до Bible §05.2 (display-xl, mono-lg/md/sm и т.д.).
- Decision log: добавлена запись 2026-05-14 (Source Serif 4 / Geist / IBM Plex Mono) и 2026-05-15 (синхронизация DESIGN.md).

### Rationale
Источник истины — `src/styles/tokens.css` (runtime) и `docs/DESIGN_BIBLE.md` v2 §05.2. CLAUDE.md §6 уже фиксировал канон с предыдущей итерации и помечал старые шрифты как stale. Эта синхронизация устраняет расхождение.

### Files
- edited: `DESIGN.md`, `PROJECT.md`, `docs/canonical/05-visual-design-system.md`, `docs/canonical/CHANGELOG.md`
- previously committed (cherry-picked from `claude/design-system-docs-4m70i`): `docs/DESIGN_BIBLE.md`, `docs/design-bible.html`, `public/design-bible.html`, `scripts/validate-fonts.mjs` (font validator ignore)

---

## [1.23.0] — 2026-04-23

### Added (M13.A — Pro-shell + Reference-Screens polish from design package v5)

**M13.A.1 · `<SectionHead>` canonical component**
- Single source of truth for Home section microheadings (11px / uppercase / tracking 0.12em / muted-foreground/60 / semibold + optional right meta).
- Wired into `ActivityFeed`, `ConciergeCard`, `QuickActionsBlended`, `PrimaryActions` — replaces 4 previously-divergent inline header styles. Visual rhythm of `/` is now regular per design v5 `screen.jsx · SectionHead`.

**M13.A.2 · Role descriptions in Role Sheet**
- Added `descRu` / `descEn` to `ROLE_META` (sourced from design v5 `screens-core.jsx · S03_Roles`). Examples: tourist → «Прилёт, аренда, впечатления», owner → «Управление недвижимостью и доходом».
- "Add a role" section in `RoleSheet` switched from `grid-cols-2` to single column with sub-line description per row, matching S03 reference. Active-roles list now also shows the description instead of the long English label.

**M13.A.3 · PrimaryActions role tag dot**
- Each of the 3 "rule of three" cards now carries a 5px role-color dot in the top-right corner (per design v5 `S04_Home`). Dot color = primary persona accent, providing immediate visual proof of role-aware curation.
- Added `min-h-[44px]` for touch-target compliance.

**M13.A.4 · Pro-shell tabbar (feature-flagged)**
- New `GUEST_NAV_PRO_SHELL` (Home · Operate · Wallet · Me) per design v5 `TabBar variant="pro"`.
- `BottomBar` reads `feature_flag:pro_shell_tabbar_v1` and swaps the guest nav to Pro-shell when the user has at least one professional persona (owner / investor / developer / provider) active in the Role Sheet.
- Default OFF — migration `20260423130000_pro_shell_tabbar_flag.sql` seeds the flag in `system_settings`. Enable from Cloud UI without release.

### Notes
- Pure presentation + nav-config changes. No DB schema mutations beyond the new feature_flag row.
- Light-luxury palette and the 19 non-Home reference screens from the design package are intentionally out of scope — they are visual-design references, not canonical instructions to refactor existing pages. Token system stays single (dark default).

### Files
- created: `src/components/home/SectionHead.tsx`, `supabase/migrations/20260423130000_pro_shell_tabbar_flag.sql`
- edited: `src/lib/roleBlend.ts`, `src/components/home/{ActivityFeed,ConciergeCard,QuickActionsBlended,PrimaryActions,RoleSheet}.tsx`, `src/lib/navConfig.ts`, `src/components/nav/BottomBar.tsx`, `src/lib/appVersion.ts`, `public/version.json`

---

## [1.22.0] — 2026-04-23

### Added (M12 — Home polish wave from design package v5)

**M12.1 · NowInPhuket mounted on Home**
- The ambient 3-stat strip (weather · AQI · THB/USD) was orphaned in the codebase. Now placed right after the role-aware `PersonaAwareSections` block on `/`, matching the design v5 layout.
- Reinforces "Phuket pulse" — a daily reason to open the app even when no personalized signal is active.
- Live data via `usePhuketConditions` (Open-Meteo + Open Exchange Rates).

**M12.2 · HomeTopBar caption refined**
- Tagline is now visible on mobile (was `hidden sm:block`), rendered in the canonical uppercase tracked caption style (`tracking-[0.14em] text-[9px]`).
- Aligns with design v5 "structure over freedom" principle: the brand wordmark gets a quiet typographic anchor on every viewport.

**M12.3 · TrustFooter alignment polish**
- "03" mono numeral switched from `items-start` + `mt-0.5` to `items-center` for proper baseline alignment with the title block.
- Internal spacing tuned (`px-4 py-3.5`, gap `4`); micro-copy tightened.

### Notes
- Pure presentation changes — no DB / RLS / API touched.
- All four blocks already exist as canonical components; M12 is layout / typography polish per the design hand-off package "myUNO_design_5".

---

## [1.21.0] — 2026-04-23

### Added (M11.1 + M11.7 + M11.11 + M11.5 + M11.9 — auto-remediation of M10 critical findings)

**M11.1 · Canonical profile columns (closes SEG-1)**
- New enum `canonical_role` (tourist/resident/owner/investor/developer/vendor/staff/admin).
- `profiles.roles_stack jsonb DEFAULT '[]'` + `profiles.primary_role canonical_role`.
- GIN index on `roles_stack`, partial b-tree on `primary_role`.

**M11.7 · ClearView schema (closes CV-1)**
- 3 new tables: `clearview_categories` (8 seeded weighted criteria from canon 06 §3), `clearview_projects` (slug, grade AAA–BB, recommendation BUY/WATCH/AVOID, maturity_step 1–5), `clearview_scores` (0–10 per category).
- Enums: `clearview_grade`, `clearview_recommendation`.
- RLS: categories public, projects published-only for non-admin, scores follow project visibility, admin-only writes.
- Auto updated_at triggers on all 3 tables.

**M11.11 · system_settings RLS scope (security finding)**
- Removed anon SELECT (`USING:true`) — was exposing 46 operational params to unauthenticated visitors.
- New policy `system_settings_authenticated_read` restricts to `authenticated` role.

**Security · developers.stripe_connect_id**
- New `developers_public` view (SECURITY INVOKER) excludes `stripe_connect_id` and `registration_number`.
- Base `developers` table SELECT scoped to authenticated only.

**M11.5 · Cluster colour tokens**
- `ClusterHub.tsx` and `PrimaryActions.tsx` migrated from hex literals to `--cluster-{arrive,live,legal,invest,manage,build}` CSS-vars (already defined in `tokens.css` §7.4).
- New helper `clusterAccent(varName)` resolves to `hsl(var(--cluster-*))`.

**M11.9 · Shared AI system prompts**
- New `supabase/functions/_shared/systemPrompts.ts` mirrors `src/lib/ai/systemPrompts.ts` for Deno Edge Functions.
- Exports 7 canonical prompts (concierge, property, capital, support, clearviewDraft, taxAdvisor, chatModerator).
- Migration of 24 inline prompts → import to be done incrementally.

### Verification
- Migration: 5 schema changes applied successfully.
- Linter: 0 new warnings (pre-existing `extension_in_public` only, tracked under M11.10).
- `clearview_categories` row count: **8** (verified seed).
- TypeScript build errors fixed in `ClusterHub.tsx`.
- App: 3.52.0 → **3.53.0**.

### Backlog after this release (M11.x continued)
- M11.2 · 25 personas enum
- M11.3 · persona/cluster landings (10 + 25 files)
- M11.4 · `console.log` ban (275 hits)
- M11.5b · 6 более горячих файлов с hex (CatalogProjectCard, QuickActionsGrid, ActivityFeed)
- M11.6 · 44px touch-target Playwright test
- M11.8 · top-level routes growth log
- M11.9b · refactor 24 Edge Functions to import from `_shared/systemPrompts.ts`
- M11.10 · move `pg_trgm` extension out of `public`
- M11.12 · `bulk-import` → `has_role()` RPC (security warn)

---

## [1.20.0] — 2026-04-23

### Added (M10 · Full canonical conformance audit)
- **`docs/canonical/audits/M10-full-canon-conformance-2026-04-23.md`** — сводный аудит соответствия кодовой базы всем 10 канонам + ARCHITECTURE_V2 §13. Inventory-only (no fixes).
  - Результат: **7/11 green · 3/11 yellow · 1/11 red**.
  - **2 critical findings** блокируют закрытие финального gate M9:
    - **CV-1** — нет таблиц `clearview_*` в БД (06 §1–§8 нематериализован).
    - **SEG-1** — `profiles` без канонических колонок `roles_stack` / `primary_role` / `lifecycle_phase` (01 §12).
  - **17 warnings** → backlog **M11.1–M11.11** (приоритезирован).
  - Сильные стороны: validate-semantic 0/0, RLS 392/392 (100%), wallet zero-update RLS, 4-layer i18n guard, 1024 RLS политики, AuditMarker на всех money-screens (§13.6).
- **App bump:** 3.51.2 → **3.52.0**.

### Verification
- `node scripts/validate-semantic.mjs --strict` → 0/0.
- `supabase--linter` → 1 warn (extension in public).
- `security--get_scan_results` → 3 active warnings (system_settings anon read · developers stripe_connect_id exposed · bulk_import role check) — все занесены в M11.x.
- `supabase--read_query` → 392 public tables, 392 RLS-enabled, 1024 policies, 195 SECURITY DEFINER funcs, 10 knowledge_pillars, **0 clearview_*** tables.

---

## [1.19.2] — 2026-04-23

### Added (M9.7c · Fuzzy / near-match guard for uiStrings)
- **`src/test/semantic/uiStrings-fuzzy.test.ts`** — новый Vitest suite (30 тестов), ловит вариации forbidden-синонимов, которые не покрыл exact-match guard:
  - **Variant pass** — генерирует склонения русских корней (-а/-ы/-у/-ом/-е/-ов/-ам/-ами/-ах/-и) и вариации разделителей для многословных терминов (off-plan / off plan / offplan / Off Plan).
  - **Fuzzy pass** — Damerau-Levenshtein distance ≤ 1 на каждый токен ≥5 символов: ловит typos типа «MyUNNO», «приобритение», «чанотэ», «оффплан».
  - **Whitelist** — канонические термины из `forbiddenSynonyms.canonical` + высокотрафиковые легитимные слова, сидящие 1 edit от forbidden (например, «транзакция» против forbidden «трансакция», «myUNO» против forbidden «MyUNO»). Без whitelist guard ложно срабатывал бы на правильных употреблениях.
  - **Detector self-check** — 6 встроенных тестов: positive (declensions, separator variants, fuzzy typo) + negative (канонические `транзакция` / `off-plan` / `myUNO` НЕ должны флагаться).

### Defense-in-depth stack для UI-словарей (после M9.7c)
1. **ESLint** — статический guard на исходники (`src/i18n/**` = error).
2. **`validate-semantic.mjs --strict`** — regex-скан файлов словарей.
3. **uiStrings-canonical.test.ts** — runtime exact-match по словарю.
4. **uiStrings-fuzzy.test.ts** ← новое — runtime near-match (variants + Damerau-Levenshtein 1).

### Verification
- `npx vitest run src/test/semantic/` → **57 passed** (canonical 26 + fuzzy 30 + validate-semantic 1).
- `node scripts/validate-semantic.mjs --strict` → 0/0.
- `src/lib/appVersion.ts` → `3.51.2`, `public/version.json` → `3.51.2`.

---

## [1.19.1] — 2026-04-23

### Added (M9.7b · Runtime + CI guard for uiStrings canonical lexicon)
- **`src/test/semantic/uiStrings-canonical.test.ts`** — новый Vitest suite (24 параметризованных + 2 sanity = 26 тестов). Импортирует `uiStrings` напрямую и проходит каждый bilingual leaf (RU + EN), проверяя его против `FORBIDDEN_SYNONYMS` с тем же word-boundary regex, что использует `validate-semantic.mjs`. Покрывает то, что ESLint в принципе не видит: строки, собранные из шаблонов в рантайме, спреды из хелперов, динамические merge'ы. Также проверяет, что у каждой записи заполнены обе локали (RU + EN, non-empty).
- **`scripts/validate-semantic.mjs`** — расширен скан synonyms на `src/i18n/*.ts`. `COMMERCIAL_RE` дополнен `i18n` чтобы `commercial`-теги (собственность, котлован) применялись к UI-словарям как user-facing copy.

### Verification
- `npx vitest run src/test/semantic/` → **27 passed** (uiStrings 26 + validate-semantic 1).
- `node scripts/validate-semantic.mjs --strict` → 0/0 (включая i18n).
- `src/lib/appVersion.ts` → `3.51.1`, `public/version.json` → `3.51.1`.

### Defense-in-depth stack для UI-словарей (после M9.7b)
1. **ESLint** (`no-restricted-syntax`, severity=error на `src/i18n/**`) — статический guard на исходники.
2. **Validate-semantic** (`--strict` в CI) — regex-скан файлов словарей.
3. **Vitest runtime test** — импортирует и обходит реальное дерево объекта, ловит динамику.

---

## [1.19.0] — 2026-04-23

### Added (M9.7 · ESLint canonical synonyms guard — template literals + i18n)
- **`eslint.config.js`** — правило `no-restricted-syntax` для запрещённых синонимов §14 теперь **автогенерируется** из `src/content/semantic/forbiddenSynonyms.ts`. Раньше regex был захардкожен и быстро дрифтил с источником истины — теперь источник один, drift невозможен.
- **Template literal coverage** — каждый канонический синоним проверяется И на `Literal` нодах (`"юнит"`), И на `TemplateElement` (`` `Купить юнит` ``, `` `${x} MyUNO` ``). Раньше template-вариант покрывал только узкий список (юнит/чаноте/котлован/MyUNO), теперь покрывает все 14 терминов из словаря: `юнит`, `собственность`, `приобретение`, `трансакция`, `чаноте`, `котлован`, `Земельный департамент`, `гарантийный счёт`, `КонтрактAI`, `ДоговорAI`, `Клиарвью`, `КлирВью`, `MyUNO`, `My UNO`, `MYUNO`.
- **i18n strict scope** — для `src/i18n/**/*.{ts,tsx}` (`uiStrings.ts`, `ru.ts`, `en.ts`, `th.ts`) severity поднята до **`error`**. Любой forbidden-синоним в словарях UI ломает CI. Сейчас словари 100% canonical (verified) — это закрепляет состояние.
- **Wider codebase scope** — для остального `src/**` severity остаётся `warn` (как у tone-of-voice rule M7), полная зачистка трекается в M9b. Текущий бейзлайн: ~69 предупреждений в legacy-коде (newbuilds, owner, info pages).
- **Source-of-truth opt-out** — `src/content/semantic/**`, `scripts/validate-semantic.mjs`, `eslint.config.js` явно отключают правило, т.к. легитимно содержат forbidden-термины как данные/regex.

### Verification
- Sanity canary: `juni`-литерал в `src/i18n/_canary.ts` → 4 errors (правильно). Тот же файл в `src/_canary.ts` → 4 warnings (правильно).
- `npx eslint src/i18n/uiStrings.ts src/i18n/{ru,en,th}.ts` → clean.
- `npx eslint src/content/semantic/forbiddenSynonyms.ts` → clean (opt-out работает).
- `node scripts/validate-semantic.mjs --strict` → **0 errors / 0 warnings**.
- `src/lib/appVersion.ts` → `3.51.0`, `public/version.json` → `3.51.0`.

### Status
- **M9 · Semantic Core Rollout: 100% complete.** M9.1 (audit) + M9.2 (URL hygiene) + M9.3 (SEO refactor) + M9.4 (JSON-LD) + M9.5 (edge prompts) + M9.6 (Knowledge Hub seeding) + M9.7 (ESLint guard) — все закрыты.

---

## [1.18.0] — 2026-04-23

### Added (M9.6 · Knowledge Hub Seeding)
- **`knowledge_pillars` table** — bilingual (RU/EN) каноническая таблица для 10 опорных гайдов (`buying-property`, `visas`, `taxes`, `property-management`, `relocation`, `off-plan`, `escrow`, `chanote-due-diligence`, `land-office`, `clearview`). RLS: публичное чтение для статусов `live` / `placeholder`. GIN-индекс на `search_vector` для tsquery, `cluster` enum для группировки по §6 кластерам.
- **Seed контента** — все 10 pillars засеяны в production БД с H1, meta (≤60/160), body (~300–500 слов RU + EN), hreflang-парами, статусом `placeholder`/`live`. Источник: `pillarPages.ts` + `semantic-article-creation.md`.
- **`src/hooks/useKnowledgePillars.ts`** — React Query хуки: `usePillarsList()` (группировка по cluster), `usePillarSearch(q)` (ILIKE по 6 колонкам), `usePillarBySlug(slug)` (детальная карточка + related pillars в том же cluster).
- **`src/pages/knowledge/KnowledgePillarsIndex.tsx`** — индекс-страница со search bar, группировкой по semantic clusters, SEO-meta из §10.
- **`src/pages/knowledge/KnowledgePillarPage.tsx`** — детальная страница с lightweight Markdown renderer, breadcrumbs, JSON-LD `Article`, блоком «Related guides» (cross-linking внутри cluster).
- **Routes & navigation** — `KnowledgePillarsIndex` / `KnowledgePillarPage` зарегистрированы в `pageRegistry.ts`. `APP_ROUTES.KNOWLEDGE_PILLARS` (`/knowledge/pillars`) и `APP_ROUTES.KNOWLEDGE_PILLAR(slug)` добавлены в `routes.ts`. В `AnimatedRoutes.tsx` маршруты pillars поставлены **до** generic `/knowledge/:section`, чтобы перехватывать `/knowledge/pillars` раньше, чем его обработает `KnowledgeSectionPage`.
- **`KnowledgeHub.tsx`** — добавлена CTA-карточка «Канонические гайды / Pillar guides» между Quick Facts и Knowledge Sections для дискаверабилити.

### Verification
- `npx tsc --noEmit -p tsconfig.app.json` → clean.
- `node scripts/validate-semantic.mjs --strict` → **0 errors / 0 warnings**.
- Vitest `validate-semantic.test.ts` зелёный.
- `src/lib/appVersion.ts` → `3.50.0`, `public/version.json` → `3.50.0`.

### Backlog (M9 → 95% complete)
- M9.7 — расширить ESLint guard `no-canonical-synonyms` на template literals и `src/i18n/uiStrings.ts`.

---

## [1.17.0] — 2026-04-23

### Added (M9.5 · Semantic Core — Edge Function Prompts Sweep)
- **`scripts/validate-semantic.mjs`** — расширен скан запрещённых синонимов на `supabase/functions/*/index.ts`. Добавлен опт-аут маркер `@validate-semantic-allow-lexicon-list` для системных промптов, в которых легитимно перечисляется список «forbidden → canonical» (иначе бы сам промпт стал нарушением).
- Канонические подсказки лексики (§14) добавлены в системные промпты edge functions: `concierge-route`, `canonical-persona-detect`, `crm-ai-assistant`. LLM теперь явно проинструктирован писать «myUNO», «ClearView», «ContractAI», «объект», «сделка», «off-plan», «Chanote», «escrow», «Land Office».

### Changed (M9.5)
- **`supabase/functions/peylaa-nurture/index.ts`**, **`peylaa-lead-notify/index.ts`**, **`nb-lead-notify/index.ts`**, **`drive-import-folder/index.ts`** — заменены вхождения «юнит/юнита/юнитов» → «объект/объекта/объектов» в шаблонах WhatsApp/email и в системных промптах vision-извлечения.
- **`supabase/functions/crm-ai-assistant/index.ts`**, **`execute-booking-message-rules/index.ts`**, **`send-crm-email/index.ts`**, **`send-nurture-messages/index.ts`** — нормализован регистр бренда «MyUNO» → «myUNO» в `from`-полях Resend и системных промптах CRM-ассистента.

### Verification
- `node scripts/validate-semantic.mjs --strict` → **0 errors / 0 warnings** на расширенном объёме (landings + semantic + supabase/functions).
- Vitest `src/test/semantic/validate-semantic.test.ts` зелёный.
- `src/lib/appVersion.ts` → `3.49.0`, `public/version.json` → `3.49.0`.

---

## [1.16.1] — 2026-04-23

### Fixed (M9.4a · validate-semantic noise reduction)
- **`scripts/validate-semantic.mjs`** — два источника ложных срабатываний устранены:
  1. Сканер игнорировал регистр (`/i`), из-за чего канонический `myUNO` помечался как нарушение правила `MyUNO → myUNO`. Сделан case-sensitive — §14 явно требует точного регистра.
  2. Сканер обходил сам словарь (`src/content/semantic/**`), который по определению содержит каждое запрещённое слово как данные. Добавлено исключение `SEMANTIC_DICTIONARY_RE`.
- **`src/content/landings/personaLandings.ts`** — `P9_HNW.metaTitle` сокращён до 56/55 символов (было 67/66, превышало §10 лимит 60).
- **`src/content/landings/clusterLandings.ts`** — `D_INVESTMENT.metaTitle` (51/52) и `F_OPERATIONS.metaTitle.ru` (48) приведены к лимиту §10.

### Verification
- `npm run validate:semantic` → **0 errors / 0 warnings** (было 0/40).
- `src/lib/appVersion.ts` → `3.48.1`, `public/version.json` → `3.48.1`.

---

## [1.16.0] — 2026-04-23

### Added (M9 · Semantic Core Rollout — ~85%)
- **`src/content/semantic/`** — типизированный словарь Semantic Core v1.1: `canonicalNames.ts`, `forbiddenSynonyms.ts`, `metaTemplates.ts` (H1/title/description шаблоны по 10 кластерам × 25 персонам), `taxonomy.ts` (lifecycle × role × cluster), `pillarPages.ts` (10 pillar URL), `searchClusters.ts`, `anchorWords.ts`.
- **`src/lib/seo/schemaBuilders.ts`** — JSON-LD билдеры: `Organization`, `BreadcrumbList`, `Article`, `Service`, `FAQPage` согласно §10.
- **`src/components/seo/JsonLd.tsx`** — head-инжектор schema.org разметки.
- **`scripts/validate-semantic.mjs`** — CI-валидатор: проверка длин title/description, запрещённых синонимов, наличия H1.
- **`public/sitemap-pillars.xml`** — sitemap для 10 pillar URL (§4.1), зарегистрирован в основном `sitemap.xml`.
- **`docs/prompts/semantic-page-creation.md`**, **`docs/prompts/semantic-article-creation.md`** — system prompts для AI-генерации страниц/статей по канону §10.
- **`.github/pull_request_template.md`** — чеклист PR с обязательной сверкой по §10 (H1/meta/synonyms/schema).
- **`docs/canonical/audits/M9-semantic-core-rollout.md`** — аудит-матрица «страница → факт vs канон → дельта».

### Changed (M9)
- **`src/components/seo/LandingSeoHead.tsx`** — рефакторинг: подтягивает H1/title/description из `metaTemplates.ts`, добавляет `BreadcrumbList` JSON-LD.
- **`eslint.config.js`** — новое правило `no-canonical-synonyms`: блокирует литералы из `forbiddenSynonyms.ts` (например, «off plan» → «оф-план», «condotel» → «кондо-отель»).
- **`vercel.json`** — `cleanUrls: true` + 301-редиректы для legacy маршрутов (`/properties` → `/property`, и др. согласно §7).
- **`public/sitemap.xml`** — добавлен sitemap-pillars в индекс.
- **`package.json`** — npm script `validate:semantic`.
- `src/lib/appVersion.ts` → `3.48.0`, `public/version.json` → `3.48.0`.

### Notes — что осталось в M9 backlog
- **M9.5** — синхронизация AI-edge functions (`concierge-route`, `ai-smart-search`, `ai-personalize-home`) с canonicalNames §10.
- **M9.6** — Knowledge Hub seeding по приоритетным запросам (план статей).
- **M9.7** — расширение ESLint правила на template-literals и i18n-словари.
- **M7d/M7e** — DB content sweep и alt-text/A11y sweep (перенесены, не блокируют M9).

### Verification
- `npx tsc --noEmit` — clean.
- `npm run validate:semantic` — все pillar pages проходят (title ≤60, description ≤160, H1 уникален, synonyms 0).
- `public/sitemap-pillars.xml` — валидируется по XSD sitemap.org.

---

## [1.15.0] — 2026-04-23

### Added (Semantic Core v1.1)
- **`docs/canonical/10-semantic-core.md`** (1476 строк) — новый канонический документ. Контракт между смыслом и поиском: ключевые слова по 25 персонам × 10 кластерам, URL-slug правила, шаблоны H1/title/meta description, schema.org разметка, тон AI-ответов, FAQ-семантика для Knowledge Hub, anti-patterns. Двойная функция: (1) findability — индексация в Google/Yandex/Baidu/WeChat; (2) meaning — единый смысловой каркас, синхронизирующий лендинг ↔ статью ↔ AI-ответ ↔ schema.org ↔ URL.
- **`README.md`** — добавлена строка `10-semantic-core` в обе навигационные таблицы; обновлён заголовок «Канонические документы (01–10)»; в Quick-nav добавлена строка «Подобрать ключевые слова, URL-slug, H1, meta, schema.org».

### Changed
- `src/lib/appVersion.ts` → `3.47.0` (документация-only bump для трекинга в `version.json`).

### Notes — Что это меняет в коде (план M9 · Semantic Core Rollout)
Документ **не правит код напрямую** — он становится источником истины для серии последующих имплементационных вех. Предлагаемый порядок:

1. **M9.1 · Audit** — сверить существующие лендинги (M6, B-track), Knowledge Hub статьи, страницы ClearView, страницы кластеров (Arrive/Live/Manage/Invest/Legal/Build) с шаблонами H1/title/meta из §10. Создать `audits/M9-semantic-core-audit.md` с матрицей «страница → факт vs канон → дельта».
2. **M9.2 · URL hygiene** — пройтись по `src/lib/routes/APP_ROUTES`, `public/sitemap.xml`, `sitemap-landings.xml`. Поправить slug'и, добавить редиректы в `vercel.json` для исторических URL.
3. **M9.3 · LandingSeoHead refactor** — `src/components/seo/LandingSeoHead.tsx` начать брать H1/title/description из словаря, синхронизированного с §10 (новый `src/content/semantic/landingSeo.ts` или расширение `src/content/landings/*`).
4. **M9.4 · schema.org** — добавить JSON-LD (`Service`, `LocalBusiness`, `RealEstateListing`, `FAQPage`, `BreadcrumbList`) во все публичные страницы согласно §10 разделу schema. Создать `src/components/seo/JsonLd.tsx`.
5. **M9.5 · AI prompts sync** — обновить `08-ai-prompts-library.md` и edge functions (`concierge-route`, `ai-smart-search`, `ai-personalize-home`), чтобы terminology AI-ответов совпадала с §10 (одни и те же названия услуг/кластеров/ситуаций).
6. **M9.6 · Knowledge Hub seeding** — план статей по приоритетным запросам §10; ручное наполнение или AI-draft через новую edge function.
7. **M9.7 · ESLint terminology guard** — расширить `eslint.config.js` на запрещённые синонимы (например, если §10 фиксирует «оф-план» вместо «off plan» в RU UI, или «condotel» vs «кондо-отель»).

⚠️ M9 — **отдельный crawl** (после закрытия M7 backlog: M7d content-в-БД, M7e alt-text). Сейчас в код **ничего не вносим**, кроме регистрации документа.

### Verification
- `05-visual-design-system.md` — присутствует в `docs/canonical/` (1063 строки), уже зарегистрирован в README v1.0.
- `10-semantic-core.md` — загружен (1476 строк), доступен по ссылке в README.

---

## [1.14.1] — 2026-04-23

### Added (M7b · Edge Functions Tone Sweep)
- **`docs/canonical/audits/M7b-edge-functions-tone-sweep.md`** — расширение M7 на исходящие коммуникации (email/WhatsApp/Telegram). Методология разделения system-prompt'ов AI (не правим) vs user-facing шаблонов (правим) vs технических идиом (`Best regards`, `best-effort` — не правим).

### Changed (M7b)
- **`supabase/functions/ai-personalize-home/index.ts`** — 6 reason-строк (RU+EN) и 2 greeting-шаблона: `Best villas` → `Curated villas`, `Best schools` → `Verified schools`, `best offers` → `Curated for {persona}`.
- **`supabase/functions/vendor-outreach-agent/index.ts`** — полная переписка трёх sequence email-шаблонов: убраны overpromise (`high-net-worth clients`, `great traction`, `we only succeed when you do`, `Premium Clients`) и `Best regards/Best,` заменено на нейтральное `Kind regards,`. Subject 1: `Join myUNO — Connect with Premium Clients in Phuket` → `myUNO — partner invitation for service providers in Phuket`.
- **`supabase/functions/peylaa-lead-notify/index.ts`** — `эксклюзивный консультант PEYLAA` → `официальный партнёр PEYLAA` (снимает hype-оттенок, точнее юридически).

### Notes
- M7c (empty-states / `throw new Error` sweep) — ревизия проведена, бесспорных нарушений §14 не выявлено: формулировки `Не удалось …`, `Произошла ошибка`, `Пока пусто` соответствуют канону «factual, no blame, offer next step». Отдельный PR не требуется.
- AI system prompt'ы (`ai-owner-nurture`, `ai-smart-search`, `concierge-route`, `crm-ai-assistant`, `vendor-acquisition`) сознательно НЕ правились — изменение инструкций для LLM ломает intent extraction и output schema.
- `Best regards` оставлено только там, где это устоявшаяся email-сigning convention (none after sweep — везде заменили). `best-effort` (technical idiom) — оставлено как было.
- M7 backlog → закрыто частично (b). Остаются: M7d (content в БД), M7e (alt-text).
- `src/lib/appVersion.ts` → `3.46.1`.

---

## [1.14.0] — 2026-04-23

### Added (M7 · Tone of Voice — tracks A/B/C closed)
- **`docs/canonical/audits/M7-tone-of-voice.md`** — base-line аудит §14: 17 файлов с нарушениями, категоризация (❌/⚠️/✅), план зачистки.
- **`src/i18n/uiStrings.ts`** (Track B) — канонический типизированный словарь для CTA / empty / errors / success (RU + EN). Совместим с существующим `src/i18n/{ru,en,th}.ts` (additive). Все формулировки прошли §14.
- **ESLint rule `no-restricted-syntax`** в `eslint.config.js` (Track A) — блокирует литералы и template-элементы с forbidden tone words: `лучш(ий|ая|ие|ее)`, `уникальн(ый|ая|ое|ые)`, `революцион(ный|ная|ное|ные)`, `revolutionary`, `только сегодня`, `не упустите`, `hurry up`, `don't miss out`, `Упс`, `Oops`. Уровень `warn` (CI surface, не блокирует legacy сборки до завершения email/WhatsApp sweep).

### Changed (Track C — cleanup нарушений)
24 точечные правки текстов в 17 файлах (CTA / описания / FAQ / hero / SEO meta / toast):
- `src/components/home/LifecycleSmartTip.tsx` — 3 строки (gym, sunset, beauty).
- `src/components/leads/VerticalCTA.tsx` — empty-state CTA.
- `src/components/market/MarketComingSoonOverlay.tsx`, `src/components/reviews/PostOrderReviewPrompt.tsx`, `src/components/trip-planner/{TripPositioningHero,TripChecklist}.tsx`, `src/components/vertical/VerticalInsightPanel.tsx`, `src/components/experiences/PropertyTourPromo.tsx`, `src/components/pwa/AndroidInstallGuide.tsx`.
- `src/hooks/useConsultationRequests.ts` (toast), `src/hooks/useYachtExperiences.ts`.
- `src/lib/config/phuketAreas.ts` (Phuket Town description), `src/lib/nav/clusterCatalog.ts` (cluster I value).
- `src/pages/Support.tsx` (2×), `src/pages/arrive/ExchangeBotPage.tsx`, `src/pages/arrive/SIMStartPage.tsx` (SEO meta), `src/pages/guest/WelcomeFlow.tsx`, `src/pages/property/PropertyConsultation.tsx` (3×), `src/pages/babysitter/BabysitterDetail.tsx`, `src/pages/info/PartnersPage.tsx`, `src/pages/owner/ChannelManager.tsx`.

Канонические замены:
- `лучший / best` → `проверенный / verified`, `подходящий / suitable`, `оптимальный / optimal`, `выгодный / competitive`, `избранный / curated`.
- `Подберём лучшие варианты` → `Подберём подходящие варианты`.
- `Совсем скоро!` (urgency) → `Скоро откроем доступ`.

### Notes
- ⚠️ Edge-cases оставлены без правок: `medicalTaxonomy.ts:73` (системный tier `⭐⭐⭐` icon), `prioritizeHomeSections.ts:141` (комментарий разработчика, не UI), комментарии в `personaLandings.ts:6` / `realEstateEngine.ts` / `ContextualHeader.tsx` (упоминают forbidden слова в описании tone-of-voice — намеренно).
- ⚠️ `best-effort` (5 файлов) — устоявшаяся техническая идиома (best-effort delivery), не тональное нарушение. Регэксп ESLint пропускает (требует word-boundary `\bbest\b` без дефиса).
- `npx tsc --noEmit` — clean.
- M7 backlog (M7b/M7c): email-templates (`supabase/functions/notify-*`, `send-*`), WhatsApp/Telegram outreach (vendor-acquisition), empty-states sweep (компоненты `EmptyState`/`NoData`), error sweep (`throw new Error`), alt-text sweep — отдельные PR'ы.
- `src/lib/appVersion.ts` → `3.46.0`.

---

## [1.13.0] — 2026-04-23

### Added (M6 · трек C закрыт · шаги C.3, C.4, C.7)
- **pg_cron job** `canonical-lifecycle-recompute-daily` (C.4) — ежедневно в 03:00 ICT (20:00 UTC) `cron.schedule()` дёргает edge function `canonical-lifecycle-recompute` для 100 самых «протухших» профилей (`updated_at < now() - interval '7 days'`, `ORDER BY updated_at NULLS FIRST LIMIT 100`). Вызов через `net.http_post` с `Authorization: Bearer <anon_key>` (verify_jwt=false на функции, валидация source = `cron` внутри). Идемпотентный `cron.unschedule()` перед `schedule()`.
- **Edge Function развёрнута** (`supabase/functions/canonical-lifecycle-recompute`) — POST `{user_id, source}` отдаёт 200 на тестовый id.

### Changed
- `audits/M6-persona-landings.md` — Track C → ✅ closed. C.3 (intakes-триггер) помечен как **N/A** (таблицы `intakes` нет в схеме; будет добавлен при появлении таблицы отдельной миграцией). M6 в целом → ✅ closed (D + B + C).
- README статус канона → v1.13.0.
- `src/lib/appVersion.ts` → `3.45.0` (minor — закрытие M6).

### Notes
- Cron job сохранён через `supabase--insert` (не миграция), чтобы service-bearer не утекал в публичные миграции при ремиксах. Job id выдан Postgres'ом автоматически.
- Acceptance C: edge function 200 ✅ · booking trigger active ✅ · cron scheduled ✅ · history append ✅ · 11/11 unit-тестов матрицы зелёные ✅.

---

## [1.12.1] — 2026-04-23

### Added (M6 · трек C · шаги C.1, C.2, C.5)
- **`supabase/functions/canonical-lifecycle-recompute/`** (C.1) — Edge Function пересчёта `lifecycle_stage`:
  - `lifecycle-matrix.ts` — pure-функция `resolveLifecycleStage()` с детерминированной матрицей 8 фаз (scout/tourist/snowbird/nomad/settler/resident/absentee/returnee) по сигналам `totalDaysInThailand`, `visitsCount`, `visaType`, `visaExpiresAt`, `distinctSeasons`, `hasRecentReturnBooking`.
  - `index.ts` — POST `{user_id, source}`: читает profile + bookings (status='confirmed'), вызывает матрицу, сравнивает с текущей фазой, на изменении — пишет `lifecycle_stage` и appendит запись `{from, to, source, reason, at}` в `lifecycle_stage_history` (jsonb). Идемпотентна.
- **DB-триггер** `bookings_after_confirm_recompute` (C.2) — `AFTER INSERT OR UPDATE OF status ON bookings` для `status='confirmed'` вызывает helper `public.trigger_lifecycle_recompute(user_id, 'booking')` через `pg_net.http_post`. Errors swallowed, не блокирует транзакцию booking.
- **`lifecycle-matrix.test.ts`** (C.5) — **11/11 Deno тестов зелёные**: scout, tourist, snowbird, nomad (DTV<90), settler (180+, DTV+90), resident (730+, LTR), absentee (visa expired), returnee (after gap), idempotent.

### Changed
- `audits/M6-persona-landings.md` — Track C статус: C.1/C.2/C.5 ✅, C.3 (intakes-триггер — таблицы `intakes` нет, отложено), C.4 (pg_cron daily) — pending (требует service_role secret в http header), C.6 (observability) сделан внутри C.1 (`reason` поле в history).
- `src/lib/appVersion.ts` → `3.44.1` (patch — backend-only, без UI-изменений).

### Notes
- Линтер: предупреждение `extension_in_public` для `pg_net` — known false-positive (Supabase требует `pg_net` в public).
- Track C полностью закрывается отдельным шагом (C.3 ждёт появления `intakes` таблицы; C.4 cron — отдельным insert SQL с service-role bearer; C.7 — bump v1.13.0 после закрытия C.4).

---

## [1.12.0] — 2026-04-23

### Added (M6 · трек B · шаги B.6 → B.10 закрыты, B → ✅)
- **`src/components/seo/LandingSeoHead.tsx`** (B.6) — SEO-голова для persona/cluster лендингов через `react-helmet-async`:
  - `<title>`, `<meta name="description">`, canonical, hreflang RU↔EN + `x-default`.
  - Open Graph + Twitter Card с `og:image` 1200×630.
  - JSON-LD `Service` (provider = myUNO Organization, areaServed = Phuket, hasOfferCatalog из `services[]`, knowsAbout из `pains/jobs[]`) + `FAQPage` для FAQ-блока.
  - Безопасный `null` если `landing.seo` не задан (дополнительный страх. слой к `isLive*Landing()`).
- **Контент 3 live persona-лендингов (B.7)** в `src/content/landings/personaLandings.ts`:
  - **P1 `tourists`** — трансфер, eSIM, аренда, экскурсии, поддержка по-русски (5 pains, 5 services, 6 FAQ).
  - **P9 `hnw`** — ClearView™, шорт-лист, юр. структура, налоги, asset management (5/5/6).
  - **P13 `pet-owners`** — pet-friendly виллы, ввоз DLD/R7, аэропорт, ветеринар, груминг (5/5/6).
- **Контент 3 live cluster-лендингов (B.8)** в `src/content/landings/clusterLandings.ts`:
  - **A `arrival`** — 6 jobs / 6 services / 6 FAQ. Первые 72 часа.
  - **D `investment`** — сравнение районов, ClearView, off-plan, доходность, юр. структура, осмотр.
  - **F `operations`** — PMS, сдача, ТО, отчёт, налоги, страховка.
- **`public/sitemap-landings.xml`** (B.9) — 6 LIVE URL с `xhtml:link rel="alternate" hreflang="ru|en|x-default"`. Зарегистрирован в `public/sitemap.xml` через `<sitemap>` index. Draft-страницы намеренно отсутствуют — они отдают 404.

### Changed
- `src/pages/landings/PersonaLandingPage.tsx` + `ClusterLandingPage.tsx` — подключён `<LandingSeoHead />`, удалён временный `useEffect(document.title)` из B.4/B.5.
- `src/lib/appVersion.ts` → `3.44.0` (минорный bump, новые публичные SEO-страницы).
- `audits/M6-persona-landings.md` — статусы B.6–B.10 → ✅; трек B → ✅. B.11 закрыт этим CHANGELOG.

### Tone-of-voice (§14, B.10)
- Прогон 6 живых страниц (3 persona + 3 cluster): запретные слова устранены (исправлено «лучший курс» → «выгодный курс / competitive rates» в FAQ кластера A).
- Все CTA — глаголы действия («Заказать», «Запросить», «Подключить», «Подобрать»). Подзаголовки CTA — конкретные цифры/сроки в THB или USD, без urgency.
- Pains/jobs — task-first, обращение «вы», без «!», без «лучший / уникальный / революционный».

### Notes
- 50/50 ранее существовавших тестов остаются зелёными (новые e2e-тесты SEO-головы — отдельный шаг при подключении ssr-prerender).
- Трек C (Lifecycle automation, C.1–C.7) — следующая итерация: edge function `canonical-lifecycle-recompute`, DB-триггеры на `bookings`/`intakes`, pg_cron daily.

---

## [1.11.5] — 2026-04-23

### Added (M6 · трек B · шаг B.5)
- **`src/pages/landings/ClusterLandingPage.tsx`** — динамическая страница `/cluster/:cluster`, симметричная B.4:
  - `findClusterLandingBySlug(CLUSTER_LANDINGS, slug)` → `isLiveClusterLanding(landing)` → 200/404 на одном маршруте.
  - Layout-каркас: Hero + Jobs (lifecycle-фразы из §5 канона) + Services + FAQ + cross-link «По персонам» + повторный CTA. Bilingual через `useLanguage()`.
  - **Cross-link «По персонам ↗»** — фильтрует `relatedPersonas` через `isLivePersonaLanding`, чтобы не вести в 404 для draft-персон. На стадии B.5 (PERSONA_LANDINGS все draft) секция не рендерится — оживёт после B.7 без правки этой страницы.
- **`src/pages/landings/__tests__/ClusterLandingPage.test.tsx`** — **8 тестов зелёные** через MemoryRouter:
  - 404 для неизвестного slug.
  - 404 для draft-кластера.
  - Live: рендерится h1, jobs, services, primary CTA href.
  - Cross-link: секция скрыта, если все relatedPersonas — draft.
  - Cross-link: показывает только live-персоны из `relatedPersonas`.
  - Cross-link: НЕ включает live-персон, отсутствующих в `relatedPersonas`.

### Changed
- `src/components/layout/AnimatedRoutes.tsx` — добавлены 2 строки: lazy import + `<Route path="/cluster/:cluster" />` рядом с роутом B.4.
- `audits/M6-persona-landings.md` — статус B.5 → ✅ done. B.6 (`<LandingSeoHead />` для meta/OG/schema.org/hreflang) → 🔜 next.

### Notes
- На стадии B.5 **все 10 cluster-лендингов отдают 404** — это намеренно: CLUSTER_LANDINGS пока полностью draft (B.3). Шаг B.8 заполнит контент 3 live (A/D/F) и они оживут.
- 50/50 тестов зелёные (10 типов + 12 personaLandings + 15 clusterLandings + 5 PersonaLandingPage + 8 ClusterLandingPage). `npx tsc --noEmit` чистый.

---

## [1.11.4] — 2026-04-23

### Added (M6 · трек B · шаг B.4)
- **`src/pages/landings/PersonaLandingPage.tsx`** — динамическая страница `/for/:persona`:
  - Берёт `:persona` slug из URL → `findPersonaLandingBySlug(PERSONA_LANDINGS, slug)` → `isLivePersonaLanding(landing)`. Любой провал (неизвестный slug, draft, отсутствует SEO/контент) → ререндер `<NotFound />` без redirect (контракт B.4 — 200 vs 404 на одном маршруте).
  - Минимальный коммит-ready layout (Hero + Pains + Services + FAQ + CTA), bilingual через `useLanguage()`. SEO-голова (`<LandingSeoHead />`) появится в B.6 — пока используется `document.title` из `landing.h1` для корректной вкладки браузера.
  - Lazy-импорт в `AnimatedRoutes.tsx` через `React.lazy` — добавлен ровно 1 новый Route `/for/:persona`, ничего не удалено и не перенесено.
- **`src/pages/landings/__tests__/PersonaLandingPage.test.tsx`** — **5 тестов зелёные** через MemoryRouter:
  - 404 для неизвестного slug.
  - 404 для draft-лендинга (контракт «спрятан до B.7»).
  - Live-лендинг рендерит h1.
  - Live-лендинг рендерит services + pains.
  - Live primary CTA имеет правильный href.

### Changed
- `src/components/layout/AnimatedRoutes.tsx` — добавлены ровно 2 строки: lazy import + `<Route path="/for/:persona" />` перед catch-all.
- `audits/M6-persona-landings.md` — статус B.4 → ✅ done. B.5 (роут `/cluster/:cluster`) → 🔜 next.

### Notes
- На стадии B.4 **все 25 persona-лендингов отдают 404** — это намеренно: PERSONA_LANDINGS пока полностью draft (B.2). Шаг B.7 заполнит контент 3 live (P1/P9/P13) и они оживут без релиза, через простой commit в `personaLandings.ts`.
- 42/42 тестов зелёные (10 типов + 12 personaLandings + 15 clusterLandings + 5 routing). `npx tsc --noEmit` чистый.

---

## [1.11.3] — 2026-04-23

### Added (M6 · трек B · шаг B.3)
- **`src/content/landings/clusterLandings.ts`** — конфиг **10 cluster-лендингов** (A..J), полное покрытие §5 канона:
  - Все 10 кластеров в системе типов как `status: 'draft'` (включая будущие live: A arrival / D investment / F operations — контент придёт в шаге B.8).
  - Stable kebab-case slug'и: `arrival` (A), `extension` (B), `settlement` (C), `investment` (D), `transaction` (E), `operations` (F), `compliance` (G), `emergency` (H), `lifestyle` (I), `exit` (J).
  - Helper `draftCluster(code, slug, hint, relatedPersonas)` — минимально валидный плейсхолдер: непустые `h1` / `subtitle` / `primaryCta`, но **пустые** `jobs/services/faq` и **отсутствует** `seo` → не проходит `isLiveClusterLanding()`. На стадии B.3 `/cluster/:slug` отдаст 404 для всех 10.
  - **`relatedPersonas`** — заполнены сразу по матрице §6 (это структура, а не копирайт). Используется в cross-link блоке «Лендинги по персонам ↗» (компонент B.6). Пример: `arrival` → P1/P2/P3/P4/P5/P6/P7/P11/P14/P15/P16/P25 (туристы + первый сезон snowbird/nomad + settler + medical/wedding/athlete/student).
  - Экспорт `LIVE_CLUSTER_SLUGS = ['arrival','investment','operations']` — контракт ожиданий для шага B.8.
- **`src/content/landings/__tests__/clusterLandings.test.ts`** — **15 тестов зелёные:** ровно 10 объектов, покрытие всех `LandingClusterCode` без дубликатов, уникальные kebab-case slug'и, **все 10 в `draft`**, ни один не проходит `isLiveClusterLanding()`, валидные h1/subtitle/cta, валидация `relatedPersonas` (непусто, валидные `PersonaCode`, без дубликатов), контракт `LIVE_CLUSTER_SLUGS` (A/D/F).

### Changed
- `audits/M6-persona-landings.md` — статус B.3 → ✅ done. B.4 (динамический роут `/for/:persona`) → 🔜 next.

### Notes
- B.3 — **structure-only пасс**: 25 персон (B.2) + 10 кластеров (B.3) = вся таксономия лендингов в коде, но без контента и без роутов. Цель достигнута: следующий шаг B.4/B.5 может реализовать динамические роуты с уверенностью, что любая фабрикация slug'а валидируется через `findPersonaLandingBySlug` / `findClusterLandingBySlug` + `isLive*()`-guard.
- 37/37 тестов зелёные (10 типов B.1 + 12 personaLandings B.2 + 15 clusterLandings B.3). `npx tsc --noEmit` чистый.

---

## [1.11.2] — 2026-04-23

### Added (M6 · трек B · шаг B.2)
- **`src/content/landings/personaLandings.ts`** — конфиг **25 persona-лендингов** (P1..P25), полное покрытие §4 канона:
  - Все 25 персон в системе типов как `status: 'draft'` (включая будущие live: P1 tourists / P9 hnw / P13 pet-owners — контент придёт в шаге B.7).
  - Stable kebab-case slug'и: `tourists`, `cn-investors`, `eu-guests`, `digital-nomads`, `snowbirds`, `ru-expats`, `families`, `passive-investors`, `hnw`, `operators`, `mn-investors`, `bn-business`, `pet-owners`, `medical`, `weddings`, `athletes`, `halal`, `lgbtq`, `accessibility`, `retirees`, `providers`, `freelancers`, `smb`, `creatives`, `students`.
  - Helper `draftPersona(code, slug, hint)` — минимально валидный плейсхолдер: непустые `h1` / `subtitle` / `primaryCta` (страница не упадёт, если кто-то снимет 404), но **пустые** `pains/services/faq` и **отсутствует** `seo` → не проходит `isLivePersonaLanding()`. Это и обеспечивает 404 на `/for/:slug` для всех 25 на этапе B.2.
  - Экспорт `LIVE_PERSONA_SLUGS = ['tourists','hnw','pet-owners']` — контракт ожиданий для шага B.7.
- **`src/content/landings/__tests__/personaLandings.test.ts`** — **12 тестов зелёные:** ровно 25 объектов, покрытие всех `PersonaCode` без дубликатов, уникальные kebab-case slug'и, **все 25 в `draft`** на стадии B.2, ни один не проходит `isLivePersonaLanding()`, валидные h1/subtitle/cta для безопасного рендера, контракт `LIVE_PERSONA_SLUGS` (P1/P9/P13).

### Changed
- `audits/M6-persona-landings.md` — статус B.2 → ✅ done. B.3 (конфиг 10 clusterLandings) → 🔜 next.

### Notes
- B.2 — **structure-only пасс**: все 25 персон в системе, но контента нет. `/for/:slug` ещё не существует как роут (B.4), а если бы существовал — отдавал бы 404 для всех 25. Это намеренно: разделяем «структура» (B.2) и «копирайт» (B.7), чтобы tone-of-voice §14 пасс шёл сфокусированно по 3 live, а не размазывался.
- 22/22 теста зелёные (10 типов B.1 + 12 конфига B.2). `npx tsc --noEmit` чистый.

---

## [1.11.1] — 2026-04-23

### Added (M6 · трек B · шаг B.1)
- **`src/lib/landings/types.ts`** — типы для конфигов лендингов:
  - `LandingClusterCode = 'A'..'J'` + `LANDING_CLUSTER_CODES` + `isLandingClusterCode()`. Это **10 жизненных кластеров** из §5 канона (Arrival/Extension/Settlement/Investment/Transaction/Operations/Compliance/Emergency/Lifestyle/Exit) — отдельная ось от 6 surface-кластеров `ClusterId` в `src/types/canonical.ts` (arrive/live/manage/invest/legal/build). Не смешивать.
  - `BilingualString = { ru, en }` — обязательные RU+EN строки (никаких fallback на render, по `docs/CONTENT_STYLE.md` §9).
  - `PersonaLanding` — конфиг `/for/:slug`: `personaCode: P1..P25`, `slug`, `status: 'live'|'draft'`, `h1`, `subtitle`, `pains[]`, `services[]`, `bundle?`, `faq[]`, `primaryCta`, `secondaryCta?`, `seo?`.
  - `ClusterLanding` — конфиг `/cluster/:slug`: `clusterCode: A..J`, `slug`, `status`, `h1`, `subtitle`, `jobs[]` (lifecycle-фразы из §5), `services[]`, `bundle?`, `faq[]`, `primaryCta`, `relatedPersonas[]`, `seo?`.
  - Сопутствующие: `LandingServiceRef`, `LandingBundle`, `LandingFaqEntry`, `LandingCta`, `LandingSeo`.
  - Helpers: `isLivePersonaLanding()`, `isLiveClusterLanding()` — гарантируют, что `live` лендинг имеет непустые `pains/jobs`, `services`, `faq` и SEO-блок (используется в роутах B.4/B.5 для решения 200 vs 404). `findPersonaLandingBySlug()`, `findClusterLandingBySlug()`.
- **`src/lib/landings/__tests__/types.test.ts`** — **10 тестов зелёные:** проверка `LandingClusterCode` (ровно A..J), guard `isLandingClusterCode`, `isLivePersonaLanding` / `isLiveClusterLanding` (live + draft + missing seo + пустые массивы), find-helpers.

### Changed
- `audits/M6-persona-landings.md` — статус B.1 → ✅ done. B.2 (конфиг 25 personaLandings) → 🔜 next.

### Notes
- B.1 — pure types-pass: ничего не рендерится, ни одного нового роута. UI/контент появятся в B.2–B.4.
- Решение про разделение `LandingClusterCode` vs `ClusterId` зафиксировано в JSDoc файла, чтобы будущие правки не «слили» две оси.

---

## [1.11.0] — 2026-04-23

### Closed (M6 · трек D · шаги D.6 + D.7 — track D complete)
- **D.6 · Tone-of-voice pass §14** — priority-зона (`PersonaPromptBanner` + `ActiveSituation`) проверена по 8-пунктному чек-листу §14 канона. **0 нарушений.** Никаких urgency-слов, восклицаний, «лучший / уникальный», эмодзи в UI-тексте. CTA `Начать` / `Start` — глагол действия. Подробности — в `audits/M6-persona-landings.md` § «D.6 findings».
- **D.7 · Track D closed** — статус трека D в `audits/M6-persona-landings.md` → ✅ closed. Persona-aware Home готов end-to-end за флагом `feature_flag:home_persona_aware_v1` (default OFF), включается одной строкой в `system_settings` без релиза.

### Notes
- Трек D дал инфраструктуру: `prioritizeHomeSections()` + `<PersonaAwareSections />` + DB-флаг + 15 unit-тестов. Видимый эффект включится по решению Павла.
- Следующий рекомендованный трек — **B (Persona + Cluster Landings)**: типы → конфиги (25 + 10) → 2 динамических роута → `<LandingSeoHead />` → 3 live persona + 3 live cluster → sitemap → tone pass.

---

## [1.10.6] — 2026-04-23

### Added (M6 · трек D · шаг D.4)
- **`src/pages/Index.tsx`** — интеграция `<PersonaAwareSections />` в Home за флагом `feature_flag:home_persona_aware_v1` (default OFF). Priority-зона: `PersonaPromptBanner` + `ActiveSituation`. Hero, tasks-блок, RealEstateEntry/TrustAsAService, AllSectionsAccordion остаются на фиксированных позициях (вне priority-зоны).
- **DB seed** — `INSERT INTO system_settings (key='feature_flag:home_persona_aware_v1', value='false')` (idempotent через `ON CONFLICT DO NOTHING`).

### Changed
- `audits/M6-persona-landings.md` — статус D.4 → ✅ done. Трек D · шаг D.6 (tone-of-voice pass) → 🔜 next.

### Notes
- **Регрессия безопасна:** при флаге OFF, loading-состоянии профиля или anon-юзере `<PersonaAwareSections />` рендерит `defaultOrder` 1:1 — порядок блоков идентичен пред-D.4 поведению.
- **Включение после QA** — одна строка в `system_settings` (`UPDATE … SET value='true'`), без релиза.
- **Откат** — обратное `UPDATE … SET value='false'`. Никакого кода править не нужно.
- Track D вышел в продакшн-готовое состояние; видимый persona-aware эффект включится по решению Павла.

---

## [1.10.5] — 2026-04-23

### Added (M6 · трек D · шаг D.3)
- **`src/components/home/PersonaAwareSections.tsx`** — обёртка-перестановщик Home-секций. Принимает `defaultOrder: HomeSectionKey[]` + `sections: Partial<Record<HomeSectionKey, ReactNode>>` (готовые JSX-элементы со своими props) и рендерит их в приоритетном порядке через `prioritizeHomeSections()`. Loading и `disabled=true` → дефолтный порядок (regression-safe). Отсутствующие в `sections` ключи тихо пропускаются. Сам компонент не управляет flag'ом — это делает родитель в шаге D.4 (упрощает A/B и rollback).
- **`src/components/home/PersonaAwareSections.test.tsx`** — 5 render-тестов (`disabled` → default, loading → default, P9 поднимает FeaturedPropertiesCarousel, missing keys, anon → default). **Все 5 зелёные.**

### Changed
- `audits/M6-persona-landings.md` — статус D.3 → ✅ done. D.4 → 🔜 next.

### Notes
- Компонент намеренно не владеет JSX отдельных блоков — родитель передаёт готовые elements. Это сохраняет lazy-loading, текущие props и не требует синхронизации сигнатур всех Home-блоков.
- UI пока не виден: `<PersonaAwareSections />` создан, но в `Home.tsx` не интегрирован — это шаг D.4 за флагом `home_persona_aware_v1`.

---

## [1.10.4] — 2026-04-23

### Added (M6 · трек D · шаги D.1 + D.2 + D.5)
- **`src/lib/segmentation/prioritizeHomeSections.ts`** — чистая детерминированная функция `prioritizeHomeSections(profile, defaultOrder, options?)`. Boost-score по 3 каналам: `active_clusters` (×3), `lifecycle_stage` (×2), `detected_persona` (×2). Особый случай: `PersonaPromptBanner` пинится в топ для authed без persona. Permutation-invariant (никогда не добавляет/удаляет ключи). Опциональный `maxJump` ограничивает прыжок секции вверх для anti-layout-shift защиты.
- **D.2 · Маппинги в том же файле**:
  - `CLUSTER_TO_SECTIONS` — 6 канонических кластеров (`arrive | live | manage | invest | legal | build`) → home-секции.
  - `LIFECYCLE_TO_SECTIONS` — 8 lifecycle-фаз → home-секции.
  - `PERSONA_TO_SECTIONS` — точечные boost'ы для 10 ключевых персон (P1, P4, P5, P7, P8, P9, P10, P13, P14, P20).
- **`src/lib/segmentation/__tests__/prioritizeHomeSections.test.ts`** — 10 unit-тестов (anon → default, authed без сигналов → default, P1 tourist, P9 HNW, P10 operator, P13 pet-owner, PersonaPromptBanner-pin для authed без persona, permutation invariant, maxJump=1, стабильная сортировка). **Все 10 зелёные.**

### Changed
- `audits/M6-persona-landings.md` — статусы D.1 / D.2 / D.5 → ✅ done. D.3 → 🔜 next.

### Notes
- UI пока не затронут — это backend-логика. Видимый эффект появится на шаге D.3 (`<PersonaAwareSections />`) и D.4 (интеграция за флагом `home_persona_aware_v1`).
- Все остальные секции (Hero, HomeTopBar, Footer) фиксированы вне priority-зоны и не участвуют в перестановке.

---

## [1.10.3] — 2026-04-23

### Added (M6 audit — старт следующей вехи)
- **`audits/M6-persona-landings.md`** — draft v0.1 (awaiting approval). AUDIT текущего Home (нет persona-aware перестановки) + лендингов (0 из 25 канонических persona-маршрутов, 0 из 10 cluster-маршрутов; существующие `/relocate`, `/wedding`, `/kids`, `/nomad-guide`, `/pets` — ситуационные, не привязаны к канону §4); GAP против §M6; PLAN на 3 трека (D · Persona-aware Home → B · Landings → C · Lifecycle automation) с атомарными шагами, acceptance, rollback, anti-scope; обоснование порядка треков.

### Changed
- `README.md` — статус M6 → 📋 audit (draft v0.1).

### Notes
- Рекомендуемый порядок треков: D (Home) → B (Landings) → C (Cron lifecycle). Обоснование в §3 audit-документа: M5 даёт данные, D первым материализует ценность, B без D угадывает приоритет, C — producer для consumer'а из D.
- M6 формально не блокирован M5 prod-прогоном (`M5-e2e-qa-checklist.md` опционален), но рекомендуется до старта трека C.

---

## [1.10.2] — 2026-04-23

### Added (M5 H.7 — Playwright-автоматизация e2e чек-листа)
- **Playwright specs** под `e2e/tests/onboarding/`:
  - `account-persona-preview.spec.ts` — Сценарии C+D из `M5-e2e-qa-checklist.md` (empty state с CTA `/start/v2?return=/account`, refine loop с авто-возвратом).
  - `persona-prompt-banner.spec.ts` — Сценарий B (баннер появляется для authed без персоны, dismiss держится в session).
  - `anon-to-user-backfill.spec.ts` — Сценарий A (smoke). Авто-skip, если окружение требует email-подтверждение (signup без активной сессии).
- **Test utilities** `e2e/utils/personaTestHelpers.ts` — `resetSeedAdminPersona()` (PATCH через REST под seed-токеном), `loginAsSeedAdmin`, `signupFreshUser`, `completeCanonicalOnboarding` (детерминированный прогон Q1→Q3).
- **Stable selectors** — `data-testid` на `PersonaDetectionPreview`, `PersonaPromptBanner`, `LifecycleStep`, `RoleStep`, `ResultStep`. UI без визуальных изменений.

### Notes
- Автоматизация покрывает 3 из 4 ручных сценариев M5 без service-role ключа. Backfill-spec (A) скипается под политикой email-confirmation — flip auto-confirm в Lovable Cloud разблокирует его.
- Ручной прогон чек-листа `M5-e2e-qa-checklist.md` всё ещё рекомендован перед v1.11 (M6) для финальной верификации в проде.

---

## [1.10.1] — 2026-04-23

### Added (M5 hardening — закрытие остатков перед M6)
- **H.1 · Backfill trigger anon→user.** Миграция расширила `handle_new_user()`: при наличии `raw_user_meta_data ->> 'anon_session_id'` триггер переносит `concierge_sessions` и `persona_detection_log` на нового `user_id`, бэкофилит канонические колонки `profiles` (lifecycle_stage / detected_persona / active_clusters / special_status) из последнего `proposal`. Все шаги обёрнуты в `EXCEPTION WHEN OTHERS THEN NULL` — signup не падает.
- **H.2 · Frontend pass-through anon_session_id.** `src/lib/segmentation/anonSession.ts` — единая утилита для `myuno-anon-session-id`. `AuthContext.signUp` передаёт его в `options.data` для всех точек входа (email, Google, phone). Рефакторинг `useCanonicalOnboarding`, `useStartOnboarding`, `MyJourneyRecommendations` на новую утилиту.
- **H.3 · `<PersonaDetectionPreview />`** в `src/components/account/`. Три состояния (loading / empty / filled) на канонической read-модели `useCanonicalProfile`. CTA → `/start/v2?return=/account`. Скрывается при `feature_flag:concierge_routing_v2_canonical = false`.
- **H.4 · Интеграция в `/account`.** Карточка `<PersonaDetectionPreview />` встроена в `UserAccountDashboard.tsx` под `AccountActiveStay`.
- **H.5 · `?return=` redirect в `StartOnboardingV2`.** Добавлена `sanitizeReturnPath()` (защита от open-redirect: только internal `/`-paths). После Result-шага через 1.8s — `navigate(returnTo)`. Skip / Go Home кнопки тоже уважают `returnTo`.
- **H.6 · Tone-of-voice pass.** Прогон `ResultStep`, `PersonaPromptBanner`, `PersonaDetectionPreview` через §14: 0 совпадений «лучший / уникальный / революционный», 0 «!» в инфо-копиях. Смягчён primary CTA (`Open the first one` → `Open · {service title}`) — конкретика вместо обещания.
- **H.7 · `audits/M5-e2e-qa-checklist.md`** — 4 сценария (anon→user backfill, authed-only, /account refine loop, empty state) + готовые SQL-запросы для верификации в проде.
- **Тест.** `src/components/account/PersonaDetectionPreview.test.tsx` — 3 unit-теста (loading skeleton, empty state CTA, filled state с refine CTA). Все проходят.

### Changed
- `audits/M5-ux-persona-detection.md` — статус acceptance bullets 5.7 (PersonaDetectionPreview) и 5.9 (backfill trigger) переведены из ❌ в ✅.
- `audits/M5-hardening.md` — статус → ✅ done (H.1–H.6, H.8 готовы; H.7 ждёт ручного прогона в проде).

### Notes
- M5 формально готов к закрытию после прогона `M5-e2e-qa-checklist.md` в проде. После этого README статус M5 → ✅ done и разблокируется M6 (persona-aware Home, авто-перерасчёт lifecycle).
- Anon-to-user backfill идемпотентен: повторный signup с тем же `anon_session_id` (теоретически невозможно, но defensive) не задублирует данные — все UPDATE имеют `WHERE user_id IS NULL`.

---

## [1.10.0] — 2026-04-23

### Added
- **M5 · UX Persona Detection — реализация.**
  - Миграция: таблица `persona_detection_log` (RLS: owner read/insert, anon insert, admin read-all) + регистрация `feature_flag:concierge_routing_v2_canonical` (default OFF).
  - `src/lib/segmentation/detectPersona.ts` — детерминированный fallback `rules_v1` (8 lifecycle × 6 role × 10 modifiers → P1..P25, clusters, triggers, confidence). 11 unit-тестов проходят.
  - `src/lib/segmentation/recommendServices.ts` — 5–7 сервисов из каталога v2 по `active_clusters` + modifiers.
  - `src/hooks/useCanonicalOnboarding.ts` — оркестрация: local rules_v1 → AI `useDetectPersona({apply:true})` (если authed и confidence ≥ 0.75 — побеждает AI) → запись в `concierge_sessions` + `persona_detection_log`.
  - `src/pages/StartOnboardingV2.tsx` + `src/components/onboarding/v2/{LifecycleStep,RoleStep,ModifiersStep,ResultStep}.tsx` — 3-вопросный канонический онбординг, mobile-first.
  - `src/components/home/PersonaPromptBanner.tsx` — нудж на Home для authed без `detected_persona` → `/start/v2` (или fallback `/start` если v2-флаг OFF).
  - Роут `/start/v2` зарегистрирован в `AnimatedRoutes.tsx` за флагом `concierge_routing_v2_canonical`.

### Out of scope (отложено в M6/M7)
- Backfill trigger anon→user (5.9) — требует отдельной миграции с привязкой к `auth.users` insert; перенесено в M6.
- Авто-перерасчёт lifecycle на cron / `booking.confirmed` — M6.
- Удаление v1 `/start` — через 14 дней после prod-включения v2.

### Notes
- v1 `/start` не тронут — работает за старым флагом `concierge_routing_v1`.
- AI-детекция остаётся advisory: при confidence < 0.75 показываем rules_v1 результат.

---

## [1.9.2] — 2026-04-22

### Added
- **`audits/M5-ux-persona-detection.md`** — M5 audit & sprint plan (draft v0.1, awaiting approval). AUDIT текущего `/start` онбординга, GAP против §M5 (таксономия Q1–Q3 не каноническая, M4-детекция не подключена, канонические колонки `profiles` не заполняются), 12-шаговый PLAN на аддитивный `/start/v2` за новым флагом `concierge_routing_v2_canonical`, 11 критериев приёмки, rollback ≤30 мин.

### Notes
- M5 не блокирует M8 (ClearView, parallel track) и не блокируется им.

---

## [1.9.1] — 2026-04-22

### Changed
- **`README.md`** — переписан как «один экран»: сверху таблица быстрой навигации (12 типовых задач → точный документ), затем компактные блоки 01–09, architecture, research, audits с версиями и статусом вех. Цель: всё находится с первого экрана, без скролла.

---

## [1.9.0] — 2026-04-22

### Added
- **`architecture/OVERVIEW.md`** — единый обзор архитектуры. Навигатор по канону, схема зависимостей (Mermaid), decision tree «куда положить новый код», слои L0–L6, hard rules, статус вех M1–M8, поиск нужного документа за 1–2 клика.

### Changed
- `architecture/README.md` переписан как точка входа в подпапку; OVERVIEW.md помечен как ⭐ entry point.
- `docs/canonical/README.md` — раздел «Архитектура» обновлён, OVERVIEW.md выведен на верх списка.

### Notes
- Принцип OVERVIEW.md: навигатор, не источник истины. Контент живёт в первоисточниках; карта обновляется при добавлении канон-документа, завершении вехи или изменении hard rules.

---

## [1.8.0] — 2026-04-22

### Added
- **`docs/canonical/architecture/`** — новая подпапка канона. Содержит `ARCHITECTURE_V2.md`, `FEASIBILITY.md`, `CLAUDE_PATCH.md`, `README.md`. Перенесено из устаревшей корневой `/handoff` для централизации источника истины.

### Changed
- `CLAUDE.md` § 1.5 — пути обновлены на `docs/canonical/architecture/*`.
- `README.md` — карта документации обновлена.
- `docs/canonical/README.md` — добавлен раздел «Архитектура (architecture/)».

### Removed (moved to `archive/2026-04-cleanup/`)
- **`/handoff`** (папка целиком, 4 файла) → перенесена в `docs/canonical/architecture/`.
- **`/myuno-design`** (HTML/JSX дизайн-сnapshot) → `archive/2026-04-cleanup/myuno-design-snapshot/`. Заменён `05-visual-design-system.md` + `DESIGN.md`.
- **`/archive/{docs,lovable,myuno-design}`** (старый архив) → `archive/2026-04-cleanup/old-archive/`.
- **12 устаревших audit/report MD из `/docs`** (ADMIN_PANEL_DEEP_AUDIT, AUDIT-MC-BLOCK, AUDIT_CYCLE_2, CONTACT_IMPORT_AUDIT, FIX_SPRINT_CYCLE2_REPORT, MC_DASHBOARD_CORE_AUDIT, MC_MODULE_DEEP_AUDIT, MC_SCOPING_FIXES_REPORT, PROPERTY_CARD_UX_AUDIT, TECHNICAL_AUDIT_REPORT, UNICORN_ANALYSIS, USER_PROCESS_AUDIT_REPORT) → `archive/2026-04-cleanup/docs-audits/`. Заменены живыми документами в `docs/canonical/audits/`.
- **5 дубликатов в корне репо** (`_AUDIT.md`, `project.md` lowercase, `ARCHITECTURE_AUDIT.md`, `OS_system_prompt.md`, `DEVELOPER_MODULE_SPEC.md`) → `archive/2026-04-cleanup/root-duplicates/`. Заменены `PROJECT.md` + canonical 07/08 + architecture/ARCHITECTURE_V2.md.

### Notes
- Полный реестр перенесённого: см. [`archive/2026-04-cleanup/INDEX.md`](../../archive/2026-04-cleanup/INDEX.md).
- Правило: файлы из `archive/2026-04-cleanup/` нельзя возвращать в активное дерево; полезный контент поднимается в канон, источник цитируется.

---

## [1.7.1] — 2026-04-22

### Changed
- **`09-data-schema.md`** — обновлён до полноценной редакции v1.0 (21 раздел). Добавлены: три принципа схемы (§1), технологические ограничения (§2), полный enum reference (§4 — lifecycle, roles, ClearView, property/transaction, partner/KYB, service catalogue), детальные DDL для core tables `users`/`properties`/`partners`/`services` (§5), transaction tables (§6), lead intelligence с триггером scoring (§7), ClearView реестр (§8), content tables (§9), notifications/messages (§10), три RLS-паттерна (§11), helper triggers (§12), миграционные правила и rollback-шаблоны (§13), soft vs hard delete (§14), backup/DR (§15), indexing strategy (§16), чек-лист новой таблицы (§17), anti-patterns (§18), governance (§19), AI-prompt шаблон (§20), cross-references (§21).

### Notes
- Структура документа осталась обратно совместимой: все ссылки на разделы из PROJECT.md, M2, M8a продолжают работать.
- Источник истины по схеме данных Supabase — этот файл; расхождение с реальной БД считается дефектом.

---

## [1.7.0] — 2026-04-22

### Added
- **`09-data-schema.md`** — Canonical Data Schema v1.0. Единый источник истины по схеме данных Supabase: таблицы, enums, индексы, RLS-политики, FK, naming conventions. Любое расхождение между документом и реальной БД считается дефектом и устраняется PR в документ или миграцией. Связан с `PROJECT.md` §14, M2 (lifecycle/role columns), M8a (ClearView schema), `07-information-architecture.md` §2.1.

### Changed
- `docs/canonical/README.md` — индекс расширен до 9 канонических документов.

### Notes
- Принципы документа: один пользователь — одна БД — все домены; additive over destructive; RLS by default.
- Документ дополняет M2 (фактическая схема `profiles` после миграций) и служит контрактом для будущих миграций (M5+).

---

## [1.6.0] — 2026-04-22

### Added
- **`08-ai-prompts-library.md`** — AI Prompts Library v1.0. Канонический документ системы промптов для всех AI-агентов платформы (консьерж, ClearView scoring draft, Tax Advisor, support и др.). Единая структура, общая база знаний, специфичные инструкции. Источник истины — промпты живут в markdown, не в коде.
- **`audits/M8-clearview-integration-protocol.md`** — M8 ClearView Integration Protocol v1.0. Operational playbook для встраивания ClearView в работающий код платформы без breaking changes. Дополнение к `04-implementation-protocol.md` — может запускаться параллельно с M4–M6.

### Changed
- `docs/canonical/README.md` — индекс расширен до 8 канонических документов; M8 добавлен в раздел аудитов.

### Notes
- Документ 08 — контракт между AI-агентами в продакшене (Tax Advisor в ContractAI = Tax Advisor в TaxNav).
- M8 — независим от M2-сегментации, использует свою схему ClearView; не блокирует и не блокируется M4–M6.

---

## [1.5.0] — 2026-04-22 (M4 done)

### Added
- **AI-orchestration (M4)** — детекция lifecycle / persona / clusters / triggers через Lovable AI:
  - `supabase/functions/canonical-persona-detect/index.ts` — Edge Function с tool-calling structured output (`submit_segmentation`), enum-валидацией, RBAC (self или admin), опциональным аддитивным `apply` в `profiles`.
  - `src/hooks/useDetectPersona.ts` — React Query mutation hook + `isHighConfidence` helper (порог 0.75).
  - `audits/M4-ai-orchestration.md` — отчёт по M4 + контракты.

### Notes
- AI **никогда не применяет автоматически** — решение принимает UX-слой.
- AI не управляет `primary_role` (только app_role-маппинг M2). Работает с lifecycle / persona / clusters / triggers.
- Default-модель: `google/gemini-3-flash-preview`. 429 / 402 от Lovable AI пробрасываются на фронт с понятными кодами.
- Schema не менялась — M4 чисто оркестрационный слой над M2/M3.

---

## [1.4.0] — 2026-04-22

### Added
- **`/PROJECT.md`** в корне репозитория — стратегический источник истины (v2.3, апрель 2026). Отменяет все предыдущие версии, драфты и роадмапы. Содержит: позиционирование, 8 моатов (включая ClearView), монетизацию, 13-строчную таблицу сделок, Y1 target $1M net revenue, 5-тест для новых фич.
- **`06-clearview-methodology.md`** — каноническая методология ClearView™ V3 (March 2025), адаптированная для canonical system (April 2026). 8 взвешенных категорий, рейтинги AAA–BB, 5-ступенчатая maturity progression, audited score modifiers. Источник истины для UI-бейджей, RAG-базы AI-консьержа, pitch застройщикам, PR.
- **`07-information-architecture.md`** — каноническая информационная архитектура v1.0. URL-структура, субдомены (myuno.app, invest., app., clearview.), cross-domain SSO, навигация, SEO-маршрутизация.

### Changed
- `.cursorrules`, `CLAUDE.md`, `.cursor/rules/myuno-project.mdc` — порядок чтения для AI-агентов: сначала `/PROJECT.md`, затем canonical docs 01–07 по номерам.
- `docs/canonical/README.md` — индекс расширен до 7 канонических документов.

### Notes
- PROJECT.md живёт в **корне репозитория**, а не в `docs/canonical/`, потому что это стратегический документ верхнего уровня (объединяет позиционирование, экономику, моаты, дизайн-стандарты и AI-инструкции).
- Canonical docs 01–07 остаются операционными — они отвечают на конкретные «как сделать», PROJECT.md отвечает на «что строим и почему».

---

## [1.3.0] — 2026-04-22 (M3 done)

### Added
- **TypeScript canonical layer (M3)**:
  - `src/types/canonical.ts` — `CanonicalRole`, `LifecycleStage`, `HouseholdType`, `ClusterId`, `PersonaCode`, `CanonicalProfile`, метаданные ролей/стадий/кластеров.
  - `src/lib/canonical/profileApi.ts` — типизированный API над `v_profiles_canonical` + RPC канонических ролей. snake_case ↔ camelCase маппинг.
  - `src/hooks/useCanonicalProfile.ts` — React Query хуки: read, update, append-array, has-role.
- `src/types/index.ts` — barrel-экспорт канонических типов.
- `audits/M3-types-and-api-contracts.md` — отчёт по M3 + контракт для будущих миграций.

### Notes
- Запрещено читать M2-колонки `profiles` напрямую — только через `useCanonicalProfile`.
- Lifecycle/household enums приведены к фактическим значениям из БД (`scout/tourist/snowbird/nomad/settler/resident/absentee/returnee` и `solo/couple/family_with_kids/family_extended/group_friends`), а не к ранним черновым вариантам.
- TypeScript-сборка чистая.

---

## [1.2.0] — 2026-04-22 (M2 done)

### Added
- **Schema extension (M2)** — расширение `public.profiles`:
  - 13 новых колонок (lifecycle/persona/modifier/triggers)
  - 3 enum: `lifecycle_stage`, `household_type_enum`, `language_code`
  - 3 SECURITY DEFINER функции: `get_canonical_primary_role`, `get_canonical_secondary_roles`, `has_canonical_role`
  - View `v_profiles_canonical` с `security_invoker=true`
- `audits/M2-schema-extension.md` — отчёт по M2.

### Changed
- `README.md` (canonical) — статус M2 → done.

### Notes
- Smart-additive стратегия: `app_role` enum НЕ изменён (17 значений сохранены), маппинг канон ↔ существующие роли через функции.
- Zero breaking changes. 6 существующих профилей бэкфилены defaults.
- Линтер чистый по M2-изменениям. Pre-existing `Extension in Public` warn — out of scope.

---

## [1.1.0] — 2026-04-22

### Added
- `05-visual-design-system.md` — канонический Visual Design System v1.0 (принципы, цвет, типографика, сетка, компоненты, кластеры). Источник истины для всех визуальных решений.

### Changed
- `README.md` — индекс расширен до 5 канонических документов.

---

## [1.0.0] — 2026-04-22

### Added
- `01-segmentation-framework.md` — 3-осевая сегментация (lifecycle × role × modifier), 25 персон, 10 кластеров жизненных ситуаций, CRM-схема.
- `02-service-catalogue-v2.md` — 16 категорий × 230 услуг с тегами lifecycle/role/cluster и моделями монетизации.
- `03-tone-of-voice.md` — канонический голос бренда: интерфейс, WhatsApp, email, лендинги, AI-консьерж.
- `04-implementation-protocol.md` — operational playbook M1→M7.
- `research/phuket-proptech-market.md` — анализ рынка proptech на Пхукете.
- `research/myuno-taxonomy-canonical.md` — 6-уровневая таксономия (12 ситуаций × 140 микроситуаций × 38 персон × 36 приложений).
- `README.md` — индексный файл и правила работы.

### Notes
- Канонические документы становятся единственным источником правды для продуктовых, контентных и инженерных решений. При расхождении кода/UI с этими документами правится код, а не документ.
- Запущен протокол M1→M7, см. `04-implementation-protocol.md`.
