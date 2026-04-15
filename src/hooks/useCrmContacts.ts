import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { sanitizeSearchTerm } from '@/lib/sanitizeSearch';
import { fireCrmWorkflowTrigger } from '@/lib/crmWorkflowTrigger';
import { formatPostgrestError } from '@/lib/postgrestError';
import { toast } from 'sonner';

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
  // Contact card redesign
  crm_roles?: string[] | null;
  key_dates?: Array<{ label: string; date: string }> | null;
  // Odoo-style fields
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
}

export type CrmContactInsert = Omit<CrmContact, 'id' | 'created_at' | 'updated_at' | 'job_title' | 'birthday' | 'family_info' | 'interests' | 'scoring' | 'deal_count' | 'mobile' | 'is_company' | 'address_street' | 'address_street2' | 'address_city' | 'address_state' | 'address_zip' | 'address_country' | 'tax_id' | 'website' | 'lead_score' | 'lead_temperature' | 'lifecycle_stage' | 'linked_user_id' | 'special_notes' | 'emergency_contact_name' | 'emergency_contact_phone' | 'emergency_contact_relation' | 'instagram' | 'facebook' | 'linkedin' | 'is_vip' | 'marital_status'> & {
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
};
export type CrmContactUpdate = Partial<CrmContactInsert>;

/** Legacy union — prefer `crm_custom_options` (contact_type / lead_source) for UI labels. */
export const CONTACT_TYPES = [
  'buyer', 'seller', 'investor', 'tenant', 'landlord', 'agent',
  'developer', 'broker', 'tourist', 'resident', 'corporate', 'services',
] as const;

// Use select('*') for robustness — avoids failures when schema has extra/missing columns
export const CONTACT_SOURCES = [
  'website', 'referral', 'walk-in', 'social', 'social_media', 'agent_network', 'other',
  'instagram', 'facebook', 'telegram', 'youtube', 'google_ads', 'meta_ads', 'email_campaign',
  'event_expo', 'cold_outreach', 'chat_widget', 'partner', 'repeat_client',
] as const;
export const CONTACT_TAGS = ['VIP', 'hot', 'warm', 'cold', 'follow-up', 'priority'] as const;

const RU_TO_EN_MAP: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
  х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

const EN_TO_RU_MAP: Record<string, string> = {
  a: 'а', b: 'б', c: 'к', d: 'д', e: 'е', f: 'ф', g: 'г', h: 'х', i: 'и', j: 'дж', k: 'к',
  l: 'л', m: 'м', n: 'н', o: 'о', p: 'п', q: 'к', r: 'р', s: 'с', t: 'т', u: 'у', v: 'в',
  w: 'в', x: 'кс', y: 'й', z: 'з',
};

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function translitRuToEn(value: string): string {
  return normalizeSearchText(value)
    .split('')
    .map((char) => RU_TO_EN_MAP[char] ?? char)
    .join('');
}

function translitEnToRu(value: string): string {
  return normalizeSearchText(value)
    .split('')
    .map((char) => EN_TO_RU_MAP[char] ?? char)
    .join('');
}

function makeBigrams(value: string): Set<string> {
  const normalized = normalizeSearchText(value).replace(/\s+/g, '');
  const set = new Set<string>();
  if (normalized.length <= 1) {
    if (normalized) set.add(normalized);
    return set;
  }
  for (let i = 0; i < normalized.length - 1; i += 1) {
    set.add(normalized.slice(i, i + 2));
  }
  return set;
}

function diceCoefficient(a: string, b: string): number {
  const aBigrams = makeBigrams(a);
  const bBigrams = makeBigrams(b);
  if (!aBigrams.size || !bBigrams.size) return 0;
  let intersect = 0;
  aBigrams.forEach((bi) => {
    if (bBigrams.has(bi)) intersect += 1;
  });
  return (2 * intersect) / (aBigrams.size + bBigrams.size);
}

