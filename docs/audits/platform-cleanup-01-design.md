# Platform cleanup 01 — Design systems and tokens audit

**Track:** `design`
**Scope:** `src/styles`, `src/design-system`, `src/components/ui`, `src/components/nav`, `src/components/shared`
**Date:** 2026-11-14
**Status:** Audit complete; one safe consistency fix applied; no commit or push performed.

## Executive summary

The bounded scope has a canonical token foundation in `src/styles/tokens.css`, imported by `src/design-system/index.css`, and most shared primitives already consume semantic Tailwind/token classes. The main remaining risks are consistency debt rather than a broken second token source: some components retain intentional compatibility aliases, some primitives expose misleading or legacy variants, and several route-specific style systems still use literal colors and type sizes.

One high-confidence, low-risk fix was applied: `StatusPill` now uses the existing canonical `text-caption` utility instead of a literal `text-[11px]` size. This preserves its computed 11px value while making the component follow the shared typography scale.

## Findings

### 1. Fixed — StatusPill bypassed the canonical type scale

- **File/line:** `src/components/ui/status-pill.tsx:10`
- **Evidence:** `StatusPill` used `text-[11px]`, while the design system defines `--type-caption-size` and the project already uses `text-caption` across shared UI.
- **Risk:** Typography drift if the caption token changes; the primitive would not follow the system scale.
- **Resolution:** Replaced `text-[11px]` with `text-caption`. This is a semantic-equivalent change today and keeps the primitive connected to the canonical token.

### 2. Remaining — Button touch-target contract has an explicit dense exception

- **File/line:** `src/components/ui/button.tsx:49-56`
- **Evidence:** Default, large, and icon sizes are 44px or larger (`h-11`/`h-12`), but `sm` is `h-9` (36px). The component comment states a 44px minimum touch target at line 20, while the small variant comment permits dense table/tool-bar use.
- **Risk:** Callers using `size="sm"` for mobile actions can fall below the product’s stated 44px target. A global change would likely break dense desktop toolbars, so this was not changed without caller-by-caller evidence.
- **Recommendation:** Keep `sm` for non-touch dense contexts or introduce a separately named compact visual variant with an explicit parent touch-target wrapper; audit mobile callers before changing the shared primitive.

### 3. Remaining — Surface radius API is misleading and shadows conflict with the stated canon

- **File/lines:** `src/components/ui/surface.tsx:20-26`, `src/components/ui/surface.tsx:36-43`
- **Evidence:** `Surface` exposes `md`, `lg`, `xl`, and `2xl` radius options, but every option resolves to `rounded-none`. Its card/raised/overlay variants also apply elevation shadow aliases, while `src/styles/tokens.css:153-166` describes borders as the primary separation and maps several legacy elevation names.
- **Risk:** Consumers may believe they are selecting distinct radius/elevation systems when the options are compatibility labels. Changing the API or removing shadows is a visual migration, not a safe isolated cleanup.
- **Recommendation:** Deprecate misleading radius names in a later migration, then remove unused aliases only after usage inventory and screenshot review.

### 4. Remaining — Duplicate status primitives need an explicit ownership decision

- **File/lines:** `src/components/ui/badge.tsx:4-20`, `src/components/ui/status-pill.tsx:9-27`
- **Evidence:** Both expose semantic status-like variants (`success`, `warning`, `destructive`/`danger`, etc.), while `StatusPill` additionally owns dot indicators and pill geometry.
- **Risk:** New callers may choose either primitive for the same status display, creating inconsistent geometry and accessibility semantics. They are not strictly identical today, so deleting one would be unsafe.
- **Recommendation:** Document `Badge` for non-interactive labels and `StatusPill` for status/state indicators, then migrate callers in a dedicated tranche.

### 5. Remaining — Legacy compatibility aliases are still used in navigation chrome

