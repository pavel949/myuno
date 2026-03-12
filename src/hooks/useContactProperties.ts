/**
 * Contact ↔ Property many-to-many
 * Links CRM contacts to properties with relationship types.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const RELATIONSHIP_TYPES = ['owner', 'tenant', 'interested', 'previous_owner', 'investor'] as const;
export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

export const RELATIONSHIP_LABELS: Record<RelationshipType, { en: string; ru: string }> = {
  owner: { en: 'Owner', ru: 'Собственник' },
  tenant: { en: 'Tenant', ru: 'Арендатор' },
  interested: { en: 'Interested', ru: 'Заинтересован' },
  previous_owner: { en: 'Previous Owner', ru: 'Бывший собственник' },
  investor: { en: 'Investor', ru: 'Инвестор' },
};

export interface ContactProperty {
  id: string;
  contact_id: string;
  property_id: string;
  relationship_type: RelationshipType;
  company_id: string;
  created_at: string;
  // Joined
  property?: { id: string; title_en?: string; title_ru?: string; district?: string; property_type?: string };
  contact?: { id: string; first_name: string; last_name: string; company_name?: string | null };
}

/** Fetch links for a contact (properties linked to this contact) */
export function useContactProperties(contactId: string | undefined) {
  return useQuery({
    queryKey: ['contact-properties', contactId],
    queryFn: async (): Promise<ContactProperty[]> => {
      if (!contactId) return [];
       const { data: links, error } = await (supabase as any)
         .from('contact_properties')
        .select('id, contact_id, property_id, relationship_type, company_id, created_at')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (!links?.length) return [];
      const propertyIds = [...new Set(links.map((l: any) => l.property_id))];
      const { data: props } = await supabase
        .from('properties')
        .select('id, title_en, title_ru, district, property_type')
        .in('id', propertyIds);
      const propMap = new Map((props || []).map((p: any) => [p.id, p]));
      return links.map((row: any) => ({
        ...row,
        property: propMap.get(row.property_id),
      })) as ContactProperty[];
    },
    enabled: !!contactId,
  });
}

/** Fetch links for a property (contacts linked to this property) */
export function usePropertyContacts(propertyId: string | undefined) {
  return useQuery({
    queryKey: ['property-contacts', propertyId],
    queryFn: async (): Promise<ContactProperty[]> => {
      if (!propertyId) return [];
       const { data: links, error } = await (supabase as any)
         .from('contact_properties')
        .select('id, contact_id, property_id, relationship_type, company_id, created_at')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (!links?.length) return [];
      const contactIds = [...new Set(links.map((l: any) => l.contact_id))];
      const { data: contacts } = await supabase
        .from('crm_contacts')
        .select('id, first_name, last_name, company_name')
        .in('id', contactIds);
      const contactMap = new Map((contacts || []).map((c: any) => [c.id, c]));
      return links.map((row: any) => ({
        ...row,
        contact: contactMap.get(row.contact_id),
      })) as ContactProperty[];
    },
    enabled: !!propertyId,
  });
}

/** Fetch MC properties for linking (same company as contact) */
export function useMcPropertiesForLink(companyId: string | undefined) {
  return useQuery({
    queryKey: ['mc-properties-for-link', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('properties')
        .select('id, title_en, title_ru, district, property_type')
        .eq('management_company_id', companyId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });
}

/** Fetch CRM contacts for linking (same company) */
export function useMcContactsForLink(companyId: string | undefined) {
  return useQuery({
    queryKey: ['mc-contacts-for-link', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('crm_contacts')
        .select('id, first_name, last_name, company_name')
        .eq('company_id', companyId)
        .eq('is_archived', false)
        .order('updated_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });
}

/** Link contact to property */
export function useLinkContactProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      contactId,
      propertyId,
      relationshipType,
      companyId,
    }: {
      contactId: string;
      propertyId: string;
      relationshipType: RelationshipType;
      companyId: string;
    }) => {
       const { data, error } = await (supabase as any)
         .from('contact_properties')
        .insert({
          contact_id: contactId,
          property_id: propertyId,
          relationship_type: relationshipType,
          company_id: companyId,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['contact-properties', vars.contactId] });
      qc.invalidateQueries({ queryKey: ['property-contacts', vars.propertyId] });
    },
  });
}

/** Unlink contact from property */
export function useUnlinkContactProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await (supabase as any).from('contact_properties').delete().eq('id', linkId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contact-properties'] });
      qc.invalidateQueries({ queryKey: ['property-contacts'] });
    },
  });
}
