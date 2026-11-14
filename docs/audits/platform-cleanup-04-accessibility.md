# Accessibility and responsive UX audit — track `accessibility`

**Date:** 2026-11-14
**Repository:** `/home/ubuntu/myuno-audit`
**Scope:** public consumer pages and shared shells
**Track:** `accessibility` — Accessibility and responsive UX
**Status:** bounded fixes applied; no commit or push performed

## Audit method and evidence

I read `PROJECT.md` before making changes. The relevant product rules are mobile-first at 375px, no page-level overflow, keyboard/focus-safe controls, clear status treatment, and respect for reduced motion. I reviewed the shared public shell sources (`AppLayout`, `NavShell`/`TopBar`/`ConsumerHeader`, landing chrome, compact footer, public CSS) and existing responsive/accessibility regression tests. I also searched first-party source for image alternatives, interactive controls, dialogs, overflow rules, and motion declarations.

Focused verification after the changes:

- `npm exec -- vitest run src/test/layout/mobile-overflow.test.tsx src/test/layout/startup-loading.test.ts src/test/layout/sticky-scroll-root.test.ts src/components/layout/__tests__/publicChromeContracts.test.ts`
  - **4 test files passed, 14 tests passed**.
- `npm exec -- tsc --noEmit`
  - **Passed with no diagnostics**.
- `git diff --check`
  - **Passed**.

The worktree contained unrelated existing modifications in `src/components/layout/FeatureLayout.tsx`, `src/components/ui/status-pill.tsx`, `src/lib/config/routes.ts`, `src/lib/nav/__tests__/routeRegistry.test.ts`, `src/lib/nav/routeRegistry.ts`, and `src/pages/developer-portal/DeveloperOverview.tsx`. Those files were not edited by this track.

## Findings

### A11Y-01 — public landing header actions were below the shared touch target

**Severity:** Medium
**Location:** `src/components/landings/LandingChrome.tsx:54-70`

The Sign in and Get started links used `h-8` (32px) in the shared landing header. That is below the project’s 44px mobile control contract and creates a small target when the header is used at narrow widths or with touch input. The links had visible text and native keyboard semantics, so this was a target-size issue rather than a missing-label issue.

**Disposition:** Fixed. Both links now use `min-h-11` (44px minimum). See fixes below.

### A11Y-02 — compact footer controls were below the 44px target

**Severity:** Medium
**Location:** `src/components/layout/CompactFooter.tsx:89-98, 171-177, 183-192`

Desktop social links were `h-9 w-9` (36px) and mobile social links were `h-10 w-10` (40px). The mobile install button relied on content/padding rather than an explicit minimum. The social links already had accessible `aria-label` values and the install control was a native button, so the bounded defect was hit-area sizing.

**Disposition:** Fixed. Social links now use 44px square hit areas in both footer branches, and the install button now has `min-h-11`.

### A11Y-03 — reduced-motion handling did not explicitly neutralize all smooth scrolling

**Severity:** Medium
**Location:** `src/index.css:45-50, 441-456`

The base document sets `scroll-behavior: smooth` and horizontal overscroll suppression. The existing `prefers-reduced-motion: reduce` block disabled animation/transition duration and reset `html` scrolling, but did not explicitly reset `scroll-behavior` on all descendants or the document’s overscroll behavior. Components can set smooth scrolling locally, so the previous rule was not a complete shared-shell guarantee.

**Disposition:** Fixed. Under reduced motion, `html` now resets horizontal overscroll, and all elements/pseudo-elements explicitly receive `scroll-behavior: auto !important` in addition to the existing animation/transition suppression.

## Fixes applied

1. `src/components/landings/LandingChrome.tsx:56,64` — changed the two header CTA classes from fixed `h-8` to `min-h-11`, preserving layout, labels, routes, and visual styling while meeting the 44px target.
2. `src/components/layout/CompactFooter.tsx:95,173,189` — raised desktop/mobile social link hit areas to `h-11 w-11` and made the install button `min-h-11`; accessible labels and native semantics were preserved.
3. `src/index.css:442-455` — strengthened the existing reduced-motion media query with `overscroll-behavior-x: auto` on `html` and `scroll-behavior: auto !important` for all elements and pseudo-elements.

## Positive evidence observed

- Shared global focus styling exists in `src/index.css:162-165` (`*:focus-visible`) and the shared nav/search controls use native buttons/links with labels.
- `ConsumerHeader` and `TopBar` expose labeled search/menu/preferences controls and use Radix Sheet/Popover primitives for focus management.
- Public home/catalog image components inspected in `src/components/home/` provide meaningful `alt` text for project, listing, area, and service imagery; decorative icons are marked hidden where appropriate.
- Existing responsive source tests cover wide elements, map widths, modal widths, root overflow, startup status semantics, and public chrome contracts; all selected tests passed.

## Remaining risks / follow-up

These are not claimed as fixed by this track:

1. `src/components/layout/FeatureLayout.tsx:243,254` still contains `h-8` list/map toggle controls. The file had unrelated pre-existing worktree changes, so it was deliberately not edited. Verify their rendered hit area at 375px/keyboard focus before merging the other work.
2. `src/components/nav/TopBar.tsx:134` uses `md:h-9 md:w-9` for the sidebar toggle. The mobile baseline is 44px, but the tablet override is 36px; confirm whether tablet touch-target policy permits that exception.
3. This was a source-level audit, not a browser/assistive-technology run. A follow-up Chromium matrix should exercise keyboard tab order, focus return from search/sheets, 200% zoom, forced-colors/high-contrast mode, and actual 375/390/430px layouts.
4. The repository is large and contains many authenticated/admin/vendor surfaces outside this bounded public-shell track. Their image alt coverage, dialogs, and hit areas were not exhaustively audited here.
5. Some third-party/external destination labels and dynamic catalog image alt values depend on runtime data. Missing or empty runtime titles should remain a separate data-quality/accessibility check.

## Conclusion

The bounded public-shell issues found and clearly attributable to this track were fixed and verified with focused tests and TypeScript validation. No domain, auth, routing, data, or commercial behavior was changed. No commit or push was performed.