- **File/lines:** `src/components/nav/TopBar.tsx:120-121`, `src/components/nav/TopBar.tsx:176`, `src/components/nav/TopBar.tsx:185`; `src/components/nav/AppDrawer.tsx:213`, `src/components/nav/AppDrawer.tsx:268`
- **Evidence:** These use `--bg-surface`, `--bg-elevated`, and `--bg-base`. The aliases are currently defined in `src/styles/tokens.css:341-344` and again for dark mode at `src/styles/tokens.css:530-533`, so they are not broken references.
- **Risk:** The duplicate naming layer makes token ownership harder to discover and increases migration burden. Removing aliases now would break these bounded components.
- **Recommendation:** Migrate callers to `--background`, `--card`, `--card-elevated`, or semantic utility classes only as part of a coordinated alias retirement.

### 6. Remaining — Public cinematic home is a competing visual system by design

- **File/lines:** `src/styles/cinematic-home.css:2-53` (representative); `src/styles/unified-experience.css:9-82`
- **Evidence:** `cinematic-home.css` defines/uses a separate `--home-*` palette and many literal colors (`#d96b1a`, `#163a41`, `#dedbd6`, `#e4e0db`, `#fff`) and literal type sizes, while the shared token system is HSL-based and defines the canonical brand palette in `src/styles/tokens.css:18-58`.
- **Risk:** The landing surface can drift from the rest of the application in color, typography, and spacing. The stylesheet explicitly scopes itself to the public landing (`cinematic-home.css:1`), so this may be an intentional art-directed surface rather than accidental leakage.
- **Recommendation:** Treat it as a separately governed theme; either document its approved exceptions or migrate literals to a scoped theme token layer. No broad replacement was made because it would be a visual redesign.

### 7. Remaining — Repeated literal typography and spacing remain in shared components

- **File/lines:** `src/components/shared/ContextualCTA.tsx:118-159`, `src/components/shared/UnifiedSectionHeader.tsx:49-74`, `src/components/shared/UnifiedHeader.tsx:56-95`
- **Evidence:** Shared components use literals such as `text-[14px]`, `text-[13.5px]`, `text-[11.5px]`, `text-lg`, `py-2.5`, `mb-4`, and `mt-2`, alongside design-system constants in `ecosystemLayout.ts`.
- **Risk:** Small visual differences accumulate across otherwise unified modules. Some values are deliberate component-specific geometry, so automated replacement would be unsafe.
- **Recommendation:** Add named component-level spacing/type contracts to the design system, then migrate one primitive at a time with visual checks at 375px and desktop widths.

## Fixes applied

- `src/components/ui/status-pill.tsx:10`: changed `text-[11px]` to `text-caption`, preserving the current computed size while using the canonical typography utility.
- No other files were changed by this track. Existing unrelated modifications in the worktree were preserved.

## Verification

- `npm run design:check` — passed; reported `4062 findings; 0 new/structural; 219 resolved baseline entries`.
- Focused Vitest run — passed: 4 test files, 31 tests:
  - `src/components/nav/__tests__/BottomBar.test.tsx`
  - `src/components/nav/__tests__/NavShell.accessibility.test.tsx`
  - `src/components/shared/__tests__/UnifiedHeader.test.tsx`
  - `src/design-system/ecosystemLayout.test.ts`
- `npm run typecheck` — started but did not complete within the 120-second tool timeout. No typecheck result is claimed. Multiple concurrent typecheck processes were observed in the shared sandbox; they were not killed to avoid disrupting unrelated work.
- No commit or push performed.

## Remaining risks

1. The design audit baseline is large (`4062` findings), although it reported no new structural findings in this run; the baseline should not be treated as proof of full visual consistency.
2. `Button size="sm"` can be below the stated mobile touch target; caller context must be audited before changing the shared API.
3. `Surface` radius names and elevation aliases obscure the canonical no-radius/no-shadow direction and require a migration plan.
4. `Badge` and `StatusPill` remain overlapping semantic primitives until ownership is documented and callers are migrated.
5. The cinematic landing theme retains a large literal palette and separate `--home-*` system; this is likely intentional but needs explicit governance.
6. Full TypeScript verification remains outstanding because the command timed out in this shared workspace.
