/**
 * @module untypedTables
 * @description Type-safe wrappers for tables not yet in generated Supabase types.
 * 
 * These tables exist in the database but are missing from types.ts
 * (likely added via migrations after last type generation).
 * This wrapper isolates all type casts to one place and provides
 * typed query builders via generics.
 * 
 * USAGE:
 *   import { typedFrom } from '@/lib/untypedTables';
 *   const { data } = await typedFrom<MyRow>('my_table').select('*');
 * 
 * For pre-defined tables, use the named accessors:
 *   import { untypedTables } from '@/lib/untypedTables';
 *   const { data } = await untypedTables.analyticsEvents().select('*');
 */
import { supabase } from '@/integrations/supabase/client';
import type { PostgrestQueryBuilder } from '@supabase/postgrest-js';

// ============= Generic typed accessor =============

/**
 * Type-safe query builder for tables missing from auto-generated types.
 * Casts once here so consumers get proper intellisense for Row type.
 * 
 * @example
 *   interface MyRow { id: string; name: string; }
 *   const { data } = await typedFrom<MyRow>('my_table').select('*');
 *   // data is MyRow[] | null
 */
export function typedFrom<Row extends Record<string, unknown> = Record<string, unknown>>(
  table: string
): PostgrestQueryBuilder<never, { Row: Row; Insert: Partial<Row>; Update: Partial<Row>; Relationships: [] }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from(table);
}

// ============= Pre-defined table accessors =============

// --- Row interfaces for common untyped tables ---

export interface AnalyticsEventRow {
  id: string;
  user_id: string | null;
  session_id: string | null;
  event_name: string;
  event_data: Record<string, unknown> | null;
  page_path: string | null;
  referrer: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface OwnerProspectRow {
  id: string;
  owner_name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  property_type: string | null;
  property_location: string | null;
  source: string | null;
  status: 'new' | 'contacted' | 'interested' | 'converted' | 'lost';
  notes: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface SocialPostRow {
  id: string;
  [key: string]: unknown;
}

export interface SocialContentCalendarRow {
  id: string;
  [key: string]: unknown;
}

export interface PromotedListingRow {
  id: string;
  [key: string]: unknown;
}

export interface DisputeRow {
  id: string;
  [key: string]: unknown;
}

export interface AiDecisionsLogRow {
  id: string;
  [key: string]: unknown;
}

export interface ContactPropertyRow {
  id: string;
  contact_id: string;
  property_id: string;
  relationship_type: string;
  company_id: string;
  created_at: string;
}

export interface TeamMemberPermissionRow {
  id: string;
  company_id: string;
  user_id: string;
  module: string;
  can_view: boolean;
  can_edit: boolean;
  can_export: boolean;
  sub_permissions: Record<string, boolean>;
  granted_by: string | null;
  updated_at: string;
}

export interface OwnerPortalSettingsRow {
  id: string;
  property_id: string;
  owner_user_id: string;
  [key: string]: unknown;
}

export interface PropertyDelegateRow {
  id: string;
  property_id: string;
  user_id: string | null;
  invited_email: string | null;
  status: string;
  [key: string]: unknown;
}

export interface PropertyPayoutRuleRow {
  id: string;
  property_id: string;
  management_terms_id: string | null;
  recipient_type: string;
  recipient_staff_id: string | null;
  recipient_name: string | null;
  commission_type: string;
  commission_value: number;
  deduct_before_owner: boolean;
  min_payout: number | null;
  payout_frequency: string;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PropertyPriceOfferRow {
  id: string;
  property_id: string;
  booking_id: string | null;
  guest_user_id: string | null;
  type: 'special_offer' | 'negotiation_request' | 'counter_offer';
  original_price: number;
  offered_price: number;
  discount_percent: number | null;
  valid_from: string;
  valid_until: string;
  nights: number | null;
  message: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'countered';
  created_by: string;
  responded_at: string | null;
  response_message: string | null;
  created_at: string;
}

export interface CrmPipelineRow {
  id: string;
  company_id: string;
  name_en: string;
  name_ru: string;
  pipeline_type: string;
  is_default: boolean;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface CrmPipelineStageRow {
  id: string;
  pipeline_id: string;
  name_en: string;
  name_ru: string;
  probability: number;
  color: string | null;
  sort_order: number;
  is_won: boolean;
  is_lost: boolean;
}

export interface PropertyAccountingPolicyRow {
  id: string;
  property_id: string;
  [key: string]: unknown;
}

export interface CrmContactNoteRow {
  id: string;
  contact_id: string;
  [key: string]: unknown;
}

export interface ContactRelationshipRow {
  id: string;
  [key: string]: unknown;
}

export interface CrmReminderRow {
  id: string;
  [key: string]: unknown;
}

// ============= Named accessors =============

export const untypedTables = {
  aiDecisionsLog: () => typedFrom<AiDecisionsLogRow>('ai_decisions_log'),
  socialPosts: () => typedFrom<SocialPostRow>('social_posts'),
  socialContentCalendar: () => typedFrom<SocialContentCalendarRow>('social_content_calendar'),
  ownerProspects: () => typedFrom<OwnerProspectRow>('owner_prospects'),
  promotedListings: () => typedFrom<PromotedListingRow>('promoted_listings'),
  disputes: () => typedFrom<DisputeRow>('disputes'),
  analyticsEvents: () => typedFrom<AnalyticsEventRow>('analytics_events'),
  contactProperties: () => typedFrom<ContactPropertyRow>('contact_properties'),
  teamMemberPermissions: () => typedFrom<TeamMemberPermissionRow>('team_member_permissions'),
  ownerPortalSettings: () => typedFrom<OwnerPortalSettingsRow>('owner_portal_settings'),
  propertyDelegates: () => typedFrom<PropertyDelegateRow>('property_delegates'),
  propertyPayoutRules: () => typedFrom<PropertyPayoutRuleRow>('property_payout_rules'),
  propertyPriceOffers: () => typedFrom<PropertyPriceOfferRow>('property_price_offers'),
  crmPipelines: () => typedFrom<CrmPipelineRow>('crm_pipelines'),
  crmPipelineStages: () => typedFrom<CrmPipelineStageRow>('crm_pipeline_stages'),
  propertyAccountingPolicies: () => typedFrom<PropertyAccountingPolicyRow>('property_accounting_policies'),
  crmContactNotes: () => typedFrom<CrmContactNoteRow>('crm_contact_notes'),
  contactRelationships: () => typedFrom<ContactRelationshipRow>('contact_relationships'),
  crmReminders: () => typedFrom<CrmReminderRow>('crm_reminders'),
} as const;
