# Management-company finance overview: containment

**Scope:** `/mc/finance` in `pavel949/myuno`, not the platform-wide `/admin/finance`. Read-only UI containment; no schema, permission, provider, ledger or transaction writes.

## Evidence and contract

The overview previously combined property financial records over partly overlapping date ranges. The current-month card had no upper bound, so it included future-dated rows. Booking confirmation can create a record marked paid without a settlement event; imported booking deletion left financial records, and automatic ledger copies do not independently prove cash. None of those signals is sufficient to claim cash collected or net earnings.

The overview uses one actor- and company-keyed, existing RLS-protected property projection for the cards and chart. Six Bangkok civil months use half-open ranges and stop at the as-of day. Records remain explicitly unreconciled; income and expenses retain their native currencies and deposits are not treated as income. The chart is only in THB, and blank series are not coerced to 0. Actual cash is marked not reconciled even if records exist. Missing scope, read errors and no entries are distinct states. No operational record is rewritten or deleted.

## Verification / rollback

Synthetic tests cover the future-booking regression, Bangkok month change, year roll, payment-status non-authority, deposits, mixed currencies, omitted values and page truncation. The existing isolated visual fixture supplies only synthetic inputs. Before release, verify the candidate in the standard CI against its exact commit and confirm the screen at desktop and 375/390/430 px in RU/EN/TH. Revert this front-end commit to roll back; no data migration occurred.

## Separate accounting work

This is not reconciliation. Ratify a company-scoped source for confirmed receipts, settled expenses/refunds and balance reconciliation, then verify it against real evidence with authorized accounting personnel. Distinguish orphaned iCal booking rows and their mirrored ledger entries before any repair. Existing record-entry, history, and other finance surfaces are not certified as accounting reports by this change.
