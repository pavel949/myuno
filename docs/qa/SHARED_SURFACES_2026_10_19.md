# Shared responsive surfaces — 19 October 2026

Repository: `pavel949/myuno`, for `myuno.app`. Integrated base: `bccb10515acefe61f4503d4bd42da4c84998209f`, including visible property search PR127. Existing open compact-home/service/PMS branches are not silently copied into this change.

## Design continuity and scope

Continue `docs/ux/UNIFIED_PRODUCT_DESIGN_2026-10-18.md` and `docs/canonical/05-visual-design-system.md`: cream/navy semantic themes, serif display headings, existing body typography, sharp control corners, shared page widths, role-specific work navigation and stable consumer destinations. This is a cross-application shared-component correction, not a replacement domain model or a claim that every specialized page has been individually redesigned.

Routine frontend change under PROJECT.md §20A. No auth, permissions, financial calculations, status transitions, database schema, booking/inventory writers, production settings or business data changes. No production test bookings. Revert the frontend commit for rollback; no data rollback required.

## Findings and corrections

| Finding | Correction |
|---|---|
| Secondary page actions explicitly enabled on mobile disappeared from both visible row and overflow menu | Partition actions consistently; preserve explicit mobile visibility |
| Mobile primary action without an icon became a blank button | Retain visible wrapping text, reuse Button, use type=button |
| Page titles/actions and section headings could clip or collide | Wrap action groups and titles; remove truncation from section headings; readable scrollable page tabs |
| Breadcrumbs used buttons and navigation labels were English-only | Real links, RU/EN/TH labels for back/overflow/breadcrumb navigation |
| Sticky local headings overlapped global chrome | Shell-owned header offset, consumed by PageHeader/PageTabs |
| No direct keyboard route past repeated navigation | Localized skip link focuses the single main landmark without altering URL/search history |
| Bottom navigation active indication disagreed with router aria-current on alias routes | Use the canonical active-item resolver for aria-current; preserve exact matching |
| Mobile menu lacked active-link treatment | Current-page semantics and visible active styling |
| Dialog and popup defaults were below bottom navigation or sheets | Shared layered defaults: sheet 120/121; dialog 130/131; alert 140/141; menus/popovers 150; tooltip 160. Existing caller overrides remain supported |
| Long dialogs could extend beyond a short viewport | Dynamic viewport max-height, vertical scrolling, overscroll containment, 44px close target |
| Mobile confirmation actions touched without spacing | Consistent footer gap and wrapping |
| Responsive modal headers/footers could shrink | Fixed header/footer flex sizing and dynamic viewport bounds |
| Form errors lacked live announcements and visual invalid-input treatment | Alert semantics on FormMessage, invalid border/focus styles on Input/Textarea |
| Input boundaries were too faint | Light input contrast against page background 1.15→3.37; dark 2.49→3.34, calculated from semantic HSL values. This is a boundary measurement, not a universal WCAG certificate |
| Layout-affecting global transitions animated size/position changes | Limit default control transitions to colors, border, opacity and shadow; explicit component animations remain |
| Loading projections lacked status semantics | Shared LoadingState supplies status/busy semantics |

## Verification

