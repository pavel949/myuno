
# Условия управления УК по объектам (Management Terms per Property)

## Проблема

Сейчас в системе **нет** механизма для УК, чтобы зафиксировать коммерческие условия работы с каждым конкретным объектом. У УК с 20–50 объектами это критично — невозможно отследить, у кого какая комиссия, кто платит за уборку, кто за ремонт.

Таблица `property_delegates` хранит только роли/права (access control), а не бизнес-условия.

---

## Что будет реализовано

### 1. Новая таблица `property_management_terms` (БД)

Коммерческие условия по каждому объекту — отдельная запись, привязанная к `owner_properties.id` и `user_id` (УК или менеджер):

| Поле | Тип | Описание |
|---|---|---|
| `property_id` | uuid | Объект |
| `manager_user_id` | uuid | Менеджер / УК |
| `commission_rate` | numeric | % комиссии УК |
| `commission_type` | text | `percent` / `fixed` |
| `commission_amount` | numeric | Фиксированная сумма (если fixed) |
| `commission_base` | text | `gross` / `net` — от чего считается |
| `revenue_split_owner` | numeric | % дохода собственнику |
| `revenue_split_manager` | numeric | % дохода УК |
| `expense_responsibility` | jsonb | Кто платит за что |
| `payment_day` | integer | День месяца выплаты |
| `payment_currency` | text | Валюта |
| `valid_from` | date | Начало действия условий |
| `valid_until` | date | Конец (null = бессрочно) |
| `notes` | text | Примечания |
| `status` | text | `draft / active / archived` |

Поле `expense_responsibility` (JSONB) хранит структуру ответственности за расходы:

```json
{
  "cleaning": "manager",
  "electricity": "owner",
  "water": "owner", 
  "internet": "split",
  "repairs_minor": "manager",
  "repairs_major": "owner",
  "cam_fees": "owner",
  "insurance": "owner",
  "marketing": "manager"
}
```

Значения: `"owner"` / `"manager"` / `"split"` / `"shared_XX"` (доля %)

### 2. Новый хук `usePropertyManagementTerms`

Запросы к новой таблице:
- `getTerms(propertyId)` — условия по объекту
- `getAllTermsForManager()` — все объекты текущего менеджера с условиями (для портфеля УК)
- `createTerms(data)` / `updateTerms(id, data)` — создание/обновление

RLS: видеть и редактировать может менеджер объекта (через `property_delegates`) или собственник.

### 3. UI — Форма условий управления (новый компонент)

**Путь:** `src/components/owner/management/ManagementTermsForm.tsx`

Встраивается в двух местах:
- При добавлении объекта (шаг `basic` / после него) — если тип управления `full` или `partial`
- На странице детали объекта в разделе "Условия управления"

**Структура формы (4 секции):**

**A. Комиссия УК**
- Тип: % от дохода / фиксированная сумма
- Процент (слайдер 5–50%) или фиксированная сумма
- База расчёта: от валовой выручки / от чистого дохода
- Разбивка: собственнику X% / УК Y%

**B. Расходы — кто платит (чеклист)**
Список статей с выбором: Собственник / УК / Пополам

| Статья | Выбор |
|---|---|
| Уборка между гостями | ○ Собственник ● УК ○ Пополам |
| Электричество | ● Собственник ○ УК ○ Пополам |
| Вода | ● Собственник ○ УК ○ Пополам |
| Интернет | ● Собственник ○ УК ○ Пополам |
| Мелкий ремонт (до X ฿) | ○ Собственник ● УК ○ Пополам |
| Крупный ремонт | ● Собственник ○ УК ○ Пополам |
| Взносы в фонд (CAM) | ● Собственник ○ УК ○ Пополам |
| Страховка | ● Собственник ○ УК ○ Пополам |
| Маркетинг/реклама | ○ Собственник ● УК ○ Пополам |

**C. Условия выплат**
- День выплаты собственнику (1–31 числа)
- Валюта (THB / USD / EUR / RUB)
- Период действия условий (дата начала / конца)

**D. Примечания**
- Свободный текст для особых условий

### 4. Портфельный вид для УК — таблица "Условия по объектам"

**Путь:** `src/pages/owner/ManagementPortfolio.tsx`

Страница `/owner/portfolio` со сводной таблицей для УК:

| Объект | Тип | Комиссия | Уборка | Ремонт | Выплата | Статус |
|---|---|---|---|---|---|---|
| Апт. 301 | % | 20% от gross | УК | Собственник | 5-е число | Активно |
| Апт. 502 | Фикс | ฿15,000/мес | Пополам | УК | 10-е | Активно |
| Вилла Sunrise | % | 30% | УК | УК | 1-е | Черновик |

- Быстрая фильтрация по статусу условий / объектам без условий
- Иконка ⚠️ на объектах, у которых условия не заданы или просрочены
- Кнопка "Задать условия" прямо из таблицы (открывает sheet)

### 5. Интеграция в Wizard добавления объекта

В шаге `basic` (BasicInfoStep), при выборе `management_type = full` или `partial`, появляется блок "Условия управления" с кратким вариантом формы:
- Комиссия %
- Кто платит уборку (самое частое)
- День выплаты

С кнопкой "Настроить подробнее" → открывает полную форму в drawer.

---

## Технические детали

### Порядок реализации

1. **Миграция БД** — создать `property_management_terms` + RLS
2. **Хук** `usePropertyManagementTerms` — CRUD + fetch для портфеля
3. **Форма** `ManagementTermsForm.tsx` — полная форма с 4 секциями
4. **Страница портфеля** `ManagementPortfolio.tsx` + маршрут `/owner/portfolio`
5. **Интеграция в BasicInfoStep** — краткая версия при добавлении объекта

### Файлы

```text
НОВЫЕ:
  supabase/migrations/...  — таблица property_management_terms + RLS
  src/hooks/usePropertyManagementTerms.ts
  src/components/owner/management/ManagementTermsForm.tsx
  src/pages/owner/ManagementPortfolio.tsx

ИЗМЕНЁННЫЕ:
  src/components/owner/property-wizard/steps/BasicInfoStep.tsx
    → добавить блок условий при management_type full/partial
  src/components/layout/AnimatedRoutes.tsx
    → маршрут /owner/portfolio
  src/components/layout/pageRegistry.ts
    → заголовок для /owner/portfolio
  src/pages/owner/OwnerDashboard.tsx (или навигация)
    → ссылка "Портфель условий" для менеджеров
```

### Безопасность (RLS)

```sql
-- Собственник видит условия своих объектов
-- Менеджер видит условия объектов, которыми управляет (через property_delegates)
-- Только менеджер или собственник могут изменять условия
```
