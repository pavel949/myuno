


# Система оплаты объектов для Управляющих Компаний (Pay-per-Property)

## Концепция

Управляющая компания (УК) может добавить неограниченное количество объектов, но функции PMS (календарь, бронирования, финансы, задачи) доступны только для **оплаченных слотов**. Цена — **$25/мес за активный объект**. Неоплаченные объекты отображаются в списке с пометкой "Inactive" и предложением активировать.

## Архитектура

```text
+------------------------------+
|   management_companies       |
|   + paid_slots (int)         |  <-- сколько оплачено
|   + stripe_customer_id       |
|   + stripe_subscription_id   |
+------------------------------+
              |
              v
+------------------------------+
|   mc_property_slots          |  <-- какие объекты активны
|   company_id  |  property_id |
|   activated_at | is_active   |
+------------------------------+
              |
              v
+------------------------------+
|   properties                 |
|   (все объекты УК)           |
+------------------------------+
```

## Статус: ✅ РЕАЛИЗОВАНО

Все компоненты Pay-per-Property реализованы:
- Migration выполнена
- Edge Functions развёрнуты
- Frontend хук и UI готовы
- Stripe интеграция настроена (Price: price_1T5gU5CHg9N6Yle1cghVJcy9)

---

# MyUNO CRM — План развития до уровня HubSpot/Odoo

## Текущее состояние

| Модуль | Статус | Компоненты |
|--------|--------|------------|
| Контакты | ✅ | CRUD, импорт/экспорт CSV, теги, поиск, Document Vault (15+ типов), таймлайн, WhatsApp/Telegram quick-actions |
| Сделки/Pipeline | ✅ | Kanban, стадии, приоритет, теги, привязка к объектам/контактам, bulk actions, property matching |
| Задачи | ✅ | Unified Hub (CRM + Ops), 16 типов, комментарии, фото-подтверждения, авто-создание при бронировании |
| Маркетинг | ⚠️ | Listing health, boost, views analytics, реферальная система, campaign rules engine |
| Аудит-лог | ✅ | Field-level audit trail на контактах |
| Финансы | ✅ | Двойная бухгалтерия, P&L, инвойсы, сезонное ценообразование |

---

## Фаза 1: CRM Core (P0)

### 1.1 Множественные воронки (Multiple Pipelines)

**Обоснование:** HubSpot и Odoo поддерживают неограниченное количество воронок. В недвижимости критически важно разделять аренду, продажу и инвестиции — у каждого процесса свои стадии и метрики.

**Изменения в БД:**
```sql
CREATE TABLE crm_pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES management_companies(id),
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  pipeline_type TEXT NOT NULL DEFAULT 'custom',
  is_default BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE crm_pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES crm_pipelines(id) ON DELETE CASCADE,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  probability INT DEFAULT 0 CHECK (probability BETWEEN 0 AND 100),
  color TEXT,
  sort_order INT DEFAULT 0,
  is_won BOOLEAN DEFAULT false,
  is_lost BOOLEAN DEFAULT false
);

ALTER TABLE agent_deals ADD COLUMN pipeline_id UUID REFERENCES crm_pipelines(id);
```

**Миграция данных:** Создать default pipeline "Sales" с текущими стадиями, привязать все существующие сделки.

**UI:**
- Переключатель воронок над Kanban
- Настройка воронок в Settings (CRUD стадий, вероятности)

**Файлы:**
- `src/hooks/useCrmPipelines.ts`
- `src/components/owner/sales/PipelineSwitcher.tsx`
- `src/pages/owner/CrmPipelineSettings.tsx`
- Обновить: `KanbanBoard.tsx`, `CreateDealSheet.tsx`, `EditDealSheet.tsx`

---

### 1.2 Lifecycle Stages контактов

**Обоснование:** HubSpot использует lifecycle stages для сегментации воронки маркетинг→продажи. Без этого невозможно строить отчёты по конверсии.

**Изменения в БД:**
```sql
ALTER TABLE crm_contacts ADD COLUMN lifecycle_stage TEXT DEFAULT 'subscriber';
-- subscriber, lead, mql, sql, opportunity, customer, evangelist, other
```

**Автоматика:**
- Создание сделки → `opportunity`
- Закрытие сделки (won) → `customer`
- Ручное изменение всегда доступно

**UI:**
- Визуальный прогресс-бар в профиле контакта
- Фильтр по lifecycle stage в списке
- Batch-update через bulk actions

**Файлы:**
- `src/components/owner/contacts/LifecycleStageBar.tsx`
- `src/components/owner/contacts/LifecycleStageFilter.tsx`

---

### 1.3 Custom Fields (Настраиваемые поля)

**Обоснование:** В HubSpot любой объект расширяем кастомными полями. Для УК важно хранить nationality, visa status, preferred area, investment horizon.

