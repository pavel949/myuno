# Property inquiry admission pilot — isolated candidate, not activated

## Scope

The candidate SQL is in `docs/launch/property-inquiry-admission.candidate.sql`, deliberately outside migration/deployment directories. No active edge endpoint, frontend call, trigger, worker, scheduler or live grant is added. A separate unapplied trigger candidate now integrates admission into the existing creator INSERT path for isolated testing. A merge would not activate it. This is a security/transaction contract to execute against isolated PostgreSQL in the existing CI, not a claim that customer notifications are connected.

Pilot source is existing `property_inquiries`. Admission requires an authenticated creator whose `auth.uid()` equals the persisted `user_id`, and persisted status `pending`. Non-owner, missing actor, missing object, changed ownership and changed state fail closed. There is no admin/employment bypass and no caller-supplied actor, customer data, source, channel or recipient. This deliberately does not support guest-owned, service, consultation or commercial-order workflows yet.

Protected `system_settings.admin_emails` is the only recipient source. Missing, malformed, empty, oversized or partly invalid settings reject the whole call; there is no legacy fallback. Requests and configuration are locked during admission. The caller cannot read the private delivery queue or recipient data.

## Why an isolated delivery outbox is needed

Existing `email_send_log` is a many-row attempt audit and only uniquely constrains a *sent* message ID. Existing `enqueue_email` is a service-role-only PGMQ wrapper carrying rendered provider payloads and does not atomically establish per-request/channel admission. `whatsapp_send_log` is a send log, not general durable intake. No existing schema contract found can provide this admission identity without changing its meaning.

The candidate private outbox stores only source/request pointer, notification kind, channel, approved destination and delivery state. It is not a second enquiry/order/payment model and contains no copied customer record. Unique identity is `(source, request_id, notification_kind, channel, destination)`. Repeated and concurrent admission cannot create a second event for the same destination. Transaction rollback removes admission. No caller can reset an accepted event to pending or delete its dedupe record.

## Incomplete by design; activation gates

- The candidate persists an event only. No email/WhatsApp is sent, and `outbox_queued` is not provider acceptance/delivery.
- The candidate explicitly revokes table access and admission execution from `service_role`, including ambient default grants; no worker role is admitted. Actual role inheritance and deployed default ACLs still require live verification. A separately reviewed worker must revalidate current approved recipient configuration and persisted object, render safely, use the existing durable email queue/idempotency key, record outcomes, and retry only failed channels. Removing a destination must suppress an unprocessed event, not send to historical recipients.
- Do not rerun a booking/payment writer or the transfer notification handler to retry an event.
- The additional `property-inquiry-transactional-trigger.candidate.sql` places admission in the same transaction as the existing RLS-protected creator INSERT. It is unapplied, not a production integration. The live frontend remains unchanged. Guest/service-role/admin-on-behalf inserts are deliberately outside this creator-only pilot; no all-source coverage is claimed.
- Live schema, applied policies, ownership invariants, sender settings and queue runtime remain unverified. Existing database schemas may differ from the intentionally minimal test fixture.
- The source FK blocks deleting an enquiry with a delivery event. Review retention/audit requirements before activation; never casually drop the constraint or erase delivery identity.
- Exact admin Inbox link for this pilot already exists: `/admin/inbox?source=property_inquiries&request=<id>`. It remains read-only under current admin admission/RLS. The ID is a selection, not authorization.
- Channels other than email are rejected by schema. No supplier recipient path exists.

## Tests / evidence

`src/lib/__tests__/propertyInquiryAdmission.postgres.test.ts` starts a Unix-socket-only isolated PostgreSQL cluster with synthetic roles, records and settings, then executes the candidate SQL. It never accepts a hosted DB URL or credentials. CI fails if PostgreSQL is absent; local environments without PostgreSQL explicitly skip rather than simulate transactional proof.

Tests cover creator admission, non-owner/anonymous/missing-object denial, persisted owner/status recheck even on retry, serial/concurrent dedupe, independent/normalized destinations, malformed config before partial inserts, encoded JSON settings compatibility, transactional rollback, denial of direct private-queue reads/anon RPC execution, revocation under deliberately broad service-role default grants, denied direct INSERT/UPDATE/DELETE, and concurrent status/config mutation blocking followed by fail-closed admission.

Existing `.github/workflows/verify.yml` runs all unit/isolated PostgreSQL tests and provides PostgreSQL tooling; no new dependency or workflow installation is introduced. CI outcome must be checked before stating database tests passed.

Rollback before activation is simply to keep the candidate unapplied. An eventual activated implementation must retain queued records and dedupe identities; use a reviewed disabled-admission/worker state rather than dropping audit data.


## Transactional writer extension (additional unapplied candidate)

Source inspection found no separate canonical inquiry RPC: `PropertyInquiry.tsx` directly inserts `property_inquiries`, then creates an `orders` record separately. Do not replace that order/payment workflow. The pilot adds an AFTER INSERT trigger candidate scoped to `NEW.status = pending` and `NEW.user_id = auth.uid()`. It uses the actual inserted ID and invokes the already tested admission contract. No extra browser invocation is required and a browser close after commit cannot lose this outbox admission.

Existing creator INSERT/SELECT/UPDATE policy definitions are loaded directly from the original inquiry migration in the isolated fixture. The candidate does not alter RLS, grants on the request table, existing update triggers, original records or provider/admin permissions. These tests do not assert every later production policy matches the fixture.

Additional SQL tests cover single-INSERT atomic persistence of request+event, unchanged non-owner RLS denial, request+event rollback on invalid recipient configuration or outer transaction failure, idempotent follow-up admission, non-pending/null-state legacy inserts, no replay on update, and no-actor operational imports staying untouched/outside this pilot.

