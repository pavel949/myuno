
# Consolidation: Unified MC Workspace

## Current Problem

The platform has two overlapping workspaces:
- `/owner` -- A thin shell with only 6 real pages + **50+ redirects to /mc**
- `/mc` -- The full MC workspace with all functionality

This is confusing. The `/owner` workspace is essentially redundant -- it has its own Layout, Sidebar, Header, and MobileNav, all duplicating what `/mc` already provides.

## Architecture After Changes

```text
/account          -- Personal page (profile, settings, account info)
                     Entry point: "MC Workspace" button if user belongs to a company

/mc               -- Unified MC workspace (role-filtered sidebar)
  /mc             -- Dashboard
  /mc/portfolio   -- Portfolio (moved from /owner)
  /mc/guide       -- Guide (moved from /owner)
  /mc/properties  -- Properties
  /mc/calendar    -- Calendar
  /mc/contacts    -- CRM Contacts
  /mc/finance     -- Finance overview (moved from /owner/finance)
  /mc/staff       -- Team
  ...all existing /mc routes stay unchanged

/owner/*          -- All paths redirect to /mc equivalents
```

## Step-by-Step Plan

### 1. Move /owner pages into /mc routes

Add the 6 real pages from `/owner` as routes under `/mc` in `AnimatedRoutes.tsx`:
- `/mc/portfolio` (OwnerPortfolio)
- `/mc/guide` (OwnerGuidePage)
- `/mc/setup` (OwnerSetupWizard)
- `/mc/service-request` (ServiceRequest)
- `/mc/inspection` (InspectionRequest)
- `/mc/full-management` (FullManagement)
- `/mc/finance` (FinanceOverview -- if not already there)

### 2. Convert all /owner routes to redirects

Replace the entire `/owner` route block with a single catch-all:
- `/owner` -> `/mc`
- `/owner/portfolio` -> `/mc/portfolio`
- `/owner/finance` -> `/mc/finance`
- `/owner/guide` -> `/mc/guide`
- `/owner/*` -> `/mc` (fallback)

This eliminates OwnerLayout, OwnerGuard, and 50+ individual redirect routes.

### 3. Update MCSidebar with role-aware navigation

Add the missing items (Portfolio, Guide, Services) to `MCSidebar.tsx` navigation groups. The sidebar already has `canAccess()` filtering -- extend it:

- **Director/Admin**: All groups visible (Main, CRM, Operations, Finance, Team + new Portfolio & Services)
- **Manager**: Main + assigned modules
- **Staff**: Only assigned modules
- **Owner (no MC role)**: Dashboard, Portfolio, Finance, Guide, Services

### 4. Add "MC Workspace" entry point to personal account

In `UserAccountDashboard.tsx` or `AccountFlatMenu.tsx`, add a visible button/link to `/mc` for users who belong to a management company (using `useActiveCompany`).

### 5. Fix hardcoded values in OwnerSidebar footer

The current `OwnerSidebar` has `user?.user_metadata?.name` and `'Владелец'` hardcoded. Since we're removing OwnerSidebar entirely, this is resolved automatically. The `MCSidebar` already uses `useProfile()`.

### 6. Clean up redundant files

Delete or deprecate:
- `src/components/owner/OwnerLayout.tsx`
- `src/components/owner/OwnerSidebar.tsx`
- `src/components/owner/OwnerHeader.tsx`
- `src/components/owner/OwnerMobileNav.tsx`
- `src/components/auth/OwnerGuard.tsx` (redirect to MCGuard)

## Files to Modify

| File | Action |
|------|--------|
| `src/components/layout/AnimatedRoutes.tsx` | Add /mc routes for portfolio/guide/etc, replace /owner block with redirects |
| `src/components/mc/MCSidebar.tsx` | Add Portfolio, Guide, Services nav items with role filtering |
| `src/pages/account/UserAccountDashboard.tsx` | Add "MC Workspace" entry button |
| `src/components/account/AccountFlatMenu.tsx` | Add MC workspace link for company members |

## Files to Delete

| File | Reason |
|------|--------|
| `src/components/owner/OwnerLayout.tsx` | Replaced by MCLayout |
| `src/components/owner/OwnerSidebar.tsx` | Merged into MCSidebar |
| `src/components/owner/OwnerHeader.tsx` | MCHeader already exists |
| `src/components/owner/OwnerMobileNav.tsx` | MCMobileNav already exists |

## Result

- One workspace (`/mc`) for all MC-related work
- Sidebar adapts to user's role automatically
- Personal account (`/account`) stays separate with an entry point to MC
- All old `/owner` bookmarks continue to work via redirects
- No database changes needed
