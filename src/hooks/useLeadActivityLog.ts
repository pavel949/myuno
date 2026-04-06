import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export type ActivityType = 'call' | 'email' | 'whatsapp' | 'note' | 'status_change' | 'assignment';
export type CallResult = 'answered' | 'no_answer' | 'busy' | 'callback_requested' | 'wrong_number';

export interface LeadActivity {
  id: string;
  lead_id: string;
  user_id: string | null;
  activity_type: ActivityType;
  status_from: string | null;
  status_to: string | null;
  notes: string | null;
  call_duration_seconds: number | null;
  call_result: CallResult | null;
  created_at: string;
  // Joined fields
  user_name?: string;
  user_email?: string;
}

export interface CreateActivityInput {
  lead_id: string;
  activity_type: ActivityType;
  status_from?: string;
  status_to?: string;
  notes?: string;
  call_duration_seconds?: number;
  call_result?: CallResult;
}

export function useLeadActivityLog(leadId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: activities, isLoading } = useQuery({
    queryKey: ['lead-activity', leadId],
    queryFn: async () => {
      if (!leadId) return [];

      const { data, error } = await supabase
        .from('lead_activity_log')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user info for activities
      const userIds = [...new Set((data || []).map(a => a.user_id).filter(Boolean))];
      
      let userMap: Record<string, { full_name: string | null; email: string | null }> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);
        
        userMap = (profiles || []).reduce((acc, p) => {
          acc[p.id] = { full_name: p.full_name, email: p.email };
          return acc;
        }, {} as Record<string, { full_name: string | null; email: string | null }>);
      }

      return (data || []).map(a => ({
        ...a,
        user_name: a.user_id ? userMap[a.user_id]?.full_name : null,
        user_email: a.user_id ? userMap[a.user_id]?.email : null,
      })) as LeadActivity[];
    },
    enabled: !!leadId,
  });

  const logActivity = useMutation({
    mutationFn: async (input: CreateActivityInput) => {
      const { error } = await supabase
        .from('lead_activity_log')
        .insert({
          ...input,
          user_id: user?.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-activity', leadId] });
      queryClient.invalidateQueries({ queryKey: ['team-leads'] });
      queryClient.invalidateQueries({ queryKey: ['admin-lead-analytics'] });
    },
    onError: () => {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить активность',
        variant: 'destructive',
      });
    },
  });

  return {
    activities,
    isLoading,
    logActivity: logActivity.mutateAsync,
    isLogging: logActivity.isPending,
  };
}

// Hook for admin analytics across all leads
export function useLeadAnalytics() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-lead-analytics'],
    queryFn: async () => {
      // Get all leads
      const { data: leads, error: leadsError } = await supabase
        .from('consultation_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (leadsError) throw leadsError;

      // Get all activities
      const { data: activities, error: activitiesError } = await supabase
        .from('lead_activity_log')
        .select('*')
        .order('created_at', { ascending: false });

      if (activitiesError) throw activitiesError;

      // Get team members for assignment info
      const assignedUserIds = [...new Set((leads || []).map(l => l.assigned_to).filter(Boolean))];
      let assigneeMap: Record<string, string> = {};
      if (assignedUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', assignedUserIds);
        
        assigneeMap = (profiles || []).reduce((acc, p) => {
          acc[p.id] = p.full_name || p.email || 'Unknown';
          return acc;
        }, {} as Record<string, string>);
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeekStart = new Date(today);
      thisWeekStart.setDate(today.getDate() - today.getDay());
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Calculate stats
      const allLeads = leads || [];
      const totalLeads = allLeads.length;
      const pendingLeads = allLeads.filter(l => l.status === 'pending').length;
      const inProgressLeads = allLeads.filter(l => ['contacted', 'scheduled', 'in_progress'].includes(l.status || '')).length;
      const completedLeads = allLeads.filter(l => l.status === 'completed').length;
      const convertedLeads = allLeads.filter(l => l.outcome === 'converted').length;
      const lostLeads = allLeads.filter(l => l.outcome === 'lost').length;

      const overdueLeads = allLeads.filter(l => 
        l.sla_deadline && new Date(l.sla_deadline) < now && l.status === 'pending'
      ).length;

      const todayLeads = allLeads.filter(l => new Date(l.created_at) >= today).length;
      const weekLeads = allLeads.filter(l => new Date(l.created_at) >= thisWeekStart).length;
      const monthLeads = allLeads.filter(l => new Date(l.created_at) >= thisMonthStart).length;

      // Calculate average response time (first contact)
      const leadsWithFirstContact = allLeads.filter(l => l.first_contact_at && l.created_at);
      const avgResponseTimeMs = leadsWithFirstContact.length > 0
        ? leadsWithFirstContact.reduce((sum, l) => {
            return sum + (new Date(l.first_contact_at!).getTime() - new Date(l.created_at).getTime());
          }, 0) / leadsWithFirstContact.length
        : 0;
      const avgResponseTimeMinutes = Math.round(avgResponseTimeMs / (1000 * 60));

      // Conversion rate
      const conversionRate = completedLeads > 0 ? Math.round((convertedLeads / completedLeads) * 100) : 0;

      // By request type
      const byRequestType = allLeads.reduce((acc, l) => {
        const type = l.request_type || 'unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // By assignee
      const byAssignee = allLeads.reduce((acc, l) => {
        const assignee = l.assigned_to ? (assigneeMap[l.assigned_to] || 'Unknown') : 'Unassigned';
        if (!acc[assignee]) {
          acc[assignee] = { total: 0, pending: 0, completed: 0, converted: 0 };
        }
        acc[assignee].total++;
        if (l.status === 'pending') acc[assignee].pending++;
        if (l.status === 'completed') acc[assignee].completed++;
        if (l.outcome === 'converted') acc[assignee].converted++;
        return acc;
      }, {} as Record<string, { total: number; pending: number; completed: number; converted: number }>);

      // Recent activities
      const recentActivities = (activities || []).slice(0, 50);

      return {
        totalLeads,
        pendingLeads,
        inProgressLeads,
        completedLeads,
        convertedLeads,
        lostLeads,
        overdueLeads,
        todayLeads,
        weekLeads,
        monthLeads,
        avgResponseTimeMinutes,
        conversionRate,
        byRequestType,
        byAssignee,
        recentActivities,
        leads: allLeads,
      };
    },
  });

  return {
    analytics: data,
    isLoading,
  };
}
