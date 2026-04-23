/**
 * Contact types for CRM module (myUNO / Ignatev Estate)
 * Aligns with crm_contacts, contact_properties, contact_relationships, crm_reminders
 */

/** CRM persona roles (multi-select on crm_contacts.crm_roles) */
export const CRM_ROLES = [
  'owner',
  'tenant',
  'investor',
  'prospect',
  'partner',
  'agent',
  'tourist',
  'resident',
  'developer',
  'buyer',
  'other',
] as const;
export type CrmRole = (typeof CRM_ROLES)[number];

export const CRM_ROLE_LABELS: Record<CrmRole, { en: string; ru: string }> = {
  owner: { en: 'Owner', ru: 'Собственник' },
  tenant: { en: 'Tenant', ru: 'Арендатор' },
  investor: { en: 'Investor', ru: 'Инвестор' },
  prospect: { en: 'Prospect', ru: 'Потенциальный клиент' },
  partner: { en: 'Partner', ru: 'Партнёр' },
  agent: { en: 'Agent', ru: 'Агент' },
  tourist: { en: 'Tourist', ru: 'Турист' },
  resident: { en: 'Resident', ru: 'Резидент' },
  developer: { en: 'Developer', ru: 'Застройщик' },
  buyer: { en: 'Buyer', ru: 'Покупатель' },
  other: { en: 'Other', ru: 'Другое' },
};

export function isCrmRole(value: string): value is CrmRole {
  return (CRM_ROLES as readonly string[]).includes(value);
}

/** Contact segments */
export const CONTACT_SEGMENTS = [
  'investor', 'buyer', 'seller', 'owner', 'tenant', 'guest', 'broker', 'developer', 'vendor',
] as const;
export type ContactSegment = (typeof CONTACT_SEGMENTS)[number];

export const CONTACT_SEGMENT_LABELS: Record<ContactSegment, { en: string; ru: string }> = {
  investor: { en: 'Investor', ru: 'Инвестор' },
  buyer: { en: 'Buyer', ru: 'Покупатель' },
  seller: { en: 'Seller', ru: 'Продавец' },
  owner: { en: 'Owner', ru: 'Собственник' },
  tenant: { en: 'Tenant', ru: 'Арендатор' },
  guest: { en: 'Guest', ru: 'Гость' },
  broker: { en: 'Broker', ru: 'Брокер' },
  developer: { en: 'Developer', ru: 'Застройщик' },
  vendor: { en: 'Vendor', ru: 'Поставщик' },
};

/** HNW (High Net Worth) tier */
export const HNW_TIERS = ['standard', 'hnw', 'uhnw'] as const;
export type HnwTier = (typeof HNW_TIERS)[number];

export const HNW_TIER_LABELS: Record<HnwTier, { en: string; ru: string; color: string }> = {
  standard: { en: 'Standard', ru: 'Стандарт', color: 'bg-muted text-muted-foreground border-border' },
  hnw: { en: 'HNW', ru: 'HNW', color: 'bg-warning/15 text-warning border-warning/30' },
  uhnw: { en: 'UHNW', ru: 'UHNW', color: 'bg-accent/15 text-accent border-accent/40/30' },
};

/** AML/KYC status */
export const KYC_STATUSES = ['not_started', 'pending', 'approved', 'rejected', 'expired'] as const;
export type KycStatus = (typeof KYC_STATUSES)[number];

export const KYC_STATUS_LABELS: Record<KycStatus, { en: string; ru: string; color: string }> = {
  not_started: { en: 'Not Started', ru: 'Не начат', color: 'bg-muted text-muted-foreground' },
  pending: { en: 'Pending', ru: 'В процессе', color: 'bg-warning/15 text-warning' },
  approved: { en: 'Approved', ru: 'Одобрен', color: 'bg-success/15 text-success' },
  rejected: { en: 'Rejected', ru: 'Отклонён', color: 'bg-destructive/15 text-destructive' },
  expired: { en: 'Expired', ru: 'Истёк', color: 'bg-muted text-muted-foreground' },
};

/** Contact categories */
export const CONTACT_CATEGORIES = ['person', 'company', 'household'] as const;
export type ContactCategory = (typeof CONTACT_CATEGORIES)[number];

export const CONTACT_CATEGORY_LABELS: Record<ContactCategory, { en: string; ru: string }> = {
  person: { en: 'Person', ru: 'Физлицо' },
  company: { en: 'Company', ru: 'Компания' },
  household: { en: 'Household', ru: 'Домохозяйство' },
};

/** Contact ↔ Contact relationship types */
export const CONTACT_RELATIONSHIP_TYPES = [
  'spouse',
  'partner',
  'friend',
  'colleague',
  'referred_by',
  'family',
  'other',
] as const;
export type ContactRelationshipType = (typeof CONTACT_RELATIONSHIP_TYPES)[number];

export const CONTACT_RELATIONSHIP_LABELS: Record<ContactRelationshipType, { en: string; ru: string }> = {
  spouse: { en: 'Spouse', ru: 'Супруг(а)' },
  partner: { en: 'Partner', ru: 'Партнёр' },
  friend: { en: 'Friend', ru: 'Друг' },
  colleague: { en: 'Colleague', ru: 'Коллега' },
  referred_by: { en: 'Referred by', ru: 'По рекомендации' },
  family: { en: 'Family', ru: 'Семья' },
  other: { en: 'Other', ru: 'Другое' },
};

/** Key date entry (lease start, visa expiry, etc.) */
export interface KeyDateEntry {
  label: string;
  date: string; // ISO date
}

