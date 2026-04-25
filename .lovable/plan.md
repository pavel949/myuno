# MC Block — Critical Assessment & Remediation Plan

> Cross-checked with `/PROJECT.md` v2.3 (the Bible). Scored on a 100-point scale against the strategic premise: *"myUNO is digital infrastructure for foreigners + a trusted real-estate operator. STAYS feeds the real-estate flywheel."*

---

## 1. Executive Summary

**Overall MC score: 58 / 100 — “functional but fragmented”.**

The MC workspace has impressive surface area (84 owner pages + 15 dedicated `/mc/*` pages, 20+ sidebar items, 11+ MC edge functions, ~14 backing tables). However, almost half of the advanced modules (Approvals, Procurement, Trust Accounts, Shifts, Signature, Webhooks, API Keys, Owner Statements, Owner Payouts) are **wired UI with zero usage** (0 rows in production), there is a **second, parallel onboarding flow** (`/mc/onboarding` vs `/mc/onboarding/wizard`), the **subscription/billing layer has two competing schemas** (`mc_property_slots` vs the missing `stays_subscription_tiers`), and the **Business Health Score has a math bug** that makes one pillar always meaningless.

Strategic alignment with PROJECT.md is the strongest part — MC correctly sits as the operational arm of the STAYS leg of the flywheel. Tactical execution is the weakest.

---

## 2. Scope of the Audit

Inventoried surfaces (hard count, no estimation):

| Area | Count | Notes |
|---|---|---|
| MC routes (`/mc/*`) | 89 nested routes under `MCGuard + MCLayout` | + 2 outside guard (`/mc/onboarding`, `/mc/register`) |
| Page modules under `src/pages/mc/*` | 15 (in 7 sub-folders) | finance / operations / team / insights / onboarding / developer / documents |
| Page modules under `src/pages/owner/*` (rendered inside `/mc`) | 84 | legacy folder still authoritative for most MC pages |
| MC-specific React hooks | ~30+ (`useMCSubscription`, `useMcOnboarding`, `useDashboardMetrics`, `useApprovals`, `usePurchaseOrders`, `useTrustAccounts`, `useTeamShifts`, etc.) | |
| MC-specific edge functions | 11 (`register-mc`, `create-mc-subscription`, `check-mc-subscription`, `mc-customer-portal`, `admin-manage-mc-subscription`, `export-mc-data`, `monthly-owner-statements`, `owner-monthly-digest`, `scheduled-mc-backup`, `stays-subscribe`, `ai-owner-nurture`) | |
| MC-related tables | 19+ | `management_companies`, `management_company_members`, `mc_onboarding_progress`, `mc_property_slots`, `mcc_*` (10 marketing-cloud tables), `staff_members`, `crm_*`, etc. |
| Active production MCs | **2** (Show Property Phuket — 25 properties, Ignatev Estate — 2 properties) | 4 active members |

---

## 3. Scored Findings (100 pts)

### 3.1 Strategic alignment with PROJECT.md  → **18 / 20**

Strong. MC = operational hub for STAYS, which is correctly positioned as a flywheel feeder for DEALS.

