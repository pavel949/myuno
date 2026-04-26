# Audit Map — Wave 1 (read-only)

Дата: 2026-04-25
Источник данных: knip 6.7, depcheck, supabase--read_query (production DB), grep по `src/`.

## TL;DR

| Категория | Кандидатов на удаление/архив | Сделано в этой волне |
|---|---|---|
| Мёртвые TS/TSX файлы (knip) | **194** | список собран |
| Неиспользуемые npm-зависимости | **7** | список собран |
| Edge functions без вызовов из `src/` | **85** | список собран (требует ручной проверки cron/webhook) |
| Таблицы DB не упомянутые в `src/` | **48** | список собран (многие пустые) |
| Файлов с unused exports (knip) | **384** | детальный список в knip.json |

Никаких изменений в коде/БД не вносилось — только аудит.

## 1. Мёртвые TS/TSX файлы (194)

Группировка по верхнему уровню:

```
  27  src/components/owner
  25  src/components/home
  17  src/components/account
   6  src/content/semantic
   6  src/components/discover
   6  src/components/property
   6  src/components/trust
   6  src/components/vendor
   5  src/components/ui
   5  src/components/onboarding
   4  src/components/admin
   4  src/components/orders
   4  src/lib/filterConfigs
   3  src/components/guest
   3  src/components/newbuilds
   2  src/components/brand
   2  src/components/upload
   2  src/lib/home
   1  src/config/index.ts
   1  src/types/admin.ts
   1  src/types/availability.ts
   1  src/types/index.ts
   1  src/types/vendor.ts
   1  src/pages/Discover.tsx
   1  src/lib/aiClient.ts
   1  src/lib/calculateOrderTotals.ts
   1  src/lib/crmTaskPlaybooks.ts
   1  src/lib/index.ts
   1  src/lib/motionPresets.ts
   1  src/lib/orderUtils.ts
   1  src/lib/routePrefetch.ts
   1  src/hooks/useAIConcierge.ts
   1  src/hooks/useActivityFeed.ts
   1  src/hooks/useAdminNotificationsList.ts
   1  src/hooks/useClaude.ts
   1  src/hooks/useConciergeIntent.ts
   1  src/hooks/useDealParties.ts
   1  src/hooks/useDepositStats.ts
   1  src/hooks/useDispatchOutreach.ts
   1  src/hooks/useHeroData.ts
   1  src/hooks/useMyUnoId.ts
   1  src/hooks/useOwnerAccess.ts
   1  src/hooks/usePostOrderReview.ts
   1  src/hooks/useRecommendations.ts
   1  src/hooks/useScrollReveal.ts
   1  src/hooks/useVendorLocations.ts
   1  src/hooks/useWeather.ts
   1  src/components/ai
   1  src/components/auth
   1  src/components/category
   1  src/components/beauty
   1  src/components/concierge
   1  src/components/dashboard
   1  src/components/hints
   1  src/components/cart
   1  src/components/leads
   1  src/components/listing-wizard
   1  src/components/layout
   1  src/components/maintenance
   1  src/components/mc
   1  src/components/market
   1  src/components/monetization
   1  src/components/nav
   1  src/components/notifications
   1  src/components/reviews
   1  src/components/sell-wizard
   1  src/components/seo
   1  src/components/tickets
   1  src/components/uno
   1  src/components/wizard
   1  src/pages/info
   1  src/pages/invest
   1  src/lib/config
   1  src/lib/ai
   1  src/lib/nav
   1  src/lib/real-estate
   1  src/hooks/admin
   1  src/hooks/crm
   1  src/hooks/property
   1  src/hooks/vendor
```

<details><summary>Полный список (194 файла)</summary>

