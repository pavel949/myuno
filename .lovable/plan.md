

## Архитектура блока Offplan — аудит

### Что сейчас есть (карта)

**Маршруты (`AnimatedRoutes.tsx`):**
- `/property/offplan` → `OffplanIndex` (каталог)
- `/property/offplan/:id` → `OffplanDetail` (страница проекта)
- Редиректы: `/offplan*` → `/property/offplan*`, `/newbuilds/projects*` → `/property/offplan*`, `/newbuilds/projects` → `/property/offplan`

**Страницы (`src/pages/property/`):**
- `OffplanIndex.tsx` (487 строк) — каталог с фильтрами OFFPLAN-стиля + БД фильтры
- `OffplanDetail.tsx` (488 строк) — деталь проекта
- Параллельно: `ProjectsIndex.tsx` + `ProjectDetail.tsx` — другой каталог тех же `property_projects`
- `DevelopersIndex.tsx`, `DeveloperDetail.tsx` — рендерят `OffplanProjectCard`

**Компоненты (`src/components/property/`):**
- `OffplanProjectCard` — карточка
- `OffplanPromoSection` — карусель для главной
- `OffplanCTASection` — CTA в `PropertySearchPage`
- Параллельно: `ProjectCard`, `ProjectCarouselCard`, `ProjectPromoSection` — те же `property_projects` под другим типом

**Данные/хуки:**
- `useOffplanProjects` (returns `OffplanProject` camelCase)
- `usePropertyProjects` (returns `PropertyProject` snake_case) — оба читают `property_projects`
- `src/lib/offplan/{types,filters}.ts` — клиентская фильтрация по `offplan_catalog` JSON

**БД (актуально):** 266 проектов, 159 активных, 118 с `offplan_catalog`, все 266 имеют `developer_id`. Юниты: 55 строк только у 3 проектов.

### Найденные проблемы

| # | Проблема | Где | Влияние |
|---|---|---|---|
| 1 | **Дублирующая модель проекта**: `OffplanProject` (camelCase) + `PropertyProject` (snake_case) на одну таблицу | `useOffplanProjects` vs `usePropertyProjects` | Два пути данных, расходящиеся типы, двойные кэш-ключи |
| 2 | **Дублирующие каталоги**: `OffplanIndex` + `ProjectsIndex` оба показывают `property_projects` | `pages/property/` | Юзер не понимает разницы, SEO-каннибализация |
| 3 | **OffplanDetail грузит весь список** (`useOffplanProjects()` без фильтра) и потом `find(id)` | `OffplanDetail.tsx:80-81` | 266 строк ради одной — медленно, лишний трафик |
| 4 | **Нет хука `useOffplanProject(id)`** — single-row fetch отсутствует | — | Деталь не может работать standalone |
| 5 | **Нет режима "Список юнитов" на детали проекта** (есть `DevelopmentUnitsSection`, но не используется в `OffplanDetail`) | `OffplanDetail` импортирован, но не отрисован | 55 юнитов в БД не видны юзеру |
| 6 | **Нет связи с `project_documents`** на публичной деталь-странице (ClearView требование) | `OffplanDetail` | ClearView-disclosure отсутствует |
| 7 | **`OffplanIndex` не использует `MiniAppLayout` + `CatalogCard`** (нарушение `canonical-catalog-and-card-standard`) | — | Расхождение со стандартом каталогов |
| 8 | **3 параллельные карточки** для одной сущности: `OffplanProjectCard`, `ProjectCard`, `ProjectCarouselCard` | `components/property/` | Изменения дизайна нужно делать в трёх местах |
| 9 | **Нет ClearView-баджа на карточке** (BUY/WATCH/AVOID есть в фильтрах, но не показано визуально) | `OffplanProjectCard` | Нарушает методологию ClearView V3 |
| 10 | **No SEO/JSON-LD на `OffplanIndex`** — есть только на детали | — | Потеря органики |

### Предлагаемые исправления

**Фаза 1. Cleanup дублирования (без визуальных изменений)**
- Удалить orphan `ProjectsIndex.tsx` + `ProjectDetail.tsx` (или сделать редиректы на `/property/offplan*`).
- Удалить `ProjectCard` + `ProjectCarouselCard` + `ProjectPromoSection`. Везде использовать `OffplanProjectCard` + `OffplanPromoSection`.
- Свести `usePropertyProjects` и `useOffplanProjects` к одному источнику: `useOffplanProjects` остаётся публичным каталогом, `usePropertyProject(id)` добавляется для одиночного fetch. `usePropertyProjects` оставить только для админа (`useAdminPropertyProjects`).

**Фаза 2. Performance + Detail полнота**
- Добавить `useOffplanProject(id)` (single-row, with developers embed) и заменить `find()` в `OffplanDetail`.
- Подключить `DevelopmentUnitsSection` в `OffplanDetail` (показ `project_units`).
- Подключить публичные `project_documents` (фильтр по `is_public=true`) в новую вкладку "Документы" + ClearView disclosure для брокерских проектов.

**Фаза 3. ClearView UI**
- Показать BUY/WATCH/AVOID badge на карточке (берём из `offplan_catalog.rec` или fallback на `risk_level`).
- Показать "Not ClearView rated" для брокерских (PEYLAA, Siamese Bangtao, Nunyan) согласно core memory.
- Добавить колонку `is_clearview_rated` в `property_projects` если её нет (миграция).

**Фаза 4. Стандартизация**
- Опционально: перевести `OffplanIndex` на `MiniAppLayout + CatalogCard` (большая правка — отдельным шагом).
- SEO: добавить `SEOHead` + breadcrumb schema на `OffplanIndex`.

### Технический порядок имплементации

1. Миграция: `is_clearview_rated boolean` + флаги для брокерских проектов.
2. Хуки: `useOffplanProject(id)`, рефакторинг `usePropertyProjects` (admin-only).
3. `OffplanDetail`: переход на `useOffplanProject`, +`DevelopmentUnitsSection`, +вкладка Documents, +ClearView disclosure.
4. `OffplanProjectCard`: BUY/WATCH/AVOID badge + "Not ClearView rated".
5. Удалить `ProjectsIndex/ProjectDetail/ProjectCard/ProjectCarouselCard/ProjectPromoSection`, заменить usages.
6. SEO на `OffplanIndex`.
7. E2E проверка: каталог → детали → юниты → документы → лид.

### Уточняющий вопрос

Что делаем сейчас — все 4 фазы последовательно или начнём с критичных (Фазы 1–3, без MiniAppLayout-рефакторинга)?

