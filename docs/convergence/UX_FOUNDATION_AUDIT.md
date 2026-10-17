# UX foundation audit — Homes and PMS

Tranche 2A · 2026-10-17 · documentation only.
Execution authority: [Connected Product Blueprint](../canonical/MYUNO_CONNECTED_PRODUCT_BLUEPRINT.md).

## Evidence standard

This audit inspected route declarations, page registration, representative pages,
layout adapters and canonical data documentation. **No browser/visual or signed-in
workflow verification was performed.** Mounted in source does not mean reachable
under every account. All visual clipping, control reachability, live map behavior
and account-specific access remain runtime verification needed. Line ranges refer
to this audit's source revision, not permanent anchors.

CONFIRMED SOURCE = an explicit route/control/layout/query declaration.
RUNTIME NEEDED = a rendered outcome or business usability assertion not proven
by that declaration. No layout defect is inferred merely from a grid/scroll class.

## 1. Consumer Homes inventory

Parent `/property` is `PropertyHub` in
`src/components/layout/AnimatedRoutes.tsx:347–350`; children are registered in
`src/components/layout/routes/propertyHubRoutes.tsx`.

| Surface / current route | Current component / dependencies | Source evidence |
|---|---|---|
| Entry `/property` | `src/pages/property/PropertyHub.tsx`, `PropertyLanding.tsx` | Child routes :28–40 preserve query bookmarks by redirecting to browse; no query renders landing |
| Results `/property/browse` | `src/pages/property/PropertyIndex.tsx`; `AirbnbSearchBar`, `UniversalFilter`, `PropertyListingCard` | Routes :40; page :13–28, :80–97, :374–447 shows URL/storage hydration, skeletons, listing grid and empty/reset states |
| Search/results `/property/search` | `src/pages/property/PropertySearchPage.tsx`; same search/filter/listing primitives, `PropertyMapView`, `useMapListSync` | Routes :67; page :18–32, :40–131 shows URL search input, rent/buy mode, server filters and shared selection hook |
| Standalone map `/property/map` | `src/pages/property/PropertyMap.tsx`, map-listing hook/markers and filter sheet | Routes :70; page :20–61 defines type/distance options, URL district and markers |
| Project results `/property/offplan` | `src/pages/property/OffplanIndex.tsx`, project cards, `useOffplanProjects` | Routes :75; page :87–126 combines server and client filters |
| Project detail `/property/offplan/:id` | `src/pages/property/OffplanDetail.tsx`; project-unit sources | Routes :76; `useOffplanProjects.ts:264,299,364` reads `property_projects`; `useProjectUnitsGrid.ts:40–92` reads `project_units` |
| Listing/home detail `/property/:id` | `src/pages/property/PropertyDetail.tsx` | Routes :120–122; detail :311–312, :411–421 declares main/side columns and facts grid |
| Resale `/property/resale`, `/property/resale/:id` | `ResaleIndex.tsx`, `ResaleDetail.tsx` | Routes :82–84; separate current sale surface, not a second rental inventory |
| Request/payment return `/property/:id/inquiry`, `/property/deposit-success` | `PropertyInquiry`, `PropertyDepositSuccess` | Routes :69, :122; retain checked server quote/payment path |

There is **no verified separate consumer `project_units` detail route in this
sample**. `/property/:id` is a listing route, not automatically a project-unit
ID route. Trace project→unit→listing identity before later connecting the portal.

### Current IA versus approved target

- CONFIRMED SOURCE: `PropertyHub.tsx:42–125` defines nightly/monthly/yearly,
  Buy, New, Resale, Quick Sale, Commercial, Hotels, Land and authenticated My
  tabs, with some persona gating. :127–153 selects tabs from paths/query state.
  This is broader than the approved two-choice RENT | BUY consumer target;
  **no target IA is implemented in this tranche**.
- CONFIRMED SOURCE: `PropertyLanding.tsx:48–65` composes seeker/rental/offplan/
  resale/investment/capital/pro sections. Whether these compete visually for
  priority is RUNTIME NEEDED; retain non-consumer business entry destinations.
