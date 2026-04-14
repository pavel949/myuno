import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useCapitalDashboardStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['capital-dashboard-stats', user?.id],
    queryFn: async () => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const today = new Date().toISOString().split('T')[0];

      const [contacts, campaigns, outreachWeek, todayTouches, pipeline] = await Promise.all([
        supabase.from('capital_contacts').select('id', { count: 'exact', head: true }),
        supabase.from('capital_campaigns').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('capital_outreach').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString()),
        supabase.from('capital_outreach').select('id', { count: 'exact', head: true })
          .or(`sent_at.is.null,and(follow_up_date.eq.${today},follow_up_done.eq.false)`),
        supabase.from('capital_pipeline').select('stage, commission_expected'),
      ]);

      const pipelineData = pipeline.data ?? [];
      const totalCommission = pipelineData
        .filter((d) => d.stage !== 'closed_lost')
        .reduce((sum, d) => sum + (d.commission_expected ?? 0), 0);

      const stageCounts: Record<string, number> = {};
      for (const d of pipelineData) {
        stageCounts[d.stage] = (stageCounts[d.stage] ?? 0) + 1;
      }

      return {
        contactsCount: contacts.count ?? 0,
        activeCampaigns: campaigns.count ?? 0,
        outreachThisWeek: outreachWeek.count ?? 0,
        todayTouchesCount: todayTouches.count ?? 0,
        expectedCommission: totalCommission,
        stageCounts,
      };
    },
    enabled: !!user?.id,
  });
}
