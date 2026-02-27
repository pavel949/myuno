
# Аудит myUNO для управляющей компании (до 50 объектов)

## Операционный контекст целевой компании

Типичная УК на Пхукете с 10-50 объектами (виллы, кондо) работает так:
- 2-5 сотрудников (менеджер, клинеры, "на все руки")
- Основная работа: заезды/выезды, уборка, мелкий ремонт, контроль коммуналки
- Главная боль: хаос — кто где, у кого ключи, когда PEA, оплачен ли CAM
- Критичен мобильный доступ (менеджеры в поле)
- Собственники хотят видеть отчёты и понимать что происходит

---

## Оценка текущей реализации myUNO

### Что ХОРОШО реализовано (7-8/10)

| Модуль | Оценка | Комментарий |
|--------|--------|-------------|
| Календарь (Multi-Property Timeline) | 8/10 | 30-дневная горизонтальная сетка, цветные бронирования, drill-down — отлично |
| Бронирования и заезды/выезды | 8/10 | TodayBriefingWidget показывает заезды/выезды сегодня+завтра, ActiveStaysWidget — текущие гости |
| Быстрый ввод расходов | 8/10 | QuickExpense — мобильно-первый UX, категории, фото чека, повторяющиеся платежи |
| Документы по объектам | 7/10 | PropertyDocumentsTab, хранение в vault, привязка к объекту |
| Задачи и операции | 7/10 | UnifiedTaskHub: CRM + операционные задачи, назначение сотрудников |
| Финансы по портфелю | 7/10 | Доходы/расходы, предстоящие платежи (UpcomingPaymentsWidget), аналитика |
| Инвентарь | 7/10 | По объектам, min stock alerts, фото, инспекции |
| Карточка объекта (Command Center) | 7/10 | 6 табов: Обзор, Операции, Документы, Заметки, Условия, Владелец |
| CRM и воронка продаж | 7/10 | Pipeline, контакты, сделки — функционально |
| Прозрачность для собственников | 7/10 | Transparency Dashboard, автоотчёты, делегированный доступ |

### Что СЛАБО или ОТСУТСТВУЕТ (требует доработки)

| Проблема | Текущее состояние | Критичность |
|----------|-------------------|-------------|
| **Управление ключами** | Нет. Только lockbox_code в гайдбуке — это для гостей, а не для операционного учёта | ВЫСОКАЯ |
| **Коммунальные платежи (PEA, вода, CAM)** | Есть recurring expense + CAM fee в projects, но нет **календаря платежей** с дедлайнами и автонапоминаниями | ВЫСОКАЯ |
| **Дашборд перегружен** | 15+ виджетов, BusinessRoleSwitcher, DashboardPropertyFilter — слишком много для менеджера с 15 объектами | ВЫСОКАЯ |
| **Навигация избыточна** | 5 групп, 20+ пунктов в сайдбаре. Маленькой УК не нужен Marketing, Channel Manager, Rate Seasons как отдельные разделы | СРЕДНЯЯ |
| **Статус объекта "прямо сейчас"** | Нет единой карточки: кто живёт, когда выезд, чисто ли, у кого ключи, оплачен ли свет | ВЫСОКАЯ |
| **Mobile bottom nav** | Всего 4 пункта, "Operations" ведёт на /owner/operations а не на /owner/tasks | СРЕДНЯЯ |
| **Onboarding для УК** | SetupPromptBanner есть, но wizard заточен под добавление объектов, не под быструю настройку портфеля | НИЗКАЯ |

---

## Архитектурные рекомендации

### 1. "Property Status at a Glance" — виджет статуса объекта

Самая важная доработка. На дашборде и в списке объектов каждый объект должен показывать:

```text
+------------------------------------------+
| Villa Sunrise (Rawai)          [Occupied] |
| Guest: John Smith, выезд через 2 дня     |
| Ключи: у менеджера Алины                 |
| PEA: оплачено до 15 мар                  |
| CAM: просрочен (12,500 THB)              |
| Уборка: запланирована 28 фев             |
+------------------------------------------+
```

**Реализация**: Новый компонент `PropertyStatusSnapshot` — композит данных из:
- `property_bookings` (текущий гость + следующий заезд)
- Новая таблица `property_key_assignments` (у кого ключи)
- `property_financials` (pending payments с due_date)
- `property_operational_tasks` (ближайшая уборка/maintenance)

### 2. Управление ключами — новая таблица и UI

**Таблица** `property_key_assignments`:
- `id`, `property_id`, `key_set_label` ("Комплект 1", "Мастер-ключ")
- `assigned_to_name`, `assigned_to_phone`, `assigned_to_type` (staff/guest/owner/lockbox)
- `assigned_at`, `expected_return`, `returned_at`
- `notes`, `photo_url`

