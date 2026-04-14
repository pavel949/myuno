# Header Route Inventory

Canonical target architecture:

- `customer` -> `CustomerHeader`
- `workspace` -> `WorkspaceHeader`

## Current Entry Points

| Route Group | Current Header Entry | Canonical Target | Migration Status |
|---|---|---|---|
| `AppLayout` consumer pages (public + customer flows) | `AppHeader` (inside `AppLayout`) | `CustomerHeader` (auto via route metadata) | Foundation complete |
| `MiniAppLayout` pages | `UnifiedHeader` | `CustomerHeader` contract (slot-based compatibility) | Pending (Phase 2) |
| `LandingLayout` promo pages | Hero + `BackButton` + `AppLayout` default header | `CustomerHeader` + page-level hero content | Pending (Phase 2) |
| `GuestLayout` (`/my-stay`, `/guest/*`) | `GuestHeader` | `WorkspaceHeader` baseline + guest controls | Pending (Phase 3) |
| `MCLayout` (`/mc/*`) | `MCHeader` | `WorkspaceHeader` baseline + MC controls | Pending (Phase 3) |
| `VendorLayout` (`/vendor/*`) | `VendorHeader` | `WorkspaceHeader` baseline + vendor controls | Pending (Phase 3) |
| `AdminLayout` (`/admin/*`) | `AdminHeader` | `WorkspaceHeader` baseline + admin controls | Pending (Phase 3) |

## Route Segmentation Source

Route metadata resolver is centralized in:

- `src/lib/config/routeMeta.ts`

Current `workspace` prefixes:

- `/admin`
- `/vendor`
- `/mc`
- `/owner`
- `/team`
- `/staff`
- `/developer-portal`

All other paths currently resolve to `customer`.
