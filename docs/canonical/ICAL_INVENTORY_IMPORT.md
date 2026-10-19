# iCal inventory-only import contract

Status: **review candidate; activation NO-GO**. This document describes the source
candidate, not a production deployment or historical-data reconciliation.

## Evidence and canonical boundary

The October 19 admin audit observed an Airbnb “Not available” event presented as
an order for 693,000 THB. The scheduled importer derived prices from property
catalogue rates, manufactured a 10% fee, wrote confirmed orders and children,
and soft-deleted missing events. The manual importer wrote property_bookings,
but also guessed prices, currency and confirmed-stay status.

An iCal event establishes unavailable dates. SUMMARY, DESCRIPTION and vendor
price extensions do not establish a verified commercial transaction, identity,
amount, currency, fee, payment or guest stay. Calendar imports must not write
orders, order_items, order_participants, payment_intents or ledger_entries.

Both existing entrypoints now delegate to one shared inventory writer:
`supabase/functions/_shared/ical-inventory-sync.ts`. The canonical inventory
remains property_bookings; no secondary availability store/bridge is added.

## Restrictive mapping

- New records: source `ical`, source_calendar_id + external_id for provenance,
  canonical property/owner IDs, status `blocked`, civil `[check_in, check_out)`.
- Amount, currency, fees, commission, deposits, refunds and commercial/guest
  identity links are explicitly NULL. Unknown does not become zero or THB.
- SUMMARY is a labelled source observation in notes, never guest_name. Existing
  calendar metadata remains the channel identity. No guessed guest contacts.
- Both entrypoints use the same identity and writer. Plain insert plus a guarded
  duplicate-race lookup replaces unsupported partial-index upsert inference.
  A UID collision across properties/calendars fails closed. No row is adopted.
- Updates require exact calendar/property/owner/UID provenance, source=ical,
  status=blocked and all protected money/link fields NULL. The same predicates
  guard the UPDATE against concurrent commercial adoption.
- Existing confirmed/legacy priced/linked/manual rows are retained unchanged and
  reported for reconciliation. Historical fabricated orders are neither
  corrected, relabelled, deleted, cancelled nor hidden by this patch.
- Missing UIDs, an empty feed with existing holds, cancelled events and malformed
  feeds never release inventory. Missing events require separate reconciliation.
- Only explicit valid all-day dates are supported. Timed/recurring events,
  missing DTEND, invalid or non-positive intervals, duplicate UIDs, unsupported
  nested components and truncated calendars fail visibly before inventory writes.
  This restrictive support boundary must be checked against actual source feeds.
- PostgreSQL uniqueness/exclusion is final authority. Conflict/write failures
  keep prior rows, retain any successfully added blocks, return success=false,
  and do not advance last_synced_at. Other independent events can still add safe
  blocks. A metadata write error is surfaced as failure, not fresh health.
- URL validation is preserved; redirects are refused rather than bypassing it.
  DNS-rebinding protection and source-fetch quotas remain separate concerns.
- Compatibility response fields new_order_ids/total_new_orders/cancelled/
  events_removed remain present with empty/zero values. They do not claim money
  or inventory releases.

## Schema and trigger evidence

- Original property_bookings schema uses TEXT status/source and nullable numeric
  total_amount / TEXT currency, not an enum requiring a schema migration.
- `20260419061435_70757349-7a4b-4346-9842-4d2be8ed1bac.sql` supplies date validity,
  nonnegative optional amount, half-open exclusion and partial iCal uniqueness.
- `drizzle/migrations/0019_canonical_inventory_status_predicate.sql` holds every
  non-null status except cancelled/rejected/expired, including blocked.
- Stored October 2026 source snapshot `docs/convergence/final_order_mutation/`
  confirms nullable money fields and text status; it is not fresh hosted proof.
- Stored create_financial_from_booking executes financial insertion only on a
  transition to confirmed; auto_create_booking_tasks and capital-lead triggers
  likewise require confirmed/contactable stays. Blocked/NULL guest rows do not
  satisfy these conditions. Activity logs still record the insert.
- Read-only hosted inspection supplied October 19 corroborates nullable monetary
  fields, TEXT source/status, the half-open exclusion, existing global external-UID
  uniqueness and all nine trigger definitions. Confirmed-only financial/task and
  checked-in WhatsApp effects do not run for blocked rows; audit triggers remain.
  This evidence is not a production write or deployment test. No migration, grant
  or trigger change is part of this candidate.

## Consumer compatibility and activation gates

1. Baseline PMS OwnerCalendar/AirbnbCalendarGrid and MultiPropertyTimeline read
   orders and/or property_availability and omit inventory-only iCal blocks. The
   separately committed read-only overlay below supplies canonical blocks in both
   grids. Activation requires review of writer and overlay together; load errors
   cannot imply available, and blocks have no guest/order/money/release actions.
