/**
 * @module untypedTables
 * @description Typed accessors for tables that were missing from generated Supabase types.
 *
 * Most tables here are now present in types.ts — their named accessors call
 * supabase.from() directly and return a properly-typed query builder.
 * Only a handful of tables remain truly untyped (crm_reminders, social_posts,
 * owner_prospects) and still use the typedFrom() escape hatch.
 *
 * USAGE for remaining untyped tables:
 *   import { typedFrom } from '@/lib/untypedTables';
 *   const { data } = await typedFrom('my_table').select('*');
 *
 * For pre-defined tables:
 *   import { untypedTables } from '@/lib/untypedTables';
 *   const { data } = await untypedTables.crmPipelines().select('*');
 */
import { supabase } from '@/integrations/supabase/client';
// ============= Generic typed accessor =============

/**
 * Type-safe query builder for tables missing from auto-generated types.
 * Casts once here so consumers get proper intellisense for Row type.
 * 
 * The return type is intentionally broad to avoid coupling to
 * internal PostgREST generics that change between SDK versions.
 * Consumers cast the result via `as T[]` after `.select()`.
 * 
 * @example
 *   const { data } = await typedFrom('my_table').select('*');
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function typedFrom(table: string): any {
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
  // --- Tables NOT yet in generated types (truly untyped) ---
  aiDecisionsLog: () => typedFrom('ai_decisions_log'),
  socialPosts: () => typedFrom('social_posts'),
  socialContentCalendar: () => typedFrom('social_content_calendar'),
  ownerProspects: () => typedFrom('owner_prospects'),
  crmReminders: () => typedFrom('crm_reminders'),
  contactProperties: () => typedFrom('contact_properties'),

  // --- Tables now in generated types — supabase.from() returns typed builder ---
  analyticsEvents: () => supabase.from('analytics_events'),
  contactRelationships: () => supabase.from('contact_relationships'),
  teamMemberPermissions: () => supabase.from('team_member_permissions'),
  ownerPortalSettings: () => supabase.from('owner_portal_settings'),
  propertyDelegates: () => supabase.from('property_delegates'),
  propertyPayoutRules: () => supabase.from('property_payout_rules'),
  propertyPriceOffers: () => supabase.from('property_price_offers'),
  propertyAccountingPolicies: () => supabase.from('property_accounting_policies'),
  promotedListings: () => supabase.from('promoted_listings'),
  disputes: () => supabase.from('disputes'),
  crmPipelines: () => supabase.from('crm_pipelines'),
  crmPipelineStages: () => supabase.from('crm_pipeline_stages'),
  crmContactNotes: () => supabase.from('crm_contact_notes'),
  crmEmails: () => supabase.from('crm_emails'),
  crmCommTemplates: () => supabase.from('crm_comm_templates'),
  crmSequences: () => supabase.from('crm_sequences'),
  crmSequenceSteps: () => supabase.from('crm_sequence_steps'),
  crmSequenceEnrollments: () => supabase.from('crm_sequence_enrollments'),
  crmWorkflows: () => supabase.from('crm_workflows'),
  crmWorkflowActions: () => supabase.from('crm_workflow_actions'),
  crmMeetings: () => supabase.from('crm_meetings'),
  crmWebForms: () => supabase.from('crm_web_forms'),
  crmQuotes: () => supabase.from('crm_quotes'),
  crmCustomFields: () => supabase.from('crm_custom_fields'),
  crmCustomFieldValues: () => supabase.from('crm_custom_field_values'),
  crmScoringRules: () => supabase.from('crm_scoring_rules'),
  crmCompanies: () => supabase.from('crm_companies'),
  crmAssignmentRules: () => supabase.from('crm_assignment_rules'),
  crmActivities: () => supabase.from('crm_activities'),
  mccLeads: () => supabase.from('mcc_leads'),
  vendorOutreachLog: () => supabase.from('vendor_outreach_log'),
} as const;