- Shared-component Playwright matrix: RU/EN × light/dark × 320/375/390/430/768/1024/1440/1920, 640px height. 32 cases: visible actions, validation/disabled state, viewport containment, long-dialog last action, Escape, outside dismissal, focus restoration, nested popover/menu interaction, last item in long menu, no runtime errors. Browser requests are intercepted; synthetic UI only.
- New action regression tests cover secondary-action loss, blank primary action, localized overflow and desktop breadcrumb/action continuity. New shell regression covers skip-to-main without URL mutation.
- All 20 existing network-denying browser fixtures passed: 290 result groups/cases, including editor, employee, admin, services, trip, search, catalogue, calendar, Today, booking list/detail and complex pages. These exercise real components with synthetic hooks. The runner retains all 20 original fixtures and adds the 32-case shared-surface fixture. Two workers and the existing 180-second per-fixture cap are preserved. The fixture manifest regression is expanded, not relaxed.
- The existing standalone CloudStoragePicker layer assertion now expects 131 instead of 50; the separate nested-photo-editor layer assertions are unchanged.
- TypeScript was rerun on final source commit ac9c16a6e and passed. Final focused checks: 135 tests across eight suites passed, including current-main property-search routes, page actions, skip link, layout, navigation and admin editor. Runner self-tests: 11 passed. Changed-component ESLint: zero errors; two existing Fast Refresh warnings.
- Initial full unit run: 2,836 passed, 191 skipped; seven PostgreSQL suites failed setup because postgres/pg_config are absent locally. Its one frontend failure was the old z-50 assertion, corrected and rerun successfully. This is not a full-suite pass.
- Initial full production build stopped with exit 137 at chunk rendering while other checks were running. The second attempt uses one Terser worker, preserving minification options and sourcemaps, to reduce peak memory. The corrected file-based programmatic Vite invocation passed in 2m12s, including PWA generation (49 precache entries). The intermediate --input-type=module invocation was unsuitable because that flag propagated into Terser workers; no application source fix was needed. Existing >800kB chunk warnings remain.

## Acceptance limits

Synthetic browser evidence does not certify live credentials, real authorization, backend activation, booking fulfilment, payment, email delivery or publishing. Fonts in the isolated fixtures use locally available/fallback fonts when external font requests are denied. Screenshots are not a certificate for every specialized route, all browser engines, installed PWA behavior or production performance.

The user's full-app request remains broader than this shared-component tranche: signed-in owner/vendor/admin/employee journeys and final production publication require their own actual acceptance. Open PR126 and PR123 are separate work; critical PMS source/activation gates remain separate. Do not label the entire product fully redesigned or production-ready on the strength of this report.

## Delivery status

Source commit: `ac9c16a6e5abedef65f77ab76176d611891cf840`. Branch: `fix/unified-responsive-surfaces-20261019`. After explicit user approval, the connected GitHub API published the identical verified tree as `1f08a9481feca3c37abfad650d8235e4d4fa5343` and opened [PR128](https://github.com/pavel949/myuno/pull/128). Direct Git transport lacked credentials. Merge, deployment and production acceptance have not been performed.

## Final frozen-source rerun

After the final source commit, the complete expanded runner was rerun without source edits: **21/21 fixture groups passed, 322 recorded result cases/groups**, including all 20 existing fixtures and the 32-case shared-surface matrix. TypeScript, 135 focused tests and the memory-limited full Vite/PWA build also passed. This supersedes intermediate fixture attempts and timing races (the new test now awaits visible/focused mounted dialogs before sending Escape, and mounted/settled overlays before outside clicks; dismissal requirements remain unchanged). Representative mobile editor, service catalogue, PMS detail and shared light/dark screenshots were inspected. No deployment occurred.

## CI follow-up

The first remote run found two test-harness issues despite the local pass:

- `verify` run 39238152467: the combined four-operation `portal_messages` denial case exceeded its 5-second test budget. The full PostgreSQL suite passed in parallel run 39238152269. Each table/operation now has an independent fixture and assertion, retaining the default 5-second timeout and all SELECT/INSERT/UPDATE/DELETE denial checks. No production policies, SQL or permissions changed.
- Connected run 39238152269: moderation at RU/430px read filter options before React committed the inactive tab. Both tabs contain four synthetic rows, so the old row/count assertions could accept the previous tree. The fixture now waits for the exact inactive option count and values before checking the rows and options. No sleeps, retries of the scenario, skipped assertions or relaxed geometry checks were introduced.

The follow-up commit requires fresh CI acceptance; the first remote run is not a pass. The application implementation is unchanged by these test-harness fixes.