**Изменения в БД:**
```sql
CREATE TABLE crm_custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES management_companies(id),
  entity_type TEXT NOT NULL, -- 'contact', 'deal'
  field_key TEXT NOT NULL,
  label_en TEXT NOT NULL,
  label_ru TEXT NOT NULL,
  field_type TEXT NOT NULL, -- text, number, date, select, multiselect, boolean, url, phone, email
  options JSONB,
  is_required BOOLEAN DEFAULT false,
  is_filterable BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, entity_type, field_key)
);

CREATE TABLE crm_custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL REFERENCES crm_custom_fields(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(field_id, entity_id)
);
```

**UI:**
- Секция "Custom Fields" в профиле контакта/сделки
- Inline-editing
- Настройка: `/owner/settings/custom-fields`

**Файлы:**
- `src/hooks/useCrmCustomFields.ts`
- `src/components/owner/contacts/CustomFieldsSection.tsx`
- `src/components/owner/contacts/CustomFieldRenderer.tsx`
- `src/pages/owner/CrmCustomFieldsSettings.tsx`

---

### 1.4 Lead Scoring

**Обоснование:** HubSpot и Odoo оценивают лидов автоматически. Клиент с бюджетом $500K и активностью за 3 дня важнее холодного лида.

**Изменения в БД:**
```sql
ALTER TABLE crm_contacts ADD COLUMN lead_score INT DEFAULT 0;
ALTER TABLE crm_contacts ADD COLUMN lead_temperature TEXT DEFAULT 'cold';

CREATE TABLE crm_scoring_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES management_companies(id),
  rule_name TEXT NOT NULL,
  condition_type TEXT NOT NULL,
  condition_config JSONB NOT NULL,
  points INT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0
);

CREATE TABLE crm_score_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES crm_scoring_rules(id),
  points INT NOT NULL,
  reason TEXT NOT NULL,
  scored_at TIMESTAMPTZ DEFAULT now()
);
```

**Правила по умолчанию:**
| Правило | Баллы |
|---------|-------|
| Email заполнен | +5 |
| Телефон заполнен | +5 |
| Есть активная сделка | +20 |
| Сумма сделки > $100K | +15 |
| Активность за 7 дней | +10 |
| Загружен документ | +5 |
| Нет активности 30+ дней | -10 |

**Температура:** 0-30 Cold 🔵 | 31-60 Warm 🟡 | 61+ Hot 🔴

**Edge Function:** `recalculate-lead-scores`

**Файлы:**
- `src/hooks/useCrmLeadScoring.ts`
- `src/components/owner/contacts/LeadScoreBadge.tsx`
- `src/components/owner/contacts/ScoreBreakdown.tsx`
- `src/pages/owner/CrmScoringSettings.tsx`
- `supabase/functions/recalculate-lead-scores/index.ts`

---

### 1.5 Sales Forecasting

**Обоснование:** Weighted forecast = Σ(deal_value × probability). Ключевой бизнес-инструмент для УК.

**UI:**
- Карточки: Weighted Forecast | Best Case | Committed | Closed
- Bar chart: прогноз vs факт по месяцам
- Разбивка по агентам и воронкам

**Файлы:**
- `src/hooks/useSalesForecast.ts`
- `src/components/owner/sales/ForecastDashboard.tsx`
- `src/components/owner/sales/ForecastChart.tsx`

---

### 1.6 Sequences (Цепочки действий)

**Обоснование:** HubSpot Sequences — одна из самых используемых фич. Агент создаёт последовательность действий, система автоматически создаёт задачи.

**Изменения в БД:**
```sql
CREATE TABLE crm_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES management_companies(id),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE crm_sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES crm_sequences(id) ON DELETE CASCADE,
  step_order INT NOT NULL,
  action_type TEXT NOT NULL, -- task, wait, email, whatsapp
  delay_days INT DEFAULT 0,
  task_type TEXT,
  task_title TEXT,
  template_content TEXT,
  sort_order INT DEFAULT 0
);

CREATE TABLE crm_sequence_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES crm_sequences(id),
  contact_id UUID NOT NULL REFERENCES crm_contacts(id),
  deal_id UUID REFERENCES agent_deals(id),
  current_step INT DEFAULT 0,
  status TEXT DEFAULT 'active',
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  enrolled_by UUID NOT NULL,
  next_action_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
```

**Edge Function:** `execute-crm-sequences` — cron каждый час

**Файлы:**
- `src/hooks/useCrmSequences.ts`
- `src/pages/owner/CrmSequencesPage.tsx`
- `src/components/owner/sequences/SequenceBuilder.tsx`
- `supabase/functions/execute-crm-sequences/index.ts`

---

## Фаза 2: Productivity Tools (P1)

### 2.1 Расширенный Activity Timeline

