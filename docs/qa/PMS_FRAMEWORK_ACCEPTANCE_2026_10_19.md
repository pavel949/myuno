# PMS and services framework acceptance

User-approved scope: assess and improve the reusable framework, not real catalogue
completeness, demo flags, imported guest-data quality, real payment collection or
financial settlement readiness. Do not reduce framework readiness because the
operator has not yet populated real suppliers, services or properties.

All QA uses synthetic data outside the connected production business database.
Code under review and unapplied SQL are never counted as deployed behavior.

## Required journeys

| Journey | Acceptance evidence required |
| --- | --- |
| Supplier | Create/edit/publish/deactivate; persisted review state; visible public projection; owner/manager access |
| Service | Create/edit names, photos, stored currency, duration and booking mode; remove fields/photos; publish only through existing approval authority |
| Discovery | Search/filter/detail/back on public and account routes; loading, empty, missing and error remain distinct |
| Request | Select service; supply contacts/preferred time; one canonical service_orders record; provider and customer see the same ID/status |
| Instant booking | Server-authorized configured mode; valid working window; atomic capacity/conflict check; persisted confirmation without charging money |
| Fulfilment | Provider confirms/starts/completes; client sees updates; stale or denied updates never report success |
| Cancellation | Allowed actor/status only; zero-row response is failure; released capacity can be selected again |
| PMS creation | Actor/property-bound writer; order/item/guest/hold committed together; identical retries do not create duplicate stays |
| PMS dates | Half-open dates; concurrent and adjacent stays; manual blocks; cancellation, no-show and rescheduling preserve inventory truth |
| Stay operations | Check-in/check-out change canonical stay state; completing a generic task never fabricates a stay transition |
| Access | Owner, customer, provider, manager and staff cannot operate a foreign object or reuse another actor's cached private projection |
| Responsive navigation | RU/EN, 375/390/430/1280; confirmation reaches the actual account view; no stale form/slot when service changes |

## Current bounded evidence

- Atomic property writer candidate #120: 38 PostgreSQL cases and 2,337 aggregate
  tests passed on 73286c2. Its SQL remains outside migration runners and unapplied.
- First service tranche: 80 focused cases across 10 files passed; the added
  persisted-confirmation case and admin test type correction then passed all
  11 affected cases. The aggregate CI result must be read on the final head.
- The actual service editor is exercised with synthetic provider context: blank
  quote, zero price, saved currency/duration, refused writes retaining input and
  repeated submission. Public provider tests preserve duration/lead/currency and
  reject stale responses. Provider actions reject denied/zero-row responses.
- Browser fixture `scripts/qa/services-framework-ui.mjs` renders real booking,
  account, provider desk, service editor and public detail at 375/390/430/1280,
  RU/EN, with every hosted backend request denied. Browser results remain pending
  until the exact-head connected verification completes.
- The existing service INSERT trigger always persists `pending` and requires a
  timestamp. Request without a configured timetable and authoritative instant
  confirmation are NOT implemented by this UI tranche. The editor therefore
  disables selecting instant mode; existing stored configuration is preserved.
- Account and provider/admin detail read canonical `service_orders`; no separate
  order model, commercial payment bridge or synthetic production seed is added.
- Real supplier data and live payments are deliberately not acceptance criteria.
- No 9/10 or 10/10 claim until the journeys above are verified at their actual
  client/API/database boundaries. A screenshot or mock alone cannot prove a
  server reservation, permission check, retry contract or committed status.

## Ordered delivery and score gate

1. **Routine service repair:** merge only after types, aggregate, lint, build and
   the isolated responsive checks pass. No production activation is inferred.
2. **Critical inventory review:** #120 is concrete forward SQL + stop switch +
   PostgreSQL regressions. Preserve main's new concurrent-writer tests when
   integrating. PROJECT.md §§14/16/20 require review before activation or starting
   another critical tranche. The SQL remains outside both migration runners.
3. **Service workflow contract:** use existing service_orders; request may omit
   a preferred time, BOOK requires configured working windows and atomic
   provider capacity, server-persisted confirmation and scoped lifecycle updates.
   This needs its own isolated database/role/concurrency verification and review.
4. **Manual PMS command:** replace order/item/guest multi-write with one existing-
   domain transaction, actor/property authority and an explicit retry contract.
   Verify adjacent/conflicting dates, blocks, cancellation and rescheduling.
5. **Stay operations and final acceptance:** verify actual check-in/out, staff
   isolation, persisted status/audit history and all required routes in RU/EN.

A 9/10 framework verdict requires steps 1–5 to pass their actual boundaries.
Unapplied SQL, UI mocks or data completeness never substitute for that evidence.
Real payment collection, settlement and catalogue population are excluded from
this user's score; canonical authorization and inventory remain included.
