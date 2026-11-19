# Consultation notification admission + durable dispatch review candidate

**NO-GO / unapplied / not an integrated production fix.** Built against main b4bbfde5dca7a301940d3baf8c04695221ae0701 and coordinated with #261 b88f68262fd15de030d67e27fab0f1a6f9dfc4b3. No runtime paths, settings, migration auto-apply, Edge deployment, customer rows or provider sends changed. #260 owns the newbuild UI; this package does not touch its branch.

## Verified source findings

`notify-admin-order` #261 still accepts client-authored payloads. It has no actor/object gate and is not safe just because recipients are fixed. `useUniversalLead` has a browser-crash gap between persisted intake and dispatch. `notify-lead-whatsapp` is another body-ID ingress, not a safe substitute. Provider acceptance is not recipient delivery.

Canonical admission exists in **unapplied** `docs/hardening/consultation-intake/forward.sql`: server auth.uid, typed allowlist, canonical published project and project/unit/property relation checks, nonce/fingerprint recovery, immutable identity guard. This must be reviewed and proven in the target DB. Merely finding the function name is insufficient. Direct-table insert grants/guards and every alternate writer must be inventoried. This candidate does not recreate or weaken that canonical admission.

Searched existing repository for `outbox` and `notification_queue`: no active durable consultation queue implementation found, only release-gap docs. Proposed private table is transport state keyed to existing consultation_requests, NOT a new CRM/request authority. No guest request lookup, no new public PII read, no service-role lookup from browser-supplied ID.

## Candidate mechanics

1. `forward.sql` wraps the existing checked intake. Canonical save and two channel intents commit together. Failed enqueue rolls back save; unchanged repeat returns the same receipt and cannot duplicate jobs. Pre-existing receipts are not backfilled because their legacy dispatch status is unknown. Concurrent new calls converge through the canonical unique nonce index and queue unique key.
2. Private RLS-enabled queue has no client/table grants. Only service-role RPCs may claim/finish; scheduler ingress must validate its dedicated secret **before** constructing privileged client. JWT presence/ordinary logged-in actor is not scheduler authority.
3. Atomic SKIP LOCKED claim with unguessable lease token, conditional live-token acknowledgement. Each channel has independent state. Stored canonical source, never HTTP body, supplies message details; budgets must remain labelled budgets, never order totals. Only strict protected MyUNO admin contacts are recipients. No supplier/manager contacts.
4. Explicitly rejected-before-acceptance attempts may retry up to five times with backoff. Missing settings become blocked. Ambiguous/network-timeout/provider-without-reference outcomes and expired leases become uncertain, requiring operator reconciliation. They must NOT automatically retry: UltraMsg exactly-once/idempotency support is unverified. Accepted means provider accepted, not delivered.
5. `worker.mjs` is an executable dependency-injected core, not a wired Edge endpoint. It rejects every nonempty scheduler body, authorizes before store construction, keeps channel results independent, bounds sends and removes PII from responses. Durable records contain reference/status only, not provider payloads or exception strings.

## Test evidence

Run `node --test docs/hardening/lead-outbox-review/worker.test.mjs` (Node 24). **13/13 passed** in isolated mocks: anonymous/failed admission before privileged store, arbitrary body denial, method gate, independent channels, definite vs uncertain rejection, reference requirement, missing/failed settings, timeout, stale ack, stored source/recipient selection. No network sends occurred.

**Initially not run (superseded by CI evidence below for database tests):** actual SQL execution, real Postgres concurrent transactions, RLS/grants actor matrix. **Still not run:** real Edge runtime integration, sender/provider acceptance or delivered receipt. Local executor has Node but no psql/postgres/initdb, Docker or Deno; existing local checkouts are another app or incomplete. A complete clone of the target repo was not available. Do not substitute worker mocks for SQL tests or all-repository CI.

## Required isolated SQL acceptance before activation

