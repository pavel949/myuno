# Архитектурный аудит myUNO: структура, surfaces, связи и «сироты»

Скан выполнен по коду (`src/`, `supabase/functions/`) и по живой базе. Ниже — фактическая карта платформы и найденные разрывы связей, затем план по их устранению.

## 1. Что есть сейчас (факты по скану)

**Слои приложения**
```text
App.tsx (провайдеры: Auth, Language, Currency, Location, Theme, Cart, Maps, ...)
└── AnimatedRoutes.tsx            453 route-декларации
    ├── routes/adminRoutes.tsx    100
    ├── routes/mcRoutes.tsx       105
    └── routes/propertyHubRoutes  42
Итого 551 декларация, 688 уникальных путей/токенов, 208 верхних сегментов
```

**Инвентарь**
- 574 страницы, 1029 компонентов, 436 хуков, 219 библиотечных модулей.
- `src/lib/appRegistry.ts` — 61 микро-приложение (58 `active`, 2 `pro`), все 61 имеют реально существующий маршрут (расхождений нет).
- `src/lib/config/routes.ts` — 333 константы `APP_ROUTES`.
- Surfaces: `src/lib/taxonomies/spine.ts` (Spine v2) выводит 6 surfaces (Arrive/Live/Manage/Invest/Legal/Build) из кластеров реестра; распределение кластеров: live 22, arrive 9, enjoy 8, family 6, legal 6, manage 6, invest 5, build 4.
- База: 412 таблиц в `public`, RLS включён у всех 412. Код обращается к 407 отношениям.

## 2. Найденные разрывы (главное)

**A. Код обращается к 23 отношениям, которых нет в базе.** Это «висящие» связи: запрос всегда падает или молча возвращает ошибку.
- Живые пути: `booking_payments` (stripe-webhook), `booking_vouchers` (generate-booking-voucher), `signatures` (useSignatureRequests, useStatementApprovals), `crm_web_form_submissions` (submit-web-form), `crm_oauth_states` (gmail-oauth-start/callback), `crm_nurture_queue` (send-nurture-messages), `thai_partner_leads` (thai-notify), `nb_projects` (magnet-submit), `offer_history` (ai-generate-offer), `airport_passengers` + `airport_booking_addons` (notify-fasttrack-booking), `owner_reports` (export-mc-data, scheduled-mc-backup), `manual_payment_proofs` (админ-вкладка ручных платежей), `lifeos_health_view` (useLifeOSGovernance), `v_outreach_campaigns_unified` и `v_outreach_messages_with_identity` (useOutreachMessages), `images` (WriteReviewModal — вероятно имелся в виду storage-бакет).
- Мёртвый архив: `leads`, `outreach_messages`, `user_analytics_daily`, `cohort_analytics`, `founder_daily_brief`, `mcc_campaign_rules` — только в `supabase/functions/_archive/`.

**B. 40 таблиц в базе не используются кодом вообще** (кандидаты на архивацию или на «недоделанную фичу»): `amenity_catalog`, `buyers`, `capital_campaigns`, `capital_contacts`, `capital_pipeline`, `capital_projects`, `city_areas`, `city_content`, `cleaning_services`, `clearview_categories`, `currencies`, `education_providers`, `ledger_accounts`, `life_scenarios`, `life_tasks`, `locations`, `products`, `reservations`, `salon_services`, `transfers`, `venues`, `tags`, `signature_request_signer_tokens` и др. Важно: среди них есть таблицы платёжного/финансового контура (`ledger_accounts`) и каталога — их нельзя удалять без разбора.

**C. 70 констант `APP_ROUTES` не используются нигде** (`START`, `TRIP_PLANNER`, `MC_*` (21 шт.), `CAPITAL_*`, `VENDOR_*`, `MARKET_*` и др.) — при этом 301 объявленный путь прописан строкой и не заведён в `APP_ROUTES`, что нарушает правило «zero-hardcoded routes».

