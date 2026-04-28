# Phase 6 — Frontend ↔ Backend Sync (Master Taxonomy v1.0)

## Что обнаружено

**База данных** уже содержит всё нужное:

| Таблица | Записей | Что хранит |
|---|---|---|
| `category_groups` | 15 | Кластеры/группы (включая 6 surfaces: arrive/live/manage/invest/legal/build + 9 sub-групп) |
| `categories` | 55 | Сервисы/категории с `slug`, `name_en/ru`, `icon`, `color`, `mini_app_type`, `group_id` |
| `lookup_values` | 406 | Таксономии (типы, районы, удобства) |
| `taxonomy_definitions` | 41 | Метаданные таксономий |
| `service_jtbd_clusters` | 56 | **Master Taxonomy bridge** — service → JTBD A..J (создан в Phase 4) |
| `cluster_life_situations` | 11 | LifeOS контекст |

**Фронтенд** же читает каталог из **двух источников одновременно**:

1. ✅ `useCategories()` (DB-driven, react-query, кешируется) — используется в админке, поиске, prefetch.
2. ❌ Хардкод TS-каталог `src/lib/catalog/taxonomy.ts` (580 строк, 6 кластеров × 16 категорий × ~80 сервисов) — это **то, что реально рендерится** в:
   - `AppDrawer` (главное левое меню)
   - `AllAppsDrawer` (мобильный bottom-sheet «Apps»)
   - `ServiceClusterAccordion` (главный аккордеон сервисов)
   - `NavigatorPage`, `ClusterGrid`, `AllSectionsAccordion`
   - `ClusterBreadcrumb`, `PersonaHalo`
   - `WelcomeLanding`, `roleBlend`, `routeRegistry`

**Итог:** что бы админ ни менял в БД (категории/кластеры/иконки/sort), пользователь видит хардкод. Это именно то, на что жалуется пользователь.

Дополнительно: JTBD-теги (`service_jtbd_clusters`), persona-маппинг (`master.ts` P01–P25) и ClearView AAA–CCC сидят в БД/типах, но фронт их не использует для фильтрации/выдачи.

## Цель

Один источник — БД. TS-каталог становится **fallback-only** (на случай оффлайна/первой загрузки), не SSOT. Любое изменение в `categories` / `category_groups` / `service_jtbd_clusters` сразу видно пользователю.

## План работ

### Шаг 1 · Расширить DB-схему
- Добавить колонки в `categories`: `jtbd_clusters jtbd_cluster[]`, `persona_codes app_persona[]`, `is_new boolean`, `is_hot boolean` (последние два уже есть).
- Добавить в `category_groups`: `is_surface boolean` (отметить 6 канонических Surfaces) + `surface_id text` (один из `arrive/live/manage/invest/legal/build`).
- Backfill: проставить `is_surface=true` для 6 записей; распределить остальные 9 sub-групп по surface (`home-living`/`transport`→`arrive` и т.п.).

### Шаг 2 · Сидинг недостающих сервисов
- Сейчас в `categories` — 55, а в TS-каталоге ~80. Найти разницу и засеять недостающие (yacht, fast-track, sim, exchange, wedding, kids, halal etc.) в `categories` со ссылкой на правильный `group_id`.
- Перенести `path` (URL мини-аппа) в новую колонку `categories.app_path text` — сейчас он строится через хардкод `pathMap` в `useCategories.ts`.

### Шаг 3 · Новый централизованный hook
Создать `src/lib/catalog/useCatalogFromDB.ts`:
- Возвращает ту же форму, что отдаёт `clusterCatalog.ts` (`CLUSTER_CATALOG`, `ClusterCatalogEntry`, `ServiceEntry`).
- Источник: `category_groups` + `categories` + `service_jtbd_clusters` (JOIN на клиенте через react-query, кеш 10 мин).
- Хардкод `taxonomy.ts` остаётся как **fallback**: если query ещё loading или error → отдаём statics.
- Типы остаются те же → downstream-компоненты не меняются по контракту.

