# Transfer notification containment and central-delivery contract

## Scope and evidence

Owner direction, 17 Nov 2026: myUNO owns the customer conversation; all enquiries go to myUNO admin contacts, not directly to suppliers. This isolated patch extends the restrictive changes in PR #220. Base main: `6588a08416a0285c375fbd85914be53eb881a5db`.

Before changing fan-out, source verification found the existing admin path: `notify-transfer-booking` calls `send-transactional-email` using template `transfer-operator-new` for each configured admin, with key `transfer-admin-${order_id}-${adminEmail}`. The template has no fixed recipient override. `send-transactional-email` enqueues `transactional_emails` via `enqueue_email`, with `email_send_log`; `process-email-queue` handles retries and provider idempotency. Preserve this mechanism, not a parallel outbox. Deployment, queue operation and recipient delivery are still unverified.

## Changed only notification routing and reporting

- Remove operator WhatsApp, operator email and extra operator mailbox fan-out, including the legacy hardcoded fallback mailbox.
- Preserve configured primary/secondary admin destinations, normalized/deduplicated. No recipient settings, credentials, supplier records or access policies change.
- Preserve admin email queue/idempotency keys and customer receipt.
- Customer receipt names myUNO, not the external operator, and does not promise a 30-minute response or confirmed booking.
- Resolved enqueue errors/suppression no longer count as success. WhatsApp requires HTTP success plus explicit provider acceptance and ID, with a timeout. Queue admission and provider acceptance are not delivery.
- Audit metadata records `pending`, `partial` or `failed`, channel outcomes and supplier suppression. `success` only means at least one admin-channel handoff accepted. No accepted channel logs a distinct failure. HTTP response does not demand re-running the entire handler: this handler has financial side effects and must NOT be automatically replayed to retry a notification.

The entire existing operator assignment / order financial-split / ledger block remains byte-for-byte unchanged, verified by a SHA-256 test. No financial/booking function, amount, status, inventory rule, lookup identity or source of truth is corrected or certified by this patch. Existing shortcomings require their own security/financial gate.

## Exact-record durable admin delivery: next bounded design

Verified source:

1. `src/lib/adminInbox.ts` already supports exact `source` + `request` ID selection with explicit projections, existing admin admission and RLS. Supported sources are `consultation_requests`, `property_inquiries`, `partner_applications`, `listing_applications`, `nb_leads`.
2. It does NOT currently admit `orders` or `service_orders`. Do not manufacture an Inbox source or use a listing/project ID in place of a request ID. Operations' generic tab route does not establish an exact order handoff.
3. Migration `20260219004018_6aba8c55-5108-4f48-bf2d-cbdb314859b9.sql` declares consultation/airport admin notification triggers. Source is not proof those triggers are deployed or recipient scope is correct. Inspect live definitions/read-only execution evidence before changing them.
4. `enqueue_email` is service-role-only in source migration `20260609051240_email_infra.sql`; reuse that boundary. The send-email edge's gateway JWT comment is not object authorization, and generic `notify-admin-order` accepts browser-supplied content. Do not expose or broaden either as the new intake writer.

Proposed contract (not implemented):

- At the existing canonical server-side request writer, persist request first and atomically admit a notification event through an existing durable mechanism where its current contract can represent this. No new request table or duplicate commerce truth.
- Dispatcher accepts a closed source enum and persisted request ID only. Authorize service scheduler or explicit admin/object action before privileged reads; derive recipients from protected settings and fields from the authorized persisted record. Do not trust client customer, provider, recipient, amount or title fields.
- Stable delivery identity is source + request ID + notification kind + approved destination/channel. Retry only failed notification attempts, never re-create a request/order, send accepted channels again, rerun finance, or silently replay historical data.
- Email uses the existing queue, logs and suppression behavior. WhatsApp needs verified provider-delivery/audit and retry contracts before activation. Record separate saved / queued / provider-accepted / delivered / failed states without claiming delivery from HTTP status.
- Exact existing Inbox sources link to `/admin/inbox?source=<source>&request=<canonical-request-id>`. Orders and service_orders require a reviewed exact-record projection under existing authorization, not routing a generic customer ID into a broad operations list.
- Receipt can truthfully say the request is saved even if notification failed. Admin failures must surface in an existing authorized operational view and scheduled retries with deduplication, not prompt a customer duplicate submit.

This design cannot be safely activated merely by extending an unauthenticated edge handler. Atomic admission, object authorization, live applied-schema/queue evidence and protected recipient configuration need a separately reviewed tranche. No migration, function deployment or new endpoint bypass was implemented here.

## Acceptance / rollout

21 isolated tests: admin-only normalization, invalid/missing contacts, email suppression and failure shapes, WhatsApp response validation, complete/partial/failed handoff, retained admin queue and customer receipt, removed operator targets/copy, template no override, immutable financial block. Lint 0 errors (3 pre-existing `any` warnings). No external sends or production writes.

Before activation: verify actual admin destination settings against the owner's confirmed contacts; verify queue/dispatch provider readiness and deployed function source; review existing endpoint authorization and financial side effects. Only then controlled notification acceptance with explicit scope. Do not call #219/#220/this patch full launch readiness. Rollback must retain supplier suppression; do not restore direct customer forwarding.
