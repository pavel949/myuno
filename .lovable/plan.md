

# План: Полноценный Campaign Factory для MCC

## Текущее состояние

Сейчас `MCCCampaignsTab.tsx` — это **UI-заглушка** с mock-данными. Таблица `mcc_campaigns` в базе данных уже существует, но:
- Нет формы создания/редактирования кампаний
- Нет реального CRUD
- Нет связи с креативами (`mcc_creatives`)
- Нет метрик производительности
- Нет статусного workflow

## Архитектура решения

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                         CAMPAIGN FACTORY MODULE                           │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────┐   ┌─────────────────────┐   ┌────────────────┐  │
│  │   Campaign List     │   │   Campaign Form     │   │  Campaign      │  │
│  │   (Grid/Table)      │   │   (Create/Edit)     │   │  Detail View   │  │
│  └─────────────────────┘   └─────────────────────┘   └────────────────┘  │
│           │                         │                        │            │
│           └─────────────┬───────────┴────────────────────────┘            │
│                         ▼                                                 │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │                    useCampaignFactory Hook                        │    │
│  │  - CRUD operations (create, update, delete, duplicate)            │    │
│  │  - Status transitions (draft → active → paused → completed)       │    │
│  │  - Creatives management                                           │    │
│  │  - Performance data aggregation                                   │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                         │                                                 │
│                         ▼                                                 │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │                      Supabase Tables                              │    │
│  │  mcc_campaigns ◄──── mcc_creatives ◄──── mcc_channel_metrics      │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

## Компоненты для реализации

### 1. Хук `useCampaignFactory.ts`

**Путь:** `src/hooks/useCampaignFactory.ts`

Централизованная логика для работы с кампаниями:

```typescript
// Основные операции
- useCreateCampaign() — создание новой кампании
- useUpdateCampaign() — обновление кампании
- useDeleteCampaign() — удаление (только draft)
- useDuplicateCampaign() — клонирование кампании
- useToggleCampaignStatus() — переключение active/paused

// Запросы данных
- useCampaigns() — список кампаний с фильтрами
- useCampaignDetail(id) — детали одной кампании
- useCampaignCreatives(id) — креативы кампании
- useCampaignMetrics(id) — агрегированные метрики
```

### 2. Форма создания/редактирования `CampaignFormSheet.tsx`

**Путь:** `src/components/admin/marketing/CampaignFormSheet.tsx`

Слайд-панель (Sheet) с формой:

| Секция | Поля |
|--------|------|
| **Основное** | Название, Описание, Цель (dropdown) |
| **Таргетинг** | Целевой сегмент (users/providers/owners) |
| **Каналы** | Мультивыбор: Google, Meta, TikTok, Email, WhatsApp, Telegram |
| **Бюджет** | Общий бюджет, Дневной лимит, Валюта |
| **Расписание** | Дата старта, Дата окончания, Timezone |
| **KPI** | Целевые метрики (leads, conversions, CAC) |

Типы целей:
- `awareness` — Узнаваемость
- `acquisition` — Привлечение
- `activation` — Активация
- `retention` — Удержание
- `referral` — Реферальная

### 3. Детальный просмотр `CampaignDetailSheet.tsx`

**Путь:** `src/components/admin/marketing/CampaignDetailSheet.tsx`

Слайд-панель с табами:

| Таб | Содержимое |
|-----|------------|
| **Обзор** | KPI карточки, статус, прогресс бюджета |
| **Креативы** | Список креативов кампании, добавление |
| **Метрики** | Графики: leads, conversions, spend по дням |
| **История** | Лог изменений статуса |

### 4. Обновлённый `MCCCampaignsTab.tsx`

**Изменения:**
- Убрать mock-данные
- Подключить `useCampaigns()` хук
- Добавить фильтры по статусу и цели
- Интегрировать `CampaignFormSheet` и `CampaignDetailSheet`
- Добавить bulk-actions (пауза/активация нескольких)

