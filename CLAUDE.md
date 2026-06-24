# CLAUDE.md — myUNO SuperApp (актуальна на 2026-06-21)

> Единственный источник информации для AI ассистентов в этом репозитории.
> Версия v3.55.5 | Ветка: main | Last sync: 2026-06-21

---

## 1. ПРОЕКТ

**myUNO** — AI-first суперапп для иностранцев на Пхукете. 59 микро-приложений (canonical inventory — `src/lib/appRegistry.ts`; недвижимость, услуги, юриспруденция, образ жизни) под одним аккаунтом, одной БД, много точек входа.

- **Домен:** myuno.app
- **Стек:** React 18 + TypeScript 5.9 + Vite 6 + Tailwind 3.4 + shadcn/ui + Supabase + Stripe + Vercel + Capacitor
- **Языки:** Русский (UI), Английский (UI). Код/комментарии/коммиты на English only.
- **Архитектура:** Monolithic React SPA + 59 micro-apps по вертикалям (6 surfaces: Arrive · Live · Manage · Invest · Legal · Build; 10 JTBD clusters A–J; 25 personas P01–P25 — `src/lib/taxonomies/master.ts`)

---

## 1.4 · ОБЯЗАТЕЛЬНОЕ ЧТЕНИЕ ПЕРЕД РАБОТОЙ

**Шаг 1 — Стратегический источник истины.** Перед любой задачей прочитай `/PROJECT.md` в корне репозитория. Этот документ отменяет все предыдущие версии, драфты и роадмапы. Он описывает, чем является платформа, как устроена монетизация, кто аудитория, какие дизайн-стандарты, и содержит 5-тест для новых фич.

**Шаг 2 — Операционные канонические документы.** Затем читай `/docs/canonical/` для конкретных решений (по номерам):