- CONFIRMED SOURCE: browse/search are distinct current pages sharing primitives,
  not identical redirects. Search has `PropertyMapView`/`useMapListSync`; browse's
  map button at `PropertyIndex.tsx:398` navigates to the map route without passing
  the current search string. Full filter/date/selection round-trip parity is not
  established: verify before consolidating, retain current query contracts.
- CONFIRMED SOURCE: both sampled results pages use `usePropertiesInfinite`;
  `PropertySearchPage.tsx:125–131` does not destructure a query error there;
  `PropertyIndex.tsx:422–447` has empty/reset states. Distinguishing network error,
  permission denial and truly empty catalogue requires runtime/error-path review;
  absence of an error branch in the sampled UI is not proof of all hook behavior.

### Consumer responsive and controls review queue

| Source fact | Runtime check needed | Adapt later / retain |
|---|---|---|
| Hub has many context tabs (`PropertyHub.tsx:42–125`) | Selected tab reachability, one primary consumer choice at 375/390/430 | Adapt hierarchy into Rent/Buy; retain destinations and permissions |
| Browse renders two columns on phones (`PropertyIndex.tsx:402`); recently-viewed strip scrolls (:365) | Long RU/EN titles, price labels, card touch targets, bounded scrolling | Retain real listing cards; adapt spacing only after screenshots |
| Detail uses `lg:grid-cols-[1fr,minmax(320px,420px)]` and two/four facts columns (`PropertyDetail.tsx:311–312,411–421`) | Sidebar stacking, sticky action collisions, longest labels | Retain quote/availability behavior; adapt layout only |
| Offplan mixes server/client filters and sheet controls (`OffplanIndex.tsx:87–126`) | Clear active filters, multi-choice vs single-choice control semantics and reset behavior | Retain canonical project fetches and disclosure |
| Map declares type/distance options and marker state (`PropertyMap.tsx:20–61`) | Tiles/markers, selected card, keyboard/touch, results parity | Adapt shared results↔map experience without a second query/price authority |

## 2. PMS inventory

`AnimatedRoutes.tsx:763–764` mounts `/mc` inside `ActiveCompanyProvider` →
`MCGuard` → `MCLayout`. `src/components/mc/MCLayout.tsx:10–18` is a thin
`AppLayout variant="workspace" navRole="owner"` adapter, **not a second PMS**.
Retain `src/components/nav/NavShell.tsx` and role-aware `src/lib/navConfig.ts`
destinations. `/operate/*` in old architecture prose is a target, not the mounted
MC route family. See child declarations in `routes/mcRoutes.tsx`.

| Surface / current route | Source component | Evidence / workflow |
|---|---|---|
| Workspace `/mc` | `src/pages/owner/OwnerDashboard.tsx` | MC routes :20, owner navigation in `navConfig.ts:29–40,88–96` |
| Today `/mc/today` | `src/pages/mc/operations/PmsTodayPage.tsx` | MC :47; page :80–188 has arrivals/departures/in-house, unit state, requests and existing links |
| Calendar `/mc/calendar` | `src/pages/owner/OwnerCalendar.tsx` | MC :48; page :103–220 has single/multiple properties, selection, booking/task creation and tasks |
| Booking list `/mc/bookings-list` | `src/pages/owner/MCBookingsPage.tsx` | MC :124; list uses search/status/sort/export/selection and detail sheet |
| Booking/stay detail (selected list item) | `src/components/owner/BookingDetailSheet.tsx` | :27–50,44–188; responsive booking information/history; **not a verified separate Stay 360 route/model** |
| Property `/mc/properties/:id` | `src/pages/owner/OwnerPropertyDetail.tsx` | MC :34; page :15–31,61–67 has documents, owners, listings, deals, notes, terms, keys, utilities/checklists |
| Property tools `…/editor`, `/terms`, `/setup`, `/guidebook`, `/inventory`, `/juristic-requests`, `/portal-settings` | Current page registry/components | MC :35–46; existing tools across routes, not a single new Property Workspace |
| Structure/rates `/mc/structure`, `/mc/rates` | `PropertyStructurePage`, `RateManagementPage` | MC :118–119; retain category/rate authorities from Tranche 1 |
| Operations `/mc/operations` | `src/pages/owner/OwnerOperations.tsx`, `OperationalTaskCard`, `useOperationalTasks` | MC :50; page :8–16,46–66,110–139 defines property filter, task date tabs and create action |
| Finance `/mc/finance` | `src/pages/owner/FinanceOverview.tsx` | MC :51; summary/chart, income/expense and links |
| Finance tools | `/mc/financials`, `/budget`, `/reports`, `/invoices`, `/finance/planning`, `/finance/owner-payouts`, `/finance/ar-aging`, `/finance/tax-center`, `/finance/statement-approvals` | MC :52–59,67,84–90; retain current accounting/permissions, no P&L build |

