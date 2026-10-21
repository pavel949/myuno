# Operational backlog recheck — 21 October 2026

Base main: fb4b944a4c736f680ddb8e4b178f833030e021b1. Homepage compatibility target: f782951188ab35322a4f9ca06f8789185721b2ca. No production mutation, activation, migration application, merge, deployment or permission change.

## PR123 — source reconciliation completed; CI pending

Original head3f9c812d4762ad7efd12fa8d3642a7a0ca5d1e76; refreshed head a4378a8c4aa6fd8547c64ed7e0f8196cb2333dcf. Three original textual conflicts resolved: connected workflow, MarketplaceServiceGrid, useAdmin. Kept current ServiceSummary and current paginated admin provider queue/exact edit lookup; retained actor-bound legacy service-editor reads. Kept two-slot180s runner; registered service framework as22ndfixture, updated exact fixture ownership contract, no checks weakened. Removed duplicate error member from automatic useServiceOrders merge after TypeScript caught it. Additive push only.

Local focused original70cases:67pass/3timeouts. Both affected files reran with original5s limit and passed11/11. New query/cache regression3/3passed. Narrowlint passed. Exact917a349 (sameTS asfinala4378) remote Typecheck success; final exact-head CI pending. Network-denying service browser64/64passed with installed system Chromium (scratch runner changed launch executable only), screenshots inspected RU390editor and1280operator. Runner tests13/13passed. Worktreeclean. merge-tree with homepage succeeds, merged tree0d8c4dbea566b49eb6f8465972351e5d4cc0a409.

Remaining backend gates unchanged: unscheduled structured requests currently require timestamp at INSERT trigger; instant capacity/checked status transitions and legitimate customer cancellation need server acceptance. Affected-row/error UI is not that acceptance. No new service payment/order authority.

## PR96 — critical dependency reconciliation required

Head89d29fc7caacb92fd9ff720ae227057b77878508, stacked on95. Historical checks green. Actual merge-tree with currentmain has8conflicts: connected workflow;0035snapshot; migrationjournal; useActiveCompany; unoTeamPostgresfixture; MCSettings; StaffPage; invite-team-member entrypoint. Main0035_restore_anon_execute_public_read_rpcs collides with branch0035_final_order_mutation_containment. Coordinate numbering/preconditions with95 before later0036/37/38 setup migrations; never edit/applied-replay based only on sourcehistory. Main invitation now uses extracted checked handler; do not overwrite it with old monolithic branch handler. OperatingSpaceSetup, StaffAccountLinks and managementTermsConfiguration are not inmain, so their desired function is not wholly superseded. Existing sourceprivate-cache/errorhandling and currentteam actions must survive. No writes or activation done.

## PR150 — meaningful proposal, not safe wholesale integration

Headcef10802fbf3e0816864d446d78cf747c2627fe9;38files; historical checks green. Family inventory guard, turnovertrigger and keyhierarchy require critical review/isolatedtests and verified manifest;39/94keydefinition unresolved inPRbody is not a seed. Its iCal path creates confirmedcommercialorders with inferredpropertyprices/commission: supersede with111's governed inventory-only import, do not restore those commercialwriters. Bookinghook modifications extend legacy raworders create/delete rollback, so must reconcile with125checkedatomiccommand, not layer parallel authority. Newsrc/lib/pms/civilDate duplicates sharedcivil-date API; newratesreader must reuse currentcanonicalpricingcalendar rather than reintroduce independentlookup. Flag-off does not authorize unconditional iCal legacy behavior. Statementrollupwiring alreadyexplicitlydeferred. Noactivation/seeding/migrationdone.

## PR40 — not a lockfile repair

Headae3388f7babd30a24ac231a8e28817c11ab6fa82;21files,+3401/-2756,includesarchitecturevalidators/repositories/payment/StaffPage. Removes staffpropertyassignmentUI/hooks; cannot drop currentrequired operationalfunction. Neworderreader cachekeys lack actor (and sessionreader projection), and poll-untilfound can spin on errors forever; not equivalent to currentprivate-cache/errorcontract. Lockfile/dependencyagent owns packagefiles. Read-onlydedup remains a refactorproposal requiring tested actor-boundcache, explicitmissing/error/timeout states and preserved staffassignmentflow; no wholesaletransplant.


## Exact final CI links (16:06 UTC)

PR 123 final head: `a4378a8c4aa6fd8547c64ed7e0f8196cb2333dcf`.

- Verify: https://github.com/pavel949/myuno/actions/runs/39631329749 — in progress.
- Connected: https://github.com/pavel949/myuno/actions/runs/39631329704 — in progress.
- Semantic Core: https://github.com/pavel949/myuno/actions/runs/39631329936 — success.

Running checks are not acceptance. This audit branch changes documentation only; it does not mark another PR ready, merge it, apply a migration or resolve the listed critical gates.
