# Admin vs MC & Edge Function Auth

**Purpose:** Clarify division of responsibilities and secure admin-only Edge Functions.

---

## 1. Admin vs MC — Division of Responsibilities

| Area | Admin Panel (`/admin/*`) | MC Module (`/mc/*`) |
|------|--------------------------|----------------------|
| **Platform (MyUNO)** | ✅ Users, roles, catalog, operations (orders, tickets, moderation), finance (GMV, revenue), verticals, settings, AI agents, intake, vendor prospects, marketing (MCC). | — |
| **Capital CRM** | ❌ No view of `crm_contacts` or `agent_deals`. | ✅ Contacts, pipeline, deals, sequences, tasks. Use MC with the Capital company. |
| **Estate** | ✅ Property list/approve/reject; redirect "Add property" to MC. | ✅ Full property management, calendar, operations, staff, owners, reports, bookings. |
| **Acquisition / “CRM” in Admin** | ✅ Vendor prospects, MCC leads, owner prospects, activity. Not the same as Capital contacts. | — |

**Summary:**
- **Admin** = platform operations, content moderation, finance, and acquisition (vendors/leads). Protects routes with `AdminGuard` (roles: admin, uno_team).
- **MC** = company-scoped operations: Capital (contacts, deals, sequences) and Estate (properties, tasks, bookings, owners). Protects routes with `MCGuard` and company membership.

To manage **Ignatev Capital** CRM (contacts, pipeline, sequences), use **MC** with the Capital company. To manage **Ignatev Estate**, use **MC** with the Estate company. Admin does not show a unified “division overview”; optional read-only KPIs can be added later.

---

## 2. Edge Function Auth Checklist

Admin protection in the app is **client-side** (`RoleGuard` / `AdminGuard`). Every Edge Function that performs **admin-only** actions must enforce auth and role **on the server**.

### 2.1 Standard pattern (already used)

1. **Require auth:** Use `requireAuth(req, corsHeaders)` from `_shared/auth-guard.ts`. Return 401 if missing/invalid token.
2. **Require admin (or uno_team):** Use service-role client and RPC `has_role(_user_id, _role)` (e.g. `admin`, `uno_team`). Return 403 if the user does not have the role.
3. **CORS:** Send `corsHeaders` on all responses (including errors).

**Reference implementation:** `supabase/functions/admin-manage-user/index.ts`
- Calls `requireAuth(req, corsHeaders)`.
- Uses `createServiceClient()` and `admin.rpc("has_role", { _user_id: callerId, _role: "admin" })`.
- Returns 403 with message "Admin role required" if `!isAdmin`.

### 2.2 Admin-only Edge Functions (must enforce role)

These are invoked from the Admin UI or perform sensitive platform actions. Each **must** use the pattern above (or equivalent: requireAuth + check admin/uno_team via DB or JWT claims).

| Function | Purpose | Auth pattern to use |
|----------|---------|----------------------|
| `admin-manage-user` | Suspend, deactivate, roles | ✅ requireAuth + has_role admin |
| `admin-manage-mc-subscription` | MC subscription management | requireAuth + has_role admin/uno_team |
| `export-mc-data` | Bulk export (MC data) | requireAuth + company membership (director/admin/manager) — not platform admin |
| `bulk-import` | Bulk data import | requireAuth + has_role admin if called from Admin |
| `scan-business-card` | Business card scan (Admin intake) | requireAuth + has_role admin/uno_team if admin-only |
| `property-moderation-email` | Notify on property submission | Can be trigger/cron; if called from Admin UI, requireAuth + admin |
| `notify-admin-order` | Notify admin of new order | Usually trigger/cron; no user JWT |
| `notify-admin-property-submission` | Notify on property submit | Usually trigger; no user JWT |
| `generate-sitemap` | Sitemap generation | If triggered from Admin, requireAuth + admin |
| `user-analytics-api` | Analytics API | requireAuth + has_role admin if admin-only |

**Action:** For any Edge Function that is **called from the Admin panel** (e.g. from Control Center, Settings, Data Import, AI Ops), ensure the handler:
1. Uses `requireAuth(req, corsHeaders)` and returns 401 on failure.
2. Checks admin (or uno_team) via `has_role` or equivalent and returns 403 if the user is not allowed.
3. Does not rely on the client hiding the button or route.

### 2.3 Optional: shared `requireAdmin` helper

To avoid duplicating the same check in every admin function, add to `_shared/auth-guard.ts` (or a new `_shared/admin-guard.ts`):

```ts
// requireAdmin: requireAuth + has_role('admin') or has_role('uno_team')
// Returns 403 if user is not admin/uno_team. Uses createServiceClient and has_role RPC.
```

Then in each admin-only function, call `requireAdmin(req, corsHeaders)` instead of `requireAuth` + manual `has_role`.

### 2.4 CORS

All Edge Functions that accept browser requests should return the same `corsHeaders` on OPTIONS and on every response (including 401/403/500). Example in `admin-manage-user`: `corsHeaders` with `Access-Control-Allow-Origin` and `Access-Control-Allow-Headers`.

---

## 3. Quick reference

- **Admin UI:** `AdminGuard` (client) → roles admin, uno_team.
- **Admin Edge Functions:** `requireAuth` + `has_role('admin')` (or uno_team) on the server; return 403 if not allowed.
- **MC UI:** `MCGuard` + company context.
- **MC Edge Functions:** `requireAuth` + company membership / role (e.g. director, admin, manager) for that company; not platform admin.

*Doc version 1.0 | Remediation plan*
