

# Глубокий аудит CRM системы MC — Результаты и план доработок

## Текущее состояние: что уже есть

### Сильные стороны
- **Контакты** (crm_contacts): 50+ полей, теги, lifecycle stage, scoring, lead temperature, contact types, multiple pipelines
- **Сделки** (agent_deals): 4 типа (sale/rent/investment/management), 7 стадий, VIP-флаг, приоритет, теги, привязка к контакту и объекту
- **Динамические воронки** (crm_pipelines + crm_pipeline_stages): настраиваемые стадии, вероятности, цвета, множественные пайплайны
- **Активности** (crm_activities): 15 типов (call, email, meeting, WhatsApp, showing, quote, etc.)
- **Задачи** (crm_tasks): привязка к контакту/сделке/объекту, assignee, due date, reminders
- **Аналитика** (SalesAnalytics): воронка, конверсия по стадиям, pie charts по источникам, leaderboard агентов
- **Автоматизация** (crm_workflows): trigger-based (deal_created, stage_changed, won/lost, contact_created)
- **Последовательности** (crm_sequences): multi-step drip с enrollment tracking
- **КП** (crm_quotes): items, tax, currency, PDF
- **Кастомные поля** (crm_custom_fields): per-entity расширения
- **Шаблоны, email, meetings, web-forms, documents** — всё есть
- **Настройки** (PipelineSettingsPage): contact_type, lead_source, deal_type, task_type, lost_reason, win_reason — полностью кастомизируемые
- **Co-agent комиссии** (usePayoutRules): coagent/staff/partner/broker split

### Capital CRM (отдельный модуль /capital)
- Отдельная UI: dashboard, contacts, projects, campaigns, outreach, pipeline, templates
- Но: **таблицы capital_* НЕ существуют в production DB** — модуль неработоспособен

---

## Выявленные проблемы

### A. Критические баги (Schema Drift)

| # | Проблема | Влияние |
|---|----------|---------|
| A1 | `agent_deals` не имеет колонок `won_reason`, `property_project_id` в DB, но код (TypeScript) их использует | Данные не сохраняются, молчаливо теряются |
| A2 | `crm_contacts` не имеет `crm_roles`, `key_dates` в DB | Ролевой маппинг контактов не работает |
| A3 | Capital module (`/capital/*`) ссылается на 6 таблиц, которых нет в DB | Весь модуль Capital нерабочий |

### B. Функциональные пробелы (для вашего бизнес-кейса)

| # | Отсутствует | Что нужно |
|---|-------------|-----------|
| B1 | **Нет deal_type для клубных/оптовых сделок** | Добавить: `club_deal`, `bulk_purchase`, `resale`, `long_term_rent`, `short_term_rent` |
| B2 | **Аренда не разделена** на краткосрочную/долгосрочную | Сейчас один тип `rent` — нужны два с разными pipeline stages |
| B3 | **Нет привязки сделки к off-plan проекту** в DB | `property_project_id` есть в TypeScript, но не в DB |
| B4 | **Нет кампаний продаж off-plan** | Нужна связь deal → campaign для трекинга целевых продаж проектов |
| B5 | **Нет co-agent tracking на уровне сделки** | Payout rules привязаны к property, не к deal |
| B6 | **Нет client preference tracking** | Предпочтения по district/type есть в deal, но нет истории просмотров и реакций |
| B7 | **Capital CRM полностью отключен** | Таблицы не созданы |

### C. UX проблемы

| # | Проблема |
|---|----------|
| C1 | CRM Dashboard и SalesPipeline — два отдельных экрана с дублирующимися данными и фильтрами |
| C2 | Нет единого timeline/activity feed по контакту (задачи, активности, сделки, показы — разрозненно) |
| C3 | Нет быстрого action bar: "Позвонил → Назначил показ → Отправил КП" в 1 клик |
| C4 | Pivot table и Analytics на разных страницах — нет drill-down из KPI в список сделок |
| C5 | Нет dashboard виджета "Мой день" — overdue tasks, today's tasks, follow-ups |

### D. Автоматизация

| # | Проблема |
|---|----------|
| D1 | Workflows определены, но **нет execution engine** — триггеры пишутся в DB, но не выполняются |
| D2 | Sequences enrollment есть, но **нет cron для продвижения шагов** |
| D3 | Нет автоматического создания задач при смене стадии |
| D4 | Нет автоматических напоминаний о follow-up |

---

## План реализации (приоритизированный)

### Фаза 1 — Schema Fixes (критично)

