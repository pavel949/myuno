
# ClearView blindness fixes — 3 high-impact changes

Goal: close the biggest gap (developers paying to see their own report) and lift conversion on the paywall, without restructuring the system.

---

## 1. Developer bypass — owners see their own report for free

Today `ClearViewPaywall` accepts a `bypass` prop but `OffplanDetail` never passes it. Developers and their team members hit the paywall on their own project. Fix:

- New hook `useIsProjectDeveloper(projectId)`:
  - resolves the project's `developer_id` (already in `property_projects`)
  - checks two things in parallel:
    - `developers.user_id === auth.uid()` (single-owner / onboarding case)
    - `developer_users` row where `developer_id` matches AND `auth_user_id = auth.uid()` AND `status = 'active'` (multi-seat developer org)
  - returns `{ isProjectDeveloper, isLoading }`
- `ClearViewReport` calls the hook and computes `hasFullAccess = isAdmin || isProjectDeveloper || access?.hasAccess`.
- Same flag also hides the "buy" CTA from developers and shows a small "Owner view — visible to you and admins only" pill instead.

Result: developers and their staff see the full report (per-category findings, evidence gaps, modifiers, recommendations) on their own projects without paying. Public buyers still hit the paywall.

---

## 2. Public "why this grade" popover on `ClearViewBadge`

Today the badge is a static chip. A buyer sees "AA" on a card with no idea what it means until two clicks deeper. Fix:

- Optional `interactive` prop on `ClearViewBadge` (default false to keep map markers cheap).
- When set, badge becomes a Popover trigger that shows:
  - Score (0–100) + grade letter + recommendation chip (BUY / WATCH / AVOID)
  - Mini 8-axis radar (reuse `ClearViewRadar` at `height={180}`)
  - 1-line methodology note + "See full ClearView report →" link to the project's offplan detail page
- Wired only on `PropertyListingCard` and `TrustStrip` — not on map markers (perf).
- Anonymous users see this without auth — pure marketing for the paid tier.

Result: discovery-stage users immediately understand the score and click through to the paywall with intent.

---

## 3. Paywall card — surface bundle + Investor Pass

Today `ClearViewPaywall` only offers `single` (฿2,900). Bundle exists in `CLEARVIEW_PRICING` but has no UI. Heavy users have no subscription option. Fix:

- Redesign the paywall card to show **3 tabs** in one card:
  1. **Single report** — ฿2,900 · 12-month access (current behaviour)
  2. **Bundle of 3** — ฿7,500 · pick any 3 projects in 12 months (already typed as `bundle3`)
  3. **Investor Pass** — ฿9,900 / month · unlimited reports · cancel anytime *(new tier)*
- Add `investor_pass` to `ClearViewTier` and to `CLEARVIEW_PRICING`.
- Edge function `create-clearview-checkout` extended:
  - `investor_pass` → Stripe **subscription** mode (price stored in `system_settings` key `clearview_investor_pass_price_id`)
  - `single` / `bundle3` → keep one-off `payment` mode
- DB:
  - Add `tier text` column to `clearview_purchases` (default `'single'`)
  - For `bundle3`: row stores `tier='bundle3'`, `project_id=NULL`, `quota_remaining=3`, `valid_until=now()+12mo`
  - For `investor_pass`: row stores `tier='investor_pass'`, `project_id=NULL`, `valid_until=current_period_end` from Stripe webhook
  - Update `useClearViewAccess` to grant access if any of: matching `single` row · `bundle3` row with quota > 0 · active `investor_pass` row
  - When a user with a bundle opens a new locked project, decrement `quota_remaining` (RPC `consume_clearview_bundle_slot`).

Result: bundle becomes visible (likely 30–40% AOV lift on serious buyers); Investor Pass captures repeat investors who would otherwise abandon at ฿29k.

---

## Things explicitly NOT in this plan

- B2B developer self-serve checkout (Standard / Premium / Annual) — leave sales-led for v1
- Sample/lead-magnet free report — separate content task
- "Claim your project" flow for unclaimed developers — separate onboarding task
- Persona-aware ClearView promotion on Home — separate IA task

---

## Technical details (for implementation)

### Files to add
- `src/hooks/useIsProjectDeveloper.ts`
- `src/components/clearview/ClearViewBadgePopover.tsx` (wraps `ClearViewBadge` with Popover; needs `projectId` + `report` summary)

### Files to edit
- `src/lib/clearview/methodology.ts` — add `investor_pass` tier + price (฿9,900 / month)
- `src/hooks/useClearViewPurchase.ts` — extend `ClearViewTier`, update `useClearViewAccess` to honor bundle quota and active subscription
- `src/components/clearview/ClearViewPaywall.tsx` — 3-tab UI, route each tier to `purchase({ tier })`
- `src/components/clearview/ClearViewBadge.tsx` — add optional `interactive` + project link props; render via popover when set
- `src/components/newbuilds/ClearViewReport.tsx` — call `useIsProjectDeveloper`, fold into `hasFullAccess`, hide buy CTA + show "Owner view" pill when developer
- `src/components/property/PropertyListingCard.tsx` + `src/components/property/TrustStrip.tsx` — pass `interactive` and `projectId` to badge
- `supabase/functions/create-clearview-checkout/index.ts` — branch on `tier`: `investor_pass` → subscription, others → one-off
- `supabase/functions/stripe-webhook/index.ts` — on `checkout.session.completed` and `invoice.paid` for `clearview_*` line items, write/refresh `clearview_purchases`

### DB migration
- `ALTER TABLE clearview_purchases ADD COLUMN tier text NOT NULL DEFAULT 'single'`
- `ALTER TABLE clearview_purchases ADD COLUMN quota_remaining int` (nullable; only used by `bundle3`)
- `ALTER TABLE clearview_purchases ALTER COLUMN project_id DROP NOT NULL` (bundles + pass have no project)
- New RPC `consume_clearview_bundle_slot(p_user uuid, p_project uuid)` — atomic decrement + record
- Update `clearview_purchases` RLS so users still only see their own rows

### Stripe
- Stripe is already enabled; needs one new recurring price (Investor Pass) created in Stripe dashboard (Test + Live), price IDs stored in `system_settings`. The user will be prompted to add the IDs as secrets when wiring is done.

---

After approval I'll implement in this order: (1) developer bypass first (smallest, biggest UX win), (2) badge popover, (3) tiered paywall + DB + webhook.