**UI**: Секция в карточке объекта (Overview таб) + быстрое действие "Передать ключи" в дашборде.

### 3. Календарь коммунальных платежей

**Таблица** `property_utility_schedules`:
- `property_id`, `utility_type` (pea/water/internet/cam/insurance)
- `provider_name`, `account_number`
- `due_day` (число месяца), `amount_estimate`
- `last_paid_date`, `last_paid_amount`
- `auto_remind_days_before`

**UI**: Виджет "Платежи этой недели" на дашборде + отметка "Оплачено" в одно нажатие, создающая запись в `property_financials`.

### 4. Упрощение дашборда для маленькой УК

Вместо 15 виджетов — 5 секций:

1. **Сегодня** — заезды, выезды, задачи на сегодня (уже есть TodayBriefingWidget — оставить)
2. **Мои объекты** — компактный список со статусами (новый PropertyStatusSnapshot)
3. **Платежи** — просроченные и на этой неделе (расширить UpcomingPaymentsWidget)
4. **Задачи** — открытые задачи по приоритету (есть CrmTasksWidget)
5. **Быстрые действия** — Добавить расход, Передать ключи, Создать задачу

Текущий `BusinessRoleSwitcher` сохранить, но для роли `property_manager` использовать упрощённый набор виджетов.

### 5. Упрощение навигации

Для маленькой УК (до 50 объектов) предложить 3 группы вместо 5:

```text
Главное:     Обзор | Объекты | Календарь | Задачи
Финансы:     Доходы/Расходы | Платежи | Отчёты
Ещё:         Контакты | Команда | Документы | Настройки
```

Вынести Marketing, Channel Manager, Rate Seasons, Reviews в секцию "Ещё" или скрыть до активации.

---

## План реализации (приоритезированный)

### Фаза 1 — Ядро операционного контроля (P0)

1. **Создать таблицу `property_key_assignments`** + RLS
2. **Создать таблицу `property_utility_schedules`** + RLS
3. **Компонент `PropertyStatusSnapshot`** — агрегирует статус объекта из 4 источников
4. **Виджет ключей** в карточке объекта (Overview таб) — показ + передача
5. **Виджет коммунальных платежей** — дедлайны, отметка оплаты

### Фаза 2 — UX упрощение (P1)

6. **Пересмотр виджетов дашборда** для роли `property_manager` — сократить до 5-7 ключевых
7. **Упрощение sidebar** — адаптивная навигация по размеру портфеля
8. **Mobile bottom nav** — заменить "Operations" на "Tasks" (/owner/tasks)

### Фаза 3 — Автоматизация (P2)

9. **Автонапоминания** о PEA/CAM через edge function (cron)
10. **Quick action "Оплатил"** — одна кнопка создает финансовую запись
11. **Property checklist** — чеклист состояния при заезде/выезде с фото

---

## Технические детали

### Миграция БД

```sql
-- property_key_assignments
CREATE TABLE property_key_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  key_set_label text NOT NULL DEFAULT 'Main',
  assigned_to_name text NOT NULL,
  assigned_to_phone text,
  assigned_to_type text NOT NULL DEFAULT 'staff'
    CHECK (assigned_to_type IN ('staff','guest','owner','lockbox','security')),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  expected_return timestamptz,
  returned_at timestamptz,
  notes text,
  photo_url text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- property_utility_schedules
CREATE TABLE property_utility_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  utility_type text NOT NULL
    CHECK (utility_type IN ('electricity','water','internet','cam','insurance','gas','other')),
  provider_name text,
  account_number text,
  due_day integer CHECK (due_day BETWEEN 1 AND 31),
  amount_estimate numeric,
  currency text DEFAULT 'THB',
  last_paid_date date,
  last_paid_amount numeric,
  auto_remind_days integer DEFAULT 3,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

### Новые компоненты

- `src/components/owner/property-detail/PropertyKeyAssignments.tsx` — CRUD ключей
- `src/components/owner/property-detail/PropertyUtilitySchedules.tsx` — платежи по коммуналке
- `src/components/owner/dashboard/PropertyStatusSnapshot.tsx` — компактная карточка статуса
- `src/hooks/usePropertyKeys.ts` — хук для key_assignments
- `src/hooks/useUtilitySchedules.ts` — хук для utility_schedules

### Модифицируемые файлы

- `src/lib/businessRoles.ts` — оптимизация виджетов для property_manager
- `src/pages/owner/OwnerPropertyDetail.tsx` — добавить секции ключей и коммуналки в Overview
- `src/components/owner/OwnerSidebar.tsx` — упрощённая навигация
- `src/components/owner/OwnerMobileNav.tsx` — Tasks вместо Operations
- `src/components/owner/dashboard/OwnerPropertiesList.tsx` — интегрировать PropertyStatusSnapshot
