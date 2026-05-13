# Design + verticals audit snapshot (2026-05-12)

Automated scan and targeted shell review done alongside the theme/language stability work.

## Hex literals in TSX (canonical: use `src/styles/tokens.css` / Tailwind semantic tokens)

Counts are **matches per file** (not necessarily distinct colors). Many are legitimate (maps, charts, third-party embeds).

| Area | Notable files (match count) |
|------|-------------------------------|
| `src/pages` | `NewbuildsMap.tsx` (13), `CapitalDashboard.tsx` (10), `OnboardingFlow.tsx` (5), `MapView.tsx` (5), `PipelineSettingsPage.tsx` (6), plus scattered singles |
| `src/components` | `NavigatorPage.tsx` (21), `PublicFloorPlan.tsx` (12), `FloorPlanEditor.tsx` (8), `MethodStep.tsx` (4), `GoogleSignInButton.tsx` (4) |

**Recommendation:** Triage `NavigatorPage`, `NewbuildsMap`, `PublicFloorPlan`, and `CapitalDashboard` first — highest density; replace marketing/UI chrome hex with CSS variables where not tied to map/chart semantics.

## Spot check — shells (canon: `docs/canonical/05-visual-design-system.md`)

1. **`AppLayout` / `NavShell`** — Uses shared layout tokens (`ECOSYSTEM_PAGE_CONTAINER`, `cn`, theme-aware surfaces). No issues flagged in the root shell file header; vertical pages still vary inside `children`.
2. **`NavigatorPage`** — Spec-driven semantic colors per category; heavy inline hex is documented as intentional for the island map spec; long-term consider mapping spec colors to named tokens in `tokens.css` to satisfy ARCHITECTURE_V2 “no raw hex in product UI”.
3. **Deferred providers** — `GoogleMapsProvider` remounts script on language change; unrelated to layout consistency but relevant to perceived “reload” on locale switch.

## Backlog (out of scope for this PR)

- ESLint rule or CI script: warn on new `#[0-9A-Fa-f]{6}` in `src/pages` / `src/components` excluding allowlist paths (`**/Map*.tsx`, `**/FloorPlan*.tsx`, etc.) if desired.
- Full vertical pass (MC, Invest, Owner) with the same checklist: `bg-background`, `font-display` for headings, 44px touch targets, Sheet over Dialog on mobile.
