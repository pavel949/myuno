# Dashboards Audit — Code-Level Findings & Implementation Plan

Scope: 12 dashboards in production routes (`/owner`, `/mc/*`, `/admin`, `/admin/mc-dashboard`, `/vendor`, `/staff`, `/team`, `/my-property`, `/my-property/transparency/:id`, `/invest/dashboard`, `/capital`, `/owner/crm-dashboard`, `/owner/analytics → OwnerRevenueDashboard`).

Method: read-only review of pages, widgets, hooks, route registry (`AnimatedRoutes.tsx`), and Supabase queries in their hooks.

---

## 1 · Inventory & Score Card (0–100, code evidence only)

| Dashboard | LOC | Data sources | Verdict | Score |
|---|---|---|---|---|
| `OwnerDashboard` (MC home) | 569 | 30+ widgets, lazy chunks, `useDashboardMetrics` (14 parallel queries) + per-widget extra queries | **Over-engineered** but well-structured; correct lazy-loading; too many widgets per role | 72 |
| `AdminDashboard` | 49 | `AdminKPIGrid` + `AdminOperationalAlerts` + `AdminActivityBlock` | **Too basic** — no revenue block, no AI/ops health, no verticals grid (component exists but unused) | 55 |
| `AdminMCDashboard` | 461 | 1 query joining `management_companies` + `management_company_members` + `mc_property_slots`; client-side aggregation | Solid, but **no realtime / no growth trend / no MRR**; aggregation in JS not SQL view | 70 |
| `VendorDashboard` | 385 | `useVendorOrders`, `useVendorProfile`, ad-hoc notifications query, period selector | Strong layout. **Bug-risk**: `chartData` builds `subDays` from `new Date()` ignoring the `periodStart` param when `period ≠ 7d` | 75 |
| `StaffDashboard` (`pages/staff`) | 294 | `useStaffServiceOrders`, `useStaffProfile` | Clean & focused. **TODO at L77**: complete-order modal not implemented (no notes/photos) | 78 |
| `StaffDashboard` (`components/admin/StaffDashboard`) | n/a | duplicate name used inside `AdminDashboard` | **Naming collision** — two distinct `StaffDashboard` components | 50 |
| `TeamDashboard` | 243 | `useTeamMember`, `useMyGamification`, `useTeamLeads`, `useAdminDashboardStats` | Decent; **uses admin stats hook** for non-admin team — leaks platform-wide counts to every team role | 65 |
| `OwnerPortalDashboard` (`/my-property`) | 166 | `useMyPortalSettings` only | **Too basic** — no KPI tiles, no recent reports/signatures count even though buttons link there | 60 |
| `OwnerTransparencyDashboard` (`/my-property/transparency/:id`) | 136 | 6 tabs, each its own component | Good shell but **duplicates** `OwnerPortalDashboard`'s purpose; two parallel "owner read-only" UIs | 65 |
| `InvestorDashboard` | 69 | 4 sub-cards, `WelcomeCard` is a 25-line stub with **no stats** | **Too basic & misleading** — "Welcome Card with Stats" comment but card has zero stats | 45 |
| `CapitalDashboard` | 135 | `useCapitalDashboardStats` (5 parallel queries) | Tight & honest; missing drill-down into pipeline stage clicks | 78 |
| `CrmDashboardPage` (`/owner/crm-dashboard`) | 337 | `useAgentDeals`, pipelines, `useCrmContacts`, `useTodayTasksCount`, gamification widgets | Functional but **overlaps** with `OwnerDashboard` CRM section | 70 |
| `OwnerRevenueDashboard` (`/owner/analytics` Overview tab) | 393 | `useRevenueAnalytics(6)` | Strong, ADR/RevPAR/forecast; **scope mismatch** with KPI in `OwnerDashboard.BusinessKPIWidget` (different formula) | 72 |

Average: **65 / 100**.

---

## 2 · Broken / Mismatched Flows (with file:line)

**B1. Vendor revenue chart period bug**
`src/pages/vendor/VendorDashboard.tsx` L95-113: `chartData` always iterates `subDays(new Date(), i)` for `days = period length`, so 30d/90d periods still anchor to *today* instead of `periodStart`. Result: chart x-axis correct in length but wrong window if `periodEnd ≠ today`. Period selector exists but partially honored.