Use disposable Postgres/Supabase (not shared preview production data), load the existing intake fixture and forward.sql, then this candidate. Assert:
- anon/authenticated cannot SELECT/INSERT/UPDATE/TRUNCATE private queue or EXECUTE claim/finish;
- unauthenticated fake IDs cannot cause reads/sends; cross-actor nonce, forged user_id/status, nonpublic project, foreign unit/property rejected by canonical writer;
- new valid request yields exactly two jobs; enqueue error rolls request back; unchanged retries and two concurrent submits yield one request/two jobs;
- old receipt recovery never backfills; changed payload is a conflict; guest recovery returns only receipt, no PII;
- simultaneous claimers get disjoint jobs; wrong/stale/expired token finish returns false; accepted channel never reclaims;
- explicit rejection retries with bound/backoff, fifth rejection dead; timeout/expired lease uncertain, never automatic resend;
- data deletion/retention policy accounted for (FK intentionally restricts deletion until governed cleanup).

## Coordinated cutover blockers

Do NOT apply this SQL or deploy worker independently. First inventory every `notify-admin-order` and `notify-lead-whatsapp` caller: non-consultation orders/services must retain independently admitted dispatch semantics. #261's caller waits are transitional, not durable. The new worker needs an actual pinned Supabase adapter, strict contact reader from #261, verified provider adapters, scheduler-secret validation/rate limits, and a separately configured scheduler. The current arbitrary-body endpoint must be closed/migrated without breaking non-lead flows. Remove browser consultation notification calls only with server bridge activated; never run both for new leads. Public intake abuse throttling is also a release gate, not solved by scheduler auth.

Production acceptance needs dated verified existing-intake definition/grants, reviewed schema/RLS approval, exact deploy artifact, outbox visibility and operational alerting for blocked/uncertain/dead state, configured MyUNO recipients and verified sender, permitted synthetic delivery followed by recipient confirmation. Existing provider idempotency horizon must be checked before any retry broadening. Do not promise delivery before that.

## Security-preserving rollback

Pause scheduler; retain queue and request rows. Do not reopen arbitrary-body dispatch or drop pending evidence. Restore the reviewed canonical intake wrapper without enqueue only after explicitly pausing new public intake or establishing another durable bridge; otherwise save-without-notification gap returns. No destructive DROP/data backfill/replay included. Reconciliation and requeue require separately admitted operator action and recorded evidence; never a generic guest RPC.

Docs reviewed: Supabase changelog 2026-11-18 and RLS guide. Relevant recent CLI v3 default-target change does not authorize hosted actions. All SQL remains review-only outside migration folders.

## Follow-up isolated CI package

`postgres.test.mjs` exercises the actual existing canonical intake SQL plus proposed outbox SQL using a disposable Unix-socket PostgreSQL server, no production connection. Dedicated workflow runs the existing intake actor suite first, then 12 outbox actor/concurrency/lifecycle cases. `adapters.mjs` supplies exact RPC adapters and dedicated scheduler-secret admission. Three new adapter tests pass locally (16 local Node tests total). Provider adapters remain deliberately unwired. PostgreSQL results are pending remote CI; initial missing local binaries are not a pass. No production credentials are used by this workflow.


## Verified CI evidence, 18 November 2026