## Структура данных кампании

```typescript
interface CampaignFormData {
  name: string;
  description?: string;
  goal: 'awareness' | 'acquisition' | 'activation' | 'retention' | 'referral';
  target_segment: 'b2c_users' | 'providers' | 'owners' | 'partners';
  channels: string[]; // ['google', 'meta', 'email', ...]
  budget: {
    total: number;
    daily_cap?: number;
    currency: 'USD' | 'THB' | 'RUB';
  };
  schedule: {
    start_date: string; // ISO date
    end_date?: string;
    timezone: string;
  };
  kpi_targets?: {
    target_leads?: number;
    target_conversions?: number;
    target_cac?: number;
    target_roas?: number;
  };
}
```

## Статусный workflow

```text
┌─────────┐     ┌────────┐     ┌────────┐     ┌───────────┐
│  draft  │ ──► │ active │ ◄─► │ paused │ ──► │ completed │
└─────────┘     └────────┘     └────────┘     └───────────┘
     │               │              │               ▲
     │               │              │               │
     └───────────────┴──────────────┴───────────────┘
                     (manual complete)
```

Правила:
- `draft` → можно удалить, редактировать, запустить
- `active` → можно только поставить на паузу или завершить
- `paused` → можно возобновить или завершить
- `completed` → read-only, только дублирование

## UI-экраны

### Экран 1: Список кампаний (обновлённый)

