/**
 * @module useCrmDuplicates
 * Hook for detecting duplicate CRM contacts
 */
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DuplicateGroup {
  contacts: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    company_name: string | null;
  }[];
  match_reasons: string[];
  confidence: number;
}

export function useDetectDuplicates() {
  return useMutation({
    mutationFn: async (companyId: string): Promise<{ duplicates: DuplicateGroup[]; total: number }> => {
      const { data, error } = await supabase.functions.invoke('detect-crm-duplicates', {
        body: { company_id: companyId },
      });
      if (error) throw error;
      return data;
    },
  });
}

/** Query duplicates for a company (used for badge count). Stale after 5 min. */
export function useDuplicatesQuery(companyId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['crm-duplicates', companyId],
    queryFn: async (): Promise<{ duplicates: DuplicateGroup[]; total: number }> => {
      const { data, error } = await supabase.functions.invoke('detect-crm-duplicates', {
        body: { company_id: companyId },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId && enabled,
    staleTime: 5 * 60 * 1000,
  });
}
