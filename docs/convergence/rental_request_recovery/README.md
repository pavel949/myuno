# Rental request receipt and confirmation — review candidate

Status: **local implementation candidate, NOT applied; production activation NO-GO**.
Base: `2c9097e560a492dd136c61aaa721775bcaa32028`, `pavel949/myuno`.

## Contract

One checked transaction creates the existing `property_inquiries` row, canonical `orders` row, one `property` item linked by `resource_id`/`metadata.property_id`, primary guest and durable receipt. The inquiry primary key is the operation identity; `order_id` is a unique explicit bridge. `request_payload` binds that key to exact actor/payload. The same key returns the original IDs/state after lost acknowledgement, reload and concurrent retry. A changed payload or foreign actor cannot reuse it. Any inner/late failure raises and rolls back inquiry/order/children together.

This is request-only: no payment intent, paid marker or inventory hold at submission. The bridge and both public availability RPCs exclude only the explicitly marked linked pending request. Browser/edge inventory consumers carry its metadata; legacy pending bookings retain their existing hold semantics. No-show/checkout and financial statuses are unchanged. New-contract Bangkok civil dates are explicit; their guest display dates use the shared helper. Unproven legacy timestamp conventions retain their existing interpretation.

Checked confirmation intersects persisted ownership or existing Space/module/action authority. It serializes on the property and requires one actual linked `property_bookings` row with exact property/dates/status. The existing exclusion constraint remains final authority. A swallowed overlap/reconciliation alert becomes a raised failure and rolls the attempted confirmation back; no `confirmed` success without committed inventory. Adjacent half-open stays remain allowed. Rejection/cancellation update the same order/inquiry and release any existing hold, never create a cancelled calendar row for a never-accepted request. Customer cancellation is limited to pending unpaid requests; financial/payment/ledger-bearing requests require the preexisting governed flow.

An allowlisted checked operator reader supplies authorized requests without broadening base-table RLS/SELECT. Browser edits cannot mutate a receipt or its linked order children. Existing legacy unlinked inquiries are not guessed into bookings; resolving their identity requires separate evidence. The widget retains legacy order and unlinked inquiry visibility, marking unlinked records for review with no invented booking transition. It fails explicitly if the checked reader is unavailable.

## Scope and limits

`forward.sql` is deliberately outside both migration journals. Do not apply it via publish/build, blindly layer it on the unactivated atomic-hold candidate, or deploy its frontend ahead of backend acceptance: unavailable RPCs fail closed and never fall back to two browser writes. Current bridge/guard/availability anchors are preflight checked, but a production activation still requires fresh read-only deployed hashes/ACL/trigger-order/schema comparison and canonical migration registration. No live function state is inferred from repository files.

The existing customer quote is retained as an explicitly labelled estimate requiring operator review. This tranche does not certify server repricing, payment/settlement, paid confirmation or realized P&L. It does not create a provider/org mapping from an asset/provider ID. Current min/max stay, capacity, notice, booking-window, preparation buffer and manual blocks are checked from stored property state; catalogue completeness is outside this tranche.

Frontend retry IDs are actor/payload-bound and durable across tabs/reloads; there is no automatic rotation after an uncertain result. An intentionally identical second request is not exposed as a new operation. A changed payload is a new intent with its own key. Local storage contains only digest/key, no contact payload. Storage failure stops before writing. The checked server, not storage, authorizes and deduplicates.

## Review and rollback

The source, request lifecycle, inventory, authorization and backup changes require independent review. No push, merge, deployment, migrations, RLS activation, billing, real bookings/messages or production restores were performed. Source rollback is a reviewed revert; activated backend rollback must keep receipts and protective guards intact, disable the new submit/decision RPC EXECUTE grants and disable their frontend. Do not restore the unsafe two-write path or delete accepted receipts as rollback.

The separate `scripts/database-snapshot.mjs` native snapshot/isolated restore changes are documented in `docs/DB_MIRROR_SETUP.md`. They do not run automatically from this branch or replace external Auth/Storage recovery.
