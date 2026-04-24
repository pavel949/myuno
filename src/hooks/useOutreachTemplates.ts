/**
 * useOutreachTemplates — единый CRUD для outreach_templates (Stage 4).
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type OutreachAudience = 'vendor' | 'investor' | 'guest' | 'owner' | 'mcc_lead' | 'custom';
export type OutreachChannel = 'email' | 'whatsapp' | 'telegram' | 'sms' | 'instagram_dm';

export interface OutreachTemplate {
  id: string;
  audience_type: OutreachAudience;
  channel: OutreachChannel;
  language: string;
  stage: string;
  name: string;
  subject: string | null;
  body: string;
  variables: string[] | null;
  business_type: string | null;
  is_active: boolean;
  company_id: string | null;
}

export function useOutreachTemplates(audience?: OutreachAudience) {
  return useQuery({
    queryKey: ['outreach-templates', audience ?? 'all'],
    queryFn: async (): Promise<OutreachTemplate[]> => {
      // outreach_templates is new; types not regenerated yet → cast through unknown
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q: any = (supabase as any).from('outreach_templates').select('*').eq('is_active', true);
      if (audience) q = q.eq('audience_type', audience);
      q = q.order('stage', { ascending: true });
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as OutreachTemplate[];
    },
    staleTime: 60_000,
  });
}
