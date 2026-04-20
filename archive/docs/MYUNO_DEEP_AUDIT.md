> ARCHIVED: 2026-04-20
> Superseded by: docs/MYUNO_COMPLETE_SYSTEM_SNAPSHOT.md, ARCHITECTURE_AUDIT.md
> Reason: March 2025 audit (337 tables, 7 users, 0 tx) — factually stale after 1 year

# MyUNO — Deep Technical, Logical, Design & UX Audit

**Date:** March 2025  
**Scope:** Full codebase audit (Technical, Logical, Design, UX).  
**Context:** React + Supabase super-app for Phuket; 337 DB tables; pre-PMF (7 users, 0 transactions).

---

## STEP 0 — SYNC & BUILD STATUS

| Check | Status | Notes |
|-------|--------|-------|
| `git pull origin main` | ⚠️ Blocked | Local changes (package.json, AnimatedRoutes, types, etc.) would be overwritten. Commit or stash before pull. |
| `npm install` | ⚠️ Partial | Clean `rm -rf node_modules` failed on Windows (files in use). Existing node_modules used. |
| Supabase types | ⏭️ Skipped | `npx supabase gen types` requires project-id; existing `src/integrations/supabase/types.ts` used. |
| `.env` vs `.env.example` | ✅ | .env.example lists VITE_SUPABASE_*, VITE_GOOGLE_MAPS_API_KEY; backend secrets (Stripe, Resend, etc.) documented as backend-only. |
| `npm run build` | ✅ Passes | Fixed **PopoverAnchor** export in `src/components/ui/popover.tsx` (was missing; ProjectSelector import caused build failure). Build completes in ~3 min. Warnings: Tailwind ambiguous `ease-[cubic-bezier(...)]` classes; chunks >800KB (vendor-pdf, index). |

**Pre-audit gate:** Build exits 0 after PopoverAnchor fix. Supabase types and env vars assumed complete for audit.

---

# AUDIT 1 — TECHNICAL AUDIT

## 1.1 Architecture & Code Quality

### TECHNICAL — Hybrid structure and very large files

**Severity:** Medium  
**Division Impact:** All  
**File(s):** `src/` (structure); `src/integrations/supabase/types.ts` (28440 lines), `src/components/vendor/wizard/CanonicalListingWizard.tsx` (1452), `src/pages/owner/StaffPage.tsx` (1009), `src/pages/owner/OwnerPropertyImport.tsx` (1009), `src/pages/vendor/VendorYachts.tsx` (1002), others 500–950 lines.

**Problem:** Directory layout is hybrid (feature-based under components/pages; file-type under hooks/lib/integrations). Many single-file components/pages exceed 300 lines, making maintenance and testing harder.

**Evidence:** types.ts is generated and huge; CanonicalListingWizard.tsx and several owner/vendor pages are 600–1400+ lines.

**Fix:** Decompose pages >500 lines into subcomponents or feature folders. Keep types.ts as-generated; optionally split into domain-specific type modules re-exported from a single entry.

**Effort:** 2–4h per large file.

---

### TECHNICAL — TypeScript strictness disabled

**Severity:** High  
**Division Impact:** All  
**File(s):** `tsconfig.json`, `tsconfig.app.json`

**Problem:** `strict: false`, `noImplicitAny: false`, `strictNullChecks: false` allow unsafe types and hide bugs.

**Evidence:**
```json
// tsconfig.json
"noImplicitAny": false,
"strictNullChecks": false
// tsconfig.app.json
"strict": false,
"noImplicitAny": false
```

**Fix:** Enable `strict: true` (or at least `strictNullChecks: true`, `noImplicitAny: true`) in stages; fix resulting errors file-by-file.

**Effort:** 8–24h depending on codebase.

---

### TECHNICAL — Widespread `as any` usage

