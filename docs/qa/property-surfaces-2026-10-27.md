# Residential public surfaces: second visual tranche

Base: main `046663d895ccdc4beedacaa436e6e7044938895b` (published PR197). This is a separate draft; merge and publication require approval.

## Route coverage and remaining legacy

| Canonical route | Existing foundation retained | This tranche |
| --- | --- | --- |
| `/property/search?mode=rent|buy` | Canonical query filters, compact search, truthful offer periods, map/list and return context | Shared serif card hierarchy and reduced motion |
| `/property/offplan` | Existing project catalogue and canonical filters | Wide frame, 4:3 cards, semantic links, URL search/district/developer state, clear text-only searches, explicit filter-sheet close action, EN/RU/TH primary UI |
| `/property/offplan/:id` | Canonical price, data safeguards and actual project inquiry | Detail frame and controlled hero, Thai primary labels; remove two inert Share/Save icons rather than presenting unsupported actions |
| `/property/:id` | Existing gallery, offer eligibility, safe pricing, mobile request flow and return state | Quiet offer divider and reduced motion |
| `/property/complex/:id` | Existing public project and unit projections, company links and return state | Detail-width shell, shorter mobile hero, shared serif typography and spacing; EN/RU/TH primary UI |
| `/area/:slug` | Canonical area, rental/buy/newbuild links and origin return | Shared card typography and reduced motion |

Aliases continue through the existing router. No new routes, taxonomy, inventory, billing semantics or business facts are introduced. PropertyHub exempts only these public catalogue/project/complex frames from its automatic narrow container; consultation and unrelated workflows retain it.

## Data and interaction boundaries

- Newbuild filters use existing server district/developer and client text predicates. URL parameters preserve unrelated journey keys, replace per-keystroke history and restore after project Back/reload. No price/availability projection changes.
- Project cards expose separate photo/title links, favourite buttons and developer links. The title is a minimum 44px target; the full accessible title is retained despite visual clamping.
- Current canonical DB starting prices and the confirmation notice remain unchanged. No DB, SQL, RLS, roles, credentials, billing, publication flags or source-media changes.
- New selected hero and Library files remain outside this tranche. No failed transfer retried.
- QA fixture imagery is an existing editorial aerial, explicitly used only for synthetic rendering. It is not evidence of a listing's actual photo or current inventory. QA scripts/evidence remain outside the production import graph.

## Validation

- Focused automated regression suite: 144 tests / 9 files passed. An earlier parallel run had one five-second timeout in the existing filter synchronization case; its isolated rerun and the full final suite with one worker passed without changing the test timeout. Three newbuild navigation tests were rerun after correcting a TypeScript-only Testing Library option.
- Typecheck passed. Full repository lint: 0 errors, 2459 warnings. Production build: 7116 modules; canonical design audit: 0 new/structural findings, unchanged baseline.
- Actual Chromium: seven public surfaces swept at 320/390/430/768/1440/1920. Final newbuild/complex matrix: 31 checks, including actual EN/RU/TH document locales at 390/1440, Back/reload, filter open/Escape/reopen/close and reduced motion. No horizontal page overflow or runtime exceptions.
- Separate acceptance pass: clean full-page captures of seven surfaces at 1440/390; empty/clear, HTTP503/error/retry with query retained, loading shimmer, guest favourite → auth → Back, keyboard project link and inquiry open/Escape. No business writes. The 503 state requires the existing PostgREST retries + minimal-schema fallback + React Query retry; the first 25-second observation was insufficient. No retry policy was changed. A loading QA selector was corrected from pulse to the existing shimmer component.
- Preliminary language captures from the first diagnostic script reset the locale during navigation and are excluded from language acceptance. The final 31-check matrix explicitly asserts document language.
- Source review found no blocker. Exact committed-head review and remote CI are recorded in the draft PR.

Evidence is local under `/workspace/myuno-ui-evidence/property-surfaces-final-20261027` and `property-surfaces-acceptance-20261027`; scripts are in `/tmp`. Screenshots contain explicitly synthetic inventory and an editorial image used only as a fixture. No claim of real availability, authentic listing photos or live acceptance.

Live acceptance, authenticated workflows and Google Maps billing are not certified by isolated tests. Existing transport failure prevents Library delivery; no failed transfer was retried. The approved PNG has not been viewed in this executor, so image fidelity is not certified. This tranche is not a redesign of all 433 canonical route entries.
