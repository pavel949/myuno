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
- Typecheck passed before the final gallery-label-only correction; final exact-source verification is required.
- Authored-source lint passed with 0 errors and 2,224 existing warnings before the final gallery-label-only correction. Final exact-source verification is required.
- First complete isolated suite: 5,072 pass / 2 failures / 0 skipped across 446 files. The two failures expected the former area-link label and a single card anchor; both were corrected while retaining real history/route and image-recovery assertions, and their 40 focused tests passed. A final complete rerun, production build and broader browser gates remain in progress.

## Boundaries and rollback

Database/Edge/hook/dependency files are unchanged from main. Tests use synthetic state and local PostgreSQL/browser fixtures, with the local network guard denying hosted backend access for accepted verification runs. Authenticated production personas, live request delivery, real charges, actual catalogue publication and production deployment are not exercised.

Rollback of this unpublished candidate is the base main source tree; no data reversal is required. After publication, UI rollback would require the matching tested frontend version; no financial or operational transition should be inferred from a UI rollback. Source PRs remain available while the combined candidate is reviewed.