**Severity:** Medium  
**Division Impact:** All  
**File(s):** `src/hooks/useAdminContent.ts` (36), `src/hooks/useDayBriefing.ts` (16), `src/hooks/useProfileDetails.ts` (12), `src/components/owner/tasks/UnifiedTaskHub.tsx` (12), `src/pages/owner/OwnerPropertyDetail.tsx` (11–12), `src/pages/admin/AdminExperiences.tsx` (10), `src/hooks/useMaintenanceSchedules.ts` (9), `src/hooks/useCompanyCategorySettings.ts` (9), `src/pages/vendor/VendorRestaurants.tsx` (8–10), plus 100+ files with 1–7 each.

**Problem:** Bypasses type safety; can hide runtime errors and refactoring regressions.

**Evidence:** Grep `as any` across src shows heavy use in Supabase query results, form handlers, and legacy components.

**Fix:** Replace with proper types (Supabase generated types, explicit interfaces). Use type guards or generics instead of `as any`.

**Effort:** 1–2h per high-count file; 20–40h total for meaningful reduction.

---

## 1.2 Supabase & Database

### TECHNICAL — RLS enabled per-table; policies vary

**Severity:** Low–Medium  
**Division Impact:** All  
**File(s):** `supabase/migrations/*.sql` (e.g. `20260110013519_*.sql`)

**Problem:** RLS is enabled on audited tables (e.g. events, event_bookings) with policies for SELECT and provider-scoped ALL. No single manifest of “unprotected” tables; tables created without RLS in older migrations may be exposed.

**Evidence:** Migrations show `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` and `CREATE POLICY`; not all tables audited in this pass.

**Fix:** Run a one-time audit: list all public tables, check `pg_policies` for each; add RLS and policies for any table with sensitive data that lacks them.

**Effort:** 4–8h.

---

### TECHNICAL — Realtime subscriptions cleanup

**Severity:** Low  
**Division Impact:** All  
**File(s):** `src/hooks/useUserAnalytics.ts`, `src/hooks/useAdminAuditLogs.ts`, `src/components/tickets/TicketMessages.tsx`

**Problem:** Most realtime usages return a cleanup that calls `supabase.removeChannel(channel)`. useAdminAuditLogs returns `{ channel }` — caller must clean up. TicketMessages uses `channel.unsubscribe()` then `removeChannel`; useUserAnalytics has cleanup. Risk of leak if component unmounts before subscribe() resolves.

**Evidence:** Multiple `.channel(...).on(...).subscribe()` with `return () => supabase.removeChannel(channel)` in useEffect; useAdminAuditLogs returns channel for external cleanup.

**Fix:** Ensure every useEffect that subscribes returns a cleanup that calls `supabase.removeChannel(channel)`. If useAdminAuditLogs is used in a component, that component’s useEffect must call removeChannel on unmount.

**Effort:** 1–2h.

---

## 1.3 Authentication & Security

### TECHNICAL — Admin routes protected by RoleGuard only in UI

**Severity:** High  
**Division Impact:** MyUNO (admin), Capital/Estate if exposed via same app.

**File(s):** `src/components/layout/AnimatedRoutes.tsx` (lines 65–71, 397+), `src/components/auth/RoleGuard.tsx`

**Problem:** Admin routes are wrapped in `<AdminGuard>` (RoleGuard with roles admin/uno_team). Protection is client-side only; Edge Functions and Supabase must enforce auth/RLS. If an Edge Function or API is called without server-side role check, a user could hit it directly.

**Evidence:** Admin routes rendered under `<AdminGuard>`; no evidence of server-side “admin” check in every Edge Function.

**Fix:** Ensure every admin-only Edge Function validates JWT and checks role (e.g. admin or uno_team) before performing mutations. Document that RLS + service role or role claim is required for admin data.

**Effort:** 2–4h per Edge Function; audit all admin-invoked functions.

---

### TECHNICAL — API key in client for Edge Function calls

**Severity:** Medium  
**Division Impact:** All  
**File(s):** `src/hooks/useOwnerAIChat.ts`, `src/pages/mc/MCHelpPage.tsx`, `src/components/owner/documents/AILegalAssistant.tsx`, `src/hooks/useMCCContent.ts`, `src/components/chat/AIChatbot.tsx`

**Problem:** Edge Function requests use `Authorization: Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`. The anon key is public by design; ensure Edge Functions do not rely on this for privilege — they must validate the user’s JWT (session) for user-specific actions.