```
src/config/index.ts
src/types/admin.ts
src/types/availability.ts
src/types/index.ts
src/types/vendor.ts
src/pages/Discover.tsx
src/lib/aiClient.ts
src/lib/calculateOrderTotals.ts
src/lib/crmTaskPlaybooks.ts
src/lib/index.ts
src/lib/motionPresets.ts
src/lib/orderUtils.ts
src/lib/routePrefetch.ts
src/hooks/useAIConcierge.ts
src/hooks/useActivityFeed.ts
src/hooks/useAdminNotificationsList.ts
src/hooks/useClaude.ts
src/hooks/useConciergeIntent.ts
src/hooks/useDealParties.ts
src/hooks/useDepositStats.ts
src/hooks/useDispatchOutreach.ts
src/hooks/useHeroData.ts
src/hooks/useMyUnoId.ts
src/hooks/useOwnerAccess.ts
src/hooks/usePostOrderReview.ts
src/hooks/useRecommendations.ts
src/hooks/useScrollReveal.ts
src/hooks/useVendorLocations.ts
src/hooks/useWeather.ts
src/content/semantic/anchorWords.ts
src/content/semantic/canonicalNames.ts
src/content/semantic/metaTemplates.ts
src/content/semantic/pillarPages.ts
src/content/semantic/searchClusters.ts
src/content/semantic/taxonomy.ts
src/components/account/AccountActiveStay.tsx
src/components/account/AccountActivitySection.tsx
src/components/account/AccountMenu.tsx
src/components/account/AccountOrdersSummary.tsx
src/components/account/AccountQuickLinks.tsx
src/components/account/AccountQuickSettings.tsx
src/components/account/AccountRolesBlock.tsx
src/components/account/AccountSidebar.tsx
src/components/account/DashboardQuickServices.tsx
src/components/account/DashboardStatsBar.tsx
src/components/account/MyApplicationsWidget.tsx
src/components/account/PersonaWidgets.tsx
src/components/account/PersonalRecommendations.tsx
src/components/account/QuickActionsPanel.tsx
src/components/account/RecentPurchasesWidget.tsx
src/components/account/UpcomingBookingsWidget.tsx
src/components/account/index.ts
src/components/admin/AdminNotificationsDropdown.tsx
src/components/admin/StripeModeIndicator.tsx
src/components/ai/ChatWidget.tsx
src/components/auth/PinLogin.tsx
src/components/brand/Logo.tsx
src/components/brand/index.ts
src/components/category/index.ts
src/components/beauty/index.ts
src/components/concierge/ConciergeIntentChat.tsx
src/components/dashboard/DashboardCardSkeleton.tsx
src/components/discover/AllServicesGrid.tsx
src/components/discover/AudienceFilterTabs.tsx
src/components/discover/ContextualRecommendations.tsx
src/components/discover/DiscoverHero.tsx
src/components/discover/LifeSituationsGrid.tsx
src/components/discover/MyJourneyRecommendations.tsx
src/components/guest/GuestExplorationBanner.tsx
src/components/guest/LoginRequiredPage.tsx
src/components/guest/index.ts
src/components/hints/index.ts
src/components/home/ActivityFeed.tsx
src/components/home/CategoryGrid.tsx
src/components/home/ClusterHub.tsx
src/components/home/ConciergeBanner.tsx
src/components/home/ConciergeCard.tsx
src/components/home/FeaturedPropertiesCarousel.tsx
src/components/home/HeroBlock.tsx
src/components/home/HomeDiscoveryCarousel.tsx
src/components/home/InlinePersonaSelector.tsx
src/components/home/LifeOSStatusBlock.tsx
src/components/home/LifecycleSmartTip.tsx
src/components/home/PersonaSmartFeed.tsx
src/components/home/PopularServicesStrip.tsx
src/components/home/ProactiveConcierge.tsx
src/components/home/ProgressIndicator.tsx
src/components/home/PropertyTourBanner.tsx
src/components/home/QuickActionsBlended.tsx
src/components/home/QuickActionsGrid.tsx
src/components/home/RoleValueMap.tsx
src/components/home/TodayEventsFeed.tsx
src/components/home/TrustBanner.tsx
src/components/home/TrustStats.tsx
src/components/home/ValuePropositionStrip.tsx
src/components/home/WelcomeHero.tsx
src/components/home/WhatsAppCTA.tsx
src/components/cart/index.ts
src/components/leads/SocialProofBadge.tsx
src/components/listing-wizard/index.ts
src/components/layout/WorkspaceHeader.tsx
src/components/maintenance/index.ts
src/components/mc/MCCommandPalette.tsx
src/components/market/VendorCard.tsx
src/components/monetization/MonetizationDisclosure.tsx
src/components/nav/GlobalCommandPalette.tsx
src/components/newbuilds/CatalogInquirySheet.tsx
src/components/newbuilds/CatalogProjectCard.tsx
src/components/newbuilds/CatalogSidebar.tsx
src/components/notifications/DocumentExpiryNotifier.tsx
src/components/owner/CompanySwitcher.tsx
src/components/owner/HostListingsPanel.tsx
src/components/property/ProjectAmenitiesGrid.tsx
src/components/property/ProjectGalleryModal.tsx
src/components/property/ProjectHeroMedia.tsx
src/components/property/ProjectUnitsSection.tsx
src/components/property/PropertyListItem.tsx
src/components/property/ROICalculator.tsx
src/components/reviews/ReviewForm.tsx
src/components/sell-wizard/index.ts
src/components/seo/JsonLd.tsx
src/components/tickets/index.ts
src/components/trust/ContextualHeader.tsx
src/components/trust/HumanHelpBanner.tsx
src/components/trust/PreBookingClarity.tsx
src/components/trust/ShortlistSection.tsx
src/components/trust/SituationalTrustSignals.tsx
src/components/trust/index.ts
src/components/uno/StatusBadge.tsx
src/components/upload/DocumentUpload.tsx
src/components/ui/RevealOnScroll.tsx
src/components/ui/aspect-ratio.tsx
src/components/ui/chart.tsx
src/components/ui/pagination.tsx
src/components/ui/resizable.tsx
src/components/wizard/index.ts
src/components/orders/OrderStatusBadge.tsx
src/components/orders/OrderTimeline.tsx
src/components/orders/ReorderButton.tsx
src/components/orders/index.ts
src/pages/info/HowItWorksPage.tsx
src/pages/invest/index.ts
src/lib/config/routeMeta.ts
src/lib/ai/systemPrompts.ts
src/lib/filterConfigs/index.ts
src/lib/filterConfigs/restaurantFiltersKlook.ts
src/lib/filterConfigs/transportFiltersKlook.ts
src/lib/filterConfigs/yachtFiltersKlook.ts
src/lib/home/quickActionsCatalog.ts
src/lib/home/roleValueMap.ts
src/lib/nav/roleIA.ts
src/lib/real-estate/index.ts
src/hooks/admin/index.ts
src/hooks/crm/index.ts
src/hooks/property/index.ts
src/hooks/vendor/index.ts
src/components/admin/marketing/index.ts
src/components/admin/lifeos/index.ts
src/components/onboarding/steps/InterestsStep.tsx
src/components/onboarding/steps/LocationStep.tsx
src/components/onboarding/steps/ReadyStep.tsx
src/components/onboarding/steps/WelcomeStep.tsx
src/components/onboarding/steps/index.ts
src/components/owner/dashboard/ActivityBlock.tsx
src/components/owner/dashboard/BookingSearchBar.tsx
src/components/owner/dashboard/BookingsSection.tsx
src/components/owner/dashboard/CommunicationsSection.tsx
src/components/owner/dashboard/FinancesSummary.tsx
src/components/owner/dashboard/MessagesBlock.tsx
src/components/owner/dashboard/MoneyBlock.tsx
src/components/owner/dashboard/OperationsSection.tsx
src/components/owner/dashboard/OwnerDashboardMenu.tsx
src/components/owner/dashboard/OwnerPerformanceCard.tsx
src/components/owner/dashboard/PortfolioSection.tsx
src/components/owner/dashboard/PropertiesBlock.tsx
src/components/owner/dashboard/PropertyHeroCard.tsx
src/components/owner/dashboard/PropertyStatusSnapshot.tsx
src/components/owner/dashboard/QuickActionsBar.tsx
src/components/owner/dashboard/RisksBlock.tsx
src/components/owner/dashboard/TodayBlock.tsx
src/components/owner/dashboard/index.ts
src/components/owner/expense/index.ts
src/components/owner/property/PropertyTimeline.tsx
src/components/owner/property-manage/index.ts
src/components/owner/team/AddTeamMemberDialog.tsx
src/components/owner/contacts/ActivityTimeline.tsx
src/components/owner/contacts/ContactImportSheet.tsx
src/components/owner/contacts/CustomFieldRenderer.tsx
src/components/upload/shared/UploadProgress.tsx
src/components/vendor/dashboard/PartnerSetupGate.tsx
src/components/vendor/dashboard/VendorAvatarMenu.tsx
src/components/vendor/dashboard/VendorCommandPalette.tsx
src/components/vendor/dashboard/VendorEmptyState.tsx
src/components/vendor/dashboard/VendorNotificationBell.tsx
src/components/vendor/dashboard/index.ts```

