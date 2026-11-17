# PR #234 — transport booking admission and review privacy

## Scope and contract

Read-only frontend admission over the existing transport catalogue, form and booking writers. A current vehicle and finite positive configured rate are required; unknown fares are displayed as requiring confirmation. The existing route rate × vehicle multiplier (rounded), otherwise configured vehicle base rate, night surcharge and 1.35 split remain unchanged for valid configuration. No invented THB 800 fallback or implicit multiplier is admitted. Catalogue loading/failure blocks submission; night configuration must settle before displaying a final total. The existing day-rate behavior on missing/failed night configuration is preserved.

All submit entry points validate current form/configuration. Authentication resume uses the latest committed handler, preserves a restored vehicle, and distinguishes successful authentication from dismissal. A callback is cancelled on unmount. These client checks are not a server quote, authorization or idempotency guarantee.

Fast Track keeps the existing 24-hour ICT rule, checks strict valid civil date/time and rechecks the clock at submission. Review masks passport data, while the existing submission receives the intact supplied value. Invalid restored passport values cannot crash review.

## Authority and rollback

No database/schema, Edge Function, RLS, financial writer, price authority, payment method, notification destination or inventory change. Existing checkout/notification boundaries remain in place. Synthetic tests exercise those boundaries without live writes. Server-authoritative pricing, actual delivery and commercial activation require their own acceptance.

Rollback the frontend commit through a reviewed forward revert; retain admission that rejects unknown prices and invalid flight dates, and retain passport masking. Do not reintroduce guessed prices to restore a button.

## Verification

- Pure fare/date tests and actual page integration tests cover missing/orphan vehicle rates, invalid/nonfinite totals, configuration failure/pending night rate, both transfer directions, cash/advance/card boundaries, failed creation/checkout, draft retention, auth success/dismissal/stale rates, strict dates and advancing cutoff, masked review and intact submission.
- `scripts/qa/transport-booking-safety.mjs` + `.py`: 48 network-denying cases, RU/EN, widths 375/390/430/1440. Actual booking pages/price steps/draft hook; synthetic identity, auth UI, catalogue, shell, address and write boundaries. Screenshots and source hashes accompany results. No real orders, payments or notifications.
- CI runs the fixture and uploads evidence under `connected-browser-evidence/transport-safety`.
- Generated route and primitive inventories are regenerated, not treated as runtime acceptance.

Compatibility and final check results are recorded below before merge.

## Compatibility snapshot — 2026-11-17

Integrated current `main` `d9bb2b9eb94f7a7c48cebb720ed8974fba287d2f` (home discovery PR #231) with no conflicts and regenerated both source inventories. On that combined source, 75 focused transport/home tests passed (7 files), including 42 transport tests. The browser fixture passed all 48 cases. Local production build and TypeScript completed; final PR checks are required for the merge head.

`git merge-tree --write-tree` against these open PR heads returned clean results (no textual conflicts):

| PR | Compared head |
| --- | --- |
| #222 | `162ccadba0f59543ac21269cf385da94cd14f49a` |
| #230 | `b3fa2042f2f18bd6e0c16c531a759ec4f794a06c` |
| #232 | `d4601b9fa736ada1e28d7ca6a998f37ef5442fa3` |
| #233 | `12996d2da328793d9ea5cea10ec9451bd3b43eee` |

Those PRs are not merged or activated by this change. Generated source inventories must be regenerated after any future integration; a clean textual merge alone does not prove their freshness. Recheck current main and the compared heads before merging because this snapshot cannot certify future commits.
