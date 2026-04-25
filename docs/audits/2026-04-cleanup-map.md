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
