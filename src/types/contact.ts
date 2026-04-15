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

/** Extended contact with new fields (crm_roles, key_dates) */
export interface CrmContactExtended {
  id: string;
  company_id: string;
  first_name: string;
  last_name: string;
  crm_roles?: CrmRole[] | null;
  contact_type: string | null;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  telegram: string | null;
  language: string | null;
  source: string | null;
  linked_user_id: string | null;
  birthday: string | null;
  key_dates?: KeyDateEntry[];
  tags: string[] | null;
  avatar_url: string | null;
  lifecycle_stage: string | null;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}