**Изменения в БД:**
```sql
CREATE TABLE crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES management_companies(id),
  contact_id UUID REFERENCES crm_contacts(id),
  deal_id UUID REFERENCES agent_deals(id),
  activity_type TEXT NOT NULL,
  subject TEXT,
  description TEXT,
  duration_minutes INT,
  outcome TEXT,
  metadata JSONB,
  logged_by UUID NOT NULL,
  activity_date TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Файлы:**
- `src/hooks/useCrmActivities.ts`
- `src/components/owner/contacts/ActivityTimeline.tsx`
- `src/components/owner/contacts/LogActivityDialog.tsx`

### 2.2 Weighted Pipeline Display

Обновить `KanbanBoard.tsx` — footer с weighted totals, probability indicators.

### 2.3 CRM Dashboard

10 виджетов: Pipeline Value, Win Rate, Forecast, Activity Feed, Lead Distribution, Funnel, Leaderboard, Overdue Tasks, Revenue Trend, Sequence Performance.

**Файлы:**
- `src/pages/owner/CrmDashboardPage.tsx`
- `src/components/owner/crm-dashboard/` — папка виджетов

### 2.4 Quotations / Proposals

**Изменения в БД:**
```sql
CREATE TABLE crm_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES management_companies(id),
  deal_id UUID REFERENCES agent_deals(id),
  contact_id UUID NOT NULL REFERENCES crm_contacts(id),
  quote_number TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  title TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(12,2),
  tax_percent NUMERIC(5,2) DEFAULT 0,
  total NUMERIC(12,2),
  currency TEXT DEFAULT 'THB',
  valid_until DATE,
  notes TEXT,
  pdf_url TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 2.5 Email Integration

```sql
CREATE TABLE crm_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES management_companies(id),
  contact_id UUID NOT NULL REFERENCES crm_contacts(id),
  deal_id UUID REFERENCES agent_deals(id),
  direction TEXT NOT NULL DEFAULT 'outbound',
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT,
  status TEXT DEFAULT 'draft',
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  sent_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Edge Function:** `send-crm-email` (Resend API)

### 2.6 Workflow Automation Builder

```sql
CREATE TABLE crm_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES management_companies(id),
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  trigger_config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE crm_workflow_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES crm_workflows(id) ON DELETE CASCADE,
  action_order INT NOT NULL,
  action_type TEXT NOT NULL,
  action_config JSONB NOT NULL,
  delay_minutes INT DEFAULT 0
);
```

### 2.7 Meeting Scheduler

```sql
CREATE TABLE crm_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES management_companies(id),
  contact_id UUID REFERENCES crm_contacts(id),
  deal_id UUID REFERENCES agent_deals(id),
  host_user_id UUID NOT NULL,
  title TEXT NOT NULL,
  meeting_type TEXT DEFAULT 'general',
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT DEFAULT 30,
  location TEXT,
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Фаза 3: Intelligence & Growth (P2)

### 3.1 AI CRM Assistant
- Next Best Action, Generate Email, Summarize Contact, Deal Risk Alert
- Edge Function: `crm-ai-assistant` (Lovable AI — gemini-2.5-flash)

### 3.2 Communication Templates
```sql
CREATE TABLE crm_comm_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES management_companies(id),
  channel TEXT NOT NULL,
  name TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  merge_tags TEXT[],
  language TEXT DEFAULT 'en',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.3 Duplicate Detection & Merge
- Edge Function: `detect-crm-duplicates` (fuzzy match)

### 3.4 Web Lead Forms
```sql
CREATE TABLE crm_web_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES management_companies(id),
  name TEXT NOT NULL,
  fields_config JSONB NOT NULL,
  pipeline_id UUID REFERENCES crm_pipelines(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.5 Round Robin / Auto-Assignment
```sql
CREATE TABLE crm_assignment_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES management_companies(id),
  pipeline_id UUID REFERENCES crm_pipelines(id),
  rule_type TEXT NOT NULL,
  assignees UUID[] NOT NULL,
  last_assigned_index INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);
```

---

## Навигация CRM (обновлённая)

```
CRM & Sales:
├── Dashboard          — /owner/crm-dashboard
├── Contacts           — /owner/contacts
├── Deals              — /owner/deals
├── Sequences          — /owner/sequences
├── Automations        — /owner/automations
├── Quotes             — /owner/quotes
├── Meetings           — /owner/meetings
├── Forms              — /owner/forms
└── Settings
    ├── Pipelines      — /owner/settings/pipelines
    ├── Custom Fields  — /owner/settings/custom-fields
    ├── Lead Scoring   — /owner/settings/scoring
    ├── Templates      — /owner/settings/templates
    └── Assignment     — /owner/settings/assignment
```

## Порядок реализации

| Шаг | Задача | Оценка |
|-----|--------|--------|
| 1 | Multiple Pipelines + Stages | 1 сессия |
| 2 | Lifecycle Stages | 0.5 сессии |
| 3 | Custom Fields | 1 сессия |
| 4 | Lead Scoring | 1 сессия |
| 5 | Weighted Pipeline + Forecast | 1 сессия |
| 6 | Activity Timeline | 1 сессия |
| 7 | Sequences | 1.5 сессии |
| 8 | CRM Dashboard | 1 сессия |
| 9 | Quotations | 1 сессия |
| 10 | Email Integration | 1 сессия |
| 11 | Workflow Builder | 1.5 сессии |
| 12 | Meeting Scheduler | 1 сессия |
| 13 | AI Assistant | 1 сессия |
| 14 | Templates | 0.5 сессии |
| 15 | Duplicate Detection | 1 сессия |
| 16 | Web Forms | 1 сессия |
| 17 | Round Robin | 0.5 сессии |