**B2. Two `StaffDashboard` components**
- `src/pages/staff/StaffDashboard.tsx` (294 LOC, real staff worker view).
- `src/components/admin/StaffDashboard` imported in `src/pages/admin/AdminDashboard.tsx` L10 + L23 (admin-staff fallback).
Same export name, different purpose. Confusing for ownership and routing future fixes.

**B3. Investor "Welcome Card with Stats" has no stats**
`src/pages/invest/InvestorDashboard.tsx` L54 comments "Welcome Card with Stats" but `InvestorWelcomeCard.tsx` is a static greeting with one icon. The comment lies about behavior; user gets a hollow page.

**B4. Staff "Complete Order" never collects notes/photos**
`src/pages/staff/StaffDashboard.tsx` L75-78 contains `// TODO: Open modal for completion notes and photos` but ships completing the order with no payload. Downstream proof-of-work absent.

**B5. Team dashboard leaks platform-wide stats to non-admin team**
`src/pages/team/TeamDashboard.tsx` L50 calls `useAdminDashboardStats()` (hook returns `totalUsers`, `providers`, `pendingContent`, etc.). RLS may pass for read but **UX intent unclear**: a content_manager doesn't need platform pending counts. Same source-of-truth as `AdminDashboard`.

**B6. AdminDashboard does not render `AdminAllVerticalsGrid` / `AdminRevenueBlock`**
Both components exist (`src/components/admin/dashboard/AdminAllVerticalsGrid.tsx`, `AdminRevenueBlock.tsx`) and `AdminQuickActionsGrid.tsx` exists too. None imported in `AdminDashboard.tsx` (only `AdminKPIGrid`, `AdminOperationalAlerts`, `AdminActivityBlock` used). **Dead/orphan widgets**.

**B7. OwnerDashboard duplicates CRM data with `/owner/crm-dashboard`**
`OwnerDashboard` includes `ActiveDealsWidget`, `CrmTasksWidget`, `SellSignalWidget`, `FounderInboxWidget` – exactly the same hooks (`useAgentDeals`, `useMyCompanyId`, `useFounderInbox`) `CrmDashboardPage` uses. No state-sharing; both fetch independently. Cache key collision possible only if filters differ — confirmed not collided, but **2× network cost** when user opens both within stale window.

**B8. KPI formula divergence**
- `OwnerDashboard → BusinessKPIWidget` reads `useDashboardMetrics` (`property_financials` filtered by `transaction_type='income'`).
- `OwnerRevenueDashboard` reads `useRevenueAnalytics(6)` which uses **bookings + financials hybrid** (different denominator).
Two "Revenue" numbers can disagree on the same day/property. No reconciliation note in UI.

**B9. AdminMCDashboard aggregates in JS, not SQL**
`AdminMCDashboard.tsx` L78-106: pulls *all* `management_company_members` and `mc_property_slots` rows then loops them in JS. Will not scale past a few hundred MCs. No pagination / no SQL view (`v_mc_overview`).

**B10. OwnerPortalDashboard skips counts that buttons promise**
L73-99 buttons say "Statements – For approval" and "Documents – To sign" but **no counts/badges**. The data is queryable (`owner_statements` exists per other widgets), so the empty button is a dead promise.

**B11. OwnerTransparencyDashboard ↔ OwnerPortalDashboard semantic overlap**
Both target "owner sees what MC is doing" but live at `/my-property` (list) and `/my-property/transparency/:propertyId` (detail). The `transparency/` route exists but is not linked from `OwnerPortalDashboard` cards (cards go to `/my-property/${id}` instead). Routing gap → users can't reach the richer transparency tabs from the list.

**B12. SellSignalWidget links to `/mc/contacts`, parent dashboard mostly lives at `/owner`**
`SellSignalWidget.tsx` L88 `navigate('/mc/contacts?source=stays')`. Other widgets in same dashboard use `/owner/...` and `APP_ROUTES.MC_*`. Users hop between `/owner` and `/mc` URL prefixes mid-flow — a known mid-migration symptom, not yet finished.

**B13. AIAgentStatusWidget routes to `/admin/ai-ops`**
`AIAgentStatusWidget.tsx` L59: shown on the **MC owner** dashboard but the "Open" button goes to `/admin/ai-ops`. Non-admin MC director will hit AdminGuard and bounce. Either hide for non-admin or change route.

