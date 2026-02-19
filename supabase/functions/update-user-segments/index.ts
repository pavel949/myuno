import { createServiceClient } from '../_shared/supabase.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createServiceClient();
    console.log('[update-user-segments] Starting segment calculation...');

    // Get all users from profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, created_at');

    if (profilesError) throw profilesError;
    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ success: true, processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[update-user-segments] Processing ${profiles.length} users...`);

    let processed = 0;
    let errors = 0;

    for (const profile of profiles) {
      try {
        const userId = profile.id;
        const now = new Date();

        // --- Orders metrics ---
        const { data: orders } = await supabase
          .from('orders')
          .select('id, total_amount, created_at, vertical')
          .eq('customer_user_id', userId)
          .not('status', 'eq', 'cancelled');

        const totalOrders = orders?.length || 0;
        const totalSpent = orders?.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0) || 0;
        const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
        const lastOrderAt = orders?.length
          ? orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
          : null;
        const firstOrderAt = orders?.length
          ? orders.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0].created_at
          : null;
        const daysSinceLastOrder = lastOrderAt
          ? Math.floor((now.getTime() - new Date(lastOrderAt).getTime()) / 86400000)
          : null;

        // Preferred vertical (most ordered from)
        const verticalCounts: Record<string, number> = {};
        orders?.forEach(o => {
          if (o.vertical) verticalCounts[o.vertical] = (verticalCounts[o.vertical] || 0) + 1;
        });
        const preferredVertical = Object.entries(verticalCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

        // --- Sessions metrics ---
        const { data: sessions } = await supabase
          .from('user_sessions')
          .select('id, started_at, ended_at, device_type')
          .eq('user_id', userId);

        const totalSessions = sessions?.length || 0;
        const lastSessionAt = sessions?.length
          ? sessions.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())[0].started_at
          : null;
        const daysSinceLastVisit = lastSessionAt
          ? Math.floor((now.getTime() - new Date(lastSessionAt).getTime()) / 86400000)
          : null;

        // Preferred device
        const deviceCounts: Record<string, number> = {};
        sessions?.forEach(s => {
          if (s.device_type) deviceCounts[s.device_type] = (deviceCounts[s.device_type] || 0) + 1;
        });
        const preferredDevice = Object.entries(deviceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'desktop';

        // --- Page views ---
        const { count: totalPageViews } = await supabase
          .from('page_views')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);

        // --- Lifecycle stage ---
        const accountAgeDays = Math.floor(
          (now.getTime() - new Date(profile.created_at).getTime()) / 86400000
        );

        let lifecycleStage = 'new';
        if (accountAgeDays <= 7 && totalOrders === 0) {
          lifecycleStage = 'new';
        } else if (totalOrders > 0 && (daysSinceLastVisit === null || daysSinceLastVisit <= 30)) {
          lifecycleStage = 'active';
        } else if (daysSinceLastVisit !== null && daysSinceLastVisit > 30 && daysSinceLastVisit <= 60) {
          lifecycleStage = 'at_risk';
        } else if (daysSinceLastVisit !== null && daysSinceLastVisit > 60 && daysSinceLastVisit <= 120) {
          lifecycleStage = 'dormant';
        } else if (daysSinceLastVisit !== null && daysSinceLastVisit > 120) {
          lifecycleStage = 'churned';
        }

        // --- Value segment ---
        let valueSegment = 'low';
        if (totalSpent >= 50000) valueSegment = 'vip';
        else if (totalSpent >= 15000) valueSegment = 'high';
        else if (totalSpent >= 3000) valueSegment = 'mid';

        // --- Engagement level ---
        let engagementLevel = 'low';
        if (totalSessions >= 20 || (totalPageViews || 0) >= 50) engagementLevel = 'high';
        else if (totalSessions >= 5 || (totalPageViews || 0) >= 15) engagementLevel = 'medium';

        // --- Flags ---
        const isVip = totalSpent >= 50000;
        const isAtRisk = daysSinceLastVisit !== null && daysSinceLastVisit > 21 && lifecycleStage === 'active';

        // Acquisition cohort (year-month of signup)
        const acquisitionCohort = new Date(profile.created_at).toISOString().slice(0, 7);

        // Upsert segment
        const { error: upsertError } = await supabase
          .from('user_segments')
          .upsert({
            user_id: userId,
            lifecycle_stage: lifecycleStage,
            value_segment: valueSegment,
            engagement_level: engagementLevel,
            preferred_vertical: preferredVertical,
            preferred_device: preferredDevice,
            total_orders: totalOrders,
            total_spent: totalSpent,
            avg_order_value: avgOrderValue,
            lifetime_value: totalSpent, // LTV = historical spend (simplified)
            first_order_at: firstOrderAt,
            last_order_at: lastOrderAt,
            days_since_last_order: daysSinceLastOrder,
            total_sessions: totalSessions,
            total_page_views: totalPageViews || 0,
            first_seen_at: profile.created_at,
            last_seen_at: lastSessionAt || profile.created_at,
            days_since_last_visit: daysSinceLastVisit,
            acquisition_cohort: acquisitionCohort,
            is_vip: isVip,
            is_at_risk: isAtRisk,
            updated_at: now.toISOString(),
          }, { onConflict: 'user_id' });

        if (upsertError) {
          console.error(`Error upserting segment for user ${userId}:`, upsertError);
          errors++;
        } else {
          processed++;
        }
      } catch (userError) {
        console.error(`Error processing user ${profile.id}:`, userError);
        errors++;
      }
    }

    console.log(`[update-user-segments] Done. Processed: ${processed}, Errors: ${errors}`);

    return new Response(
      JSON.stringify({ success: true, processed, errors, total: profiles.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[update-user-segments] Fatal error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