Exact head `092d0a4d1296eb8efa7540d2d4dce910ad56ae65`, [run 44356707869](https://github.com/pavel949/myuno/actions/runs/44356707869), job `134986642272`: **23 existing intake PostgreSQL tests + 12 outbox PostgreSQL tests + 16 worker/scheduler/store mock tests passed**. SQL was actually executed in two disposable Unix-socket databases on the GitHub runner. Actor/grant denial, six concurrent submitters, disjoint claimers, enqueue rollback and expired lease handling passed. This is fixture-based PostgreSQL proof, not production schema or deployed JWT/PostgREST proof.

Follow-up reference `providers.mjs` adds Resend and UltraMsg HTTP adapters with fixed official endpoints, abort signal, redirect rejection, configured sender only, configured MyUNO recipients, plain text/context and bounded WhatsApp body. Resend uses stable idempotency key; official retention is 24 hours, so this does not license indefinite retry. UltraMsg can queue while its instance is offline, therefore acceptance is explicitly not delivery. Errors remain uncertain rather than assumed safe to retry. Four additional mock HTTP tests pass locally (20 non-DB cases total); these exact new files require new CI. No live HTTP provider sends were made.

Primary API contracts inspected: https://resend.com/docs/api-reference/emails/send-email and https://docs.ultramsg.com/api/post/messages/chat . Adapters remain reference code outside deployed functions. Missing deployment glue, verified protected settings reader, scheduler configuration, abuse control, operator reconciliation UI and coordinated legacy-ingress shutdown remain release blockers.

## Review-only composition follow-up

`runtime.mjs` now composes scheduler admission, the existing injected application service client, exact-key `system_settings` reads, injected `configuredAdminContacts` from #261, service RPC store and provider adapters. Settings errors, duplicate/unexpected keys stop before claiming jobs; missing configured recipients become blocked. Each invocation owns its client reference. No recipient parser duplication, cached recipients, fallback address or new service-client authority is introduced. `worker.mjs` rejects any request body without buffering or waiting for a streaming body. Scheduler must send POST with no body (not `{}` or whitespace).

26 isolated Node mock tests pass locally, including five composition cases and streaming-body denial. The composition tests stub the existing shared recipient parser; real #261 import, protected settings grants, Supabase/Deno runtime, scheduler invocation and actual delivery are not established by these tests. This module exports a factory only: it registers no listener and reads no environment variables. It remains outside deployed functions. A deployment entrypoint must explicitly inject the current reviewed shared client/parser, protected sender configuration and dedicated scheduler secret only after the coordinated activation gate. No SQL changed in this tranche; PostgreSQL evidence remains from the previous head and must rerun in CI. All other NO-GO blockers above remain.

## Cross-PR real parser acceptance

Added four runtime composition tests that import the actual TypeScript recipient parser from the exact coordinated #261 head `b88f68262fd15de030d67e27fab0f1a6f9dfc4b3`. CI materializes that pinned file in an isolated sparse checkout, not into runtime source. This explicitly verifies configured channel normalization, malformed-channel independence, empty configuration, and duplicate-settings denial. Supabase transport and provider HTTP remain mocked; this is not Deno/PostgREST or production proof. When #261 changes or is integrated, repin to its reviewed new head or switch to the merged local import and rerun.

Provider adapters now reject contradictory success-plus-error responses and null response bodies without treating them as acceptance. Six additional tests bring local non-DB evidence to 32/32, with the real pinned parser fetched through GitHub. These changes do not activate an endpoint or change SQL. Full CI for the resulting head is required. No real contacts or provider calls are used by tests. Existing production NO-GO gates remain.

## Deno compatibility and exact Inbox handoff

Head 3998d465 completed all seven executed CI workflows successfully (legacy e2e skipped). Follow-up tests run the real pinned TypeScript recipient parser and complete reference runtime under Deno 2.9.6 as well as Node 24: 33/33 pass in each runtime locally. Deno receives no network or subprocess permission; the DB client and provider HTTP are still mock adapters. This establishes module/runtime compatibility, not deployed Supabase Edge/JWT/PostgREST parity. CI installs the same pinned Deno version from npm and reruns the suite.

Notification text now carries the existing `/admin/inbox?source=consultation_requests&request=<canonical ID>` contract instead of a generic operations page. Text truncation reserves room for the complete link; no customer contact appears in the URL. Inbox authorization and exact-record RLS remain mandatory and unchanged. Current #260 preserves this main Inbox reader. No runtime functions, production SQL, scheduler or provider sends have been activated. All production release gates above remain.
