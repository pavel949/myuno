# Phuket newbuild discovery landing

Status: implementation candidate; not a deployed-data certificate.

## Canonical surfaces
- `/property/offplan`: editorial buyer entry: plans, verification, areas, projects, launches/updates, developers, project search and units, purchase checklist, consultation, island life.
- `/property/offplan/search`: existing OffplanIndex, same supported filters and public presentation hold. Legacy offplan criteria redirect here with query/hash/state. Campaign-only visits keep discovery. `/property/projects` retains its context through the adapter.
- Existing project/developer identities and consultation flow remain canonical. No new tables, clients, permissions, reports, offers or reservation writer.
- Unit entry links to existing project `#project-units`; the anchor scrolls after project data arrives. A floor-plan type does not establish unit availability.

## Evidence and publication boundaries
Public content uses existing useOffplanProjects/useDevelopers. `publicNewbuildPresentation` remains mandatory: withheld construction, availability, yield, ratings and ClearView flags cannot reappear in landing cards. Existing project starting-price component retains THB and confirmation wording. This is not a current verified unit-level quote.

ClearView copy distinguishes company verification, project assessment and offer freshness. It explains the eight assessment categories without fabricating scores or implying that catalogue publication means assessment. Current rating UI versus extended canonical taxonomy remains unresolved outside this frontend tranche; no new rating generation or unpublished-report reads.

There is no connected dated launch/change feed in the verified public read contract. Its section explicitly states the absence of a verified feed and guides the visitor to project-specific confirmation. Never infer a sales launch or source verification date from created_at, updated_at, page loading or a successful network fetch. No fake news, timers, availability or island-wide totals.

Area links resolve against actual district strings from the same public catalogue. If no match is known, the destination is visibly named All projects, not a false area filter. Budget values reuse the canonical options. No unsupported ownership/completion/yield filters are advertised.

## Design and acceptance
Extends existing rental editorial treatment with DS2.1 tokens and existing coastline imagery (location context, not a named project image). Single PropertyHub/AppLayout; page owns its ds-frame-wide. RU/EN/TH, native project search, public journey state, loading/error/empty and retry states. Dedicated actual-component browser harness denies external traffic and uses synthetic public readers; full shell, production permissions, offer validity and legal/financial acceptance are outside its proof.

Release must preserve current main and coordinate with concurrent PR251 before any merge/native publish. No paid operations, production data, SQL, Edge deployment, credentials or RLS changes authorized by this tranche.