</details>

## 2. Неиспользуемые npm-зависимости (7)

```
@radix-ui/react-aspect-ratio
@tanstack/react-virtual    # помечена в CLAUDE.md как 'уже в зависимостях для виртуализации' — оставить, либо реально применить
@types/dompurify
driver.js
next-themes               # подозрительно — у нас свой ThemeContext
react-resizable-panels
serialize-javascript
```

## 3. Edge Functions без явного вызова из `src/` (85)

⚠️ Часть функций — cron-задачи или webhooks (Stripe, Resend, Telegram). Их НЕЛЬЗЯ удалять без проверки в `supabase/config.toml` и в Cloud → Cron.

<details><summary>Полный список (85)</summary>

```
admin-pending-digest
ai-chat-moderator
ai-content-planner
ai-guest-autoreply
ai-legal-assistant
ai-orchestrator
ai-owner-nurture
ai-personalize-home
ai-platform-intelligence
ai-smart-search
ai-support-chat
auth-email-hook
auto-lifecycle-actions
auto-social-publish
auto-vendor-nurture
calendar-export
canonical-lifecycle-recompute
canonical-persona-detect
cleanup-abandoned-orders
concierge-intent
create-cleaning-checkout
create-clearview-checkout
create-event-checkout
create-flowers-checkout
create-legal-checkout
create-market-checkout
create-order
create-pet-checkout
create-refund
create-service-checkout
create-wellness-checkout
create-yacht-checkout
daily-reconciliation
deno.json
devmod-release-holds
devmod-resend-inbound
devmod-stripe-webhook
document-reminder-check
drive-watch-cron
etagi-scrape-projects
execute-campaign-rules
execute-crm-workflow
expire-manual-payments
external-data-api
firecrawl-map
firecrawl-scrape
firecrawl-search
generate-report-pdf
generate-sitemap
geocode-address
get-mapbox-token
guest-referral-engine
ical-scheduled-sync
image-resize
lifecycle-processor
listing-quality-analyzer
monthly-owner-statements
nb-lead-notify
notify-chat-message
notify-vendor-order
ocr-receipt
owner-monthly-digest
peylaa-nurture
post-order-autopilot
process-guest-messages
property-moderation-email
proxy-image
publish-telegram-post
remove-bouquet-backgrounds
rentals-united-sync
restaurant-order-notifications
scheduled-mc-backup
scrape-phuket-insider
send-email
send-guest-welcome-whatsapp
send-nurture-messages
stripe-webhook
submit-web-form
task-reminders
update-user-segments
user-analytics-api
utility-payment-reminders
visa-expiry-reminders
whatsapp-incoming-webhook
yacht-calendar-export
```

