

# Система прозрачности УК ↔ Собственник: Комплексное решение

## Проблема

Сейчас существует базовый портал прозрачности (`/owner/transparency/:propertyId`), но он:
- Показывает только 3 вкладки (Активность, Финансы, Бронирования) в минималистичном виде
- Нет уведомлений собственнику о важных событиях
- Нет механизма одобрения/согласования действий УК
- Нет месячного отчёта / дайджеста
- Собственник не видит текущий статус объекта "на одной странице"

## Архитектурная модель

```text
┌─────────────────────────────────────────────────────┐
│                   СОБСТВЕННИК                       │
│  ┌───────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ Live      │  │ Месячный │  │ Push/Email       │  │
│  │ Dashboard │  │ Дайджест │  │ Уведомления      │  │
│  └─────┬─────┘  └────┬─────┘  └────────┬─────────┘  │
│        │             │                  │            │
│  ┌─────▼─────────────▼──────────────────▼─────────┐  │
│  │         property_activity_log (realtime)        │  │
│  │         property_financials                     │  │
│  │         property_bookings                       │  │
│  │         property_management_terms               │  │
│  └─────────────────────┬──────────────────────────┘  │
│                        │ RLS: owner_readonly         │
├────────────────────────┼────────────────────────────┤
│                   УК (МЕНЕДЖЕР)                     │
│  ┌─────────────────────▼──────────────────────────┐  │
│  │  Полное управление: бронирования, финансы,     │  │
│  │  задачи, обслуживание, ценообразование         │  │
│  │  → каждое действие = запись в activity_log     │  │
│  └────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Что будет реализовано

### 1. Owner Property Status Card (Главный экран)

Виджет "Статус объекта на сегодня" — одна карточка, которую собственник видит первой:
- Текущий статус: **Занят** (гость: Ivan, до 3 марта) / **Свободен** / **На обслуживании**
- Следующее бронирование: дата + гость
- Доход за текущий месяц vs прошлый месяц
- Количество открытых задач обслуживания
- Последнее действие УК (из `property_activity_log`)

### 2. Расширенный Transparency Dashboard (5 вкладок)

Улучшение существующего `/owner/transparency/:propertyId`:

| Вкладка | Содержимое | Уже есть? |
|---------|-----------|-----------|
| **Обзор** | Status Card + KPI + последние 5 действий | Частично (KPI есть) |
| **Активность** | Полная лента с фильтрами по типу | Есть, доработать фильтры |
| **Финансы** | Таблица + график доход/расход по месяцам + P&L | Есть базовая таблица |
| **Бронирования** | Календарь-таймлайн + список | Есть список |
| **Условия** | Текущий договор, комиссия, ответственность | Данные есть, UI нет |

### 3. Система уведомлений собственника

Новая таблица `owner_notifications` для критических событий:

```sql
CREATE TABLE owner_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  property_id UUID NOT NULL REFERENCES owner_properties(id),
  type TEXT NOT NULL, -- 'booking_new', 'expense_large', 'maintenance_urgent', 'monthly_report'
  title TEXT NOT NULL,
  body TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

Триггер: при вставке в `property_activity_log` — автоматическое создание уведомления для собственника (если тип действия в списке критических).

### 4. Согласование крупных расходов

Новое поле `requires_owner_approval` в `property_management_terms`:
- Если расход > порогового значения (например, 10,000 THB), он создаётся со статусом `pending_approval`
- Собственник видит запрос в уведомлениях и может одобрить/отклонить
- УК видит статус согласования

### 5. Месячный дайджест (Email)

Edge Function `owner-monthly-digest`:
- Запускается по крону 1-го числа каждого месяца
- Собирает: доход, расходы, загрузку, топ-действия
- Отправляет email собственнику через Resend
- Записывает в `property_activity_log` как `monthly_report_sent`

---

## Техническая реализация

### Новые миграции БД

1. **`owner_notifications`** — таблица уведомлений с RLS (только owner видит свои)
2. **Триггер `notify_owner_on_activity`** — автоматическая генерация уведомлений из activity_log
3. **Поле `approval_threshold`** в `property_management_terms` — порог согласования расходов
4. **Поле `approval_status`** в `property_financials` — статус одобрения расхода (`auto_approved`, `pending`, `approved`, `rejected`)

### Новые/изменённые компоненты

| Файл | Описание |
|------|----------|
| `src/components/owner/transparency/PropertyStatusCard.tsx` | Карточка текущего статуса объекта |
| `src/components/owner/transparency/OwnerOverviewTab.tsx` | Вкладка "Обзор" с Status Card + KPI + лента |
| `src/components/owner/transparency/OwnerTermsTab.tsx` | Вкладка условий управления (read-only) |
| `src/components/owner/transparency/OwnerNotificationBell.tsx` | Колокольчик уведомлений в шапке |
| `src/components/owner/transparency/ActivityFeed.tsx` | Добавить фильтры по типу действия |
| `src/components/owner/transparency/OwnerFinanceTab.tsx` | Добавить мини-график + логику согласования |
| `src/hooks/useOwnerNotifications.ts` | Хук для уведомлений с realtime-подпиской |
| `src/pages/owner/OwnerTransparencyDashboard.tsx` | Расширить до 5 вкладок |
| `supabase/functions/owner-monthly-digest/index.ts` | Edge Function для месячного дайджеста |

### Безопасность (RLS)

- `owner_notifications`: SELECT только для `auth.uid() = owner_id`
- `property_financials.approval_status`: UPDATE только для owner (через `property_delegates` check)
- Activity log: уже защищён — owner и delegates с `view` permission

### Порядок реализации

1. Миграция БД (таблица `owner_notifications`, триггер, новые поля)
2. `PropertyStatusCard` + `OwnerOverviewTab`
3. `useOwnerNotifications` + `OwnerNotificationBell`
4. Расширение `OwnerTransparencyDashboard` до 5 вкладок
5. `OwnerTermsTab` (read-only просмотр условий)
6. Фильтры в `ActivityFeed`
7. Логика согласования расходов
8. Edge Function для месячного дайджеста

