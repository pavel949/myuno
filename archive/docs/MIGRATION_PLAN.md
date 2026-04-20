> ARCHIVED: 2026-04-20
> Superseded by: docs/ENVIRONMENT.md, docs/DB_MIRROR_SETUP.md
> Reason: Apr 2026 DB migration plan — migration to kakkwibljrjsawxgnupk is complete

# myUNO Database Migration Plan
## Lovable Hosted DB → Own Supabase Instance

**Date:** 2026-04-07
**Current state:** 417 tables, 514 migrations, Lovable-hosted Supabase project `erfwtoavipwjqmylpizt`

---

## 1. Current Inventory

| Category | Tables | Key Tables |
|----------|--------|------------|
| **Auth & Users** | 12 | profiles, user_roles, user_active_context, user_pins, user_segments, user_sessions, user_personas, user_documents, user_addresses, user_payment_methods, user_events, user_achievements |
| **Properties (PM core)** | 45 | properties, property_bookings, property_financials, property_availability, property_projects, property_complexes, property_management_terms, property_delegates, property_inventory_items, property_key_assignments, property_meters, property_notes, property_rate_seasons, ... |
| **CRM** | 32 | crm_contacts, crm_companies, crm_activities, crm_pipelines, crm_pipeline_stages, crm_tasks, crm_emails, crm_meetings, crm_sequences, crm_workflows, crm_documents, crm_quotes, crm_web_forms, crm_reminders, crm_scoring_rules, ... |
| **Orders & Cart** | 18 | orders, order_items, order_status_history, order_addresses, order_participants, order_payment_stages, cart_items, service_orders, service_order_status_history, payment_intents, ... |
| **Bookings (multi-vertical)** | 15 | bookings, booking_items, booking_payments, booking_messages, booking_vouchers, booking_operations, tour_bookings, event_bookings, water_activity_bookings, airport_bookings, ... |
| **Vendors & Providers** | 20 | providers, vendor_locations, vendor_services, vendor_bookings, vendor_subscriptions, vendor_payouts, vendor_documents, vendor_prospects, vendor_analytics, vendor_outreach_log, ... |
| **MC (Management Companies)** | 8 | management_companies, management_company_members, mc_property_slots, company_category_settings, company_storefronts, team_member_permissions, ... |
| **Marketplace (e-commerce)** | 14 | marketplace_products, marketplace_vendors, marketplace_categories, marketplace_subcategories, marketplace_reviews, marketplace_orders (via orders), marketplace_promotions, marketplace_wishlist, ... |
| **Restaurants** | 7 | restaurants, restaurant_menus, restaurant_menu_categories, restaurant_menu_items, restaurant_hours, restaurant_availability, ... |
| **Yachts** | 5 | yachts, yacht_availability, yacht_external_calendars, yacht_pricing_rules, water_activities |
| **Real Estate (newbuilds)** | 7 | developers, development_units, nb_leads, nb_project_reports, nb_promotions, nb_special_terms, resale_properties |
| **Beauty/Wellness** | 6 | salons, salon_services, salon_staff, gyms, clinics, medical_services |
| **Transport** | 5 | vehicles, transport_destinations, transport_vehicle_types, transfers, airport_services |
| **AI & Automation** | 12 | ai_agents, ai_agent_logs, ai_agent_knowledge, ai_artifacts, ai_intake_sessions, ai_decisions_log, lifecycle_templates, lifecycle_executions, ... |
| **Marketing (MCC)** | 18 | mcc_campaigns, mcc_leads, mcc_creatives, mcc_landing_registry, mcc_ab_tests, mcc_automation_rules, mcc_funnel_events, mcc_sessions, mcc_user_states, ... |
| **Notifications & Comms** | 8 | notifications, notification_preferences, push_subscriptions, message_templates, booking_notifications_log, owner_notifications, ... |
| **Analytics & Metrics** | 15 | analytics_events, page_views, view_history, platform_metrics, vertical_metrics, cohort_analytics, cohort_metrics, funnel_analytics, geographic_metrics, vendor_analytics, ... |
| **Finance** | 10 | wallets, wallet_transactions, ledger_accounts, ledger_entries, owner_invoices, property_budgets, financial_categories, currency_rates, currencies, ... |
| **Gamification & Loyalty** | 8 | achievement_definitions, user_achievements, team_achievements, team_gamification, user_loyalty_status, guest_loyalty_tiers, cashback_settings, referral_codes, ... |
| **Reviews & Trust** | 6 | reviews, review_helpful, property_reviews, marketplace_reviews, trust_badges, provider_badges |
| **Legal & Insurance** | 6 | legal_documents, legal_acceptances, legal_services, insurance_providers, insurance_plans, terms_acceptances |
| **Content & Translations** | 5 | translations, tags, categories, category_groups, location_knowledge |
| **Social** | 2 | social_posts, social_content_calendar |
| **Life OS** | 10 | life_scenarios, life_situations, life_tasks, life_os_catalog, lifeos_governance, lifeos_health_view, lifeos_routes, vertical_life_tasks, vertical_task_coverage, ... |
| **Team & Staff** | 10 | team_members, team_channels, team_messages, team_activity_log, team_entity_notes, staff_members, staff_profiles, staff_documents, staff_property_assignments, ... |
| **Misc / System** | 15 | system_config, system_settings, platform_news, platform_events, platform_recommendations, data_provenance, data_quality_issues, moderation_queue, support_tickets, qa_test_runs, simulation_runs, ... |
| **Views (v_*)** | 4 | v_founder_inbox, v_marketplace_listings, v_owner_properties, v_unified_pipeline |