2. get_property_unavailable_dates includes property_bookings in canonical
   availability but projects all those dates as `booked`. Public dates remain
   unavailable, but this is not proof of a confirmed guest stay; labels must not
   assert one. The RPC/grants are unchanged here.
3. Baseline `ical-sync` has verify_jwt=false and lacked caller/object authorization;
   scheduled sync lacked an explicit internal-secret check. The separately
   committed bounded ingress candidate below contains these paths in source.
   Hosted cron still supplies a public anon caller, which the candidate rejects.
   Activation requires separately authorized secure server-caller configuration
   and hosted actor/RLS/RPC checks. Calendar owner equality alone is provenance,
   not caller authorization.
4. Historical orders/legacy inventory require a separately reviewed read-only
   reconciliation plan. No cleanup or live sync is authorized by this patch.
5. PR #95 (open browser containment) preserves service-role writes; PR #96 is
   stacked on it and concerns workspace setup. Neither replaces these importers.
   Do not deploy a second iCal writer or merge unrelated grant/schema changes.
6. Review actual OTA formats against the restrictive all-day/non-recurring
   support contract. Unsupported sources must show errors, never green freshness.

## Isolated verification

`node --test scripts/qa/ical-inventory-integrity.mjs`

The harness executes both actual Edge entrypoints plus their shared code with
synthetic Supabase/fetch clients. Table access is allowlisted; commercial writes,
pricing reads and real transport are unavailable. Initial 64 tests: 36 failed
against baseline, 64 passed after implementation. Cases cover 693,000 price
extensions, duplicate UID across calendar/property, insert races, legacy/order
links, concurrent commercial adoption, canonical owner mismatch, same-day
turnover, conflict, partial writes, missing/empty/malformed feeds and failed reads,
writes, timestamp storage and fetch/redirect/SSRF rejection.

This is adapter-contract evidence, not a live DB/OTA/authorization test or an
actual PostgreSQL exclusion/trigger test. Full project build/typecheck and final
review belong to the integration gate. No production invocation was performed.

See `docs/hardening/rollback/ical_inventory_import.md` for retaining-inventory
rollback. Critical acceptance requires writer + consumer + ingress + hosted
schema/trigger evidence; passing unit tests does not automatically activate it.

## Separately reviewable PMS overlay candidate

The main single-property and portfolio calendars now display canonical imported
blocks through a read-only projection, without creating order-shaped objects.
Existing property access resolution is reused; the portfolio query intersects
visible filters with the accessible property set. Empty scope never queries all.
The projection deduplicates property/calendar/UID identity, excludes linked guest
orders and has no mutation method. Date cells and day details explicitly show
an iCal availability block. Book/unblock actions are absent on imported nights;
checkout remains exclusive. Loading/errors replace the grid with an explicit
unknown-availability state and retry. Existing guest/order details are unchanged.

The UI reads the dedicated `source=ical,status=blocked` rows, not legacy guessed
confirmed bookings. No unknown historical booking is relabelled. Both calendars
reuse the existing property-bookings invalidation prefix and refresh the read
projection every minute. This is not authority to activate the Edge writer.

Focused UI verification: 58 tests across six files pass, including exact scope,
empty filters, deduplication, half-open turnover, real single/portfolio component
rendering in RU/EN, no guest/unblock actions and error/loading behavior. Initial
new projection/day-detail tests failed 8 cases before implementation. Full build,
typecheck and browser viewport verification remain integration responsibilities.

Fresh hosted read-only parity was reported by the parent on 2026-10-18 23:54 UTC:
nullable money and text source/status, half-open exclusion/predicate and nine
trigger bodies agree with the candidate assumptions. Confirmed-only finance/task
and checked-in-only WhatsApp guards do not fire for blocked rows. Audit-log
triggers still run. This is read-only schema evidence, not a hosted mutation test.
The legacy active cron uses an anon-role credential; ingress remains NO-GO until
the separate server-authentication candidate and secure caller configuration are
reviewed and activated together.

## Review correction: retained legacy commercial commitments

The first mapping candidate checked canonical inventory but missed orphaned
legacy scheduled orders. An order can hold this calendar/UID or property dates
without a property_bookings mirror; resource_id can also be NULL while the
property link exists only in order_items.metadata.property_id.

Before any inventory write, the shared adapter now reads:
- Property orders whose metadata identifies this source calendar, irrespective
  of lifecycle state. A matching external UID requires deliberate reconciliation.
- Property order items linked by either resource_id or metadata.property_id and
  their non-deleted parent orders. Active half-open overlapping dates or missing
  date evidence require reconciliation.

No legacy order or child is mutated. Exact counts are required for these reads
and existing calendar inventory; a truncated/API-capped result fails closed.
This bounded candidate does not page unlimited historical data. Read/check/write
is not one database transaction: a concurrently created orphaned commercial
order remains a known broader writer-integrity risk. This guard is containment,
not a replacement for canonical atomic inventory commitment or the P0-A gate.

