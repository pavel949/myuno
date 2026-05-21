# CLAUDE.md — myUNO SuperApp (актуальна на 2026-05-01)

> Единственный источник информации для AI ассистентов в этом репозитории.
> Версия v3.55.3 | Ветка: pavel/wip-current-version-20260318 | Last sync: 2026-05-01

---

## 1. ПРОЕКТ

**myUNO** — AI-first суперапп для иностранцев на Пхукете. 40+ микро-приложений (недвижимость, услуги, юриспруденция, образ жизни) под одним аккаунтом, одной БД, много точек входа.

- **Домен:** myuno.app
- **Стек:** React 18 + TypeScript + Vite 5 + Tailwind 3.4 + shadcn/ui + Supabase + Stripe + Vercel + Capacitor
- **Языки:** Русский (UI), Английский (UI). Код/комментарии/коммиты на English only.
- **Архитектура:** Monolithic React SPA + 40 микро-компонентов по вертикалям

---

## 1.4 · ОБЯЗАТЕЛЬНОЕ ЧТЕНИЕ ПЕРЕД РАБОТОЙ

**Шаг 1 — Стратегический источник истины.** Перед любой задачей прочитай `/PROJECT.md` в корне репозитория. Этот документ отменяет все предыдущие версии, драфты и роадмапы. Он описывает, чем является платформа, как устроена монетизация, кто аудитория, какие дизайн-стандарты, и содержит 5-тест для новых фич.

**Шаг 2 — Операционные канонические документы.** Затем читай `/docs/canonical/` для конкретных решений (по номерам):

