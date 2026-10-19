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
- Service UI fixes and new scenario tests are in progress; exact final counts
  belong in the final PR description after verification.
- Real supplier data and live payments are deliberately not acceptance criteria.
- No 9/10 or 10/10 claim until the journeys above are verified at their actual
  client/API/database boundaries. A screenshot or mock alone cannot prove a
  server reservation, permission check, retry contract or committed status.
