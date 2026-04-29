# Database Table Classification — 2026-04-29

Inventory of all **405 public tables** in primary Supabase DB, classified for cleanup Wave 4.

**Method:**
1. `pg_stat_user_tables.n_live_tup` — actual row count
2. `rg "['\"]<tablename>['\"]" src supabase/functions` — code references (excludes migrations)
3. Manual cross-check against Master Taxonomy v1.0 SSOT memory (`properties`, `listings`, `orders`, `ledger_entries`, `crm_contacts`)

## Summary

| Status | Count | Action |
|---|---|---|
| **KEEP — production data, ≥10 rows** | 89 | leave as-is, only schema fixes |
| **KEEP — large/critical** | 3 | property_activity_log, calendar_sync_logs, property_operational_tasks |
| **TINY** (1–9 rows) | 97 | review case-by-case in W4 phase 3 |
| **EMPTY w/ 3+ code refs** | 61 | drop-with-care; remove code first |
| **EMPTY w/ 2 code refs** | 62 | likely dead — drop after grep audit |
| **EMPTY w/ 1 ref** (typically just `types.ts`) | 92 | strong drop candidates |
| **EMPTY w/ 0 refs (immediate drop)** | 4 | drop in single migration |
| **TOTAL** | **405** | |

## Drop priority order (Wave 4 phase 2)

### Tier 1 — Immediate drop (4 tables, 0 refs)
Safe to drop in a single migration. No code touches them, no rows.
```text
booking_scheduled_messages
clearview_projects
document_reminders
property_passport_events
```

### Tier 2 — Single-ref drop candidates (92 tables)
Each has exactly 1 reference (likely auto-generated `types.ts` only). Quick grep confirms, then drop in batches of 20.

Notable groups:
- **mcc_*** (marketing command center): `mcc_ai_recommendations`, `mcc_automation_rules`, `mcc_channel_metrics`, `mcc_creatives`, `mcc_state_history`
- **platform_*** (deprecated): `platform_events`, `platform_metrics`, `platform_news`, `platform_recommendations`
- **capital_*** (Capital subsystem, 0 used): `capital_intro_requests`
- **owner_***: `owner_performance_metrics`, `owner_vault_files`
- **vendor_***: `vendor_analytics`, `vendor_bookings`, `vendor_documents`, `vendor_location_services`
- **staff_***: `staff_documents`, `staff_profiles`, `staff_property_assignments`
- **team_***: `team_gamification`, `team_timesheets`, `team_user_achievements`
- **crm_***: `crm_access_log`, `crm_nurture_queue`, `crm_scoring_rules`, `crm_web_form_submissions`
- **property_***: `property_checklist_templates`, `property_inspections`, `property_key_assignments`, `property_listing_scores`, `property_management_requests`, `property_notes`, `property_owners`, `property_ownership_invites`, `property_stays_subscriptions`, `property_utility_schedules`
- **booking_***: `booking_messages`, `booking_operations`, `booking_payments`, `booking_vouchers`
- **airport_***: `airport_booking_addons`, `airport_passengers`
- **inventory_***: `inventory_inspections`, `inventory_listings`
- **juristic_***: `juristic_contacts`, `juristic_requests`
- **api_keys**, **moderation_queue**, **goods_receipts**, **purchase_order_items**, **referrals**, **resources**, **returning_guests**, **review_helpful**, **tax_filings**, **terms_acceptances**, **trust_account_movements**

Full list: see `awk '$1==1' /tmp/table_refs_sorted.txt` from baseline run (92 tables).

### Tier 3 — 2-ref drop (62 tables)
Likely 1 hook + 1 type re-export. Manual review per table.

Key clusters to evaluate together:
- **approval_*** (3 tables, 0 used) — workflow system not launched
- **mcc_*** continued: `mcc_ab_tests`, `mcc_campaign_rules`, `mcc_user_states`
- **owner_*** finance: `owner_invoices`, `owner_payouts`, `owner_reports`, `owner_service_vendors`, `owner_statement_approvals`
- **property_*** finance: `property_accounting_policies`, `property_financial_models`, `property_payout_rules`, `property_price_offers`, `property_rate_seasons` ⚠ Pricing engine memory says this exists — verify
- **crm_*** sequences: `crm_comm_templates`, `crm_custom_field_values`, `crm_meetings`, `crm_quotes`, `crm_sequence_enrollments`, `crm_sequence_steps`
- **payment infra**: `payout_runs`, `reconciliation_alerts`, `vendor_payouts`, `webhook_endpoints` ⚠ ledger/payment memory — keep schema, just empty
- **deal_pipeline_stages**, **disputes**, **lifecycle_executions**, **trust_accounts**

