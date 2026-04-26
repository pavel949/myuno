## Issue

On a 339-px viewport (Telegram WebView / narrow Chrome) the navy header breaks:

- **`myUNO` wordmark wraps to two lines** as `m UN / y O`. Cause: in `HomeTopBar` the static `BrandWordmark` lives inside a `min-w-0` flex column, and the `static` variant of `BrandWordmark` does not have `whitespace-nowrap` (only the `link` variant does). The right-side cluster (drawer + role pill + bell + avatar = ~250 px) starves the logo column and the wordmark gets squeezed past its intrinsic width.
- **Context chips below partly hidden** behind the floating concierge avatar (cosmetic side-effect of the same overflow — chips can scroll, that's fine).
- The role pill is heavy on tiny screens: 3 stacked role avatars (~56 px) + chevron + 14 px caret + 20 px padding. Combined with bell + avatar (44 px each) the right cluster eats >60 % of the width.

## Fix (minimal, scoped)

### 1. `BrandWordmark.tsx` — never wrap
- Add `whitespace-nowrap` and `flex-shrink-0` to the `static` branch, matching the `link` branch. The wordmark is 6 chars max — letting it shrink the column was the only reason it ever wrapped.

### 2. `HomeTopBar.tsx` — give the logo column priority, slim the right cluster on tiny screens
- Drop `min-w-0` from the logo cluster wrapper (it forced shrinking).
- Add `min-w-0` and `gap-1.5` (was 2) on the right cluster so it shrinks first if anything must give.
- On `< sm` (≤640 px):
  - Hide the **chevron caret** in the role pill (saves ~18 px).
  - Cap visible role avatars to **2** instead of 3 on `< sm` (saves ~17 px). 3rd+ folds into the existing `+N` counter so the affordance is preserved.
  - Tighten role-pill horizontal padding from `px-2.5` to `px-2` on `< sm`.
- Keep all 44 px tap targets intact (bell, avatar, drawer trigger unchanged).

### 3. `HomeContextChips.tsx` — no code change needed
The chips are already horizontally scrollable; once the wordmark stops wrapping, the band height settles and the strip reads correctly. The "hidden behind chat bubble" effect in the screenshot is the floating concierge — outside scope of this fix.

## Files touched

```text
src/components/uno/BrandWordmark.tsx     – add whitespace-nowrap to `static` branch
src/components/home/HomeTopBar.tsx       – right-cluster slimming + logo column doesn't shrink
```

No design tokens, no new colors, no DB. Type-check stays green.

## Verification

- Browser viewport set to 339×577 (matching the user's screenshot).
- Confirm `myUNO` renders on a single line with the orange `my` + cream `UNO`.
- Confirm role pill, bell, avatar all stay on one row, no horizontal scroll on the header itself.
- Re-check at 375 px (iPhone SE) and 414 px (iPhone Plus) for regressions.