**Evidence:** Multiple files pass publishable (anon) key as Bearer token to Edge Functions.

**Fix:** Prefer passing the user’s session (e.g. supabase.auth.getSession()) and use that JWT in Authorization so Edge Functions can enforce user/scoped access. Do not use anon key as sole “auth” for privileged operations.

**Effort:** 2–4h.

---

## 1.4 Performance

### TECHNICAL — Large chunks and missing code-splitting

**Severity:** Medium  
**Division Impact:** All (initial load, mobile).

**File(s):** Build output: `index-CRK9U03s.js` ~1.98 MB, `vendor-pdf-C0TubpzE.js` ~1.36 MB, `vendor-charts-Dy9X4b6W.js` ~433 KB.

**Problem:** Rollup reports chunks >800 KB; vendor-pdf and main bundle are large. Slows first load and time-to-interactive.

**Evidence:** Build log: “Some chunks are larger than 800 kB after minification.”

**Fix:** Use dynamic import() for PDF generation, heavy charts, and admin/owner-only routes (already partially done via lazy). Add manualChunks in Vite to split vendor-pdf and vendor-charts from main bundle.

**Effort:** 4–8h.

---

### TECHNICAL — Heavy components without memoization

**Severity:** Low  
**Division Impact:** All  
**File(s):** Large list/table components (e.g. UnifiedCatalogTable, AdminProperties, vendor/owner tables).

**Problem:** Components that render large lists or expensive cells may re-render on every parent update if not memoized or virtualized.

**Evidence:** Some tables use @tanstack/react-virtual; not all list views do. No systematic React.memo on row components.

**Fix:** Add React.memo to list row components; use useMemo for derived list data; ensure virtualized lists are used for 100+ rows.

**Effort:** 2–4h per major table.

---

## 1.5 Error Handling

### TECHNICAL — Catch blocks that only log or show generic toast

**Severity:** Low  
**Division Impact:** All  
**File(s):** `src/pages/Auth.tsx` (catch refError with console.error), `src/components/owner/vendors/VendorReviewSheet.tsx` (catch e, toast.error(e.message)).

**Problem:** Not “silent” but user feedback can be generic; referral error in Auth only logs. No global handler for unhandled rejections in critical paths.

**Evidence:** Auth.tsx line 143: `catch (refError) { console.error(...); }`; VendorReviewSheet toast on any error.

**Fix:** In Auth, optionally show a non-blocking toast for referral apply failure. Consider a global unhandledrejection handler that logs and/or reports to monitoring.

**Effort:** 1h.

---

### TECHNICAL — Global error boundary present; widget-level optional

**Severity:** Low  
**Division Impact:** All  
**File(s):** `src/App.tsx` (ErrorBoundary wraps app), `src/components/ErrorBoundary.tsx`, `src/components/owner/dashboard/WidgetErrorBoundary.tsx`

**Problem:** App has a top-level ErrorBoundary; Owner dashboard uses WidgetErrorBoundary for widgets. Other dashboards (admin, vendor) may not isolate widget failures.

**Evidence:** App.tsx wraps tree in <ErrorBoundary>; OwnerDashboard wraps widgets in WidgetErrorBoundary.

**Fix:** Use WidgetErrorBoundary (or equivalent) for any dashboard that composes multiple async widgets so one failure does not break the whole page.

**Effort:** 2h.

---

## 1.6 Mobile (Capacitor)

### TECHNICAL — Touch targets and safe area

**Severity:** Low  
**Division Impact:** MyUNO (mobile app).  
**File(s):** `src/index.css` (pb-safe, pt-safe), various button/icon components.

**Problem:** No systematic audit of 44×44px minimum touch targets; safe-area insets are applied via utility classes. Some icon-only buttons may be smaller.

**Evidence:** index.css defines .pb-safe, .pt-safe; no project-wide min width/height for tappable elements.

**Fix:** Audit interactive elements (buttons, links, icon buttons) on key mobile screens; ensure min 44×44px and use safe-area padding on fixed bottom/top bars.

**Effort:** 2–4h.

---

# AUDIT 2 — LOGICAL AUDIT