**B14. `useDashboardMetrics` runs 14 queries on every dashboard mount**
`src/hooks/useDashboardMetrics.ts` L75-140: 14 parallel Supabase queries per dashboard load, plus a pre-fetch of booking IDs. Cached via TanStack but invalidated on filter change — heavy for small MCs with one property.

**B15. `useAdminDashboardStats` issues 17+ count queries serially-batched**
`src/hooks/useAdminDashboardStats.ts` L78-107: 14 + 3 = 17 queries every refetch. No SQL view (`v_admin_overview`). Used by `AdminDashboard` *and* `TeamDashboard` (compounding load).

---

## 3 · UX / UI Issues

- **Hollow widgets**: `InvestorWelcomeCard` (no stats), `OwnerPortalDashboard` (no badges), `SellSignalWidget` empty state has no CTA to the trigger (vendor signup, sample data).
- **Density mismatch**: `OwnerDashboard` (12+ visible widgets) vs `AdminDashboard` (3 widgets) — no consistent dashboard composition spec across roles.
- **Loading incoherence**: every widget renders its own skeleton shape; no shared `DashboardCardSkeleton`. Dashboard "pops" as widgets resolve out-of-order.
- **No empty states with CTA** for: `Approvals`, `OwnerPayouts`, `Procurement` (already noted as deferred in prior loop).
- **Mobile**: `OwnerDashboard` has `CollapsibleWidget` for some keys but `OverviewSection` is always-on; mobile users still scroll past 6+ heavy sections before "Today" appears.
- **i18n mix**: `CapitalDashboard` is RU-only labels (`'Дашборд'`, `'Контактов'`) regardless of language; no `isRu` switch.
- **No global filter on Admin/Team/Vendor** dashboards (Owner has `DashboardFilterContext` but it stops at MC scope).

---

## 4 · Data-flow & Connectivity Map (verified against code)

```text
AdminDashboard ──▶ useAdminDashboardStats ──▶ 17 count() queries (listings, providers, properties, profiles,
                │                                user_roles, bookings, salons, gyms, events, pharmacies,
                │                                marketplace_products, insurance_plans, water_activities,
                │                                flower_shops, support_tickets)
                ├─▶ useAdminAnalytics(30) ──▶ growth %
                └─▶ useAdminAuditLogs(5)  ──▶ activity feed

OwnerDashboard ─▶ useDashboardMetrics ──▶ 14 parallel queries on
                │       property_financials, property_bookings, crm_tasks,
                │       agent_deals, staff_members, property_service_requests,
                │       property_inventory_items, booking_notifications_log
                ├─▶ useMyProperties, useActiveCompany, useMcOnboarding
                ├─▶ AIAgentStatusWidget ──▶ ai_agents + ai_agent_logs (24h)
                ├─▶ SellSignalWidget    ──▶ agent_deals (tags=stays_signal)
                ├─▶ FounderInboxWidget  ──▶ useFounderInbox
                └─▶ ChannelSync, Maintenance, RevenueInsights, etc.

CrmDashboardPage ─▶ useAgentDeals, useDynamicPipelineStages, useCrmContacts,
                    useTodayTasksCount  (overlaps OwnerDashboard CRM widgets)

OwnerRevenueDashboard ─▶ useRevenueAnalytics(6) (different formula vs BusinessKPIWidget)

VendorDashboard ─▶ useVendorOrders, useVendorProfile, useUserContext,
                  notifications (ad-hoc)

StaffDashboard (worker) ─▶ useStaffServiceOrders, useStaffProfile

TeamDashboard ─▶ useTeamMember, useMyGamification, useTeamLeads,
                 useAdminDashboardStats  ◀── leaks admin counts

AdminMCDashboard ─▶ management_companies + members + slots (JS aggregation)

CapitalDashboard ─▶ useCapitalDashboardStats (5 queries)

InvestorDashboard ─▶ 4 sub-cards, no consolidated stats hook

OwnerPortalDashboard ─▶ useMyPortalSettings (1 query)
OwnerTransparencyDashboard ─▶ usePropertyUserRole + 6 tab components
```

**Tables touched by ≥3 dashboards**: `agent_deals`, `crm_tasks`, `property_financials`, `property_bookings`, `providers`, `listings`. Good candidates for SQL views.

---

## 5 · Implementation Plan (phased, code-only fixes)

