#!/usr/bin/env node
/**
 * Export data from Lovable-hosted Supabase via REST API.
 *
 * Usage:
 *   node scripts/export-data.mjs
 *
 * Outputs JSON files to tmp/export/<table>.json
 * Handles pagination (1000 rows per request).
 * Logs tables blocked by RLS.
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// ── Lovable (source) credentials ──
const SOURCE_URL = 'https://kakkwibljrjsawxgnupk.supabase.co';
const SOURCE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtha2t3aWJsanJqc2F3eGdudXBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MDM3MDAsImV4cCI6MjA4MzQ3OTcwMH0.0UOwpxLxDdxh_hpS_KXf_xnArkJjKCMmMXh_s5y5Cmk';

const supabase = createClient(SOURCE_URL, SOURCE_ANON_KEY);
const OUT_DIR = join(process.cwd(), 'tmp', 'export');

// All 291 tables actually referenced in code
const TABLES = [
  'achievement_definitions','admin_audit_logs','agent_deal_activities','agent_deals',
  'ai_agent_knowledge','ai_agent_logs','ai_agents','ai_artifacts',
  'analytics_events','babysitters','booking_cross_sell_offers',
  'booking_inventory_reports','booking_message_rules','booking_messages',
  'booking_meter_readings','booking_notifications_log','booking_operations',
  'booking_status_history','booking_vouchers','bookings','bouquets',
  'calendar_sync_logs','cancellation_policies','cart_items','cashback_settings',
  'catalog_facet_definitions','catalog_life_map','categories','category_groups',
  'category_suggestions','chat_message_flags','chat_violation_history',
  'checklist_completions','cities','cohort_analytics',
  'company_category_settings','company_storefronts','consultation_requests',
  'contact_tags','crm_access_log','crm_activities','crm_contact_notes',
  'crm_contacts','crm_custom_options','crm_documents','crm_tasks',
  'currency_rates','deal_field_changes','deal_pipeline_stages',
  'deal_scheduled_activities','developers','development_units','doctors',
  'events','experience_categories','experience_media','experience_pricing',
  'favorites','featured_listings','financial_categories','flower_addons',
  'flower_shops','funnel_analytics','guest_check_in_data','gyms',
  'insurance_plans','insurance_providers','inventory_inspections',
  'investment_interests','investment_projects','juristic_contacts',
  'juristic_requests','lead_activity_log','legal_acceptances',
  'legal_documents','legal_services','life_situations','lifecycle_executions',
  'lifecycle_templates','lifeos_governance','lifeos_health_view','lifeos_routes',
  'listing_applications','listings','location_knowledge','lookup_values',
  'management_companies','management_company_members','management_terms_activity',
  'marketplace_categories','marketplace_delivery_settings',
  'marketplace_international_shipping','marketplace_product_attributes',
  'marketplace_products','marketplace_promo_codes','marketplace_promotions',
  'marketplace_reviews','marketplace_subcategories','marketplace_vendors',
  'mc_property_slots','mcc_ab_tests','mcc_ai_recommendations',
  'mcc_automation_rules','mcc_campaign_rules','mcc_campaigns',
  'mcc_channel_metrics','mcc_creatives','mcc_landing_events',
  'mcc_landing_registry','mcc_leads','mcc_state_history','mcc_user_states',
  'medical_services','message_templates','moderation_queue','nb_leads',
  'notification_preferences','notifications','order_item_flower_details',
  'order_item_transport_details','order_item_yacht_details','order_items',
  'order_participants','order_status_history','orders','org_members','orgs',
  'ota_listing_connections','ota_sync_logs','ota_synced_listings',
  'owner_invoices','owner_notifications','owner_performance_metrics',
  'owner_portal_settings','owner_report_preferences','owner_reports',
  'owner_service_vendors','owner_vault_files','page_views',
  'partner_applications','payment_intents','personal_reminders',
  'pharmacies','pharmacy_products','platform_events','platform_metrics',
  'platform_news','platform_recommendations','portal_messages',
  'pricing_recommendations','profiles','project_requests','properties',
  'property_activity_log','property_analytics','property_availability',
  'property_bookings','property_budgets','property_chat_messages',
  'property_checklist_templates','property_complexes','property_delegates',
  'property_documents','property_external_calendars','property_financials',
  'property_guidebook','property_inquiries','property_inspections',
  'property_inventory_items','property_key_assignments',
  'property_listing_scores','property_maintenance_schedules',
  'property_management_requests','property_management_terms',
  'property_manager_assignments','property_meters','property_notes',
  'property_operational_tasks','property_ownership_invites',
  'property_passport_events','property_projects','property_promotions',
  'property_rate_seasons','property_reports','property_reviews',
  'property_service_requests','property_utility_schedules','provider_badges',
  'provider_contracts','provider_input_rules','provider_payout_methods',
  'providers','push_subscriptions','pwa_installs','qa_test_runs',
  'quick_listings','realtime_stats','referral_settings','referrals',
  'resale_properties','resources','restaurant_menu_categories',
  'restaurant_menu_items','restaurants','returning_guests','review_helpful',
  'reviews','salon_staff','salons','service_orders','service_promotions',
  'services','staff_documents','staff_members','staff_profiles',
  'staff_property_assignments','stores','subscription_plans',
  'support_tickets','sys_intake_configs','sys_lead_configs','system_config',
  'system_settings','task_comments','taxonomy_definitions',
  'taxonomy_normalization','team_achievements','team_activity_log',
  'team_channels','team_entity_notes','team_gamification',
  'team_members','team_messages','team_user_achievements',
  'terms_acceptances','ticket_messages','translations',
  'transport_destinations','transport_vehicle_types','trust_badges',
  'uno_team_permissions','user_achievements','user_active_context',
  'user_addresses','user_analytics_daily','user_documents','user_events',
  'user_listings','user_payment_methods','user_personas','user_pins',
  'user_roles','user_segments','user_sessions','vendor_analytics',
  'vendor_bookings','vendor_documents','vendor_location_services',
  'vendor_locations','vendor_outreach_templates','vendor_payouts',
  'vendor_performance_reviews','vendor_prospect_activity','vendor_prospects',
  'vendor_services','vendor_subscriptions','vertical_commission_rules',
  'vertical_subscriptions','veterinary_clinics','view_history','visa_records',
  'visa_services','wallet_transactions','wallets','water_activities',
  'yacht_availability','yacht_external_calendars','yacht_pricing_rules',
];

async function exportTable(table) {
  const allRows = [];
  let offset = 0;
  const PAGE = 1000;

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .range(offset, offset + PAGE - 1)
      .order('id', { ascending: true, nullsFirst: false });

    if (error) {
      // Try without ordering by id (some tables don't have id)
      const { data: d2, error: e2 } = await supabase
        .from(table)
        .select('*')
        .range(offset, offset + PAGE - 1);

      if (e2) return { table, count: 0, error: e2.message };
      if (!d2 || d2.length === 0) break;
      allRows.push(...d2);
      if (d2.length < PAGE) break;
      offset += PAGE;
      continue;
    }

    if (!data || data.length === 0) break;
    allRows.push(...data);
    if (data.length < PAGE) break;
    offset += PAGE;
  }

  return { table, count: allRows.length, rows: allRows };
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  console.log(`\n📦 Exporting ${TABLES.length} tables from Lovable Supabase...\n`);

  const results = { exported: [], empty: [], blocked: [], errors: [] };

  for (const table of TABLES) {
    const result = await exportTable(table);

    if (result.error) {
      results.errors.push({ table, error: result.error });
      console.log(`  ❌ ${table}: ERROR — ${result.error}`);
    } else if (result.count === 0) {
      results.empty.push(table);
      console.log(`  ⬜ ${table}: 0 rows (empty or RLS blocked)`);
    } else {
      results.exported.push({ table, count: result.count });
      const path = join(OUT_DIR, `${table}.json`);
      writeFileSync(path, JSON.stringify(result.rows, null, 2));
      console.log(`  ✅ ${table}: ${result.count} rows`);
    }
  }

  // Write summary
  const summary = {
    timestamp: new Date().toISOString(),
    source: SOURCE_URL,
    tablesExported: results.exported.length,
    tablesEmpty: results.empty.length,
    tablesWithErrors: results.errors.length,
    totalRows: results.exported.reduce((s, t) => s + t.count, 0),
    details: results,
  };

  writeFileSync(join(OUT_DIR, '_summary.json'), JSON.stringify(summary, null, 2));

  console.log(`\n── Summary ──`);
  console.log(`  Exported: ${results.exported.length} tables (${summary.totalRows} total rows)`);
  console.log(`  Empty:    ${results.empty.length} tables`);
  console.log(`  Errors:   ${results.errors.length} tables`);
  console.log(`  Output:   ${OUT_DIR}/\n`);
}

main().catch(console.error);
