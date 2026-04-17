# myUNO — Current State Reference

> Source of truth for the current myUNO codebase.
> Version v3.40.0 | Last updated: 2026-04-17

---

## 1. PROJECT

**myUNO** — AI-first суперапп для русскоязычных экспатов и туристов на Пхукете. Монолитный React SPA, объединяющий 45+ вертикалей под одним доменом.

- **Domain:** myuno.app (CRM: crm.bymyuno.com → /capital)
- **Stack:** Vite 5 + React 18 + TypeScript + Tailwind 3.4 + shadcn/ui + Supabase + Stripe + Vercel + Capacitor
- **Version:** 3.40.0 (`src/lib/appVersion.ts`, `public/version.json`)
- **Mobile:** PWA installable + iOS/Android via Capacitor (`app.myuno.pwa`)
- **Languages:** RU + EN (user-facing). Code/comments/commits — English only.

---

## 2. ARCHITECTURE

Single Vite build, монолитная SPA. Никаких monorepo / workspaces / subpackages.

| Metric | Count |
|--------|-------|
| Page verticals (`src/pages/` subdirs) | 45 |
| Lazy-loaded page components | 549 |
| Route constants (`routes.ts`) | 400+ |
| Global context providers | 12 |
| Custom hooks | 180+ |
| Supabase Edge Functions | 126 |
| DB tables | 417 |
| DB migrations | 552 |

**Key structural files:**
- `src/components/layout/pageRegistry.ts` — все 549 lazy-import'ов
- `src/lib/config/routes.ts` — все 400+ констант маршрутов
- `src/lib/verticalGroups.ts` — 7 групп вертикалей
- `src/lib/appRegistry.ts` — реестр приложений (21KB)
- `src/integrations/supabase/client.ts` — единственный экземпляр Supabase клиента
- `src/integrations/supabase/types.ts` — авто-генерированные типы (900KB, не редактировать)

---

## 3. PAGE VERTICALS

### Consumer-facing (src/pages/)
```
account       auth          arrive        babysitter    beauty
booking       capital       classifieds   cleaning      delivery
developer-portal  education  events       expat         experiences
fitness       flowers       guest         info          insurance
invest        kids          knowledge     landing       legal
market        medical       newbuilds     nomad         orders
owner-portal  pets          peylaa        pharmacy      profile
property      relocate      restaurants   services      stays
support       tools         transport     vendor        wallet
wedding       wellness      yachts
```

Plus file-level pages: `Index.tsx`, `Discover.tsx`, `Search.tsx`, `MapView.tsx`, `Cart.tsx`, `Wallet.tsx`, `Bookings.tsx`, `Favorites.tsx`, `Notifications.tsx`, `SOS.tsx`, `VipConcierge.tsx`, `StorefrontPage.tsx`, `TripPlannerPage.tsx`, `LifeFlowPage.tsx`, `PlatformCatalog.tsx`, `ViewHistory.tsx`, и др.

### 7 Vertical Groups (`src/lib/verticalGroups.ts`)
1. **Home & Living** — property, cleaning, babysitter, pet_service, flower
2. **Transport** — transfer, vehicle, fast-track
3. **Leisure & Activities** — restaurant, experience, yacht, water_activity, event, food-delivery
4. **Health & Wellness** — beauty, medical, pharmacy, fitness, veterinary, insurance
5. **Documents & Finance** — legal, education, banking, visa/immigration, relocation
6. **Home Maintenance** — laundry, plumbing, electrical, AC, gardening, pest-control, handyman, locksmith
7. **Help** — vip-concierge, SOS

---

## 4. B2B PORTALS

### Admin Panel — 71 pages (`src/pages/admin/`)
CRM & data, verticals (properties, restaurants, salons, gyms, etc.), finance & payouts, vendor management, content/taxonomy, system settings, AI/automation ops, analytics, marketing lifecycle.

### Owner/MC Workspace — 89 pages (`src/pages/owner/`)
Dashboard, properties, bookings & calendar, financials, CRM (contacts, pipelines, sequences, emails, quotes, templates), sales deals, operations (service requests, inspections), analytics, staff, marketing hub, vault.

