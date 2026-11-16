# Functionality and design/UX rollout — 2026-11-16

## Verdict

**Latest source is deployed on www.myuno.app; all-screen design/UX acceptance is NOT complete.** Representative navigation and isolated request boundaries work. Real request delivery, persisted operations and authenticated role workflows were not exercised. No application code, production data, permissions, settings, notifications or publication changed during this audit.

## Source and public release

- Tested HEAD: `be1224b5ed838bffebffddf12b127871adf41bad`; locally stored `origin/main` matches; initial worktree clean. Remote branch freshness and CI status were not fetched.
- Fresh public GET `https://www.myuno.app/version.json`: version `3.55.5`, buildTime `2026-11-14T11:16:07.665Z`, commit `be1224b5ed838bffebffddf12b127871adf41bad`, branch `master`.
- Public HTML entry `/assets/index-CDQV1JR7.js` contains that full commit in its build identity. Source/public SHA parity PASS. Provider deployment ID, READY status and branch naming parity with GitHub remain unverified; do not reinterpret the published `master` label as proof of `main`.
- Existing local `public/version.json` contains older `6837890113321af5bd3621043293cc4616a049af`; it is not evidence of the current served release.
- Latest observability build entry: `2026-11-16T02:23:47Z`, build OK. No manual application build/typecheck run.

## Fresh verification

| Scope | Result | Limits |
|---|---|---|
| Preview initial rendering, 8 paths × mobile 384×681 / desktop 1280×1800 | 16/16 without page runtime errors or horizontal overflow | External requests denied; loading catalogue is not verified catalogue loading |
| `/index`, `/discover`, rent/buy searches, `/services`, offplan | Correct route or intentional redirect | Guest only; English rendering |
| `/owner`, `/admin` as guest | Auth redirect retains `/mc` / `/admin` | No authenticated role proof |
| Isolated current search → detail → action, holiday/month/year/buy | 4/4 PASS | Synthetic property; checkout/auth boundaries, not hosted booking |
| Isolated owner form | 1/1 PASS | Synthetic acknowledgement only; no request delivery |
| Isolated actual services landing | 1/1 PASS | Booking excluded |
| Targeted unit/component regressions | 205 PASS / 1 FAIL, 12 files | Failure is outdated business-top-menu expectation; intentional partner menu separation exists in current source |
| Design source gate | PASS: 3,945 retained findings, 0 new/structural, 336 resolved baseline entries | Baseline is debt inventory, not visual sign-off; findings are not 3,945 distinct user defects |

Commands:

```text
git rev-parse HEAD
git status --short
git log -5 --format='%h %cI %s'
git rev-parse origin/main
curl -fsSL https://www.myuno.app/version.json
npm run design:check
npm test -- src/lib/consultationIntake.test.ts src/lib/__tests__/propertySearchQuery.test.ts src/lib/__tests__/propertySearchPresentation.test.ts src/lib/services/serviceNavigation.test.ts src/lib/services/serviceBookingModel.test.ts src/lib/services/marketplaceDiscovery.test.ts src/lib/adminInboxRequest.test.ts src/components/ui/__tests__/nestedOverlays.test.tsx src/pages/property/__tests__/OffplanIndex.navigation.test.tsx src/pages/services/ServiceRoutes.integration.test.tsx src/components/services/MarketplaceDiscovery.integration.test.tsx src/lib/nav/__tests__/navigationModel.test.ts
python3 /tmp/browser/readiness-20261116/check_preview.py
node scripts/qa/homepage-intent-routes.mjs --build-only
python3 /tmp/browser/readiness-20261116/check_isolated_intents.py /tmp/browser/homepage-intent-routes
```

Temporary isolated runner copied the repository fixture driver, used bundled Chromium, disabled full-page screenshots, set height 1800 and selected six EN/384 cases. Its first holiday run failed because the old fixture expected `Reserve`; the current actual button is `Cost & booking request`. After adapting the temporary selector and clicking actual `Request direct booking`, all six passed. No product bug inferred from that stale selector. Production modules are excluded by the existing fixture bundler; browser denies non-fixture network. Artifacts are temporary under `/tmp/browser/readiness-20261116` and `/tmp/browser/homepage-intent-routes`.

## Confirmed gaps

1. **Mobile homepage:** screenshot `384-index.png` shows `Experiences` broken as `Experience` / `s`; supporting goal text is ellipsized. No horizontal overflow, but label readability is defective. Hero goal tiles retain glass-like styling, inconsistent with the no-glassmorphism canonical direction; redesign not performed.
2. **Design rollout incomplete:** mounted MC finance has decorative gradient KPIs (`src/pages/owner/FinanceOverview.tsx:79,98,115`); owner portfolio `:198,216,234,252`; vendor landing `:124,276` and payouts `:174`; admin component gradients remain in `ABVariantEditorModal.tsx:149` and `LifeOSAIPanel.tsx:284` (activation conditions not browser-verified).
3. **Developer localization:** `src/components/newbuilds/DeveloperPortalLayout.tsx:18-25` defines Russian-only navigation rendered in both desktop/mobile despite reading current language. Source-verified; no authenticated browser claim.
4. **Selected item continuity:** `src/pages/mc/operations/PmsTodayPage.tsx:63-100` opens property rather than selected booking/request; task links at `:104-112` do preserve ID/context.
5. **Advertised action versus destination:** `src/components/owner/dashboard/RoleQuickActions.tsx:31-37`, Call Log → contacts; New Invoice → invoice list, whose creation sheet starts closed (`InvoicesPage.tsx:35-36`).
6. **Vendor selected order:** `src/pages/vendor/VendorDashboard.tsx:351` routes to `/vendor/bookings/${order.id}`; the earlier audit's absent detail route needs a scoped route/access reproduction before modification. Do not call this fresh hosted proof.
7. **MC pricing/auth context:** `src/pages/ForManagementCompanies.tsx:363-368` places tier/trial outside `redirect`; Auth consumes redirect at `src/pages/Auth.tsx:108-117`, losing those parameters from return destination. Whether separate billing recovers them is unverified.
8. **Regression maintenance:** `src/lib/nav/__tests__/navigationModel.test.ts:329-333` still expects Business in `GUEST_TOP_NAV`, while current model intentionally keeps partner paths separate (`navigationModel.ts:55-61`). Do not restore a removed top-menu item merely to satisfy an obsolete test.

## What is working and what remains unknown

Latest public changes are present: separate homes/services/experiences entries, intent-first Discover, provider-offer filters and concierge fallback. Search fixtures retain rent tenancy, guest count and sale intent; direct-booking CTA reaches the existing inquiry boundary with selected dates. Nested-overlay regressions passed in the targeted suite. Admin selected-request regressions passed. These do not prove business persistence or delivery.

Hosted authenticated non-admin/owner/provider/developer/MC role acceptance remains BLOCKED: available status `signed_out`; no account minting, role switching, new accounts or assignments performed. Production request/booking/payment writes, export and notifications are outside this audit. No whole-platform GO.

**Recommendation:** fix the small navigation/context/localization gaps and mobile label first, then converge remaining authenticated leaf screens to the existing design system; do not redesign the homepage again or infer readiness from a shared-shell update. These are proposed follow-ups, not performed changes.