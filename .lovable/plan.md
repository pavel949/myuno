

# Аудит каталога услуг и план приведения к одному источнику истины

## Что я нашёл (текущее состояние)

В коде сейчас живут **6 параллельных каталогов**, каждый со своей моделью группировки. Это и есть «разноголосица» на сайте.

### 1. Канонические документы (источник стратегии — но не подключены к коду)
- `docs/canonical/02-service-catalogue-v2.md` — **16 категорий × 230 услуг × 10 кластеров (A–J)**
- `docs/canonical/01-segmentation-framework.md` — 25 персон, lifecycle stages

### 2. Что реально рендерится в UI (6 разных моделей)

| Файл / источник | Группировка | Кол-во групп | Где используется |
|---|---|---|---|
| `src/lib/verticalGroups.ts` | `arrive · live · enjoy · health · settle · invest · maintain · help` | **8 групп** | `/discover` (Discover.tsx), CompactFooter, AllServicesGrid, vendor onboarding |
| `src/lib/nav/clusterCatalog.ts` (`CLUSTER_CATALOG`) | `arrive · live · enjoy · legal · invest · family · manage · build` | **8 кластеров** (другие имена!) | AppDrawer, AllAppsDrawer, NavigatorPage, **Home `ClusterGrid`** |
| `src/lib/appRegistry.ts` (`APP_REGISTRY`) | 8 journey + 11 legacy = **19 `groupId`** | каждое приложение имеет `groupId` И `clusterIds[]` (часто рассинхронизированы) | Quick actions, иконки в хедере |
| `src/lib/verticals.ts` (`VERTICALS`) | 20 бизнес-вертикалей (без группировки) | 20 | Бронирования, БД-таблицы, orders |
| **БД: `category_groups` + `categories`** | `home-living · transport · leisure · health-wellness · life-admin · home-maintenance · professional` | **9 групп / 39 категорий** (ещё `kids-education` дубликат, `professional` пустая) | `/catalog`, `useCategories`, vendor-каталог, поставщики |
| **БД: `life_situations` + `catalog_life_map`** | `arrival · business · …` (20 ситуаций, 391 mapping) | 20 | LifeOS — `/admin/life-situations`, `LifeOSStatusBlock`, `ContextualHeader` |

### 3. Несоответствия, которые видит пользователь
- На главной (`/`) `ClusterGrid` показывает **8 кластеров** Catalog, а в подвале сайта — **другие 8 групп** Vertical Groups (`enjoy` vs `leisure`, `family` vs `health`, и т.д.).
- В `/discover` каталог из `VERTICAL_GROUPS` (8), в шторке «все приложения» — `CLUSTER_CATALOG` (8), а в `/catalog` — данные из БД (9 групп / 39 категорий).
- LifeOS жизненные ситуации (20 в БД) **никак не связаны** с 8 кластерами CLUSTER_CATALOG и с 16 категориями canonical-документа.
- В `appRegistry` каждое приложение лежит в одном `groupId` и в массиве `clusterIds[]` — эти два поля противоречат друг другу (например, `restaurant.groupId='leisure'`, но `clusterIds=['live','enjoy']`).
- В БД категория `education` (`is_active=false`) дублирует `education-expat`, а группа `professional` существует и пустая.

### 4. Сводка дубликатов / расхождений по таксономии
- 4 разных набора имён для «одной и той же» сущности: `enjoy ⟷ leisure ⟷ Развлечения ⟷ Tourism & Activities`
- 4 разных каталога услуг (canonical doc, verticalGroups, clusterCatalog, БД) — ни один не равен другому.
- 20 жизненных ситуаций живут в БД, но кластеров в коде только 8 — между ними нет таблицы соответствий.

---

## Что предлагается сделать (план в 4 шага, 1 PR на шаг)

### Шаг 1 · Зафиксировать SSOT-таксономию (1 файл, без UI-изменений)

Создать **`src/lib/catalog/taxonomy.ts`** — единственный источник истины с 3 уровнями:

```text
Cluster (6–8)  ─►  Category (16, из canonical-doc)  ─►  Service/App (≈230)
       │
       └──────►  LifeSituation[] (М:М, 20 из БД)
```

- Кластеры сводятся к **6 каноническим** (PROJECT.md §1.5): `Arrive · Live · Manage · Invest · Legal · Build`. Текущие `enjoy/family/health/maintain/help` распределяются по ним без потери услуг.
- 16 категорий берутся напрямую из `02-service-catalogue-v2.md`.
- Каждый сервис описывается полями: `id, route, vertical?, categoryId, clusterIds[], lifeSituations[], status, persona[], bookable, label{ru,en,th}, icon`.
- Старые файлы (`verticalGroups.ts`, `clusterCatalog.ts`, `appRegistry.ts`) оставляются как **тонкие адаптеры** над новым SSOT — никаких поломок UI на этом шаге.

Также появляются helper'ы: `getServicesByCluster`, `getServicesByCategory`, `getServicesByLifeSituation`, `getCategoriesByCluster`, `flatServices`, `availableServices`.

### Шаг 2 · Привести БД к таксономии

Миграция:
1. `category_groups` пересоздаётся в 6 кластеров (slug = SSOT cluster id), `is_active=false` для устаревших.
2. `categories` приводятся к 16 каноническим категориям; дубликат `education` (неактивный) удаляется, пустой `professional` тоже.
3. Добавляется таблица `cluster_life_situations (cluster_id, life_situation_id)` — М:М связь.
4. Существующие 391 mapping в `catalog_life_map` сохраняются — добавляем им `category_id` (через FK на `categories`).
5. Lint и проверка: после миграции `category_groups → categories → catalog_life_map` дают связную карту.