---

## 2. Optimization Opportunities

### 2.1 Tables to MERGE (reduce count by ~30)

| Merge Into | Absorb | Reason |
|------------|--------|--------|
| `bookings` | `tour_bookings`, `event_bookings`, `water_activity_bookings`, `airport_bookings` | All are bookings with type discriminator. Use `booking_type` column + JSONB `details` |
| `reviews` | `property_reviews`, `marketplace_reviews` | Already have `entity_type`/`entity_id` pattern. Single reviews table with polymorphic FK |
| `orders` + `order_items` | `pharmacy_orders` | Pharmacy is just another order type |
| `notifications` | `owner_notifications`, `booking_notifications_log` | Single notifications table with `channel` and `context` columns |
| `properties` | `resale_properties` | Resale is a property with `listing_type = 'resale'` |
| `vendor_bookings` | → use `bookings` with `provider_id` | Duplicate of bookings from vendor perspective — use a view instead |
| `crm_contact_notes` | `team_entity_notes` | Both are notes on entities — merge with `entity_type` discriminator |
| `property_listing_scores` + `catalog_hygiene_log` + `data_quality_issues` | → `data_quality_log` | All are quality/scoring records |
| `mcc_channel_metrics` + `vendor_analytics` + `vertical_metrics` | → `analytics_metrics` | Unified metrics with `source` discriminator |

### 2.2 Tables to DROP (unused / obsolete, ~15)

| Table | Reason |
|-------|--------|
| `simulation_runs`, `simulation_events`, `simulation_entity_links` | Dev/test simulation framework — not production |
| `qa_test_runs` | QA infrastructure, not user data |
| `platform_news` | Empty / unused content table |
| `pwa_installs` | Tracking table, can rebuild from analytics_events |
| `returning_guests` | Derivable from bookings (materialized view instead) |
| `featured_listings` | Redundant with `promoted_listings` |
| `catalog_life_map` | LifeOS mapping, derivable |
| `realtime_stats` | Ephemeral, rebuild on demand |
| `rate_limit_log` | Operational, use Edge Function level limiting |
| `security_audit_log` | Can merge into `admin_audit_logs` |

### 2.3 Tables to convert to VIEWS (~8)

| Current Table | Convert To |
|---------------|------------|
| `v_founder_inbox` | Already a view |
| `v_marketplace_listings` | Already a view |
| `v_owner_properties` | Already a view |
| `v_unified_pipeline` | Already a view |
| `returning_guests` | Materialized view from `bookings` |
| `vendor_bookings` | View on `bookings WHERE provider_id IS NOT NULL` |
| `owner_performance_metrics` | Materialized view from financials + bookings |
| `cross_sell_metrics` | Materialized view from booking_cross_sell_offers |

### 2.4 Estimated Post-Optimization

