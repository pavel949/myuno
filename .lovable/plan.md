
# Полный аудит CRM и Маркетингового центра MyUNO

---

## 1. CRM -- КОНТАКТЫ

| Вопрос | Статус | Комментарий |
|--------|--------|-------------|
| Поля контакта | **ЕСТЬ** | 25+ полей: `first_name`, `last_name`, `phone`, `phone2`, `email`, `whatsapp`, `telegram`, `line_id`, `nationality`, `language`, `source`, `contact_type`, `company_name`, `job_title`, `budget_min/max`, `currency`, `preferred_districts[]`, `preferred_types[]`, `bedrooms_min`, `notes`, `tags[]`, `avatar_url`, `birthday`, `family_info`, `interests[]`, `scoring`, `is_archived`, `lifecycle_stage`. Таблица: `crm_contacts`. Хук: `src/hooks/useCrmContacts.ts` |
| Кастомные поля | **ЕСТЬ** | Полноценная система: таблицы `crm_custom_fields` + `crm_custom_field_values` с поддержкой типов (text, number, date, select, multiselect, boolean). Привязка к `contact` или `deal`. Хук: `src/hooks/useCrmCustomFields.ts`. UI-рендер: `src/components/owner/contacts/CustomFieldRenderer.tsx` |
| Сегментация / теги / категории | **ЕСТЬ** | Теги: массив `tags[]` (VIP, hot, warm, cold, follow-up, priority). Типы контактов (`contact_type`): buyer, seller, investor, tenant, landlord, agent. Источники (`source`): website, referral, walk-in, social, agent_network, other. Lifecycle stage: отдельное поле `lifecycle_stage`. Lead scoring: поле `scoring` (числовое). Фильтрация по всем полям на сервере |
| Привязка к сделке / объекту / задаче | **ЕСТЬ** | Контакт связывается со сделками через `agent_deals.contact_id`. Задачи `crm_tasks` имеют `contact_id`, `deal_id`, `property_id`. Активности `crm_activities` ссылаются на `contact_id` и `deal_id`. Meetings `crm_meetings` также имеют `contact_id` и `deal_id` |

---

## 2. CRM -- ВОРОНКА / PIPELINE

| Вопрос | Статус | Комментарий |
|--------|--------|-------------|
| Pipeline / Kanban view | **ЕСТЬ** | Kanban-доска реализована на `src/pages/owner/SalesPipeline.tsx` и `src/pages/owner/CrmDashboardPage.tsx`. Drag-and-drop между этапами через `@dnd-kit` |
| Несколько воронок (Capital / Estate) | **ЕСТЬ** | Таблица `crm_pipelines` поддерживает множественные пайплайны на одну компанию. Поле `pipeline_type` (sale/rent/investment). Хук `useCrmPipelines` загружает все активные пайплайны компании. Настройка этапов: `src/pages/owner/PipelineSettingsPage.tsx` |
| Этапы по умолчанию | **ЕСТЬ** | 7 этапов при создании: New (10%) -> Contacted (20%) -> Showing (40%) -> Negotiation (60%) -> Contract (80%) -> Won (100%) -> Lost (0%). Каждый этап имеет `probability`, `color`, `is_won`, `is_lost`, `sort_order`. Кастомизация через `crm_pipeline_stages` |
| Автотриггеры при смене этапа | **ЕСТЬ** | Edge Function `execute-crm-workflow` обрабатывает триггеры. Таблица `crm_workflows` хранит правила (trigger_type: deal_stage_change, contact_created, и др.). Actions: update_field, create_task, send_email, send_notification. Хук: `src/hooks/useCrmWorkflows.ts` |

---

## 3. CRM -- ЗАДАЧИ И НАПОМИНАНИЯ