### Phase 1 — Stop the bleeding (quick, zero-risk)
1. **Fix Vendor chart period bug** (`VendorDashboard.tsx` L95-113): iterate from `periodStart` to `periodEnd` instead of `subDays(new Date(), i)`.
2. **Hide AI Agents widget for non-admin MC users** OR change `AIAgentStatusWidget.tsx` L59 route to a non-admin destination (`/mc/insights/ai`).
3. **Rename `components/admin/StaffDashboard`** → `AdminStaffOverview` to remove naming collision with `pages/staff/StaffDashboard`.
4. **Translate `CapitalDashboard`** labels via `isRu` + `useLanguage`.
5. **Add `aria-label` and consistent skeleton shape** via shared `DashboardCardSkeleton`.

### Phase 2 — Wire the orphan widgets / kill duplicates
6. **AdminDashboard**: import `AdminAllVerticalsGrid`, `AdminRevenueBlock`, `AdminQuickActionsGrid` (already built) — turn 49-line page into the intended ops console.
7. **OwnerPortalDashboard**: add count badges on Statements/Documents cards using existing tables (`owner_statements`, `signatures_pending`).
8. **OwnerPortalDashboard → OwnerTransparencyDashboard link**: card click should go to `/my-property/transparency/:propertyId` (richer view), keep `/my-property/:id` only for legacy.
9. **InvestorDashboard**: replace `InvestorWelcomeCard` with a real stats card (active interests, viewings booked, recommendations count). Hook already exists via `InvestorInterestsList`'s data — extract to `useInvestorStats`.
10. **Decide `OwnerDashboard` vs `CrmDashboardPage`**: keep CrmDashboardPage as the deep CRM workspace; remove redundant `ActiveDealsWidget` + `CrmTasksWidget` from `OwnerDashboard` for the `sales_agent` role — link out instead.

### Phase 3 — Data-flow consolidation
11. **Create SQL views** (single migration):
    - `v_admin_overview` — replaces 17 queries of `useAdminDashboardStats`.
    - `v_mc_overview` — replaces JS aggregation in `AdminMCDashboard`.
    - `v_owner_dashboard_metrics` — replaces 14-query batch in `useDashboardMetrics`.
12. **Single source of truth for "Revenue"**: `OwnerRevenueDashboard` and `BusinessKPIWidget` read from same view. Add inline caption "Revenue = confirmed booking total + manual income, last 30 days".
13. **Stop `TeamDashboard` from calling `useAdminDashboardStats`**: build `useTeamPlatformStats` returning only counts a content_manager / sales / support role is supposed to see (or hide block for non-team-lead).

### Phase 4 — UX polish
14. **Density profile per role**: cap widgets per role (e.g. `sales_agent` → 5, `service_provider` → 4). Update `BUSINESS_ROLES` widget arrays in `src/lib/businessRoles.ts`.
15. **Standard empty states**: shared `EmptyDashboardCard` with title, hint, primary CTA. Apply to all hollow widgets.
16. **Staff "Complete order" modal** (B4): build `CompleteOrderSheet` with photos[] + notes + signature; persist to `service_order_completions`.
17. **Mobile-first reorder**: on mobile, render `Today` first regardless of role (already partially done by `OVERVIEW_SUPPRESSED_WIDGETS` — extend logic).
18. **Unify URL prefix**: convert `/owner/*` dashboard internal links to `/mc/*` (matches earlier MC consolidation memory) — touch `SellSignalWidget`, `FounderInboxWidget`, `OwnerDashboard` greeting CTAs.

### Phase 5 — Realtime / freshness
19. Add Supabase Realtime channels on `agent_deals`, `crm_tasks`, `property_bookings` so KPI cards re-fetch without full reload.
20. Add `last_updated` timestamp footer on every dashboard card (audit-ready, also debugging aid).

---

## 6 · Risk & Rollout
- All Phase 1 fixes are isolated, no schema impact — ship in one PR.
- Phase 3 SQL views require migration + read-tests (`security_definer view` linter must pass).
- Phase 2 #10 is a UX policy change — expose toggle via `feature_flag:dashboard_v2` in `system_settings` for safe rollback.

## 7 · What this audit did NOT do (out of scope, per user instruction "don't invent anything")
- No browser run / network capture.
- No assertions about RLS correctness beyond reading hooks.
- No claims about whether tables exist — every cited table appears in at least one currently-shipping hook in this codebase.

Approval requested to execute Phase 1 (5 fixes) + Phase 2 (5 fixes) in the next pass; Phases 3–5 staged after.