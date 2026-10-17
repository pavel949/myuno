# Connected system implementation and verification — 2026-10-17

Repository: `pavel949/myuno` (not `myUNO-final`). Baseline: `0c7f027ee4529b117e0bd91891178b7d907db9d7`.
Execution authority: user-requested repository plans, [connected product blueprint](../canonical/MYUNO_CONNECTED_PRODUCT_BLUEPRINT.md), and `AGENTS.md`.

This is an implementation/evidence register, not a claim that every business process is production-ready. No production bookings, guests, tasks, payments, assignments or enforcement settings were mutated. No email/WhatsApp, payment, migration, edge deployment or publish was invoked. Backend edits in this branch require separate deployment verification.

## Delivered connections

| Flow | Change | Regression boundary |
| --- | --- | --- |
| Booking list → operational time/status | Bangkok civil-date display and half-open stays; release statuses excluded from current/upcoming counts; early checked-out visible as completed | Real page with synthetic query, RU/EN and three timezones |
| Checkout → Today → turnover | Same-day checked-out stays remain departures without becoming in-house; cleaning completion query begins at Bangkok midnight | Real hook, emitted PostgREST filter and synthetic rows |
| Failed operational read → visible error | Task-source failures cannot certify no work; booking and owner report failures have retry | Component/hook tests, no backend network |
| Worker category/plan/room/type save → persisted result | Require returned saved identity; denied/missing/mismatched row cannot report success | Synthetic PostgREST mutation results; no access grants added |
| Worker category/plan/room save → guest quote | Await editor and all date/guest offer cache invalidation | Existing React Query cache, synthetic writes |
| Admin/vendor data entry → draft restore/discard | Empty initial/reset forms do not create drafts; discard cancels pending autosave; later edits still autosave | Fake timers/localStorage; existing shared hook |
| Browse ↔ map ↔ listing | Existing map uses the same filtered loaded results and URL context; markers share focus; cards still open details | Real page/cards/URL hook, synthetic data and map rendering |
| Filtered pagination → later matches | No-match loaded pages expose Load more while further pages exist; exhausted empty state only at the end | Synthetic append, busy and exhausted controls |
| Scheduler → backup truth | Returned source errors abort that company's upload/success timestamp; exact-count pagination rejects incomplete collections; timestamp errors are reported | Actual entrypoint with synthetic internal auth/SDK/storage; pagination is not a transactional snapshot |
| CI → meaningful result | Dedicated isolated build/types/unit/PostgreSQL/timezone/browser/lint checks; final gate considers actual step outcomes | No backend secrets; Node TCP loopback guard plus browser request denial |

Pending/unknown/pending-payment occupancy remains the existing conservative order projection, not proof of physical check-in. Today operational status and rental inventory status remain separate domains. No booking or payment transition was added to task completion.

## Repository plan reconciliation

| Plan / source | Current disposition |
| --- | --- |
| E0 / E2.5 | Already implemented; live catalog functions/policies/flag lock reviewed. Enforcement/spaces/assignments/members observed 0/0/0/0. No activation in this work. |
| Production hardening, 2026-10-06 | Historical phases partially superseded by later migrations and financial audit; do not replay old migrations. Remaining money/writer issues stay NO-GO. |
| P0-A, 2026-10-17 | Server-price/discount, negotiated-price authority, off-platform settlement/deposit/reversal and atomic transition contracts remain unresolved in existing contract register. This branch does not invent them. |
| Resorts/hotels, 2026-10-16 | Existing categories, plans, restriction editor and public projections retained; this branch closes save/guest-cache gaps. Populated live acceptance and category→payment certification remain blocked. |
| UX foundation | Bookings/Calendar/Today prior presentation retained; this branch implements browse/map continuity and truthful states. Shared Project Portal, identity/CRM migration, and reconciled Financial Close are not claimed implemented. |
| Service data-entry audit | Shared bilingual hint already exists in actual Admin/Vendor forms. Draft lifecycle corrected. Old `/staff` shell is intentionally unmounted; it is not revived with invented authority. |
| Architecture audit, 2026-08-20 | Live relation census reconciled in ARCHITECTURE_SCAN.md; storage names separated from table names. No blind table creation or orphan deletion. |

## Evidence and limits

The baseline verify job's green conclusion was misleading: unit and lint used continue-on-error. Logs showed 1,447 passing tests, one stale InvestorGuard expectation, six PostgreSQL suites unable to find `postgres`, and a Node20 TypeScript config import error. The stale test is corrected to preserve server-role authorization; PostgreSQL tooling is installed in the isolated workflow; the canonical ESLint data module uses the existing TypeScript compiler.

Candidate workflow results and exact final SHA are recorded in the PR/CI links when available. Tests authored or prior candidate results must not be mistaken for a final-state pass. The browser harness uses the real UI and synthetic data, not hosted authorization or a real booking lifecycle. Live map tiles are stubbed. Node preload is a Node TCP guard, not an OS firewall; browser harnesses separately deny external requests.

## Remaining connected-system blockers

- Verified property/team manifests and staged operating-space cutover gates; no E3 or seed by implication.
- Authoritative financial contracts and isolated complete booking/payment/refund/ledger acceptance.
- Duplicate lifecycle task writers and order-ID versus booking-ID deposit linkage require explicit adapters and isolated writer compatibility evidence.
- `owner_reports` is absent and is not schema-equivalent to `property_reports`; export/backup report-source/version contract remains blocked. Backup storage key/first-folder policy mismatch is separately documented as RO-11.
- Missing active FastTrack addon and Outreach/health relations need schema/audience contracts; see the dated architecture reconciliation. No replacement table/model is invented.
- Populated real resort/category/rate data must be entered by the authorized team before live acceptance. Synthetic tests do not certify production data quality.

Rollback for code-only changes: revert this branch's commits; no schema/data rollback is needed. Do not restore incomplete-backup success reporting or weaken authorization to make tests pass.

## Observed runtime verification

Code candidate `7384dd921072f9bd5ae6590e3ceae0156dd3bae1`: [isolated run 39032019280](https://github.com/pavel949/myuno/actions/runs/39032019280). Types PASS; full suite **1,716/1,716 (90 files)**; focused **86/86 × 3 timezones**; backup **15/15**; production build PASS; Bookings/Calendar/Today/Browse browser fixtures PASS. [Artifacts](https://github.com/pavel949/myuno/actions/runs/39032019280/artifacts/12100872414) contain fixture screenshots and assertions; screenshots were not manually visually reviewed in this execution.

That candidate correctly FAILED the final gate: build/dev regenerated the Vite-owned MCP bundle with five `var` declarations, so lint still failed. The generated bundle is restored to baseline and excluded from authored-source lint; all `src/lib/mcp/**` inputs retain the same rules. This is not generator ownership transfer or a manual generated-code patch. The 2,505 existing warnings remain backlog, not zero-debt certification. Final lint result and PR checks are linked in [PR #89](https://github.com/pavel949/myuno/pull/89); do not infer final success from continue-on-error step conclusions.

Backup pagination is not a transactional snapshot: equal-count concurrent changes may escape detection. Returned SDK errors are handled per company; thrown/rejected queries reach the outer error handler and can halt subsequent companies. No complete restore or production backup certification is claimed.

The original `verify.yml` is also repaired: Node22, PostgreSQL binary provisioning/PATH, synthetic backend configuration, loopback TCP guard and maxWorkers=2. Unit and lint are now blocking rather than continue-on-error. Its previous green result with six PostgreSQL suites unable to start is not accepted as verification. The full connected-system workflow remains the build/browser/timezone evidence gate.