Regression harness now has 78 cases. The 14 added legacy-read cases produced
12 failures before the correction and all 78 pass after it. Coverage includes
same-calendar/UID orphan orders, metadata-only and resource_id overlap, same-day
turnover, and failed/truncated reads. Synthetic clients only, no live invocation.

### Overlay review correction: API row caps

Both block projections require exact total count and an actual array whose
length equals that count. Null/unknown/truncated results throw and show unknown
availability, never an empty calendar. The single-property query is bounded to
its visible month grid (including leading/trailing week days); the portfolio
query already uses its visible half-open range. Queries over the API cap fail
closed rather than silently omitting future blocks. Truncation/null-data/count
regression tests were added before this correction.

Same-calendar legacy orders are also preflighted when their UID is absent or missing from the feed. Empty or partial feeds cannot clear reconciliation errors or advance the successful-sync timestamp merely because no current event reaches the legacy-order guard. Historical orders remain unchanged.

## Separately reviewable bounded ingress candidate

- Manual POST accepts only the current UI payload `{ calendar_ids: UUID[] }`,
  between 1 and 50 explicit IDs. Duplicates are deduplicated after the size check.
  Empty/malformed/singular/global requests fail, and extra actor/scope fields
  cannot widen authority. Current useExternalCalendars, ChannelHealthDashboard
  and ChannelSyncWidget all use the supported array payload. More than 50 must be
  explicitly batched by a future caller change; this candidate does not broaden it.
- `requireAuth` verifies the user with Supabase auth.getUser. Caller-bound calendar
  and canonical-property reads require every requested active calendar to be
  readable, complete and owner-consistent. Persisted owners qualify directly;
  other actors also require actor_can_operate_property(property, persisted company,
  bookings, edit) = true using the caller JWT. Denied/error checks occur before
  service-role construction or rate-limit storage. No administrator or service
  fallback circumvents RLS. October 19 read-only hosted parity confirms calendar
  RLS is owner-only. Management operators cannot read/sync these calendars unless
  they are already the persisted owner, even if the actor RPC allows booking-edit.
  The RPC exists and authenticated users may execute it; no policy/grant expansion
  is included or implied by this candidate.
- The existing rate limiter runs after scope authorization with the verified user
  ID and failClosed=true. Missing/failed rate-limit authority is not a bypass.
- Manual inventory failures return HTTP 502 with structured per-calendar results,
  so current dashboard callers do not toast success after a conflict. Partial
  successful blocks remain canonical; missing events still never release them.
  Existing manual sync hooks invalidate canonical calendar/inventory reads onSettled
  after both success and rejection, including partial HTTP 502. Rejections remain
  rejections for caller error toasts; cache refresh does not fabricate success.
- Scheduled POST calls the existing requireInternalSecret before service-role
  construction. It accepts the configured `X-Internal-Secret` matching the Edge
  environment `INTERNAL_SECRET`, or the exact configured service credential in
  Authorization matching `SUPABASE_SERVICE_ROLE_KEY`. A decoded JWT role claim,
  public anon JWT or ordinary user JWT is not a server secret.
- The existing live cron was inspected read-only and uses an anon-role caller.
  It will be denied by this candidate. A secure user-operated configuration step
  is required before activation; no credential values, credentials, grants,
  scheduler jobs, runtime configuration or deployments are changed here.
- Trusted scheduled scope remains optional owner_id/property_id UUIDs and an
  optional supported sync_type. Invalid JSON/scope cannot silently widen a
  filtered run. Exact-count source-list validation rejects truncated/unknown
  reads instead of claiming a successful global run over only the first page.
- OPTIONS is non-mutating; other methods fail 405. Malformed/denied requests never
  fetch feeds or invoke the inventory writer.

`node --test scripts/qa/ical-ingress-integrity.mjs` executes the actual auth,
internal-secret and actor-client guards plus both actual entrypoints against
synthetic clients. Initial 29 cases had 26 failures before implementation; the
expanded 40-case suite passes. The writer harness separately injects authorized
entrypoint gates to isolate its 82 inventory cases. All transport and identities
are synthetic; this is not an authenticated hosted end-to-end test.

The manual-hook refresh regression suite exercises both single/all sync with success, partial HTTP 502 and transport errors: four cases failed before moving invalidation to onSettled; all six pass afterward. Synthetic errors preserve caller rejection and never invoke a successful completion handler.

Both entrypoints derive request CORS headers through the existing shared
getCorsHeaders helper. This reuses the unchanged allowlist for myuno.app and
www.myuno.app, sets Vary: Origin, and does not reflect an untrusted origin.
Preflight is non-mutating. Eighteen adapter cases execute the actual shared
helper across both entrypoints, both production origins and an untrusted origin,
covering OPTIONS, authentication rejection and success. All eighteen failed before
the fixed-origin headers were replaced and pass afterward. CORS remains a browser
response policy, never a substitute for verified user/server authorization.