## 2.1 Business Logic Integrity

### LOGICAL — Booking flow depends on vertical and payment wiring

**Severity:** High  
**Division Impact:** MyUNO  
**File(s):** Various booking pages (property, market, experiences, etc.), `src/hooks/useStripeUnifiedCheckout.ts`, order/booking creation flows.

**Problem:** End-to-end flow “discovery → selection → checkout → confirmation → notification” exists but is vertical-specific. Some verticals may have incomplete steps (e.g. notification, webhook handling). No single documented E2E map.

**Evidence:** Multiple entry points (PropertyInquiry, MarketCheckout, experience book, etc.); Stripe and Resend used in places; no single “booking flow” doc.

**Fix:** Document one canonical booking E2E (e.g. property or market); list every step and integration point; fix any missing notification or webhook; add integration tests for happy path.

**Effort:** 8–16h.

---

### LOGICAL — CRM pipeline and sequences live in MC, not Admin

**Severity:** Medium  
**Division Impact:** Capital  
**File(s):** `src/pages/admin/AdminCRM.tsx`, MC routes (e.g. `/mc/contacts`, `/mc/crm-dashboard`), `useCrmContacts`, `useAgentDeals`, `useCrmSequences`.

**Problem:** “Contact → pipeline stage → task → sequence” is implemented in the MC module. Admin “CRM” is acquisition (vendor prospects, MCC leads), not crm_contacts/agent_deals. Operational CRM for Capital is only in MC.

**Evidence:** Admin CRM uses vendor_prospects and lead tables; crm_contacts and agent_deals are used in MC hooks and pages.

**Fix:** No code bug; document clearly that “Capital CRM” = MC, “Admin CRM” = acquisition. If leadership needs a single view, add read-only KPIs or links from Admin to MC (with company context).

**Effort:** 2h doc; 4–8h if adding admin KPI widgets.

---

### LOGICAL — Finance commission/payouts hardcoded in ControlFinanceTab

**Severity:** High  
**Division Impact:** MyUNO  
**File(s):** `src/components/admin/control/ControlFinanceTab.tsx`

**Problem:** Commission and Payouts are shown as 10% and 90% of revenue, not from DB. Real commission may be in orders (platform_fee_amount, vendor_payout_amount) or commission rules; this tab ignores them.

**Evidence:**
```tsx
value: `$${Math.round((financeStats?.revenue || 0) * 0.1).toLocaleString()}`,  // Commission
value: `$${Math.round((financeStats?.revenue || 0) * 0.9).toLocaleString()}`,  // Payouts
```

**Fix:** Use useAdminFinance (or equivalent) which reads platform_fee_amount and vendor_payout_amount from orders; display those. If no such fields, keep derived values but label as “Estimated” and add a note.

**Effort:** 2–4h.

---

## 2.2 Data Consistency

### LOGICAL — platform_metrics empty makes dashboard GMV zero

**Severity:** High  
**Division Impact:** MyUNO  
**File(s):** `src/hooks/useAdminAnalytics.ts`, `src/components/admin/dashboard/AdminKPIGrid.tsx`, `src/components/admin/dashboard/AdminRevenueBlock.tsx`

**Problem:** Dashboard GMV and revenue come from useAdminAnalytics, which reads platform_metrics. If that table is not populated (no nightly job or trigger), summary is zeros even when orders exist.

**Evidence:** useAdminAnalytics aggregates platform_metrics only; no fallback to orders table.

**Fix:** In useAdminAnalytics, when platform_metrics is empty or totalGMV is 0, fall back to aggregating orders (e.g. sum total_amount for completed/confirmed) for the period and use that for totalGMV/totalRevenue in summary.

**Effort:** 2–4h.

---

### LOGICAL — Soft delete consistency

**Severity:** Low  
**Division Impact:** All  
**File(s):** Various tables (e.g. trash, deleted_at columns).

**Problem:** Soft delete is used in some places (e.g. admin trash); not every entity has a consistent deleted_at or “trashed” flow. Risk of hard deletes or inconsistent restore behavior.

**Evidence:** Admin has /admin/trash; not all tables may support soft delete uniformly.