### Vendor Portals — 18 pages (`src/pages/vendor/`)
Dashboard, bookings, analytics, payouts, vertical-specific management (beauty, fitness, clinics, restaurants, events, pets, cleaning, etc.), products, messages, settings.

### Team Workspace — 8 pages (`src/pages/team/`)
Dashboard, content hub, chat, leaderboard, moderation, support, leads, team profile.

### Capital CRM — 9 pages (`src/pages/capital/`)
Dashboard, contacts, projects, campaigns, outreach, pipeline, templates. Accessible at `crm.bymyuno.com`.

---

## 5. DATABASE

**Supabase project:** `erfwtoavipwjqmylpizt` (Lovable-hosted, **migration to self-managed in progress** — see `MIGRATION_PLAN.md`)

**417 tables**, all in `public` schema. No `v2` schema.

| Category | Tables | Key Tables |
|----------|--------|------------|
| Auth & Users | 12 | profiles, user_roles, user_sessions, user_personas, user_achievements |
| Properties (PM) | 45 | properties, property_bookings, property_financials, property_availability, property_complexes |
| CRM | 32 | crm_contacts, crm_companies, crm_pipelines, crm_tasks, crm_sequences, crm_workflows |
| Orders & Cart | 18 | orders, order_items, order_status_history, cart_items, payment_intents |
| Bookings (multi-vertical) | 15 | bookings, tour_bookings, event_bookings, airport_bookings |
| Vendors & Providers | 20 | providers, vendor_services, vendor_payouts, vendor_subscriptions |
| Management Companies | 8 | management_companies, mc_property_slots, company_storefronts |
| Marketplace | 14 | marketplace_products, marketplace_vendors, marketplace_reviews |
| Restaurants | 7 | restaurants, restaurant_menus, restaurant_menu_items |
| Real Estate (Newbuilds) | 7 | developers, development_units, nb_leads, nb_promotions, resale_properties |
| Beauty/Wellness | 6 | salons, salon_services, gyms, clinics, medical_services |
| AI & Automation | 12 | ai_agents, ai_agent_logs, ai_artifacts, ai_intake_sessions |
| Marketing (MCC) | 18 | mcc_campaigns, mcc_leads, mcc_ab_tests, mcc_automation_rules |
| Finance | 10 | wallets, ledger_accounts, ledger_entries, owner_invoices, currency_rates |
| Analytics & Metrics | 15 | analytics_events, page_views, platform_metrics, funnel_analytics |
| LifeOS | 10 | life_scenarios, life_situations, life_tasks, lifeos_governance |
| Yachts | 5 | yachts, yacht_availability, yacht_pricing_rules, water_activities |
| Notifications & Comms | 8 | notifications, notification_preferences, push_subscriptions, message_templates |
| Gamification & Loyalty | 8 | achievement_definitions, user_achievements, cashback_settings, referral_codes |
| Legal & Insurance | 6 | legal_documents, insurance_providers, insurance_plans |

**Financial flow:** Stripe checkout → `stripe-webhook` Edge Function → order confirmed → `record_ledger_entries` RPC → ledger entries (platform fee + vendor payout).

**Always use** `src/integrations/supabase/client.ts`. Never create new Supabase instances.

---

## 6. EDGE FUNCTIONS (126 deployed)

Located in `supabase/functions/`. Key categories:

| Category | Functions |
|----------|-----------|
| AI/ML (20) | ai-agent, ai-concierge, ai-chat-moderator, ai-pricing-optimizer, ai-smart-search, ai-legal-assistant, ai-translate, claude-chat, ai-orchestrator, + more |
| Checkout/Payments (15+) | create-checkout, create-checkout-session, create-*-checkout (cleaning/event/flowers/legal/restaurant/yacht/wellness/etc.), stripe-webhook, create-order |
| Notifications (18+) | notify-admin-order, notify-lead-whatsapp, send-email, send-order-email, send-guest-welcome-whatsapp, publish-telegram-post, whatsapp-incoming-webhook |
| Automation (12+) | auto-lead-scoring, execute-crm-workflow, booking-reminders, post-order-autopilot, update-user-segments, visa-expiry-reminders |
| OTA/Sync (6) | airbnb-sync, rentals-united-sync, ota-scrape, ical-sync, ical-scheduled-sync, yacht-ical-sync |
| Data Processing (10+) | bulk-import, export-mc-data, generate-report-pdf, geocode-address, ocr-receipt, firecrawl-scrape, firecrawl-search |
| Developer Portal (6) | devmod-apply, devmod-approve, devmod-invite-team, devmod-stripe-onboard, devmod-stripe-webhook |
| Reporting (5) | owner-monthly-digest, monthly-owner-statements, daily-reconciliation, acquisition-metrics, user-analytics-api |

