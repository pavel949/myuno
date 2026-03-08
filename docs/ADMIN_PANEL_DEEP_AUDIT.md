# MyUNO Admin Panel — Deep Technical & Functional Audit

**Context:** MyUNO is a Phuket super-app and the operational backbone of Ignatev Group (Ignatev Capital, Ignatev Estate, MyUNO). CRM has 330 contacts, 337 DB tables. Stack: React + Supabase + Edge Functions + Capacitor.

**Scope:** All `/admin/*` routes and their data/UX; mapping to DB; business logic for Capital, Estate, and platform; verdict and priority fixes.

---

## PART 1: FUNCTIONAL INVENTORY

| Section | Route(s) | Intended purpose | Implemented | UI/UX notes |
|--------|----------|------------------|-------------|-------------|
| **Dashboard** | `/admin` | Platform overview, KPIs, alerts, activity | ✅ Full | KPI grid (Users, Providers, Listings, Revenue, Pending, Health). Alerts: moderation, pending bookings, unverified providers. Activity block (recent actions). Muted text contrast fixed for light theme. |
| **Users & Access** | `/admin/users` | Manage users, roles, RBAC | ✅ Full | ControlUsersTab: profiles + user_roles, search, suspend/deactivate, reset password (email), assign/remove roles. ControlRolesTab: role list. Uses edge function `admin-manage-user` for actions. |
| **Catalog & Content** | `/admin/catalog` | Unified view of all listings/services/products | ✅ Full | Tabs: Data (UnifiedCatalogTable by vertical), Services, Properties, Products. Provider filter. Status filter (pending/approved). No direct edit in table — links to vertical-specific admin or MC. |
| **LifeOS** | `/admin/life-situations` | Life situation routes, quality, audit | ⚠️ Partial | Tabs: Situations, Routes, Resolver, Health, Mappings, Audit. Content exists; quality metrics and resolver are specialist tools. |
| **Finance** | `/admin/finance` | Transactions, commissions, revenue, promotions | ⚠️ Partial | ControlFinanceTab: revenue from `orders.status=completed` only; Commission 10% / Payouts 90% are **hardcoded**, not from DB. ControlAnalyticsTab: uses `platform_metrics`. AdminPromotionsTab: promotions. No payout history or real commission table. |
| **Partners / Providers** | `/admin/providers`, `/admin/providers/:id` | Provider directory, verification, detail | ✅ Full | List with search/filter; detail page; verification. Links to contracts, services. |
| **System Settings** | `/admin/settings` | Cities, translations, taxonomy, data import, Google Maps, pipelines (lazy) | ✅ Full | Tabs: System (quick links + ControlSystemTab: Google Maps status, Cities, Taxonomy, etc.), Audit, Logs. Pipeline settings lazy-loaded. |
| **Control Center** | `/admin/control` | Users, Roles, Analytics, Finance, Audit, System, Logs | ✅ Full | Same data as Users/Settings but tabbed in one place. Analytics from platform_metrics. |
| **Operations** | `/admin/operations` | Orders, moderation, leads, tickets, disputes | ✅ Full | Tabs: Bookings (orders), Moderation (listings/properties pending), Leads (vendor_prospects), Inquiries (support_tickets), Disputes. Overview counts from orders, support_tickets, vendor_prospects. |
| **Properties** | `/admin/properties` | List/approve/edit all properties | ✅ Full | useAdminProperties (properties by provider_id or management_company_id). Filters: provider, approval status. Approve/Reject, Edit (CanonicalPropertyForm in dialog). "Add" redirects to `/mc/properties/new?context=admin`. |
| **CRM (Admin)** | `/admin/crm` | Acquisition hub: vendors, users, owners | ⚠️ Partial | **Not** crm_contacts/agent_deals. Tabs: Dashboard (AdminCrmDashboard KPIs), Vendors (VendorProspectsPipeline/Table/Stats), Users (MCCLeadsTab), Owners (AdminOwnerProspects), Activity. For Capital/Estate contacts and deals — use **MC** (/mc/contacts, /mc/crm-dashboard). |
| **Tickets** | `/admin/tickets`, `/admin/tickets/:id` | Support ticket queue and detail | ✅ Full | useAdminTickets → support_tickets. List with status/search; detail with replies, assign, close. |
| **Marketing** | `/admin/marketing` | Campaigns, MCC control tower | ⚠️ Partial | MarketingDashboard; campaign creation; MCC tabs (leads, funnel, etc.). Depends on campaign/lead tables. |
| **Contracts** | `/admin/contracts` | Provider contracts | ✅ Full | List and manage provider contracts (contracts table). |
| **AI Agents** | `/admin/ai-agents`, `/admin/ai-agents/:id` | Configure AI agents | ✅ Full | List agents, edit (model, prompts, tools). |
| **AI Ops** | `/admin/ai-ops` | AI command center, token usage, errors | ✅ Full | Dashboard of AI usage, errors, agents. |
| **Intake** | `/admin/intake`, `/admin/intake-configs` | Intake queue and configs | ✅ Full | Intake queue (items by status); configs for lead forms. |
| **Lead configs** | `/admin/lead-configs` | Lead form configs per vertical | ✅ Full | Verticals, form fields, active configs. |
| **Data Import** | `/admin/data-import` | Bulk import | ⚠️ Partial | Field mapper and import flow; depends on target entities. |
| **Cities** | `/admin/cities` | Cities/regions taxonomy | ✅ Full | CRUD for cities (admin_cities or cities table). |
| **Translations** | `/admin/translations` | Translation strings | ✅ Full | Table of keys, EN/RU values. |
| **Taxonomy** | `/admin/taxonomy` | Taxonomy manager | ✅ Full | Taxonomy values by type. |
| **Location Knowledge** | `/admin/location-knowledge` | Knowledge base articles | ✅ Full | Articles by city/section; publish state. |
| **Legal Documents** | `/admin/legal-documents` | Legal doc templates | ✅ Full | List and edit legal document templates. |
| **QA Test Runner** | `/admin/qa-test-runner` | Run QA suites | ✅ Full | Execute test suites, view results. |
| **Vendor Prospects** | `/admin/vendor-prospects` | Vendor acquisition pipeline | ✅ Full | Same data as CRM → Vendors tab (vendor_prospects). |
| **Verticals (per-category)** | `/admin/restaurants`, `/admin/salons`, … | Category-specific admin (restaurants, salons, gyms, etc.) | ✅ Full each | Each vertical has list/detail; some have data-quality or extra tabs. Implementation depth varies (e.g. restaurants, flowers, vehicles). |
| **Trash** | `/admin/trash` | Soft-deleted items | ✅ Full | View/restore trashed records. |
| **Disputes** | `/admin/disputes` | Dispute queue | ⚠️ Partial | Depends on disputes table and workflow. |
| **Investor Metrics** | `/admin/investor-metrics` | Investor-specific metrics | ⚠️ Partial | If used for Capital, may read from same analytics/deals. |
| **Acquisition Metrics** | `/admin/acquisition-metrics` | Acquisition analytics | ⚠️ Partial | Funnel/acquisition views. |