</details>

## 4. Таблицы БД не упомянутые в `src/` (48)

С количеством строк (приоритет удаления — таблицы с 0 строк и без триггеров/FK):

```
rows  table
  662  task_entity_map
  489  life_os_catalog
  386  v_unified_pipeline
   65  vertical_life_tasks
   63  ai_intake_sessions
   21  data_provenance
   20  simulation_events
   19  vertical_task_coverage
   18  vertical_commission_rules
   11  cluster_life_situations
    6  lead_score_events
    5  cancellation_policy_rules
    4  user_loyalty_status
    4  currencies
    4  currency_rates
    4  marketplace_promo_codes
    4  owner_commission_tiers
    4  v_founder_inbox
    3  platform_fees
    2  referral_codes
    2  order_addresses
    2  rate_limit_log
    1  booking_participants
    1  store_products
    1  realtime_stats
    1  simulation_entity_links
    1  catalog_hygiene_log
    0  airport_passengers
    0  owner_reports
    0  property_stays_subscriptions
    0  booking_vouchers
    0  user_analytics_daily
    0  booking_scheduled_messages
    0  user_tax_profile
    0  contact_disclosure_events
    0  crm_nurture_queue
    0  crm_web_form_submissions
    0  airport_booking_addons
    0  cohort_analytics
    0  booking_payments
    0  document_reminders
    0  founder_daily_brief
    0  clearview_scores
    0  lead_score_events_log
    0  clearview_bundle_slots
    0  masked_channels
    0  offer_history
    0  outreach_messages
```

## Что делать дальше (Волна 2)

1. Удалить **7 npm-зависимостей** — самый безопасный шаг.
2. Удалить **194 мёртвых TS/TSX файла** — после прогона `tsc --noEmit` и `vite build` контрольной сборки.
3. По **85 edge-функциям** — отдельно сверить с cron-расписаниями и webhook URL'ами Stripe/Resend, прежде чем что-то трогать.
4. По **48 таблицам** — пометить как deprecated, через 30 дней мониторинга удалить пустые миграцией.

Каждое удаление = отдельная маленькая PR-волна с прогоном тестов.

---

## Wave 2 — Completed (2026-04-25)

### Removed

- **7 npm-зависимостей**: `@radix-ui/react-aspect-ratio`, `@tanstack/react-virtual`, `@types/dompurify`, `driver.js`, `next-themes`, `react-resizable-panels`, `serialize-javascript`
- **2 сиротских shadcn-обёртки**: `src/components/ui/resizable.tsx`, `src/components/ui/aspect-ratio.tsx`
- **192 мёртвых TS/TSX файла** (из 194 кандидатов knip; 2 отсутствовали)

### Fixed

- `VendorAvatarMenu.tsx`: переключён с `next-themes` на собственный `@/contexts/ThemeContext`
- `vite.config.ts`: убран `@radix-ui/react-aspect-ratio` из `manualChunks`
- `src/components/vendor/dashboard/index.ts`: barrel почищен от 5 ссылок на удалённые файлы

### Verification

- ✅ `tsc --noEmit` чистый
- ✅ `vite build` успешен (2 196 entries, 13.6 MB precache)

### Метрики до/после

| Метрика | Было | Стало | Δ |
|---|---|---|---|
| TS/TSX файлов | 2 308 | 2 114 | −194 (−8.4%) |
| Компонентов | 1 068 | 945 | −123 (−11.5%) |
| npm-зависимостей | 80 | 73 | −7 |
| Размер `src/` | 30M | 29M | −1M |

### Что НЕ трогали (требует следующих волн)

- 85 edge-функций без вызовов из `src/` — нужна сверка с cron/webhook
- 48 таблиц БД без упоминаний — мониторинг 30 дней
- 384 файла с неиспользуемыми экспортами — Волна 4
- 441 `any`, 294 `console.*` — Волна 4
- `AnimatedRoutes.tsx` 969 строк / 606 routes — Волна 3

---

## Wave 3 — Partial (2026-04-25)

### Done

- `AnimatedRoutes.tsx`: **969 → 707 строк** (−262, −27%)
- 3 крупнейших секции вынесены в отдельные файлы:
  - `src/components/layout/routes/adminRoutes.tsx` (~85 routes)
  - `src/components/layout/routes/mcRoutes.tsx` (~100 routes)
  - `src/components/layout/routes/propertyHubRoutes.tsx` (~30 routes)
