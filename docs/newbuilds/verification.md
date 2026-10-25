# Newbuild request-only tranche — verification and NO-GO

2026-10-25; baseline 775bd61cef82011eb1f530bcce8dfe666f661a03. Own branch; no shared header, calendar, workflows, DNS, credentials, roles or production data were changed.

## Evidence
- `npx vitest run src/hooks/__tests__/newbuildBuyerProjection.test.ts src/lib/offplan/buyerContract.test.ts src/lib/offplan/newbuildContainment.test.ts src/pages/property/__tests__/OffplanDetail.request.test.tsx src/components/newbuilds/__tests__/BuyerRequestForm.test.tsx src/components/newbuilds/__tests__/NewbuildProjectDeepTabs.locale.test.tsx`: 29 tests. Actual route consultation/documents CTA wiring, RU/EN/TH request form, receipt/failure semantics, explicit public field projection and server gate ordering.
- `node --test scripts/lib/offplan-staging.test.mjs`: 15 tests. Stable identity, unit scaling with explicit mapping, leading zeroes, ambiguity/duplicates, expiry/partial coverage, failure retention, missing-row semantics, dedup and version-checked undo plan.
- `npx playwright test --config e2e/newbuilds/playwright.config.ts`: 2 tests, desktop and 390px mobile. Actual buyer components + real consultation hook, synthetic Supabase adapter and blocked external network. Request → receipt → team metadata; failure retains form with no receipt. This isolated config has no production seed/teardown. System Chromium used; downloading Playwright browser was unavailable (403).
- `npm run design:check`: 0 new/structural findings (existing baseline 4280).
- Focused ESLint on new buyer components/hooks/contracts passed.
- `npm run typecheck` and `npm run build --ignore-scripts`: final source revalidation recorded below. Build omits lifecycle prebuild scripts to avoid generated version changes; design check was run explicitly.
- CLI staging smoke retained pN=10.1 and quarantined its unknown units without loading any database client.

Screenshots are synthetic acceptance surfaces with real component CSS and fallback fonts, not live myuno.app screenshots or full-app/header acceptance:
- [Inventory desktop](screenshots/buyer-inventory-desktop.png)
- [Saved receipt desktop](screenshots/buyer-receipt-desktop.png)
- [Failed save mobile](screenshots/buyer-error-mobile.png)

## Exact activation blockers
1. Read-only connected Supabase `list_projects` succeeded but did not contain expected myuno backend `kakkwibljrjsawxgnupk`. No SQL was attempted against an unrelated or denied project. Current database schema, grants, policies and RPC receipt behavior remain unverified. Outcome: backend inspection blocked by missing authorized project access, not a successful production test.
2. `project-unit-containment.sql` is a review candidate, never applied. Existing broad source policies are not certified safe. Public UI projection is not server authorization. Both edge endpoints have a source gate; no edge deployment occurred. Inventory/payment authority and transaction implementations are unchanged behind containment and remain unsafe to re-enable without separate review.
3. Short myUNO number allocation, optional phase/building/type links, persistent source registry/batches, ownership-specific offer revisions, costs/payment-plan relations, full source parser and scheduler still require additive schema/application implementation after current backend inspection. The offline importer has no apply/publish mode; undo emits a plan only.
4. Drive/official pricing locations are recorded from research handoff. Owner confirms supplied sources as current working base-price sources as of Oct 25; old file dates alone do not reject base prices. Dcondo promo expiry remains Feb 28; Heritage selected-unit PDFs remain partial; Sudara effective date is unknown and LH/FH must remain separate offers. Promotional-only inseparable base amounts need field clarification. File revision/hash ingestion and material publication rights are pending. No source material or catalogue data was published.
5. Purchase navigation shared header/layout is excluded because #174 owns it. Existing project route was tested; complete Buy → resale/newbuild navigation and full app localization are not accepted by this tranche. Other legacy nb_leads entrypoints remain outside this project-path convergence.

No real customer request, notification, reservation, payment or catalogue mutation was performed. No records were deleted or labelled demo. No merge/deploy is authorized by test success. Roll back client code by revert; retain server/browser-write denial until independently reviewed safe replacement exists.

## Final result
Final source typecheck and production build both exited 0. Focused suite: 29/29; Node staging: 15/15; browser: 2/2. Build-generated `supabase/functions/mcp/index.ts` drift was restored to baseline and is excluded from the change.

Local commits: `62a6d9182` (buyer), `2b3a79408` (staging including LOCAL-ONLY source registry), `226ea7c19` (server containment). Connector-authored remote commits have different metadata/SHAs: buyer `0f2dc4b109d240c6e03fc9e263213121a039d1d8`, staging `bb59242279d857212a4886fe53b4479f737d788f`, containment `33a576cc56ae97b27fe1619692c2214415631f52` before this evidence-only commit.

Drafts: #175 buyer path; #176 staging code stacked on #175; containment draft follows #176. No merge or deployment performed.

Automatic approval review REJECTED creation of the GitHub tree containing `data/offplan-sources/registry.json`: it would disclose private-source Drive identifiers and metadata about internal commission/bank materials to a destination whose clearance was not established. The denied tree was not created. That action was not retried. A safer tree containing only the three importer code/test files succeeded; the source registry remains only in the local workspace/commit. Explicit clearance is needed before publishing that registry. CLI GitHub token was invalid; the authorized connector successfully created the safe draft branches/PRs.