---

## PART 2: DATA MAPPING AUDIT

| Entity | UI location | Fields shown (examples) | Table(s) / source | Backing data | DB fields not in UI | N+1 / indexes / joins |
|--------|-------------|--------------------------|-------------------|--------------|---------------------|-------------------------|
| **Contacts** | **MC only** (`/mc/contacts`) | name, email, phone, type, lifecycle, tags, company | `crm_contacts` (company_id) | ✅ | contact_type, budget_min/max, lead_score, lifecycle_stage, etc. used in filters/detail; some fields may be missing in list | useCrmContacts paginated; single query with filters. |
| **Deals / Pipeline** | **MC only** (`/mc/crm-dashboard`) | deal name, value, stage, contact, property, agent | `agent_deals`, `crm_pipeline_stages`, `crm_contacts` | ✅ | deal_type, next_action, next_action_date, lost_reason, tags | useAgentDeals by company_id; stages from crm_pipeline_stages. Join to contacts/properties in UI. |
| **Properties** | Admin: `/admin/properties`; MC: `/mc/properties` | title, address, status, provider, approval, price | `properties` (provider_id, management_company_id, approval_status) | ✅ | Many fields in CanonicalPropertyForm; admin list shows subset | useAdminProperties; filter by provider; no obvious N+1. |
| **Tasks** | **MC only** (`/mc/operations`) | type, date, property, status, assigned_to | `property_operational_tasks` | ✅ | assigned_to used; completion and status updates | useOperationalTasks by property_id(s). |
| **Segments** | **MC** (if present) | Segment definitions | Likely custom or tags-based | ⚠️ | — | No dedicated segments table found in audit. |
| **Sequences** | **MC** (sequences/enrollments) | Sequence name, steps, enrollments | `crm_sequences`, `crm_sequence_steps`, `crm_sequence_enrollments` | ✅ | — | useCrmSequences by company_id; steps and enrollments loaded. |
| **Analytics (platform)** | Admin Dashboard, Finance, Control | Users, providers, bookings, GMV, revenue, growth % | `platform_metrics` (daily snapshot), `orders` (Finance tab) | ⚠️ | If `platform_metrics` is empty, dashboard GMV/revenue = 0. Finance tab uses only `orders.status=completed`. | useAdminAnalytics reads platform_metrics; useAdminDashboardStats uses many tables in parallel (no N+1). |
| **Admin CRM “contacts”** | `/admin/crm` | Vendor prospects, MCC leads, owner prospects | `vendor_prospects`, lead tables, owner-related | ✅ | — | Vendor prospects and leads; separate from crm_contacts. |
| **Orders** | Admin Operations (Bookings), Finance | status, total_amount, currency | `orders` | ✅ | — | Operations overview filters by status; Finance sums completed. |
| **Support tickets** | `/admin/tickets` | status, subject, replies, assignee | `support_tickets` | ✅ | — | useAdminTickets. |
| **Profiles / Users** | `/admin/users` (ControlUsersTab) | id, full_name, email, phone, created_at, status, roles | `profiles`, `user_roles` | ✅ | profiles has more columns (e.g. avatar); only subset shown | Two queries (profiles then user_roles); could be one join if needed. |
| **Listings (catalog)** | `/admin/catalog` | vertical, title, status, provider | `listings` (and vertical-specific tables for some tabs) | ✅ | — | UnifiedCatalogTable; provider filter. |
| **Revenue / GMV** | Dashboard KPI, Finance tab | Revenue, GMV, commission, payouts | `platform_metrics` (gmv, platform_revenue), `orders` (Finance) | ⚠️ | Commission and payouts in Finance are **hardcoded** (10% / 90%), not from DB. Real payout/commission tables not wired. | — |

