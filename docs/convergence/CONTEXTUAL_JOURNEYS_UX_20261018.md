# Contextual journey corrections — 18 October 2026

## Scope and contract

This tranche preserves existing domain writers and permissions. It corrects frontend handoffs and the reporting of existing outcomes; it does not certify production booking inventory, anonymous availability access, or employee property assignments.

- Buyer comparison retains resolved offer intent and the original asking-price denomination. Purchase uses the existing `propertySaleAskingPrice` contract. Rental amounts never become purchase-price fallbacks for dual-listed homes. Missing price/currency remains explicit. Stored comparisons are snapshots, not authoritative quotes.
- Rental search dates are preferences, not evidence that every result is available. A valid selected range has an explicit availability-not-confirmed note. Detail controls hydrate validated URL dates/guest counts through the shared civil-date parser and retain subsequent user edits. Existing fail-closed availability controls remain authoritative for UI submission.
- Owner calendar/rates select URL property IDs only from the current accessible list. Unknown, loading, or removed-access selections never silently mean all properties. Calendar → rates → back carries context through an allowlisted return route.
- Existing preparation-task inserts report acknowledgement failures separately from an already-saved booking record. No automatic retry is added to non-idempotent inserts. The existing booking-shaped result gains transient outcome metadata only; this is not a new persisted status or inventory authority.

## Explicit boundaries

No schema, RLS, role, credential, production-record, payment, order-item, or inventory-writer changes. The existing `orders`/inventory-authority mismatch identified in source remains unresolved and is not hidden by the phrase “booking record saved”.

Anonymous availability RPC authorization requires a separately reviewed public-read contract. Do not regrant SECURITY DEFINER RPCs without public-property gating or query private booking rows as a fallback.

Initial guest preferences are not a full bidirectional URL/history synchronization system. Unsaved local edits are not preserved through login/remount. The existing local-midnight ISO URL parsing contract is retained rather than silently migrated.

## Evidence

Synthetic focused tests cover comparison purchase/rental currencies and periods, unknown legacy snapshots, URL preferences and invalid dates/capacity, owner accessible-selection and back navigation, and returned/thrown preparation-task errors. Integrated typecheck and CI must pass on the exact published commit before release.

Live operational-role acceptance, actual anonymous availability and production write/reconciliation tests are not established by these synthetic tests. No production business writes were performed for this tranche.

## Rollback

Revert this frontend/reporting tranche to the prior published PR107 tree if a UI regression is confirmed. No database rollback or production-data restoration is required because this tranche has no migration or data mutation.
