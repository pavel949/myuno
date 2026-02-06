import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';

// ── Pulse KPIs ──
export function usePulseKPIs(period: 'today' | '7d' | 'mtd' = '7d') {
  return useQuery({
    queryKey: ['mcc-pulse-kpis', period],
    queryFn: async () => {
      const now = new Date();
      let since: string;
      if (period === 'today') {
        since = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      } else if (period === '7d') {
        since = new Date(now.getTime() - 7 * 86400000).toISOString();
      } else {
        since = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      }

      // Events for funnel
      const { data: events } = await supabase
        .from('mcc_landing_events')
        .select('event_name, landing_id, vertical, payload, created_at')
        .gte('created_at', since);

      // User states
      const { data: states } = await supabase
        .from('mcc_user_states')
        .select('state, source_landing');

      // Bookings for revenue
      const { data: bookings } = await supabase
        .from('bookings')
        .select('total_amount, currency, created_at')
        .gte('created_at', since);

      const evts = events || [];
      const views = evts.filter(e => e.event_name === 'landing_view').length;
      const ctaClicks = evts.filter(e => e.event_name === 'primary_cta_click').length;
      const intents = evts.filter(e => e.event_name === 'intent_started').length;
      const completed = evts.filter(e => e.event_name === 'first_service_completed').length;
      const secondAction = evts.filter(e => e.event_name === 'second_service_started').length;

      const revenue = (bookings || []).reduce((s, b) => s + (b.total_amount || 0), 0);
      const conversionPct = views > 0 ? (completed / views) * 100 : 0;
      const ctaRate = views > 0 ? (ctaClicks / views) * 100 : 0;
      const secondActionRate = completed > 0 ? (secondAction / completed) * 100 : 0;

      const stateDistribution: Record<string, number> = {};
      (states || []).forEach((s: any) => {
        stateDistribution[s.state] = (stateDistribution[s.state] || 0) + 1;
      });
      const activeUsers = (states || []).filter((s: any) => 
        !['dormant', 'churned', 'anonymous'].includes(s.state)
      ).length;

      return {
        traffic: views,
        ctaClicks,
        intents,
        completed,
        secondAction,
        revenue,
        conversionPct,
        ctaRate,
        secondActionRate,
        activeUsers,
        totalUsers: (states || []).length,
        stateDistribution,
      };
    },
    refetchInterval: 60_000,
  });
}

// ── Landing Funnel Board ──
export function useLandingFunnelBoard(period: 'today' | '7d' | 'mtd' = '7d') {
  return useQuery({
    queryKey: ['mcc-landing-funnel', period],
    queryFn: async () => {
      const now = new Date();
      let since: string;
      if (period === 'today') {
        since = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      } else if (period === '7d') {
        since = new Date(now.getTime() - 7 * 86400000).toISOString();
      } else {
        since = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      }

      const { data: events } = await supabase
        .from('mcc_landing_events')
        .select('event_name, landing_id, payload')
        .gte('created_at', since);

      const { data: landings } = await supabase
        .from('mcc_landing_registry')
        .select('landing_id, name_en, name_ru, is_active');

      const funnelMap: Record<string, {
        views: number; clicks: number; intents: number; completed: number; secondAction: number; revenue: number;
      }> = {};

      (events || []).forEach((e: any) => {
        const lid = e.landing_id || 'unknown';
        if (!funnelMap[lid]) {
          funnelMap[lid] = { views: 0, clicks: 0, intents: 0, completed: 0, secondAction: 0, revenue: 0 };
        }
        switch (e.event_name) {
          case 'landing_view': funnelMap[lid].views++; break;
          case 'primary_cta_click': funnelMap[lid].clicks++; break;
          case 'intent_started': funnelMap[lid].intents++; break;
          case 'first_service_completed':
            funnelMap[lid].completed++;
            funnelMap[lid].revenue += (e.payload as any)?.amount || 0;
            break;
          case 'second_service_started': funnelMap[lid].secondAction++; break;
        }
      });

      return (landings || []).map((l: any) => ({
        landing_id: l.landing_id,
        name_en: l.name_en,
        name_ru: l.name_ru,
        is_active: l.is_active,
        ...(funnelMap[l.landing_id] || { views: 0, clicks: 0, intents: 0, completed: 0, secondAction: 0, revenue: 0 }),
      }));
    },
    refetchInterval: 60_000,
  });
}

// ── Alerts ──
export interface MCCAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  landing_id?: string;
  action?: string;
}