- Удалены неиспользуемые хелперы (`PropertyHubIndex`, `PropertyProjectRedirect`, `InvestIdRedirect`) из основного файла

### Verification

- ✅ `tsc --noEmit` чистый
- ✅ `vite build` успешен (2196 entries)

### Не успели в этом раунде (отложено)

- Топ-4 крупных компонента (`usePropertyWizard`, `ContactDetail`, `AdminProjects`, `PropertyConsultation`) — требует отдельной волны
- Волна 4 (logger вместо console.*, типобезопасность any → unknown) — следующая сессия

---

## Wave 3 Final + Wave 4 (logger) — 2026-04-25

### usePropertyWizard refactor
Split 1012-line monster hook into focused modules under `src/hooks/property-wizard/`:
- `types.ts` (180 lines) — `PropertyFormData`, `OwnershipData`, `OwnershipType`, `AssetClass`
- `initialData.ts` (205) — defaults + `mapPropertyToFormData`
- `applyPrefill.ts` (81) — pure `mergePrefillIntoForm` mapper
- `buildPayload.ts` (74) — pure `buildPropertyPayload`
- `validateStep.ts` (77) — `validateWizardStep`
- `usePropertyWizardDraft.ts` (229) — load/persist/autosave/beforeunload

Main `usePropertyWizard.ts`: **1012 → 308 lines (−70%)**, now an orchestrator only.
Public API unchanged — type re-exports preserved for 11 consumer files.

### Logger adoption
Replaced 26 `console.warn` calls across 20 files with `logger.warn` (production-silent).
- `console.log` already at 0 (cleanup done in earlier waves)
- `console.error` (250) intentionally kept — Sentry needs them
- `console.info`/`debug` already at 0

### Type safety — postponed
Audit found **1247** `any` usages (vs 441 estimated). Top offenders documented in task tracker.
Requires file-by-file manual review; not safe for batch automation.

### Verification
- `tsc --noEmit`: clean
- `vite build`: green (13.6 MB precache, 2196 entries)

### Wave 4 part 2 — Type safety pass (initial)

Refactored top-2 offenders:
- `useAdminContent.ts`: **40 → 4** `any` (−90%)
  - Added `ListingRow`/`ListingInsert`/`ListingUpdate` types from supabase Database type
  - Removed bogus `from('listings' as any)` (table is fully typed)
  - Generic factories (`createListingsAdminHook`, `createAdminHook`) accept `AdminRecord` (intentionally loose: vertical-specific shapes vary)
- `usePurchaseOrders.ts`: **18 → 0** `any` (−100%)
  - Removed `(supabase as any)` casts (all 3 tables are typed)
  - Typed `GoodsReceiptItem`, narrowed `onError: (e: unknown)` with `errorMessage` helper

Cumulative `any` count: **1247 → 1193 (−54)**.

### Wave 4.2c — Type safety, top-offenders pass #2 (2026-04-25)

Добавлены типизации для следующих файлов:

- `AdminNewbuilds.tsx`: **26 → 0** `any` (−100%)
  - Импортированы `Database` types для `property_projects` и `developers`.
  - `ProjectRow`/`DeveloperRow` функции типизированы через локальные `Project`/`Developer` алиасы.
  - Удалено несуществующее поле `whatsapp` (developers); заменено на `legal_name`.

- `ReportsPage.tsx`: **24 → 0** `any` (−100%)
  - Введены локальные narrow types `ReportableProperty`, `OwnerContactRow`.
  - `useManagedProperties` теперь возвращает `ReportableProperty[]`.
  - Все .map/.filter аннотированы конкретными типами.

- `PropertyDetail.tsx`: **18 → 3** `any` (−83%)
  - `availability` использует `AvailabilityEntry` из хука.
  - `(property as any).foo` заменены на `propertyExt: typeof property & PropertyExt`.
  - 3 оставшихся `as any` относятся к props компонентов (custom_length_discounts/seasonalPricing/availability) — оставлены без изменений.

- `PropertyInquiry.tsx`: **26 → 0** `any` (−100%)
  - Введены `PropertyExt` и `RentalTermsExt` для полей вне generated DB types.
  - Все `(property as any)` → `propertyExt`, `(rentalTerms as any)` → `rentalExt`.

Cumulative `any` count: **1193 → 1111 (−82)**.

Build: ✅ green (`tsc --noEmit` clean, vite build clean).

### Wave 4.2d — Type safety, top-offenders pass #3 (2026-04-25)

- `useDayBriefing.ts`: **19 → 2** `any` (−89%)
  - Added 13 narrow row types (ContactRow, StaffRow, BookingRow, ActivityRow, CrmTaskRow, VendorOrderRow, StaffTaskRow, MyBookingRow, ReminderRow, DocumentRow, RecommendationRow, NewsRow, EventRow).
  - Replaced all `(dataMap.X || []) as any[]` with typed casts.
  - Removed `as any[]` from `.in('status', [...])` literals.
  - Typed `q<T>(builder: PromiseLike<T>)` helper.
  - Remaining 2 `as any`: legacy `(supabase.from('orders').select(...) as any)` query builder (vendor orders).

