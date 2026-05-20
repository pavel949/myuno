import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { typedFrom } from '@/lib/untypedTables';

export interface CrmContactLink {
  id: string;
  company_id: string;
  contact_id: string;
  label: string;
  url: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useCrmContactLinks(contactId: string | undefined) {
  return useQuery({
    queryKey: ['crm-contact-links', contactId],
    queryFn: async (): Promise<CrmContactLink[]> => {
      const { data, error } = await typedFrom('crm_contact_links')
        .select('*')
        .eq('contact_id', contactId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as CrmContactLink[];
    },
    enabled: !!contactId,
  });
}

export function useCreateCrmContactLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (link: Omit<CrmContactLink, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await typedFrom('crm_contact_links').insert(link).select().single();
      if (error) throw error;
      return data as CrmContactLink;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['crm-contact-links', vars.contact_id] });
    },
    onError: (err: Error) => {
      import('sonner').then(({ toast }) => toast.error(err.message || 'Failed to add link'));
    },
  });
}

export function useUpdateCrmContactLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, contactId: _contactId, ...updates }: Partial<CrmContactLink> & { id: string; contactId: string }) => {
      const { error } = await typedFrom('crm_contact_links').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['crm-contact-links', vars.contactId] });
    },
    onError: (err: Error) => {
      import('sonner').then(({ toast }) => toast.error(err.message || 'Failed to update link'));
    },
  });
}

export function useDeleteCrmContactLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, contactId: _contactId }: { id: string; contactId: string }) => {
      const { error } = await typedFrom('crm_contact_links').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['crm-contact-links', vars.contactId] });
    },
    onError: (err: Error) => {
      import('sonner').then(({ toast }) => toast.error(err.message || 'Failed to delete link'));
    },
  });
}
