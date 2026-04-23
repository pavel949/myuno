# M10 · Full Canonical Conformance Audit — 2026-04-23

> **Версия отчёта:** v1.0
> **Канон:** v1.19.2 → bump до **v1.20.0** после публикации
> **App:** 3.51.2 → **3.52.0**
> **Аудитор:** AI (автоматизированный sweep) · цикл «inventory only, no fixes»
> **Контекст:** запущено по запросу владельца «проверь приложение на соответствие каноническим документам один за другим».

---

## 0 · Executive summary

| # | Канон | Status | Critical | Warn |
|---|-------|--------|---------:|-----:|
| 01 | Segmentation framework | 🟡 partial | 1 | 2 |
| 02 | Service catalogue v2 | 🟢 conformant | 0 | 1 |
| 03 | Tone of voice | 🟢 conformant (i18n) · 🟡 legacy code (M9b) | 0 | 1 |
| 04 | Implementation protocol | 🟢 conformant | 0 | 0 |
| 05 | Visual design system | 🟡 partial | 0 | 3 |
| 06 | ClearView methodology | 🔴 missing tables | 1 | 1 |
| 07 | Information architecture | 🟢 conformant | 0 | 1 |
| 08 | AI prompts library | 🟡 drift | 0 | 2 |
| 09 | Data schema | 🟢 conformant | 0 | 2 |
| 10 | Semantic core | 🟢 conformant (0/0) | 0 | 0 |
| Arch | ARCHITECTURE_V2 §13 | 🟡 partial | 0 | 2 |

**Итого:** 7/11 зелёных, 3/11 жёлтых, 1/11 красный.
**Critical findings:** **2** (CV-1, SEG-1) — блокируют M9.7 закрытие.
**Warnings:** **17** — формируют backlog M11.x.

### Сильные стороны (must keep)

- ✅ Semantic Core: validate-semantic 0 errors / 0 warnings (strict-mode CI green).
- ✅ RLS: 392/392 публичных таблиц с включённым RLS, 1024 политики, 195 SECURITY DEFINER функций — все с `search_path=public`.
- ✅ Wallet: zero-update RLS + atomic RPC (`pay_from_wallet_atomic`, `topup_wallet_atomic`).
- ✅ Routing: 1400 ссылок на `APP_ROUTES` vs 474 хардкоженых — 75% централизовано.
- ✅ Auth: refresh tokens / SECURITY DEFINER / verify_jwt=false — все 3 «warning»-класса проверены и помечены ignore с обоснованием.

### Critical findings

| ID | Где | Что не так | Канон |
|----|-----|-----------|-------|
| **CV-1** | DB · нет таблиц `clearview_*` | `clearview_tables: 0` — методология (§6) нигде не материализована в схеме. UI `/clearview` рендерит контент-only. | 06 §1–§8 |
| **SEG-1** | `public.profiles` | Из 5 канонических колонок есть только 3: `active_clusters`, `triggers_active`, `special_status`. Отсутствуют `roles_stack` (jsonb) и `primary_role` (enum). Hook `useCanonicalProfile` ходит во view `v_profiles_canonical` — view есть, но базовые колонки missing. | 01 §12, ARCHITECTURE_V2 «Role stack» |

---

## 1 · Per-document matrix

### 1.1 · `01-segmentation-framework.md`

| Правило | Status | Evidence | Fix |
|---|---|---|---|
| 3-осевая модель в БД | 🔴 fail | `roles_stack`, `primary_role` отсутствуют в `profiles` (см. CV-1/SEG-1) | M11.1: миграция `ALTER TABLE profiles ADD COLUMN roles_stack jsonb, primary_role canonical_role` |
| Lifecycle phase | 🟡 warn | колонки `lifecycle_phase` нет; `useCanonicalProfile` рассчитывает её во view → ок для чтения, но запись недоступна | M11.1 включить в ту же миграцию |
| Активные кластеры (10 шт.) | 🟢 pass | `active_clusters TEXT[]` присутствует, `useAppendCanonicalArray` работает | — |
| Триггеры | 🟢 pass | `triggers_active TEXT[]` + `useAppendCanonicalArray` | — |
| 25 персон | 🟡 warn | `persona_*` 2 таблицы (фид + landings), но canonical mapping (§4) не закодирован в `src/lib/personas/` как enum | M11.2 |

