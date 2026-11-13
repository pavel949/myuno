# Admin consolidation implementation — 2026-11-13

## Result

All approved D1–D13 recommendations are implemented as navigation and presentation changes. Existing working pages, forms, mutations and AdminGuard/AdminLayout authorization remain in place. No page or working tool was deleted.

| Decision | Implemented result |
|---|---|
| D1 | `/admin/control` redirects to `/admin`; Operations remains separate. |
| D2 | `/admin/analytics` combines Visits, Acquisition, Revenue and Marketing in URL-addressable tabs. |
| D3 | `/admin/catalog` combines Catalog, Categories, Taxonomy, Reference data and the Service editor. |
| D4 | Vertical editors remain working and are grouped under one collapsed, Russian-alphabetized Verticals menu group. |
| D5 | Inbox, Consultations, CRM and Tickets remain; new-development leads moved to Real estate. |
| D6 | `/admin/settings/forms` combines Request forms and Data intake settings. |
| D7 | `/admin/newbuilds` now opens the full project/developer manager with the existing operational KPI grid and links to projects, developers and leads. |
| D8 | `/admin/add` is the single Data entry hub for single, quick, bulk-text, CSV/Excel, structured import, bulk publication, partner content and vendor applications. |
| D9 | `/admin/transfers` combines Orders, Operators, Response times and Vehicles. |
| D10 | `/admin/settings/google-maps` combines Settings and Diagnostics. |
| D11 | Thai business moderation is visible under Requests & review. POI claims and restaurant data quality also have explicit entries. |
| D12 | QA, Trash, API keys, form settings and Maps remain under System. |
| D13 | Consolidated headings and menu labels use clear RU/EN pairs; Taxonomy, Transfers, Marketing and New developments were renamed. |

Legacy merged URLs use query-preserving redirects. For example, `/admin/services?action=new` opens `/admin/catalog?action=new&tab=services`, preserving the existing new-service action. Data-entry forms and vertical editors keep their direct routes because the hub and tabs link to those working tools.

## Files

- Shared tab workspace: `src/components/admin/AdminTabbedWorkspace.tsx`.
- New workspaces: `AdminCatalogWorkspace.tsx`, `AdminAnalytics.tsx`, `AdminFormSettings.tsx`, `AdminTransfersWorkspace.tsx`, `AdminGoogleMaps.tsx`.
- Newbuild KPI projection: `src/components/admin/AdminNewbuildsKpiGrid.tsx`.
- Routing and lazy registry: `src/components/layout/routes/adminRoutes.tsx`, `src/components/layout/pageRegistry.ts`.
- Navigation: `src/lib/nav/navigationModel.ts`.
- Existing pages updated only for headings, hub links or KPI composition: `AdminNewbuilds.tsx`, `AdminAddHub.tsx`, `AdminTaxonomyManager.tsx`, `AdminTransfers.tsx`, `marketing/MarketingDashboard.tsx`, `AdminGoogleMapsSettings.tsx`, `AdminQuickActionsGrid.tsx`.
- Regression expectations and fixtures updated for the consolidated inventory.

## Verification

- 31/31 focused admin navigation, guard, layout, settings and dashboard tests passed across five files.
- 4/4 newbuild KPI and price-editing regressions passed across two files.
- 18/18 isolated browser cases passed for actual admin route declarations and consolidated workspaces, including all legacy redirect families, preserved query parameters, default/active tabs and 384/1280px layouts. Child data surfaces were synthetic boundaries; every non-fixture request was blocked. No runtime errors or production requests occurred.
- Actual AdminLayout/SideRail passed RU 1280px and EN 384px with 63 unique menu destinations, all groups expanded, no runtime errors and no non-fixture requests.
- Mobile tab truncation found in the first browser pass was corrected; the full 18-case matrix then passed again.
- Automatic build log: `build OK` at 2026-11-13T02:54:56Z.

These are isolated component/navigation checks, not live admin data or operational mutation acceptance. Existing permissions were not changed or independently penetration-tested in this tranche.

## Boundaries

No production business reads/writes, migrations, edge deployments, Auth/invitation/settings changes or publication. No payments, bookings, orders, properties, tariffs or assignments were changed.
