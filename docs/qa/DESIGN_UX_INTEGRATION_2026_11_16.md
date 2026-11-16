# Unified design/UX integration — 2026-11-16

Target: React/Vite `pavel949/myuno`. Base main: `954a6a5171fef01ac143c95d15a4fcb19eac67f0`. Integration branch: `integrate/design-ux-20261116`.

## Result and scope

One review candidate combines the currently overlapping design/UX work against fresh main. The candidate preserves existing booking, pricing, inventory and authorization authority. It does not claim production publication or whole-platform business acceptance.

| Source | Captured head | Treatment |
|---|---|---|
| #186 shared design contracts/read states | 36ee1a789019be04b1390c19348dc1dba29e8471 | Merged with current-main conflict resolutions |
| #195 home/property/area journey | 040b1e51236d0293514d134c7a1428e392e9e67a | Merged; current gallery recovery, history and pricing contracts retained |
| #206 public UX/accessibility | 236192160d7ef580ff17ae49dfef3dd920cee681 | Merged |
| #207 DS2.1 public discovery/mobile bookings | 27244a30c954098225a2ce6f2279cabe4a1766d7 | UI/docs/fixture delta selected; notification hooks/Edge changes excluded |
| #208 responsive controls/fixture maintenance | 1bc5c3fbdaa0c74bb96e9263236e6b6d835590ef | Only the final UI/QA correction delta selected; no financial writers, migrations or dependency changes |

The #207 omissions are `src/hooks/usePropertyCare.ts`, `src/hooks/useServiceMarketplace.ts`, `supabase/functions/_shared/admin-config.ts` and `supabase/functions/notify-admin-order/index.ts`. They remain in their source PR for separate operational acceptance. No messages or notifications are sent by this integration work.

## Resolved intersections

- Keep one visible Rent/Buy/Sell/Manage primary journey; retain the older specialized property searches under an accessible native disclosure. The general discovery link targets Discover rather than reloading the same property hub.
- Keep current Discover entry and direct rental/purchase plan links; do not restore an older homepage search sheet.
- Keep the current owner landing and canonical owner onboarding. Do not restore old hardcoded management prices or unsupported marketing promises.
- Keep existing catalogue/rate helpers, simultaneous recorded tariff display, request-only/quote eligibility and management-company reads.
- Property read failures retain only matching-identity data and existing child drafts; foreign-ID retained data is not displayed. Back navigation retains the canonical criteria/history contract.
- Add explicit offer/area links without nested card anchors; area return supports the existing validated public-journey state and the validated property-return presentation context.
- Keep the current failed-image/empty-photo handling and responsive gallery; add keyboard-operable photo selection and RU/EN/TH labels.
- Use current sharp-corner tokens. Older rounded-card overrides and conflicting title declarations are not restored. Hero goal tiles use opaque token-based surfaces and show their full supporting text.
- Preserve current partner/top-menu separation instead of restoring Business solely to satisfy an obsolete assertion.
- Merge owner-intent metadata with existing lead entity context. The initial merged duplicate metadata key was corrected and a focused regression checks context preservation.
- Refresh source route/primitive inventories without changing the design finding baseline or relabelling untested consumers as visually accepted.
- Generated isolated browser bundles/evidence are excluded from Git and authored-source lint; authored source remains checked.

## Verification status