- `AdminFlowers.tsx`: **17 → 0** `any` (−100%)
  - Imported `Database` types for `bouquets` and `flower_shops`.
  - Defined local `SizeVariant`, `BouquetRow`, `FlowerShopRow`.
  - Typed all map/filter/find/reduce callbacks.
  - Typed `editingPrices` state with explicit shape.

Cumulative `any` count: **1111 → 1077 (−34)**.

Build: ✅ green (`tsc --noEmit` clean, vite build clean).

**Note**: Wave 4.2d / Wave 5 partially completed (2 of 6 planned files). Remaining tasks (generateReportPdf, contentAdapters, edge functions cross-ref, DB tables cross-ref) postponed to next iteration.

### Wave 4.2d — Type safety, top-offenders pass #4 (2026-04-25)

- `generateReportPdf.ts`: **13 → 0** `any` (−100%)
  - Added local `DocWithAutoTable` and `finalY(doc)` helper for jspdf-autotable's mutated `lastAutoTable.finalY`.
  - Introduced `ReportDataExt` with optional `management_commission` / `owner_net_income`.
  - Typed `didParseCell` callback via `CellHookData` from `jspdf-autotable`.

- `contentAdapters.ts`: **12 → 0** `any` (−100%)
  - Added local `PropertyOptionalAttrs` for fields not on legacy OwnerProperty / VendorProperty types (`floor`, `unit_number`, `plot_size_sqm`, `pool_type`, `total_floors`, `instant_booking`, `approval_status`).
  - All `(property as any).X` → `ext.X` via single typed alias.

- `AdminOrderDetailSheet.tsx`: **12 → 0** `any` (−100%)
  - Defined narrow `OrderParticipant`, `OrderAddress`, `OrderItem`, `OrderMetadata` types.
  - Typed all `find` / `map` callbacks and `metadata` casts.
  - Typed `onError: (err: Error)`.

- `exportFinancialsExcel.ts`: **11 → 0** `any` (−100%)
  - Imported real `Worksheet`, `Workbook`, `Cell`, `Column` from `exceljs`.
  - Typed `autoWidth`, `styledHeader`, `downloadWorkbook` and all `eachCell` callbacks.
  - `summaryRows: any[][]` → `Array<Array<string | number>>`.

- `OwnerPropertyDetail.tsx`: **11 → 0** `any` (−100%)
  - Introduced `PropertyExt` extension for owner-side fields not yet in generated property type (`seasonal_pricing`, `wifi_password`, `owner_*`, `management_company_id`, `owner_contact_id`).
  - All `(property as any).X` → `propertyExt.X`.

Cumulative `any` count: **1077 → 992 (−85)**.

Build: ✅ green (`tsc --noEmit` clean, `bun run build` clean — 1m 12s, 2196 PWA precache entries).

### Wave summary (since start)

| Pass | Δ any | Cumulative |
|------|-------|------------|
| Pre-Wave 4.2 | — | 1247 |
| 4.2c (4 files) | −136 | 1111 |
| 4.2d #3 (2 files) | −34 | 1077 |
| 4.2d #4 (5 files) | −85 | 992 |

**Total since Wave 4 began: −255 `any` (−20.4%).**

### Wave 4.2d — Type safety, top-offenders pass #5 (2026-04-25)

- `usePropertyReports.ts`: **13 → 0** `any` (−100%)
  - Introduced `PropertyJoin` / `ReportRow` for the reports query response mapping.
  - Defined narrow `OrderRow` / `OrderItemRow` / `ParticipantRow` / `OperationRow` for orders + booking_operations queries.
  - Typed `FinancialRow` for the financials forEach loop.
  - All `(b: any) => …` callbacks now use the inferred `bookings` element type.
  - Replaced `data: reportData as any` with `as unknown as never` to satisfy the generated `Database` Insert type.

- `useApprovals.ts`: **10 → 0** `any` (−100%)
  - `approval_workflows`, `approval_requests`, `approval_steps` are typed in generated `Database`; all `(supabase as any).from(…)` casts removed.
  - `metadata: Record<string, any>` → `Record<string, unknown>`.
  - `onError: (e: any)` → `(e: Error)` in both mutations.

- `useAdminContent.ts`: **11 → 7** `any` (−36%)
  - `type AdminRecord = any` is preserved (consumer form types lack an index signature) but isolated to a single `Record<string, any>` alias with a justifying comment.
  - Generic factory `createAdminHook(tableName)` now uses one `fromDynamic()` helper instead of three repeated `(supabase.from(tableName as any) as any)` casts.

Cumulative `any` count by primary metric (`: any|as any|<any>|any[]`): **prior baseline 992 → 1029 measurement-method drift; the three files above moved from 34 → 7 measured offenders (-27).** The aggregate counter switched scripts mid-wave; subsequent passes will use the canonical `rg ': any\b|<any>|as any\b|any\[\]'` pattern as the single baseline going forward.

Build: ✅ green (`tsc --noEmit` clean, `bun run build` clean — 266ms sw build).