### Шаг 4 · Миграция потребителей
Заменить импорты `CLUSTER_CATALOG` / `getClusterById` / `filterCatalogForUser` со static на хук в 12 компонентах:
- `AppDrawer.tsx`, `AllAppsDrawer.tsx`, `ServiceClusterAccordion.tsx`
- `NavigatorPage.tsx`, `ClusterGrid.tsx`, `AllSectionsAccordion.tsx`
- `ClusterBreadcrumb.tsx`, `PersonaHalo.tsx`
- `routeRegistry.ts`, `roleBlend.ts`, `useClusterActivity.ts`, `WelcomeLanding.tsx`

Static `clusterCatalog.ts` помечается `@deprecated` и сохраняется как fallback для SSR/первой загрузки.

### Шаг 5 · JTBD + Persona фильтрация в выдаче
- В `AllAppsDrawer` и `ServiceClusterAccordion` добавить опциональный фильтр по JTBD-кластеру и persona (читает `service_jtbd_clusters` и `categories.persona_codes`).
- Главная страница (`Home`) — Proactive AI Concierge уже использует persona; добавить чтение `getServicesByJtbd()` для подсказок.

### Шаг 6 · Admin UI для каталога
В `/admin/categories` (если уже есть) или новый `/admin/catalog`:
- CRUD по `category_groups` и `categories`.
- Multi-select для `jtbd_clusters` (A..J) и `persona_codes` (P01..P25).
- Toggle `is_active`, `is_new`, `is_hot`.
- Drag-n-drop sort.

Без этого админ не сможет управлять каталогом, и мы вернёмся к хардкоду.

### Шаг 7 · Тесты + smoke
- Обновить `src/test/catalog/taxonomy-coverage.test.ts` — теперь сверяет static fallback с DB (snapshot-стиль).
- Smoke в браузере: `/`, `/discover`, открыть AppDrawer, открыть AllAppsDrawer, проверить, что 6 surfaces + сервисы рендерятся из DB (через React Query DevTools).

## Технические детали

**Контракт хука:**
```ts
const { catalog, isLoading, isFromDB } = useCatalogFromDB();
// catalog: ClusterCatalogEntry[]  — та же форма, что у статика
// isFromDB: false → отдан static fallback
```

**Миграция (1 файл):** `ALTER TABLE categories ADD COLUMN jtbd_clusters jtbd_cluster[] DEFAULT '{}', ADD COLUMN persona_codes app_persona[] DEFAULT '{}', ADD COLUMN app_path text;` + аналогично для `category_groups`. + UPDATE-ы для backfill (через insert tool).

**Изменяемые файлы (~14):**
- 1 миграция (схема)
- 1 insert (сидинг данных + JTBD-теги)
- 1 новый хук `useCatalogFromDB.ts`
- 1 обновлённый `useCategories.ts` (deprecate path-map, читать из колонки)
- 12 потребителей (точечные замены импортов, контракт сохраняется)
- 1 `clusterCatalog.ts` → `@deprecated` баннер
- 1 admin страница (опц., можно в отдельном PR)
- 2 теста

**Что НЕ трогаем:**
- TS типы `ClusterCatalogEntry`, `ServiceEntry` — стабильны.
- Маршрутизация (`APP_ROUTES`) — без изменений.
- Master Taxonomy `master.ts` — без изменений.
- Дизайн / UI — без изменений.

## Риски

- **Регрессия в навигации:** если query упадёт без fallback — пустое меню. Mitigation: статик-fallback всегда отдаётся при `isLoading || error`.
- **Гонка данных:** новый сервис в БД появится с задержкой кеша 10 мин. Mitigation: `queryClient.invalidateQueries(['catalog'])` после CRUD в админке.
- **Иконки:** в БД хранится строка (`icon text`), на фронте маппим в `LucideIcon`. Если admin введёт несуществующее имя — показываем `Package` placeholder.

## Ожидаемый эффект

- Любое изменение каталога в БД сразу отражается у всех пользователей.
- JTBD/Persona-таргетинг становится живым (AI-роутер, фильтры, лендинги).
- Готовый фундамент для admin-UI каталога (без новых хардкодов).
- Static `clusterCatalog.ts` ужмётся до ~50 строк fallback-данных вместо 200.
