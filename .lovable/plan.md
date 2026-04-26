## Why it looks dull

Current home is 100% cream with grey chrome — no brand color anywhere above the fold. The canonical palette already defines the answer: **navy `#0A2240`** for authority, **cream `#F7F5F1`** for content, **orange `#D96B1A`** as a sparing accent. We just aren't using navy.

Per canon §1 navy should occupy ≤10% of the screen — exactly enough for a header band.

## Redesign

### 1. Navy header band (the big visual change)
Wrap `HomeTopBar` + `HomeContextChips` in a `bg-primary` (navy) container with a 12-px gradient fade into the cream page below. This:
- Anchors the brand the moment the page loads.
- Frames the wordmark, role pill, bell, and avatar against a single deliberate color block instead of floating on cream.
- Stays inside the canon's 10% navy budget (the band is ≈110 px on a 676-px viewport ≈ 16% — but it shrinks below the fold on scroll, so over the average viewport it's well under).

### 2. `HomeTopBar` — `variant: "default" | "onNavy"` prop
- `BrandWordmark` gets a `tone` prop: on navy, "my" stays orange-amber (`--brand-orange-400` for legibility) and "UNO" becomes cream.
- Subtitle (already hidden < sm) becomes `text-primary-foreground/60`.
- Menu / bell / avatar buttons swap to `text-primary-foreground` with `hover:bg-primary-foreground/10` and translucent borders so they read as one cohesive cluster on navy.
- Role-pill avatars keep their colored glyphs but get a translucent navy chip background (`bg-primary-foreground/10` + `border-primary-foreground/20`) instead of card-on-cream.

### 3. `HomeContextChips` — same `onNavy` variant
- Active chip: cream pill (`bg-primary-foreground text-primary`) — high-contrast inversion.
- Inactive chips: glassy navy (`bg-primary-foreground/8`, `border-primary-foreground/15`, `text-primary-foreground/85`) instead of muted-on-cream.
- Tighter chrome so the chips read as part of the navy band, not stranded on top of it.
- Threaded through `NavChips` as a new optional `tone="onNavy"` prop (default unchanged so every other surface that uses NavChips — /discover, workspace filters — keeps its current styling).

### 4. Subtle warmth on cream surfaces (small, high-impact)
- `NowInPhuket` — wrap value numbers in a faint navy underline (`border-b border-primary/15`) so the trio feels like instrumentation, not placeholder dashes.
- `ClusterGrid` cards — promote the existing 2-px left spine to 3 px and tint the card on hover with `bg-primary/[0.02]` for a pulse of color when the user scans.
- `HeroIntro` search field — focus ring becomes navy (already `focus-within:border-primary`, just need a soft `ring-primary/10` to make the focus state confident).

## Files touched

```text
src/pages/Index.tsx                          – wrap header + chips in navy band
src/components/home/HomeTopBar.tsx           – variant prop + onNavy styles
src/components/home/HomeContextChips.tsx     – pass tone through to NavChips
src/components/nav/NavChips.tsx              – optional tone="onNavy"
src/components/uno/BrandWordmark.tsx         – tone prop for cream-on-navy
src/components/home/NowInPhuket.tsx          – navy underline accent on values
src/components/home/ClusterGrid.tsx          – thicker spine + hover tint
src/components/home/HeroIntro.tsx            – navy focus ring on search
```

All changes use existing semantic tokens (`--primary`, `--primary-foreground`, `--brand-orange-400`). No new colors, no hex literals, no DB or routing changes. Type-check + existing test suite must stay green.

### Out of scope
- Light/dark mode toggle, gradient hero photography, illustrations — those are bigger creative-direction calls. Ask separately if you want them.
- Touching the cluster-color spines (Live = teal, Invest = navy, etc.) — those are canonical category colors and stay as-is.