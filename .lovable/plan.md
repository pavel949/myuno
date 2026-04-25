## Аудит записей: код → таблицы

Прошёлся по всем `.from('xxx').insert/upsert/update/delete` в `src/` и `supabase/functions/` (всего ~395 уникальных ссылок) и сверил с реальной схемой БД (435 публичных таблиц). Отфильтровал шум (тесты, JSDoc-примеры) и нашёл **19 настоящих несуществующих таблиц**, к которым код пытается писать или читать. Все они приведут к runtime-ошибке `relation "xxx" does not exist`.

### Результаты по группам

#### 🔴 P0 — Платный функционал ломается

| Таблица в коде | Где | Что должно быть | Эффект сейчас |
|---|---|---|---|
| `property_stays_subscriptions` | `stripe-webhook/index.ts` (3 места) | `stays_subscription` (ед. число) | Stripe-вебхук падает на upsert подписки → подписки PMS не активируются после оплаты |
| `manual_payment_proofs` | `OperationsManualPaymentsTab.tsx` (2 места) | `manual_payment_requests` | Админ-вкладка ручных платежей не отображает данные |
| `mc_finance_transactions` | `export-mc-data`, `scheduled-mc-backup` | Не существует — нужна замена на `property_financials` или `transactions` (требует уточнения) | Экспорт MC-данных и ночной бэкап молча возвращают пустой массив |

#### 🟡 P1 — AI-агенты и автоматизации не пишут историю

| Таблица в коде | Где | Что должно быть | Эффект |
|---|---|---|---|
| `ai_decisions_log` | `ai-content-planner`, `ai-owner-nurture`, `ai-platform-intelligence`, `publish-telegram-post` (5 мест) | Не существует — закроем `ai_agent_logs` или создадим новую | Агенты работают, но решения не логируются → нет аудита, нет аналитики |
| `social_content_calendar` | `ai-content-planner`, `auto-social-publish`, `publish-telegram-post` (4 места) | Не существует — нужна новая таблица | Контент-планер и авто-публикация в Telegram падают |
| `social_posts` | `ai-platform-intelligence`, `publish-telegram-post` | Не существует — нужна новая таблица | Метрики публикаций не сохраняются |
| `founder_daily_brief` | `ai-orchestrator/index.ts` | Существует только view `v_founder_inbox`; нужна таблица или upsert в подходящую существующую | Дашборд founder’а не получает свежие brief’ы |
| `owner_prospects` | `ai-owner-nurture` (8 мест) | Не существует — нужна таблица или замена на `vendor_prospects` | Нурчер собственников не работает |
| `crm_nurture_queue` | `send-nurture-messages` | Не существует — заменить на `outreach_messages` или `vendor_prospect_activity` | Cron-функция нурчинга не отправляет сообщений |
| `mcc_events` | `execute-campaign-rules` (3 места) | Не существует — `mcc_campaigns` / `mcc_landing_events` есть, нужно решить какое | Кампании MCC не триггерятся |
| `offer_history` | `ai-generate-offer` | Не существует | История AI-офферов не сохраняется |

#### 🟠 P2 — Frontend-страницы и второстепенные сервисы

| Таблица в коде | Где | Что должно быть | Эффект |
|---|---|---|---|
| `viewing_requests` | `InvestorWelcomeCard.tsx` | Не существует — заменить на `property_inquiries` | Welcome-карточка инвестора падает |
| `ai_task_suggestions` | `TopActionsWidget.tsx`, `ai-orchestrator`, `guest-referral-engine` | Не существует — нужна таблица или замена на `crm_tasks` | Виджет «Top actions» в дашборде MC пустой |
| `booking_conflicts` | `useChannelHealth.ts`, `ical-sync`, `ical-scheduled-sync` | Не существует — нужна таблица | iCal-конфликты не сохраняются (логи показывают, что cron работает, но конфликтов 0 — потому что таблица отсутствует, не потому что конфликтов нет) |
| `guest_referral_codes` | `guest-referral-engine` | Существует `referral_codes` | Реферальная программа гостей сломана |
| `property_guidebooks` | `ai-guest-autoreply` | Существует `property_guidebook` (ед.ч.) | AI-автоответ гостям не находит гайдбука |
| `document_reminders` | `document-reminder-check` | Не существует — нужна таблица | Cron напоминаний о документах падает |
| `email_subscriptions` | `UnderConstruction.tsx` | Не существует | «Maintenance mode» не сохраняет email-ы |
| `leads` | `peylaa-nurture` | Существует `nb_leads` (newbuilds) или `mcc_leads` — нужно уточнить | Peylaa-нурчер ничего не находит |

