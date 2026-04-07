# MyUNO × Ignatev Group — Use Case Mapping

Mapping of the MyUNO platform against two Ignatev workflows, based on actual code. Focus: what exists, where it lives, what’s missing or broken.

---

## USE CASE 1: CRM FOR INVESTOR MANAGEMENT (Ignatev Capital)

**Workflow:** Lead → First contact (WhatsApp/email) → Meeting → LOI / term sheet → Deal structuring → Closed → Ongoing investor reporting.

### 1. Where do contacts with role `investor` live in the CRM?

- **Table:** `crm_contacts` (all contacts are in this table; no separate “investors” table).
- **Role/type:** Contacts have `contact_type` (string). Allowed values in code: `CONTACT_TYPES = ['buyer', 'seller', 'investor', 'tenant', 'landlord', 'agent']`. So “investor” is one of the contact types; filter by `contact_type = 'investor'`.
- **Scope:** Contacts are scoped by `company_id` → `management_companies`. So each MC (e.g. Ignatev Capital) has its own contacts; there is no global “investor” table.
- **Pipeline:** Deals live in `agent_deals` and are linked to `crm_pipelines` via `pipeline_id`. Pipelines are per company (`crm_pipelines.company_id`). There is no dedicated “investor pipeline” by name; you use one or more pipelines per MC and can name them (e.g. “Investor pipeline”) in pipeline settings.
- **Fields present for investor-style use:**
  - **Budget:** `budget_min`, `budget_max`, `currency` — yes.
  - **Nationality:** `nationality` — yes.
  - **Source:** `source` — yes (values in code: website, referral, walk-in, social, agent_network, other).
  - **Last contact date:** No dedicated column. `updated_at` is the last record update; “last contact” would require deriving from `crm_activities` (e.g. last activity date) or `crm_contact_notes` — not a single field on the contact.
- **VIP / segment for $1M+:** No dedicated “VIP” or “$1M+” column. **Tags** exist: `CONTACT_TAGS = ['VIP', 'hot', 'warm', 'cold', 'follow-up', 'priority']`. So “VIP” is supported as a tag; filtering by budget ≥ $1M is possible via `budget_min`/`budget_max` (e.g. filter `budget_min >= 1000000` in UI or API). There is no built-in “VIP segment” or automatic flag from budget.

**Summary:** Investor contacts = `crm_contacts` with `contact_type = 'investor'`, scoped by MC. Budget, nationality, source exist; last contact is derived from activity; VIP is tag-based; no native “investor pipeline” name, but pipelines are configurable per MC.

---

### 2. Can you move a contact through the deal pipeline?

- **Yes.** Deals (`agent_deals`) are linked to contacts via `contact_id` and to a pipeline via `pipeline_id`; each deal has a `stage` (string). Moving a deal = updating `agent_deals.stage`.
- **Component that renders the pipeline/kanban:**  
  - **MC (per-company) pipeline:** `SalesPipeline.tsx` (`/mc/sales`) with view modes: **list**, **kanban**, **pivot**. Kanban is rendered by `KanbanBoard` (`@/components/owner/sales/KanbanBoard.tsx`). Drag-and-drop uses `@dnd-kit/core`; on drop, `useUpdateDeal` updates `stage`.  
  - **Admin CRM** at `/admin/crm` does **not** show a contact/deal pipeline; it shows vendor prospects pipeline, users, owners, and activity. So **investor deal pipeline is only in MC** (`/mc/sales` and `/mc/crm-dashboard`).
