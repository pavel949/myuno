# M10c · Dashboard Widgets & ROI Consolidation — Completion Report

**Date:** 2026-04-24
**Scope:** IPP.md §17 (Customer Decision Engine) + §19.3 step M10c
**Principle:** CONNECT BEFORE CREATE — reuse `useCanonicalProfile`, existing calculator, existing dashboard shell.

---

## What was done

### 1. ROI calculator presets (CONNECT — `?preset=` query param on `/newbuilds/calculator`)

Added 6 persona-shaped presets in **`src/lib/calculator/personaPresets.ts`**:

| Slug | Persona | Price | Occupancy | Hold | Use case |
|---|---|---|---|---|---|
| `snowbird` | P5 | ฿9.5M | 50% | 10y | Winter home + summer rent |
| `resident` | P6 | ฿6.5M | 35% | 7y | Rent-to-own settler |
| `investor` | P8 | ฿8.0M | 75% | 5y | Pure passive yield |
| `operator` | P10 | ฿7.5M | 82% | 5y | Portfolio-scale |
| `hnw` | P9 | ฿35M | 45% | 10y | Premium villa |
| `mn` | P11 | ฿12M | 70% | 7y | Mongolian capital |

`/newbuilds/calculator?preset=<slug>` now:
- Reads `searchParams`
- Pre-fills price, CAM-fee/sqm, appreciation
- Shows a "Сценарий" banner with reset link
- Supports project-selector overlay (preset still wins)
- Bilingual RU/EN labels

This is what the M10b persona CTAs already point to (`/newbuilds/calculator?preset=snowbird` etc.) — **gap closed**.

### 2. Persona dashboard widgets (NEW — `PersonaWidgets.tsx`)

Four widgets implementing IPP §17 "Customer Decision Engine":

| Widget | Question | Personas | IPP § |
|---|---|---|---|
| `RentVsBuyWidget` | Rent or buy? | P5, P6 | §17.1 |
| `OwnVsRentWidget` | Sdaát or jit'? | P8, P9, P11 | §17.2 |
| `ReadyForSecondWidget` | Ready for #2? | P10 | §17.3 |
| `RoiPresetsWidget` | Quick presets | All | §17.4 |

Logic:
- Reads `useCanonicalProfile().profile.detectedPersona` (P-code)
- `WIDGETS_BY_PERSONA` map decides which widgets render
- Fallback to `RoiPresetsWidget` only for guests / unmapped personas
- All widgets link to `/newbuilds/calculator?preset=<slug>` (single SSOT calculator)
- All math is local & deterministic (no DB calls, no AI)

Math reused from existing `ProjectROICalculator`:
- `grossYield = annualRent / purchasePrice`
- `netYield = (annualRent − CAM − mgmt) / purchasePrice`
- `5y_buy_advantage = 5y_rent − (txn_cost + 5y_CAM − 5y_appreciation)`

### 3. Feature flag (gated until GA — IPP §13.7)

Widgets are gated by `system_settings.feature_flag:m10c_persona_widgets_v1`.
**Default = ON** (bypassed when no persona detected, returns `null` gracefully).

To disable in production:
```sql
update public.system_settings
set value = 'false'
where key = 'feature_flag:m10c_persona_widgets_v1';
```

### 4. Integration into `UserAccountDashboard`

Added `<PersonaWidgets />` between `DashboardStatsBar` and `QuickActionsPanel`.
Renders only when persona is detected; otherwise zero render impact.

---

## Files changed

- ➕ `src/lib/calculator/personaPresets.ts` — preset map + `presetForPersona(P-code)`
- ➕ `src/components/account/PersonaWidgets.tsx` — 4 widgets + 2 primitives
- ✏️ `src/pages/newbuilds/NewbuildsCalculator.tsx` — `?preset=` support, bilingual, banner
- ✏️ `src/pages/account/UserAccountDashboard.tsx` — wire `<PersonaWidgets />`
- ➕ `docs/canonical/m10c-completion.md` — this report

**No DB migration. No new tables. No new top-level routes. No new shells (uses existing `AppLayout` + `NewbuildsLayout`).**

---

## ROI Calculator inventory (M10c decision applied)

After M10c, the four calculators have clear, non-overlapping roles:

| Component | Use | Status |
|---|---|---|
| `NbROICalculator` | Standalone `/newbuilds/calculator` page (full breakdown, presets) | **Canonical for newbuilds** |
| `ProjectROICalculator` | Embedded in microsites (Peylaa, future `/p/:slug`) — preset-driven | Kept (reusable) |
| `PeylaaROICalculator` | Thin wrapper over `ProjectROICalculator` for `/peylaa` | Kept (back-compat) |
| `property/ROICalculator` | Legacy resale property card embed | **Mark for M10h cleanup** |

All persona/widget links point to **`/newbuilds/calculator?preset=…`** as the single funnel entry.

---

## Acceptance checklist

- [x] `?preset=snowbird|resident|investor|operator|hnw|mn` works on `/newbuilds/calculator`
- [x] Preset banner shows persona label + reset link
- [x] Project selector still functional alongside preset
- [x] `PersonaWidgets` renders only when persona present (or shows preset widget for guests)
- [x] Each widget has icon + title + hint + CTA → calculator
- [x] Bilingual RU/EN throughout
- [x] Uses semantic design tokens (no hex)
- [x] Feature flag `m10c_persona_widgets_v1` honoured (default ON)
- [x] `tsc --noEmit` passes
- [x] No new top-level routes (ARCHITECTURE_V2 §13.1)

---

## Open items for future milestones

1. **`/property/urgent`** still 404 — to be created in M10g (Distressed Vertical).
2. **`property/ROICalculator`** legacy → mark for removal in M10h cleanup.
3. **Persona detection coverage** — only P5/P6/P8/P9/P10/P11 have widgets. P22 (developer) intentionally omitted (no investor decision). Other P-codes fall back to `RoiPresetsWidget`.
4. **Widget telemetry** — no analytics fired yet. Wire `track('m10c_widget_clicked', { widget, persona })` in M10f.

---

## Next milestone: M10d

Per IPP.md §19.3: **M10d — AI Concierge intent routing** (user-facing intent → cluster surface).
Blockers cleared by M10c: persona widgets exist as targets for concierge nudges.

---

*Owner: Pavel Ignatev. AI executor: Lovable. M10c closed.*
