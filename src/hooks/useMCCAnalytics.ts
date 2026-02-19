import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, startOfDay, format } from 'date-fns';

export type AnalyticsPeriod = '7d' | '30d' | '90d' | 'ytd';

function getPeriodStart(period: AnalyticsPeriod): Date {
  const now = new Date();
  switch (period) {
    case '7d': return subDays(now, 7);
    case '30d': return subDays(now, 30);
    case '90d': return subDays(now, 90);
    case 'ytd': return new Date(now.getFullYear(), 0, 1);
  }
}

export function useMCCAnalytics(period: AnalyticsPeriod = '30d') {
  const periodStart = getPeriodStart(period);
  const prevPeriodStart = getPeriodStart(
    period === '7d' ? '7d' : period === '30d' ? '30d' : period === '90d' ? '90d' : 'ytd'
  );
  const prevPeriodStartDate = subDays(periodStart, periodStart.getTime() - prevPeriodStart.getTime() > 0
    ? Math.floor((periodStart.getTime() - prevPeriodStart.getTime()) / 86400000)
    : 30);

  // --- Channel metrics ---
  const channelMetrics = useQuery({
    queryKey: ['mcc-channel-metrics', period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mcc_channel_metrics')
        .select('*')
        .gte('date', format(periodStart, 'yyyy-MM-dd'))
        .order('date', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // --- Orders / revenue ---
  const ordersMetrics = useQuery({
    queryKey: ['mcc-orders-metrics', period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, total_amount, created_at, vertical, status')
        .gte('created_at', periodStart.toISOString())
        .not('deleted_at', 'not.is', null);
      if (error) throw error;
      return data || [];
    },
  });

  // --- Previous period orders for comparison ---
  const prevOrdersMetrics = useQuery({
    queryKey: ['mcc-prev-orders-metrics', period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, total_amount, created_at')
        .gte('created_at', prevPeriodStartDate.toISOString())
        .lt('created_at', periodStart.toISOString());
      if (error) throw error;
      return data || [];
    },
  });

  // --- User events by type ---
  const userEvents = useQuery({
    queryKey: ['mcc-user-events', period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_events')
        .select('event_type, event_category, event_name, created_at, page_path')
        .gte('created_at', periodStart.toISOString());
      if (error) throw error;
      return data || [];
    },
  });

  // --- Top pages ---
  const topPages = useQuery({
    queryKey: ['mcc-top-pages', period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_views')
        .select('page_path, time_on_page')
        .gte('viewed_at', periodStart.toISOString());
      if (error) throw error;

      // Aggregate by path
      const pageCounts: Record<string, { views: number; totalTime: number }> = {};
      (data || []).forEach(pv => {
        if (!pv.page_path) return;
        if (!pageCounts[pv.page_path]) pageCounts[pv.page_path] = { views: 0, totalTime: 0 };
        pageCounts[pv.page_path].views++;
        pageCounts[pv.page_path].totalTime += pv.time_on_page || 0;
      });

      return Object.entries(pageCounts)
        .map(([path, stats]) => ({
          path,
          views: stats.views,
          avgTime: stats.views > 0 ? Math.round(stats.totalTime / stats.views) : 0,
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);
    },
  });

  // --- User segments distribution ---
  const segmentsDistribution = useQuery({
    queryKey: ['mcc-segments-distribution'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_segments')
        .select('lifecycle_stage, value_segment, is_vip, is_at_risk');
      if (error) throw error;

      const lifecycle: Record<string, number> = {};
      const value: Record<string, number> = {};
      let vipCount = 0;
      let atRiskCount = 0;

      (data || []).forEach(seg => {
        if (seg.lifecycle_stage) lifecycle[seg.lifecycle_stage] = (lifecycle[seg.lifecycle_stage] || 0) + 1;
        if (seg.value_segment) value[seg.value_segment] = (value[seg.value_segment] || 0) + 1;
        if (seg.is_vip) vipCount++;
        if (seg.is_at_risk) atRiskCount++;
      });

      return { lifecycle, value, vipCount, atRiskCount, total: data?.length || 0 };
    },
  });

  // Computed aggregates from channel metrics
  const channelSummary = (() => {
    const rows = channelMetrics.data || [];
    const grouped: Record<string, { impressions: number; clicks: number; leads: number; conversions: number; spend: number; revenue: number }> = {};

    rows.forEach(row => {
      if (!grouped[row.channel]) {
        grouped[row.channel] = { impressions: 0, clicks: 0, leads: 0, conversions: 0, spend: 0, revenue: 0 };
      }
      grouped[row.channel].impressions += row.impressions || 0;
      grouped[row.channel].clicks += row.clicks || 0;
      grouped[row.channel].leads += row.leads || 0;
      grouped[row.channel].conversions += row.conversions || 0;
      grouped[row.channel].spend += Number(row.spend) || 0;
      grouped[row.channel].revenue += Number(row.revenue) || 0;
    });

    return Object.entries(grouped).map(([channel, stats]) => ({
      channel,
      ...stats,
      roas: stats.spend > 0 ? parseFloat((stats.revenue / stats.spend).toFixed(1)) : null,
    }));
  })();

  // Revenue metrics
  const currentRevenue = (ordersMetrics.data || []).reduce((s, o) => s + Number(o.total_amount || 0), 0);
  const prevRevenue = (prevOrdersMetrics.data || []).reduce((s, o) => s + Number(o.total_amount || 0), 0);
  const revenueChange = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0;

  const totalSpend = channelSummary.reduce((s, c) => s + c.spend, 0);
  const totalConversions = channelSummary.reduce((s, c) => s + c.conversions, 0);
  const overallRoas = totalSpend > 0 ? currentRevenue / totalSpend : 0;
  const cac = totalConversions > 0 ? totalSpend / totalConversions : 0;

  return {
    channelSummary,
    topPages: topPages.data || [],
    segmentsDistribution: segmentsDistribution.data,
    eventsByType: (userEvents.data || []).reduce<Record<string, number>>((acc, e) => {
      const key = e.event_category || e.event_type;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {}),
    summary: {
      revenue: currentRevenue,
      revenueChange,
      spend: totalSpend,
      roas: overallRoas,
      cac,
      conversions: totalConversions,
    },
    isLoading: channelMetrics.isLoading || ordersMetrics.isLoading || userEvents.isLoading,
    hasRealData: (channelMetrics.data?.length || 0) > 0 || (ordersMetrics.data?.length || 0) > 0,
  };
}
