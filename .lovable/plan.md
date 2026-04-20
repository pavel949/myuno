

## Цель
Профессиональная единая структура + визуальный язык для всех версий приложения (mobile / tablet / desktop) и всех ролей (guest, investor, owner/MC, vendor, admin, MC portal).

## Что уже есть (после рефакторинга навигации)
- ✅ SSOT навигации `src/lib/nav/navigationModel.ts`
- ✅ `NavShell` + `TopBar` + `SideRail` + `BottomBar` + `ContextualFAB`
- ✅ Все layouts мигрированы на `NavShell`
- ✅ Удалены 14 legacy-компонентов

## Что не доделано (профессиональная структура и дизайн)

### A. Структура страниц (page templates)
Сейчас каждая страница сама верстает контейнер, padding, заголовок. Результат — разнобой:
- `Index.tsx` использует `pb-24` + кастомные блоки
- Admin pages используют `Surface` + кастомные `SectionHeader`
- MC pages иногда используют `PageContainer`, иногда нет
- Vendor/Guest имеют свои контейнеры

**Нет универсального шаблона страницы**, который бы давал: page header (title + breadcrumbs + actions) + tabs + content area + responsive padding.

### B. Визуальная система
- Два фронта дизайна: «deep-sea dark» (super-app) и «dark luxury editorial» (newbuilds) — но **не описано когда какой**
- Tokens разбросаны: `src/styles/tokens.css` (runtime SSOT) + `src/design-system/tokens.json` (deprecated) + хардкод в компонентах
- Нет единых классов для page header / section / card grid / empty state / loading state

### C. Адаптивность
- Tablet (768–1023) после рефакторинга nav теперь работает, но **content** многих страниц остаётся либо mobile-узким, либо desktop-широким — middle ground не продуман
- Touch targets 44px не везде соблюдены

## План реализации (5 этапов)

### Этап 1 — Page Template SSOT
Создать `src/components/page/` с тонким API:
- `<PageShell>` — обёртка с consistent padding (mobile/tablet/desktop), max-width
- `<PageHeader title subtitle breadcrumbs actions />` — единый header с responsive поведением (на mobile actions уходят в overflow-меню)
- `<PageTabs>` — обёртка над shadcn Tabs с sticky-поведением
- `<PageSection title icon action />` — единый section header (заменит ad-hoc `SectionHeader`)
- `<EmptyState icon title description action />` — единый пустой стейт
- `<LoadingState variant="skeleton|spinner" />` — единый loading

### Этап 2 — Design tokens consolidation
- Сделать `src/styles/tokens.css` единственным SSOT (пометить `tokens.json` как archived)
- Добавить semantic tokens для часто используемых паттернов: `--page-padding-x`, `--section-gap`, `--card-radius`, `--touch-target`
- Документ `docs/DESIGN_TOKENS.md` с примерами

### Этап 3 — Responsive content rules
- Канонизировать `useBreakpoint` (удалить дубли `useIsMobile`/`useIsDesktop` — заменить на тонкие алиасы)
- Стандартные grid-классы: `grid-1-2-3`, `grid-1-2-4` через CSS-переменные
- Tablet-specific: на 768–1023 контент использует `max-w-3xl mx-auto` если sidebar=full, иначе `max-w-5xl`

### Этап 4 — Migration of high-traffic pages (8–10 страниц)
Перевести на новый шаблон:
- `Index.tsx` (home)
- `AdminDashboard.tsx`
- `MCDashboard.tsx`
- `VendorDashboard.tsx`
- `GuestPortal.tsx`
- `InvestorDashboard.tsx`
- `Property` hub
- `Discover`

### Этап 5 — Documentation + lint guards
- `docs/PAGE_TEMPLATES.md` — обязательное чтение перед созданием новой страницы
- ESLint rule (или README guard): запрет хардкода hex/padding в новых страницах
- Storybook-style examples в `src/components/page/README.md`

## Файлы

**Новые (~10):**
- `src/components/page/PageShell.tsx`
- `src/components/page/PageHeader.tsx`
- `src/components/page/PageTabs.tsx`
- `src/components/page/PageSection.tsx`
- `src/components/page/EmptyState.tsx`
- `src/components/page/LoadingState.tsx`
- `src/components/page/index.ts` (barrel)
- `docs/PAGE_TEMPLATES.md`
- `docs/DESIGN_TOKENS.md`
- `src/components/page/README.md`

**Изменяются:** 8–10 high-traffic страниц + `tokens.css` (добавление semantic tokens) + `useBreakpoint.ts` (canonicalization).

**Удаляются (после миграции):** дубли `SectionHeader` в admin/, ad-hoc empty states.

## Уточнения

1. **Объём миграции страниц** на этапе 4 — 8–10 ключевых, или сразу все 366+ (большой риск)? Рекомендую только high-traffic + остальные мигрируем по мере правок.
2. **Визуальный язык** — оставить два theme'а (deep-sea + dark luxury) и явно задокументировать когда какой, или унифицировать в один? Рекомендую оставить два: super-app = deep-sea, newbuilds/lifestyle landings = dark luxury.
3. **Storybook** — добавить полноценный (новая зависимость), или ограничиться live-preview страницами в `/admin/design-system`? Рекомендую второе — без новых зависимостей.