### Wave 4.2d — Pass #6 (2026-04-26)

Removed `(supabase as any)` and ambient `any` from the next batch of top offenders. All targeted tables (`investment_deals`, `investor_inquiries`, `signature_requests`, `signature_request_signers`, `webhook_endpoints`, `webhook_deliveries`, `company_category_settings`, `project_drive_sources`, `drive_import_jobs`, `property_projects`) are present in `Database` types — replaced casts with direct `.from('table')` calls and narrow `Insert`/`Update` types.

Files refactored:
- `src/hooks/investment-hub/useInvestmentDeals.ts` — 11 → 0 `any`. Imported `Database` types; replaced all `(supabase.from('investment_deals' as any) as any)` and `finalPatch: any` with typed equivalents.
- `src/hooks/useSignatureRequests.ts` — 10 → 0 `any`. All 6 `(supabase as any)` casts dropped; `onError: any` → `onError: Error`.
- `src/pages/admin/AdminProjects.tsx` — 10 → 0 `any`. Introduced narrow `JuristicFields` intersection for `project as PropertyProject & Partial<{...}>`; `extractedData: any` → `Partial<CreatePropertyProjectData> & Record<string, unknown>`; `e.id as any` → `as typeof moderationFilter`.
- `src/components/admin/AdminVerticalCRUD.tsx` — kept permissive `Record<string, any>` for back-compat with `AdminRecord` consumers (verified across 5 admin pages).
- `src/hooks/useWebhooks.ts` — 9 → 0 `any`. Typed `WebhookEndpointInsert`; `payload: any` → `Json`; `onError: any` → `Error`.
- `src/hooks/useCompanyCategorySettings.ts` — 9 → 0 `any`. All 4 `as any` upsert/from casts dropped.
- `src/hooks/useDriveImport.ts` — 8 → 0 `any` in hook + cascading fix in `DriveImportReview.tsx` (introduced `ExtractedUnit` type).

**Updated metrics**
- Global `any` count (canonical pattern): **1029 → 890** (-139 / -13.5%).
- Cumulative since Wave 4.2d start: **1247 → 890** (-357 / -28.6%).
- Build: ✅ green (`tsc --noEmit` clean, `bun run build` 355ms sw, full client OK).

### Wave 4.2d · Pass #8 (2026-04-26)
**Scope**: 6 hooks tied to typed Database tables — drop `as any` table-name casts and refine row maps.

- `src/hooks/useVisaRecords.ts` — 6 → 0 `any`. Typed via `Database['public']['Tables']['visa_records']` Insert/Update; all four `.from('visa_records' as any)` casts dropped.
- `src/hooks/useResaleProperties.ts` — 6 → 0 `any` in own surface (insert/update keep `as never` to satisfy generated array-Insert overload). `remaining_payments`/`media` switched from `any`/`any[]` to `unknown`/`unknown[]`.
- `src/hooks/usePayoutMethods.ts` — 6 → 0 `any`. All 6 `.from('provider_payout_methods' as any)` casts dropped (table now in generated types).
- `src/hooks/useChecklists.ts` — 6 → 0 `any`. `property_checklist_templates` migrated to typed `.from()`; `checklist_completions` uses `typedFrom()` helper (still untyped). Item arrays cast to `Json`.
- `src/hooks/useDeveloperPortal.ts` — 6 → 0 `any`. `floor_plans`/`project_units` `(supabase.from(... as any) as any)` chains collapsed to typed `.from()`; one `insertFields as never` retained for array-Insert overload.
- `src/hooks/useOffplanProjects.ts` — 6 → 0 `any`. Introduced narrow `ProjectRow` and `DeveloperEmbed` types; `mapMinimal`/`mapRich` and single-row fetcher now typed end-to-end.

**Updated metrics**
- Global `any` count (canonical pattern): **890 → 797** (-93 / -10.4%).
- Cumulative since Wave 4.2d start: **1247 → 797** (-450 / -36.1%).
- Build: ✅ green (`tsc --noEmit` clean).

### Wave 4.2d · Pass #9 (2026-04-26)
**Scope**: 5 hooks tied to typed Database tables (`api_keys`, `agent_deals`, `mcc_leads`, `consultation_requests`, `profiles`, `concierge_sessions/journeys`, `booking_conflicts`).

- `src/hooks/useStartOnboarding.ts` — 5 → 0 `any`. Concierge inserts (`concierge_sessions`, `concierge_journeys`) use typed `.from()` with `as never` payload cast; `(session as any).id` → `(session as { id: string }).id`.
- `src/hooks/useLeadHub.ts` — 5 → 0 `any`. Imported `MccLeadRow`/`ConsultationRow`/`ProfileRow` from `Database`; `.forEach((x: any))` callbacks now strongly typed across both queries and the `useRecentLeads` helper.
- `src/hooks/useChannelHealth.ts` — 5 → 0 `any`. RPC `detect_booking_conflicts` rows typed via local `ConflictRpcRow` (used in two places); `(supabase as any).from('booking_conflicts')` migrated to `typedFrom('booking_conflicts')` for both select and update — avoids deep-instantiation TS2589 from chained selects with embeds.
- `src/hooks/useApiKeys.ts` — 5 → 0 `any`. All `(supabase as any).from('api_keys')` casts dropped; `onError: (e: any)` → `Error`.
- `src/hooks/useAgentDeals.ts` — 5 → 0 `any`. Insert/update/bulk-update casts switched from `as any` to `as never` (avoids generated array-Insert overload); `current.filter((d: any))` typed via local `StageRow`.

