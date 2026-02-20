

# Расширение KPI-блока: полная картина бизнеса

## Проблема

Текущий `BusinessKPIWidget` показывает только 4 метрики:
- Доход / Расходы / Маржа / Загрузка

Это покрывает **только финансы и заполняемость**. Владелец малого бизнеса не видит:

| Направление | Сейчас в KPI | Данные в БД |
|-------------|-------------|-------------|
| Финансы | Да (4 карточки) | property_financials |
| CRM / Задачи | Нет | crm_tasks |
| Продажи / Сделки | Нет | agent_deals |
| Персонал | Нет | staff_members, staff_payroll |
| Операции (заявки) | Нет | service_requests |
| Бронирования | Нет | property_bookings |
| Инвентарь | Нет | property_inventory_items |

## Решение

Расширить KPI-виджет до **2-уровневой структуры**:

1. **Верхний ряд (2x2)** -- финансовые метрики (как сейчас): Доход, Расходы, Маржа, Загрузка
2. **Нижний ряд (скроллируемый)** -- операционные метрики по направлениям:

| Карточка | Значение | Источник | Ссылка |
|----------|---------|----------|--------|
| Открытые задачи | Кол-во незакрытых crm_tasks | crm_tasks (status != done) | /owner/crm-tasks |
| Активные сделки | Кол-во + сумма воронки | agent_deals (is_closed=false) | /owner/sales |
| Бронирования | Кол-во текущих/предстоящих | property_bookings | /owner/bookings |
| Персонал | Кол-во сотрудников + расходы на ЗП за месяц | staff_members + staff_payroll | /owner/staff |
| Заявки на сервис | Кол-во открытых | service_requests (status=pending) | /owner/operations |
| Инвентарь (алерт) | Позиций ниже минимума | property_inventory_items | /owner/inventory |

## Технические детали

### Файлы для изменения

**1. `src/components/owner/dashboard/BusinessKPIWidget.tsx`**
- Добавить запросы к 6 новым таблицам в `Promise.all`
- Добавить горизонтальный скролл с мини-карточками под основной 2x2 сеткой
- Каждая мини-карточка: иконка + название + число + badge (если требует внимания)

**2. `src/components/owner/OwnerKPICard.tsx`**
- Добавить вариант `compact` для мини-карточек нижнего ряда (меньший padding, без changeLabel)

### Новые запросы к БД (все в одном Promise.all)

```text
crm_tasks        -> count where status != 'done' AND (assigned_to = user OR company match)
agent_deals      -> count + sum(deal_value) where is_closed = false
property_bookings -> count where check_in <= end_of_month AND check_out >= today
staff_members    -> count where company_id matches
staff_payroll    -> sum(amount) for current month
service_requests -> count where status IN ('pending','in_progress')
property_inventory_items -> count where current_quantity < min_quantity
```

### UI-структура

```text
+-------------------+-------------------+
|   Revenue ฿93K    |   Expenses ฿18K   |
|   +12% vs prev    |   -5% vs prev     |
+-------------------+-------------------+
|   Margin 81%      |   Occupancy 72%   |
+-------------------+-------------------+

[Задачи: 5] [Сделки: 3 / ฿2.1M] [Броней: 8] [Персонал: 12] [Заявки: 2] [Склад: !3]
   ^^^ горизонтальный скролл с компактными карточками ^^^
```

- Карточки с проблемами (просроченные задачи, инвентарь ниже минимума) подсвечиваются оранжевым/красным badge
- Каждая карточка кликабельна и ведёт на соответствующую страницу

### Адаптация по ролям

Набор операционных карточек адаптируется к активной бизнес-роли:
- **Property Manager**: все 6 карточек
- **Sales Agent**: Задачи, Сделки, Бронирования
- **Service Provider**: Задачи, Заявки, Инвентарь
- **General**: все 6 карточек

Роль передаётся как prop из `OwnerDashboard` -> `BusinessKPIWidget`.