**1.1 Добавить недостающие колонки в `agent_deals`:**
- `won_reason TEXT`
- `property_project_id UUID REFERENCES property_projects(id)`

**1.2 Добавить недостающие колонки в `crm_contacts`:**
- `crm_roles TEXT[] DEFAULT '{}'`
- `key_dates JSONB DEFAULT '[]'`

**1.3 Расширить `deal_type` enum в коде:**
```
sale | rent_short | rent_long | investment | management | club_deal | resale
```
(DB уже хранит как text, поэтому только код)

### Фаза 2 — Deal Model Enhancement

**2.1 Добавить в `agent_deals`:**
- `co_agent_id UUID` — со-агент по сделке
- `co_agent_commission_pct NUMERIC` — его процент
- `campaign_id UUID` — привязка к MCC кампании
- `service_line TEXT` — для фильтрации по линии бизнеса
- `expected_close_date DATE` — прогноз закрытия
- `deal_source_detail TEXT` — детализация источника (конкретная выставка, конкретный объект)

**2.2 Создать таблицу `deal_participants`:**
- Для клубных сделок — множественные покупатели/инвесторы на одну сделку

**2.3 Создать таблицу `deal_viewings`:**
- property_id, deal_id, contact_id, viewing_date, feedback, rating
- Для трекинга предпочтений клиента

### Фаза 3 — Pipeline Customization

**3.1 Предустановленные pipelines по service lines:**
- Off-plan Sales: Lead → Qualified → Reservation → Contract → Transfer → Won
- Resale: Lead → Viewing → Offer → Negotiation → Contract → Won
- Short-term Rent: Inquiry → Dates Check → Confirmed → Check-in → Won
- Long-term Rent: Lead → Viewing → Application → Contract → Move-in → Won
- Club Deal: Lead → Qualification → Commitment → Funding → Acquisition → Won
- Investment: Lead → Presentation → Due Diligence → Term Sheet → Funding → Won

### Фаза 4 — UX Improvements

**4.1 Объединить CRM Dashboard:**
- "Мой день" виджет: overdue + today tasks + follow-ups
- Quick actions: Позвонил / Показ назначен / КП отправлено
- Drill-down KPI → отфильтрованный список

**4.2 Unified Contact Timeline:**
- Единый feed: activities + tasks + deals + notes + documents — хронологически

**4.3 Client Preference Dashboard:**
- Автоматическое отображение паттернов: "Клиент смотрел 5 вилл в Rawai, бюджет 8-12M THB"

### Фаза 5 — Capital Module (создать таблицы)

**5.1 Миграция для 6 capital_* таблиц:**
- `capital_contacts`, `capital_projects`, `capital_pipeline`, `capital_campaigns`, `capital_outreach`, `capital_templates`
- С RLS по user_id

### Фаза 6 — Automation Engine

**6.1 Workflow Execution:**
- Edge Function `crm-workflow-executor` по cron (каждые 5 мин)
- Обрабатывает pending triggers → выполняет actions (create task, send email, change stage)

**6.2 Sequence Advancement:**
- Edge Function `crm-sequence-runner` по cron
- Проверяет enrollments с `next_action_at <= now()` → выполняет шаг

**6.3 Auto-task на stage change:**
- DB trigger на `agent_deals.stage` → создаёт задачи из playbook (`crmTaskPlaybooks.ts`)

---

## Итоговая оценка

| Аспект | Оценка | Комментарий |
|--------|--------|-------------|
| **Техническая база** | 7/10 | Архитектура solid, но schema drift критичен |
| **Функциональность** | 6/10 | Хорошо для простых sale/rent, недостаточно для club deals и multi-line |
| **Бизнес-fit** | 5/10 | Нет разделения аренды, нет co-agent на сделке, Capital нерабочий |
| **UX** | 6/10 | Все элементы есть, но разрозненны, нет фокуса "мой день" |
| **Автоматизация** | 3/10 | Инфраструктура есть (tables), но execution engine отсутствует |

## Файлы для изменения

**Миграции:** 3 SQL миграции (schema fixes, new tables, pipeline presets)
**Код:**
- `src/hooks/useAgentDeals.ts` — расширить DEAL_TYPES
- `src/lib/crmTaskPlaybooks.ts` — playbooks для новых deal types
- `src/components/owner/sales/CreateDealSheet.tsx` — co-agent field, campaign link
- `src/pages/owner/CrmDashboardPage.tsx` — "Мой день" виджет, unified KPIs
- `src/pages/owner/ContactDetail.tsx` — unified timeline
- Новые: `deal_viewings` hook, `deal_participants` hook