1. `01-segmentation-framework.md` — персоны, жизненные фазы, роли, ситуации, CRM-поля
2. `02-service-catalogue-v2.md` — каталог услуг (16 категорий × 230 услуг) с тегами lifecycle/role/cluster
3. `03-tone-of-voice.md` — голос бренда (спокойная уверенность, продаём доверие не транзакцию)
4. `04-implementation-protocol.md` — operational playbook M1→M7
5. `05-visual-design-system.md` — визуальная дизайн-система (цвет, типографика, сетка, компоненты)
6. `06-clearview-methodology.md` — ClearView™ методология рейтингов off-plan (моат #8, AAA–BB, 8 категорий)
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
- **Role stack** — `profiles.roles_stack` jsonb + `primary_role`, weighted `primary·3 + secondary·2 + tertiary·1`
- **Intent** — AI agent output, user-confirmed via one-tap accept/later
- **Navigator v2 / v3** — `/discover` рендерит `NavigatorEntry` ([src/components/navigation/NavigatorEntry.tsx](src/components/navigation/NavigatorEntry.tsx)), который feature-flag-switch'ит между v2 (cluster grid, default) и v3 (situation-first grid: `NavigatorPageV3` + `SituationCard` + `SituationDetailPage` + `useSituationServiceCounts`). v3 живёт за `feature_flag:navigator_v3` в `system_settings` (default OFF) до прохождения QA на role-aware ranking и пустых-ситуаций edge cases; включается переключением row, без деплоя.
- **Canvas type** — `src/types/canvas.ts` экспортирует `CanvasId` + `CANVAS_META` (Home/Discover/Operate/Wallet/Me/Admin) с aud-ience tier'ом. Используйте этот type в новых routing/permission слоях, не строковые литералы.

<!-- updated: 2026-04-22 — handoff/ moved to docs/canonical/architecture/ during repo cleanup -->

---

## 2. ТЕКУЩИЙ СТАТУС

**Версия:** 3.55.3
**Ветка:** pavel/wip-current-version-20260318
**Статус:** Активная разработка (session work, CRM improvements, Edge Functions migration)

### Последние изменения (последние 10 коммитов):
- `b0a53ca3` — Merge conflicts resolved (Claude Code)
- `f8df8213` — feat: session work
- `dccff068` — Enable deno auto modules
- `3e485f7e` — Add deno.json node modules auto
- `93c1dcdd` — Preceding changes

### Текущие работы:
- **Миграция Edge Functions на Deno 2.0** — добавление `deno.json` для автоматического управления модулями
- **Session management** — улучшения в управлении сессиями пользователя
- **CRM оптимизация** — исправления в контактах, сделках, фильтрах
- **Design tokens унификация** — синхронизация шрифтов (Golos, Playfair, DM Sans, JetBrains)

---

## 3. БЛОКИ РАБОТ (по приоритету)

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

### ⚖️ RE Audit Findings (5 блоков с багами):
1. **Checkout/Payments** — Stripe flow, orders not created in DB after payment
2. **Flowers/Bloom** — Cart checkout doesn't create order
3. **Booking flow** — Confirmation state edge cases
4. **Owner financials** — Income/expense inconsistencies
5. **Auth/Role selection** — First login role assignment edge cases

---

## 4. DATABASE & ENVIRONMENT

> **Канонический источник:** [`docs/ENVIRONMENT.md`](docs/ENVIRONMENT.md). При расхождении — он главный.

### Базы данных
| Роль | Supabase project ref | URL | Кто пишет |
|---|---|---|---|
| **PRIMARY (prod)** | `kakkwibljrjsawxgnupk` | `https://kakkwibljrjsawxgnupk.supabase.co` | Frontend + Edge Functions |
| **MIRROR (опц.)** | `erfwtoavipwjqmylpizt` | standalone | Только ручной экспорт через `scripts/` |
| ~~PEYLAA~~ | мигрирована в PRIMARY | `slug=peylaa-phuket-marriott` | Frontend через стандартный supabase client |

⚠️ **Все записи (CRM, лиды, бронирования, юзеры, платежи) идут в `kakkwibljrjsawxgnupk`.** Локальная разработка использует **ту же** production-БД — отдельного staging нет. Тестовые данные помечайте маркерами.

### Окружения
- **Production:** myuno.app, www.myuno.app
- **Preview:** uno-connect-hub.lovable.app, id-preview--…lovable.app
- **Local:** localhost:8080

Все три окружения используют **одну** PRIMARY DB.

### Lovable project
- ID: `dcc2b024-7627-4ad9-a915-a3df3dd839f0`

**Supabase client:** Always use `src/integrations/supabase/client.ts`. Never create new instances. PEYLAA was migrated into PRIMARY DB — `src/lib/peylaa/supabaseClient.ts` removed.

**Auto-generated types:** `src/integrations/supabase/types.ts` (~900KB, не редактируем вручную).

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

**Auto-generated types:** `src/integrations/supabase/types.ts` (900KB, не редактируем вручную).

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
├── pages/          — 510 pages organized by vertical (owner, property, invest, admin, etc.)
├── components/     — ~992 components across 60+ domain folders
├── hooks/          — 410 custom hooks (domain-specific)
├── contexts/       — 15 global providers (Auth, Cart, Language, Theme, Location, etc.)
├── integrations/   — Supabase client + auto-generated types
├── lib/            — Utilities, adapters, taxonomies, appVersion.ts
├── design-system/  — Design tokens, component docs
├── i18n/           — Bilingual translations (RU/EN)
├── config/         — CRM types, maintenance schedules
└── types/          — TypeScript definitions

supabase/
├── functions/      — 126 Edge Functions (Deno 2.0)
└── migrations/     — 673 SQL migrations
```

---

## 10. GIT WORKFLOW

- **Main branch:** production-ready
- **Current branch:** `pavel/wip-current-version-20260318` (WIP, merge in progress)
- **Commit style:** Conventional commits with semantic prefixes
- **Pre-commit:** ESLint checks enforced

---

## 11. VERSION INFO

- **App Version:** 3.55.3 (in `src/lib/appVersion.ts`)
- **HTML meta tag:** `<meta name="version" content="3.55.3" />`
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

- **Frontend:** React 18, TypeScript 5.8, Vite 5 (SWC), React Router 6, TanStack Query 5
- **UI:** Tailwind CSS 3.4, shadcn/ui, Radix UI, Framer Motion, Embla Carousel
- **Forms:** React Hook Form 7, Zod validation
- **Backend/DB:** Supabase (PostgreSQL, Auth, Storage, Edge Functions on Deno 2.0)
- **Payments:** Stripe (Checkout, Connect, Subscriptions)
- **Maps:** Google Maps (@react-google-maps/api)
- **Notifications:** UltraMSG (WhatsApp), Telegram Bot, Resend (email)
- **Build/Deploy:** Vite 5, Vercel, Capacitor (iOS/Android), PWA (vite-plugin-pwa)
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
| Exploring unknown parts of the codebase (~992 components, 510 pages) | `code-archaeologist` | Use before large refactors or audits across verticals |
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