### 1.2 · `02-service-catalogue-v2.md`

| Правило | Status | Evidence | Fix |
|---|---|---|---|
| 16 категорий × 230 услуг | 🟢 pass | `lookup_values: 406`, `lookup_types: 51`, таксономия в `src/lib/taxonomies/` синхронна | — |
| Lifecycle/role/cluster теги в каталоге | 🟡 warn | `landings/{cluster,persona}.ts` содержат только 2 файла (10 кластеров, 25 персон) — покрытие частичное | M11.3 (M9.6 продолжить — pillar pages есть, landings ещё нет) |
| Bundles (§19) | 🟢 pass | присутствуют в каталоге `src/content/bundles/` (по grep) | — |

### 1.3 · `03-tone-of-voice.md`

| Правило | Status | Evidence | Fix |
|---|---|---|---|
| §14 запрещённые слова | 🟢 pass (i18n) | ESLint `error` в `src/i18n/**`, runtime + fuzzy guards (M9.7c) → 0 violations | — |
| §14 в legacy коде | 🟡 warn (M9b) | ESLint `warn` в остальном `src/**` — backlog M9b | плановая зачистка M9b |
| §13 канонические микрокопии | 🟢 pass | `src/i18n/uiStrings.ts` covered by `uiStrings-canonical.test.ts` + fuzzy | — |
| `console.log` в production | 🟡 warn | 275 usages вне logger/test/sw → noise в проде | M11.4: ESLint rule `no-console: warn`-→`error` |

### 1.4 · `04-implementation-protocol.md`

| Правило | Status | Evidence |
|---|---|---|
| Audit-before-change | 🟢 pass | данный отчёт — пример |
| Additive over replacement | 🟢 pass | uiStrings.ts существует параллельно с `i18n/{ru,en,th}.ts` |
| One atomic change per PR | 🟢 pass | M9.7a/b/c — три PR-вехи в CHANGELOG |

### 1.5 · `05-visual-design-system.md`

| Правило | Status | Evidence | Fix |
|---|---|---|---|
| Hex-литералы вне токенов | 🟡 warn | **387** hex literals вне `src/styles/tokens.css` / `tailwind.config` / `design-system/`. Hot-spots: `home/ClusterHub.tsx` (6 цветов), `newbuilds/CatalogProjectCard.tsx`, `auth/GoogleSignInButton.tsx` (Google brand — допустимо), `home/PrimaryActions.tsx` | M11.5 — рефактор кластерных acccent colors в CSS-переменные |
| Шрифты (Golos/DM Sans/JetBrains/Playfair) | 🟢 pass | `index.html` preloads + tailwind config совпадают | — |
| 44px touch targets | 🟡 warn | конвенция в `src/components/page/README.md` есть, автотеста нет | M11.6: a11y тест Playwright |
| Кластерные цвета (6 кластеров) | 🟡 warn | хардкодятся как hex (см. выше) вместо CSS-vars `--cluster-arrive` etc. | M11.5 |

### 1.6 · `06-clearview-methodology.md`

| Правило | Status | Evidence | Fix |
|---|---|---|---|
| Таблицы `clearview_*` | 🔴 fail (**CV-1**) | в DB 0 таблиц с префиксом `clearview` | M11.7: миграция `clearview_projects`, `clearview_scores`, `clearview_categories` (8) |
| 8 категорий × веса | 🟡 warn | живут только в `mem://strategy/clearview-methodology-v3-full.md` | материализовать в seed |
| AAA–BB шкала | 🟡 warn | используется как литералы в `pages/clearview/` | enum в DB |

### 1.7 · `07-information-architecture.md`