**Summary data mapping:**
- **Fields with no backing data in UI:** None critical; Commission/Payouts in Finance are derived, not from DB.
- **DB fields not surfaced:** Many on crm_contacts (e.g. emergency_contact_*, family_info, scoring) and agent_deals (next_action_date, lost_reason) — optional for UX.
- **N+1 / indexes:** No clear N+1 in traced code. Indexes on (company_id, status), (provider_id), (approval_status) recommended if not present.

---

## PART 3: BUSINESS LOGIC AUDIT

### CRM / Capital division

- **Deal flow Lead → Meeting → LOI → Closed:**  
  **Yes, in MC.** Pipeline and stages are in `/mc/crm-dashboard` (agent_deals + crm_pipeline_stages). Admin has **no** view of deals or pipeline. To manage Capital CRM you must use MC with the Capital company.

- **VIP contacts ($1M+ budget) flagged and filterable:**  
  **Partial.** `crm_contacts` has `budget_min`, `budget_max`, `contact_type`. There is no dedicated `vip` boolean. Filtering by budget or type in MC contacts list depends on UI (filter by contact_type or budget range). Not explicitly “VIP” unless a type or tag is used.

- **Trigger WhatsApp or email sequence from contact record:**  
  **In MC.** Sequences exist (crm_sequences, enrollments); trigger from contact is in owner/MC flows. Admin CRM does not handle crm_contacts or sequences.

- **Investor pipeline separate from buyer pipeline:**  
  **Possible but not enforced.** `agent_deals` has `deal_type`; pipelines can be per type if configured. No single “investor pipeline” vs “buyer pipeline” split in code without custom pipeline setup.

### Estate division

- **Manage properties and link to owner contacts:**  
  **Yes, in MC.** Properties have owner_id / owner_contact_id; MC properties and owners pages allow this. Admin can list/approve properties and redirect “new” to MC wizard.

- **Track tenants per property:**  
  **No.** No tenant–property–lease entity or “place tenant” flow (see MC audit). Contacts can be type “tenant” but no link to property + lease dates.

- **Task/reminder system for property management:**  
  **Yes, in MC.** `/mc/operations` and calendar use property_operational_tasks; create task, assign, complete. Admin has no task system for platform ops.

### MyUNO platform operations

