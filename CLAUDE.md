# CLAUDE.md — myUNO SuperApp (актуальна на 2026-04-02)

> Единственный источник информации для AI ассистентов в этом репозитории.
> Версия v3.40.0 | Ветка: pavel/wip-current-version-20260318 | Last sync: 2026-04-02

---

## 1. ПРОЕКТ

**myUNO** — AI-first суперапп для иностранцев на Пхукете. 40+ микро-приложений (недвижимость, услуги, юриспруденция, образ жизни) под одним аккаунтом, одной БД, много точек входа.

- **Домен:** myuno.app
- **Стек:** React 18 + TypeScript + Vite 5 + Tailwind 3.4 + shadcn/ui + Supabase + Stripe + Vercel + Capacitor
- **Языки:** Русский (UI), Английский (UI). Код/комментарии/коммиты на English only.
- **Архитектура:** Monolithic React SPA + 40 микро-компонентов по вертикалям

---

## 2. ТЕКУЩИЙ СТАТУС

**Версия:** 3.40.0
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

## 4. DATABASE

**Supabase project** — all tables in **public** schema. No v2 schema exists in production.

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

```css
--primary: #0d6e4f;       /* Emerald — CTA, links, active */
--background: #fafaf9;    /* Warm White */
--surface: #ffffff;        /* White — cards, modals */
--text-primary: #1a1a19;  /* Headings, body */
--text-secondary: #57534e;
--border: #e5e5e4;
--success: #16a34a;
--error: #dc2626;
--warning: #d97706;
```

- **Fonts:** Syne (headings/display), DM Sans (body), JetBrains Mono (prices/data)
- **Components:** shadcn/ui + Radix UI. Mobile = Sheet (bottom), не Dialog
- **Min touch target:** 44px

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
├── pages/          — 366+ pages organized by vertical (owner, property, invest, admin, etc.)
├── components/     — 1000+ components across 60+ domain folders
├── hooks/          — 345 custom hooks (domain-specific)
├── contexts/       — 11 global providers (Auth, Cart, Language, Theme, Location, etc.)
├── integrations/   — Supabase client + auto-generated types
├── lib/            — Utilities, adapters, taxonomies, appVersion.ts
├── design-system/  — Design tokens, component docs
├── i18n/           — Bilingual translations (RU/EN)
├── config/         — CRM types, maintenance schedules
└── types/          — TypeScript definitions
```

---

## 10. GIT WORKFLOW

- **Main branch:** production-ready
- **Current branch:** `pavel/wip-current-version-20260318` (WIP, merge in progress)
- **Commit style:** Conventional commits with semantic prefixes
- **Pre-commit:** ESLint checks enforced

---

## 11. VERSION INFO

- **App Version:** 3.40.0 (in `src/lib/appVersion.ts`)
- **HTML meta tag:** `<meta name="version" content="3.40.0" />`
- **Version endpoint:** `public/version.json`
- **Cache busting:** Automatic on version mismatch (reload guard prevents loops)

---

## 12. USEFUL CONTACTS / REFERENCES

- **Supabase project:** [configured in env]
- **Vercel projects:** Auto-deploy on main branch push
- **Design system:** See `src/design-system/` for component docs
- **Taxonomies:** `src/lib/taxonomies/` — service categories, amenities, etc.
