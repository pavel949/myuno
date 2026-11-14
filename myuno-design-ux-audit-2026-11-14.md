# myUNO Design & UX Audit — 2026-11-14

## Executive summary

The current myUNO design system is structurally healthy, but the live public bundle and the repository are not fully aligned. The live site is visually coherent and has clear primary journeys, but it exposes a duplicate skip link and several shared controls below the project’s 44px mobile touch-target standard. The repository already contains the earlier homepage image-alt and cookie hit-area fixes, but the live site still reports the old behavior, indicating that those changes are not yet deployed to the inspected production origin.

The audit fixed the remaining high-confidence shared-shell issues without changing product flows or domain behavior.

## Evidence inspected

- Live public routes: `https://www.myuno.app/` and `https://www.myuno.app/discover/services`
- Read-only browser DOM, accessibility labels, viewport dimensions, overflow metrics, rendered control sizes, and page text
- Project UX contract: `docs/UX_CONTRACT.md`
- UX foundation audit: `docs/convergence/UX_FOUNDATION_AUDIT.md`
- Design convergence gate: `npm run design:check`
- Focused mobile, navigation, shell, and accessibility tests
- Source components for the app shell, consumer header, cart, back button, cookie banner, and homepage galleries

## Findings and disposition

### P0 — Duplicate skip links in the live shell — fixed in source

The live homepage and services route rendered two separate “Skip to content” links. One came from the application root and another from `NavShell`. The duplicate links created two focus targets and two competing implementations for keyboard users.

**Fix:** removed the app-root `SkipToContent` instance from `src/App.tsx`. `NavShell` remains the single canonical owner of the skip link and `<main>` focus target. The existing `NavShell.accessibility.test.tsx` continues to verify focus movement without changing URL history.

### P0 — Shared cart trigger below the 44px target — fixed in source

The live services header exposed a cart trigger measured at approximately 32px square. The source `MiniCart` used padding-only sizing, so its hit area depended on icon dimensions and could fall below the project’s mobile target.

**Fix:** both empty and populated `MiniCart` triggers now use `inline-flex min-h-11 min-w-11 items-center justify-center`.

### P0 — Compact back button below the 44px target — fixed in source

The live services route exposed a “Go back” control at approximately 32px square. `BackButton` defined an `sm` visual size of `w-8 h-8`, which also constrained the hit area.

**Fix:** `BackButton` preserves its compact visual sizing but adds `min-h-11 min-w-11`, giving the control a 44px hit area without changing navigation behavior.

### P1 — Homepage image alternatives and cookie controls — already fixed in source; deployment mismatch remains

The live homepage DOM reported 15 images without alternative text. The live cookie banner also exposed a 28px dismiss button and 36px action buttons. The repository source already contains meaningful image alt text in the homepage galleries and 44px cookie-banner controls from the preceding accessibility tranche.

**Disposition:** no duplicate source change was made. Production should be redeployed or cache invalidation verified, then the live audit repeated. This is a release/deployment verification issue rather than evidence that the current source fixes are absent.

### P1 — Services catalogue empty state — acceptable, verify data activation separately

The live services route clearly states: “No published provider offers yet. Choose a catalogue section or describe your task.” It provides category navigation and a “Describe your task” concierge action. This is an explicit empty state, not a misleading zero-result or fake catalogue state.

**Disposition:** retain the UX. Provider/offer activation remains an operational readiness task and should not be solved with fabricated cards or fallback data.

### P2 — Design-system baseline debt — tracked, not expanded in this tranche

`npm run design:check` reports 4,069 baseline findings, with `0 new/structural` findings and 212 resolved baseline entries. The remaining findings are known adoption debt rather than regressions introduced by this audit.

**Disposition:** keep the existing baseline and prioritize future batches by shared chrome, public conversion paths, and authenticated operator workflows. Avoid a broad visual rewrite.

## Positive findings

- The homepage has a clear primary action: “Find a home or a service.”
- Rent-duration and buy entry points are understandable and route to distinct search intents.
- The services route has a clear situation/category switch, category cards, an explicit empty state, and a concierge fallback.
- Page-level horizontal overflow was not observed on the inspected desktop viewport; the only overflow measurements were expected offscreen/focusable or floating elements.
- Main landmarks, search controls, route labels, and icon-button names were present on the inspected public routes.
- The existing source-level homepage alt-text and cookie-banner improvements are directionally correct and should be promoted through deployment.

## Verification

- `npm run typecheck`: passed
- `npm run design:check`: passed — `4069 findings; 0 new/structural; 212 resolved baseline entries`
- Focused UX/shell/mobile/accessibility tests: **5 files passed, 70 tests passed**
- Earlier focused homepage/navigation/cookie tests: **3 files passed, 13 tests passed**
- `git diff --check`: passed

## Changed files

- `src/App.tsx` — remove duplicate app-level skip link and update the root-layout comment
- `src/components/market/MiniCart.tsx` — enforce 44px cart hit areas
- `src/components/uno/BackButton.tsx` — enforce 44px back-button hit areas

Existing, unrelated working-tree changes were preserved.

## Release follow-up

1. Deploy the current source revision or verify the production origin/cache is serving it.
2. Repeat the live checks for homepage image alt text, cookie-banner control sizes, duplicate skip links, cart size, and back-button size.
3. Keep the services empty state until real provider offers are approved and operationally supported.
4. Treat the remaining design baseline as a controlled adoption backlog, not a reason to introduce a broad redesign.

## Decision

**Source UX gate: GO for the audited fixes. Live commercial UX gate: CONDITIONAL until the inspected production bundle is aligned with source and the public smoke checks are repeated after deployment.**
