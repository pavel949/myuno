# Anonymous homepage galleries — 21 October 2026

Target: `pavel949/myuno`, `myuno.app` and `www.myuno.app`. Initial authorization covered frontend code, local QA and a draft PR. Separate explicit target-specific approval was subsequently received for merge to main and production publication after successful exact-head checks, browser QA and review. No schema, secrets, DNS, permissions or production business writes are authorized by this frontend release.

## Baseline and concurrent work

Verified `origin/main` = `6195c5b869832ec26547455d1f6110d13b2e8ab0`. The three original homepage files last changed in `c6d6e4ce23f1e1c1d903ce4ba6141cd37f5b8ef7` (PR #151). Open PRs were checked through the connected GitHub app. Older #70 overlaps Landing copy; it is not a catalog-gallery implementation. #128 overlaps the browser runner and shared navigation, so its changes must be reconciled if either branch merges first. No concurrent implementation of these homepage galleries was found.

## Result

- Smaller location rail precedes complexes; complexes, individual homes, published experiences and actual services/bouquets use a shared native horizontal rail.
- Native touch/trackpad scrolling, keyboard arrows/Home/End, focus reveal, localized controls, boundary states, visible focus, reduced-motion behavior. No automatic rotation.
- One row per catalog, a bounded desktop frame, and a mobile card preview instead of a tall twelve-card complex grid. The duplicate Layantara listing row is removed; its inquiry path remains.
- Existing public search, inline guests, complex area/type/rent/buy filters, home/complex detail links, owner-management route and RU/EN/TH remain.
- Existing approved public service reader and active bouquet reader supply practical offerings. Category links are navigation/request paths, not invented suppliers, stock or availability. Services and flowers identify their own failures; successful partial supply remains visible.
- Homepage experience queries explicitly require `attributes.status = published`. Existing other consumers retain their prior behavior. Stored missing/broken media has a neutral fallback.
- A service-provider page can return to `/` through the existing narrow route allowlist.

## Read-only production evidence

The connected Lovable project `dcc2b024-7627-4ad9-a915-a3df3dd839f0` was resolved as `myUNO`; the final project was not queried or modified. Only SELECT queries were used. The anonymous Data API was blocked by the local network proxy (403), so SQL evidence is not a certificate of anonymous API access.

At the time of checking, there were 11 active experiences explicitly published and 77 active experiences marked draft. Homepage queries now exclude drafts before limiting results. The approved public marketplace-service query returned no rows. Actual active bouquets with shops exist. The first twelve alphabetically sorted active projects had no approved active linked public homes in the checked aggregate; the homepage shows no published listings for them rather than date-specific availability. Runtime data stays in the canonical catalogs; snapshots are ephemeral QA input only and are not bundled or committed.

## Verification and artifacts

Commands: `npm run lint`, `npm run typecheck`, `npm test -- --maxWorkers=2`, `npm run build`, focused component suites, and `python3 -m unittest discover -s scripts/qa -p 'test_browser_fixture_runner.py'`.

Browser reproduction: start Vite on localhost:8080, then `node scripts/qa/homepage-galleries-ui.mjs`. This renders the actual Landing, search, cards and public navigation with synthetic data hooks; external requests are denied. It tests EN/RU/TH × 320/390/768/1440/1920, plus loading/empty/error states. Arrows, keyboard boundaries, focus reveal, touch swipe, and complex search/area/type/rent/buy filters are asserted. The existing browser runner now includes it; its screenshots and `results.json` flow into the existing `connected-system-evidence` Actions artifact.

Local artifact directories:

- `/tmp/browser/homepage-galleries-isolated/`: 18 passing browser scenarios and screenshots.
- `/tmp/browser/homepage-catalog-snapshot/`: ten additional layouts with an ephemeral read-only production catalog snapshot, EN/RU at the five requested widths. These check real titles, absent services and linked bouquets. They do not certify live browser fetches. External image access is environment-dependent; missing media remains visible as neutral states.

Screenshots were visually inspected locally at mobile and desktop sizes. Synthetic screenshots establish layout/interaction evidence, not final product-owner visual acceptance or production end-to-end acceptance.

## Baseline build correction

Full typecheck reports four TS2300 errors in untouched `src/integrations/supabase/types.ts`: duplicate `get_property_calendar_prices` at lines 36550/37070 and duplicate `set_property_calendar_price` at 36554/37390. `git show` confirms the duplicate declarations already exist in base main. The follow-up type-only correction removes the two redundant declarations and retains nullable `p_category_id` in the surviving entries. All arguments and JSON return types remain; no runtime, RPC implementation or database schema changes. This narrow correction is required for the authorized release checks. Final exact-head typecheck and CI, rather than the initial failure, determine the release gate.

Final local counts and exact-head CI outcomes are recorded in the PR description.

Independent review of the final implementation and type correction found no remaining code blocker (9 focused tests independently passed). Initial broad local tests: 3,456 passed, 191 skipped, seven suites could not initialize without PostgreSQL and three unrelated sidebar tests hit the default timeout under concurrent build load. A standalone rerun passed seven sidebar cases and hit one different timeout. Temporary PostgreSQL 18.4 binaries were extracted under `/tmp`, with no repository dependency or system/database changes; the seven previously failing database suites then passed all 258 tests. Final exact-head suite results are recorded in PR #154.