/** Reminder entry */
export interface CrmReminder {
  id: string;
  contact_id: string;
  company_id: string;
  reminder_at: string;
  note: string | null;
  is_repeating: boolean;
  repeat_rule: string | null;
  created_by: string | null;
  created_at: string;
  is_dismissed: boolean;
  dismissed_at: string | null;
}

/** Contact relationship (contact ↔ contact) */
export interface ContactRelationship {
  id: string;
  contact_id: string;
  related_contact_id: string;
  relationship_type: ContactRelationshipType;
  company_id: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  related_contact?: {
    id: string;
    first_name: string;
    last_name: string;
    company_name: string | null;
    avatar_url: string | null;
  };
}

/** Canonical CRM contact interface — mirrors crm_contacts DB schema */
export interface CrmContact {
  id: string;
  company_id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  phone2: string | null;
  mobile: string | null;
  email: string | null;
  whatsapp: string | null;
  telegram: string | null;
  line_id: string | null;
  instagram: string | null;
  facebook: string | null;
  linkedin: string | null;
  nationality: string | null;
  language: string | null;
  source: string | null;
  contact_type: string | null;
  company_name: string | null;
  job_title: string | null;
  budget_min: number | null;
  budget_max: number | null;
  currency: string | null;
  preferred_districts: string[] | null;
  preferred_types: string[] | null;
  bedrooms_min: number | null;
  notes: string | null;
  tags: string[] | null;
  avatar_url: string | null;
  is_archived: boolean;
  is_company: boolean;
  created_by: string | null;
  birthday: string | null;
  family_info: string | null;
  interests: string[] | null;
  scoring: number | null;
  lead_score: number | null;
  lead_temperature: string | null;
  lifecycle_stage: string | null;
  linked_user_id: string | null;
  special_notes: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relation: string | null;
  created_at: string;
  updated_at: string;
  deal_count?: number;
  crm_roles?: string[] | null;
  key_dates?: Array<{ label: string; date: string }> | null;
  // Odoo-style address fields
  address_street: string | null;
  address_street2: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  address_country: string | null;
  tax_id: string | null;
  website: string | null;
  is_vip: boolean;
  marital_status: string | null;
  // Extended classification
  contact_category: string | null;
  passport_country: string | null;
  tax_residency: string | null;
  segment: string[] | null;
  hnw_tier: string | null;
  aml_kyc_status: string | null;
  aml_kyc_date: string | null;
  pep_flag: boolean;
  sanctions_flag: boolean;
  preferences: Record<string, unknown> | null;
  ai_summary: string | null;
  last_activity_at: string | null;
  owner_user_id: string | null;
}

export type CrmContactInsert = Omit<
  CrmContact,
  'id' | 'created_at' | 'updated_at' | 'deal_count' |
  'job_title' | 'birthday' | 'family_info' | 'interests' | 'scoring' | 'mobile' | 'is_company' |
  'address_street' | 'address_street2' | 'address_city' | 'address_state' | 'address_zip' | 'address_country' |
  'tax_id' | 'website' | 'lead_score' | 'lead_temperature' | 'lifecycle_stage' | 'linked_user_id' |
  'special_notes' | 'emergency_contact_name' | 'emergency_contact_phone' | 'emergency_contact_relation' |
  'instagram' | 'facebook' | 'linkedin' | 'is_vip' | 'marital_status' | 'contact_category' |
  'passport_country' | 'tax_residency' | 'segment' | 'hnw_tier' | 'aml_kyc_status' | 'aml_kyc_date' |
  'pep_flag' | 'sanctions_flag' | 'preferences' | 'ai_summary' | 'last_activity_at' | 'owner_user_id'
> & {
  job_title?: string | null;
  birthday?: string | null;
  family_info?: string | null;
  interests?: string[] | null;
  scoring?: number | null;
  mobile?: string | null;
  is_company?: boolean;
  address_street?: string | null;
  address_street2?: string | null;
  address_city?: string | null;
  address_state?: string | null;
  address_zip?: string | null;
  address_country?: string | null;
  tax_id?: string | null;
  website?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  linkedin?: string | null;
  lead_score?: number | null;
  lead_temperature?: string | null;
  lifecycle_stage?: string | null;
  linked_user_id?: string | null;
  special_notes?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_relation?: string | null;
  is_vip?: boolean;
  marital_status?: string | null;
  contact_category?: string | null;
  passport_country?: string | null;
  tax_residency?: string | null;
  segment?: string[] | null;
  hnw_tier?: string | null;
  aml_kyc_status?: string | null;
  aml_kyc_date?: string | null;
  pep_flag?: boolean;
  sanctions_flag?: boolean;
  preferences?: Record<string, unknown> | null;
  ai_summary?: string | null;
  last_activity_at?: string | null;
  owner_user_id?: string | null;
};

export type CrmContactUpdate = Partial<CrmContactInsert>;

/** @deprecated Use CrmContact — CrmContactExtended is a subset and will be removed */
export type CrmContactExtended = Pick<
  CrmContact,
  'id' | 'company_id' | 'first_name' | 'last_name' | 'crm_roles' | 'contact_type' |
  'phone' | 'email' | 'whatsapp' | 'telegram' | 'language' | 'source' | 'linked_user_id' |
  'birthday' | 'key_dates' | 'tags' | 'avatar_url' | 'lifecycle_stage' | 'created_at' | 'updated_at'
> & Record<string, unknown>;
