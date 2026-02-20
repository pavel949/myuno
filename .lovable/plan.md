

# Полная диагностика LifeOS: маршрутизация, семантика, обогащение данных

## Найденные проблемы

### A. Семантика: больницы на странице "Прилёт"

В базе данных `catalog_life_map` для ситуации `arrival` привязаны 2 клиники с высокими весами:
- **Bangkok Hospital Phuket** — вес 85
- **Phuket International Hospital** — вес 78

Это выше, чем у ресторанов (50-60), событий (45) и салонов (48). Поэтому клиники отображаются на видном месте второй секцией после трансферов.

**Решение:** Понизить вес клиник в ситуации `arrival` до 35-40 (справочная информация, а не основное предложение). Человек прилетел — ему нужны трансферы, жильё, впечатления, рестораны, а не больницы.

### B. Пустые карточки — отсутствие обогащения данных

В `useEnrichCatalogItems.ts` TABLE_CONFIG содержит только 11 типов, но в каталоге используется 20 типов. Для 9 типов карточки отображаются пустыми (без изображений, рейтингов):

| entity_type | Таблица в БД | Статус |
|-------------|-------------|--------|
| transfer | `transfers` | Не в TABLE_CONFIG |
| airport_service | `airport_services` | Не в TABLE_CONFIG |
| event | `events` | Не в TABLE_CONFIG |
| water_activity | `water_activities` | Не в TABLE_CONFIG |
| flower_shop | `flower_shops` | Не в TABLE_CONFIG |
| cleaning | `cleaning_services` | Не в TABLE_CONFIG |
| pet_service | `pet_services` | Не в TABLE_CONFIG |
| marketplace_product | `marketplace_products` | Не в TABLE_CONFIG |
| insurance | Нет таблицы | Отфильтровать |
| page | Нет таблицы | Отфильтровать |

### C. Ошибки 404 при клике на карточки

1. **transfer** — маршрут `/transport/airport-transfer`, клик ведёт на `/transport/airport-transfer/UUID` — нет такой страницы. Нужен маршрут `/transfer` (landing есть).
2. **airport_service** — аналогично, ведёт на `/transport/airport-transfer/UUID` — 404.
3. **page** — маршрут `/`, клик ведёт на `/UUID` — 404.
4. **vehicle** в Избранном — ведёт на `/transport/ID` вместо `/transport/vehicle/ID`.
5. **yacht** и **salon** в Избранном — отсутствуют в карте маршрутов.

### D. Отсутствие детальных страниц для трансферов

Существует только landing `/transfer` (AirportTransferLanding), но нет маршрута `/transfer/:id` для просмотра конкретного трансфера. Клик на карточку трансфера должен вести на landing трансферов.

---

## План исправлений

### 1. База данных: исправить семантику маппингов arrival

Обновить веса в `catalog_life_map`:
- Клиники в `arrival`: снизить с 85/78 до 35 (справочно, внизу списка)
- Это сразу уберёт больницы с видного места на странице "Прилёт"

### 2. `src/hooks/useEnrichCatalogItems.ts` — добавить 7 типов в TABLE_CONFIG

| entity_type | table | nameEn | nameRu | coverImage | rating | reviewCount |
|-------------|-------|--------|--------|------------|--------|-------------|
| transfer | transfers | name_en | name_ru | cover_image | rating | review_count |
| event | events | title_en | title_ru | cover_image | -- | -- |
| water_activity | water_activities | title_en | title_ru | cover_image | -- | -- |
| flower_shop | flower_shops | name_en | name_ru | cover_image | rating | review_count |
| cleaning | cleaning_services | name_en | name_ru | cover_image | rating | review_count |
| pet_service | pet_services | name_en | name_ru | cover_image | rating | -- |
| marketplace_product | marketplace_products | name_en | name_ru | cover_image | rating | review_count |

### 3. `src/components/life-flow/LifeFlowCatalogGrid.tsx` — фильтрация нерендерабельных типов

Исключить из отображения `entity_type` для которых нет таблиц или детальных страниц:
- `page` — это не карточка каталога
- `insurance` — нет таблицы для обогащения
- `airport_service` — нет детальной страницы, это часть booking-flow трансферов

### 4. `src/lib/config/entityTypes.ts` — исправить маршруты

- `transfer.route`: `/transport/airport-transfer` --> `/transfer`
- `airport_service.route`: `/transport/airport-transfer` --> `/transport/airport-transfer` (оставить, но не рендерить карточки)

### 5. `src/pages/Favorites.tsx` — исправить навигацию

- `vehicle`: `/transport/${id}` --> `/transport/vehicle/${id}`
- Добавить `yacht`: `/yachts/${id}`
- Добавить `salon`: `/beauty/${id}`
- Добавить `experience`: `/experiences/${id}`
- Добавить `transfer`: `/transfer`
- Добавить `flower_shop`: `/flowers/${id}`

---

## Итог изменений

| Файл | Что меняется |
|------|-------------|
| SQL миграция | Обновить веса клиник в arrival (85/78 --> 35) |
| `useEnrichCatalogItems.ts` | +7 типов в TABLE_CONFIG |
| `LifeFlowCatalogGrid.tsx` | Фильтрация page, insurance, airport_service |
| `entityTypes.ts` | transfer.route --> `/transfer` |
| `Favorites.tsx` | Исправить vehicle, добавить yacht/salon/experience/transfer/flower_shop |

