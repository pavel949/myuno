---
name: design-review
description: >
  Visual audit and design polish for shipped/in-progress myUNO UI. Use to audit
  a screen against DS 2.1, find visual inconsistencies, or do a polish pass.
  Triggers: visual audit, design review, design polish, "check the UI", DS
  compliance, spacing/contrast review.
---

# Design Review — Visual Audit & Polish

Audit real UI against DS 2.1 and produce a fix list. Implementation goes through
the **tailwind-frontend-expert** agent.

## Read first
`/DESIGN.md`, `/CLAUDE.md §6`, and `src/styles/tokens.css` (runtime SoT).

## Audit checklist (cite file:line; classify Blocker / Should-fix / Nit)
- **Tokens:** any raw color or hex (`bg-navy`, `text-orange-400`, `text-white`,
  `bg-white/0.06`) instead of semantic tokens → flag. Theme-switch must not
  break.
- **Radius:** anything other than 0 / 2px / full (e.g. `rounded-lg`,
  `rounded-xl`) → flag.
- **Color discipline:** orange accent ≤3% of screen, single accent; navy primary
  for CTAs; no mint, no glow, no decorative gradient, no glassmorphism.
- **Typography:** Source Serif 4 headings / Geist UI / IBM Plex Mono numerics
  (tnum). No retired fonts. Hierarchy and line-length sane.
- **Spacing & grid:** consistent scale, aligned to the system; no magic margins.
- **Mobile-first 375px:** layout holds; 44×44 touch targets; `Sheet` not
  `Dialog` on mobile; safe-area respected.
- **States:** hover/focus/active/disabled, loading skeletons, empty + error
  states all designed (not just the happy path).
- **A11y:** contrast meets AA, visible focus, semantic structure, labelled
  controls. Optionally `npm run lighthouse:mobile`.
- **i18n:** RU and EN both fit (no truncation/overflow); no raw keys.

## Process
1. Run the app (`npm run dev`, 8080) or read the components; capture each
   screen/state in scope.
2. Walk the checklist per screen; record findings with severity.
3. Propose the token-correct fix for each.

## Output
A prioritised findings list with `file:line`, the DS rule violated, and the
compliant fix. Hand the fix list to tailwind-frontend-expert if asked to apply.