| Metric | Before | After |
|--------|--------|-------|
| Tables | 417 | ~360 |
| Views | 4 | ~12 |
| Migrations | 514 | 1 (squashed) |
| Untyped tables | 7 | 0 |

---

## 3. Migration Strategy

### Phase 1: Prepare New Supabase Project (Day 1)

1. Create new Supabase project `myuno-prod` on your own org
2. Set up same extensions: `uuid-ossp`, `pg_trgm`, `pgcrypto`
3. Configure auth settings (email, magic link, redirect URLs)
4. Set up Storage buckets (same as current: avatars, listings, documents, etc.)

### Phase 2: Schema Export & Squash (Day 1-2)

```bash
# Dump schema from Lovable project
pg_dump --schema-only --no-owner --no-privileges \
  -h db.erfwtoavipwjqmylpizt.supabase.co \
  -U postgres -d postgres > schema_full.sql

# Dump data
pg_dump --data-only --no-owner --no-privileges \
  --disable-triggers \
  -h db.erfwtoavipwjqmylpizt.supabase.co \
  -U postgres -d postgres > data_full.sql
```

Create a single squashed migration from the schema dump:
```
supabase/migrations/00000000000000_initial_schema.sql
```

### Phase 3: Apply Optimizations (Day 2-3)

Create optimization migration:
```
supabase/migrations/00000000000001_optimize_schema.sql
```

This migration:
- Merges booking tables into `bookings` with `booking_type` + `details JSONB`
- Merges review tables into `reviews` with `entity_type`
- Converts redundant tables to views
- Drops unused tables (after data verification)
- Adds missing indexes identified during audit

### Phase 4: Data Migration (Day 3-4)

```bash
# Restore schema to new project
psql -h db.NEW_PROJECT_ID.supabase.co \
  -U postgres -d postgres < schema_full.sql

# Restore data
psql -h db.NEW_PROJECT_ID.supabase.co \
  -U postgres -d postgres < data_full.sql

# Apply optimizations
supabase db push --linked
```

### Phase 5: Update Frontend Config (Day 4)

1. Update `.env`:
   ```
   VITE_SUPABASE_URL=https://NEW_PROJECT_ID.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=new_anon_key
   ```

2. Update `index.html` CSP `connect-src` with new Supabase URL

3. Update `src/components/ui/optimized-image.tsx` — already dynamic (reads from env)

4. Regenerate types:
   ```bash
   npx supabase gen types typescript --linked > src/integrations/supabase/types.ts
   ```

5. Remove `src/lib/untypedTables.ts` — all tables now in generated types

### Phase 6: Edge Functions & Secrets (Day 4-5)

1. Deploy all edge functions to new project:
   ```bash
   supabase functions deploy --linked
   ```

2. Set secrets on new project:
   ```bash
   supabase secrets set GOOGLE_MAPS_API_KEY=xxx
   supabase secrets set STRIPE_SECRET_KEY=xxx
   supabase secrets set RESEND_API_KEY=xxx
   # ... all other secrets
   ```

3. Update Stripe webhook URL to new project
4. Update any external integrations (WhatsApp webhook, Telegram, etc.)

### Phase 7: DNS & Cutover (Day 5)

1. Put Lovable site in maintenance mode
2. Final data sync (delta dump of data changed since Phase 4)
3. Update Vercel/hosting env vars
4. Verify all edge functions
5. Test critical flows: auth, bookings, payments
6. Go live

---

## 4. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Data loss during migration | Full pg_dump backup before any changes; keep Lovable project read-only during cutover |
| Auth tokens invalidated | Users will need to re-login (expected); PIN auth tokens will reset |
| Stripe webhooks break | Update webhook URL before cutover; test with Stripe CLI |
| RLS policies missing | Schema dump includes all policies; verify with test queries |
| Edge function secrets missing | Document all secrets before migration; verify with admin-secrets-status function |
| Realtime subscriptions break | Same table names = same subscription config; just new connection URL |

---

## 5. Post-Migration Cleanup

1. Delete `ARCHITECTURE_AUDIT.md` and `MIGRATION_PLAN.md` from repo
2. Delete `src/lib/untypedTables.ts` (all tables in types now)
3. Remove all `as any` casts from hooks (types regenerated)
4. Update `supabase/config.toml` with new project ID
5. Archive Lovable project (don't delete for 30 days)