- **Platform users separate from CRM contacts:**  
  **Yes.** Admin Users = `profiles` + `user_roles`. CRM contacts = `crm_contacts` (company-scoped in MC). No mixing in admin.

- **Track transactions / GMV:**  
  **Partial.** Dashboard uses `platform_metrics` (totalGMV, revenue, growth). If `platform_metrics` is not populated, values are 0. Finance tab uses `orders` (completed) for revenue. No single “transaction ledger” view in admin.

- **Onboarding funnel view:**  
  **Missing.** No dedicated admin view for signup → first booking / first listing funnel (e.g. step-by-step conversion).

---

## PART 4: VERDICT & PRIORITY FIXES

### 1. Does this admin panel allow effective management of the MyUNO platform?

**Partially (Y with gaps).**  
- **Works:** User and role management, unified catalog and moderation, operations (orders, tickets, leads, moderation), vertical-specific admin, properties approval, AI agents, settings, audit/logs.  
- **Gaps:** Platform GMV/revenue depend on `platform_metrics` (often empty → zeros). Finance commission/payouts are hardcoded. No onboarding funnel. So **effective for day-to-day ops and content/moderation**, but **not for full financial and growth visibility** without populating metrics and wiring real finance data.

### 2. Does it allow effective management of Ignatev Capital CRM?

**No.**  
- Contacts (330) and deals/pipeline are in **MC** (`/mc/contacts`, `/mc/crm-dashboard`), not in Admin.  
- Admin “CRM” is acquisition (vendor prospects, MCC leads, owners), not Capital contacts/deals.  
- To run Capital you **must** use MC (with the Capital company). Admin has no read-only or management view of crm_contacts or agent_deals.

### 3. Does it allow effective management of Ignatev Estate?

**No.**  
- Property management, calendar, operations, finance, staff, owners are in **MC** (`/mc/*`).  
- Admin only lists properties, approves/rejects, and redirects “new” to MC. So **effective Estate management is in MC**; Admin is not the place for it.

### 4. TOP 5 highest-priority fixes (by business impact)

1. **Populate or fallback platform_metrics for Dashboard/Finance**  
   - **Impact:** Reliable GMV and revenue in admin.  
   - **Action:** Either backfill/maintain `platform_metrics` (e.g. nightly job from orders/bookings) or make dashboard KPI and Finance tab use `orders`/`bookings` as fallback when metrics are empty.  
   - **Effort:** 0.5–1 day.

2. **Replace hardcoded commission/payouts in Admin Finance**  
   - **Impact:** Finance tab reflects real economics.  
   - **Action:** Introduce commission/payout config or tables and read from DB; show “Commission” and “Payouts” from data, not 10%/90% of revenue.  
   - **Effort:** 1–2 days.

3. **Single “platform overview” for Capital/Estate (optional)**  
   - **Impact:** Leadership sees both divisions from admin.  
   - **Action:** Optional read-only admin page or widgets: e.g. total contacts and pipeline value per company (from crm_contacts + agent_deals), or link to MC with company selector.  
   - **Effort:** 1 day.

4. **VIP / high-budget filter in MC contacts**  
   - **Impact:** Capital can segment $1M+ or VIP easily.  
   - **Action:** In MC contacts list, add filter by budget range and/or contact_type (and optionally a “VIP” tag or type).  
   - **Effort:** 0.5 day.

5. **Onboarding funnel or “first key action” view**  
   - **Impact:** Product/growth can see signup → first listing or first booking.  
   - **Action:** Admin view (or analytics tab) with funnel: e.g. profiles created → with role → first listing / first booking (from profiles + user_roles + listings/bookings).  
   - **Effort:** 1–2 days.

### 5. Broken vs missing

- **Broken:**  
  - Dashboard “Revenue”/GMV show 0 if `platform_metrics` is empty (data pipeline issue, not UI bug).  
  - Finance “Commission” and “Payouts” are derived, not from DB (design choice, not a crash).

- **Missing (never built):**  
  - Admin view of crm_contacts and agent_deals (by design: those live in MC).  
  - Tenant/lease management (MC audit).  
  - Owner report generation (MC audit).  
  - Real commission/payout storage and display.  
  - Onboarding funnel view.  
  - Explicit “investor pipeline” vs “buyer pipeline” in one place (can be done with pipeline config in MC).

---

*Audit based on code and route inspection of `/admin/*`, hooks, and Supabase types. MC behaviour from existing MC audit doc.*
