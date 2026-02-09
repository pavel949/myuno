

## Проблема

Три разрыва в UX собственника недвижимости:

1. **На главной странице** (QuickActionsGrid, роль Owner) — нет прямой кнопки "Мои объекты" ведущей в /owner dashboard. Текущие OWNER_ACTIONS ведут на сторонние сервисы, но не в собственный модуль управления.

2. **Страница Life Situation "Недвижимость"** (/life/property) — внизу захардкожены "Забронировать трансфер" и "Trip Planner", что не имеет отношения к управлению недвижимостью. Вместо них нужны операционные действия собственника.

3. **Нет моста** между Life OS ситуацией "property" и реальными микро-задачами собственника: check-in/check-out, клининг, счётчики, налоги, депозиты — всё это существует в /owner/*, но не видно из Life OS.

---

## Решение (3 изменения)

### 1. Добавить "Мои объекты" в OWNER_ACTIONS (QuickActionsGrid)

Файл: `src/components/home/QuickActionsGrid.tsx`

Первый элемент в OWNER_ACTIONS станет прямой вход в Owner Dashboard:

```text
OWNER_ACTIONS (было):
  Services -> /services
  Management -> /services?category=property-management
  Rental -> /property
  Legal, Insurance, Cleaning

OWNER_ACTIONS (станет):
  My Properties -> /owner           <-- НОВЫЙ, первый приоритет
  Calendar -> /owner/calendar
  Services -> /services
  Rental -> /property
  Legal -> /legal
  Cleaning -> /cleaning
```

Это гарантирует: при переключении роли на Owner — первая кнопка на главной = вход в полный модуль управления.

---

### 2. Заменить хардкод на LifeFlowPage для ситуации "property"

Файл: `src/pages/LifeFlowPage.tsx`

Сейчас в конце страницы захардкожены 2 карточки (Transfer + Trip Planner) для ВСЕХ ситуаций. Нужна контекстная логика:

- Если `code === 'property'` — показать операционные карточки собственника:
  - "Управление объектами" -> /owner
  - "Добавить объект" -> /owner/properties/new
  - "Заказать уборку" -> /owner/service-request?type=cleaning
  - "Календарь бронирований" -> /owner/calendar
  - "Финансы и расходы" -> /owner/financials

- Для всех остальных ситуаций — оставить текущие карточки (Transfer + Trip Planner)

Это свяжет Life OS с реальным функционалом Owner-модуля.

---

### 3. Обновить сценарий "property.management" в Life OS

Текущие задачи в базе:
- property.management.maintenance — "Обслуживание недвижимости"
- property.management.rental_mgmt — "Управление арендой"

Этого мало. Нужно добавить жизненные задачи, которые уже реализованы в приложении:

| Задача | Маршрут в приложении |
|--------|---------------------|
| Check-in / Check-out гостей | /owner/operations |
| Уборка и клининг | /owner/service-request?type=cleaning |
| Показания счётчиков (вода, электричество) | /owner/properties/:id/manage |
| Депозиты и залоги | /owner/financials |
| Налоги на недвижимость | /owner/financials |
| Инспекция объекта | /owner/inspection |
| Канал-менеджер (OTA) | /owner/channels |
| Отчёты о доходах | /owner/reports |

Это добавление через SQL-миграцию в таблицу `life_tasks` со связкой к сценарию `property.management`.

---

## Техническая сводка

| Файл | Изменения |
|------|-----------|
| `src/components/home/QuickActionsGrid.tsx` | OWNER_ACTIONS: добавить "My Properties" -> /owner как первый элемент, заменить "Management" на "Calendar" |
| `src/pages/LifeFlowPage.tsx` | Контекстная логика: для `code === 'property'` — показать операционные карточки собственника вместо Transfer/Trip Planner |
| SQL миграция | Добавить ~6 life_tasks к сценарию property.management (check-in, cleaning, meters, deposits, taxes, inspection) |

**Итого: 2 файла + 1 миграция. Собственник получает прямой доступ ко всем своим инструментам и с главной страницы, и через Life OS.**