**Fix:** Audit all user-facing delete actions; ensure they set deleted_at (or equivalent) and that list views filter by deleted_at IS NULL unless “trash” view. Document soft-delete policy.

**Effort:** 4–8h.

---

## 2.3 State Management

### LOGICAL — Global state split across Context and React Query

**Severity:** Low  
**Division Impact:** All  
**File(s):** AuthContext, LanguageContext, CartContext, useResolvedContext, useActiveCompany, React Query cache.

**Problem:** Auth, language, and “active context” (company/role) are in React Context; server state in React Query. No single store; risk of stale context when switching company/role without invalidating queries.

**Evidence:** useResolvedContext, useActiveCompany used for MC; RoleGuard and AdminGuard depend on user and roles from context.

**Fix:** When active company or role changes, invalidate React Query caches that are company-scoped (e.g. contacts, deals, properties). Document state ownership (Context = auth/ui, React Query = server state).

**Effort:** 2–4h.

---

# AUDIT 3 — DESIGN AUDIT

## 3.1 Design System Consistency

### DESIGN — Tailwind arbitrary values for animation

**Severity:** Low  
**Division Impact:** All  
**File(s):** Various components using `ease-[cubic-bezier(...)]`

**Problem:** Build warns that classes like `ease-[cubic-bezier(0,0,0.2,1)]` are ambiguous and match multiple utilities. Suggests escaping or using a single source of truth for easing.

**Evidence:** Vite build warnings listing several ease-[cubic-bezier(...)] classes.

**Fix:** Define named easing in tailwind.config (e.g. theme.extend.transitionTimingFunction) and use those names; or escape brackets as suggested by Tailwind.

**Effort:** 1–2h.

---

### DESIGN — Color and spacing from design tokens

**Severity:** Low  
**Division Impact:** All  
**File(s):** `src/index.css` (CSS variables), Tailwind config.

**Problem:** Design tokens exist (index.css :root with --primary, --muted, spacing). Some components may use arbitrary values (e.g. random padding or colors) instead of tokens.

**Evidence:** index.css defines a full set of surface, semantic, and status colors; Tailwind uses these via theme.

**Fix:** Audit high-traffic pages for hardcoded colors or spacing; replace with token-based classes. Optional: add ESLint rule to flag arbitrary color/spacing values.

**Effort:** 4–8h.

---

## 3.2 Component Library

### DESIGN — PopoverAnchor was missing (fixed)

**Severity:** Critical (build-breaking)  
**Division Impact:** All  
**File(s):** `src/components/ui/popover.tsx`, `src/components/property/ProjectSelector.tsx`

**Problem:** ProjectSelector imported PopoverAnchor from popover.tsx but it was not exported; build failed.

**Evidence:** Build error: "PopoverAnchor" is not exported by "src/components/ui/popover.tsx".

**Fix:** Added `const PopoverAnchor = PopoverPrimitive.Anchor` and exported it from popover.tsx. **Done.**

**Effort:** 0.5h (completed).

---

## 3.3 Responsive and Visual Hierarchy

### DESIGN — Data tables on mobile

**Severity:** Medium  
**Division Impact:** Admin, MC, Vendor  
**File(s):** UnifiedCatalogTable, AdminProperties, operations tabs, MC tables.

**Problem:** Wide tables may overflow on small viewports. Some tables use table-scroll-container; not all have a mobile-specific layout (cards or horizontal scroll with clear affordance).

**Evidence:** index.css has .table-scroll-container for overflow-x: auto; component-level behavior varies.

**Fix:** For key admin/MC tables, add responsive breakpoint: on mobile either card layout or sticky first column + horizontal scroll with visible shadow/affordance. Ensure touch scroll works.

**Effort:** 2–4h per major table.

---

# AUDIT 4 — UX AUDIT

## 4.1 Critical User Journeys

### UX — Journey A: New investor onboarding (MC)

**Severity:** Medium  
**Division Impact:** Capital  
**File(s):** MC contacts, pipelines, sequences, WhatsApp/email triggers.

**Problem:** Flow “Lead created → tagged Investor → sequence → first WhatsApp → stage update” is possible in MC but not documented step-by-step. Deduplication and rate limiting for WhatsApp depend on implementation.