**D. 18 компонентов-сирот** (нигде не импортируются), больше всего в `src/components/home/`: `HeroIntro`, `PrimaryGrid`, `PopularTasks`, `WhyChip`, `PersonaHalo`, `PersonaPromptBanner`, `AudienceEntries`, `AllSectionsAccordion`, `TrustFooter`, `RealEstateEntry`, `FloatingConcierge` — остатки Home V1/V2. Плюс `FloatingWhatsAppContact`, `NavChips`, `PaymentStageSelector`, `CommissionDisplay`, `StaffTaskCalendar`, 2 PWA-кнопки.

**E. 5 хуков и 5 модулей-сирот**: `useCategories`, `useCityScopedQuery`, `useProviderCatalogCounts`, `useProviderInputValidation`, `useSuperAppCatalog`; `lib/generateCalendarEvent`, `lib/emergency/index`, `lib/landings/personaCanonicalMap`, `lib/mcp/index`, `lib/taxonomies/personaBridge`.

## 3. Что предлагается сделать

**Шаг 1 — отчёт-артефакт.** Создать `docs/canonical/architecture/ARCHITECTURE_SCAN.md`: карта surfaces → кластеры → 61 приложение → маршруты, таблица разрывов A–E с точными путями файлов, и правила, как это держать чистым.

**Шаг 2 — автоматический детектор дрейфа.** Скрипт `scripts/architecture-scan.mjs` (read-only): считает маршруты, сверяет `APP_REGISTRY` ↔ `APP_ROUTES` ↔ реальные `<Route>`, находит сирот и обращения к неизвестным отношениям; печатает отчёт и падает при росте счётчиков относительно baseline-файла. Это делает аудит повторяемым, а не одноразовым.

**Шаг 3 — починить разрывы группы A (по приоритету денег и лидов).**
1. `booking_payments` в `stripe-webhook` и `booking_vouchers` в генерации ваучеров — платёжный контур.
2. `crm_web_form_submissions`, `crm_nurture_queue`, `thai_partner_leads`, `nb_projects` — приём и обработка лидов.
3. `signatures`, `manual_payment_proofs`, `owner_reports`, `airport_passengers`/`airport_booking_addons`, `offer_history`, `crm_oauth_states`, `lifeos_health_view`, два `v_outreach_*` view.
По каждому пункту сначала решается: переименовать запрос на существующую таблицу (например, `payment_intents`, `signature_requests`) или создать отсутствующую таблицу/представление миграцией с GRANT+RLS. Ничего не удаляется до подтверждения.

**Шаг 4 — почистить мёртвое.** Удалить `_archive`-обращения из скана, удалить компоненты/хуки-сироты после проверки, что они не нужны как задел, и завести неиспользуемые `APP_ROUTES` либо в маршруты, либо в удаление.

**Шаг 5 — таблицы группы B.** Разметить 40 таблиц на три категории (нужна фича / бэкенд-only / архив) и зафиксировать решение в отчёте; фактические миграции — отдельным шагом после согласования.

## 4. Рекомендация

Рекомендую: сначала Шаги 1–2 (отчёт + детектор дрейфа), затем Шаг 3 — потому что разрывы в `stripe-webhook`, ваучерах и приёме лидов бьют по деньгам прямо сейчас, а детектор гарантирует, что найденные 90+ расхождений не вернутся при следующих правках. Чистку сирот (Шаги 4–5) делать после — она безопасна, но не приносит выручки.

## 5. Технические детали

- Скан маршрутов учитывает и `path="literal"`, и `path={APP_ROUTES.X}`, и вложенные относительные пути — без этого дают ложные срабатывания.
- Дубли путей (`projects`, `team`, `contacts`, `contacts/:id`, `developers`, `companies`) находятся в разных родительских скоупах (`/mc`, `/admin`, `/capital`) и коллизией не являются.
- 407 отношений в коде извлекаются из `.from('...')` в `src/` и `supabase/functions/`; сверка с `pg_class` (`relkind in ('r','v')`) отделяет таблицы от 11 используемых представлений (`experiences`, `restaurants`, `yachts`, `vehicles`, `owner_properties`, `v_*`).
- Новые миграции в Шаге 3 обязаны следовать порядку CREATE TABLE → GRANT → ENABLE RLS → POLICY.