function scoreContact(candidate: CrmContact, queryVariants: string[]): number {
  const name = normalizeSearchText(`${candidate.first_name ?? ''} ${candidate.last_name ?? ''}`);
  const company = normalizeSearchText(candidate.company_name ?? '');
  const phone = normalizeSearchText(candidate.phone ?? '');
  const mobile = normalizeSearchText(candidate.mobile ?? '');
  const email = normalizeSearchText(candidate.email ?? '');
  const telegram = normalizeSearchText(candidate.telegram ?? '');
  const whatsapp = normalizeSearchText(candidate.whatsapp ?? '');
  const haystacks = [name, company, phone, mobile, email, telegram, whatsapp].filter(Boolean);

  let score = 0;
  for (const variant of queryVariants) {
    if (!variant) continue;
    if (name.startsWith(variant)) score = Math.max(score, 120);
    if (company.startsWith(variant)) score = Math.max(score, 110);
    if (haystacks.some((h) => h.includes(variant))) score = Math.max(score, 90);

    const fuzzyName = diceCoefficient(name, variant);
    const fuzzyCompany = diceCoefficient(company, variant);
    if (fuzzyName >= 0.5) score = Math.max(score, Math.round(fuzzyName * 100));
    if (fuzzyCompany >= 0.55) score = Math.max(score, Math.round(fuzzyCompany * 95));
  }
  return score;
}

export function useCrmContacts(
  companyId: string | undefined,
  page = 0,
  pageSize = 20,
  filters?: {
    search?: string;
    contactType?: string;
    tag?: string;
    showArchived?: boolean;
    source?: string;
    lifecycleStage?: string;
    sortBy?: string;
    /** 'all' | 'vip' | 'standard' — maps to is_vip */
    vip?: 'all' | 'vip' | 'standard';
    leadTemperature?: string;
    /** Any role from CRM_ROLES; filters contacts where crm_roles contains this value */
    crmRole?: string;
  }
) {
  return useQuery({
    queryKey: ['crm-contacts', companyId, page, pageSize, filters],
    queryFn: async (): Promise<{ data: CrmContact[]; count: number }> => {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      // Determine sort
      const sortField = filters?.sortBy || 'updated_at';
      const ascending = sortField === 'first_name'; // name ascending, rest descending

      let q = supabase
        .from('crm_contacts')
        .select('*, agent_deals!contact_id(id)', { count: 'exact' })
        .eq('company_id', companyId!)
        .order(sortField, { ascending })
        .range(from, to);

      // Server-side archived filter (default: hide archived)
      if (!filters?.showArchived) {
        q = q.eq('is_archived', false);
      }

      // Server-side search
      if (filters?.search && filters.search.trim().length >= 2) {
        const s = sanitizeSearchTerm(filters.search);
        if (s) q = q.or(`first_name.ilike.%${s}%,last_name.ilike.%${s}%,phone.ilike.%${s}%,email.ilike.%${s}%`);
      }

      // Server-side type filter
      if (filters?.contactType) {
        q = q.eq('contact_type', filters.contactType);
      }

      // Server-side source filter
      if (filters?.source) {
        q = q.eq('source', filters.source);
      }

      // Server-side lifecycle stage filter
      if (filters?.lifecycleStage) {
        q = q.eq('lifecycle_stage', filters.lifecycleStage);
      }

      // Server-side tag filter
      if (filters?.tag) {
        q = q.contains('tags', [filters.tag]);
      }

      if (filters?.vip === 'vip') {
        q = (q as any).eq('is_vip', true);
      } else if (filters?.vip === 'standard') {
        q = (q as any).eq('is_vip', false);
      }

      if (filters?.leadTemperature) {
        q = q.eq('lead_temperature', filters.leadTemperature);
      }

      if (filters?.crmRole) {
        q = q.contains('crm_roles', [filters.crmRole]);
      }

      const { data, error, count } = await q;
      if (error) throw error;
      const rows = (data || []) as Record<string, unknown>[];
      const enriched = rows.map((c) => {
        const { agent_deals, ...rest } = c;
        const dealCount = Array.isArray(agent_deals) ? agent_deals.length : 0;
        return { ...rest, deal_count: dealCount } as unknown as CrmContact;
      });
      return { data: enriched, count: count || 0 };
    },
    enabled: !!companyId,
  });
}

