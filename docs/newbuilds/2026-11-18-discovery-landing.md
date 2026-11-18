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

## Recovery integration, 2026-11-18
Integrated main b4bbfde5 without replaying production changes. Regenerated the primitive adoption register rather than choosing a stale merge side. SEO regression now distinguishes exact redirect URLs from the canonical `/property/offplan` landing and excludes the search-result URL from the static sitemap.

Project enquiries clear prior unit context, reset on project navigation and remount the form per project/unit. Metadata explicitly labels a schema-versioned, request-only consultation; it creates neither a reservation nor a payment. The existing AdminInbox exact-ID reader remains unchanged. Removed the unsupported two-hour SLA from the legacy NbLeadForm.

This tranche does not migrate legacy nb_leads writers or activate checked intake/outbox SQL. Existing historical lead recovery and attribution remain intact; a separate migration must preserve pending legacy attempts and avoid dual writes. #261/#262 notification work remains separate and must be integrated and admitted before delivery can be called reliable. No production schema, Edge, settings or business records changed.

The project form uses `property_consultation`, represented in the checked intake SQL fixture, rather than the broader UI-only `property_purchase` value. This is source compatibility, not proof of deployed database constraints.

Recovery validation: 43 focused tests across 7 files passed (including existing exact-ID AdminInbox and legacy retry tests); the updated detail regression passed again after request-type correction. Design audit passed. Focused lint: 0 errors, 8 existing warnings. Local typecheck is resource-blocked (2 GiB heap exhaustion, then 4 GiB process exit 137); browser fixture is blocked by unavailable Chromium/download failure. Full CI on the new exact head remains mandatory; no production readiness claim.
