# MyUNO: reconciliation of audits and UX remediation

18 October 2026. Repository: `pavel949/myuno`, NOT `myUNO-final`.
Baseline: main `4b58434d5f8805ba18a75f7446a08a4754c9f546` (PR #98).

## What has actually been done

- PR #97 changed the homepage. PR #98 (31 changed files) aligned shared theme/public navigation, rental search and holiday entry; merged 12:34:57 UTC, 19:34:57 Phuket.
- `docs/ux/holiday-journey/` records that work and its limits. It explicitly does not certify all authenticated workspaces.
- `docs/convergence/UX_FOUNDATION_AUDIT.md` (17 October) inventories Homes/PMS source. It explicitly did not perform signed-in/browser acceptance.
- June route/design audits are historical leads, not current defect counts. Their route script includes tests and relative paths, so apparent duplicates/orphans cannot justify deletion.
- MC/Admin/Vendor/Guest layouts already adapt AppLayout. Rebuilding them from scratch would duplicate existing work. Staff and specialized layouts need separate review.
- Current source contains multiple feature-flagged navigation variants. Do not switch flags or permissions merely to make screenshots uniform.

## Live evidence in cloud Chrome, 13:00–13:06 UTC

Read-only, signed out, desktop. This is NOT all-role, mobile or transactional acceptance.

1. `/` → `/discover/stay` → `/property/rent/short-term` → `/property/browse?mode=rent&tenancy=short` → Oceanstone property loaded. Navigation changed between these surfaces; browse lacked the global header. The observed Stay page still used Stay/Live/Buy/Services and the old rental entry, while PR98 source specifies Homes/Your trip/Services and `/property/search`. Lovable latest source matched PR98 at inspection, but this alone does not identify the published bundle. Published-version reconciliation remains open; do not assume cache or redeploy blindly.
2. `/property/bd9d24e9-5646-46a2-be03-ebcd0cbaab64` loaded gallery, amenities, description and calendar. Property title says apartment while type says Entire villa. List cards expose raw values such as `walk_to_beach`. Some nightly-list cards display monthly price units. Investigate typed data and presentation separately; do not invent corrected facts/prices.
3. `/discover/services` → `/services` loaded. The page showed no bookable providers, alongside request catalogue cards labelled Order. The catalogue is supplied by HOME_SERVICE_FUNCTIONS, while the bookable grid uses provider-backed data. Distinguish request estimates from real online booking.
4. `/account` → `/me` showed All caught up to a signed-out visitor. Its feed swallowed source errors as empty data. This is false reassurance, not evidence of leaked records.
5. `/mc` redirected to `/auth`. Authenticated operations were not inspected in this pass.
6. Guest calendar source used duplicate RPC reads on desktop and a separate direct management-table read on mobile. Both discarded loading/error context. Prior read-only DB inspection found anonymous EXECUTE denied for the RPC. The public function needs publication-scoped review before any new grant. A calendar with selectable dates does not prove actual availability or a double booking.

## Finite implementation plan and acceptance

| Workstream | Existing authority / route | Correction | Completion evidence | Current state |
|---|---|---|---|---|
| Shared navigation/theme | AppLayout/NavShell, GUEST_NAV, FeatureLayout | Preserve shared header across catalogs; local title/filter below it; one set of preferences; retain role variants | Guest path and return preserve theme, filters and primary navigation; desktop + 375/390/430 RU/EN | PR98 already partly implemented; catalog wrapper correction in this tranche; live publication unresolved |
| Homes search/detail | property route family, existing projections | Align listing labels, property title/type, amenity localization, Rent/Buy hierarchy; preserve old URLs and filters | Search → map → detail → back keeps query; types/prices match stored truth | Source mapped + live sample; content/price discrepancies not yet corrected |
| Guest availability | existing unavailable-date RPC | One guest reader for mobile/desktop; unknown/loading/error explicitly blocks selection/continuation; no management-table data in public view | Tests for loading/error/retry/success; deployed anonymous read verified with published-only contract | UI correction in this tranche; safe public backend read still unresolved |
| Personal cabinet | /me, /bookings, /guest/* | Signed-out prompt, no all-clear on partial failure; successful partial items stay visible | Anonymous/loading/empty/partial/error tests, sign-in and return acceptance | Feed correction in this tranche; other personal subpages pending |
| Marketplace | /services and dedicated service verticals | Explicit REQUEST versus BOOK; estimated catalogue prices labelled; empty provider list distinct from search no-match | Request form → submission → provider handling → status in My Services, separately from online booking | Labels/states in this tranche; transaction/fulfilment acceptance pending |
| Employee/content | /team, /staff, authorized property editors | One scoped work entry; create/edit/draft/review/publish actions discoverable | Restricted employee sees only assigned objects; saved data survives reload and approval appears publicly | Source routes mapped; authenticated pass pending |
| PMS/manager | /mc/today, calendar, bookings-list, properties, rates, operations | Consistent scope/context, booking detail/back, task/calendar action hierarchy | Authorized operational round trip with canonical inventory; no production QA writes | Existing audit available; signed-in acceptance pending |
| Owner | /my-property, statements, signatures, transparency | Separate ownership oversight from management workspace, clear property context | Own-only property/statement visibility and document journey | Source mapped; authenticated pass pending |
| Provider/vendor | /vendor, services/bookings/payouts/messages | Consistent service setup, request processing and customer status | Provider fulfils authorized request; exact mode and state visible on both sides | Source mapped; authenticated pass pending |
| Admin/CRM | /admin, /capital, /mc CRM tools | Clear module entry, moderation/action ownership, return/context preservation | Real authorized UI read; scoped edits only with synthetic acceptance | Source mapped; authenticated pass pending |
| Buy/invest/developer | offplan/resale/commercial, invest, developer portal | Keep sale inquiry separate from rental dates; unify shared frame without removing specialized tools | Project → unit → inquiry; role access and canonical IDs verified | Source routes mapped; runtime pending |
| Support/lifecycle | /support, /for/*, /discover, /life-flow/* | Consistent return and clear handoff to canonical service/request | No dead ends; request state and support destination distinguishable | Source mapped; runtime pending |

## This tranche: exact boundaries

Changes are UI/read-model handling only: no schema migration, no permission grant, no booking/payment/ledger mutation and no production data edits. Guest mobile switches from management-table reads to the same existing date/kind reader as desktop. Authorization failure remains a visible blocker; this does not solve backend authorization or prove booking readiness.

The feed reports failed sources without deleting successful items. The existing source queries and actor filter remain unchanged. Marketplace labels do not create providers or convert requests into confirmed orders. Header adoption retains existing catalog filters and destinations.

## Remaining blockers and next acceptance

1. Determine which revision is actually published at myuno.app; source sync and `is_published=true` alone are insufficient.
2. Safely repair public availability read with publication scope and negative tests before enabling anonymous access. Do not blanket GRANT EXECUTE on a SECURITY DEFINER function lacking a published-property guard.
3. Obtain an authorized signed-in browser session for staff/manager/owner/provider/admin UX. No password in chat. Role activation is not permission to expand access.
4. Verify all affected layouts on mobile and desktop after the bounded code checks. A source-only or DOM-only route list is not visual acceptance.
5. Keep work in small complete route groups. Do not delete aliases, rewrite business domains, weaken tests, or mark remaining modules complete based on a green build.

Sources:
- https://github.com/pavel949/myuno/pull/98
- https://github.com/pavel949/myuno/blob/main/docs/ux/holiday-journey/README.md
- https://github.com/pavel949/myuno/blob/main/docs/convergence/UX_FOUNDATION_AUDIT.md
- https://github.com/pavel949/myuno/blob/main/PROJECT.md
- https://www.myuno.app/discover/stay
- https://www.myuno.app/services

## Local verification for this tranche

- 170 tests in 12 focused files passed (navigation, goal entries, search, stay rules, property import/render, feed and marketplace states). Includes 21 new tests in four files.
- Reverted-code experiment: 13 of 14 feed/marketplace regression cases failed against baseline; working files then restored. This demonstrates regression detection, not 13 independent production bugs.
- TypeScript passed with NODE_OPTIONS=--max-old-space-size=6144. Default Node heap first exhausted memory.
- Changed-source ESLint: zero errors; two existing PropertyBookingCard warnings (any type and control labelling).
- Local production builds transformed 6908 modules but were killed during chunk rendering with both default build heap and 4096 MB. Build is NOT passed; use isolated CI to distinguish runner capacity from code regression.
- Local Vite dev server starts at 127.0.0.1:5174, but cloud Chrome cannot connect to that executor loopback (ERR_CONNECTION_REFUSED). No post-change visual acceptance is claimed.
- Build-generated public/version.json and generated MCP bundle changes were restored; synthetic settings are not included in the patch.

### Follow-up within this PR

- Property cards now display the actual listing title in addition to the district, and existing amenity/feature registries supply labels for legacy highlights such as walk_to_beach, pool and air_conditioning. Stored facts/prices remain unchanged.
- 179 focused tests in 13 files passed, including six new label cases; TypeScript rechecked successfully.
- First CI commit passed the isolated full suite, timezone workflows and production build. The separate verify workflow found a React Hooks naming error in the new test wrapper, corrected by naming it Wrapper; no check weakened. Final commit must be checked again.
- Subsequent CI caught an overly narrow `never[]` type in the test-only query fixture. Corrected it to `unknown[]`; the final local typecheck and the five source-failure tests pass. No production logic or assertion was changed for this correction. Final remote CI remains the publication gate.