export function useCrmContact(contactId: string | undefined) {
  return useQuery({
    queryKey: ['crm-contact', contactId],
    queryFn: async (): Promise<CrmContact | null> => {
      if (!contactId) return null;
      const { data, error } = await supabase
        .from('crm_contacts')
        .select('*')
        .eq('id', contactId)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as CrmContact | null;
    },
    enabled: !!contactId,
  });
}

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (contact: CrmContactInsert) => {
      // Strip fields that exist in the TS type but not in the DB schema
      const { crm_role, key_dates, ...cleanContact } = contact as any;
      const { data, error } = await supabase
        .from('crm_contacts')
        .insert(cleanContact)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['crm-contacts'] });
      const d = data as Record<string, unknown>;
      if (d.company_id && d.id) {
        fireCrmWorkflowTrigger({
          trigger_type: 'contact_created',
          company_id: d.company_id as string,
          entity_id: d.id as string,
          entity_type: 'contact',
          metadata: { contact_type: d.contact_type, source: d.source },
        });
      }
    },
    onError: (err: unknown) => {
      toast.error(formatPostgrestError(err));
    },
  });
}

export function useUpdateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: CrmContactUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('crm_contacts')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data, vars) => {
      qc.invalidateQueries({ queryKey: ['crm-contacts'] });
      qc.invalidateQueries({ queryKey: ['crm-contact', vars.id] });
      const d = data as Record<string, unknown>;
      if (d.company_id) {
        fireCrmWorkflowTrigger({
          trigger_type: 'contact_updated',
          company_id: d.company_id as string,
          entity_id: vars.id,
          entity_type: 'contact',
        });
      }
    },
    onError: (err: unknown) => {
      toast.error(formatPostgrestError(err));
    },
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('crm_contacts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm-contacts'] });
    },
  });
}

/** Search contacts by name/phone for autocomplete */
export function useContactSearch(companyId: string | undefined, query: string) {
  return useQuery({
    queryKey: ['crm-contact-search', companyId, query],
    queryFn: async (): Promise<CrmContact[]> => {
      const raw = sanitizeSearchTerm(query);
      const normalized = normalizeSearchText(raw);
      if (!normalized) return [];

      const ruToEn = translitRuToEn(normalized);
      const enToRu = translitEnToRu(normalized);
      const queryVariants = Array.from(new Set([normalized, ruToEn, enToRu])).filter(Boolean);
      const orQuery = [
        `first_name.ilike.%${normalized}%`,
        `last_name.ilike.%${normalized}%`,
        `phone.ilike.%${normalized}%`,
        `email.ilike.%${normalized}%`,
        `company_name.ilike.%${normalized}%`,
        `mobile.ilike.%${normalized}%`,
        `telegram.ilike.%${normalized}%`,
        `whatsapp.ilike.%${normalized}%`,
      ].join(',');

      const { data, error } = await supabase
        .from('crm_contacts')
        .select('*')
        .eq('company_id', companyId!)
        .eq('is_archived', false)
        .or(orQuery)
        .limit(100);
      if (error) throw error;

      // Fallback: translit/fuzzy matching needs local candidate set if SQL ILIKE missed results.
      let candidates = (data || []) as unknown as CrmContact[];
      if (candidates.length === 0) {
        const { data: fallback, error: fallbackError } = await supabase
          .from('crm_contacts')
          .select('*')
          .eq('company_id', companyId!)
          .eq('is_archived', false)
          .order('updated_at', { ascending: false })
          .limit(250);
        if (fallbackError) throw fallbackError;
        candidates = (fallback || []) as unknown as CrmContact[];
      }

      return candidates
        .map((contact) => ({ contact, score: scoreContact(contact, queryVariants) }))
        .filter((entry) => entry.score >= 45)
        .sort((a, b) => b.score - a.score)
        .slice(0, 20)
        .map((entry) => entry.contact);
    },
    enabled: !!companyId && query.trim().length >= 1,
  });
}

/** Get deals linked to a contact */
export function useContactDeals(contactId: string | undefined) {
  return useQuery({
    queryKey: ['contact-deals', contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_deals')
        .select('*')
        .eq('contact_id', contactId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as import('@/hooks/useAgentDeals').AgentDeal[];
    },
    enabled: !!contactId,
  });
}