export function useMCCAlerts() {
  const { data: funnel } = useLandingFunnelBoard('7d');
  const { data: pulse } = usePulseKPIs('today');

  return useMemo(() => {
    const alerts: MCCAlert[] = [];
    if (!funnel || !pulse) return alerts;

    funnel.forEach(l => {
      if (l.is_active && l.views > 10 && l.clicks === 0) {
        alerts.push({
          id: `zero-cta-${l.landing_id}`,
          severity: 'critical',
          title: `${l.name_en}: 0 CTA clicks`,
          description: `${l.views} views but no CTA clicks. Check landing page.`,
          landing_id: l.landing_id,
          action: 'Investigate',
        });
      }
      if (l.is_active && l.views > 20) {
        const ctaRate = (l.clicks / l.views) * 100;
        if (ctaRate < 5) {
          alerts.push({
            id: `low-cta-${l.landing_id}`,
            severity: 'warning',
            title: `${l.name_en}: Low CTA rate ${ctaRate.toFixed(1)}%`,
            description: `Below 5% threshold. Consider A/B testing hero copy.`,
            landing_id: l.landing_id,
            action: 'Review',
          });
        }
      }
    });

    const dormant = pulse.stateDistribution?.dormant || 0;
    if (dormant > 5) {
      alerts.push({
        id: 'churn-spike',
        severity: 'warning',
        title: `${dormant} dormant users`,
        description: 'Consider triggering re-engagement campaign.',
        action: 'Campaign',
      });
    }

    return alerts.slice(0, 5);
  }, [funnel, pulse]);
}

// ── AI Recommendations ──
export function useAIRecommendations() {
  return useQuery({
    queryKey: ['mcc-ai-recommendations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mcc_ai_recommendations')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
  });
}

export function useApplyRecommendation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('mcc_ai_recommendations')
        .update({ status: 'applied', applied_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mcc-ai-recommendations'] }),
  });
}

export function useDismissRecommendation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const { error } = await supabase
        .from('mcc_ai_recommendations')
        .update({ status: 'dismissed', dismissed_at: new Date().toISOString(), dismissed_reason: reason || '' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mcc-ai-recommendations'] }),
  });
}

// ── State History (transitions over time) ──
export function useStateTransitions(days: number = 7) {
  return useQuery({
    queryKey: ['mcc-state-transitions', days],
    queryFn: async () => {
      const since = new Date(Date.now() - days * 86400000).toISOString();
      const { data, error } = await supabase
        .from('mcc_state_history')
        .select('from_state, to_state, trigger_event, landing_id, created_at')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
  });
}

// ── User Timeline ──
export function useUserTimeline(userId: string) {
  return useQuery({
    queryKey: ['mcc-user-timeline', userId],
    enabled: !!userId,
    queryFn: async () => {
      const [{ data: events }, { data: states }, { data: profile }] = await Promise.all([
        supabase
          .from('mcc_landing_events')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('mcc_user_states')
          .select('*')
          .eq('user_id', userId)
          .single(),
        supabase
          .from('profiles')
          .select('id, full_name, email, phone, avatar_url')
          .eq('id', userId)
          .single(),
      ]);
      return { events: events || [], state: states, profile: profile };
    },
  });
}

// ── Campaign Rules ──
export function useCampaignRules() {
  return useQuery({
    queryKey: ['mcc-campaign-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mcc_campaign_rules')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateCampaignRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rule: {
      campaign_id: string;
      trigger_event: string;
      target_state?: string;
      channel?: string;
      cooldown_hours?: number;
      message_template?: Record<string, string>;
    }) => {
      const { data, error } = await supabase
        .from('mcc_campaign_rules')
        .insert({
          campaign_id: rule.campaign_id,
          trigger_event: rule.trigger_event,
          target_state: rule.target_state || null,
          channel: rule.channel || 'push',
          cooldown_hours: rule.cooldown_hours || 48,
          message_template: rule.message_template || null,
          is_active: true,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mcc-campaign-rules'] }),
  });
}

export function useToggleCampaignRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('mcc_campaign_rules')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mcc-campaign-rules'] }),
  });
}

export function useDeleteCampaignRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('mcc_campaign_rules')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mcc-campaign-rules'] }),
  });
}

// ── Churn Risk Users ──
export function useChurnRiskUsers() {
  return useQuery({
    queryKey: ['mcc-churn-risk-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mcc_user_states')
        .select('user_id, state, source_landing, verticals_used, updated_at')
        .in('state', ['dormant', 'churned'])
        .order('updated_at', { ascending: false })
        .limit(50);
      if (error) throw error;

      // Enrich with profile names
      const userIds = (data || []).map(u => u.user_id);
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));
      return (data || []).map(u => ({
        ...u,
        full_name: profileMap.get(u.user_id)?.full_name || null,
        email: profileMap.get(u.user_id)?.email || null,
      }));
    },
  });
}

// ── Funnel Diagnostics ──
export function useFunnelDiagnostics(landingId: string, days: number = 7) {
  return useQuery({
    queryKey: ['mcc-funnel-diagnostics', landingId, days],
    enabled: !!landingId,
    queryFn: async () => {
      const since = new Date(Date.now() - days * 86400000).toISOString();
      const { data, error } = await supabase
        .from('mcc_landing_events')
        .select('event_name, payload, created_at')
        .eq('landing_id', landingId)
        .gte('created_at', since);
      if (error) throw error;

      const events = data || [];
      const stages = ['landing_view', 'primary_cta_click', 'intent_started', 'first_service_completed', 'second_service_started'];
      const counts = stages.map(s => ({ stage: s, count: events.filter(e => e.event_name === s).length }));

      return { counts, totalEvents: events.length };
    },
  });
}