**Evidence:** useCrmContacts, useAgentDeals, useCrmSequences exist; sequence enrollment and triggers are in MC.

**Fix:** Document the exact steps in MC; verify WhatsApp trigger and rate limiting; add a “first message sent” or stage transition audit for compliance.

**Effort:** 2–4h doc + 4h verification.

---

### UX — Journey B: Property booking

**Severity:** High  
**Division Impact:** MyUNO  
**File(s):** Property search/detail, inquiry/booking, checkout, confirmation, notifications.

**Problem:** Full path “discover → view → book → pay → confirm → notify” may have gaps (e.g. no email/SMS on confirmation, or webhook not updating order status). Friction or dead ends possible on error (payment failure, network error).

**Evidence:** Multiple entry points; Stripe and Resend used; no single E2E test or journey map.

**Fix:** Run a manual E2E for one property booking; document every screen and API call; fix any missing notification or error recovery; add Cypress/Playwright test for happy path.

**Effort:** 8–16h.

---

### UX — Journey C: Estate operator daily workflow (MC)

**Severity:** Low  
**Division Impact:** Estate  
**File(s):** MC operations, tasks, property status, tenant communication.

**Problem:** “Login → daily tasks → update property → log communication → complete task” is supported in MC. Usability on mobile (kanban, task list) not fully audited.

**Evidence:** property_operational_tasks, MC operations and calendar; MC layout and navigation.

**Fix:** Verify task list and property updates are usable on 375px width; add breadcrumb or “back” consistency if needed.

**Effort:** 2–4h.

---

### UX — Journey D: Admin reporting

**Severity:** Medium  
**Division Impact:** MyUNO, Capital, Estate  
**File(s):** Admin dashboard, Finance tab, MC dashboard, export/reports.

**Problem:** “Pavel sees all 3 division KPIs → drills into Capital pipeline → exports report” is partially possible: Admin dashboard shows platform KPIs; Capital pipeline is in MC. No single “division selector” or export of pipeline from Admin. Investor metrics page exists but may not align with “division” view.

**Evidence:** Admin has Dashboard and Finance; MC has pipeline and contacts; no unified division switcher in Admin.

**Fix:** Add an optional “Division overview” in Admin (read-only KPIs per division with link to MC) or document “Admin = platform, MC = Capital/Estate ops”. Add pipeline export (CSV/Excel) in MC if missing.

**Effort:** 4–8h for division overview; 2–4h for export.

---

## 4.2 Navigation & Forms

### UX — Navigation depth and orphan pages

**Severity:** Low  
**Division Impact:** All  
**File(s):** `src/components/layout/AnimatedRoutes.tsx`, sidebars (Admin, MC, Vendor).

**Problem:** Admin has many routes (70+); depth is mostly 2–3 levels. Some routes may be reachable only by direct URL (e.g. redirects to /admin/control). Breadcrumbs not present everywhere.

**Evidence:** Long list of admin routes; AdminLayout sidebar groups sections; not every inner page has breadcrumb.

**Fix:** Add breadcrumbs to Admin and MC layout for depth ≥ 2; ensure all admin routes are linked from sidebar or a “More” section. Audit redirect-only routes for discoverability.

**Effort:** 4–6h.

---

### UX — Forms validation and destructive actions

**Severity:** Medium  
**Division Impact:** All  
**File(s):** Various forms (auth, profile, property, deal, settings).

**Problem:** Inline validation and “required” marking may be inconsistent. Destructive actions (delete, cancel booking) should have confirmation dialog; not every such action is audited.

**Evidence:** Some forms use react-hook-form and resolvers; confirmation dialogs exist in places (e.g. AlertDialog); no project-wide checklist.

**Fix:** Audit all delete/cancel/irreversible actions; add confirmation dialog where missing. Ensure required fields have aria-required and visible indicator; add inline validation on blur for critical forms.

**Effort:** 4–8h.

---

## 4.3 Feedback & Onboarding

### UX — Action feedback and toasts

