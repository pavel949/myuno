import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { CapitalOutreach, CapitalOutreachInsert, CapitalOutreachUpdate, ResponseType } from '@/types/capital';

export function useCapitalOutreach(contactId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const outreachQuery = useQuery({
    queryKey: ['capital-outreach', user?.id, contactId],
    queryFn: async () => {
      let query = supabase
        .from('capital_outreach')
        .select('*, capital_contacts(name, phone, whatsapp_phone, telegram_id, preferred_channel), capital_projects(name), capital_campaigns(name)')
        .order('created_at', { ascending: false });

      if (contactId) {
        query = query.eq('contact_id', contactId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const todayFeedQuery = useQuery({
    queryKey: ['capital-outreach-today', user?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('capital_outreach')
        .select('*, capital_contacts(name, phone, whatsapp_phone, telegram_id, preferred_channel), capital_projects(name), capital_campaigns(name)')
        .or(`sent_at.is.null,and(follow_up_date.eq.${today},follow_up_done.eq.false)`)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !contactId,
  });

  const createOutreach = useMutation({
    mutationFn: async (outreach: Omit<CapitalOutreachInsert, 'user_id'>) => {
      const { data, error } = await supabase
        .from('capital_outreach')
        .insert({ ...outreach, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data as CapitalOutreach;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capital-outreach'] });
      queryClient.invalidateQueries({ queryKey: ['capital-outreach-today'] });
    },
  });

  const createBulkOutreach = useMutation({
    mutationFn: async (records: Omit<CapitalOutreachInsert, 'user_id'>[]) => {
      const withUserId = records.map((r) => ({ ...r, user_id: user!.id }));
      const { data, error } = await supabase
        .from('capital_outreach')
        .insert(withUserId)
        .select();
      if (error) throw error;
      return data as CapitalOutreach[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capital-outreach'] });
      queryClient.invalidateQueries({ queryKey: ['capital-outreach-today'] });
    },
  });

  const updateOutreach = useMutation({
    mutationFn: async ({ id, ...updates }: CapitalOutreachUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('capital_outreach')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as CapitalOutreach;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capital-outreach'] });
      queryClient.invalidateQueries({ queryKey: ['capital-outreach-today'] });
    },
  });

  const recordReaction = useMutation({
    mutationFn: async ({ id, response_type }: { id: string; response_type: ResponseType }) => {
      const updates: Record<string, unknown> = {
        response_type,
        replied: response_type !== 'no_response',
        sent_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('capital_outreach')
        .update(updates)
        .eq('id', id)
        .select('*, capital_contacts(name), capital_projects(name)')
        .single();
      if (error) throw error;

      // Auto-create pipeline deal if interested
      if (response_type === 'interested' && data) {
        const outreach = data as Record<string, unknown>;
        await supabase.from('capital_pipeline').insert({
          contact_id: outreach.contact_id,
          project_id: outreach.project_id,
          campaign_id: outreach.campaign_id,
          stage: 'qualified',
          user_id: user!.id,
        });
        queryClient.invalidateQueries({ queryKey: ['capital-pipeline'] });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capital-outreach'] });
      queryClient.invalidateQueries({ queryKey: ['capital-outreach-today'] });
    },
  });

  return {
    outreach: outreachQuery.data ?? [],
    todayFeed: todayFeedQuery.data ?? [],
    isLoading: outreachQuery.isLoading,
    isTodayLoading: todayFeedQuery.isLoading,
    createOutreach,
    createBulkOutreach,
    updateOutreach,
    recordReaction,
  };
}