### Concrete PMS source facts and runtime risks

- **Today:** `PmsTodayPage.tsx:85–89,110–188` has header refresh, similarly
  treated arrival/departure/in-house sections, and outlined calendar/tasks links.
  CONFIRMED hierarchy; operator priority and rendered competition are RUNTIME
  NEEDED. No Today redesign is authorized now.
- **Calendar:** `OwnerCalendar.tsx:32–36` initializes a responsive view using
  `window.innerWidth`; :120–140 uses plain buttons for exclusive view modes;
  :190–209 places booking/task actions side by side. :105,213–220 already has
  `min-w-0` and bounded grid tracks: retain these safeguards. Check resizing,
  selected-mode accessibility and action hierarchy; do not assume broken reflow.
- **Bookings:** `MCBookingsPage.tsx:205–225` has CSV/New and four summary columns;
  :290–300 has six tabs in an `overflow-x-auto` region; :305–349 has checkbox
  bulk selection and confirm/cancel actions; :380–394 nests a checkbox in a
  clickable card. This is a real interaction boundary to verify for propagation,
  focus/labeling and accidental actions, **not a confirmed click defect**.
- **Booking detail:** `BookingDetailSheet.tsx:44–188` is primarily information
  and history. Whether management actions belong elsewhere is workflow review
  needed, not an instruction to add money/status controls to this sheet.
- **Property detail:** `OwnerPropertyDetail.tsx:88–109` distinguishes loading
  from missing property, but the sampled hook result exposes no error separately
  at :61. Verify missing/denied/network-error distinctions and long tab labels.
- **Operations:** `OwnerOperations.tsx:110–139` already has a primary Task
  action and a property filter. Do not rebuild it as Today. :57–81 uses local
  date helpers: timezone comparison with Bangkok Today is a separate potential
  logic audit, not a redesign change; no observed defect asserted here.
- **Finance:** `FinanceOverview.tsx:72–128` declares three summary columns and
  clipped card regions; :134–149 uses Expense primary/Income outline. Validate
  money labels at 375/390/430 and error/empty/loading states. Preserve accounting
  computations; UX cannot certify gross sums as reconciled P&L.

No sampled finance controls require radios/checkboxes/switches. Do not introduce
them decoratively. Keep booking checkboxes for independent selection; exclusive
view/filter choices need coherent selection semantics; persistent settings need
switches. Confirm semantics and accessibility in the actual component before edits.

## 3. Aliases, overlaps and deprecated references

