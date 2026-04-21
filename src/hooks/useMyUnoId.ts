/**
 * useMyUnoId — consolidated profile reader for the myUNO ID v2 layer.
 *
 * Reads from the `v_myuno_id` view which joins:
 *   - profiles (anchor)
 *   - user_passports (primary)
 *   - user_visa_status (current)
 *   - user_tax_profile
 *   - aggregate counts for compliance obligations & vault docs
 *
 * Gated by `feature_flag:myuno_id_v2`. When the flag is OFF, the hook still
 * returns legacy profile fields (full_name, email, phone, language) so callers
 * can render a basic profile without branching everywhere.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

export interface MyUnoIdSnapshot {
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  preferred_language: string | null;
  languages_spoken: string[] | null;
  tax_residency: string | null;
  nationality: string | null;
  country: string | null;
  myuno_id_version: number;
  vault_pin_set: boolean;
  primary_passport_id: string | null;
  primary_passport_number: string | null;
  primary_passport_expiry: string | null;
  current_visa_id: string | null;
  current_visa_type: string | null;
  current_visa_expiry: string | null;
  has_cfc: boolean | null;
  files_3ndfl: boolean | null;
  active_obligations_count: number;
  vault_documents_count: number;
}

export function useMyUnoId() {
  const { user } = useAuth();
  const v2Enabled = useFeatureFlag('myuno_id_v2', false);

  return useQuery({
    queryKey: ['myuno-id', user?.id, v2Enabled],
    enabled: !!user?.id,
    staleTime: 60 * 1000,
    queryFn: async (): Promise<MyUnoIdSnapshot | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('v_myuno_id' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return (data as unknown as MyUnoIdSnapshot) ?? null;
    },
  });
}