- Design audit: 3,939 retained findings, **0 new/structural**, 342 resolved baseline entries. The baseline is unchanged. These counts do not represent unique visible defects or complete visual acceptance.
- Property/area/browser journey: 15/15 passing cases, RU/EN/TH at 320/375/390/430/1440px. Actual components with synthetic reads; no hosted backend. Checks actual area round trip, dates/guests, offer intent, photo selection, geometry and home entry.
- Focused lead/property regressions: 31 passing assertions after merging the existing entity context and explicit synthetic THB currency fixture.
- Initial affected-file run: 212 pass, 18 fail due to a missing management-company test boundary. The boundary was corrected; its 18 cases then passed. This failed run is not counted as final acceptance.
- Final complete isolated suite: **5,074/5,074 passing, 446/446 files, 0 skipped**. The two former selector failures were corrected without removing history, route or image-recovery assertions.
- Final runtime source TypeScript, production build and authored-source lint passed; lint reports 0 errors and 2,224 existing warnings.
- Consumer services accessibility: **6/6** passing actual-component cases, EN/RU at 390/768/1440px.
- The first full core browser matrix correctly failed 12 public compact cases (138/150 passed). A later premium stylesheet used a public spacing token that did not inherit the common density scale. Both responsive definitions now derive from `--section-space-scale`; scale 1 retains the existing default geometry. No assertion or baseline was weakened. **Corrected full core matrix: 150/150 passed**, covering public/PMS/admin, RU/EN/TH, light/dark, responsive widths, compact and one-source rebrand variants.
- Shared section/header/link/mobile-overflow contracts: **60/60** actual-component browser cases passed after the spacing correction. The production build also passed again after that CSS change.
- Manual screenshot inspection found the isolated public fixture omitted `homepage-refinement.css`, although the application imports it. Both the source CSS server and final variant bundles now include the complete stylesheet chain and source receipt. The browser matrix now explicitly asserts the four hero goal cards have grid/flex layout, at least 44px height and no horizontal overflow. The interrupted incomplete-style matrix is not accepted as final evidence.
- Property read recovery: **17/17** actual-page cases passed, 0 page errors and 0 overflows, including child draft preservation after background error and retry. The fixture now includes both stylesheets imported by the actual page and explicitly declares a synthetic THB/night/short-stay offer so its booking draft probe tests the intended branch.
- Owner intake: **7/7** actual-component cases passed across EN/RU/TH and mobile/desktop. Assertions cover current Discover entry/four guest links, direct owner intent route, URL/history/draft preservation, disabled pending controls, failure retry and identical synthetic payload/receipt. This is direct owner-route acceptance, not proof of an owner link in the removed chooser. Its CSS chain is complete; obsolete chooser assertions were replaced with actual current navigation assertions.
- Fixture documents now declare UTF-8, matching the application, so CSS-generated navigation symbols render correctly.
- Source inventories describe adoption, not visual acceptance. Hosted mutation E2E remains intentionally skipped; isolated checks are used for this candidate.

## Boundaries and rollback

Database/Edge/hook/dependency files are unchanged from main. Tests use synthetic state and local PostgreSQL/browser fixtures, with the local network guard denying hosted backend access for accepted verification runs. Authenticated production personas, live request delivery, real charges, actual catalogue publication and production deployment are not exercised.

Rollback of this unpublished candidate is the base main source tree; no data reversal is required. After publication, UI rollback would require the matching tested frontend version; no financial or operational transition should be inferred from a UI rollback. Source PRs remain available while the combined candidate is reviewed.

## Publication follow-up

The final CI run on `e2c37456ddc776e906853fbf2d8b4a483ccaa00a` passed source, unit/build, design-system and semantic gates, but the connected browser aggregate failed. The homepage test still required all sections to be single-row rails, despite the integrated editorial guide/services grids and short desktop grids; the complex test required the removed duplicate container link. Assertions now verify the exact expected responsive grid columns, bounds and non-overlap, every overflowing rail's keyboard/arrow behavior, actual mobile property/experience swipes, current canonical header links and one real complex title link. No runtime change or baseline relaxation was needed. The complete homepage matrix and connected CI must pass before publication.

User explicitly authorized publication of the unified design once tests pass. This does not activate #208 financial/schema work. The canonical Lovable project is `dcc2b024-7627-4ad9-a915-a3df3dd839f0`; its source main before release is `954a6a5171fef01ac143c95d15a4fcb19eac67f0`. A pre-release read of `https://www.myuno.app/version.json` reported `be1224b5ed838bffebffddf12b127871adf41bad`, branch `master`, build `2026-11-14T11:16:07.665Z`; published build identity must be rechecked after deploy rather than inferred from main sync.

Publication follow-up local results: full homepage shard aggregate **27/27** (EN 11 including loading/error/empty, RU 8, TH 8; all eight required widths), complex page **12/12**. Every actually overflowing rail is exercised with arrows, keyboard and focus; grid sections are checked for exact responsive column counts and non-overlap. CI on the publication candidate remains required.