- **Default stages (when no DB stages exist):** From `useAgentDeals.ts` → `DEAL_STAGES`: `new` → `contacted` → `showing` → `negotiation` → `contract` → `closed_won` | `closed_lost`. Labels and probabilities exist in code. If the MC has no rows in `crm_pipeline_stages`, the UI uses these hardcoded defaults; otherwise it uses stages from `crm_pipeline_stages` (from `useDynamicPipelineStages` / `useCrmPipelines`). There is **no seed in migrations** that inserts default stages per company; pipelines/stages are created when the MC configures them (e.g. via Pipeline Settings).
- **WhatsApp / email sequence from a contact:**  
  - **WhatsApp:** Contact detail has a **WhatsApp link** (opens `wa.me/...`) using `contact.whatsapp` or `contact.phone`; no in-app sending or sequence trigger from the contact card.  
  - **Sequences:** `crm_sequence_enrollments` links contacts to `crm_sequences` (contact_id, sequence_id, enrolled_by). So **enrollment in a sequence is supported in the data model**. Workflows (`crm_workflow_actions`) can have action type `enroll_sequence`. There is **no “Enroll in sequence” button** on the Contact detail page in the codebase; enrollment may be trigger-based (workflow) or from another screen (e.g. sequence builder). Email sequences exist (`CrmSequencesPage`, `SequenceBuilder`); whether they send WhatsApp or only email depends on sequence steps (not fully traced here).

**Summary:** Moving deals through the pipeline works in MC Sales (list/kanban/pivot). Default stages are in code (new → contacted → showing → negotiation → contract → closed_won/closed_lost). WhatsApp is link-only from contact; sequence enrollment exists in DB and workflows, but no one-click “Enroll in sequence” on the contact card.

---

### 3. What does the CRM dashboard actually show?

- **`/admin/crm`** (Admin CRM):  
  - **Component:** `AdminCRM.tsx`; tabs: Dashboard, Vendors, Users, Owners, Activity.  
  - **Dashboard tab:** `AdminCrmDashboard` — KPIs from `useAdminCrmStats`: Total Leads, Active, Conversion %, Vendors (B2B), Users (B2C), Owners; plus a **channel funnel** (Vendors / Users / Owners with total vs converted).  
  - **No investor-specific widgets.** No separation of “investors” vs “buyers/tenants”; admin CRM is **acquisition-focused** (vendors, users, owners), not investor-deal pipeline.

- **`/mc/crm-dashboard`** (MC CRM Dashboard):  
  - **Component:** `CrmDashboardPage.tsx`.  
  - **KPIs:** Active (deal count), Pipeline (total value), Forecast (weighted by stage probability), Win rate %, Contacts count (link to `/mc/contacts`), Today’s tasks (link to `/mc/tasks`).  
  - **View:** Pipeline selector (if MC has multiple pipelines), then list / kanban / pivot of **deals** (from `agent_deals`). Filter by deal type (sale, rent, investment, management), status, agent, search (client name, phone, email, notes).  
  - **Investor vs buyer/tenant:** Deals have `deal_type`: `sale` | `rent` | `investment` | `management`. So you can **filter by type “investment”** to see investor-style deals. There is **no separate dashboard tab or widget “Investors”**; investor data is the same pipeline with `deal_type = 'investment'` and contacts with `contact_type = 'investor'`. No automatic separation of investor vs buyer/tenant in the UI; it’s filter-based.

**Summary:** Admin CRM = acquisition (vendors/users/owners), no investor pipeline. MC CRM = pipeline value, forecast, win rate, contacts, tasks, and deal list/kanban with filters; investor data is shown by filtering by deal type “investment” and contact type “investor”, not a dedicated section.

---

### 4. What is missing or broken for this workflow?

- **No dedicated “Investor” pipeline or dashboard view** — investors are contacts + deals filtered by type; no LOI/term-sheet-specific stages or report.
- **No “last contact date” on contact** — need to derive from activities/notes or add a denormalized field.
- **No built-in VIP / $1M+ segment** — only tags (e.g. VIP) and budget fields; no automatic segment or dashboard for HNWI.
- **No one-click “Enroll in sequence” from contact card** — sequences and enrollment exist; UX for starting a sequence from a contact is missing or elsewhere.
- **Admin CRM is not investor-focused** — it’s for platform acquisition (vendors/users/owners), not for Pavel’s investor pipeline.
- **Reporting:** No “ongoing investor reporting” module found (no dedicated report template or investor statement in the traced code); financials/reports are property/portfolio-oriented.

---

