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

First full local TypeScript found TS2352 in sparse mock casts in two test files.
The partial-return attempt subsequently failed the remote discriminated-union
check. The review correction now derives complete offline QueryObserver results
from the actual library, without changing production types or assertions.
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

## Review corrections

Provider, partner-application and support queues apply server filters before
bounded pages and return exact matching counts. Stable created_at/id ordering
prevents equal-timestamp records from repeating or disappearing between pages.
Synthetic tests retain older actionable records behind over 1,000 newer rows,
and verify all pages with identical timestamps. Read failure is unavailable,
and cached provider rows are explicitly stale. Existing object/route authority
and mutation functions remain unchanged.

Team dashboard callers no longer convert unavailable platform counts to zero.
Actor-bound admin queries mask cached data while admin access is unresolved or
removed; non-admin TeamDashboard coverage observes no platform reads. The admin
header now fills the same frame as its body. Actual search and sidebar Escape
focus regressions were reproduced and fixed; four navigation tests pass.
Decision counts sit beside their actions, mobile queues precede system status,
supplementary queues participate in search, and technical metric detail is
disclosed on demand while estimate/currency limitations stay visible.

Review checks: 20 provider/partner focused tests, 6 Team boundary tests,
24 evidence/finance tests, 4 actual navigation tests and 15 root ticket/Today/
moderation tests passed in separate runs. Root scoped lint has no errors.
Earlier simultaneous full local typechecks were cancelled after host memory
pressure; they are not passing evidence. A single stable-source full check was
completed for this review batch with one TS2769 in the new navigation test:
getByRole does not accept an exact option. An anchored name expression preserves
the exact assertion using the supported API. Fresh exact-head CI remains required.

The additional actual-shell fixture has 18 cases at 320/2560 px in RU/EN/TH,
full/zero/total-source-failure states, including actual shell, menus, dialogs,
74 destinations and keyboard focus. It supplements the prior 60 cases.
Both result JSON files must independently contain their full intended case
count and only PASS rows at final CI enforcement. Empty synthetic import.meta.env
is explicit; there are no real API keys. Remote geometry is pending until those
artifacts are inspected. No local browser or release was performed.

## Connected executor follow-up

Resumed from e6cea8391 with a clean tree. Integrated main
dab2a360a9199b87d86a6ed9e3cb2b347e20dc9b; the sole workflow conflict was
resolved by retaining both dashboard gates and the already accepted public-wide
gate, artifacts and final enforcement. PR149 itself was not changed.

Admin mobile preferences now use one 44px control; language, currency and theme
remain available in its popover. Account and sidebar/search controls retain 44px
mobile targets. Ctrl/Cmd+K belongs explicitly to AdminLayout's command palette;
TopBar does not handle that shortcut for admin. The palette will not stack over
another modal and restores its keyboard origin on close. The actual AdminLayout,
AppLayout, NavShell and command palette are now included in the shell fixture.
Its Tab target check uses document.activeElement instead of the nonexistent
Python Locator.is_focused API. Real Tab/Enter/Escape and both shortcut modifiers
are exercised, including preferences and account focus return.

The moderation fixture now checks four actual linked count cards and their
destinations, unavailable-not-zero labels and rendered text-line bounds rather
than the removed six-card/icon DOM. Synthetic failed sources are explicit nulls.
Unavailable labels are consistent in all three locales.

The two queue searches use a separate literal-value builder: PostgreSQL LIKE
backslash escaping followed by PostgREST quoted-value escaping. The actual
Supabase client performs URL encoding. Fixed column lists prevent grammar from
coming from the user. A literal star uses an escaped, bounded regular expression
because PostgREST treats stars as LIKE aliases. The global sanitizer is unchanged.
Server rows and exact counts share one predicate; redundant client re-filtering
was removed. Providers also search their existing email field.
References: https://docs.postgrest.org/en/stable/references/api/url_grammar.html#reserved-characters
and https://www.postgresql.org/docs/current/functions-matching.html#FUNCTIONS-LIKE.

56 focused tests passed, including actual AdminLayout shortcut/focus behavior,
actual-client synthetic URL transport and provider/application literal searches
for full email, apostrophe, underscore and percent, with nonliteral decoys and
exact counts. Existing edit/refetch and moderation tests remain passing.
Scoped lint had zero errors (12 retained source warnings after correcting the
new test label). Shell and moderation bundle-only guards, Python AST, merged
workflow gate parsing and diff checks passed. The evidence guard now verifies
unique expected matrix keys, required source/interaction/access evidence and
44px mobile targets; its positive and negative checks run in CI.

Fresh exact-head full CI and raw geometry artifacts are required. No new local
full TypeScript success, physical-device result, merge or publication is claimed.

## Command palette readiness investigation

Exact head88f2336 passed remote TypeScript and3886 tests; the single local full
TypeScript process (session52801) also completed successfully. Shell artifact
12254560904 was downloaded and inspected:18unique cases,13PASS/5FAIL. All mobile
geometry/44px checks passed. Five full-state cases retained a focused command
input after one Escape. The EN320 failure pixels confirm one open command menu.

The command iterations omitted the existing dialog readiness helper used by
global search and mobile Sheet. Installed Radix code registers Escape callbacks,
layer membership and callback updates in passive effects, whereas visibility and
auto-focus can precede that lifecycle completion. This supports a readiness-race
hypothesis; it does not establish a product defect from the old artifact alone.

Both Control+k and Meta+k now observe the same real portal-animation/position/
focus contract before one Escape. No sleep, repeated Escape, forced focus,
animation override or excluded case was added. Each shortcut records its ready
state and closed-dialog diagnostics; failures capture a separate language/width/
modifier JSON and screenshot with the failing phase. Final evidence guards now
require both settled iterations, dismissal and focus return. Fresh full CI and
raw18case evidence remain required to validate the hypothesis.