---

## 7. INTEGRATIONS

| Service | Purpose | Env var / config |
|---------|---------|-----------------|
| Supabase (main) | DB + Auth + Realtime + Edge Functions | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` |
| PEYLAA Supabase | Secondary DB — property sales (read-only) | `VITE_PEYLAA_SUPABASE_URL`, `VITE_PEYLAA_SUPABASE_KEY` |
| Google Maps | Maps JS + Places + Geocoding | `VITE_GOOGLE_MAPS_API_KEY` |
| Stripe + Connect | Payments + vendor payouts | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (backend only) |
| Resend | Transactional email | `RESEND_API_KEY` (backend only) |
| Telegram Bot | Admin notifications | `TELEGRAM_BOT_TOKEN` (backend only) |
| Sentry | Error monitoring (prod) | `VITE_SENTRY_DSN` |
| Firecrawl | Web scraping for data enrichment | `FIRECRAWL_API_KEY` (backend only) |
| Rentals United | OTA channel sync | `RENTALS_UNITED_ACCESS_KEY` (backend only) |
| Lovable Cloud Auth | Auth wrapper | `LOVABLE_API_KEY` |

Backend secrets (Stripe, Resend, Telegram, Firecrawl, etc.) are **never in `.env`** — configured in Supabase dashboard / Vercel environment only.

---

## 8. CONTEXT PROVIDERS (12)

| Context | Purpose |
|---------|---------|
| `AuthContext` | Supabase auth, session persistence, auto-logout |
| `CartContext` | Dual-storage cart (localStorage for guests, DB for auth users). Merges on login. |
| `LanguageContext` | RU/EN/TH i18n. DB-backed overrides with 1h cache + realtime. |
| `ThemeContext` | Light/dark/system theme, localStorage persistence |
| `CurrencyContext` | Multi-currency (RUB/USD/THB) selection |
| `LocationContext` | Geolocation + search proximity |
| `GoogleMapsContext` | Maps API initialization |
| `MaintenanceContext` | Maintenance mode + feature flags |
| `PWAInstallContext` | PWA install prompt handling |
| `StorefrontContext` | Vendor storefront state |
| `DashboardFilterContext` | Persistent filter state for admin/vendor dashboards |
| `LifeSituationContext` | LifeOS journey / life scenario tracking |

---

## 9. DESIGN SYSTEM

```css
--primary: #0d6e4f;        /* Emerald — CTA, links, active */
--background: #fafaf9;     /* Warm White */
--surface: #ffffff;         /* Cards, modals */
--text-primary: #1a1a19;   /* Headings, body */
--text-secondary: #57534e;
--border: #e5e5e4;
--success: #16a34a;
--error: #dc2626;
--warning: #d97706;
```

- **Fonts:** Syne (headings/display), DM Sans (body), JetBrains Mono (prices/data/code)
- **Components:** shadcn/ui + Radix UI. On mobile use Sheet (bottom), not Dialog.
- **Min touch target:** 44px
- **Design tokens:** `src/lib/designTokens.ts`

---

## 10. CODE RULES

### Must follow
- **TypeScript strict** — no `any` (649 existing casts are tech debt to eliminate)
- **Mobile-first** — 375px base. PWA installable.
- **Bilingual** — every user-facing string in RU + EN
- **public schema** — all tables in public schema. `v2` schema does not exist.
- **Error handling** — every Supabase query in try/catch
- **Loading states** — skeleton/spinner for every async operation
- **Feature flags** — new verticals behind flags in `system_settings` (key `feature_flag:*`)
- **Admin contacts** — never hardcode emails/phones, use `_shared/admin-config.ts`
- **Checkout functions** — use `_shared/checkout-handler.ts` for new checkouts
- **Commits** — English, conventional: `feat:`, `fix:`, `refactor:`, `chore:`, `design:`, `build:`

### Must NOT
- Create new Supabase client instances
- Hardcode API keys or admin emails/phones
- Modify auto-generated `types.ts`
- Use `console.log` in production code
- Use `supabase.schema('v2')` — v2 does not exist
- Use `VITE_SIMULATION_MODE` / `VITE_DEMO_MODE`

---

## 11. DEV SETUP

**Working directory:** `C:\Users\pavel\OneDrive\Apps\myUNO\myuno`

```bash
npm run dev      # Dev server: localhost:8080
npm run build    # Production build
npm run preview  # Preview at localhost:4173
npm run lint     # ESLint check
```

**Environment:** Copy `.env.example` → `.env.local`, fill Supabase + Google Maps keys.
Backend secrets (Stripe, Resend, Telegram, etc.) are in Supabase dashboard only.

---

## 12. CURRENT STATUS & KNOWN ISSUES

### Active work (as of 2026-04-17)
- **DB migration** — Lovable-hosted → self-managed Supabase (`MIGRATION_PLAN.md`). Schema squash from 552 → 1 migration. Target: ~360 tables post-optimisation.
- **Investment hub** — market, deals, network, dashboard, raise
- **Developer portal** — newbuilds developer onboarding & analytics
- **Admin improvements** — CRM filters, contacts, deal management

### Open architecture issues (from `ARCHITECTURE_AUDIT.md`)
| # | Issue | Severity |
|---|-------|----------|
| 8 | Inconsistent auth guard patterns | HIGH |
| 10 | Wide-open CORS on all edge functions | HIGH |
| 11 | Refresh tokens in localStorage (XSS risk) | HIGH |
| 12 | No Content Security Policy header | HIGH |
| 13 | Query hooks silently swallow errors | HIGH |
| 14 | Dual toast system: 250 sonner + 82 use-toast imports | MEDIUM |
| 15 | 649 `as any` casts across 244 files | MEDIUM |
| 16 | Unstable useEffect deps in realtime hooks | MEDIUM |
| 17 | Silent cart mutation failures | MEDIUM |
| 18 | XSS via dangerouslySetInnerHTML in map popups | MEDIUM |
| 19 | Hardcoded Supabase project ID in source | MEDIUM |

---

## 13. FILE STRUCTURE

```
src/
├── pages/          — 45 verticals + file-level pages (549 total lazy-loaded)
├── components/     — shadcn/ui, layout, navigation, domain-specific
│   └── layout/
│       ├── pageRegistry.ts   — 549 lazy page imports
│       └── AnimatedRoutes.tsx
├── hooks/          — 180+ domain hooks
├── contexts/       — 12 global providers
├── integrations/
│   ├── supabase/client.ts   — THE Supabase client (use this only)
│   └── supabase/types.ts    — auto-generated, 900KB (never edit)
├── lib/
│   ├── config/routes.ts     — 400+ route constants
│   ├── verticalGroups.ts    — 7 service groups
│   ├── appRegistry.ts       — app registry
│   ├── appVersion.ts        — version 3.40.0
│   ├── adapters/            — data transformation
│   ├── ai/                  — AI utilities
│   ├── filterConfigs/       — catalog filter configs
│   └── taxonomies/          — service categories, amenities
├── i18n/           — RU/EN/TH translation files
├── styles/         — vertical-specific CSS overrides
├── config/         — CRM types, maintenance schedules
└── types/          — TypeScript definitions

supabase/
├── functions/      — 126 Edge Functions (Deno 2.0)
└── migrations/     — 552 migration files
```

---

## 14. GIT & DEPLOYMENT

- **Branch:** `main` → auto-deploy to Vercel
- **Build:** `NODE_OPTIONS='--max-old-space-size=4096' npm run build`
- **Output:** `dist/`
- **Rewrites:** all routes → `index.html` (SPA). `crm.bymyuno.com` → `/capital`
- **Asset caching:** 1-year immutable for hashed JS/CSS/assets
- **Commit style:** conventional commits, English only
