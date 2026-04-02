

# Аудит и стратегический редизайн: два CRM, дублирование, AI-автоматизация

## 1. Результаты аудита дублирования

### Две CRM — что есть сейчас

| | Admin CRM (`/admin/crm`) | MC CRM (`/mc/contacts`, `/mc/sales`, `/mc/crm-dashboard`) |
|---|---|---|
| **Таблицы** | `vendor_prospects`, `mcc_leads` — свои таблицы | `crm_contacts`, `agent_deals`, `crm_tasks` — полноценные |
| **Фокус** | Привлечение вендоров и пользователей на платформу | Управление собственниками, сделками, B2B/B2C клиентами |
| **Функционал** | Pipeline вендоров, leads-таблица, outreach, activity log | Contacts + deals + tasks + sequences + quotes + scoring + AI assistant |
| **Зрелость** | Базовая — 4 компонента | Полная — 20+ компонентов, импорт, Odoo, дубликаты |

**Вывод**: Admin CRM — это **acquisition tool** (привлечение поставщиков). MC CRM — это **operational CRM** (ведение клиентов). Это разные инструменты, но вы как владелец платформы вынуждены работать в двух местах.

### Обнаруженные дубликаты маршрутов и навигации

1. **Calendar Sync дублирование** — `/mc/calendar` присутствует в группах "Control Tower" И "Distribution" в sidebar
2. **`/admin/leads`** → редирект на `/admin/operations` — мёртвый маршрут
3. **`/admin/vendor-prospects`** — отдельная страница, но тот же контент встроен в `/admin/crm` (вкладка Vendors)
4. **MC CRM Dashboard** vs **MC Dashboard** — два обзорных экрана с пересекающимися виджетами
5. **Owner routes** (`/owner/*`) — все редиректят на `/mc/*`, но routes constants ещё определены

## 2. Ваша проблема: как работать одному

Сейчас для ежедневной работы вам нужно:
- `/admin/crm` — чтобы видеть воронку привлечения вендоров
- `/mc/contacts` — чтобы вести контакты собственников и клиентов
- `/mc/sales` — чтобы вести сделки
- `/mc/tasks` — чтобы видеть задачи
- `/admin/ai-ops` — чтобы управлять AI-агентами

Это **5 разных мест** в разных порталах.

## 3. Предложение: единый Command Center для владельца

### Концепция: "Founder Mode"

Один рабочий стол (`/mc` dashboard), который агрегирует ВСЁ:

```text
┌─────────────────────────────────────────────────────┐
│  MC Dashboard (Founder Mode)                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐│
│  │ Hot Leads │ │ Open     │ │ Today's  │ │ AI Agent││
│  │ (all src) │ │ Deals    │ │ Tasks    │ │ Status  ││
│  └──────────┘ └──────────┘ └──────────┘ └─────────┘│
│                                                     │
│  ┌─ Vendor Acquisition ─────────────────────────┐   │
│  │ Pipeline from vendor_prospects (was /admin)   │   │
│  └───────────────────────────────────────────────┘   │
│                                                     │
│  ┌─ AI Agents Summary ──────────────────────────┐   │
│  │ Last runs, errors, pending actions            │   │
│  └───────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Конкретные изменения

#### A. Объединить Vendor Pipeline в MC CRM (4 файла)
- Перенести `VendorProspectsPipeline` из `/admin/crm` в MC sidebar как пункт "Vendor Acquisition"
- Vendor prospects остаются в той же таблице, но доступны из MC
- `/admin/crm` сохраняется как зеркало для будущих МС-операторов

#### B. Виджет AI Agents на MC Dashboard (2 файла)
- Мини-карточка с состоянием агентов (сколько работают, последние ошибки, pending actions)
- Клик → `/admin/ai-ops` (для founder role)

#### C. Убрать дубликаты из sidebar (1 файл)
- Убрать дублирующийся Calendar Sync из "Distribution"
- Переместить "Marketing" из CRM-группы в отдельную группу или убрать (пока placeholder)

#### D. Unified Inbox на Dashboard (2 файла)
- Виджет "Quick Actions": создать контакт, записать сделку, добавить объект — одним кликом
- AI-suggested next actions из `crm_tasks` + `vendor_prospects`

#### E. AI Agent автоматизация (3 файла)
Расширить AI-агентов для автоматической рутины:

| Агент | Триггер | Действие |
|---|---|---|
| **Lead Router** | Новый контакт через intake/webhook | Авто-категоризация, назначение температуры, создание задачи |
| **Follow-up Nagger** | Задача без действия 48ч+ | Push в dashboard + telegram |
| **Deal Progressor** | Сделка без движения 5д+ | AI предлагает next action, создаёт задачу |
| **Owner Report** | Cron (weekly) | Авто-генерация отчёта для собственника |
| **Vendor Onboarding** | Новый prospect score > 70 | Авто-отправка invite через outreach |

### Архитектура данных — что НЕ менять
- `crm_contacts` — единая таблица, company_id scoped — **правильно**
- `agent_deals` — deal pipeline — **правильно**
- `vendor_prospects` — отдельная таблица для acquisition — **правильно** (другой lifecycle)
- RLS через `mc_can_access()` — **правильно**

### Архитектура данных — что улучшить
1. **Добавить `crm_contacts.source_entity`** — связь с `vendor_prospects.id` для трекинга конверсии vendor → contact
2. **Добавить `ai_task_suggestions`** таблица — AI-предложения действий, которые founder одобряет одним кликом
3. **Создать view `v_founder_inbox`** — объединённый view из tasks + deals + prospects + reminders, отсортированный по urgency

## 4. Файлы для изменения

| Файл | Действие |
|---|---|
| `src/components/mc/MCSidebar.tsx` | Убрать дублирующий Calendar из Distribution, добавить "Vendor Acquisition" |
| `src/components/owner/dashboard/` | Добавить виджет AI Agent Status + Vendor Pipeline mini |
| `src/components/mc/MCLayout.tsx` | Без изменений |
| `supabase/migrations/new` | View `v_founder_inbox`, колонка `source_entity`, таблица `ai_task_suggestions` |
| `src/hooks/useFounderInbox.ts` | Новый хук для unified inbox |
| `src/components/owner/dashboard/FounderQuickActions.tsx` | Quick-create контакт/сделку/задачу |
| `src/components/owner/dashboard/AIAgentStatusWidget.tsx` | Мини-статус агентов |
| `src/pages/admin/AdminCRM.tsx` | Добавить ссылку "Open in MC" для founder |

## 5. Порядок реализации

**Phase 1** — Cleanup (быстро, 30 мин):
- Убрать дубликаты из sidebar
- Убрать мёртвые маршруты

**Phase 2** — Founder Dashboard (основная работа):
- Unified inbox виджет
- Quick Actions panel
- AI Agent status widget
- Vendor Pipeline в MC sidebar

**Phase 3** — AI Automation (edge functions):
- Lead Router agent
- Follow-up Nagger (cron)
- Deal Progressor (cron)

