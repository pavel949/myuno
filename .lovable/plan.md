
# Fix: 404 ошибки в Избранном и пустые карточки в LifeOS

## Найденные проблемы

### 1. Ошибки 404 при переходе из Избранного
В файле `Favorites.tsx` маршруты для навигации по карточкам содержат ошибки:
- **vehicle** ведёт на `/transport/ID` вместо `/transport/vehicle/ID`
- **yacht** и **salon** вообще отсутствуют в карте маршрутов — клик ничего не делает

### 2. Ошибки 404 в LifeOS (каталог LifeFlow)
В файле `entityTypes.ts` маршруты для некоторых типов сущностей некорректны:
- **transfer** имеет маршрут `/transport/airport-transfer`, а карточки навигируют на `/transport/airport-transfer/UUID` — такой страницы не существует (это и вызывает ошибку 404 из логов)
- **page** имеет маршрут `/` — карточки ведут на `/UUID`

### 3. Пустые карточки в LifeOS
В файле `useEnrichCatalogItems.ts` отсутствуют конфигурации для обогащения данных:
- **transfer** — нет в TABLE_CONFIG, поэтому карточки трансферов отображаются без изображений и названий
- **page** — аналогично, пустые карточки

---

## План исправлений

### Файл 1: `src/pages/Favorites.tsx`
Исправить карту маршрутов `handleNavigate`:
- `vehicle` --> `/transport/vehicle/ID`
- Добавить `yacht` --> `/yachts/ID`
- Добавить `salon` --> `/beauty/salon/ID`

### Файл 2: `src/lib/config/entityTypes.ts`
Исправить маршруты для корректной навигации по карточкам:
- `transfer.route` --> `/transfer` (отдельная landing-страница для трансферов)
- Карточки трансферов не должны навигировать на `/transport/airport-transfer/UUID`

### Файл 3: `src/hooks/useEnrichCatalogItems.ts`
Добавить конфигурации в TABLE_CONFIG:
- **transfer** --> таблица `transfer_vehicles`, поля `name_en`, `name_ru`, `cover_image`
- Проверить наличие таблицы в БД

### Файл 4: `src/components/life-flow/LifeFlowCatalogGrid.tsx`
Добавить фильтрацию entity_type `page` — эти элементы не являются карточками каталога и не должны отображаться в сетке.

---

## Технические детали

| Файл | Изменение |
|------|-----------|
| `src/pages/Favorites.tsx` | Исправить vehicle route, добавить yacht + salon |
| `src/lib/config/entityTypes.ts` | Исправить transfer.route на `/transfer` |
| `src/hooks/useEnrichCatalogItems.ts` | Добавить transfer в TABLE_CONFIG |
| `src/components/life-flow/LifeFlowCatalogGrid.tsx` | Отфильтровать entity_type === 'page' |

Перед реализацией проверю структуру таблицы `transfer_vehicles` в базе данных.