1. `01-segmentation-framework.md` — персоны, жизненные фазы, роли, ситуации, CRM-поля
2. `02-service-catalogue-v2.md` — каталог услуг с тегами lifecycle/role/cluster. **Canonical target:** 16 категорий × 230 услуг. **Runtime (код):** static SSOT `src/lib/catalog/taxonomy.ts` = 14 категорий (`cat-*`) / ~69 услуг, поверх — DB-driven `category_groups`/`categories`. Drift документирован в самом doc 02.
3. `03-tone-of-voice.md` — голос бренда (спокойная уверенность, продаём доверие не транзакцию)
4. `04-implementation-protocol.md` — operational playbook M1→M7
5. `05-visual-design-system.md` — визуальная дизайн-система (цвет, типографика, сетка, компоненты)
6. `06-clearview-methodology.md` — ClearView™ методология рейтингов off-plan (моат #8, AAA–CCC = 7 grades + unrated, 8 категорий оценки)
7. `07-information-architecture.md` — URL-структура, субдомены, навигация, cross-domain SSO
8. `08-ai-prompts-library.md` — канонические system prompts для всех AI-агентов (консьерж, ClearView draft, Tax Advisor, support и др.)
9. `09-data-schema.md` — Canonical Data Schema: таблицы, enums, RLS, FK, naming conventions Supabase (источник истины по схеме данных)

При расхождении кода/UI с PROJECT.md или каноном — правится **код**, а не документ.
Если изменение противоречит — остановись и задай вопрос Павлу.

См. также `docs/canonical/README.md` (индекс) и `docs/canonical/CHANGELOG.md` (версии).

---

## 1.5 · Architecture source of truth (v2)

**Before any structural change, read:**
1. `docs/canonical/architecture/OVERVIEW.md` — единый обзор: карта зависимостей, decision tree, навигация
2. `docs/canonical/architecture/ARCHITECTURE_V2.md` — target architecture (roles · clusters · surfaces · agents)
3. `docs/canonical/architecture/FEASIBILITY.md` — migration path and current implementation status per role

### Hard rules (from ARCHITECTURE_V2.md §13)

1. **Never add a new top-level route.** Put it under the relevant cluster or `/operate/*`.
2. **Never create a new shell.** Use `MiniAppLayout` or the existing Operate shell.
3. **Never hardcode a hex colour.** Use `src/styles/tokens.css` variables.
4. **Never import across cluster boundaries.** Use shared L4 primitives or L3 services.
5. **Never auto-execute money moves from an agent.** Always user-confirmed intent.
6. **Every money-moving screen must show audit marker** (tx id + ledger entry id + timestamp).
7. **Every new feature gated behind `feature_flag:*`** in `system_settings` until GA.

### Glossary

- **Surface (Content Cluster)** — one of 6 content clusters per Master Taxonomy v1.0: *Arrive · Live · Manage · Invest · Legal · Build*. This is the canonical meaning of «Surface» across the codebase (`src/lib/taxonomies/master.ts`).
- **Canvas (App Shell)** — one of 6 long-lived app-shell canvases used by global navigation: *Home · Discover · Operate · Wallet · Me · Admin*. Previously also called «Surface» — renamed to remove the term collision.
- **Cluster** — colloquial alias for Surface (content cluster). Same 6 IDs.
- **JTBD Cluster** — one of 10 functional Jobs-To-Be-Done classifiers (A–J). Used for tagging, AI routing, SEO. **Never confuse with Surface.**
- **Role stack** — `profiles.roles_stack` jsonb + `primary_role`, weighted `primary·3 + secondary·2 + tertiary·1`. Два слоя: **consumer role-stack (7)** для онбординга (Tourist/Resident/Owner/Agent/Developer/Provider/Investor) и **`app_role` enum (18 values)** — канонический SoT по авторизации в `src/types/auth.ts` (синхронизирован с DB `public.app_role`; включает platform/admin роли: guest, user, partner, property_owner, property_manager, broker, vendor, staff, uno_team, admin, ombudsman, finance, support, sales и др.). RLS/RoleGate — по `app_role`.
- **Intent** — AI agent output, user-confirmed via one-tap accept/later
- **Navigator (v3)** — `/discover` рендерит [NavigatorPageV3](src/components/navigation/v3/NavigatorPageV3.tsx) (situation-first grid: `NavigatorPageV3` + `SituationCard` + `SituationDetailPage` + `useSituationServiceCounts`). GA с 2026-06-16 (миграция `20260616013024_enable_navigator_v3_flag.sql`); v2-вариант (`NavigatorPage` cluster grid) и `NavigatorEntry`-обёртка с feature-flag выпилены 2026-06-17 после прохождения QA на role-aware ranking, persona chip-row + RoleSheet, `/map` link, related-situations block. Флаг `feature_flag:navigator_v3` в `system_settings` больше не читается из кода — можно удалить миграцией если хочется.
- **Canvas type** — `src/types/canvas.ts` экспортирует `CanvasId` + `CANVAS_META` (Home/Discover/Operate/Wallet/Me/Admin) с aud-ience tier'ом. Используйте этот type в новых routing/permission слоях, не строковые литералы.

<!-- updated: 2026-04-22 — handoff/ moved to docs/canonical/architecture/ during repo cleanup -->

---

## 2. ТЕКУЩИЙ СТАТУС

**Версия:** 3.55.5
**Ветка:** main (origin/main == HEAD на 2026-06-21)
**Статус:** Активная разработка (codebase audit-fix pass + полная синхронизация документации только что влиты; далее — i18n cleanup, lead routing)

### Последние изменения (последние 10 коммитов):
- `fbdfd75` — docs: refresh repo description + bump last-updated stamps (#24)
- `5ad39b3` — Merge PR #23: codebase bug audit fixes (payments, auth, edge, react)
- `26f3f4f` — fix: remove duplicate [functions.*] tables in supabase config.toml
- `4557b11` — ci: bump any-usage baseline 745→758 to match main
- `599f31e` — docs: sync all documentation with current codebase truth (#22)
- `d43adb9` — fix: resolve all remaining audit bugs (booking, edge, auth, react)
- `3cc727f` — fix: patch critical payment, auth & security bugs from codebase audit
- `4eae6c7` — Исправил CRM и RLS
- `2ad822a` — Changes
- `8f28d41` — Changes

### Текущие работы:
- **Codebase audit fixes (влито)** — PR #23: patched payments/checkout, flowers, booking, owner financials, auth/roles, edge functions, React correctness + atomic rate-limit migration
- **Documentation sync (влито)** — PR #22 + #24: вся документация и описание репозитория приведены к коду (v3.55.5, DS 2.1, 59 micro-apps, app_role×18, ClearView AAA–CCC)
- **Lead routing → WhatsApp** — отправка заявок (viewing requests, leads) в WhatsApp Павлу
- **i18n cleanup** — замена хардкод-строк и тире на i18n-ключи (RU/EN bilingual coverage)

---

## 3. БЛОКИ РАБОТ (по приоритету)

### 🏪 THAI BUSINESS LAYER (Local Services) — флаг `feature_flag:thai_business_layer` (ON с GA 2026-06-24)
**Статус:** GA — включён (флаг в `system_settings` остаётся kill-switch'ем: `{"enabled": false}` выключает модуль без редеплоя)
- B2B self-serve кабинет тайского бизнеса (`/vendor/thai-business`) + B2C каталог (`/thai-services`) + лендинги (`/ts/:slug`)
- Dedicated tables `thai_businesses` / `thai_business_services` / `thai_bookings` / `thai_chats` / `thai_chat_messages` / `thai_business_reviews`
- Авто-перевод RU↔TH/EN: поля бизнеса/услуг — клиентский вызов `ai-translate`; чат — edge `thai-chat-send` (хранит оригинал + перевод)
- Edge functions: `thai-chat-send`, `thai-notify` (WhatsApp/email через `_shared`)
- Owner авторизуется через существующий `vendor` app_role; модерация в `/admin/thai-business`
- Подробности: `src/pages/thaiServices/README.md`

### 🏠 STAYS (Property Management)
**Статус:** ~80% готово
- `src/pages/owner/` — 80+ страниц PM dashboard
- `src/pages/owner-portal/` — owner portal UI
- **Таблица:** `stays_subscription` (Stripe, per-property subscription)
- **Тестовые данные:** 35 properties (5 прямые + 30 партнёрские)

### 🏢 DEALS (Property Sales/Invest)
**Статус:** ~70% готово
- `src/pages/property/` — каталог, offplan, разработчики
- `src/pages/invest/` — investor dashboard
- **Flow:** Юзер смотрит листинг → Viewing Request → Lead created → Whatsapp Pavel → Capital advisory

### ⚖️ RE Audit Findings — fix pass влит 2026-06-21 (PR #23, commits `3cc727f` + `d43adb9`):
> Все 5 блоков ниже получили фиксы (checkout-handler, create-flowers-checkout, booking forms, owner financial panels, AuthContext/Impersonation/useIsAdmin) + atomic rate-limit migration. Осталось — верификация edge-кейсов на проде.

1. **Checkout/Payments** — Stripe flow, orders not created in DB after payment → patched
2. **Flowers/Bloom** — Cart checkout doesn't create order → patched
3. **Booking flow** — Confirmation state edge cases → patched
4. **Owner financials** — Income/expense inconsistencies → patched
5. **Auth/Role selection** — First login role assignment edge cases → patched

---

## 4. DATABASE & ENVIRONMENT

> **Канонический источник:** [`docs/ENVIRONMENT.md`](docs/ENVIRONMENT.md). При расхождении — он главный.

### Базы данных
| Роль | Supabase project ref | URL | Кто пишет |
|---|---|---|---|
| **PRIMARY (prod) — Lovable Cloud** | `kakkwibljrjsawxgnupk` | `https://kakkwibljrjsawxgnupk.supabase.co` | Frontend + Edge Functions |
| **MIRROR (опц.)** | `erfwtoavipwjqmylpizt` | standalone | Только ручной экспорт через `scripts/` |
| ~~PEYLAA~~ | мигрирована в PRIMARY | `slug=peylaa-phuket-marriott` | Frontend через стандартный supabase client |

⚠️ **Единственная production-БД проекта — `kakkwibljrjsawxgnupk` (Lovable Cloud, managed Supabase).** Это та БД, которую использует myuno.app (реальные пользователи и платежи), и она же зашита как fallback `VITE_SUPABASE_URL` в `vite.config.ts`. Миграции применяются через Lovable Cloud, а не вручную.

> 🛑 **Для AI-агентов:** Supabase MCP в этих сессиях НЕ имеет доступа к prod-проекту `kakkwibljrjsawxgnupk`. Он показывает другой проект — `hueotfhvvbxaijccmhnc` («myUNO - Main DB») — это **НЕ** production. Никогда не применяй миграции/DDL к `hueotfhvvbxaijccmhnc`, считая его боевым. Миграции коммить в `supabase/migrations/` и применять через Lovable Cloud.

⚠️ **Все записи (CRM, лиды, бронирования, юзеры, платежи) идут в `kakkwibljrjsawxgnupk`.** Локальная разработка использует **ту же** production-БД — отдельного staging нет. Тестовые данные помечайте маркерами.

### Окружения
- **Production:** myuno.app, www.myuno.app
- **Preview:** uno-connect-hub.lovable.app, id-preview--…lovable.app
- **Local:** localhost:8080

Все три окружения используют **одну** PRIMARY DB.

### Lovable project
- ID: `dcc2b024-7627-4ad9-a915-a3df3dd839f0`

**Supabase client:** Always use `src/integrations/supabase/client.ts`. Never create new instances. PEYLAA was migrated into PRIMARY DB — `src/lib/peylaa/supabaseClient.ts` removed.

**Auto-generated types:** `src/integrations/supabase/types.ts` (~1.1MB, не редактируем вручную).

**Schema:** all tables in `public` schema. No v2 schema exists. Не использовать `supabase.schema('v2')`.

**Key tables:**
- `orders` — all transactions (Stripe + cash + bank). Fields: `order_type`, `total_amount`, `platform_fee_amount`, `vendor_payout_amount`, `status`
- `order_items`, `order_addresses`, `order_participants`, `order_status_history` — order details
- `payment_intents` — Stripe payment tracking per order
- `ledger_entries` + `ledger_accounts` — double-entry audit trail (populated by `record_ledger_entries` RPC on payment confirmation)
- `reconciliation_alerts` — daily order vs ledger discrepancy tracking
- `vendor_payouts` — vendor payout management with atomic `process_payout` RPC
- `system_settings` — key-value store for feature flags (`feature_flag:*`), admin contacts (`admin_emails`, `admin_whatsapp`), stripe mode (`stripe_mode`)
- `providers` — vendor/partner profiles with `pending_payout`, `total_earnings`

**Financial flow:** Stripe checkout → webhook (`stripe-webhook`) → order confirmed → `record_ledger_entries` RPC → ledger entries created (platform fee + vendor payout + optional MC commission)

**Supabase client:** Always use `src/integrations/supabase/client.ts`. Never create new instances.

**Auto-generated types:** `src/integrations/supabase/types.ts` (~1.1MB, не редактируем вручную).

---

## 5. CODE RULES

### ✅ Must Follow
- **TypeScript strict** — no `any`, типы должны совпадать с DB schema
- **Mobile-first** — 375px. PWA installable
- **Bilingual** — каждая user-facing строка в RU + EN
- **public schema** — все таблицы в public schema (v2 schema не существует)
- **Error handling** — каждый Supabase query в try/catch
- **Loading states** — skeleton/spinner для каждой async операции
- **Feature flags** — новые вертикали за флагами в `system_settings` (ключ `feature_flag:*`)
- **Admin contacts** — не хардкодить email/телефоны, использовать `_shared/admin-config.ts`
- **Checkout functions** — использовать `_shared/checkout-handler.ts` для новых чекаутов
- **Commits** — English, conventional: `feat:`, `fix:`, `refactor:`, `chore:`, `design:`, `build:`

### ❌ Must NOT
- Do NOT создавать новые Supabase client instances
- Do NOT hardcode API keys
- Do NOT модифицировать auto-generated `types.ts`
- Do NOT использовать `console.log` в production коде
- Do NOT использовать `supabase.schema('v2')` — v2 schema не существует
- Do NOT использовать VITE_SIMULATION_MODE / VITE_DEMO_MODE
- Do NOT хардкодить email/телефоны администраторов в Edge Functions

---

## 6. DESIGN SYSTEM

> **See `DESIGN.md`** for the full, canonical design system. Always read it before making visual/UI decisions.
> `DESIGN.md` was re-synced 2026-05-14 against `src/styles/tokens.css` runtime; this section is its short-form mirror.

**Aesthetic direction (DS 2.1):** civic infrastructure — calm, authoritative, light-first. Reference points (per `tokens.css` header): GOV.UK, e-Estonia, The Economist, Apple support docs. **No mint, no glassmorphism, no glow, no decorative gradients.** Sharp corners by default (`--radius: 0`).

**Light theme — `:root` (default):**
- `--background` `#F7F5F1` (cream)
- `--foreground` `#1C1916` (ink)
- `--primary` `#0A2240` (navy) — CTAs, brand
- `--accent` `#D96B1A` (orange) — **singular** accent, ≤3% of screen

**Dark theme — `.dark` (admin/MC opt-in only):**
- `--background` `#051428` (navy-900)
- `--foreground` `#F7F5F1` (cream)
- `--primary` `#D96B1A` (orange) — better contrast on navy than navy-on-navy
- `--accent` navy-light

**⛔ Retired in DS 2.1 (do not reintroduce):**
- Mint `#00D68F` as primary (was dark-mode primary in DS 2.0)
- 6-color cluster rainbow (mint/blue/gold/purple/teal/red) — clusters now muted navy/orange/stone
- Dark-default theme — light is default, dark is opt-in
- Golos Text / DM Sans / JetBrains Mono — replaced by Source Serif 4 + Geist + IBM Plex Mono

**Border radius (only these are permitted):**
- `--radius` (default): **0px** — buttons, cards, panels, inputs, modals
- `--radius-sm`: 2px — mini-badges, category chips
- `--radius-full`: 9999px — avatars, status dots, pill toggles
- 8–16px mid-range radius is **forbidden** (mid-tokens collapsed to 0)

**Fonts (canonical, matches `tokens.css` + DESIGN.md Typography table):**
- Display / headings: **Source Serif 4** (both languages, primary)
- Body / UI: **Geist** (both languages, primary)
- Numerics / data / mono: **IBM Plex Mono** with `font-feature-settings: "tnum"`
- Locale fallback (RU): Unbounded → Golos Text → Noto Serif / Noto Sans
- Locale fallback (EN): Noto Serif → Noto Sans → Georgia / system-ui
- ⛔ NOT used anywhere in code: Syne, DM Sans, Playfair Display, JetBrains Mono, Cormorant Garamond — older docs may still reference these; they are stale.

**Other rules:**
- **Components:** shadcn/ui + Radix UI. Mobile = Sheet (bottom), not Dialog
- **Min touch target:** 44×44 on `pointer: coarse`
- **Runtime tokens:** `src/styles/tokens.css` is the **source of truth**. `src/design-system/tokens.json` (DS 2.0) is deprecated — do not use.
- **Use semantic tokens, never raw brand colors:** `bg-primary` / `text-accent` / `text-foreground` / `bg-card` / `border-border` — not `bg-navy` / `text-orange-400` / `text-white` / `bg-white/0.06`. Raw colors break theme-switch and accumulate as tech debt.

---

## 7. KEY INTEGRATIONS

| Service | Purpose | Status |
|---------|---------|--------|
| Supabase | DB + Auth + Storage + Edge Functions (Deno 2.0) | ✅ Active |
| Stripe | Payments + subscriptions (stays_subscription) | ✅ Test keys (switching to live) |
| Google Maps | Maps, geocoding (replacing Mapbox) | 🔄 In migration |
| WhatsApp (UltraMSG) | Notifications, lead alerts | ✅ Active |
| Telegram Bot | Admin notifications | ✅ Active |
| Resend | Email notifications | ✅ Active |
| Capacitor | iOS/Android builds | ✅ Active |

---

## 8. DEV SETUP

**Working directory:** `C:\Users\pavel\OneDrive\Apps\myUNO`

```bash
npm run dev      # Dev server: localhost:8080 (autoPort enabled if busy)
npm run build    # Production build
npm run preview  # Preview production at localhost:4173
npm run lint     # ESLint check
```

**Environment:** `.env.example` (Supabase keys). Backend secrets in Vercel/Supabase dashboard only.

---

## 9. FILE STRUCTURE

```
src/
├── pages/          — 557 pages organized by vertical (owner, property, invest, admin, etc.)
├── components/     — ~998 components across 90 domain folders
├── hooks/          — 429 custom hooks (domain-specific)
├── contexts/       — 15 global providers (Auth, Cart, Language, Theme, Location, etc.)
├── integrations/   — Supabase client + auto-generated types
├── lib/            — Utilities, adapters, taxonomies, appVersion.ts
├── design-system/  — Design tokens, component docs
├── i18n/           — Bilingual translations (RU/EN)
├── config/         — CRM types, maintenance schedules
└── types/          — TypeScript definitions

supabase/
├── functions/      — 165 Edge Functions (Deno 2.0)
└── migrations/     — 757 SQL migrations
```

---

## 10. GIT WORKFLOW

- **Main branch:** production-ready
- **Current branch:** `main` (origin/main == HEAD; feature-работа ведётся на per-task ветках, напр. `claude/*`)
- **Commit style:** Conventional commits with semantic prefixes
- **Pre-commit:** ESLint checks enforced

---

## 11. VERSION INFO

- **App Version:** 3.55.5 (in `src/lib/appVersion.ts`)
- **HTML meta tag:** `<meta name="version" content="3.55.5" />`
- **Version endpoint:** `public/version.json`
- **Cache busting:** Automatic on version mismatch (reload guard prevents loops)

---

## 12. USEFUL CONTACTS / REFERENCES

- **Supabase project:** [configured in env]
- **Vercel projects:** Auto-deploy on main branch push
- **Design system:** See `src/design-system/` for component docs
- **Taxonomies:** `src/lib/taxonomies/` — service categories, amenities, etc.

---

## AI Team Configuration (autogenerated by team-configurator, 2026-04-17)

**Important: YOU MUST USE subagents when available for the task.**

### Detected Stack

- **Frontend:** React 18, TypeScript 5.9, Vite 6 (SWC), React Router 6, TanStack Query 5
- **UI:** Tailwind CSS 3.4, shadcn/ui, Radix UI, Framer Motion, Embla Carousel
- **Forms:** React Hook Form 7, Zod validation
- **Backend/DB:** Supabase (PostgreSQL, Auth, Storage, Edge Functions on Deno 2.0)
- **Payments:** Stripe (Checkout, Connect, Subscriptions)
- **Maps:** Google Maps (@react-google-maps/api)
- **Notifications:** UltraMSG (WhatsApp), Telegram Bot, Resend (email)
- **Build/Deploy:** Vite 6, Vercel, Capacitor (iOS/Android), PWA (vite-plugin-pwa)
- **Testing:** Vitest, Testing Library
- **Monitoring:** Sentry

### Agent Assignments

| Task | Agent | Notes |
|------|-------|-------|
| React component creation, hooks, context, page scaffolding | `react-component-architect` | Primary agent for all React/TSX work. Use for new components, refactors, custom hooks in `src/components/` and `src/hooks/` |
| Tailwind styling, responsive layouts, design token updates, mobile-first UI | `tailwind-frontend-expert` | Use for all Tailwind class changes, shadcn/ui customisation, design system sync, animations in `tailwind.config.ts` |
| Supabase Edge Functions, Deno 2.0 functions, webhook handlers, RPC logic | `backend-developer` | Use for `supabase/functions/` work, Deno migrations, stripe-webhook, `_shared/` utilities |
| API contracts, Supabase RPC design, new endpoint schemas, Edge Function interfaces | `api-architect` | Use when designing new Supabase RPCs, REST contracts, or third-party integration endpoints |
| Code review before merging to main, security audit, pre-PR checks | `code-reviewer` | Always run before merging. Covers TypeScript strictness, Supabase RLS, Stripe security, missing error handling |
| Bundle size, query performance, PWA caching strategy, lazy loading, chunk splitting | `performance-optimizer` | Use for Vite chunk tuning, TanStack Query optimisation, image compression, Sentry performance traces |
| Docs, CLAUDE.md updates, onboarding guides, API documentation | `documentation-specialist` | Use after major features land or when onboarding contributors |
| Exploring unknown parts of the codebase (~998 components, 557 pages) | `code-archaeologist` | Use before large refactors or audits across verticals |
| Multi-step features spanning several verticals (STAYS, DEALS, CRM, Payments) | `tech-lead-orchestrator` | Use for complex cross-domain work — splits tasks and coordinates other agents |

### Quick-start Examples

- New property listing card: "@react-component-architect build a PropertyListingCard with Tailwind mobile-first layout and bilingual RU/EN labels"
- Fix Stripe webhook order creation: "@backend-developer fix the stripe-webhook Edge Function so orders are persisted to the public.orders table after payment_intent.succeeded"
- Styling pass on home screen: "@tailwind-frontend-expert refactor HeroBlock.tsx to use design tokens from tailwind.config.ts, ensure 44px touch targets"
- Pre-merge review: "@code-reviewer review the ExitIntentModal.tsx changes for TypeScript strictness and Supabase query safety"
- Bundle audit: "@performance-optimizer analyse the current Vite chunk split and reduce the initial JS payload"

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health