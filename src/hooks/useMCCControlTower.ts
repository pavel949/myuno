import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCheck } from '@/hooks/useAdmin';
import { bangkokTodayISO } from '@/lib/hotelDates';

const RECORDED_STAGES = ['landing_view', 'primary_cta_click', 'intent_started', 'first_service_completed', 'second_service_started'] as const;
type LandingEventScope = { kind: 'platform' } | { kind: 'landing'; landingId: string };

/** One read model for recorded events; event payloads never establish financial truth. */
export async function readRecordedLandingEvents(scope: LandingEventScope, since: string, through: string) {
  if (scope.kind !== 'platform' && scope.kind !== 'landing') throw new Error('Invalid event scope');
  if (scope.kind === 'landing' && !scope.landingId.trim()) throw new Error('Landing scope is required');
  const count = async (stage?: string) => {
    let request = supabase.from('mcc_landing_events').select('id', { count: 'exact', head: true })
      .gte('created_at', since).lte('created_at', through);
    if (scope.kind === 'landing') request = request.eq('landing_id', scope.landingId);
    if (stage) request = request.eq('event_name', stage);
    const response = await request;
    if (response.error) throw response.error;
    if (response.count === null || !Number.isSafeInteger(response.count) || response.count < 0) throw new Error('Event count unavailable');
    return response.count;
  };
  const [totalEvents, ...values] = await Promise.all([count(), ...RECORDED_STAGES.map(stage => count(stage))]);
  return { counts: RECORDED_STAGES.map((stage, index) => ({ stage, count: values[index] })), totalEvents, from: since, through };
}

// ── Pulse KPIs ──
export function usePulseKPIs(period: 'today' | '7d' | 'mtd' = '7d') {
  const { user } = useAuth();
  const { isAdmin, isLoading: checkingAccess } = useAdminCheck();
  const enabled = !!user && isAdmin && !checkingAccess;
  const query = useQuery({
    queryKey: ['mcc-pulse-kpis', period, user?.id],
    enabled,
    queryFn: async () => {
      const now = new Date();
      const today = bangkokTodayISO(now);
      const since = period === '7d' ? new Date(now.getTime() - 7 * 86400000).toISOString()
        : new Date(`${period === 'mtd' ? `${today.slice(0, 8)}01` : today}T00:00:00+07:00`).toISOString();
      const evidence = await readRecordedLandingEvents({ kind: 'platform' }, since, now.toISOString());
      const [views, ctaClicks, intents, completed, secondAction] = evidence.counts.map(item => item.count);
      return {
        ...evidence, traffic: views, ctaClicks, intents, completed, secondAction,
        // Compatibility fields stay unknown: event counters do not establish
        // revenue, unique-user cohorts or conversion/financial ratios.
        revenue: null, conversionPct: null, ctaRate: null, secondActionRate: null,
        activeUsers: null, totalUsers: null, stateDistribution: null,
      };
    },
    refetchInterval: enabled ? 60_000 : false,
  });
  return { ...query, data: enabled && !query.isError ? query.data : undefined };
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

      (events || []).forEach((e) => {
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
            funnelMap[lid].revenue += (e.payload as Record<string, unknown>)?.amount as number || 0;
            break;
          case 'second_service_started': funnelMap[lid].secondAction++; break;
        }
      });

      return (landings || []).map((l) => ({
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

// AI Recommendations hooks removed — mcc_ai_recommendations table dropped 2026-06-06.



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
  const { user } = useAuth();
  const { isAdmin, isLoading: checkingAccess } = useAdminCheck();
  const enabled = !!user && isAdmin && !checkingAccess && !!userId;
  const query = useQuery({
    queryKey: ['mcc-user-timeline', userId, user?.id],
    enabled,
    queryFn: async () => {
      const [events, states, profile] = await Promise.all([
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
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('id, full_name, email, phone, avatar_url')
          .eq('id', userId)
          .maybeSingle(),
      ]);
      if (events.error) throw events.error;
      if (states.error) throw states.error;
      if (profile.error) throw profile.error;
      if (!events.data) throw new Error('Timeline events unavailable');
      return { events: events.data, state: states.data, profile: profile.data };
    },
  });
  return { ...query, data: enabled && !query.isError ? query.data : undefined };
}

// Campaign Rules hooks removed — mcc_campaign_rules table dropped 2026-06-06.



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
  const { user } = useAuth();
  const { isAdmin, isLoading: checkingAccess } = useAdminCheck();
  const enabled = !!user && isAdmin && !checkingAccess && !!landingId;
  const query = useQuery({
    queryKey: ['mcc-funnel-diagnostics', landingId, days, user?.id],
    enabled,
    queryFn: async () => {
      const since = new Date(Date.now() - days * 86400000).toISOString();
      return readRecordedLandingEvents({ kind: 'landing', landingId }, since, new Date().toISOString());
    },
  });
  return { ...query, data: enabled && !query.isError ? query.data : undefined };
}
