

# Настраиваемая учётная политика и комиссии со-агентов

## Проблема
Сейчас `property_management_terms` хранит только комиссию УК и распределение расходов. Нет возможности:
- Настроить комиссии со-агентов и сотрудников (% от чистой прибыли, фикс и т.д.)
- Задать учётную политику (что считать расходом до расчёта "чистой прибыли", периоды отчётности)
- Настроить правила выплат (минимум, удержания, периоды)

## Архитектура решения

### 1. Новая таблица: `property_payout_rules`
Хранит правила выплат со-агентам и сотрудникам по каждому объекту:

```text
property_payout_rules
├── id (UUID PK)
├── property_id (FK -> properties)
├── management_terms_id (FK -> property_management_terms, nullable)
├── recipient_type: 'coagent' | 'staff' | 'partner'
├── recipient_staff_id (FK -> staff_members, nullable)
├── recipient_name (text -- для внешних со-агентов)
├── commission_type: 'percent_net' | 'percent_gross' | 'fixed' | 'per_booking'
├── commission_value (numeric)
├── deduct_before_owner: boolean (вычитать до расчёта доли собственника?)
├── min_payout (numeric, nullable)
├── payout_frequency: 'per_booking' | 'monthly' | 'quarterly'
├── notes (text)
├── is_active (boolean)
├── created_at / updated_at
```

### 2. Расширение `property_management_terms` (JSONB-поле `accounting_policy`)
Добавляем JSONB-колонку для гибкой учётной политики без изменения схемы:

```text
accounting_policy JSONB:
{
  "net_profit_deductions": ["cleaning", "utilities", "cam_fees", "marketing"],
  "report_frequency": "monthly",          // monthly | quarterly | on_demand
  "report_format": "detailed",            // summary | detailed
  "report_language": "ru",
  "minimum_payout": 5000,
  "payout_hold_days": 7,
  "include_pending_bookings": false,
  "owner_approval_required_above": 10000,
  "tax_withholding_percent": null
}
```

### 3. UI: Новые секции в ManagementTermsForm

**Секция F: Комиссии со-агентов и сотрудников**
- Список получателей с возможностью добавления
- Для каждого: тип (со-агент/сотрудник), % или фикс, база расчёта
- Переключатель "вычитать до расчёта доли собственника"
- Визуальная формула: Доход -> Расходы -> Комиссии агентов -> Доля собственника

**Секция G: Учётная политика**
- Чекбоксы: какие расходы вычитать для расчёта "чистого дохода"
- Частота отчётов (ежемесячно / ежеквартально / по запросу)
- Формат отчёта (краткий / детальный)
- Минимальная сумма выплаты
- Период удержания (дней после выезда)

### 4. Визуальная формула распределения (Waterfall)
Наглядная диаграмма "водопад" в карточке объекта:

```text
Валовый доход: 100,000 THB
  - Уборка:       -5,000
  - Коммунальные:  -3,000
  = Чистый доход:  92,000
  - Со-агент (5%): -4,600
  - Сотрудник:     -2,000
  = К распределению: 85,400
  → Собственник (70%): 59,780
  → УК (30%):          25,620
```

---

## Технический план

### Шаг 1: Миграция БД
- Создать таблицу `property_payout_rules` с RLS (scoped по `management_company_id` через property)
- Добавить колонку `accounting_policy JSONB DEFAULT '{}'` в `property_management_terms`

### Шаг 2: Хук `usePayoutRules`
- CRUD операции для `property_payout_rules`
- Привязка к `staff_members` для выбора сотрудников

### Шаг 3: UI -- расширение ManagementTermsForm
- Секция F: Динамический список получателей комиссий с inline-редактированием
- Секция G: Настройки учётной политики (чекбоксы + селекты)
- Визуальная формула "водопад" с реальными числами

### Шаг 4: Интеграция с отчётами
- Учёт `property_payout_rules` при генерации P&L
- Отображение строк комиссий агентов в отчётах для собственников

### Файлы для создания/изменения:
- `supabase/migrations/...` -- новая таблица + колонка
- `src/hooks/usePayoutRules.ts` -- новый хук
- `src/components/owner/management/ManagementTermsForm.tsx` -- секции F и G
- `src/components/owner/management/PayoutWaterfall.tsx` -- визуальная формула
- `src/hooks/usePropertyReports.ts` -- учёт правил в отчётах