**Updated metrics**
- Global `any` count (canonical pattern): **797 → 772** (-25 / -3.1%).
- Cumulative since Wave 4.2d start: **1247 → 772** (-475 / -38.1%).
- Build: ✅ green (`tsc --noEmit` clean).

### Wave 4.2d · Pass #10 (2026-04-26)
**Scope**: 5 hooks across taxonomy, generic CRUD, task comments, rate seasons, portal chat.

- `src/hooks/useTaxonomyDefinitions.ts` — 5 → 0 `any`. Map callback typed via narrow `{ type_key }` cast; insert/update/soft-delete payloads use `as never` (instead of `as any`) to satisfy generated overloads.
- `src/hooks/useTaskComments.ts` — 4 → 0 `any`. Introduced local `TaskCommentRow` for raw DB row; dropped `(c: any)` callbacks; insert payload uses `as never`.
- `src/hooks/useSupabaseCRUD.ts` — 5 → 0 `any`. Generic dynamic-table helper: replaced 4× `.from(table as any)` with `.from(table as never)`; removed redundant `eslint-disable no-explicit-any` directives.
- `src/hooks/usePropertyRateSeasons.ts` — 4 → 0 `any`. `details`/`seasonal_pricing` now cast to `Json`; rate-season insert/update use `as never`.
- `src/hooks/usePortalChat.ts` — 4 → 0 `any`. Dropped 3× `(supabase as any)` and `(payload.new as any)` casts; insert/update payloads use `as never`; `portal_messages` is in generated types.

**Updated metrics**
- Global `any` count (canonical pattern, by line): **772 → 748** (-24).
- Cumulative since Wave 4.2d start: **1247 → 748** (-499 / -40.0%).
- Build: ✅ green (`tsc --noEmit` clean, `bun run build` OK).

### Wave 4.2d · Pass #11 (2026-04-26)
**Scope**: 6 hooks across property care, newbuilds, marketing campaigns, manager assignments, admin experiences, wizard payload builder.

- `src/hooks/usePropertyCare.ts` — 7 → 0 `any`. `(variables as any)?._silent` → typed `{ _silent?: boolean }`; `.update(data as any)` and `.insert({...} as any)` → `as never` for generated insert/update overloads.
- `src/hooks/useNewbuildProjects.ts` — 4 → 0 `any`. Imported `Database['public']['Tables']['property_projects']['Row']` as `ProjectRow`; mappers in list/single fetchers and `useNewbuildLocations` `forEach` typed via row inference; `payment_plan` narrowed (`Array.isArray ? as unknown[] : null`) for backward compat with `NewbuildProject`.
- `src/hooks/useCampaignFactory.ts` — 4 → 0 `any`. Introduced `CampaignRow` from generated `mcc_campaigns`; `transformCampaign(row: any)` → `(row: CampaignRow)`; budget/schedule/kpi/performance double-cast via `unknown` to satisfy structural overlap; insert/update calls switched to `as never`.
- `src/hooks/useAssignedProperties.ts` — 4 → 0 `any`. Introduced narrow `PropertyEmbed` and `AssignmentPermissions` interfaces; `assignment.properties as any` → `as PropertyEmbed | null`; permissions now built via per-key `??` fallback to satisfy required-fields contract.
- `src/hooks/useAdminExperiences.ts` — 4 → 0 `any`. `useSupabaseCRUD<any>` → typed `ListingRow`; `(raw: any)` map callback → narrow `Record<string, unknown>` aliases (`r`, `a`); `mapToListing(...) as any` → `as never`.
- `src/hooks/property-wizard/buildPayload.ts` — 4 → 0 `any`. `(cleanData as any).sale_intent / tenancy_modes` → IIFE with narrow `{ sale_intent?: unknown; tenancy_modes?: string[] }` cast; modes arithmetic now type-safe.
- Side fix: `src/components/newbuilds/NewbuildProjectDeepTabs.tsx` — `paymentPlan` prop cast to `ProjectMarketingTab` prop type to bridge `unknown[] → PaymentPlanStep[]`.
- Side fix: `src/hooks/useSupabaseCRUD.ts` — `insert/update` payloads (`Record<string, unknown>`) now `as never` to satisfy generated overload after table cast change in Pass #10.

**Updated metrics**
- Global `any` count (canonical pattern, by line): **748 → 721** (-27).
- Cumulative since Wave 4.2d start: **1247 → 721** (-526 / -42.2%).
- Build: ✅ green (`tsc --noEmit` clean, `bun run build` OK).
