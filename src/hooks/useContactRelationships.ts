/**
 * Contact ↔ Contact relationships (spouse, partner, friend, etc.)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type {
  ContactRelationship,
  ContactRelationshipType,
} from '@/types/contact';

/** Fetch relationships for a contact */
export function useContactRelationships(contactId: string | undefined) {
  return useQuery({
    queryKey: ['contact-relationships', contactId],
    queryFn: async (): Promise<ContactRelationship[]> => {
      if (!contactId) return [];
       const { data: links, error } = await (supabase as any)
         .from('contact_relationships')
        .select('id, contact_id, related_contact_id, relationship_type, company_id, notes, created_at, updated_at')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (!links?.length) return [];
      const relatedIds = [...new Set(links.map((l: { related_contact_id: string }) => l.related_contact_id))];
      const { data: contacts } = await supabase
        .from('crm_contacts')
        .select('id, first_name, last_name, company_name, avatar_url')
        .in('id', relatedIds);
      const contactMap = new Map((contacts || []).map((c: { id: string }) => [c.id, c]));
      return links.map((row: Record<string, unknown>) => ({
        ...row,
        related_contact: contactMap.get(row.related_contact_id as string),
      })) as ContactRelationship[];
    },
    enabled: !!contactId,
  });
}

/** Link contact to another contact */
export function useLinkContactRelationship() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      contactId,
      relatedContactId,
      relationshipType,
      companyId,
      notes,
    }: {
      contactId: string;
      relatedContactId: string;
      relationshipType: ContactRelationshipType;
      companyId: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('contact_relationships')
        .insert({
          contact_id: contactId,
          related_contact_id: relatedContactId,
          relationship_type: relationshipType,
          company_id: companyId,
          notes: notes || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['contact-relationships', vars.contactId] });
      qc.invalidateQueries({ queryKey: ['contact-relationships', vars.relatedContactId] });
    },
  });
}

/** Unlink contact relationship */
export function useUnlinkContactRelationship() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase.from('contact_relationships').delete().eq('id', linkId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contact-relationships'] });
    },
  });
}
