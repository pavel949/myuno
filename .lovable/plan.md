
Обновляю по твоим правкам: `/market` оставляю под `MarketComingSoonOverlay` (не трогаю), всё остальное чищу и проверяю.

## Часть 1 · WhatsApp → единый номер `+66 922 407 355`

Заменяю 5 хардкодов на канонический `COMPANY_CONTACTS.whatsapp.number` из `src/lib/config/contacts.ts`:

1. `src/pages/wedding/WeddingLandingPage.tsx` — `66800000000` → canonical
2. `src/pages/booking/AdvanceRequested.tsx` — `66123456789` → canonical
3. `src/pages/legal/TaxNavPage.tsx` — `66612345678` → canonical
4. `src/pages/owner/MCSubscriptionPage.tsx` — опечатка `022407355` → canonical
5. `supabase/functions/_shared/transactional-email-templates/transfer-customer-confirmed.tsx` — плейсхолдер `66999999999` → `66922407355`

Динамические `wa.me/${userPhone}` (телефоны лидов, гостей, операторов, владельцев в CRM) **не трогаю** — это контакты контрагентов.

После правок: `rg "66\d{10}" src supabase` — проверка, что других «левых» номеров нет.

## Часть 2 · Снять Coming Soon (всё, кроме /market)

1. `src/contexts/MaintenanceContext.tsx` — захардкодить `isMaintenanceMode = false`, `setMaintenanceMode` сделать no-op. Гарантия: даже если в `localStorage` остался флажок `myuno_maintenance_mode=true` со старых сессий — оверлей не покажется.
2. `src/App.tsx` — удалить мёртвую ветку `if (isMaintenanceMode && !canBypass) return <UnderConstruction />`.
3. `MarketComingSoonOverlay` — **оставляю как есть** (`MARKET_ENABLED = false`).
4. Стартовая страница и онбоардинг: пользователь попадает на `/` → `Index` (карточки «С чего начнём?») → `/start` (StartOnboardingV2). Уже работает, ничего не создаю.

## Часть 3 · Новые лендинги для приглашения поставщиков

Высокоприоритетные (data-driven шаблоны, не 13 копипастов):

**A. `/for/vendor/:category` — универсальный лендинг под категорию**
- `src/lib/landings/vendorCategories.ts` — конфиг 13 категорий (cleaning, beauty, fitness, medical, restaurants, transport, pets, flowers, education, babysitter, wellness, yachts, events): hero RU/EN, value-props, комиссия, FAQ.
- `src/pages/landings/VendorCategoryLandingPage.tsx` — рендер по конфигу. CTA «Стать партнёром» → `/vendor/join?category=<id>`.
- Helmet: per-category title/description/og + JSON-LD `Service`.
- Маршрут добавляется **до** `/for/:persona`, чтобы не перехватывало.

**B. `/stays` — лендинг подписки $25/объект**
- `src/pages/landings/StaysSubscriptionLanding.tsx` — хиро, 4 фичи PMS, CTA → `/owner/subscription`.

**C. Legal subpages** — `/legal/visa`, `/legal/company`, `/legal/tax`
- `src/lib/landings/legalServices.ts` + `src/pages/landings/LegalServiceLanding.tsx` — один компонент, три маршрута. CTA: WhatsApp на canonical + `/legal`.

## Часть 4 · Проверка

1. `rg "66\d{10}" src supabase` — нет старых номеров.
2. `browser--view_preview /` — главная и онбоардинг открываются без оверлея.
3. `browser--view_preview /for/vendor/cleaning` — лендинг рендерится, кнопка ведёт на `/vendor/join?category=cleaning`.
4. `browser--view_preview /stays` — открывается.
5. `browser--view_preview /legal/visa` — открывается.
6. `browser--view_preview /market` — Coming Soon оверлей **остаётся** (по твоему запросу).

## Файлы

**Edit (8):** `MaintenanceContext.tsx`, `App.tsx`, `WeddingLandingPage.tsx`, `AdvanceRequested.tsx`, `TaxNavPage.tsx`, `MCSubscriptionPage.tsx`, `transfer-customer-confirmed.tsx`, `AnimatedRoutes.tsx`.

**Create (5):** `lib/landings/vendorCategories.ts`, `pages/landings/VendorCategoryLandingPage.tsx`, `pages/landings/StaysSubscriptionLanding.tsx`, `lib/landings/legalServices.ts`, `pages/landings/LegalServiceLanding.tsx`.

**Рекомендую:** этот план — самый быстрый путь к запуску инвайтов поставщиков без блокеров; всё в одну итерацию, без новых таблиц и Edge Functions.
