

# Database Audit Plan — myUNO

## Diagnosis (factual)

**Current state:** 381 `public` tables · 22 views · 28 RPCs.

| Status | Count | % |
|---|---:|---:|
| **Empty (0 rows)** | 198 | **52%** |
| Tiny (1–10 rows) | 101 | 27% |
| Active (>10 rows) | 82 | 21% |
| Frontend hits (`.from()`) | ~165 unique | 43% |
| **Defined but never queried** | ~216 | **57%** |

**Top 10 by data volume:** `property_activity_log` (4382), `calendar_sync_logs` (1481), `property_operational_tasks` (1030), `property_financials` (669), `task_entity_map` (662), `property_bookings` (648), `listings` (500), `lookup_values` (406), `crm_contacts` (386), `analytics_events` (348).

## Root causes of bloat

1. **Three parallel CRMs** running cold next to a working one:
   - ✅ `crm_contacts` (386), `crm_pipelines` (7), `crm_pipeline_stages` (58) — **the only one with data**
   - ❌ `capital_*` (8 tables, all 0 rows) — built last week, duplicates `crm_*`
   - ❌ `deal_*` (7 tables, all 0 rows) — generic deal pipeline, never wired
   - ❌ `crm_workflows / sequences / scoring / web_forms / quotes / emails / meetings / documents / companies / custom_fields` — 18 empty enterprise-CRM tables

2. **Three parallel Booking systems:**
   - ✅ `property_bookings` (648) — STR, in production
   - ⚠️ `orders` + `order_items` + `order_participants` (94/73/73) — universal layer, used for marketplace
   - ❌ `bookings` (1), `booking_payments` (0), `booking_vouchers` (0), `booking_operations` (0), `airport_bookings` (0), `tour_bookings` (0), `vendor_bookings` (0), `service_orders` (0), `water_activity_bookings` (0) — abandoned

3. **Vertical sprawl** — 11 vertical entity tables (`yachts`, `vehicles`, `clinics`, `salons`, `gyms`, `flower_shops`, `bouquets`, `restaurants`, `cleaning_services`, `babysitters`, `pet_services`, `legal_services`, `events`, `experiences`, `water_activities`, `education_providers`, `insurance_providers`, `pharmacies`) — **already partially consolidated to `listings`** (500 rows) but old tables retained as views or live data.

4. **Marketing automation graveyard** — `mcc_*` (12 tables, all 0), `lifecycle_*` (3 tables, mostly 0), `chat_violation_*`, `moderation_queue`, `pricing_recommendations`, `platform_*` — built speculatively, never used.

5. **Investment Hub duplicates** — `investment_deals/projects/interests` + `investor_inquiries` + `capital_projects/intro_requests` + `agent_deals` + `business_listings` — **6 different "deal" tables**, all empty or near-zero.

6. **Property over-decomposition** — 50+ `property_*` tables; many empty (`property_inspections`, `property_meters`, `property_inventory_items`, `property_key_assignments`, `property_passport_events`, `property_guidebook`...) — built for future PMS features.

## How many tables do we actually need?

**Answer: ~80 active tables across one DB.** Frontend touches ~165 today, but ~85 of those are aliases/duplicates that collapse cleanly. **One Supabase project is correct** — the mirror DB (`erfwtoavipwjqmylpizt`) should remain only as offline backup, never as a second runtime.

## Target architecture (12 domains, ~80 tables)

```
Identity (5)         profiles, user_roles, providers, management_companies, mc_members
CRM (6)              crm_contacts, crm_pipelines, crm_pipeline_stages, crm_activities,
                     crm_tasks, crm_contact_notes
Real Estate (8)      developers, property_projects, project_units, properties,
                     property_complexes, listings, listing_applications, resale_properties
PMS Ops (10)         property_bookings, property_financials, property_operational_tasks,
                     property_activity_log, property_analytics, property_external_calendars,
                     property_rate_seasons, property_management_terms, property_documents,
                     property_promotions
Marketplace (4)      listings (SSOT, replaces 17 vertical tables via JSONB attributes),
                     marketplace_products, marketplace_vendors, categories
Orders/Money (8)     orders, order_items, order_participants, order_addresses,
                     order_status_history, payment_intents, ledger_entries, vendor_payouts
Investment Hub (3)   investment_deals, investment_articles, investor_inquiries
                     (sync into crm_contacts via existing trigger — no separate CRM)
Bookings extras (3)  bookings (generic non-property), booking_messages, booking_status_history
Comms/Notif (4)      notifications, booking_notifications_log, booking_message_rules,
                     lifecycle_templates
AI (4)               ai_agents, ai_agent_logs, ai_agent_knowledge, ai_intake_sessions
Platform (8)         lookup_values, taxonomy_definitions, system_settings, categories,
                     cities, currencies, currency_rates, analytics_events
Reviews/Social (4)   reviews, favorites, view_history, support_tickets

──────────────────── ~67 core + ~13 utility = ~80 tables
```

