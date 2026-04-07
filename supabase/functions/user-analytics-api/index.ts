/**
 * User Analytics API Edge Function
 * AUTH_REQUIRED: Exposes sensitive analytics data. Requires authentication.
 */

// Deno.serve used (native edge runtime)
import { createClient } from '../_shared/supabase.ts';
import { requireAuth } from '../_shared/auth-guard.ts';
import { withRateLimit, RATE_LIMITS } from '../_shared/rate-limit.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://myuno.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Rate limit
  const rlResponse = await withRateLimit(req, 'user-analytics-api', RATE_LIMITS.default, corsHeaders);
  if (rlResponse) return rlResponse;

  // Auth required: sensitive analytics data
  const authResult = await requireAuth(req, corsHeaders);
  if (authResult instanceof Response) return authResult;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const endpoint = url.pathname.split('/').pop();
    const days = parseInt(url.searchParams.get('days') || '30');
    const responseFormat = url.searchParams.get('format') || 'json';

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    let data: unknown;

    switch (endpoint) {
      case 'summary': {
        const { data: daily, error } = await supabase
          .from('user_analytics_daily')
          .select('*')
          .gte('date', startDateStr)
          .order('date', { ascending: true });

        if (error) throw error;

        const totalSessions = daily?.reduce((sum, d) => sum + (d.sessions || 0), 0) || 0;
        const totalPageViews = daily?.reduce((sum, d) => sum + (d.page_views || 0), 0) || 0;
        const totalRevenue = daily?.reduce((sum, d) => sum + (Number(d.revenue) || 0), 0) || 0;

        data = {
          period: { days, start: startDateStr, end: new Date().toISOString().split('T')[0] },
          totalSessions,
          totalPageViews,
          totalRevenue,
        };
        break;
      }

      case 'daily': {
        const { data: daily, error } = await supabase
          .from('user_analytics_daily')
          .select('*')
          .gte('date', startDateStr)
          .order('date', { ascending: true });

        if (error) throw error;
        data = daily;
        break;
      }

      case 'segments': {
        const { data: segments, error } = await supabase
          .from('user_segments')
          .select('lifecycle_stage, value_segment, is_vip, is_at_risk');

        if (error) throw error;

        const segmentCounts: Record<string, number> = {};
        segments?.forEach((s) => {
          if (s.lifecycle_stage) {
            segmentCounts[s.lifecycle_stage] = (segmentCounts[s.lifecycle_stage] || 0) + 1;
          }
          if (s.is_vip) {
            segmentCounts['vip'] = (segmentCounts['vip'] || 0) + 1;
          }
          if (s.is_at_risk) {
            segmentCounts['at_risk'] = (segmentCounts['at_risk'] || 0) + 1;
          }
        });

        data = Object.entries(segmentCounts).map(([type, count]) => ({
          segment: type,
          count,
          percentage: ((count / (segments?.length || 1)) * 100).toFixed(2),
        }));
        break;
      }

      case 'cohorts': {
        const { data: cohorts, error } = await supabase
          .from('cohort_analytics')
          .select('*')
          .order('cohort_month', { ascending: true })
          .order('period_number', { ascending: true });

        if (error) throw error;
        data = cohorts;
        break;
      }

      case 'users': {
        const limit = parseInt(url.searchParams.get('limit') || '100');
        const offset = parseInt(url.searchParams.get('offset') || '0');

        const { data: profiles, error: profilesErr } = await supabase
          .from('profiles')
          .select('id, email, full_name, created_at')
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (profilesErr) throw profilesErr;

        const userIds = profiles?.map((p) => p.id) || [];

        const { data: segments, error: segmentsErr } = await supabase
          .from('user_segments')
          .select('user_id, lifecycle_stage, value_segment, is_vip, is_at_risk')
          .in('user_id', userIds);

        if (segmentsErr) throw segmentsErr;

        const segmentMap = new Map<string, string[]>();
        segments?.forEach((s) => {
          const existing = segmentMap.get(s.user_id) || [];
          if (s.lifecycle_stage) existing.push(s.lifecycle_stage);
          if (s.is_vip) existing.push('vip');
          if (s.is_at_risk) existing.push('at_risk');
          segmentMap.set(s.user_id, [...new Set(existing)]);
        });

        data = profiles?.map((p) => ({
          ...p,
          segments: segmentMap.get(p.id) || [],
        }));
        break;
      }

      case 'realtime': {
        const { data: stats, error } = await supabase
          .from('realtime_stats')
          .select('*')
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        data = stats || {
          online_users: 0,
          active_sessions: 0,
          page_views_today: 0,
          orders_today: 0,
          revenue_today: 0,
          new_users_today: 0,
        };
        break;
      }

      case 'events': {
        const limit = parseInt(url.searchParams.get('limit') || '100');
        const eventType = url.searchParams.get('event_type');

        let query = supabase
          .from('user_events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (eventType) {
          query = query.eq('event_type', eventType);
        }

        const { data: events, error } = await query;
        if (error) throw error;
        data = events;
        break;
      }

      default:
        return new Response(JSON.stringify({ error: 'Unknown endpoint' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    if (responseFormat === 'csv' && Array.isArray(data)) {
      const headers = Object.keys((data as Record<string, unknown>[])[0] || {}).join(',');
      const rows = (data as Record<string, unknown>[]).map((row) =>
        Object.values(row)
          .map((v) => (typeof v === 'object' ? JSON.stringify(v) : v))
          .join(',')
      );
      const csv = [headers, ...rows].join('\n');

      return new Response(csv, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${endpoint}_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Analytics API error:', err);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
