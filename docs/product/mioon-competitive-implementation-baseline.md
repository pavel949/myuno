# myUNO vs MiOON: verified implementation baseline
2026-11-20 · issue #297 · repository pavel949/myuno · source baseline ba4a7b248c4a3c67f690fc803760490f733a0ae0

## Verified existing implementation (code search, not runtime acceptance)
| Capability | Existing code | Next verification |
|---|---|---|
| Public property card | `src/components/property/PropertyListingCard.tsx` | CTA, responsive layout, accessibility, analytics and attribution |
| Owner listing management | `src/components/owner/property/PropertyListingsTab.tsx` | Create/edit state machine, owner permissions and review lifecycle |
| Admin CSV intake | `src/components/admin/intake/CSVImportWizard.tsx`, `src/pages/admin/AdminIntake.tsx` | Determine whether import supports *property inventory* or only general intake; mapping, dedupe, dry-run |
| Moderation | `src/lib/adminModeration.ts`, `src/lib/teamModeration.ts` | Exact record workflow, public approved version, audit and role isolation |
| Canonical property card registry | `src/components/property/index.ts` | Preserve public vs admin card distinction; avoid duplicating components |
| Four-marketplace audit | PR #296 | Review findings and integrate without overlapping changes |
| Admin acceptance | PR #295 and issue #294 | Separate synthetic evidence from authenticated production acceptance |

## Critical correction to roadmap
The initial roadmap names CSV import, moderation, and listing cards as target features, but code search confirms **related components already exist**. Do not rebuild them. First inspect their real scope and fix the user journey where deficient.

## Implementation order and acceptance
1. **P1 listing conversion:** trace PropertyListingCard → detail → contact/viewing/request → CRM. Preserve source property/project/agent and idempotent request receipt. Confirm mobile 375/390/430 and desktop 1440px.
2. **P2 agent workspace:** inventory existing roles and agent views, then extend *existing* identity and RBAC. Agent must not read another agency's private leads.
3. **P3 inventory import:** determine current CSVImportWizard's data model; reuse parser only if schema-compatible, otherwise create an inventory adapter with dry-run, validation, duplicate preview and rollback.
4. **P4 publication/moderation:** verify approved live snapshot remains visible while an edit awaits approval; test photo/price updates with isolated fixtures and public readback.
5. **P5 four-marketplace journeys:** use #296 evidence, preserve distinct booking/payment state machines, shared CRM and notifications.
6. **Release:** exact-head CI, design checks, browser E2E, RBAC/RLS, rollback and verified published version before merge/deploy.

## Evidence boundary
This is a code-search-based audit starter, **not** a claim that the features work end to end. No authenticated browser, database mutation, E2E or production acceptance was performed for this document. Follow-up implementation PRs must include screenshots, tests and rollback notes.

## Work items
- [ ] Review #296 against main; map each flow to route/component and role.
- [ ] Read complete PropertyListingCard and detail handlers; implement the smallest isolated CTA/CRM fix.
- [ ] Inspect owner listing state machine and agent profile capabilities.
- [ ] Inspect CSV importer field model before adding property import.
- [ ] Record CI and browser evidence per PR, merge only after acceptance.
