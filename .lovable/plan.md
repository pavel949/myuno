

## Цель

Сделать единую профессиональную навигационную систему для **mobile / tablet / desktop**, общую для всех ролей (гость, владелец/УК, вендор, админ, команда, инвестор, MC-портал, гость отеля).

## Что не так сейчас (реальные проблемы)

1. **Три параллельных бот-нав компонента** — `AdaptiveBottomNav` (5 ролей), `MCMobileNav` (своя жёстко зашитая модель), `AdminMobileBottomNav` (отдельно). Они конфликтуют: на `/mc` рендерятся `MCMobileNav` *и* потенциально `AdaptiveBottomNav` если `layoutsWithOwnNav` не покроет путь.
2. **Hard-coded дублирование пунктов** — `MCSidebar` (140+ путей), `MCMobileNav` (5 путей), `OWNER_NAV` в `navConfig.ts` (5 путей) — три источника правды для одной роли. Расходятся по иконкам и лейблам ("Dashboard"/"Home"/"Главная"/"Обзор").
3. **Tablet-зона (768–1023px) пустая** — `DesktopNavTabs` показывается только `lg:flex` (≥1024), `AdaptiveBottomNav` только `md:hidden` (<768). На планшете нет ни верхней, ни нижней навигации для guest/owner/investor.
4. **Breakpoint hooks дублируются** — `useIsMobile`, `useIsDesktop`, `useBreakpoint` — три разных хука с разными порогами в одном проекте.
5. **Sidebar отсутствует на desktop guest/investor** — у workspace-ролей есть полноценный sidebar, у consumer-ролей только верхние пилюли — асимметрия UX.
6. **Header-фрагментация** — `AppHeader`, `MCHeader`, `AdminHeader`, `VendorHeader`, `GuestHeader`, `WorkspaceHeader` (только примитив-обёртка), `CustomerHeader` (15 строк, недоиспользован). Декларация в `HEADER_ROUTE_INVENTORY.md` не выполнена — Phase 2/3 висят.
7. **Дубль FAB и safe-area** — каждый layout сам обрабатывает `env(safe-area-inset-bottom)`, ставит `pb-20`, и т.д.

## Архитектура (target)

```text
                  ┌──────────────────────────────────────┐
                  │  src/lib/nav/navigationModel.ts      │  ← единый SSOT
                  │  - NAV_BY_ROLE (5 primary items)     │
                  │  - SIDEBAR_BY_ROLE (грouped, full)   │
                  │  - QUICK_ACTIONS_BY_ROLE (FAB)       │
                  │  - resolveNavRole()                  │
                  └────────────────┬─────────────────────┘
                                   │
   ┌───────────────┬───────────────┼──────────────────┬───────────────┐
   ▼               ▼               ▼                  ▼               ▼
<NavRail>    <BottomBar>     <TopBar>          <CommandPalette>  <FAB>
desktop      mobile          all sizes         ⌘K everywhere     mobile only
≥1024 left   <768 fixed      header slot                          contextual
```

### Поведение по breakpoint (единое для ВСЕХ ролей)

| Размер | Mobile <768 | Tablet 768-1023 | Desktop ≥1024 |
|---|---|---|---|
| **Top bar** | Лого + поиск-icon + аватар | Лого + пилюли (5 items) + поиск + аватар | Лого + пилюли + поиск + утилиты + аватар |
| **Side rail** | — (off-canvas через бургер) | Collapsible mini (icons only, 64px) | Full sidebar (workspace) / нет (consumer) |
| **Bottom bar** | 5 слотов (4 nav + Apps/More) | — | — |
| **FAB** | контекстный (только на workspace) | — | — |

## Что нужно построить

### 1. Единый источник правды — `src/lib/nav/navigationModel.ts`
Расширяет существующий `navConfig.ts` тремя структурами:
- `PRIMARY_NAV[role]` — 5 items для bottom-bar и top-pills (есть уже).
- `SIDEBAR_NAV[role]` — группы с под-пунктами (мигрируем туда `MCSidebar.navigationGroups`, `AdminSidebar`, `VendorSidebar`, `GuestSidebar`).
- `FAB_ACTIONS[role]` — quick-actions (мигрируем `MCMobileNav.QUICK_ACTIONS`).