```text
┌──────────────────────────────────────────────────────────────────┐
│  Campaigns                                    [+ New Campaign]   │
├──────────────────────────────────────────────────────────────────┤
│  Filters: [All Status ▼] [All Goals ▼] [Search...]              │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────┐  ┌──────────────────────┐             │
│  │ Summer Phuket 2026   │  │ Villa Retargeting    │             │
│  │ ● Active | Acquisition│  │ ● Paused | Retention │             │
│  │ [Google][Meta][TikTok]│  │ [Meta][Email]        │             │
│  │ ─────────────────────│  │ ─────────────────────│             │
│  │ Leads: 892  Conv: 127│  │ Leads: 234  Conv: 45 │             │
│  │ Spend: $2,340/$5,000 │  │ Spend: $890/$1,500   │             │
│  │ [Pause] [Edit] [...]  │  │ [Resume] [Edit] [...] │             │
│  └──────────────────────┘  └──────────────────────┘             │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Экран 2: Форма создания

```text
┌────────────────────────────────── Sheet ─────────────────────────┐
│                                                              [X] │
│  Create Campaign                                                 │
│  ─────────────────────────────────────────────────────────────── │
│                                                                  │
│  Campaign Name *                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Summer Phuket Launch 2026                                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Description                                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Main campaign for summer season user acquisition...      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Goal *                           Target Segment *               │
│  ┌────────────────────────┐       ┌────────────────────────┐    │
│  │ Acquisition           ▼│       │ B2C Users             ▼│    │
│  └────────────────────────┘       └────────────────────────┘    │
│                                                                  │
│  Channels *                                                      │
│  [✓ Google] [✓ Meta] [✓ TikTok] [○ Email] [○ WhatsApp]          │
│                                                                  │
│  ─── Budget ───────────────────────────────────────────────────  │
│  Total Budget *     Daily Cap        Currency                    │
│  ┌──────────┐       ┌──────────┐     ┌──────────┐               │
│  │ 5000     │       │ 200      │     │ USD     ▼│               │
│  └──────────┘       └──────────┘     └──────────┘               │
│                                                                  │
│  ─── Schedule ─────────────────────────────────────────────────  │
│  Start Date *                   End Date (optional)              │
│  ┌──────────────────┐           ┌──────────────────┐            │
│  │ 2026-02-15       │           │ 2026-04-15       │            │
│  └──────────────────┘           └──────────────────┘            │
│                                                                  │
│  ─────────────────────────────────────────────────────────────── │
│                                   [Cancel]  [Save as Draft]      │
└──────────────────────────────────────────────────────────────────┘
```

### Экран 3: Детали кампании

```text
┌────────────────────────────────── Sheet ─────────────────────────┐
│                                                              [X] │
│  Summer Phuket Launch 2026                                       │
│  ● Active | Acquisition | B2C Users                              │
│  ─────────────────────────────────────────────────────────────── │
│                                                                  │
│  [Overview] [Creatives] [Metrics] [History]                      │
│  ─────────────────────────────────────────────────────────────── │
│                                                                  │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐    │
│  │   892      │ │    127     │ │   $2,340   │ │   14.2%    │    │
│  │   Leads    │ │ Conversions│ │   Spent    │ │    CVR     │    │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘    │
│                                                                  │
│  Budget Progress                                                 │
│  ████████████████████░░░░░░░░░░░░░░░░░░░░  $2,340 / $5,000 (47%) │
│                                                                  │
│  Channels                                                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Channel    │ Leads  │ Conv  │ Spend    │ CAC    │ Status  │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │ Google     │  412   │  58   │ $1,240   │ $21.38 │ ● Live  │  │
│  │ Meta       │  356   │  52   │ $890     │ $17.12 │ ● Live  │  │
│  │ TikTok     │  124   │  17   │ $210     │ $12.35 │ ● Live  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ─────────────────────────────────────────────────────────────── │
│                            [Pause Campaign]  [Edit]  [Duplicate] │
└──────────────────────────────────────────────────────────────────┘
```

## Файлы для создания/изменения

| Файл | Действие | Описание |
|------|----------|----------|
| `src/hooks/useCampaignFactory.ts` | Создать | Хук с CRUD операциями |
| `src/components/admin/marketing/CampaignFormSheet.tsx` | Создать | Форма создания/редактирования |
| `src/components/admin/marketing/CampaignDetailSheet.tsx` | Создать | Детальный просмотр |
| `src/components/admin/marketing/CampaignCard.tsx` | Создать | Карточка кампании для grid |
| `src/components/admin/marketing/MCCCampaignsTab.tsx` | Обновить | Интеграция компонентов |
| `src/components/admin/marketing/index.ts` | Обновить | Экспорт новых компонентов |

## Технические детали

### Типизация

```typescript
// src/types/marketing.ts
export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  goal: CampaignGoal;
  target_segment: string | null;
  channels: string[];
  budget: CampaignBudget | null;
  schedule: CampaignSchedule | null;
  kpi_targets: CampaignKPI | null;
  ab_variants: any[] | null;
  performance_data: CampaignPerformance | null;
  status: CampaignStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type CampaignGoal = 'awareness' | 'acquisition' | 'activation' | 'retention' | 'referral';
export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';
```

### Валидация

Используем Zod для валидации формы:
- `name` — обязательно, мин. 3 символа
- `goal` — обязательно
- `channels` — минимум 1 выбран
- `budget.total` — положительное число
- `schedule.start_date` — не в прошлом

## Порядок реализации

1. **Создать типы** — `src/types/marketing.ts`
2. **Создать хук** — `useCampaignFactory.ts` с базовым CRUD
3. **Создать форму** — `CampaignFormSheet.tsx`
4. **Создать карточку** — `CampaignCard.tsx`
5. **Обновить таб** — `MCCCampaignsTab.tsx` с реальными данными
6. **Создать детали** — `CampaignDetailSheet.tsx`
7. **Тестирование** — проверка всех операций

## Ожидаемый результат

- Полнофункциональный Campaign Factory без mock-данных
- CRUD для кампаний с валидацией
- Визуальный workflow статусов
- Связь с креативами и метриками (подготовка)
- Билингвальный интерфейс (EN/RU)
- Консистентный UX по паттернам админки (Sheet-based формы)

