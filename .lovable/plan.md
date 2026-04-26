## What's wrong

Three issues on real phones (and especially in-app browsers like Telegram WebView):

1. **Header looks cluttered.** The "INFRASTRUCTURE FOR LIFE ON PHUKET" subtitle competes with the wordmark on narrow screens, making the brand line wrap and look "desktop-like".
2. **Workspace banner eats the top of the screen.** The "Service cabinet is available…" block stacks vertically on phones (`<sm`) and pushes everything below the fold before the user sees any actual product.
3. **PHUKET / AQI / THB-USD show dashes.** Three problems combined:
   - No skeleton — em-dash flashes during the first paint.
   - When all three external APIs fail (which is common in Telegram/in-app browsers that block third-party fetch), `isLoading` flips to `false` and the dashes become permanent with zero feedback.
   - No way for the user to know the data is unavailable.

## Fixes

### 1. `HomeTopBar.tsx` — quieter brand on phones
Hide the long subtitle below `sm` (≤640px). The wordmark alone is enough on a phone; the subtitle returns from `sm` upward.

### 2. `WorkspaceHomeBanner.tsx` — compact on phones
- Drop the explanatory paragraph on phones (`hidden sm:block`); buttons alone communicate the choice.
- Reduce vertical padding (`py-2` instead of `py-3`).
- Make buttons `flex-1` on phones so they sit on a single row instead of wrapping into two big rectangles.
- Result: banner shrinks from ~140px to ~52px on a 384-wide screen.

### 3. `NowInPhuket.tsx` + `usePhuketConditions.ts` — proper loading + failure UX
- **Loading state:** while `isLoading` is true and we have no cached value, render a 3-cell skeleton (animated `bg-muted` bars) instead of em-dashes.
- **Failure state:** track which fetches succeeded. Expose a new `hasAnyData` flag. If after the network round-trip **none** of the three sources returned data, render a single low-emphasis row: "Live data unavailable" (RU: "Данные недоступны") with a small refresh button that retries in place. Hide the empty 3-cell grid.
- **Partial failure:** existing per-cell em-dash fallback stays for cells whose source failed individually (e.g. weather works, FX fails). That's correct behaviour and matches the `Promise.allSettled` pattern already in place.
- **Cache reuse on retry:** keep the existing 30-min localStorage cache so the retry button doesn't double-fetch unnecessarily.

### Out of scope (not fixing now)
- The "in-app browser" detection / "open in real browser" prompt — that's a separate UX decision and the user didn't ask for it.
- Restructuring HomeContextChips / persona cards — they already render correctly at 384px and the user's screenshot doesn't flag them.

## Files touched

```text
src/components/home/HomeTopBar.tsx          – subtitle hidden < sm
src/components/home/WorkspaceHomeBanner.tsx – compact mobile layout
src/components/home/NowInPhuket.tsx         – skeleton + failure row
src/hooks/usePhuketConditions.ts            – expose hasAnyData + retry()
```

No database, no routing, no API keys. Pure UI + the existing keyless Open-Meteo / jsDelivr fetches. Will type-check and run the existing test suite to make sure nothing regresses.