### Tier 4 — 3+ refs but empty (61 tables)
Code is wired but never gets writes. Either:
- Feature shipped but no users yet (keep)
- Feature half-built, abandoned (drop + rip out code)

Top suspects (high ref count = lots of dead UI code):
```text
16 refs: tags
14 refs: vendor_prospects
12 refs: products
8 refs: property_delegates
6 refs: capital_campaigns, capital_contacts, crm_sequences, developer_users,
        manual_payment_requests, owner_prospects, partner_applications, vendor_services
5 refs: ai_decisions_log, buyers, mc_property_slots, mcc_campaigns, mcc_leads,
        property_documents, unit_holds, user_listings, visa_records
```

⚠ `mc_property_slots` — PMS Billing Slots memory says this is core ($25/property). Verify before drop.

## KEEP-list — Master Taxonomy v1.0 SSOT tables (untouchable)

| Table | Rows | Purpose (per memory) |
|---|---|---|
| `property_activity_log` | 5 204 | PMS audit |
| `calendar_sync_logs` | 1 478 | iCal sync |
| `property_operational_tasks` | 1 102 | Unified Task Hub |
| `property_financials` | 693 | P&L SSOT — `Dashboard Sourcing` memory |
| `analytics_events` | 609 | platform analytics |
| `listings` | 500 | **Unified Listings SSOT** — 11 verticals consolidated |
| `lookup_values` | 406 | dictionary |
| `catalog_life_map` | 391 | Catalog Taxonomy SSOT |
| `crm_contacts` | 386 | **Centralized CRM SSOT** |
| `contact_identities` | 349 | identity linking |
| `contact_identity_links` | 386 | identity linking |
| `booking_notifications_log` | 283 | guest notifications |
| `property_projects` | 266 | property hierarchy |
| `salon_services` | 261 | beauty vertical |
| `notifications` | 148 | user notifications |
| `developers` | 126 | newbuilds developer portal |
| `marketplace_products` | 124 | marketplace |
| `property_analytics` | 124 | PMS analytics |
| `marketplace_subcategories` | 114 | catalog |
| `orders` | 113 | **Order-First SSOT** |
| `yacht_pricing_rules` | 111 | yacht vertical |
| `admin_audit_logs` | 93 | admin trail |
| `order_participants` | 92 | orders |
| `ledger_entries` | 87 | **Professional Ledger SSOT** |
| `life_tasks` | 82 | LifeOS |
| `categories` | 81 | catalog |
| `ai_agent_logs` | 77 | AI Center |
| `crm_custom_options` | 75 | CRM |
| `order_items` | 73 | orders |
| `mv_finance_summary_daily` | 68 | finance materialized view |
| `bouquets` | 66 | flowers vertical |
| `ai_intake_sessions` | 63 | AI |
| `crm_pipeline_stages` | 58 | CRM kanban |
| `service_jtbd_clusters` | 56 | Master Taxonomy |
| `project_units` | 55 | newbuilds |
| `ota_*` (3 tables) | 156 total | OTA sync |
| `view_history` | 51 | analytics |

## Wave 4 execution plan

### Phase 1 (3 days): finalise classification
- [ ] Verify Tier 4 hot suspects against memory (`mc_property_slots`, `property_rate_seasons`, `payout_runs`)
- [ ] Cross-check `crm_*` tables against `Centralized CRM` memory — keep schema for shipped features
- [ ] Confirm `payment infra` tables (`webhook_endpoints`, `reconciliation_alerts`, `vendor_payouts`) are reserved for ledger growth — KEEP

### Phase 2 (2 weeks): batch DROPs
PR cadence: 1 PR per 20 tables, max 4 PRs/week.
1. PR #1: Tier 1 (4 tables) — smoke test the migration flow
2. PR #2–6: Tier 2 (92 tables in 5 batches)
3. PR #7–10: Tier 3 (62 tables in 4 batches, with code removal)
4. PR #11–13: Tier 4 carefully (61 tables in 3 batches, requires code-deletion PRs first)

### Phase 3 (1 week): RPC ревизия
- 432 RPC functions → audit `rg "rpc\\('<name>'"` per function
- Drop unused

### Phase 4 (3 days): post-mortem
- Re-run baseline → confirm: 405 → ≤ 150 tables, 432 → ≤ 200 RPC

## Ground rules
- Each DROP migration includes `DROP TABLE IF EXISTS ... CASCADE` AND inline rollback comment
- Code-removal PRs precede schema DROP by ≥ 3 days (deploy gap)
- Never drop a table with `_id` FK from a kept table without first ALTERing the FK
- Never drop tables matching `auth.*`, `storage.*`, `realtime.*`, `supabase_functions.*`, `vault.*`
