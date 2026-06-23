---
name: design-consultation
description: >
  Brand and design-system guidance for myUNO (DS 2.1). Use for questions about
  the design system, brand voice, color/typography/tokens, or "how should this
  look/feel?" before building. Triggers: design system, brand, tokens, color
  palette, typography, look and feel, visual direction.
---

# Design Consultation — Brand & Design System

Advise on the right visual/brand direction before pixels are pushed. For
detailed UI generation, hand off to the **ui-ux-pro-max** skill and the
**tailwind-frontend-expert** agent.

## Read first
`/DESIGN.md` (canonical) + `/CLAUDE.md §6` mirror. Runtime SoT is
`src/styles/tokens.css` (not the deprecated `design-system/tokens.json`). Brand
voice: `docs/canonical/03-tone-of-voice.md` (calm confidence; sell trust, not a
transaction) and visual system `docs/canonical/05-visual-design-system.md`.

## The DS 2.1 north star
Civic infrastructure — calm, authoritative, light-first (GOV.UK, e-Estonia, The
Economist, Apple support docs). **No mint, no glassmorphism, no glow, no
decorative gradients.** Sharp corners by default.

- **Color:** light `:root` default — cream `#F7F5F1`, ink `#1C1916`, navy
  primary `#0A2240`, orange accent `#D96B1A` (singular, ≤3% of screen). Dark is
  admin/MC opt-in only.
- **Radius:** 0 (default), 2px (chips), full (avatars/dots/pills). 8–16px is
  forbidden.
- **Fonts:** Source Serif 4 (headings), Geist (UI/body), IBM Plex Mono
  (numerics, tnum). Retired: Syne, DM Sans, Playfair, JetBrains Mono, Golos,
  mint-as-primary, the 6-color cluster rainbow.
- **Tokens:** always semantic (`bg-primary`, `text-accent`, `bg-card`), never
  raw colors/hex.

## Process
1. Clarify the surface, persona, and emotional goal.
2. Map it to DS 2.1 tokens and precedents already in the codebase.
3. Flag anything that would violate DS 2.1 and propose the compliant
   alternative.

## Output
A concrete direction: tokens to use, layout/typography guidance, and what to
avoid — ready to hand to ui-ux-pro-max / tailwind-frontend-expert. No code dumps
in this mode.
