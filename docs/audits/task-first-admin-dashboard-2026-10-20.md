# Task-first platform administration

Base: main `0c1add9a3a4e5154393b65e3bf29ad7821a24519`.
Branch: `feat/task-first-admin-dashboard-20261020`.

The approved Library concept `libfile_0a236d0a0cd881918d8de6de2183519b`
(1,312,988 bytes) and original screenshot
`libfile_552909752bb881919cce2cddf6a724bd` (187,019 bytes) were materialized
into this Windows executor through supported signed transfers and viewed as
pixels. Returned version metadata/Library identity were retained in NTFS streams.
The concept's numbers are illustrative and are never application defaults.

## Delivered source behavior

Today uses the available admin work area after the sidebar. Decisions precede
four separate review/provider/order/support queues. Review explicitly shows
listing and property sources and links. Queues overlap and are never summed as
unique tasks. Priority follows work type/age, not count-to-red thresholds.
Search filters actual displayed queues; it does not pretend to search private
records or implement unsupported assignment filters. Native links, existing add
property/service flows, refresh single-flight and visible source freshness remain
usable by keyboard. The existing launch/maintenance control is retained under
System Settings rather than presented as a daily decision. Its writer and
permissions are unchanged; no toggle was executed.

All 74 prior specialist navigation destinations are retained once. The primary
five are Today, Requests/orders, Review, Catalog and Participants; Reports and
Settings are secondary. Mobile uses compact localized labels for the same paths.
Staff keep their existing overview; unresolved/absent admin permission never
mounts platform read components. Platform count and evidence hooks are actor
bound and disabled until the existing admin check succeeds. Server permissions
remain the authority; no role, policy, grant or production record changed.

## Queue/count contracts

`adminDashboardQueues.ts` is shared by exact count reads and target list filters.

| Queue | Source and predicate | Destination |
| --- | --- | --- |
| Pending orders | orders.status=pending, deleted_at IS NULL | operations?tab=bookings&status=pending |
| Older pending orders | above plus created_at before the exact snapshot cutoff | same with validated created_before ISO |
| Manual review | manual_payment_requests.status IN(awaiting_admin,contacted) | tab=manual-payments&manual_status=review |
| Unverified providers | providers.is_verified=false, excluding NULL | providers?filter=unverified |
| Active support | support_tickets.status IN(open,in_progress) | tickets?status=active |
| Partner applications | partner_applications.status=pending | partner-applications?status=pending |
| Pending review | independent listings/properties approval_status=pending; nondeleted properties | moderation with explicit type=listing/property |

Orders and manual requests use exact-count pagination rather than silently
capping reachable records. Search of order customer/participant text remains
explicitly current-page; it does not claim a new global server search contract.
Provider/ticket/application existing API limits are disclosed. URL filters,
history, page/reset composition and existing write handlers are preserved.
Legacy bookings.status=submitted stays a distinct metric and is not linked to
the commercial orders queue. Older pending status does not establish nonpayment.

Each failed/missing exact source count is NULL with source error metadata; valid
zero remains zero. Last successful read timestamps age visibly. One failed
source does not suppress successful counts. Target list errors are explicit and
never displayed as empty success.

## Configuration and analytics evidence

The compact status card distinguishes configured, not configured, query-verified,
review and unknown. Reconciliation actually filters the last30days with both
time bounds; errors/null counts cannot turn green. Missing or malformed vertical
settings are unknown. Email/WhatsApp settings do not prove delivery; Stripe mode
does not prove successful payment processing.

The period panel reads existing platform_metrics for7/30/90 completed Phuket
civil days. Missing days, null numeric values or duplicate daily snapshots do
not fabricate zero totals/growth. GMV and platform revenue are separate snapshot
estimates, explicitly not ledger-confirmed revenue. The historical source lacks
currency; no THB assumption is added. Daily subscription snapshots are excluded
to avoid summing recurring snapshots as period revenue. The existing global
useAdminAnalytics remains unchanged outside this dashboard slice.

## Verification and limits

Focused checks completed before draft:

-83 navigation tests, preserving all prior routes and exact Today activity.
-34 health/analytics helper, reader/access, UI and existing finance tests.
-11 queue/order filter/pagination/history/error tests;13 existing provider-route tests.
-4 partner application status/history/permission/error tests.
-9 new independent count/state tests;16 existing moderation tests.
-6 Today layout/search/refresh/access tests.
-Scoped lint: no errors; existing queue/settings warnings and2 component-export
  fast-refresh warnings remain. Python AST, Node fixture syntax, dependency-only
  bundle guard, workflow YAML and required dashboard outcome checks pass.

Full local TypeScript is running at draft creation and is not claimed passed.
Fresh remote full unit/PostgreSQL/build/lint and browser enforcement remain
required. The additional early dashboard fixture has60 scenarios: RU/EN/TH,
375/768/1280/1920 widths, full/one-source-failure/stale/no-snapshot states and
staff/unauthorized boundaries. Actual dashboard components and production CSS
are rendered. Read hooks, staff overview and sidebar frame are disclosed
synthetic boundaries; exact destination list equality/history has separate
component/predicate tests. Fallback-font geometry is not canonical-font or
physical-device certification. The fixture denies network and business writes,
captures incremental results/screenshots/inputs, and is an additional mandatory
final CI outcome. No browser was launched locally.

This is source/isolated evidence, not deployed readiness. Parent coordinates
review, merge and publication. Public wide-screen changes are independent in a
different branch/worktree.