### Шаг 3 · Перевести UI на SSOT

Один за другим (можно мерджить раздельно):

1. **Главная** — `ClusterGrid`, `AllSectionsAccordion`, `CategoryGrid` читают из `getClustersForHome()` SSOT.
2. **/discover** — `VERTICAL_GROUPS` заменяется на `getCategoriesByCluster()`.
3. **AppDrawer / AllAppsDrawer / NavigatorPage** — `CLUSTER_CATALOG` заменяется на тот же SSOT (фильтрация по `audience` сохраняется).
4. **Footer** — берёт первые 6 кластеров SSOT.
5. **/catalog (PlatformCatalog)** — переходит с `useCategories()` (raw БД) на `useTaxonomy()` (SSOT + БД-fallback).
6. **LifeOS** — `LifeOSStatusBlock` и `ContextualHeader` начинают подсвечивать кластер для активной ситуации (через `cluster_life_situations`).
7. **Vendor onboarding `CategoryPicker`** — категории = 16 канонических, не «8 групп журней».

После шага 3 в коде только **один способ** ответить на вопрос «к какому кластеру / категории / ситуации относится сервис X».

### Шаг 4 · Чистка и защита

1. Удалить deprecated адаптеры из шага 1; старые ID остаются только в `legacyAliases.ts` для редиректов.
2. Тест `src/test/catalog/taxonomy-coverage.test.ts`:
   - Каждое приложение принадлежит ровно одной категории.
   - Каждая категория — ровно одному кластеру.
   - Все 20 LifeSituations покрыты ≥ 1 категорией.
   - В БД `category_groups.slug` ⊇ ID из SSOT-кластеров.
   - В `APP_ROUTES` нет битых ссылок из SSOT.
3. Обновить документ `docs/canonical/02-service-catalogue-v2.md` — поставить метку «Версия 2.1, синхронизировано с `taxonomy.ts`» и добавить таблицу cluster→category→lifeSituation.
4. Создать память `mem://architecture/catalog-taxonomy-ssot.md` — как добавлять новый сервис (только через `taxonomy.ts`, иначе CI ругается).

---

## Что увидит пользователь после реализации

| До | После |
|---|---|
| Главная: 8 кластеров (`Manage` показывается всем) | Главная: 6 канонических кластеров, `Manage` только для собственников/УК |
| Footer: другие 8 групп | Footer: те же 6 кластеров, что и на главной |
| /discover: `Health` | /discover: `Live` → подкатегория `Health & Wellness` |
| /catalog: 9 БД-групп, дубликат «Education» | /catalog: 6 кластеров → 16 категорий, без дублей |
| LifeOS: 20 ситуаций «висят отдельно» | Активная ситуация подсвечивает свой кластер на главной и в навигации |
| AppDrawer: `Family & kids` | AppDrawer: `Live` → `Family & Kids` (категория, не кластер) |

---

## Технические артефакты (для разработчика)

**Новые файлы:**
- `src/lib/catalog/taxonomy.ts` (SSOT, ≈400 строк)
- `src/lib/catalog/legacyAliases.ts` (короткий map старых ID → новые)
- `src/hooks/useTaxonomy.ts` (объединяет SSOT + кэш `category_groups`/`categories`/`life_situations`)
- `supabase/migrations/<ts>_catalog_taxonomy_ssot.sql`
- `src/test/catalog/taxonomy-coverage.test.ts`

**Изменённые файлы (суммарно ≈25):**
- `verticalGroups.ts`, `clusterCatalog.ts`, `appRegistry.ts` → становятся адаптерами над SSOT
- `Discover.tsx`, `PlatformCatalog.tsx`, `ClusterGrid.tsx`, `AllSectionsAccordion.tsx`, `AllServicesGrid.tsx`, `ServiceClusterAccordion.tsx`, `CompactFooter.tsx`, `LifeOSStatusBlock.tsx`, `ContextualHeader.tsx`, `CategoryPicker.tsx` (vendor onboarding)
- `docs/canonical/02-service-catalogue-v2.md` (добавляется sync-таблица)
- `mem://index.md` (+ ссылка на новую память)

**Что НЕ трогаем:**
- `VERTICALS` (бизнес-вертикали для бронирований / БД-таблиц) — он SSOT для другого слоя и остаётся как есть.
- `APP_ROUTES` — пути не меняются, только их группировка.
- Дизайн-токены, цвета, шрифты.

---

## Открытые вопросы (нужны ответы перед стартом шага 1)

1. **Кластеры:** оставляем 6 канонических (`Arrive · Live · Manage · Invest · Legal · Build` из PROJECT.md), или ты хочешь сохранить нынешние 8 (с `Enjoy · Family · Help` отдельно)? Я склоняюсь к 6 — это уже зафиксировано в архитектуре v2.
2. **Категории:** берём ровно 16 из canonical-doc, или сокращаем по факту наличия в коде (≈12)? Категории без сервисов в коде помечу `status: 'soon'`.
3. **LifeSituations:** оставляем 20 как есть в БД, или тоже подрезаем под canonical-doc (там 10 кластеров A–J)? Если оставляем 20 — добавим `cluster_life_situations` мост, как в плане.
4. **Объём первого PR:** делать всё одним большим PR (4 шага) или по одному PR на шаг (рекомендую — раскатывать постепенно, без риска)?

