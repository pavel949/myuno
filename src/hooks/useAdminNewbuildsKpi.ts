/**
 * Admin KPI hook for /admin/newbuilds dashboard
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useAdminNewbuildsKpi() {
  return useQuery({
    queryKey: ['admin-newbuilds-kpi'],
    queryFn: async () => {
      const day1Ago = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const day7Ago = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
      const day45Ago = new Date(Date.now() - 45 * 24 * 3600 * 1000).toISOString();

      const [pendingProjects, pendingDevs, orphan, needsReview, stale, leadsToday, leadsWeek, totalProjects, totalDevs] = await Promise.all([
        supabase.from('property_projects').select('id', { count: 'exact', head: true }).eq('is_approved', false),
        supabase.from('developers').select('id', { count: 'exact', head: true }).eq('is_active', false).eq('is_verified', false),
        supabase.from('property_projects').select('id', { count: 'exact', head: true }).eq('developer_id', '00000000-0000-0000-0000-000000000001'),
        supabase.from('property_projects' as any).select('id', { count: 'exact', head: true }).eq('needs_review', true),
        supabase.from('property_projects').select('id', { count: 'exact', head: true }).eq('is_approved', true).lte('updated_at', day45Ago),
        supabase.from('nb_leads').select('id', { count: 'exact', head: true }).gte('created_at', day1Ago),
        supabase.from('nb_leads').select('id', { count: 'exact', head: true }).gte('created_at', day7Ago),
        supabase.from('property_projects').select('id', { count: 'exact', head: true }),
        supabase.from('developers').select('id', { count: 'exact', head: true }).eq('is_active', true),
      ]);

      return {
        pendingProjects: pendingProjects.count || 0,
        pendingDevs: pendingDevs.count || 0,
        orphan: orphan.count || 0,
        needsReview: needsReview.count || 0,
        stale: stale.count || 0,
        leadsToday: leadsToday.count || 0,
        leadsWeek: leadsWeek.count || 0,
        totalProjects: totalProjects.count || 0,
        totalDevs: totalDevs.count || 0,
      };
    },
    staleTime: 60_000,
  });
}