## USE CASE 2: ESTATE / PROPERTY MANAGEMENT (Ignatev Estate)

**Workflow:** Property onboarded → Owner linked → Tenant placed → Rent collected → Maintenance managed → Monthly report to owner.

### 1. How is a property linked to its owner in the system?

- **Tables:**  
  - **`properties`** has: `owner_id` (uuid, nullable), `management_company_id` (nullable), `owner_contact_id` (nullable), and owner display fields: `actual_owner_name`, `actual_owner_email`, `actual_owner_phone`. So a listing can have an owner (user or external) and an optional CRM contact for the owner.  
  - **`owner_properties`** exists in migrations (separate table with `owner_id`); there is also a view `v_owner_properties` = `properties` where `owner_id IS NOT NULL`. So “owner” can be stored on `properties` or in `owner_properties` depending on flow.  
  - MC sees properties via `properties.management_company_id = company_id` (see `useCompanyProperties` in `useMyProperties.ts`).
- **Owner portal:** There is an **owner portal** for property owners (read-only): routes `/my-property` and `/my-property/:propertyId` render `OwnerPortalDashboard` and `OwnerPortalPropertyView` (in `owner-portal/`). So owners can have a dedicated view of their property; the link from property to “owner” is `owner_id` and/or `owner_contact_id` and display fields.

**Summary:** Property ↔ owner: `properties.owner_id`, `properties.owner_contact_id`, and `actual_owner_*`; optional `owner_properties` table. Owner portal exists at `/my-property` for read-only owner view.

---

### 2. Can Timothy manage tasks for a property?

- **`/mc/operations`** renders **`OwnerOperations.tsx`**.  
  - It shows a **property selector** (from `useMyProperties`), tabs **Today / Upcoming / Completed**, and a list of **operational tasks** from `useOperationalTasks({ propertyId })`.  
  - Tasks have: `property_id`, `booking_id`, `task_type` (`check_in` | `check_out` | `cleaning` | `maintenance` | `inspection` | `meter_reading`), title, scheduled_date, status, etc.  
  - **Create task:** `CreateServiceTaskDialog`; task is linked to a property (and optionally booking). So **yes**, Timothy can manage tasks per property; tasks are tied to `property_id` and filterable by property.

**Summary:** Operations = task list (today/upcoming/completed) with property filter; task types include maintenance and inspection; create-task dialog links task to property. Task system is property-linked.

---

### 3. What financial tracking exists?

- **`/mc/finance`** renders **`FinanceOverview.tsx`**.  
  - It uses **`useRevenueAnalytics(6)`** (income/expenses by month, from property financials + bookings) and **`useFinancialStats()`** (totals, this month income/expenses).  
  - **Widgets:** Net (income), This month income, This month expenses; chart (income/expenses/net over months); quick links to **Financials** (transactions), **Reports**, **Budget**, **Invoices**.  
  - **Data:** `usePropertyFinancialsFull()` and `usePropertyFinancials` read from **`property_financials`** (or equivalent): `property_id`, `owner_id`, `transaction_type` (`income` | `expense` | `deposit`), `category`, `amount`, `transaction_date`, etc. **Income categories** include rent, deposit, cleaning_fee, late_fee, other_income. **Expense categories** include cleaning, maintenance, repair, utilities, etc. So **rent collected** and **maintenance costs** are representable as transactions with the right category; the UI shows aggregates and links to the financials/transactions screen.  
  - **Per-property:** Revenue analytics aggregate by all MC properties; the detailed transactions list (Financials) can be filtered by property if the underlying hooks/UI support it (not fully verified here). So **yes**, you can track rent and maintenance; per-property breakdown depends on the financials list/detail screens.

**Summary:** Finance overview shows income/expenses/net and charts; data comes from property financials with categories (rent, maintenance, etc.). Rent and maintenance are supported; full per-property breakdown to be confirmed in Financials/Reports screens.

---

### 4. What is missing or broken for this workflow?

