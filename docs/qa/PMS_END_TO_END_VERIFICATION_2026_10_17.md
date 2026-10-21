# PMS workflow verification — 2026-10-17

See [connected implementation/evidence register](CONNECTED_SYSTEM_EXECUTION_2026_10_17.md) for baseline, exact boundaries, CI and remaining plan gates.

| Journey | Verified boundary / fix | Hosted boundary |
| --- | --- | --- |
| Bookings list → detail | Real page selection, safe bulk-confirmation boundary, error/retry, Bangkok civil dates; released orders not current/upcoming; early checkout classified completed | Live order writes and guest-record access not exercised |
| Calendar → stay span | Existing real calendar projections and half-open/date regressions retained; synthetic browser fixtures | Inventory holds/constraints not invoked on production |
| Today → arrivals/departures → cleaning | Checkout remains a departure and dirty signal; early Bangkok cleaning completion included; failed source is an error, not no work | No production task/booking completion |
| Task completion → refresh | Real useOperationalTasks with an in-memory mutation adapter and observed query invalidation | Task completion does not establish order check-in/out; lifecycle adapter remains a blocker |
| Owner reports | Error and retry distinct from no reports; ID/data contract traced | Report generation/payment/recipient distribution not exercised |
| Property/category/plan entry → public offers | Returned identity required; private and guest date/guest cache variants refreshed; missing/foreign update rejected | Actual permitted persisted production edit not performed |
| Data-entry drafts → cancel/reset/reopen | LocalStorage/fake-timer regressions for empty mount, meaningful edits, discard and reset | No business data involved |
| Scheduled backup | Actual entrypoint, synthetic data/auth/storage, 15 deny/failure/success/pagination cases | No real upload or scheduler call; absent owner_reports/source/version and storage path contract remain blocked |

Browser fixtures render actual PMS components with synthetic hooks/data and forbidden production requests. They are not a complete hosted E2E user journey. Final-state run IDs/results are linked in the connected-system report/PR. Tests from an earlier commit are not substituted for final runtime verification.

No production business writes, notifications, real payment/refund, export, seed, enforcement, migration, deployment or publish were used for verification. No new stay, person, inventory, money, ledger or permission model was introduced.
