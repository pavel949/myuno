# Life OS — AI continuation handoff

Date: 2026-11-27. Repository: **pavel949/myuno** (React/Vite myUNO App). Never work in `myUNO-final`.

## Start here

Read `PROJECT.md`, `AGENTS.md`, `DESIGN.md`, `docs/ENVIRONMENT.md`, then `docs/canonical/README.md` and the relevant Life OS/catalogue contracts. Reconcile conflicting older guidance against the current constitution and evidence; do not silently choose a conflicting rule.

**Recommendation: first audit the existing mappings and correct the read-only admin view, then propose task-to-category links and event/children coverage for owner approval.** This improves discovery without prematurely changing live data.

## Saved implementation (already on GitHub main)

- `ba60b58689caf695517fdf37da10958b9b27621c`: read-only admin Structure tab, default on the existing Life OS admin page. Files: `src/components/admin/lifeos/LifeOSStructureTab.tsx`, `src/pages/admin/AdminLifeOS.tsx`.
- `a275ed341`: scenario/task pages reading the backend. Files: `src/hooks/useLifeOS.ts`, `src/components/navigation/v3/LifeScenarioPage.tsx`, `SituationDetailPage.tsx`, route registration in `src/components/AnimatedRoutes.tsx` and page registry (locate current paths before editing).
- Public path: `/discover/situations` -> `/discover/:code` -> `/discover/:code/:scenario`. Tasks open the existing Concierge form with situation/scenario/task context; they do **not** currently resolve task-specific offerings or establish bookings.
- Shared presentation: `src/components/navigation/v3/LifeOsPageHeader.tsx`; retain existing navigation, locale and return context.

The handoff PR adds documentation only: these implementation commits are already on main, not newly introduced by its diff. Remote main was verified at `ba60b58689caf695517fdf37da10958b9b27621c` during preparation. Publication of these latest commits was not verified.

## Product requirement

Life situations are events and needs, **not just who the customer is**: birthday, wedding, family celebration, children (activities, health, education/clubs), arrival, daily living, documents and property needs. Roles may filter relevance but are not the whole taxonomy. Public discovery and admin must use the same backend relationships, not a parallel hardcoded catalogue.

`docs/qa/LIFE_OS_MAPPING_PROPOSAL_2026_11_27.md` is historical, unapproved evidence. Its proposal to reduce everything to ten situations is incomplete after the owner's event/children clarification. Do not implement that reduction, aliases or hiding automatically.

## Known data evidence — recheck read-only

Earlier inspection reported 34 active situations, 24 scenarios, 82 tasks and 1,330 situation-level catalogue mappings; 11 situations had no mappings. These are historical observations, not current guaranteed counts. Existing tables: `life_situations`, `life_scenarios`, `life_tasks`, `catalog_life_map`. `task_entity_map` was referenced in code but reportedly absent in the live database. `life_task_categories` was only proposed, not implemented. Search schema, migrations, taxonomy and resolvers before inventing a new mapping table.

## Next work, in order

1. Audit current schema, canonical taxonomy, public catalogue resolver, admin editors and commerce routes. Produce a concrete matrix: situation -> scenario -> task -> existing category/offering IDs -> action (REQUEST / BOOK / BOOK+PAY). Include birthday, wedding, family celebrations and children; mark missing supply as UNKNOWN, never invent providers/prices/availability.
2. Verify the existing Structure tab while genuinely signed in as an authorized admin, without writes. Source review found: its cache key is not actor-bound; mapping counts are raw `catalog_life_map` rows, not verified bookable services; inactive scenarios/tasks affect counts and gaps; task order is not explicitly sorted; no task-to-service resolver exists; search excludes task titles; Thai falls back to English. Public parity claims and empty-state copy need checking. Preserve authorization and use existing shared conventions when correcting these.
3. Propose task/category mapping using the canonical model, proving any new table is necessary. Show the owner the exact scenario/task/category additions, duplicate handling and compatibility plan before live changes. Do not automatically hide role/empty situations.
4. Extend the existing admin page (no new shell): scenario/task editing, ordering, mapping selection, public preview and useful gap/readiness diagnostics. Gate writes under existing server authorization; read-only view alone is not permission to add a writer.
5. Public tasks should open appropriate structured Marketplace offerings first; preserve each vertical's request/booking/payment mode. Concierge is fallback/human escalation, never a second booking or payment authority. Keep links and back-navigation stable.
6. Check RU/EN/TH supported behaviour, both themes, 375px mobile and desktop, loading/error/empty/not-found states, direct URLs, role changes and admin session changes. Test legacy links before any consolidation.

## Safety gates (mandatory)

- Preview, drafts and published site share production data. No staging assumption.
- This handoff is **not** permission to publish, deploy functions, apply migrations, change settings/flags/rights/accounts, seed taxonomy or mutate business records. Obtain explicit owner approval for each live change. E3 and Order Mutation Audit remain NO-GO.
- Never replay historical migrations. Approved migrations are forward-only, least privilege, with security-preserving rollback and an explicit GO/NO-GO stop.
- Keep `service_orders`, commercial `orders`, inventory and ledger separate and canonical. Provider IDs are not organization IDs. No new client, workflow engine or generated-type edits.
- QA uses synthetic/stubbed data. Do not submit a real enquiry/booking as a test without explicit approval.

## Validation and acceptance

Previous conversation reported 397 passing tests and public RU/EN desktop/mobile form-opening checks for scenario pages; these were not rerun during this documentation handoff. The new admin Structure tab was **not** verified in an authenticated admin session. Dark mode and Thai coverage remain unverified. Do not claim release acceptance from those reports.

Use actual `package.json` scripts: targeted `npm test -- <test-files> --maxWorkers=2`, `npm run design:check`, and relevant catalogue validators. Inspect validators first for side effects. Run only isolated database fixtures, never production setup scripts. The Lovable harness handles builds/typechecks; outside Lovable follow repository CI. Add concrete tests for mapping selection, active filtering, scope isolation, mode preservation and missing supply rather than styling/copy snapshots.

Accept only when admin and public pages agree on active relationships; every supported task leads to a real eligible offering/request flow or honest fallback; error is distinct from empty; scope changes cannot reuse unauthorized cache; old URLs work; and the owner has approved any live activation. Report exactly what was verified and stop at the next approval gate.