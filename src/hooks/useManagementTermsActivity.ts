import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export interface TermsActivity {
  id: string;
  terms_id: string;
  user_id: string;
  action: string;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  note: string | null;
  created_at: string;
}

export function useTermsActivity(termsId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['terms-activity', termsId],
    enabled: !!user && !!termsId,
    queryFn: async () => {
      const { data, error } = await db
        .from('management_terms_activity')
        .select('*')
        .eq('terms_id', termsId!)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as TermsActivity[];
    },
  });
}

export function useLogTermsActivity() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (entry: {
      terms_id: string;
      action: string;
      field_name?: string;
      old_value?: string;
      new_value?: string;
      note?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await db
        .from('management_terms_activity')
        .insert({
          terms_id: entry.terms_id,
          user_id: user.id,
          action: entry.action,
          field_name: entry.field_name || null,
          old_value: entry.old_value || null,
          new_value: entry.new_value || null,
          note: entry.note || null,
        });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['terms-activity', vars.terms_id] });
    },
  });
}
