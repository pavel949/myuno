

# Preventive Maintenance System — Плановое обслуживание объектов

## Проблема

Сейчас `property_operational_tasks` поддерживает только разовые задачи (check-in, cleaning, maintenance). Нет системы **планового обслуживания** — регулярных работ, которые необходимы для устойчивой эксплуатации недвижимости.

## Какие элементы нужны для устойчивой эксплуатации

На основе лучших практик property maintenance (Buildium, AppFolio, Properly, Breezeway):

### Категории планового обслуживания

| Категория | Периодичность | Примеры |
|-----------|---------------|---------|
| **HVAC / Кондиционеры** | Каждые 3-6 мес | Чистка фильтров, заправка фреоном, проверка дренажа |
| **Сантехника** | Каждые 6 мес | Проверка протечек, чистка сифонов, проверка бойлера |
| **Электрика** | Каждые 12 мес | Проверка УЗО, состояние проводки, замена батарей в датчиках |
| **Бассейн** | Еженедельно/ежемесячно | Химия воды, чистка фильтров, проверка насоса |
| **Борьба с вредителями** | Каждые 3 мес | Обработка от термитов, тараканов, муравьёв |
| **Генеральная уборка** | Каждые 3-6 мес | Глубокая чистка, мытьё окон, чистка мебели |
| **Крыша и фасад** | Каждые 12 мес | Проверка протечек, чистка водостоков, мойка фасадов |
| **Сад/территория** | Еженедельно/ежемесячно | Стрижка, полив, обрезка деревьев |
| **Безопасность** | Каждые 6 мес | Проверка замков, камер, сигнализации, огнетушителей |
| **Бытовая техника** | Каждые 6-12 мес | Чистка стиралки, проверка холодильника, духовки |

## Решение

### 1. Новая таблица: `property_maintenance_schedules`

Хранит шаблоны плановых работ с рекуррентностью:

```text
property_maintenance_schedules
├── id (uuid)
├── property_id (FK -> owner_properties)
├── category (text) — ac, plumbing, electrical, pool, pest, deep_clean, roof, garden, security, appliances
├── title / title_ru
├── description
├── frequency (text) — weekly, biweekly, monthly, quarterly, biannual, annual
├── last_completed_at (timestamptz)
├── next_due_date (date) — автовычисляемая
├── assigned_provider_id (FK -> service_providers, nullable)
├── estimated_cost (numeric)
├── is_active (bool, default true)
├── priority (text) — low, normal, high
├── notes
├── created_by (uuid)
├── created_at / updated_at
```

### 2. Автогенерация задач

Cron-функция (или DB-триггер при обновлении `last_completed_at`) автоматически:
- Пересчитывает `next_due_date` на основе `frequency`
- Создаёт задачу в `property_operational_tasks` когда `next_due_date` наступает (за 3 дня до срока)
- Новый `task_type`: `preventive` — добавляется в существующий enum

### 3. Конфиг с шаблонами по умолчанию

`src/config/maintenanceScheduleTemplates.ts` — готовые шаблоны для быстрого добавления:

```text
AC Service         — quarterly  — ~2,000 THB
Pool Maintenance   — weekly     — ~500 THB
Pest Control       — quarterly  — ~1,500 THB
Deep Cleaning      — biannual   — ~5,000 THB
Electrical Check   — annual     — ~2,000 THB
Plumbing Check     — biannual   — ~1,500 THB
Garden Service     — biweekly   — ~1,000 THB
Security Check     — biannual   — ~1,000 THB
Roof Inspection    — annual     — ~2,000 THB
Appliance Service  — annual     — ~3,000 THB
```

### 4. UI: Страница "Maintenance Plan"

Новая вкладка/страница `/owner/maintenance-plan`:

```text
┌─────────────────────────────────────────────────┐
│  Maintenance Plan                    [+ Add]    │
│  ─────────────────────────────────────────────── │
│                                                 │
│  OVERDUE (2)                                    │
│  ┌──────────────────────────────────────────┐   │
│  │ ❄️ AC Service      Villa Ocean   OVERDUE │   │
│  │    Last: 15 Jan    Due: 15 Apr   ~2,000  │   │
│  │                         [Mark Done]      │   │
│  ├──────────────────────────────────────────┤   │
│  │ 🐜 Pest Control   Condo Palm    OVERDUE │   │
│  │    Last: 01 Feb    Due: 01 May   ~1,500  │   │
│  │                         [Mark Done]      │   │
│  └──────────────────────────────────────────┘   │
│                                                 │
│  UPCOMING (30 days)                             │
│  ┌──────────────────────────────────────────┐   │
│  │ 🧹 Deep Clean     Villa Ocean   12 days │   │
│  │ 🔒 Security Check  Condo Palm   25 days │   │
│  └──────────────────────────────────────────┘   │
│                                                 │
│  ALL SCHEDULES                                  │
│  ┌──────────────────────────────────────────┐   │
│  │  Category    Property   Freq   Next Due  │   │
│  │  ❄️ AC       Villa...   3mo    15 Jul    │   │
│  │  🏊 Pool     Villa...   1wk    28 Feb    │   │
│  │  🐜 Pest     Condo...   3mo    01 Aug    │   │
│  │  ...                                     │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### 5. Dashboard Widget

Компактный виджет на Owner Dashboard показывающий:
- Количество просроченных плановых работ
- Ближайшие 3 работы
- Общий "Health Score" объекта (% выполненных в срок)

---

## Технический план

### Файлы для создания/изменения

| Файл | Действие |
|------|----------|
| `supabase/migrations/...maintenance_schedules.sql` | Новая таблица + RLS + seed-функция |
| `src/config/maintenanceScheduleTemplates.ts` | Шаблоны плановых работ с ценами |
| `src/hooks/useMaintenanceSchedules.ts` | CRUD-хук для расписаний |
| `src/pages/owner/MaintenancePlan.tsx` | Основная страница планового обслуживания |
| `src/components/owner/maintenance/ScheduleCard.tsx` | Карточка расписания |
| `src/components/owner/maintenance/AddScheduleDialog.tsx` | Диалог добавления из шаблонов |
| `src/components/owner/dashboard/MaintenanceHealthWidget.tsx` | Виджет на дашборд |
| `src/config/taskColors.ts` | Добавить тип `preventive` |
| `src/components/layout/AnimatedRoutes.tsx` | Новый маршрут |
| `src/components/layout/pageRegistry.ts` | Регистрация страницы |
| `src/lib/businessRoles.ts` | Виджет `maintenance_health` для ролей |

### Миграция БД

1. Создание таблицы `property_maintenance_schedules`
2. RLS-политики: владельцы и делегаты видят расписания своих объектов
3. Триггер: при обновлении `last_completed_at` пересчитывать `next_due_date`
4. Функция `generate_preventive_tasks()` — вызывается cron, создаёт задачи за 3 дня до `next_due_date`

### Расширение task_type

Добавить `preventive` в допустимые значения `task_type` в `property_operational_tasks`, обновить `taskColors.ts` и `OperationalTaskCard`.