| Вопрос | Статус | Комментарий |
|--------|--------|-------------|
| Задачи на контакт / сделку | **ЕСТЬ** | Таблица `crm_tasks` с полями `contact_id`, `deal_id`, `property_id`. Дополнительно: `deal_scheduled_activities` (Odoo-стиль) с типами: call, meeting, showing, email, whatsapp, task, deadline. UI: `src/components/owner/tasks/UnifiedTaskHub.tsx` |
| Напоминания по дате | **ЕСТЬ** | Поле `reminder_at` (timestamp) в `crm_tasks`. Поля `due_date` + `due_time` в `deal_scheduled_activities`. Хук `useTaskNotifications` обрабатывает уведомления. Фильтр `due_today` на стороне сервера |
| Назначение на сотрудников | **ЕСТЬ** | Поле `assigned_to` (UUID) в обеих таблицах. Привязка к `management_company_members`. UI позволяет выбрать члена команды при создании задачи |

---

## 4. МАРКЕТИНГОВЫЙ ЦЕНТР

| Вопрос | Статус | Комментарий |
|--------|--------|-------------|
| Каналы: email / WhatsApp / SMS / push | **ЧАСТИЧНО** | **Email**: полноценно (edge function `send-crm-email` через Resend API). **In-app notifications**: да (через `send-promotions`). **WhatsApp**: шаблоны в sequences, но отправка через внешний API (edge function `notify-lead-whatsapp`). **SMS**: НЕТ. **Push**: НЕТ (только in-app). **Telegram**: публикация постов (`publish-telegram-post`), но не рассылки |
| Конструктор email-рассылок | **ЧАСТИЧНО** | Таблица `crm_emails` хранит `subject`, `body_html`, `body_text`. Форма создания на `src/pages/owner/CrmEmailsPage.tsx` -- ввод HTML вручную. Визуальный drag-and-drop конструктор: НЕТ. Broadcast-панель (`MCCBroadcastPanel`) позволяет отправлять сегментированные рассылки с текстом RU/EN |
| Автоматические последовательности | **ЕСТЬ** | Полноценная система sequences: `crm_sequences` + `crm_sequence_steps` + `crm_sequence_enrollments`. Типы шагов: task, wait, email, whatsapp. Delay в днях. Enrollment контактов с отслеживанием прогресса. Хук: `src/hooks/useCrmSequences.ts`. UI: `src/pages/owner/CrmSequencesPage.tsx` |
| Сегментация аудитории | **ЕСТЬ** | `MCCBroadcastPanel` поддерживает 10 сегментов: All, Active, At Risk, Dormant, Churned, New, VIP, High/Mid/Low LTV. Таблица `user_segments` хранит `lifecycle_stage`, `value_segment`, `is_vip`. Edge function `update-user-segments` пересчитывает сегменты |
| Аналитика рассылок (open rate, click rate) | **ЧАСТИЧНО** | Таблица `mcc_channel_metrics` хранит `impressions`, `clicks`, `conversions`, `spend`, `revenue`, `ctr`, `cvr`, `cac`, `roas` по кампаниям и каналам. Для email: статус отслеживается (draft/sent/failed) в `crm_emails.status`. **Open rate / click rate по email**: НЕТ -- нет пиксель-трекинга |

---

## 5. АНАЛИТИКА И ОТЧЁТЫ

| Вопрос | Статус | Комментарий |
|--------|--------|-------------|
| Встроенные отчёты | **ЕСТЬ** | (1) Sales forecast по pipeline с вероятностями (`useSalesForecast`); (2) KPI-метрики дашборда (`useDashboardMetrics`): сделки, доход, задачи, бронирования; (3) Конверсионная воронка (`useAdminCrmStats`); (4) Channel metrics аналитика (`useMCCAnalytics`); (5) Day briefing с ежедневной сводкой; (6) Financial reports с экспортом в Excel/PDF |
| Кастомные отчёты | **ЧАСТИЧНО** | Pivot-таблица для финансов (`ReportsPage`). Фильтры по периоду и свойствам. Но произвольный SQL-конструктор или report builder: НЕТ |
| Дашборд с KPI | **ЕСТЬ** | CRM Dashboard (`CrmDashboardPage`): Kanban + метрики. MCC Overview (`MCCOverviewTab`): воронка, KPI кампаний. Task KPIs (`TaskSummaryKPIs`). Revenue Dashboard (`OwnerRevenueDashboard`). Все на Recharts |

---

## 6. ИНТЕГРАЦИИ

