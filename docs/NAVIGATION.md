# Navigation System (myUNO)

> **Status:** Stage 1 — SSOT + universal components built; not yet wired into layouts.
> Layouts continue to use legacy `AppHeader`/`MCSidebar`/`AdaptiveBottomNav` for now.

## Goal

One navigation system across **mobile / tablet / desktop** for **every role**
(guest, owner/MC, vendor, admin, team, investor, MC portal). No duplicate
menus, no breakpoint dead zones, predictable behaviour everywhere.

## Architecture

```
                  ┌──────────────────────────────────────┐
                  │  src/lib/nav/navigationModel.ts      │   ← Single Source of Truth
                  │  - PRIMARY_NAV[role]   (5 items)     │
                  │  - SIDEBAR_NAV[role]   (grouped)     │
                  │  - FAB_ACTIONS[role]   (quick acts)  │
                  │  - resolveNavRole()                  │
                  └──────────────────┬───────────────────┘
                                     │
        ┌──────────────┬─────────────┴────┬──────────────┐
        ▼              ▼                  ▼              ▼
   <SideRail>    <BottomBar>         <TopBar>     <ContextualFAB>
   ≥md, work-    <md, fixed,         all sizes    <md only,
   space roles   role-driven         role-driven  workspace
                                                  roles only
                          ┌─────────┴────────┐
                          │   <NavShell>     │
                          │ (composer)       │
                          └──────────────────┘
```

## Behaviour matrix

| Surface  | Mobile <768                        | Tablet 768–1023                      | Desktop ≥1024                                       |
|----------|------------------------------------|--------------------------------------|-----------------------------------------------------|
| TopBar   | Logo + search-icon + utils + avatar | Logo + 5 nav pills + utils + avatar  | Logo + 5 pills + full search + utils + avatar       |
| SideRail | Off-canvas (Sheet)                  | Mini-collapse (icons-only, 64px)     | Full sidebar (workspace) / hidden (consumer)        |
| BottomBar| 5 slots (4 nav + Apps/More)         | hidden                               | hidden                                              |
| FAB      | Contextual (workspace only)         | hidden                               | hidden                                              |

## Roles

`NavRoleKey` (defined in `navigationModel.ts`):
- **Consumer** (no sidebar): `guest`, `investor`, `mc_portal`
- **Workspace** (sidebar + optional FAB): `owner`, `vendor`, `admin`, `team`

Role resolution (`resolveNavRole`) prefers the authenticated `activeRole`,
falls back to URL prefix when unauthenticated or guest-browsing.

## Adding / moving a destination

1. Open `src/lib/nav/navigationModel.ts`.
2. Edit the relevant array:
   - **Primary 5-slot** (top pills + bottom bar) → `PRIMARY_NAV` via the
     `*_NAV` consts re-exported from `@/lib/navConfig`.
   - **Full sidebar** → `SIDEBAR_NAV[role]` group.
   - **FAB quick action** → `FAB_ACTIONS[role]`.
3. Use a route from `APP_ROUTES` (`src/lib/config/routes.ts`). Never
   hardcode a path string elsewhere.

## Migration plan

Stage 1 (current): SSOT + new components live in `src/components/nav/` and
`src/lib/nav/`. Old components stay untouched.

Stage 2: Switch consumer layout (`AppLayout`) → `<NavShell role="guest">`.
Verify guest, investor, mc_portal.

Stage 3: Switch `MCLayout` (largest sidebar). Verify owner.

Stage 4: Switch `AdminLayout`, `VendorLayout`, `GuestLayout`.

Stage 5: Delete legacy components (`AppHeader`, `MCHeader`, `AdminHeader`,
`VendorHeader`, `GuestHeader`, `MCSidebar`, `AdminSidebar`, `VendorSidebar`,
`GuestSidebar`, `MCMobileNav`, `AdminMobileBottomNav`, `AdaptiveBottomNav`,
`DesktopNavTabs`, plus deprecated `useIsMobile` / `useIsDesktop` hooks).

## Hard rules

- Single SSOT: never define menu items inside a layout, header, or sidebar
  component. Always read from `navigationModel.ts`.
- Single breakpoint hook: `useBreakpoint()` (Tailwind md=768 / lg=1024).
  `useIsMobile` is a thin wrapper kept only for backward compatibility.
- No new top-level routes — extend `APP_ROUTES` and the relevant nav array.
- Touch targets ≥ 44 px (already enforced in BottomBar / TopBar buttons).
- Safe-area insets — handled by `BottomBar` and `ContextualFAB`; layouts
  must not re-add `pb-20` manually.
