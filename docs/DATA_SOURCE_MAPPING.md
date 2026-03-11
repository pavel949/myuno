# Связность данных: откуда брать данные

Единый источник правды по таблицам для админки, каталога, модерации и дашборда.

---

## 1. Каталог и модерация (единый источник)

| Сущность | Таблица | Ключ/фильтр | Примечание |
|----------|---------|-------------|------------|
| **Листинги** (яхты, рестораны, туры, клиники, транспорт, образование, уборка, няни, пет-сервис, цветы и т.д.) | `listings` | `vertical` = yacht, restaurant, experience, clinic, vehicle, education, cleaning, babysitter, pet_service, bouquet, bank | Единая таблица. Представления `restaurants`, `yachts`, `clinics`, `experiences`, `vehicles`, `education_centers`, `babysitters`, `cleaning_providers`, `pet_services`, `banks`, `tours` — это VIEW над `listings`. |
| **Недвижимость** | `properties` | — | Отдельная таблица, не в listings. |
| **Услуги (домашние)** | `services` | — | Услуги провайдеров (клининг по названию, ремонт и т.д.). |
| **Товары маркета** | `marketplace_products` | — | Магазин. |

**Модерация:** счётчик «нуждаются во внимании» = `listings.approval_status = 'pending'` + `properties.approval_status = 'pending'`. Очередь модерации должна запрашивать те же таблицы с фильтром по pending (см. OperationsModerationTab).

---

## 2. Дашборд админа (useAdminDashboardStats)

- **pendingContent** (счётчик «На модерации»): только `listings` + `properties` с `approval_status = 'pending'`. Не смешивать с services/products.
- **Вертикали из listings:** yachts, tours, restaurants, clinics, vehicles, education, pets, cleaning, babysitters считаются по `listings.vertical`.
- **Отдельные таблицы (не в listings):** salons, gyms, events, water_activities, flower_shops, marketplace_products (stores), insurance_plans — считаются из своих таблиц. Цветы: в useCategoryCounts — из `listings` (vertical=bouquet); в дашборде — из `flower_shops`. При желании унифицировать «цветы» — брать один источник (например listings.vertical=bouquet, если все цветы перенесены).

---

## 3. Где что читать/писать

| Фича | Читать из | Писать в |
|------|-----------|----------|
| Единый каталог (UnifiedCatalogTable) | `listings`, `services`, `marketplace_products`, `properties` (useUnifiedCatalog) | Те же таблицы при bulk update/delete |
| Очередь модерации | `listings` (pending), `properties` (pending), `services` (is_active=false), `marketplace_products` (is_active=false) | При одобрении: `listings`/`properties` — approval_status + is_active; services/products — is_active |
| Рестораны (страницы, карта, админка качества) | VIEW `restaurants` (= listings WHERE vertical='restaurant') | Обновления в `listings` (id совпадает с id во view) |
| Салоны/красота (карта, админка) | Таблица `salons` | `salons` |
| Life OS каталог (life_os_catalog) | VIEW объединяет listings + properties + events + water_activities + gyms + salons + legal_services + flower_shops + insurance_providers + cleaning_services + babysitters + pet_services + airport_services | — |
| Счётчики категорий (useCategoryCounts) | `listings` (по vertical), `properties`, `services`, `events`, `gyms` | — |

---

## 4. Проверки при добавлении фич

- Новый вертикаль в каталоге (например «красота» в listings): добавлять в `listings` с полем `vertical`, не создавать новую таблицу без необходимости.
- Модерация: при добавлении нового типа контента добавлять его в OperationsModerationTab и в расчёт pendingContent, если он должен попадать в «нуждаются во внимании».
- Чтение ресторанов/яхт/клиник: можно использовать view `restaurants`/`yachts`/`clinics` для совместимости; под капотом это `listings`. Запись — только в `listings`.
