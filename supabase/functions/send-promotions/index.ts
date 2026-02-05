import { createClient } from '../_shared/supabase.ts';

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
  target_users?: 'all' | 'subscribed' | 'active';
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload: PromotionPayload = await req.json();
    
    console.log('Sending promotion:', payload);

    // Get users who have promotions enabled
    const { data: preferences, error: prefError } = await supabase
      .from('notification_preferences')
      .select('user_id')
      .eq('promotions', true);

    if (prefError) {
      console.error('Error fetching preferences:', prefError);
      throw prefError;
    }

    const userIds = preferences?.map(p => p.user_id) || [];
    console.log(`Found ${userIds.length} users with promotions enabled`);

    if (userIds.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          sent: 0, 
          message: 'No users have promotions enabled' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create notifications for all eligible users
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

    console.log(`Created ${notifications.length} notifications`);

    // Get push subscriptions for these users
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', userIds);

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
    }

    const pushCount = subscriptions?.length || 0;
    console.log(`Found ${pushCount} push subscriptions`);

    // Note: Actual push notification sending would require web-push library
    // and VAPID keys. For now, we create in-app notifications.

    return new Response(
      JSON.stringify({
        success: true,
        sent: notifications.length,
        push_eligible: pushCount,
        message: `Promotion sent to ${notifications.length} users`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending promotions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