### План работ (в build-режиме, после approve)

1. **Простые ренеймы (5 мин)** — заменить имя таблицы, типы автогенерируются:
   - `property_stays_subscriptions` → `stays_subscription` (3 строки в `stripe-webhook`)
   - `manual_payment_proofs` → `manual_payment_requests` (2 строки)
   - `property_guidebooks` → `property_guidebook` (1 строка)
   - `guest_referral_codes` → `referral_codes` (2 строки + добавить `kind='guest'` если нужно)
   - `viewing_requests` → `property_inquiries` (1 строка, поправить поля в адаптере)

2. **Создать недостающие таблицы (миграция)** — для функций, которые имеют активный cron / webhook, но льют в пустоту:
   - `ai_decisions_log` (agent_slug, status, tokens_used, decision_type, payload jsonb, created_at) — общий аудит-лог AI решений
   - `social_content_calendar` (id, platform, scheduled_at, content jsonb, status, created_by)
   - `social_posts` (id, platform, status, external_id, posted_at, content)
   - `owner_prospects` (id, owner_user_id, source, status, last_touched_at, properties jsonb)
   - `ai_task_suggestions` (id, user_id, kind, title, payload jsonb, status, created_at)
   - `booking_conflicts` (id, calendar_id, property_id, source_event_id, conflict_type, raw jsonb, resolved_at)
   - `document_reminders` (id, document_id, user_id, fire_at, status)
   - `offer_history` (id, contact_id, offer_payload jsonb, generated_by, created_at)
   - `email_subscriptions` (id, email, source, created_at) — публичный insert с RLS

   Каждая — с RLS (admin-only, кроме `email_subscriptions`).

3. **Заменить ссылки на существующие** там, где замена очевидна:
   - `crm_nurture_queue` → `outreach_messages` (поправить колонки в `send-nurture-messages`)
   - `mcc_events` → `mcc_landing_events` (поправить колонки в `execute-campaign-rules`)
   - `leads` в `peylaa-nurture` → `nb_leads` или `mcc_leads` (нужно уточнить у вас, что Peylaa использует)
   - `mc_finance_transactions` → нет прямой замены; оставить пустой массив с warning или создать новую таблицу

4. **`founder_daily_brief`**: либо `INSERT INTO` материализованную таблицу (создать), либо переписать orchestrator на использование `v_founder_inbox`-source таблиц напрямую. Предлагаю создать настоящую таблицу `founder_daily_brief`.

5. **Verification**: после каждой группы — `tsc --noEmit`, прогон intake/stripe-webhook через `curl_edge_functions`, проверка `edge_function_logs`.

### Что НЕ трогаю

- Существующие таблицы с правильными именами, но потенциально сложными RLS-политиками (отдельный аудит, если нужно).
- 376 ссылок, где код и БД совпадают — они работают.
- Mock/example/test строки в комментариях и тестовых файлах (`abc`, `foo`, `mytable` и т.п.).

### Уточнения перед стартом

Нужно ваше «да» на:
- **`mc_finance_transactions`**: создать новую таблицу или забить (функции экспорта/бэкапа просто будут возвращать пусто)?
- **`leads` в peylaa-nurture**: это `nb_leads` или `mcc_leads`?
- **`founder_daily_brief`**: создать таблицу или переписать orchestrator на `v_founder_inbox`?

Если ответите «решай сам, делай оптимально» — пойду по дефолтам: создам таблицы для всего критичного, остальное — рефактор на существующие.
