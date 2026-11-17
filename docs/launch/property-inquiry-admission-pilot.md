# Property inquiry admission pilot — isolated candidate, not activated

## Scope

The candidate SQL is in `docs/launch/property-inquiry-admission.candidate.sql`, deliberately outside migration/deployment directories. No edge endpoint, frontend call, trigger, worker, scheduler or live grant is added. A merge would not activate it. This is a security/transaction contract to execute against isolated PostgreSQL in the existing CI, not a claim that customer notifications are connected.

Pilot source is existing `property_inquiries`. Admission requires an authenticated creator whose `auth.uid()` equals the persisted `user_id`, and persisted status `pending`. Non-owner, missing actor, missing object, changed ownership and changed state fail closed. There is no admin/employment bypass and no caller-supplied actor, customer data, source, channel or recipient. This deliberately does not support guest-owned, service, consultation or commercial-order workflows yet.

Protected `system_settings.admin_emails` is the only recipient source. Missing, malformed, empty, oversized or partly invalid settings reject the whole call; there is no legacy fallback. Requests and configuration are locked during admission. The caller cannot read the private delivery queue or recipient data.

## Why an isolated delivery outbox is needed

Existing `email_send_log` is a many-row attempt audit and only uniquely constrains a *sent* message ID. Existing `enqueue_email` is a service-role-only PGMQ wrapper carrying rendered provider payloads and does not atomically establish per-request/channel admission. `whatsapp_send_log` is a send log, not general durable intake. No existing schema contract found can provide this admission identity without changing its meaning.

The candidate private outbox stores only source/request pointer, notification kind, channel, approved destination and delivery state. It is not a second enquiry/order/payment model and contains no copied customer record. Unique identity is `(source, request_id, notification_kind, channel, destination)`. Repeated and concurrent admission cannot create a second event for the same destination. Transaction rollback removes admission. No caller can reset an accepted event to pending or delete its dedupe record.

## Incomplete by design; activation gates

- The candidate persists an event only. No email/WhatsApp is sent, and `outbox_queued` is not provider acceptance/delivery.
- The candidate explicitly revokes table access and admission execution from `service_role`, including ambient default grants; no worker role is admitted. Actual role inheritance and deployed default ACLs still require live verification. A separately reviewed worker must revalidate current approved recipient configuration and persisted object, render safely, use the existing durable email queue/idempotency key, record outcomes, and retry only failed channels. Removing a destination must suppress an unprocessed event, not send to historical recipients.
- Do not rerun a booking/payment writer or the transfer notification handler to retry an event.
- Current frontend request insertion and this candidate RPC are NOT automatically one transaction. To cover browser close and guest flows, integrate admission into a reviewed canonical server writer/trigger transaction, preserving its authorization and idempotency. No such integration is claimed here.
- Live schema, applied policies, ownership invariants, sender settings and queue runtime remain unverified. Existing database schemas may differ from the intentionally minimal test fixture.
- The source FK blocks deleting an enquiry with a delivery event. Review retention/audit requirements before activation; never casually drop the constraint or erase delivery identity.
- Exact admin Inbox link for this pilot already exists: `/admin/inbox?source=property_inquiries&request=<id>`. It remains read-only under current admin admission/RLS. The ID is a selection, not authorization.
- Channels other than email are rejected by schema. No supplier recipient path exists.

## Tests / evidence

`src/lib/__tests__/propertyInquiryAdmission.postgres.test.ts` starts a Unix-socket-only isolated PostgreSQL cluster with synthetic roles, records and settings, then executes the candidate SQL. It never accepts a hosted DB URL or credentials. CI fails if PostgreSQL is absent; local environments without PostgreSQL explicitly skip rather than simulate transactional proof.

Tests cover creator admission, non-owner/anonymous/missing-object denial, persisted owner/status recheck even on retry, serial/concurrent dedupe, independent/normalized destinations, malformed config before partial inserts, encoded JSON settings compatibility, transactional rollback, denial of direct private-queue reads/anon RPC execution, revocation under deliberately broad service-role default grants, denied direct INSERT/UPDATE/DELETE, and concurrent status/config mutation blocking followed by fail-closed admission.

Existing `.github/workflows/verify.yml` runs all unit/isolated PostgreSQL tests and provides PostgreSQL tooling; no new dependency or workflow installation is introduced. CI outcome must be checked before stating database tests passed.

Rollback before activation is simply to keep the candidate unapplied. An eventual activated implementation must retain queued records and dedupe identities; use a reviewed disabled-admission/worker state rather than dropping audit data.