**Important activation tradeoff:** for pilot-scoped customer inserts, invalid admin-recipient settings or outbox admission failure now fail the entire inquiry INSERT rather than silently saving an unnotified request. This is necessary for the tested atomic guarantee and is a new failure mode, not a claim of identical legacy failure behavior. Validate settings and confirm this rollout behavior before applying. No payment/order transaction is coupled to this trigger.

## Review-only worker extension

`property-inquiry-worker.candidate.sql` adds claim/completion functions without granting execution (including service_role). Claims use a row lock and `SKIP LOCKED`, with a unique claim token and lease. Known pre-enqueue failures retry with backoff and the same event identity. Queued and suppressed events do not retry. Expired/crashed claims and ambiguous network acknowledgments become `uncertain`, never automatically resent: queue acceptance may have occurred before the response was lost. No code claims provider acceptance or delivery from queue admission. Worker completion cannot set `accepted` or `delivered`.

Admission now captures the authenticated `admitted_actor_id` as immutable evidence. The worker suppresses changed ownership, missing/wrong request identity, no-longer-pending state or removal of the approved admin destination. This is not a new source of user authority.

`pilot/propertyInquiryWorker.ts` is executable dependency-injected orchestration with no network, credentials, endpoint, scheduler or runtime registration. `pilot/propertyInquiryAdminTemplate.tsx` is a review-only escaped React template with a canonical exact-record admin URL; it is not in the live template registry. Transport must use the existing transactional-email flow, preserving suppression and unsubscribe behavior; do not bypass it with raw enqueue_email. Unit tests use only synthetic adapters and never send.

**Remaining activation gates:** implement/review the actual privileged source/claim adapters and sender admission under protected service identity; keep recipient/config and persisted-object validation authoritative at the actual enqueue boundary, not only before an asynchronous call. Register the reviewed template only after the sender authorization contract is safe. Reconcile uncertain events against existing email logs/provider keys before any manual retry. Validate real deployed policies, sender/domain configuration and queue operation. The worker core + SQL tests do not establish those live contracts, or exactly-once provider delivery. No supplier recipient or additional channel is enabled.

The SQL suite additionally exercises concurrent single claim, stale/forged token denial, lease expiry without resend, stable-event retry/backoff, forbidden delivery-state claims and explicit absence of worker execution grants. Worker tests cover persisted identity/actor changes, current recipient removal/config errors, queue acknowledgment versus suppression/uncertainty, safe pre-enqueue retries, and lost completion leases. Template tests prove escaped customer text and exact admin-only links.

## Enqueue fencing correction after independent review

The earlier dependency-injected recipient/templateData handoff is superseded. Worker now passes **only dispatch ID and claim token** to an internal fenced enqueue operation. It never calls or registers a template in the generic public `send-transactional-email` endpoint. That endpoint's current caller-supplied content/recipient authorization is NOT suitable for the pilot.

`property-inquiry-enqueue-fence.candidate.sql` holds the event row lock, validates the current claim/lease, and re-reads the persisted inquiry/actor/status and protected recipient configuration within the actual enqueue transaction. It locks those records through admission and rechecks the lease after blocking reads. The candidate renders only persisted fields with HTML escaping. A paused/expired worker or stale recipient/source cannot enqueue based on earlier JavaScript observations.

This internal candidate preserves the existing canonical suppression and unsubscribe-token tables/semantics before calling `enqueue_email`. It does not call the public sender or bypass suppression with unchecked raw queue input. Suppression-table admission is serialized and used unsubscribe tokens suppress the event. Pending email log, token preparation, transactional queue admission and `queued` state update commit together. A database exception rolls back token/log/queue work before marking a safe retry. The separate completion function can no longer assert `queued`; only the fenced enqueue transaction can. Ambiguous network responses remain uncertain and cannot overwrite an already queued event.

The payload uses the sender identity/domain currently baked into the canonical transactional sender; this is source parity, not verification of an approved/live sender domain. No new provider or credentials are configured. SQL produces the authoritative email payload; the React template remains an escaped preview/reference and is not registered or used as caller-supplied authority.

Additional CI tests use real PostgreSQL for locks, leases, transactions, current state/recipient changes and queue-failure rollback. `enqueue_email` is a deliberately local transactional queue adapter/stub in these tests, not the actual PGMQ extension or provider. Therefore tests prove the producer transaction/fencing contract, **not production PGMQ integration or delivery**. Test gates include paused worker past lease, config mutation during blocked enqueue, suppression/used token, stale actor/status, forged token, forbidden function execution and no duplicate admission.

Still NO-GO for activation: independent review of this new internal fence, actual role/grant/adapter wiring, canonical queue/token/suppression schema compatibility, live sender and recipient configuration, PGMQ behavior, retention, and downstream delivery reconciliation remain required. No production migration/deploy, endpoint exposure, registration, credentials or message send is performed.

### Follow-up review correction: durable suppression outcome and bounded locks

Suppression branches now check the fenced completion result. If the lease expires while a source/config/suppression read blocks, the event becomes `uncertain` and the returned result agrees with that durable state; it no longer falsely reports suppression. Tests cover expired leases after blocked source and suppression reads.

The internal fence also has a function-local two-second `lock_timeout`, restored by PostgreSQL when the function exits. A blocked suppression-table admission fails with no queue effect and uses the safe pre-enqueue retry path. This is not a global database setting change and does not bound all CPU/query/provider work. The eventual protected scheduler/adapter still needs an externally enforced statement/runtime deadline and a load review of the suppression SHARE lock before activation.