✓ STAYS infrastructure present (PMS, channel manager, finance, CRM).
✓ Single-tenant data isolation through `management_company_id` is consistent in core hooks (`useMyProperties`, `useDashboardMetrics`, `getAccessiblePropertyIds`).
✗ **No visible bridge from MC operations into Capital/DEALS funnel** — agent_deals exists but the MC dashboard does not surface "owners likely to sell" or auto-create capital intent leads from STAYS data, which is the explicit Bible strategy (TURIST → ARENDATOR → POKUPATEL → SOBSTVENNIK).
✗ ClearView (Bible Moat #8) is not surfaced anywhere in `/mc/*`, even though MCs manage the very same projects.

### 3.2 Architecture & code organisation  → **8 / 15**

✗ **Folder schism**: 84 pages live in `src/pages/owner/` and 15 in `src/pages/mc/` — both render under the same `/mc/*` route tree. This is half-finished housekeeping; comments on lines 895–901 of `AnimatedRoutes.tsx` even read "Pages moved from /owner". Half-moved.
✗ **Two onboarding flows** that do not know about each other:
  - `/mc/onboarding` → `MCOnboarding.tsx` (4-step wizard, writes `management_companies` directly).
  - `/mc/onboarding/wizard` → `McOnboardingWizardPage.tsx` (7-step checklist driven by `mc_onboarding_progress`).
  Result: `mc_onboarding_progress` table exists but has **0 rows** in production — nobody is using the checklist; the 4-step page is the real path.
✗ **Two MC layouts** historically (`MCLayout` is now a thin wrapper over `AppLayout` — good cleanup, fine).
✓ `MCGuard` correctly redirects unscoped users; `useActiveCompany` correctly invalidates company-scoped queries on switch.

### 3.3 Data & backend integrity  → **9 / 15**

✓ Core data is clean: 0 orphaned property_financials / bookings / tasks / deals / contacts / staff (verified via SQL).
✓ RLS enabled on all 16 audited MC-scope tables.
✗ **Subscription system schema split**:
  - Frontend hook `useMCSubscription` + edge fn `check-mc-subscription` use `mc_property_slots` (table exists, **0 rows**).
  - Edge fn `stays-subscribe` queries `stays_subscription_tiers` and writes `property_stays_subscriptions` — **neither table exists in the database**. Calling that function will 500.
  - PROJECT.md / CLAUDE.md mention `stays_subscription` as the canonical table; it is missing entirely.
✗ Linter: 1 ERROR (Security Definer View) + 3 warnings still outstanding (function search_path, extension in public, public bucket listing).

### 3.4 Business logic correctness  → **6 / 10**

✗ **Business Health Score math bug** (`useBusinessHealthScore.ts` line 48): `dealsPercent = (ops.activeDeals / Math.max(ops.activeDeals, 1)) * 100` → always 100 if any deal exists, 50 otherwise. The "Deals" pillar is decorative.
✗ **Service health** (line 69): each open service request flat-deducts 15% — 7 open requests = 0% health regardless of property count. Should be normalised per property or per booking.
✗ **Occupancy** assumes every property in `filteredPropertyIds` is rentable for the full month; commercial / land / off-line properties drag occupancy down artificially.
✓ Dashboard query is correctly batched (Promise.all of 14 queries) and respects `DashboardFilterContext`.

### 3.5 Frontend ↔ backend connectivity  → **5 / 10**

✗ **Hollow modules**: 9 advanced MC pages render perfect UI against tables with **zero rows**:

| Page | Table | Rows |
|---|---|---|
| `/mc/approvals` | `approval_requests` | 0 |
| `/mc/procurement` | `purchase_orders` | 0 |
| `/mc/finance/trust-accounts` | `trust_accounts` | 0 |
| `/mc/finance/owner-payouts` | `owner_payouts` | 0 |
| `/mc/finance/statement-approvals` | `owner_statement_approvals` | 0 |
| `/mc/team/shifts` | `team_shifts` | 0 |
| `/mc/documents/signatures` | `signature_requests` | 0 |
| `/mc/developer/api-keys` | `api_keys` | 0 |
| `/mc/developer/webhooks` | `webhook_endpoints` | 0 |

Net result: a brand-new MC sees ~9 empty hubs in their sidebar with no seed data, no quick-start templates, no CTA explaining "what is this for".

✗ The Marketing Cloud (`mcc_*` 10 tables) is fully scaffolded but unused (0 campaigns, 0 leads). It is also not exposed in MC sidebar — it floats unowned.
✓ Core flow (properties → bookings → financials → CRM tasks → deals) is fully wired and producing data.

### 3.6 UX / IA / Navigation  → **6 / 15**

✗ **Sidebar is overloaded** even after the documented "41 → 20" trim: 6 groups, 20 items, plus 6 secondary financial routes, plus deep CRM (Pipelines, Sequences, Quotes, Meetings, Workflows, Templates, Duplicates, Companies, Forms, Assignment) accessible only by direct URL. Discovery problem for power users.
✗ **Dashboard widget storm**: `OwnerDashboard.tsx` has 33 imported widget components and 5 sections, gated by a `BusinessRole` switcher. On the user's current 339-px viewport this is a vertical mile of cards; FCP / LCP suffer.
✗ **Bilingual debt**: most newer MC pages (Trust Accounts, Approvals, Procurement, Shifts, Signature, Webhooks, API Keys) hard-code RU labels via inline `isRu ? ... : ...` instead of going through `i18n/uiStrings`.
✗ **No onboarding state on first login** for an MC with 0 properties: empty dashboard with skeleton-then-blank cards. The wizard checklist exists but never triggers.
✓ Founder Mode and BusinessRole switcher are a strong concept (Director / Sales / Service / General).

### 3.7 Security & permissions  → **6 / 10**

✓ `MCGuard` + `useResolvedContext` server-side role resolution — correct pattern, no client-side role derivation.
✓ `getAccessiblePropertyIds` has unified ownership/delegation/company logic.
✗ **Granular team permissions stored in `team_member_permissions`** are never enforced in the UI: any active MC member can hit `/mc/finance`, `/mc/approvals`, `/mc/developer/api-keys` etc. (route guard only checks membership, not module permission).
✗ `register-mc` edge fn auto-creates `management_company_members` for the inviting user as `owner` — fine — but does not revoke prior `is_active=true` rows if user re-registers, leading to potential ghost memberships.

### 3.8 Performance  → **0 / 5** *(bonus deduction)*

✗ `OwnerDashboard.tsx` imports 33 widgets at the top of the module (no lazy split inside the file). With every widget firing its own `useQuery`, the dashboard runs **30+ Supabase calls** on first paint even after the dashboard-metrics consolidation.
✗ `useDashboardMetrics` re-keys on `[...filteredPropertyIds].sort().join(',')` — for a 100-property MC this is a 4 KB cache key.

**Total: 58 / 100**

---

## 4. Top 10 Concrete Bugs / Mismatches

1. `stays-subscribe` edge fn references `stays_subscription_tiers` + `property_stays_subscriptions` — **neither table exists**, fn will throw at runtime.
2. `useBusinessHealthScore` "Deals" pillar formula is a no-op (always 50% or 100%).
3. `useBusinessHealthScore` "Service" pillar collapses to 0 with 7+ open requests, regardless of fleet size.
4. Two onboarding pages (`/mc/onboarding` vs `/mc/onboarding/wizard`) writing to two different stores; only the older 4-step is exercised, and `mc_onboarding_progress` has 0 rows in prod.
5. Page folder split (`src/pages/owner/*` 84 files vs `src/pages/mc/*` 15 files) — incomplete migration; routes already pretend the move is done (comment on line 895).
6. `team_member_permissions` table exists but is not enforced by any guard or hook in `/mc/*` — any active member sees every screen.
7. CLAUDE.md and PROJECT.md call the subscription table `stays_subscription`; the codebase calls it `mc_property_slots`; the `stays-subscribe` fn calls it something else again. Source-of-truth conflict.
8. `MCSubscriptionPage` (604 LoC) exists with no rows in `mc_property_slots` → first-time MCs see "0 / 0 slots" with no upsell flow surfaced from the dashboard.
9. The MCC marketing cloud (10 tables) is invisible from the MC sidebar; orphaned product surface.
10. ClearView (the Bible's Moat #8) has zero presence on `/mc/properties/*` even though every MC-managed off-plan project is a ClearView candidate. Strategic miss.

---

## 5. Mismatches with `/PROJECT.md`

| PROJECT.md tenet | MC reality | Gap |
|---|---|---|
| "Single trusted operator" | 9 hollow product modules | Looks unfinished, erodes trust signal |
| "STAYS is the funnel for DEALS (real-estate revenue)" | No deal-creation surface inside MC | Missing the most strategic bridge |
| "ClearView is Moat #8" | Absent in MC flows | Owners can't see / publish ratings of their own buildings |
| "Founder mode = Pavel's daily workspace" | Founder widgets exist, but compete with 25 other widgets | Needs a true `/mc?mode=founder` minimal view |
| "Spokojnaya uverennost'" tone | Many newer pages have raw RU/EN ternary, not unified strings | Tone inconsistency |

---

## 6. Recommended Phased Implementation Plan

The plan is sized to be picked up in 6 distinct passes; each pass is shippable and testable on its own.

### Phase 1 — Truth & Foundation (3–4 hours)
*Fix the data layer ambiguity before anything else.*

1. **Pick one subscription model.** Recommend: keep `mc_property_slots` (already populated logic), kill `stays-subscribe` edge fn or rewrite it against `mc_property_slots`. Update PROJECT.md and CLAUDE.md to call the canonical table by its real name.
2. **Migration**: drop dead references (`stays_subscription_tiers`, `property_stays_subscriptions`) from code; add a check trigger so future migrations don't silently re-introduce them.
3. **Resolve the page folder split.** Move the remaining 84 `src/pages/owner/*` files to `src/pages/mc/*` (keep re-exports for one release cycle), update `pageRegistry.ts` and `AnimatedRoutes.tsx`.
4. **Resolve onboarding duplication.** Make `/mc/onboarding` (4-step) the single creation flow; `/mc/onboarding/wizard` becomes the post-creation 7-step *checklist* triggered automatically when `mc_onboarding_progress` is incomplete. Have `register-mc` insert the initial progress row.

### Phase 2 — Logic Bugs (1–2 hours)

5. Fix `useBusinessHealthScore`:
   - Deals pillar = `min(100, activeDeals / max(propertiesCount * 0.3, 1) * 100)` (≈ 1 deal per 3 properties = healthy).
   - Service pillar normalised: `max(0, 100 - openRequests / max(activeProperties, 1) * 50)`.
   - Occupancy denominator excludes properties where `is_active=false` or `asset_class != 'residential'`.
6. Add a unit test in `src/test/` for the score function with three fixture cases.

### Phase 3 — Hollow Module Strategy (2–3 hours, **decision-driven**)

For each of the 9 zero-row modules, choose one of three labels and act:

| Label | Action |
|---|---|
| **Hide** | Remove from sidebar; keep route so direct links still work. Used for Approvals, Procurement, Trust Accounts, Owner Payouts, Statement Approvals, Shifts, Signatures unless an MC asks for them. |
| **Empty-state-with-CTA** | Wrap each page in a "Coming soon — request access" component that creates a feature-flag-request row. Used for API Keys, Webhooks. |
| **Seed-and-promote** | Create 1 demo workflow / 1 demo PO / 1 demo trust account when an MC is provisioned, plus a "Try it" tile on the dashboard. Used for the modules we *want* to push. |

Prefer Hide for everything except API Keys & Webhooks (developer audience) and Owner Payouts (real revenue need). Surface area shrinks ~15 nav items.

### Phase 4 — Dashboard surgery (2–3 hours)

7. Lazy-load the 33 widget components inside `OwnerDashboard.tsx` (each `lazy()`).
8. Reduce default visible widgets per `BusinessRole` (Director sees 8, others 5).
9. Add a "First-time MC" empty state: if `allProperties.length === 0`, render only the wizard checklist — not the 5 zone grid.
10. Move the BusinessRole switcher into the workspace header (single source); persist in `user_active_context`.

### Phase 5 — Strategic alignment with PROJECT.md (3–4 hours)

11. **STAYS → DEALS bridge**: add a `OwnerSellSignal` widget on `/mc/properties/:id/manage` that detects (declining occupancy + high age + no recent deals) → one-click "Create capital lead" that inserts an `agent_deals` row of stage `lead` with `source = 'stays_signal'`.
12. **ClearView surface**: on `/mc/properties/:id` show the property's ClearView grade chip + "Request assessment" CTA if the project is unrated.
13. **Founder Mode**: split `BusinessRoleSwitcher` to render `/mc?mode=founder` as a 6-widget Apple-style minimal view (BusinessHealth, Top Actions, Founder Inbox, Property Priority, Active Deals, AI Agent Status).

### Phase 6 — Permissions & Quality (2 hours)

14. Add a `requirePermission` HOC consuming `useResolvedContext().hasPermission(module)`; wire it on Finance, Approvals, Developer routes. Anyone without the right module gets a "Ask director for access" page.
15. Migrate hard-coded `isRu ? : ` strings on the 9 newer MC pages into `src/i18n/uiStrings`.
16. Address the linter ERROR on the Security Definer View; document the WARN-level findings as accepted.

---

## 7. Quick-Win List (≤ 1 hour each, ship today)

- A. Fix the two `useBusinessHealthScore` formulas. (Phase 2)
- B. Hide 5 unused modules from the sidebar (`getOwnerSidebarForRole` filter). (Phase 3 — "Hide")
- C. Auto-redirect `/mc/onboarding/wizard` → `/mc/onboarding` if `management_company_members` is empty. (Phase 1)
- D. Make `/mc/properties/:id` show the ClearView grade chip via existing `ClearViewBadge` component. (Phase 5)
- E. Strip the dead `stays_subscription_tiers` references from `stays-subscribe` to stop silent 500s. (Phase 1)

---

## 8. Score Trajectory After Plan

| Phase complete | Expected score |
|---|---|
| Now | 58 |
| + Quick wins (A–E) | 64 |
| + Phase 1–2 | 72 |
| + Phase 3–4 | 81 |
| + Phase 5–6 | **90 / 100** ("trustable operator-grade") |

---

## 9. Open Questions for You

Before I implement, please confirm:

1. **Subscription canonical table** — keep `mc_property_slots` (recommended) or migrate to `stays_subscription`?
2. **Hollow modules** — do we Hide them as recommended, or do you want them productised (which means I need real workflows from you)?
3. **STAYS → DEALS bridge** — should it auto-create deal leads, or just notify Pavel (Capital) for human triage?
4. **Folder migration** — am I cleared to physically move 84 files from `src/pages/owner/` to `src/pages/mc/` (with backward-compatible re-exports), or do you want to keep them split?

Once you approve I will start with **Quick Wins A–E** in a single commit, then Phase 1, etc.