## Deletion candidates (immediate, ~110 tables)

- All 12 `mcc_*` (marketing-cloud, never used)
- All 8 `capital_*` (replace with `crm_contacts` + filter on `pipeline_id='capital'`)
- All 7 `deal_*` (replace with `orders` + `order_type='real_estate_deal'`)
- 18 unused `crm_*` enterprise tables (workflows, sequences, scoring, quotes, web_forms, emails, meetings, documents, companies, custom_fields × 3)
- All 7 `airport_*` and `tour_bookings`, `water_activity_bookings`, `vendor_bookings`, `service_orders`, `service_order_status_history` → replaced by `orders`
- `business_listings`, `inventory_listings`, `inventory_inspections`, `juristic_*`, `nb_project_updates`, `partner_applications`, `quick_listings` (all 0 rows)
- `chat_violation_*`, `chat_message_flags`, `moderation_queue` (0 rows)
- ~25 empty `property_*` future-PMS tables (keep schema in a separate migration file, recreate when feature is built)
- `mc_property_slots`, `developer_users`, `developer_impersonation_log`, `disputes`, `drive_import_jobs`, `due_diligence_reports`, `payment_schedules`, `personal_reminders`, `platform_*` × 4, `portal_messages`, `pricing_recommendations` (all 0 rows)

**Result: 381 → ~270 after deletion → ~80 after consolidation.**

## Consolidation plan (5 phases)

**Phase 1 — Drop dead tables (no risk, all 0 rows, no frontend refs)**
- ~80 tables, single migration. Audit script: scan `src/**/*.{ts,tsx}` for `.from('X')` first; only drop if no hits.

**Phase 2 — Merge CRMs into `crm_contacts`**
- Add `pipeline_kind` column (`'capital'|'sales'|'support'`).
- Drop `capital_*` (already synced via trigger to `crm_*`).
- Drop unused `crm_workflows/sequences/scoring/...` (no UI uses them).
- Keep `crm_documents`, `crm_emails`, `crm_meetings` only if Inbox UI ships in next sprint — otherwise drop.

**Phase 3 — Unify Bookings under `orders`**
- Migrate `property_bookings` (648 rows) → keep as-is (PMS-specific, justified separation).
- Drop all empty `*_bookings` siblings; route every new vertical through `orders` + `order_items.product_kind`.
- Replace `bookings` (1 row) with `orders`.

**Phase 4 — Vertical tables → `listings` JSONB attributes**
- 11 vertical tables already mostly views over `listings`. Confirm the views are writable (or replace with `INSTEAD OF` triggers) and drop underlying tables that are no longer the source.
- Investment-Hub trio (`investment_deals/projects/interests`) → merge into `listings` with `category='investment'` + JSONB `deal_attributes`.

**Phase 5 — Compatibility views**
- For every renamed/dropped table that the frontend still queries, create `CREATE VIEW old_name AS SELECT … FROM new_name` with `INSTEAD OF` triggers for writes.
- Lets us deploy backend changes without touching ~165 frontend `.from()` call sites in one PR.

## Do we need more than one database?

**No.** Single Supabase project (`kakkwibljrjsawxgnupk`) is correct for the current scale (~32 properties, 386 contacts, 94 orders, 7 active users). PostgreSQL handles 10⁴× this load on one instance. The mirror DB stays as a passive backup only.

## Deliverables (when you approve)

Written to `/mnt/documents/`:

1. **`SCHEMA_AUDIT.md`** — full inventory, per-domain ER sketches, deletion candidates with frontend-reference proofs, RLS audit table.
2. **`schema_new.sql`** — proposed normalized DDL for the ~80-table target with RLS skeletons.
3. **`compat_views.sql`** — `CREATE VIEW old → new` mappings + `INSTEAD OF` triggers for writable legacy paths.
4. **`drop_candidates.sql`** — guarded `DROP TABLE IF EXISTS` for the ~110 dead tables, grouped by phase, each with a `-- frontend-refs: 0` comment proving safety.
5. **Migration runbook** in `SCHEMA_AUDIT.md` — phase order, rollback steps, smoke tests after each phase.

I will **not** run any DROPs — all destructive SQL ships as reviewable files for you to apply manually in batches.

