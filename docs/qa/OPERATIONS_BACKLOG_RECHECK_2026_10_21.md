# Operational backlog recheck — 21 October 2026

Verified main: `fb4b944a4c736f680ddb8e4b178f833030e021b1`. Homepage compatibility target: `f782951188ab35322a4f9ca06f8789185721b2ca`. No production mutation, migration application, activation, merge, deployment or permission change was performed.

## PR 123: source reconciled, final CI in progress

Original head: `3f9c812d4762ad7efd12fa8d3642a7a0ca5d1e76`. Refreshed head: `a4378a8c4aa6fd8547c64ed7e0f8196cb2333dcf`.

Three conflicts were resolved in the connected workflow, MarketplaceServiceGrid and useAdmin. The current shared ServiceSummary, paginated provider queue, stable ordering and exact editor lookup remain. Legacy service-editor reads retain actor-bound cache keys and signed-out disabling. Three regression cases cover actor changes, filtering before pagination and exact lookup/read failures. TypeScript caught a duplicate error member introduced by automatic merging; it was removed.

The service framework is registered as the 22nd fixture in the existing runner. The exact registry test was updated to include it; the two-worker cap and 180-second timeout remain unchanged. No security guard or public projection was relaxed.

Local results: the original 70 focused cases had 67 passes and three timeouts. Both affected files then passed 11/11 with the original five-second limit. New hook regressions passed 3/3; narrow lint passed; runner tests passed 13/13. A network-denying browser fixture passed 64/64 RU/EN scenarios using installed system Chromium; mobile editor and desktop operator screenshots were inspected. Exact head `917a3493e` passed remote TypeScript; subsequent changes only affect MJS/Python tests.

Final checks at 16:06 UTC:

- [Verify](https://github.com/pavel949/myuno/actions/runs/39631329749): in progress.
- [Connected verification](https://github.com/pavel949/myuno/actions/runs/39631329704): in progress.
- [Semantic Core](https://github.com/pavel949/myuno/actions/runs/39631329936): success.

Worktree was clean. A merge-tree check with homepage PR 156 succeeded, producing combined tree `0d8c4dbea566b49eb6f8465972351e5d4cc0a409`. This checks conflict compatibility, not final integrated acceptance.

Backend gates remain open: unscheduled structured requests still encounter a timestamp requirement; instant capacity, checked status transitions and legitimate customer cancellation need server acceptance. Affected-row/error feedback is not that acceptance. No service payment or order authority was added.

## PR 96: critical dependency reconciliation required

Head: `89d29fc7caacb92fd9ff720ae227057b77878508`, stacked on PR 95. Historical checks are green. Current merge-tree has eight conflicts: workflow, migration snapshot 0035, migration journal, useActiveCompany, unoTeam PostgreSQL fixture, MCSettings, StaffPage and invite-team-member.

Main migration `0035_restore_anon_execute_public_read_rpcs` collides with branch migration `0035_final_order_mutation_containment`. Numbering and predecessor checks must be coordinated with PR 95 before the subsequent setup migrations. Source history does not authorize replaying migrations. The current invitation entrypoint delegates to a checked handler; do not overwrite it with the older monolithic implementation.

OperatingSpaceSetup, StaffAccountLinks and managementTermsConfiguration are absent from main, so the intended setup functionality is not wholly superseded. Current private-cache/error behavior and team actions must survive reconciliation. Nothing was activated or applied.

## PR 150: preserve useful work, replace obsolete writers

Head: `cef10802fbf3e0816864d446d78cf747c2627fe9`; 38 files, historical checks green. Family inventory and turnover triggers require critical review, isolated tests and a verified manifest. The unresolved 39/94-key definition in the PR description is not a seed.

Its iCal path creates confirmed commercial orders using inferred prices and commission. Replace this path with PR 111's governed inventory-only import. Booking-hook changes extend legacy raw order creation and delete-based rollback; reconcile with PR 125's checked atomic command rather than layering parallel authority. Reuse shared civil-date helpers and the current canonical pricing calendar. A default-off feature flag does not contain unconditional legacy iCal behavior. Statement rollup wiring is explicitly deferred. No activation or seeding occurred.

## PR 40: not a lockfile repair

Head: `ae3388f7babd30a24ac231a8e28817c11ab6fa82`; 21 files, +3401/-2756, including architecture validators, repositories, payment surfaces and StaffPage. It removes staff property-assignment UI and hooks, losing a required operational function. Proposed order cache keys lack the actor, and the session reader omits projection from its key. Polling can leave errors in indefinite loading.

Dependency reconciliation owns package files separately. Read deduplication remains a refactor proposal requiring actor-bound caching, explicit missing/error/timeout states and preserved staff assignment. No wholesale transplant was performed.

Running checks are not acceptance. This documentation branch does not mark another PR ready or resolve the listed critical gates.
