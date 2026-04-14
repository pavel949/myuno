import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { CapitalContact, CapitalContactInsert, CapitalContactUpdate } from '@/types/capital';

interface ContactFilters {
  search?: string;
  warmth?: string;
  buyer_type?: string;
  budget_min?: number;
  budget_max?: number;
}

export function useCapitalContacts(filters?: ContactFilters) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const contactsQuery = useQuery({
    queryKey: ['capital-contacts', user?.id, filters],
    queryFn: async () => {
      let query = supabase
        .from('capital_contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.warmth) {
        query = query.eq('warmth', filters.warmth);
      }
      if (filters?.buyer_type) {
        query = query.eq('buyer_type', filters.buyer_type);
      }
      if (filters?.budget_min) {
        query = query.gte('budget_max', filters.budget_min);
      }
      if (filters?.budget_max) {
        query = query.lte('budget_min', filters.budget_max);
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CapitalContact[];
    },
    enabled: !!user?.id,
  });

  const createContact = useMutation({
    mutationFn: async (contact: Omit<CapitalContactInsert, 'user_id'>) => {
      const { data, error } = await supabase
        .from('capital_contacts')
        .insert({ ...contact, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data as CapitalContact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capital-contacts'] });
    },
  });

  const updateContact = useMutation({
    mutationFn: async ({ id, ...updates }: CapitalContactUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('capital_contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as CapitalContact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capital-contacts'] });
    },
  });

  const deleteContact = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('capital_contacts')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capital-contacts'] });
    },
  });

  return {
    contacts: contactsQuery.data ?? [],
    isLoading: contactsQuery.isLoading,
    error: contactsQuery.error,
    createContact,
    updateContact,
    deleteContact,
  };
}

export function useCapitalContact(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['capital-contact', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('capital_contacts')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as CapitalContact;
    },
    enabled: !!user?.id && !!id,
  });
}
