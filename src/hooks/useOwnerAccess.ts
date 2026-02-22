import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface OwnerAccessInfo {
  /** User belongs to at least one management company */
  isMember: boolean;
  /** The MC is verified by admin */
  isVerified: boolean;
  /** MC has at least one property listed */
  hasProperties: boolean;
  /** Full access = verified + has properties */
  hasFullAccess: boolean;
  /** Company ID (first active membership) */
  companyId: string | null;
  isLoading: boolean;
}

/**
 * Checks whether the current user belongs to a verified management company
 * that has at least one property. Used to gate owner/MC-specific features
 * like CRM, Calendar, Financials, etc.
 */
export function useOwnerAccess(): OwnerAccessInfo {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['owner-access', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // 1. Get user's active MC membership
      const { data: membership } = await supabase
        .from('management_company_members')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (!membership) return { isMember: false, isVerified: false, hasProperties: false, companyId: null };

      // 2. Check if that MC is verified and has properties
      const { data: company } = await supabase
        .from('management_companies')
        .select('is_verified, properties_count')
        .eq('id', membership.company_id)
        .maybeSingle();

      return {
        isMember: true,
        isVerified: company?.is_verified ?? false,
        hasProperties: (company?.properties_count ?? 0) > 0,
        companyId: membership.company_id,
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  return {
    isMember: data?.isMember ?? false,
    isVerified: data?.isVerified ?? false,
    hasProperties: data?.hasProperties ?? false,
    hasFullAccess: (data?.isVerified ?? false) && ((data?.hasProperties ?? false)),
    companyId: data?.companyId ?? null,
    isLoading,
  };
}
