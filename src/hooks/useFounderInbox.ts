import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useActiveCompany } from '@/hooks/useActiveCompany';

export interface FounderInboxItem {
  id: string;
  source_type: 'task' | 'deal' | 'prospect';
  title: string;
  priority: 'high' | 'medium' | 'low';
  status: string;
  target_date: string | null;
  company_id: string | null;
  created_at: string;
}

export function useFounderInbox(limit = 20) {
  const { activeCompanyId } = useActiveCompany();

  return useQuery({
    queryKey: ['founder-inbox', activeCompanyId, limit],
    queryFn: async () => {
      // Fetch from the three sources in parallel and merge client-side
      // (v_founder_inbox view handles the UNION but we can also query directly for RLS)
      const [tasksRes, dealsRes, prospectsRes] = await Promise.all([
        supabase
          .from('crm_tasks')
          .select('id, title, priority, status, due_date, company_id, created_at')
          .not('status', 'in', '("done","cancelled")')
          .order('due_date', { ascending: true, nullsFirst: false })
          .limit(limit),
        supabase
          .from('agent_deals')
          .select('id, client_name, priority, stage, next_action_date, company_id, created_at')
          .eq('deal_status', 'active')
          .order('next_action_date', { ascending: true, nullsFirst: false })
          .limit(limit),
        supabase
          .from('vendor_prospects')
          .select('id, company_name, score, status, next_action_date, created_at')
          .not('status', 'in', '("won","lost","archived")')
          .order('score', { ascending: false })
          .limit(limit),
      ]);

      const items: FounderInboxItem[] = [];

      (tasksRes.data || []).forEach(t => {
        items.push({
          id: t.id,
          source_type: 'task',
          title: t.title,
          priority: (t.priority as any) || 'medium',
          status: t.status,
          target_date: t.due_date,
          company_id: t.company_id,
          created_at: t.created_at,
        });
      });

      (dealsRes.data || []).forEach(d => {
        items.push({
          id: d.id,
          source_type: 'deal',
          title: d.client_name,
          priority: (d.priority ?? 0) >= 8 ? 'high' : (d.priority ?? 0) >= 5 ? 'medium' : 'low',
          status: d.stage,
          target_date: d.next_action_date,
          company_id: d.company_id,
          created_at: d.created_at,
        });
      });

      (prospectsRes.data || []).forEach(p => {
        items.push({
          id: p.id,
          source_type: 'prospect',
          title: p.company_name,
          priority: (p.score ?? 0) >= 70 ? 'high' : (p.score ?? 0) >= 40 ? 'medium' : 'low',
          status: p.status,
          target_date: p.next_action_date,
          company_id: null,
          created_at: p.created_at,
        });
      });

      // Sort by priority then target_date
      const priorityOrder = { high: 1, medium: 2, low: 3 };
      items.sort((a, b) => {
        const pDiff = (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
        if (pDiff !== 0) return pDiff;
        if (a.target_date && b.target_date) return a.target_date.localeCompare(b.target_date);
        if (a.target_date) return -1;
        if (b.target_date) return 1;
        return 0;
      });

      return items.slice(0, limit);
    },
    staleTime: 30_000,
  });
}
