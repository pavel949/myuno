

# Database Optimization Plan

## Summary

391 tables audited. Two actions: add missing FK indexes (performance) and drop unused empty tables (hygiene).

---

## Part 1: Add Missing FK Indexes (~50 critical columns)

Foreign key columns without indexes cause slow JOINs, slow CASCADE deletes, and sequential scans. This is a read-only performance improvement — zero risk to data or functionality.

**Priority indexes** (tables that have data or will have heavy traffic):

| Table | Column |
|-------|--------|
| `bookings` | `provider_id`, `service_id`, `staff_id`, `user_id` |
| `booking_payments` | `booking_id` |
| `booking_status_history` | `booking_id`, `changed_by` |
| `booking_messages` | `booking_id`, `sender_id` |
| `booking_vouchers` | `order_id` |
| `bouquets` | `shop_id` |
| `calendar_sync_logs` | `property_id` |
| `order_items` | (various FK columns) |
| `order_item_*_details` | `order_item_id` |
| `property_bookings` | FK columns |
| `agent_deals` | `pipeline_id`, `property_id` |
| `ai_artifacts` | `agent_id` |
| `airport_*` | FK columns |
| `crm_*` | FK columns to contacts, pipelines |
| `cleaning_services` | `provider_id` |

**Migration**: One `CREATE INDEX CONCURRENTLY` migration with ~50 indexes. Uses `IF NOT EXISTS` for safety.

---

## Part 2: Drop Unused Empty Tables

214 empty tables found. After cross-referencing with frontend code (426 files, 7500+ `.from()` calls) and Edge Functions (73 table refs):

- **160 empty tables** are referenced in code — KEEP (will be populated as features launch)
- **54 empty tables** have zero code references
- Of those 54, **5 are referenced by FK** from other tables (`ledger_accounts`, `locations`, `mcc_funnels`, `products`, `property_checklist_templates`) — KEEP

**49 tables safe to drop** (empty, no code refs, no FK dependencies):

```text
booking_addresses          booking_inventory_reports
booking_items              booking_meter_readings
bundle_offers              checklist_completions
cohort_metrics             crm_cooperation_terms
crm_nurture_queue          cross_sell_metrics
damage_reports             data_quality_issues
document_reminders         entity_classification_hints
event_bookings             event_occurrences
featured_listings          financial_categories
founder_daily_brief        funnel_analytics
geographic_metrics         guest_referral_codes
investment_documents       investment_team_members
marketplace_order_status_history
marketplace_promo_usage    marketplace_wishlist
mcc_events                 mcc_funnel_events
mcc_message_log            mcc_sessions
meter_readings             nb_project_reports
nb_project_updates         nb_promotions
nb_special_terms           order_item_property_details
order_payment_stages       owner_report_preferences
partners                   pet_profiles
pharmacy_orders            pipeline_stage_history
product_availability       product_resource_links
project_requests           property_booking_status_log
property_deposits          property_maintenance_schedules
```

**Migration**: One `DROP TABLE IF EXISTS ... CASCADE` migration. Since tables are empty and unreferenced, this only reduces schema bloat and speeds up `types.ts` generation.

---

## Technical Details

- **Two separate migrations** for safety (indexes first, drops second)
- Indexes use `CREATE INDEX IF NOT EXISTS` — idempotent
- Drops use `CASCADE` to remove any orphaned FK constraints
- `types.ts` will auto-regenerate after migration, removing ~49 unused type definitions
- No frontend code changes needed

## Risk Assessment

- **Indexes**: Zero risk. Only improves read/write performance.
- **Drops**: Very low risk. Triple-verified: empty data + no code refs + no inbound FKs. Tables can be recreated via migration if ever needed.