| Правило | Status | Evidence |
|---|---|---|
| URL-структура | 🟢 pass | 588 routes в `AnimatedRoutes.tsx`, 63 top-level — все из канонических кластеров (`/property`, `/newbuilds`, `/clearview`, `/capital`, `/legal`, `/account`…) |
| Redirects (legacy → canonical) | 🟢 pass | `vercel.json` redirects: `/properties`→`/property`, `/offplan`→`/newbuilds` (4 правила) |
| Cross-domain SSO (`crm.bymyuno.com`) | 🟢 pass | host-based rewrite в `vercel.json` |
| Top-level routes growth | 🟡 warn | 63 top-level (порог §13.1 — «не добавлять новые»). Без аудита growth log не понятно, есть ли рост за неделю | M11.8: changelog top-level paths |

### 1.8 · `08-ai-prompts-library.md`

| Правило | Status | Evidence | Fix |
|---|---|---|---|
| Канонические system prompts в одном месте | 🟡 warn | 24 Edge Functions содержат inline `You are …` промпты (concierge, content-planner, cross-sell, moderator, etc.). Нет импорта из `@/lib/ai/systemPrompts` (Edge Functions работают на Deno и не могут импортить из `src/`) | M11.9: вынести в `supabase/functions/_shared/systemPrompts.ts` |
| Концьерж prompt совпадает с каноном | 🟡 warn | `ai-concierge/index.ts` отличается формулировкой от §3 канона | sync-pass |
| Tax Advisor / ClearView draft | 🟢 pass | присутствуют как отдельные функции, prompt в коде |

### 1.9 · `09-data-schema.md`

| Правило | Status | Evidence | Fix |
|---|---|---|---|
| RLS на всех публичных таблицах | 🟢 pass | 392/392 (100%) | — |
| RLS политики | 🟢 pass | 1024 политики |  |
| FK / naming conventions | 🟢 pass | соблюдается (snake_case, `_id` суффиксы) | — |
| Триггеры в reserved schemas | 🟢 pass | проверено `supabase--linter` — нет нарушений | — |
| Extension в public | 🟡 warn | linter: 1 warn `0014_extension_in_public` (вероятно `pg_trgm`) | M11.10 — переместить в `extensions` schema |
| `system_settings` SELECT для anon | 🟡 warn | scanner: `system_settings_public_read` USING:true для `{anon,authenticated}` — 46 параметров видны без auth | M11.11: scope SELECT to `authenticated` или admin |

### 1.10 · `10-semantic-core.md`

| Правило | Status | Evidence |
|---|---|---|
| Forbidden synonyms (§5/§14) | 🟢 pass | ESLint + 4-layer guard (eslint, validate-semantic, exact-match runtime, fuzzy runtime) |
| Title ≤ 60 chars | 🟢 pass | validate-semantic 0 violations |
| Description ≤ 160 chars | 🟢 pass | validate-semantic 0 violations |
| Pillar pages coverage | 🟢 pass | `knowledge_pillars: 10` rows, `KnowledgePillarsIndex.tsx` + `KnowledgePillarPage.tsx` зарегистрированы |
| schema.org / LandingSeoHead | 🟢 pass | `src/components/seo/{SEOHead,LandingSeoHead,JsonLd}.tsx` + 32 callers |
| Sitemap | 🟢 pass | `public/sitemap-{landings,pillars}.xml` + индекс `sitemap.xml` |

### 1.11 · `architecture/ARCHITECTURE_V2.md` §13 hard rules

| # | Hard rule | Status | Evidence |
|---|-----------|--------|----------|
| 13.1 | No new top-level route | 🟡 warn | 63 top-level — нужен growth log (M11.8) |
| 13.2 | No new shell | 🟢 pass | `MiniAppLayout` единственный shell |
| 13.3 | No hardcoded hex | 🟡 warn | 387 hex literals (см. §1.5) |
| 13.4 | No cross-cluster import | 🟢 pass (sample) | пятна не найдены grep'ом по `from '@/pages/(arrive|live|manage|invest|legal|build)'` |
| 13.5 | No auto money-move from agent | 🟢 pass | все money-move через `useUserConfirm` + UI |
| 13.6 | Money screen audit marker | 🟢 pass | `src/components/monetization/AuditMarker.tsx` (tx + ledger + ts + stream) |
| 13.7 | Feature flag for new feature | 🟢 pass | 26 `feature_flag:*` references in code/SQL |