### 2. Унифицированные shell-компоненты в `src/components/nav/`
- `<TopBar role={role} />` — заменяет `AppHeader` + `MCHeader` + `AdminHeader` + `VendorHeader` + `GuestHeader`. Использует slot-API через `WorkspaceHeader`/`CustomerHeader` примитивы (они уже есть).
- `<SideRail role={role} />` — единый sidebar, `collapsible="icon"`, читает `SIDEBAR_NAV[role]`. Заменяет 4 отдельных sidebar-компонента.
- `<BottomBar role={role} />` — заменяет `AdaptiveBottomNav` + `MCMobileNav` + `AdminMobileBottomNav`. Один компонент, читает `PRIMARY_NAV[role]` + опциональный FAB.
- `<NavShell role={role}>{children}</NavShell>` — оборачивает всё (header + rail + bottom + FAB), берёт на себя safe-area и `pb-*` подстройку.

### 3. Layouts — становятся тонкими
`MCLayout`, `AdminLayout`, `VendorLayout`, `GuestLayout`, `AppLayout` сводятся к ~10 строк: задают `role`, передают в `<NavShell>`. Старые header/sidebar/mobile-nav компоненты удаляются.

### 4. Breakpoint canonicalization
Удаляем `useIsMobile`, `useIsDesktop`. Везде только `useBreakpoint()` с порогами 768/1024 (Tailwind md/lg). Один хук — один контракт.

### 5. Tablet-режим (новое)
- На 768–1023 показываются и `<TopBar>` пилюли, и mini-rail (если роль = workspace). Это закрывает текущую "мёртвую зону".
- `BottomBar` скрывается с 768.

### 6. Apps Drawer — остаётся
`AllAppsDrawer` уже работает; интегрируем как кнопку в `BottomBar` (consumer-роли) и как опцию в `TopBar` (admin/owner — через ⌘K палитру, она уже есть в виде `MCCommandPalette`/`AdminCommandPalette` — объединяем в один `<GlobalCommandPalette role={role} />`).

## Файлы (новые / изменения / удаления)

**Новые (8):**
- `src/lib/nav/navigationModel.ts` — SSOT
- `src/components/nav/NavShell.tsx`
- `src/components/nav/TopBar.tsx`
- `src/components/nav/SideRail.tsx`
- `src/components/nav/BottomBar.tsx`
- `src/components/nav/ContextualFAB.tsx`
- `src/components/nav/GlobalCommandPalette.tsx` (объединяет MC+Admin)
- `docs/NAVIGATION.md` (спецификация)

**Изменяются (~10):** все 5 layout-файлов; `App.tsx` (убрать дубль); `useBreakpoint` (расширить); `routeMeta.ts` (добавить роль). 

**Удаляются (~12):** `AppHeader.tsx`, `MCHeader.tsx`, `AdminHeader.tsx`, `VendorHeader.tsx`, `GuestHeader.tsx`, `MCSidebar.tsx`, `AdminSidebar.tsx`, `VendorSidebar.tsx`, `GuestSidebar.tsx`, `MCMobileNav.tsx`, `AdminMobileBottomNav.tsx`, `AdaptiveBottomNav.tsx`, `DesktopNavTabs.tsx`, `MCCommandPalette.tsx`, `AdminCommandPalette.tsx`, `useIsMobile.ts`, `useIsDesktop.ts`. (Контент мигрирует в SSOT и три новых компонента.)

## Risk & rollout

- **Большой refactor** — затрагивает каждый layout. Поэтому делаем поэтапно: 
  1. Создаём SSOT + новые компоненты (не подключая).
  2. Переключаем `AppLayout` (consumer) → проверяем guest/investor.
  3. Переключаем `MCLayout` (самый сложный, 140+ путей в sidebar) → проверяем owner.
  4. Admin/Vendor/Guest по очереди.
  5. Удаляем мёртвый код.
- На каждом этапе старые компоненты не удаляются сразу, чтобы можно было откатить.
- RTL/i18n — все лейблы остаются bilingual (en/ru), берутся из SSOT.

## Что попросить уточнить

- На **планшете для workspace-ролей** (УК/админ/вендор) — оставить sidebar mini-collapse (icons-only), или скрывать полностью и оставить только bottom-bar как на мобайле? Рекомендую mini-collapse — больше пространства экрана используется правильно.
- **FAB на mobile для consumer-ролей** (guest/investor) — нужен ли? Сейчас его нет. Можно добавить "Quick book" / "Quick search" — или оставить чисто 5-slot bottom-bar без FAB.

