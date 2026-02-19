import { createClient, createServiceClient } from '../_shared/supabase.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PromotionPayload {
  title: string;
  title_ru: string;
  body: string;
  body_ru: string;
  promo_code?: string;
  discount?: number;
  valid_until?: string;
  category?: string;
  channel?: 'inapp' | 'email';
  segment_filter?: 
    | 'all'
    | 'new'
    | 'active'
    | 'at_risk'
    | 'dormant'
    | 'churned'
    | 'vip'
    | 'high'
    | 'mid'
    | 'low';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload: PromotionPayload = await req.json();
    const segmentFilter = payload.segment_filter || 'all';

    console.log('Sending promotion with segment filter:', segmentFilter);

    // Get eligible user IDs based on segment filter
    let userIds: string[] = [];

    if (segmentFilter === 'all') {
      // All users with promotions enabled
      const { data: preferences, error: prefError } = await supabase
        .from('notification_preferences')
        .select('user_id')
        .eq('promotions', true);
      if (prefError) throw prefError;
      userIds = preferences?.map(p => p.user_id) || [];
    } else {
      // Filter by user segment
      const lifecycleStages = ['new', 'active', 'at_risk', 'dormant', 'churned'];
      const isLifecycle = lifecycleStages.includes(segmentFilter);
      const isVip = segmentFilter === 'vip';

      let segmentQuery = supabase
        .from('user_segments')
        .select('user_id');

      if (isLifecycle) {
        segmentQuery = segmentQuery.eq('lifecycle_stage', segmentFilter);
      } else if (isVip) {
        segmentQuery = segmentQuery.eq('is_vip', true);
      } else {
        // value segment: high, mid, low
        segmentQuery = segmentQuery.eq('value_segment', segmentFilter);
      }

      const { data: segments, error: segError } = await segmentQuery;
      if (segError) throw segError;

      const segmentUserIds = segments?.map(s => s.user_id) || [];

      if (segmentUserIds.length === 0) {
        return new Response(
          JSON.stringify({ success: true, sent: 0, message: 'No users in this segment' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Cross with notification preferences
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('user_id')
        .eq('promotions', true)
        .in('user_id', segmentUserIds);

      userIds = prefs?.map(p => p.user_id) || segmentUserIds;
    }

    console.log(`Found ${userIds.length} eligible users for segment: ${segmentFilter}`);

    if (userIds.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No users match the criteria' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create in-app notifications
    const notifications = userIds.map(user_id => ({
      user_id,
      title: payload.title_ru || payload.title,
      body: payload.body_ru || payload.body,
      type: 'promotion',
      data: {
        promo_code: payload.promo_code,
        discount: payload.discount,
        valid_until: payload.valid_until,
        category: payload.category,
        segment_filter: segmentFilter,
      },
      is_read: false,
    }));

    const { error: insertError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (insertError) {
      console.error('Error inserting notifications:', insertError);
      throw insertError;
    }

    console.log(`Created ${notifications.length} in-app notifications`);

    // Email channel via Resend (if requested)
    let emailsSent = 0;
    if (payload.channel === 'email') {
      const resendKey = Deno.env.get('RESEND_API_KEY');
      if (resendKey) {
        // Get emails for these users from profiles
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email, first_name')
          .in('id', userIds.slice(0, 100)); // Limit for safety

        for (const profile of profiles || []) {
          if (!profile.email) continue;
          try {
            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                from: 'UNO Platform <noreply@myuno.app>',
                to: profile.email,
                subject: payload.title_ru || payload.title,
                html: `<p>Hi ${profile.first_name || ''},</p><p>${payload.body_ru || payload.body}</p>${payload.promo_code ? `<p><strong>Promo code: ${payload.promo_code}</strong></p>` : ''}`,
              }),
            });
            emailsSent++;
          } catch (emailErr) {
            console.error(`Email error for ${profile.email}:`, emailErr);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: notifications.length,
        emails_sent: emailsSent,
        segment: segmentFilter,
        message: `Promotion sent to ${notifications.length} users in segment: ${segmentFilter}`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending promotions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