---

## 2 · Recommended remediation milestones

| Milestone | Scope | Priority | Estimated PRs |
|-----------|-------|----------|--------------:|
| **M11.1** Canonical profile columns | `roles_stack`, `primary_role`, `lifecycle_phase` + backfill from `v_profiles_canonical` | **P0** | 1 migration + 1 hook update |
| **M11.7** ClearView schema | 3 таблицы + seed 8 категорий + AAA–BB enum | **P0** | 1 migration + UI binding |
| **M11.5** Cluster colour tokens | вынести 6 кластерных hex в `--cluster-*` CSS-vars | P1 | 1 PR |
| **M11.9** Edge Function prompts | `_shared/systemPrompts.ts` + sync с каноном 08 | P1 | 1 PR |
| **M11.11** `system_settings` RLS | scope SELECT to authenticated | P1 (security) | 1 migration |
| **M9b** legacy content sweep | tone-of-voice §14 в `src/components/**` | P2 | rolling |
| **M11.4** `console.log` ban | ESLint error + auto-fix to `logger.*` | P2 | 1 PR |
| **M11.6** Touch-target Playwright | a11y test enforce 44px | P2 | 1 PR |
| **M11.8** Top-level routes growth log | автогенерация diff vs canon 07 §3 | P3 | 1 script |
| **M11.10** Extension schema | move `pg_trgm` to `extensions` | P3 | 1 migration |
| **M11.2** 25 personas enum | codify §4 mapping | P3 | 1 PR |
| **M11.3** Persona/cluster landings | 10 + 25 файлов в `src/content/landings/` | P3 | rolling |

---

## 3 · Appendix — raw signals

### A. validate-semantic (strict)

```
=== Semantic Core Validation ===
Errors:   0
Warnings: 0
✓ Semantic Core validation passed. 0 violations.
```

### B. ESLint summary

```
✖ 1805 problems (6 errors, 1799 warnings)
```

- 6 errors — actionable (см. lint output, в основном `react-hooks/exhaustive-deps`).
- 1799 warnings — преимущественно `no-explicit-any` в Edge Functions (legacy).

### C. Supabase linter

```
WARN 1: Extension in Public (0014_extension_in_public)
```

### D. Security scan (active)

| Severity | Finding | Status |
|----------|---------|--------|
| warn | `bulk_import_role_check` — uses `profiles.role` instead of `has_role()` RPC | open · P1 |
| warn | `system_settings_public_read` — anon SELECT | open · P1 (M11.11) |
| warn | `developers_table_stripe_connect_id` — `stripe_connect_id` exposed | open · P1 |
| info | refresh_token_local · security_definer_rpcs · edge_verify_jwt_false · chart_style_injection · mapbox_innerHTML · wallet_rls_secure | accepted with rationale |

### E. DB facts

```
public_tables           = 392
rls_enabled_tables      = 392 (100%)
rls_policies            = 1024
sec_definer_funcs       = 195 (all SET search_path = public)
lookup_values_count     = 406
lookup_types_count      = 51
knowledge_pillars       = 10
clearview_*             = 0          ← CV-1
profiles canonical cols = 3 / 5      ← SEG-1
```

### F. Routing facts

```
AnimatedRoutes routes   = 588
Top-level paths         = 63
APP_ROUTES references   = 1400
Hardcoded /-strings     = 474   (75% migrated)
```

---

## 4 · Sign-off

- **Audit cycle:** inventory only — fixes deferred to milestones M11.x.
- **Next action:** prioritise **M11.1 (SEG-1)** + **M11.7 (CV-1)** — оба блокируют закрытие M9 финального gate.
- **Canon bump:** v1.19.2 → v1.20.0 (этот отчёт).
- **App version:** 3.51.2 → 3.52.0.

— end of M10 audit —