| Вопрос | Статус | Комментарий |
|--------|--------|-------------|
| WhatsApp Business | **ЧАСТИЧНО** | Edge function `notify-lead-whatsapp` отправляет сообщения. Поле `whatsapp` в контактах. Шаблоны в sequences. Но нет полной интеграции с WhatsApp Business API (входящие сообщения не обрабатываются) |
| Telegram | **ЕСТЬ** | Публикация постов в каналы через `publish-telegram-post`. Поле `telegram` в контактах. Контент-планировщик `ai-content-planner` |
| Email | **ЕСТЬ** | Отправка через Resend API (`send-crm-email`, `send-email`). CRM emails с историей. Broadcast рассылки |
| Payment systems | **ЕСТЬ** | Stripe: `create-checkout-session`, `create-order-checkout`, `create-vendor-subscription`, `stripe-webhook`. Полный цикл платежей и подписок |
| API / Webhook | **ЧАСТИЧНО** | Edge Functions доступны по URL. Web forms (`crm_web_forms` + `submit-web-form`) принимают внешние заявки. Stripe webhook. Но публичного REST API / документации: НЕТ |
| Календарь | **ЕСТЬ** | iCal sync (`ical-sync`, `calendar-export`). Airbnb calendar sync (`airbnb-sync`). Встроенный календарь бронирований (`UnifiedPropertyCalendar`). CRM Meetings (`crm_meetings`) с привязкой к контактам/сделкам |

---

## 7. ОБЩЕЕ

| Вопрос | Статус | Комментарий |
|--------|--------|-------------|
| Язык интерфейса | **ЕСТЬ** | 3 языка: RU, EN, TH. Переключение через `LanguageContext`. Все лейблы в `src/i18n/`. БД-поля с суффиксами `_en`, `_ru` |
| Мобильное приложение | **ЧАСТИЧНО** | Capacitor настроен (`@capacitor/android`, `@capacitor/ios`). PWA через `vite-plugin-pwa`. Адаптивный мобильный UI с bottom nav. Но нативного приложения в сторах: нет данных о публикации |
| Количество пользователей | **ЕСТЬ** | Без ограничений на уровне приложения. Multi-tenant: каждая MC имеет свою команду через `management_company_members`. Приглашение через `invite-team-member` |
| Разграничение прав | **ЕСТЬ** | Многоуровневая RBAC: (1) Platform roles: admin, uno_team, user через `user_roles`; (2) MC roles: director, admin, manager, accountant, staff; (3) Module permissions: `team_member_permissions` (CRM, Finance, Bookings и др.) с `can_view`, `can_edit`, `can_export`; (4) RLS через `mc_can_access()` helper; (5) Маскирование данных для рядовых сотрудников |

---

## СВОДНАЯ ТАБЛИЦА

| Раздел | Полный функционал | Частично | Отсутствует |
|--------|:-:|:-:|:-:|
| Контакты | 4/4 | 0 | 0 |
| Pipeline | 4/4 | 0 | 0 |
| Задачи | 3/3 | 0 | 0 |
| Маркетинг | 2/5 | 3 (каналы, email-конструктор, аналитика) | 0 |
| Аналитика | 2/3 | 1 (кастомные отчёты) | 0 |
| Интеграции | 3/6 | 3 (WhatsApp, API, мобильное) | 0 |
| Общее | 3/4 | 1 (мобильное) | 0 |

**Итого: 21 из 29 пунктов полностью реализованы, 8 частично, 0 отсутствуют.**

---

## КЛЮЧЕВЫЕ GAPS ДЛЯ УЛУЧШЕНИЯ

1. **Визуальный email-конструктор** -- сейчас только HTML-ввод, нет drag-and-drop builder
2. **Email-трекинг** -- нет open rate / click rate (нет tracking pixel / link wrapping)
3. **SMS-канал** -- полностью отсутствует
4. **Push-уведомления** -- только in-app, нет Web Push / Firebase
5. **WhatsApp входящие** -- только исходящие, нет обработки входящих через Business API
6. **Report builder** -- нет конструктора произвольных отчётов
7. **Публичный API** -- нет документированного REST API для внешних интеграций