- **Single source of “owner”:** Both `properties.owner_id` and `owner_properties` exist; need a clear rule (e.g. MC-managed = always `properties.management_company_id` + `owner_id` or `owner_contact_id`) so “owner linked” is consistent.
- **Tenant placement:** No dedicated “tenant” entity or “tenant placed” workflow found in the traced code; tenants may be implied by bookings or contacts (e.g. `contact_type = 'tenant'`). No explicit “place tenant” flow.
- **Rent collection:** Represented as income transactions; no dedicated “rent collection” or payment-link flow traced; may exist in booking/payment flows.
- **Monthly report to owner:** No “monthly report to owner” or investor-style statement found; reports exist (e.g. `/mc/reports`) but whether they include an owner-facing monthly summary is not confirmed.
- **Maintenance as first-class flow:** Maintenance is a task type and an expense category; no dedicated “maintenance request → assign → complete → cost” flow traced end-to-end.

---

## USE CASE 3: INVESTOR DEMO — What to show RIGHT NOW

### 5 screens/flows most complete and impressive to show today

| # | Route / component | What it demonstrates | Data needed to look real | Effort (hours) |
|---|-------------------|------------------------|---------------------------|-----------------|
| 1 | **`/mc/crm-dashboard`** — `CrmDashboardPage` | Full CRM: pipeline value, forecast, win rate, contacts, tasks; list/kanban/pivot of deals; filter by type (e.g. investment). | 1 MC, 1 pipeline with stages, 10–20 contacts (some `contact_type = 'investor'`), 5–10 deals in different stages (some `deal_type = 'investment'`), 1–2 agents. | 2–4 (seed data + optional pipeline naming) |
| 2 | **`/mc/sales`** — `SalesPipeline` + **`KanbanBoard`** | Drag-and-drop deal pipeline; deal cards with value, next action, overdue state; multiple pipelines. | Same as above; ensure at least one pipeline has stages (or rely on defaults). | 1–2 |
| 3 | **`/mc/contacts`** + **`/mc/contacts/:id`** — `ContactsList`, `ContactDetail` | Contact list with type/source/tag filters; contact card with WhatsApp, email, Telegram, notes, timeline, deals. | Contacts with investor type, budget, nationality, source, tags (e.g. VIP); a few activities/notes. | 1–2 |
| 4 | **`/mc/finance`** — `FinanceOverview` | Income/expenses/net, monthly chart, links to financials, budget, reports. | Property financials: several income (rent) and expense (maintenance, utilities) transactions over last 3–6 months. | 2–3 |
| 5 | **`/mc/operations`** — `OwnerOperations` | Task list by property (today/upcoming/completed); check-in, check-out, cleaning, maintenance, inspection; create task linked to property. | 1–2 properties, 5–10 operational tasks (mix of today/upcoming/completed). | 1–2 |

---

### 3 things that would make the biggest impression but need work

| # | What | What specifically needs to be done | Effort (rough) |
|---|------|------------------------------------|------------------|
| 1 | **Investor-specific pipeline and dashboard** | Add a dedicated “Investors” view: either a preset pipeline (e.g. “Investor pipeline”) or a dashboard tab that filters contacts + deals by `contact_type = 'investor'` and `deal_type = 'investment'`; add LOI/Term sheet–style stages if needed; optional “HNWI” or “VIP” segment (e.g. budget ≥ $1M or tag VIP). | 8–16 h |
| 2 | **One-click “Enroll in sequence” from contact** | On Contact detail, add an “Enroll in sequence” (or “Start sequence”) control that opens a sequence picker and creates a `crm_sequence_enrollment` for the contact; optionally prefill WhatsApp/email from contact. | 4–8 h |
| 3 | **Owner monthly report / investor reporting** | Add a report (or email) “Monthly report to owner”: property performance, rent collected, expenses, maintenance summary, occupancy (if data exists); optionally PDF and send to owner (email or portal). Ties Use Case 1 (reporting) and Use Case 2 (estate) together. | 16–24 h |

---

*Document based on codebase read. Table and component names refer to `src/` and `src/integrations/supabase/types.ts`.*