**Severity:** Low  
**Division Impact:** All  
**File(s):** sonner/toast usage, loading states in mutations.

**Problem:** Many actions use toast for success/error. Ensure every mutation shows loading state and then success or error within ~300 ms (or explicit “processing” message). Some edge cases may have no feedback.

**Evidence:** Widespread use of toast; React Query mutations use isPending; not every manual async call may show loading.

**Fix:** Audit critical flows (booking, payment, contact save, deal stage change); ensure button shows loading and toast or inline message on result. Add a simple “Processing…” state for long-running actions.

**Effort:** 2–4h.

---

### UX — First-time and empty states

**Severity:** Low  
**Division Impact:** All  
**File(s):** Dashboards (admin, owner, vendor), list pages.

**Problem:** New users may see empty dashboards or lists. Empty states and onboarding (e.g. checklist, guided tour) improve activation; not all views have a designed empty state.

**Evidence:** Some pages have “No data yet” or CTA; onboarding modal exists on Index; coverage varies.

**Fix:** Add empty-state component and copy for key lists (contacts, deals, properties, bookings); link to “Create first X” or help. Optional: extend onboarding checklist to first value action (e.g. “Add first property”).

**Effort:** 4–8h.

---

# SUMMARY SCORECARD

| Audit Area   | Score (1–10) | Critical | High | Medium | Low | Quick Wins |
|-------------|--------------|----------|------|--------|-----|------------|
| Technical   | 6            | 1        | 3    | 5      | 5   | PopoverAnchor (done), strict TS in stages, RLS audit |
| Logical     | 6            | 0        | 3    | 2      | 2   | Finance tab use orders; platform_metrics fallback |
| Design      | 7            | 0        | 0    | 2      | 2   | Easing tokens; table responsive |
| UX          | 6            | 0        | 1    | 4      | 3   | Breadcrumbs; confirm destructive; empty states |

---

# TOP 10 PRIORITY FIXES

Ranked by (Severity × Impact) ÷ Effort (approximate).

1. **Finance tab: use real commission/payout from orders**  
   **File(s):** `src/components/admin/control/ControlFinanceTab.tsx`  
   **Problem:** Commission and Payouts hardcoded as 10%/90%.  
   **Fix:** Use useAdminFinance (or same orders query) and display platform_fee_amount and vendor_payout_amount; label as “Platform” / “Vendor” and keep totals consistent.  
   **Effort:** 2–4h.

2. **Dashboard GMV/revenue fallback when platform_metrics empty**  
   **File(s):** `src/hooks/useAdminAnalytics.ts`  
   **Problem:** totalGMV and totalRevenue are 0 when platform_metrics is not populated.  
   **Fix:** If metrics array is empty or sum is 0, run a fallback query on orders (completed/confirmed) for the same period and aggregate total_amount and platform_fee_amount; merge into summary.  
   **Effort:** 2–4h.

3. **Admin/Edge Function auth enforcement**  
   **File(s):** All Edge Functions called for admin actions.  
   **Problem:** Admin protection is UI-only; server must enforce role.  
   **Fix:** In each admin Edge Function, verify JWT and require admin or uno_team role; return 403 otherwise. Document list of admin functions.  
   **Effort:** 2–4h per function.

4. **TypeScript strictness (incremental)**  
   **File(s):** `tsconfig.app.json`, then high-value modules.  
   **Problem:** strict and noImplicitAny disabled; hidden bugs.  
   **Fix:** Enable strictNullChecks and noImplicitAny in a new tsconfig profile or for a subset of directories; fix errors; expand.  
   **Effort:** 8–16h.

5. **Booking E2E documentation and one happy-path test**  
   **File(s):** Docs + one vertical (e.g. property or market).  
   **Problem:** No single E2E map; gaps in notification or webhook.  
   **Fix:** Document flow; add Playwright/Cypress test for “search → select → checkout → pay → confirm”; fix any missing step.  
   **Effort:** 8–12h.

6. **Reduce `as any` in high-traffic hooks**  
   **File(s):** useAdminContent, useDayBriefing, useProfileDetails, useAgentDeals.  
   **Problem:** Type safety bypass in critical data paths.  
   **Fix:** Use Supabase generated types or explicit interfaces; type query results and form payloads.  
   **Effort:** 4–8h.

