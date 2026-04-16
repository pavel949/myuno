

# Переработка /newbuilds — Каталог по референсу OFFPLAN

## Что делаем

Полная замена `/newbuilds` на каталог в стиле referenceного сайта offplan-mu.vercel.app: sidebar с 11 фильтрами, rich-карточки с рейтингом/рекомендацией/yield/tags/Inquiry+WhatsApp, stats header, sub-navigation.

## Текущие проблемы
- Landing page с огромным hero вместо каталога
- Карточки бедные (фото + название + цена + прогресс)
- 3 фильтра вместо 11
- Нет Inquiry/WhatsApp на карточках
- `offplan_catalog` JSONB (122 проекта с rich данными) не используется на `/newbuilds`
- Нет мини-лендингов для проектов

---

## Phase 1 — Единый каталог `/newbuilds`

**Полная замена `NewbuildsLanding.tsx`** на каталог со структурой:

```text
┌──────────────────────────────────────────────────────────┐
│ HEADER: Logo · 122 PROJECTS · ฿71B · ~6.42% AVG YIELD  │
├──────────────────────────────────────────────────────────┤
│ Tabs: ALL PROJECTS | CALCULATOR | DEVELOPERS | MAP | ...│
├──────────┬───────────────────────────────────────────────┤
│ SIDEBAR  │  Stats: 122 verified · 87 BUY · 6 AVOID     │
│ Sort     │  ⚠ Disclaimer                                │
│ Search   │                                              │
│ Risk Tier│  CARD GRID (4 columns desktop)               │
│ Segment  │  ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│ Type     │  │9.5 #4   │ │8.2 #16  │ │9.1 #1   │        │
│ Zone     │  │Title    │ │Title    │ │Title    │        │
│ Status   │  │Dev name │ │Dev name │ │Dev name │        │
│ Year     │  │Tier·Date│ │Tier·Date│ │Tier·Date│        │
│ Beach    │  │฿ · $ · %│ │฿ · $ · %│ │฿ · $ · %│        │
│ Ownership│  │Tags row │ │Tags row │ │Tags row │        │
│ Mgmt     │  │Zone·Unit│ │Zone·Unit│ │Zone·Unit│        │
│ Focus    │  │Descript │ │Descript │ │Descript │        │
│ Developer│  │Source   │ │Source   │ │Source   │        │
│          │  │Segment  │ │Segment  │ │Segment  │        │
│          │  │[Inq][WA]│ │[Inq][WA]│ │[Inq][WA]│        │
│          │  └─────────┘ └─────────┘ └─────────┘        │
└──────────┴───────────────────────────────────────────────┘
```

**Данные**: Переиспользуем `useOffplanProjects` (уже загружает `offplan_catalog` JSONB) + фильтры из `src/lib/offplan/filters.ts` (`applyOffplanUiFilters`, `collectFacetOptions`, `countByRec`).

### Новый файл: `CatalogProjectCard.tsx`
Rich-карточка по образцу референса:
- Rating badge (top-right) + Rank (#1, #4)
- BUY/WATCH/AVOID цветной индикатор + Risk Tier (Tier 1 Low / Tier 2 Medium)
- NEW / HOT / SET/SGX badges
- Price THB + USD (rate ~35) + Yield estimate
- Tags row: beach distance, ownership type, management, focus, bedrooms
- Zone + Units + ฿/sqm + Status
- Description excerpt (2-3 строки из `description_en` или offplan_catalog)
- Source link
- Segment badge (ULTRA-LUX & BRANDED / INVESTMENT CONDO / etc.)
- **Inquiry** + **WhatsApp** кнопки

### Новый файл: `CatalogSidebar.tsx`
11 dropdown-фильтров, использующих `OffplanUiFilterState`:
- Sort by (Rating, Price ↑↓, Completion, Yield, Risk, Beach)
- Search (text input)
- Risk Tier, Segment, Type, Zone, Status, Completion year, Beach, Ownership, Management, Focus, Developer

### Новый файл: `CatalogInquirySheet.tsx`
Sheet с компактной лид-формой (имя + телефон + email). Сохранение в `nb_leads` с `source = 'catalog_card'`.

---

## Phase 2 — DB migration

Добавление 6 колонок в `property_projects`:
- `description_summary TEXT` — excerpt для карточки
- `yield_estimate TEXT` — "5-7%"
- `price_usd NUMERIC` — цена в USD
- `price_per_sqm NUMERIC`
- `source_url TEXT` — ссылка на источник
- `landing_enabled BOOLEAN DEFAULT false`

---

## Phase 3 — Mini Landing `/project/:slug`

Новый файл: `ProjectMiniLanding.tsx` — параметрический лендинг (Peylaa-style):
- Fixed header с "← Back to catalogue" + Inquiry CTA
- Gallery (из `gallery_urls`)
- Summary + Location cards
- Units & Pricing section (из `project_units`)
- Lead form
- Маршрут: `/project/:slug`

---

## Phase 4 — Routes & Navigation

- `/newbuilds` → новый каталог (замена Landing)
- `/newbuilds/projects` → redirect на `/newbuilds`
- `/project/:slug` → mini landing (новый route)
- Обновить `NewbuildsLayout` nav: убрать "Главная"/"Проекты", добавить "Market Analytics", "Shortlist", "Services"
- Добавить `APP_ROUTES.PROJECT_LANDING`
- Обновить `AnimatedRoutes.tsx`

---

## Файлы

**Новые (4):**
- `src/components/newbuilds/CatalogProjectCard.tsx`
- `src/components/newbuilds/CatalogSidebar.tsx`
- `src/components/newbuilds/CatalogInquirySheet.tsx`
- `src/pages/newbuilds/ProjectMiniLanding.tsx`

**Переписать (1):**
- `src/pages/newbuilds/NewbuildsLanding.tsx` → полная замена на каталог

**Редактировать (4):**
- `src/components/newbuilds/NewbuildsLayout.tsx` — обновить nav items
- `src/components/layout/AnimatedRoutes.tsx` — добавить `/project/:slug`
- `src/lib/config/routes.ts` — добавить `PROJECT_LANDING`
- `src/hooks/useOffplanProjects.ts` — добавить новые колонки в select/mapping

**Миграция:** 1 SQL (6 колонок в property_projects)

