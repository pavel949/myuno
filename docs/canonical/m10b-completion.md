# M10b · Persona Landings & Routing — Completion Report

**Date:** 2026-04-24
**Scope:** IPP.md §11–§16, §18.1 (Seven Doors), §19.3 step M10b
**Principle:** CONNECT BEFORE CREATE — reuse existing `PersonaLandingPage` infrastructure.

---

## What was done

### 1. Persona content (CONNECT — used existing `personaLandings.ts` + `PersonaLandingPage.tsx`)

Promoted 6 IPP investor personas from `draft` → `live` with full content (pains, services, FAQ, SEO):

| P-code | Slug | IPP §  | Door |
|---|---|---|---|
| P5 | `snowbirds` | §11 | Snowbird door — own winter home |
| P6 | `ru-expats` | §12 | Settler door — rent-to-own |
| **P8** | `passive-investors` | §13 | **Investor door — main funnel (~70% revenue)** |
| P9 | `hnw` | §16 | HNW door — already live, primary CTA updated to `/property/mandate` |
| P10 | `operators` | §14 | Operator door — portfolio expansion |
| P11 | `mn-investors` | §15 | Mongolian door — RU+EN (no MN, see §A6) |
| P22 | `developer-partner` | §16 | Developer door — B2B partnership |

Existing live personas preserved verbatim: P1 tourists, P13 pet-owners.

### 2. Routing (CONNECT — reused `PersonaLandingPage` route + added nested entry)

- `/for/:persona` — **existing** route, no change to handler
- `/property/for/:persona` — **NEW** nested route, same handler (ARCHITECTURE_V2 §13.1: no new top-level route)
- `/property/mandate` — **NEW** Deal Room stub page (`MandateLanding.tsx`) — minimal invite-only landing

### 3. CTA wiring

- P5 → `/newbuilds/calculator?preset=snowbird` (M10c will add preset)
- P6 → `/newbuilds/calculator?preset=resident`
- P8 → `/property/offplan` + ROI calculator
- P9 → `/property/mandate` (Deal Room)
- P10 → `/owner` + `/property/urgent` (M10g will create urgent)
- P11 → `/property/mandate?source=mn`
- P22 → `/developer-portal/apply` (existing)

---

## Open conflicts (require Pavel decision before M11)

### C1. P22 taxonomy conflict
- `01-segmentation-framework.md` §4: **P22 = «Локальные фрилансеры»**
- `IPP.md §16`: **P22 = «Застройщик-партнёр»** (developer)
- **Resolution applied (M10b):** kept BOTH slugs under P22:
  - `freelancers` — draft (placeholder for original framework)
  - `developer-partner` — live (IPP intent)
- **Action needed:** Pavel to decide which document is canonical for P22. Suggest: rename IPP §16 P22 → P26 (extend canonical taxonomy by 1 code) to avoid future ambiguity.

### C2. ROI calculator preset URLs
- 4 ROI calculators exist (`ROICalculator`, `NbROICalculator`, `ProjectROICalculator`, `PeylaaROICalculator`)
- Persona CTAs link to `/newbuilds/calculator?preset=<persona>` but **preset query param is not yet handled**
- **Action:** M10c will add preset support to canonical `PeylaaROICalculator` per Pavel decision

### C3. `/property/urgent` not yet created
- P10 secondary CTA points to `/property/urgent` which is M10g scope
- Currently 404 — will resolve when M10g distressed vertical lands

### C4. Mongolian locale (P11)
- IPP §11.1 mentions MN locale; M10b decision per Pavel: **RU+EN only**, MN deferred
- Documented in P11 FAQ: «Mongolian planned for 2026 H2»

---

## Test contract changes

Updated `personaLandings.test.ts`:
- Old: 25 landings, all draft (M6 B.2 contract)
- New: 26 landings (25 P-codes + P22 alias), 9 live (M10b contract)

Existing `PersonaLandingPage.test.tsx` (B.4 routing) — **untouched**, still passes.

---

## Files changed

- ✏️ `src/content/landings/personaLandings.ts` — promoted 6 personas + added developer-partner
- ✏️ `src/content/landings/__tests__/personaLandings.test.ts` — updated contract
- ✏️ `src/components/layout/AnimatedRoutes.tsx` — added 2 routes (`/property/for/:persona`, `/property/mandate`)
- ➕ `src/pages/property/MandateLanding.tsx` — Deal Room stub
- ➕ `docs/canonical/m10b-completion.md` — this report

**No DB migration. No new tables. No new top-level routes (ARCHITECTURE_V2 §13.1 respected).**

---

## Acceptance checklist

- [x] All 7 IPP investor personas have live landing pages
- [x] Each landing has H1 + subtitle + 4–6 pains + 4–5 services + 4–6 FAQ + SEO
- [x] Each landing follows tone-of-voice (calm confidence, no urgency, no «лучший»)
- [x] Each landing ends with concrete CTA pointing to existing flow
- [x] Bilingual RU+EN, no MN
- [x] Nested route `/property/for/:persona` works alongside existing `/for/:persona`
- [x] Deal Room stub at `/property/mandate` (P9 invite-only intent)
- [x] No new top-level routes
- [x] Test suite updated to reflect M10b contract

---

## Next milestone: M10c

**Scope:** Dashboard personalization widgets (Rent vs Buy, Own vs Rent, Ready for #2?, ROI presets).

**Blockers cleared by M10b:**
- P-coded persona content exists → widgets can reference live landings
- `/property/mandate` exists → P9 widgets have target

**M10c will need:**
- Decision on canonical ROI calculator (PeylaaROICalculator confirmed by Pavel)
- Persona detection wiring via `useCanonicalProfile().profile.detectedPersona`
- Feature flag `feature_flag:m10c_persona_widgets_v1`

---

*Owner: Pavel Ignatev. AI executor: Lovable. M10b closed.*
