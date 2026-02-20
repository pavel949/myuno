
# Агентская CRM для Управляющих Компаний

## Контекст

Многие УК на Пхукете начинали как агенты по продаже недвижимости. Продав квартиры, они стали управлять ими. Сейчас в системе есть:
- `management_companies` -- профили УК
- `management_company_members` -- команда УК (owner, admin, member)
- `properties` -- объекты с `listing_type` (rent/sale) и `management_company_id`
- `consultation_requests` -- лиды (property_tour, investment_advice, etc.)
- `lead_activity_log` -- история действий по лидам

Чего **нет**: инструментов для самих УК, чтобы управлять продажами. Вся работа с лидами сейчас только в админке myUNO.

## Архитектурное решение

Не создавать отдельную "агентскую" роль. Вместо этого -- расширить Owner Hub (`/owner`) модулем **Sales Pipeline**, доступным членам УК. Это логично, потому что:

1. УК уже привязаны к объектам через `management_company_id`
2. Команда УК уже существует в `management_company_members`
3. Те же люди управляют и арендой, и продажами

## Что будет создано

### 1. Таблица `agent_deals` -- Сделки/Воронка продаж

Центральная сущность агентского модуля. Каждая сделка -- это путь клиента от первого контакта до закрытия.

| Поле | Тип | Назначение |
|------|-----|-----------|
| id | uuid | PK |
| company_id | uuid | FK на management_companies |
| agent_id | uuid | Ответственный агент (user_id из members) |
| property_id | uuid | Привязка к объекту (nullable -- может быть без конкретного объекта) |
| client_name | text | Имя клиента |
| client_phone | text | Телефон |
| client_email | text | Email |
| client_source | text | Откуда пришёл (website, referral, walk-in, social_media) |
| stage | text | Этап воронки: new, contacted, showing, negotiation, contract, closed_won, closed_lost |
| budget_min / budget_max | numeric | Бюджет клиента |
| currency | text | Валюта |
| preferred_districts | text[] | Желаемые районы |
| preferred_types | text[] | Типы недвижимости |
| bedrooms_min | int | Мин. спален |
| notes | text | Заметки агента |
| next_action | text | Следующий шаг |
| next_action_date | timestamptz | Когда |
| deal_value | numeric | Сумма сделки |
| commission_percent | numeric | Процент комиссии |
| commission_amount | numeric | Сумма комиссии |
| closed_at | timestamptz | Дата закрытия |
| lost_reason | text | Причина проигрыша |

RLS: доступ только членам своей УК через `management_company_members`.

### 2. Таблица `agent_deal_activities` -- История действий

| Поле | Тип | Назначение |
|------|-----|-----------|
| id | uuid | PK |
| deal_id | uuid | FK на agent_deals |
| user_id | uuid | Кто сделал |
| activity_type | text | call, meeting, showing, message, note, stage_change |
| description | text | Описание |
| stage_from / stage_to | text | При смене этапа |

### 3. UI: Страницы в Owner Hub

#### 3.1 `/owner/sales` -- Sales Pipeline (главная страница)

- Kanban-доска с колонками по этапам (new -> contacted -> showing -> negotiation -> contract -> closed)
- Переключатель Kanban / Список
- Счётчики: общий объём, конверсия, средний цикл
- Фильтры: по агенту, району, бюджету
- Быстрое создание сделки (+ кнопка)

#### 3.2 `/owner/sales/:id` -- Карточка сделки

- Профиль клиента (имя, контакты, источник)
- Текущий этап с кнопками перехода
- Подходящие объекты из портфолио УК (автоподбор по бюджету/району/типу)
- Лента активности (звонки, показы, заметки)
- Быстрые действия: "Записать звонок", "Назначить показ", "Добавить заметку"

#### 3.3 `/owner/sales/analytics` -- Аналитика продаж

- Конверсия по этапам (воронка)
- Объём сделок по месяцам
- Топ-агенты по закрытым сделкам
- Источники клиентов (pie chart)

### 4. Интеграция с существующим

- **Навигация**: добавить "Sales" в `OwnerDashboardMenu` и `OwnerSidebar`
- **Dashboard**: виджет "Active Deals" на `OwnerDashboard` (количество сделок по этапам)
- **Properties**: на карточке объекта -- бейдж "For Sale" и количество активных сделок
- **consultation_requests**: автоматическое создание deal из лидов типа `property_tour` и `investment_advice`, если привязаны к УК

### 5. Права доступа

- `company_id` + `management_company_members` -- основа RLS
- Роль `owner` в members видит все сделки компании
- Роль `member` видит только свои сделки (где agent_id = auth.uid())
- Роль `admin` видит все + может переназначать

## Порядок реализации

Рекомендую разбить на 3 фазы:

**Фаза 1 -- MVP** (этот план):
- Таблицы agent_deals + agent_deal_activities
- Страница Pipeline (список + создание/редактирование)
- Карточка сделки с лентой активности
- Виджет на Dashboard

**Фаза 2 -- Продвинутые инструменты**:
- Kanban-доска с drag-and-drop
- Автоподбор объектов по критериям клиента
- Аналитика продаж с графиками

**Фаза 3 -- Автоматизация**:
- Авто-создание сделок из входящих лидов
- Напоминания о follow-up
- WhatsApp-интеграция для уведомлений агентов

## Итого: затронутые файлы

| Файл | Изменение |
|------|----------|
| SQL миграция | Создание agent_deals, agent_deal_activities + RLS |
| `src/hooks/useAgentDeals.ts` | Новый -- CRUD для сделок |
| `src/hooks/useAgentDealActivities.ts` | Новый -- активности сделок |
| `src/pages/owner/SalesPipeline.tsx` | Новый -- список/воронка |
| `src/pages/owner/SalesDealDetail.tsx` | Новый -- карточка сделки |
| `src/components/owner/sales/*` | Новые -- компоненты pipeline |
| `src/components/owner/dashboard/ActiveDealsWidget.tsx` | Новый -- виджет на dashboard |
| `src/components/owner/OwnerSidebar.tsx` | + пункт Sales |
| `src/components/owner/dashboard/OwnerDashboardMenu.tsx` | + пункт Sales |
| `src/pages/owner/OwnerDashboard.tsx` | + виджет ActiveDeals |
| `App.tsx` | + маршруты /owner/sales, /owner/sales/:id |