| Evidence | Classification | Disposition |
|---|---|---|
| `/property/rent`, `/buy`, duration aliases → `/property/browse?mode=…`; `/project/:id` and `/projects` → offplan (`propertyHubRoutes.tsx:43–80`) | Redirect aliases, not duplicate UI models | Preserve bookmarks/query semantics; no deletion for appearance |
| `/offplan*`, `/newbuilds/projects*` redirects (`AnimatedRoutes.tsx:355–356,396–407`); `/newbuilds` remains separate landing/tools | Aliases plus distinct entry surfaces | Audit traffic/entry purpose before simplifying |
| `/property/browse` vs `/property/search` | Overlapping result UIs with different state/map behavior | Later reconcile presentation/state deliberately; no new listing store |
| `/mc/bookings` → list; `/mc/properties/:id/manage` → editor; `/manager/calendar` → MC calendar | Existing adapters (`mcRoutes.tsx:38–49`; `AnimatedRoutes.tsx:691–699`) | Retain; do not recreate removed shells |
| `/mc/quick-expense` and `/mc/expenses/quick` mount the same QuickExpense (`mcRoutes.tsx:57–58`) | Two route entries to one implementation | Preserve compatibility, not a second accounting model |
| `/mc/today` and `/mc/operations` | Snapshot versus task workflow | Clarify navigation purpose later; do not merge their logic now |
| `usePropertyComplexes.ts`, `useDevelopmentUnits.ts`; gated fallback `useProjectUnits.ts:78–99` | Existing deprecated hooks/rollback fallback | No new reads/writers; not proof consumers generally use legacy stock |

`REAL_ESTATE_DOMAINS.md:10–38` and `src/lib/real-estate/domains.ts:60–99`
mark `property_complexes` / `development_units` deprecated. Older
`UNIT_TABLE_MIGRATION.md:7–17` describes different project-view backing than
the domain doc and current offplan queries. **Retain current project/view
adapters and `project_units`; do not solve documentary drift with new tables.**
Generated route-orphan reports are heuristic leads, not safe-delete evidence.

Identity drift also matters: `useUnifiedContact.ts:17,37–60` reads links/views
for `crm_contacts`, `capital_contacts`, `vendor_prospects`. These existing scoped
records are not proof of one fully reconciled PERSON/ORGANIZATION registry.
Relationship, persona and authorization remain separate conceptual layers.

## 4. Retain versus adapt

**Retain:** current MC/AppLayout, property hub route contracts, auth/guards,
shared filters/listing/project primitives, existing domain IDs, categories/rates,
server pricing, quote snapshots, booking/inventory predicates and ledger/RLS.
No money/status/permission rule changes merely to simplify a page.

**Adapt later:** current listing-card/result-toolbar hierarchy; shared Rent/Buy
portal presentation; booking list selection ergonomics; Today priority; property
tool navigation; calendar mode/filter ergonomics. Donor Today, Stay 360, Property
Workspace, Agent Workspace, Unified Calendar UX and Project Portal remain
unreviewed adaptation patterns, not imported components/models.

## 5. Prioritized controlled UX tranches

1. **First recommendation: MC bookings-list header/filter/selection ergonomics
   only**, scoped to `MCBookingsPage.tsx`. Retain query, mutations, permissions,
   status predicates and detail sheet. Keep New primary, export/sort secondary;
   validate bounded tabs, checkbox/card focus and bulk-selection feedback.
   Gate: authenticated representative list at 375/390/430 and desktop, RU/EN,
   loading/error/empty; existing status/inventory tests unchanged. Do not invoke
   confirm/cancel on guest bookings merely to verify layout.
2. Calendar controls/action hierarchy, with existing hooks/constraints unchanged.
3. Today presentation priority over current data/actions, after operator workflow
   review; no schedule or task model replacement.
4. Consumer result↔map state parity and Rent/Buy toolbar, before larger portal
   implementation; explicit date/filter/navigation regression checks.
5. Shared Project Portal + project/home card distinctions after current project
   linkage verification; then Property Workspace / Stay 360 presentation.
6. Agent Workspace and Financial Close/P&L only after independent CRM/identity
   reconciliation design and accounting evidence; neither is authorized here.

Runtime gate applies to each: screenshots and interaction checks with real
authorized data, no page overflow, reachable controls, clear states and no
unintended business transition. No visual fix, workflow completion or signed-in
quality gate is claimed by this documentation audit.