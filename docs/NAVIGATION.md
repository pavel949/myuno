# Navigation System (myUNO)

> **Status:** Production — `NavShell` + SSOT in `navConfig` / `navigationModel`. Consumer and workspace layouts use the same components; see exceptions below.

## Goal

One predictable navigation system across **mobile / tablet / desktop** for every `NavRoleKey`. Menus are data-driven; layouts do not hardcode destinations.

## Source of truth

| File | Responsibility |
|------|------------------|
| [`src/lib/navConfig.ts`](../src/lib/navConfig.ts) | `NavRoleKey`, per-role **5-slot** primary nav (`*_NAV`), `resolveNavRole`, Apps launcher rule |
| [`src/lib/nav/navigationModel.ts`](../src/lib/nav/navigationModel.ts) | Re-exports primary nav as `PRIMARY_NAV`, `SIDEBAR_NAV`, `FAB_ACTIONS`, bottom-bar helpers, `getWorkspaceDrawerGroups` |
| [`src/lib/nav/roleIA.ts`](../src/lib/nav/roleIA.ts) | Role / URL / shell matrix (read before changing IA) |
| [`src/lib/nav/floatingStack.ts`](../src/lib/nav/floatingStack.ts) | Z-index + `bottom-*` offsets for compare / chat / PWA / contextual FAB |
| [`src/lib/nav/guestStayNavDraft.ts`](../src/lib/nav/guestStayNavDraft.ts) | Draft guest-stay sidebar — **not wired** until a product shell exists |
| [`src/lib/config/routes.ts`](../src/lib/config/routes.ts) | `APP_ROUTES` — use for all path strings in nav data |
| [`src/lib/nav/clusterCatalog.ts`](../src/lib/nav/clusterCatalog.ts) | Public **cluster → service** map (ARRIVE, LIVE, ENJOY, …). Used by `/discover`, left `AppDrawer`, and mobile `AllAppsDrawer` |
| [`docs/ECOSYSTEM_NAMING.md`](ECOSYSTEM_NAMING.md) | RU/EN/TH **glossary** + rules — keep service names in sync with [`ecosystemGlossary.ts`](../src/lib/ecosystemGlossary.ts) |

### Two “full map” launchers (same cluster SSOT)

- **[`AppDrawer`](../src/components/nav/AppDrawer.tsx)** — left sheet from the home hamburger; includes quick actions, [`ServiceClusterAccordion`](../src/components/nav/ServiceClusterAccordion.tsx), workspace block, footer.
- **[`AllAppsDrawer`](../src/components/layout/AllAppsDrawer.tsx)** — bottom sheet from the **Apps** tab on `BottomBar`; shows the **same** cluster accordion (`filterCatalogForUser` + persona/role as in `AppDrawer`), then a **Featured** grid of Supabase `categories` with `hasMiniApp` (vitamin layer on top of the SSOT map).

Do not duplicate cluster groupings outside `clusterCatalog.ts`.

## Architecture

```
                  ┌──────────────────────────────────────┐
                  │  navigationModel + navConfig         │
                  │  PRIMARY_NAV  ·  SIDEBAR_NAV  · FAB  │
                  └──────────────────┬───────────────────┘
                                     │
        ┌──────────────┬─────────────┴────┬──────────────┐
        ▼              ▼                  ▼              ▼
   <SideRail>    <BottomBar>         <TopBar>     <ContextualFAB>
   workspace     mobile <768          all sizes    workspace, mobile
   (see matrix)  + Apps drawer        role-driven  (owner FAB today)
                          ┌───────────┴───────────┐
                          │      <NavShell>        │
                          └───────────────────────┘
```

## Role × shell matrix

| `NavRoleKey` | Side chrome | Primary 5 (mobile) |
|--------------|-------------|-------------------|
| `guest` | None | Home, Discover, Market, Property, Me (or Me-hub flag) |
| `investor` | None | Home, Invest, Discover, Property, Me |
| `mc_portal` | None | My property hub, Statements, Documents, Messages, Me |
| `owner` | **SideRail** (`OWNER_SIDEBAR`) | MC Dashboard, Properties, Calendar, Finance, Messages |
| `vendor` | SideRail | Vendor 5 |
| `admin` | SideRail | Admin 5 |
| `team` | **TeamSidebar** in `TeamLayout` (not SideRail) | Same 5 as `TEAM_NAV` in `navConfig` |

**Team** is special: `SIDEBAR_NAV.team` is empty so the global `SideRail` is not shown; the app drawer uses `getWorkspaceDrawerGroups('team')` to list the same five destinations. Mobile uses the shared `BottomBar` only (the old duplicate `TeamBottomNav` was removed).

## Intentional non–`NavRoleKey` shells

| Shell | Routes (typical) | Notes |
|-------|------------------|--------|
| `StaffLayout` | `/staff/*` | Separate HR-style shell |
| `CapitalLayout` | `/capital/*` | CRM sub-product; mobile nav uses `CapitalMobileNav` |
| `MiniAppLayout` | vertical mini-apps | Catalog UX |

These are not driven by `PRIMARY_NAV`; align styling with tokens when touching them.

## Floating UI stack (mobile)

Order (low → high z-index): content → compare bars → chat FAB → contextual FAB overlay/button → PWA install → `BottomBar`.

Use [`FLOATING` / `FLOATING_OFFSET`](../src/lib/nav/floatingStack.ts) in code; do not invent new `z-40` stacks.

## Adding or moving a destination

1. Add or update a constant in `APP_ROUTES`.
2. Edit the relevant `*_NAV` or `SIDEBAR_*` group in `navConfig.ts` / `navigationModel.ts`.
3. For team-only routes that appear in `TeamSidebar`, keep [`TeamSidebar.tsx`](../src/components/team/TeamSidebar.tsx) in sync with product, or migrate items into SSOT with a filter (future).

## Hard rules

- **SSOT:** no long-lived menu arrays inside random layout files (team sidebar is the one extended exception; document new items).
- **Paths:** prefer `APP_ROUTES` everywhere in nav data; `mc_portal` uses `OWNER_PORTAL`, `OWNER_PORTAL_STATEMENTS`, `OWNER_PORTAL_SIGNATURES`.
- **Icons — primary nav:** `size-5` (20px) for TopBar pills, BottomBar, SideRail items, `TeamSidebar` nav icons; token: `--nav-icon-size` in `tokens.css`.
- **Touch targets:** ≥ 44px where possible (BottomBar / header controls).
- **Safe area:** use `var(--bottom-nav-h)` for spacing above the mobile bar.

## Historical migration (archive)

Earlier stages (AppHeader, per-role sidebars, `AdaptiveBottomNav`) were replaced by `NavShell`. If you find a doc referencing “not yet wired”, treat it as superseded by this file.