7. **Code-splitting for vendor-pdf and large chunks**  
   **File(s):** vite.config, pages that import pdf/charts.  
   **Problem:** Chunks >800 KB hurt load time.  
   **Fix:** Dynamic import for PDF and chart-heavy routes; manualChunks for vendor-pdf and vendor-charts.  
   **Effort:** 4–6h.

8. **Division clarity and optional admin KPI**  
   **File(s):** Docs, optionally Admin dashboard or a “Division overview” page.  
   **Problem:** “Capital CRM” vs “Admin CRM” confusion; no single division view.  
   **Fix:** Document; optionally add read-only “Capital / Estate” KPI cards with link to MC.  
   **Effort:** 2h doc; 4–6h feature.

9. **Destructive action confirmations**  
   **File(s):** All delete/cancel/irreversible actions.  
   **Problem:** Some actions may not show confirmation.  
   **Fix:** Audit; add AlertDialog/confirm for delete contact, delete deal, cancel booking, etc.  
   **Effort:** 4h.

10. **Realtime subscription cleanup audit**  
    **File(s):** useAdminAuditLogs and any hook that returns channel.  
    **Problem:** Caller must clean up channel to avoid leaks.  
    **Fix:** Ensure every realtime useEffect returns cleanup that calls removeChannel; verify useAdminAuditLogs consumer.  
    **Effort:** 1–2h.

---

# 30-DAY REMEDIATION ROADMAP

| Week | Focus | Owner | Tasks |
|------|--------|--------|--------|
| 1 | Build & data correctness | Dev | PopoverAnchor (done). Finance tab: use orders for commission/payout. useAdminAnalytics: add orders fallback for GMV/revenue. Realtime cleanup audit. |
| 2 | Security & types | Dev | Edge Function auth audit and enforce admin role. Start TypeScript strict (one module or strictNullChecks only). |
| 3 | Performance & UX | Dev | Code-split vendor-pdf and vendor-charts. Add breadcrumbs to Admin/MC. Confirm destructive actions have confirmation dialogs. |
| 4 | Docs & E2E | Pavel (vision) + Dev | Document “Admin vs MC” and division ownership. Document booking E2E; add one Playwright happy-path test. Optional: Division overview in Admin. |

**Pavel (vision only):** Division strategy (what appears where); approval of “Admin = platform, MC = Capital/Estate”; prioritization of investor/tenant flows.  
**Dev team:** All implementation, tests, and migration fixes.  
**Automated/scripted:** RLS audit script (list tables, list policies); optional ESLint rule for `as any` in new code.

---

---

# REMEDIATION STATUS (implemented)

| # | Fix | Status | Notes |
|---|-----|--------|--------|
| 1 | Finance tab: real commission/payout from orders | ✅ Done | ControlFinanceTab uses useAdminFinance(30); shows GMV, platform revenue, vendor payouts, order count. |
| 2 | Dashboard GMV/revenue fallback when platform_metrics empty | ✅ Done | useAdminAnalytics: orders fallback query when metrics empty or zero; summary uses it for totalGMV/totalRevenue. |
| 3 | Admin Edge Function auth | 📄 Doc | See docs/ADMIN_VS_MC_AND_EDGE_AUTH.md; admin-manage-user is reference; checklist for other admin functions. |
| 10 | Realtime subscription cleanup | ✅ Done | useAdminAuditLogsRealtime refactored to useEffect with removeChannel in cleanup; no longer useQuery. |
| 9 | Destructive action confirmations | ✅ Done | AdminLookups: native confirm() replaced with AlertDialog. AdminLifeSituations: AlertDialog before delete mapping. |
| — | Breadcrumbs | ✅ Already present | AdminHeader and MCHeader already render breadcrumbs for depth ≥ 2. |
| — | Admin vs MC clarity | ✅ Doc | docs/ADMIN_VS_MC_AND_EDGE_AUTH.md: division of responsibilities and Edge Function auth checklist. |

*MyUNO Deep Audit v1.0 | Ignatev Group | Confidential*