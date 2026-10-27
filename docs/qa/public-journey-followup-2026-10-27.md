# Public journey corrections after PR #196

Base: merged PR #196 (`e58b0246438fb45af76f7d9751efc26914119ff1`). This follow-up is separate from the next visual design tranche.

## Confirmed live defects and corrections

- Bang Tao's inline Rent card for a dual-offer property displayed rent but linked to purchase. The selected surface mode now owns both intent and price; a legacy sale label cannot change the selected offer. Purchase eligibility remains governed by the existing detail contract and catalogue queries.
- Discuss this project opened a generic form with a nonexistent `property` vertical. It now opens the existing compact `LandingLeadForm`, with canonical `properties` / `property_purchase`, project context and the existing consultation writer. This also avoids irrelevant rental dates/guests and unsupported verification/response-time claims. Confirmed receipt handling and repeated-submit protection remain in the shared form.
- General search could return zero housing results where the property catalogue found matches. The legacy RPC's private-table property branch can silently omit public inventory. Housing text search and housing browse now use `public_property_catalog`, active/approved predicates and a safe projection. RPC property rows are excluded; other RPC categories remain. Generic results do not invent an offer price or rating.

## Verification and limits

- Isolated tests exercise selected rent/buy intent on mixed legacy labels, public query predicates and RPC failure, browse source, and purchase project-context submission to a mocked writer. Existing property detail intent tests are included.
- Real local browser QA uses explicit synthetic inventory and intercepts backend traffic. No real inquiry, booking, price or catalogue mutation is performed. Tests cover inline area cards to rental/purchase detail, actual project form open/Escape/reopen, general search housing results, and horizontal overflow at 320/390/430/1440/1920.
- Root live browser diagnosed Google Maps `BillingNotEnabledMapError`. The honest unavailable fallback remains; billing/key/security configuration is unchanged. Map rendering is not PASS.
- Short tenancy and billing period remain distinct. Read-only public rows for the reported monthly cards explicitly include `tenancy_modes=['short']`, a separate `price_per_night`, and `price_period='month'`. No data or monthly-to-nightly relabelling was applied.
- Live mobile remains unverified because the available live browser API has no supported viewport emulation. Local responsive browser evidence is separate.
- Selected reference images have not been compared in this executor. Further homepage refinement awaits the parent's screenshot-first visual audit; this PR does not claim the whole platform is redesigned.

## Local results

- 65 tests across four affected files: PASS.
- TypeScript: PASS. Targeted ESLint: zero errors, two existing warnings.
- Production build: PASS, 7,115 modules, 2m29s.
- Actual browser: all five widths PASS; zero runtime errors; backend mutations blocked.
- Evidence retained locally in `/workspace/myuno-ui-evidence/followup/`, with `results.json` and actual form screenshots. These paths are executor-local, not public preview URLs.
- Independent source review found no introduced blocker. Exact-head review and CI are recorded separately on the draft PR.
