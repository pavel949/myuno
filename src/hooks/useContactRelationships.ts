/**
 * Contact ↔ Contact relationships (spouse, partner, friend, etc.)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { typedFrom } from '@/lib/untypedTables';
import type {
  ContactRelationship,
  ContactRelationshipType,
} from '@/types/contact';

interface ContactRelationshipLink {
  id: string;
  contact_id: string;
  related_contact_id: string;
  relationship_type: string;
  company_id: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface ContactSummary {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  avatar_url: string | null;
}

/** Fetch relationships for a contact */
export function useContactRelationships(contactId: string | undefined) {
  return useQuery({
    queryKey: ['contact-relationships', contactId],
    queryFn: async (): Promise<ContactRelationship[]> => {
      if (!contactId) return [];
      const { data: links, error } = await typedFrom('contact_relationships')
        .select('id, contact_id, related_contact_id, relationship_type, company_id, notes, created_at, updated_at')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (!links?.length) return [];
      const typedLinks = links as ContactRelationshipLink[];
      const relatedIds = [...new Set(typedLinks.map(l => l.related_contact_id))];
      const { data: contacts } = await supabase
        .from('crm_contacts')
        .select('id, first_name, last_name, company_name, avatar_url')
        .in('id', relatedIds);
      const contactMap = new Map((contacts || []).map((c: ContactSummary) => [c.id, c]));
      return typedLinks.map((row) => ({
        ...row,
        related_contact: contactMap.get(row.related_contact_id),
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
      const { data, error } = await typedFrom('contact_relationships')
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
      const { error } = await typedFrom('contact_relationships').delete().eq('id', linkId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contact-relationships'] });
    },
  });
}
