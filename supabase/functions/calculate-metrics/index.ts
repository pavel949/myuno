import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for optional date parameter
    let targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - 1); // Yesterday by default
    
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        if (body.date) {
          targetDate = new Date(body.date);
        }
      } catch {
        // Use default date if parsing fails
      }
    }

    const dateStr = targetDate.toISOString().split('T')[0];
    console.log(`Calculating metrics for date: ${dateStr}`);

    // Calculate all metrics
    const [
      totalUsersRes,
      newUsersRes,
      activeUsersRes,
      totalProvidersRes,
      activeProvidersRes,
      newProvidersRes,
      totalBookingsRes,
      newBookingsRes,
      completedBookingsRes,
      cancelledBookingsRes,
      gmvRes
    ] = await Promise.all([
      // Total users up to date
      supabase.from('profiles').select('id', { count: 'exact', head: true })
        .lte('created_at', `${dateStr}T23:59:59.999Z`),
      
      // New users on date
      supabase.from('profiles').select('id', { count: 'exact', head: true })
        .gte('created_at', `${dateStr}T00:00:00.000Z`)
        .lte('created_at', `${dateStr}T23:59:59.999Z`),
      
      // Active users (made booking on date)
      supabase.from('bookings').select('user_id')
        .gte('created_at', `${dateStr}T00:00:00.000Z`)
        .lte('created_at', `${dateStr}T23:59:59.999Z`),
      
      // Total providers
      supabase.from('providers').select('id', { count: 'exact', head: true })
        .lte('created_at', `${dateStr}T23:59:59.999Z`),
      
      // Active providers
      supabase.from('providers').select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .lte('created_at', `${dateStr}T23:59:59.999Z`),
      
      // New providers
      supabase.from('providers').select('id', { count: 'exact', head: true })
        .gte('created_at', `${dateStr}T00:00:00.000Z`)
        .lte('created_at', `${dateStr}T23:59:59.999Z`),
      
      // Total bookings
      supabase.from('bookings').select('id', { count: 'exact', head: true })
        .lte('created_at', `${dateStr}T23:59:59.999Z`),
      
      // New bookings
      supabase.from('bookings').select('id', { count: 'exact', head: true })
        .gte('created_at', `${dateStr}T00:00:00.000Z`)
        .lte('created_at', `${dateStr}T23:59:59.999Z`),
      
      // Completed bookings on date
      supabase.from('bookings').select('id', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('updated_at', `${dateStr}T00:00:00.000Z`)
        .lte('updated_at', `${dateStr}T23:59:59.999Z`),
      
      // Cancelled bookings on date
      supabase.from('bookings').select('id', { count: 'exact', head: true })
        .eq('status', 'cancelled')
        .gte('updated_at', `${dateStr}T00:00:00.000Z`)
        .lte('updated_at', `${dateStr}T23:59:59.999Z`),
      
      // GMV for date
      supabase.from('bookings').select('total_amount')
        .neq('status', 'cancelled')
        .gte('created_at', `${dateStr}T00:00:00.000Z`)
        .lte('created_at', `${dateStr}T23:59:59.999Z`)
    ]);

    // Calculate unique active users
    const activeUserIds = new Set(activeUsersRes.data?.map(b => b.user_id) || []);
    
    // Calculate GMV
    const gmv = gmvRes.data?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
    
    // Platform revenue (10% of GMV)
    const platformRevenue = gmv * 0.10;

    // Get subscription revenue
    const { data: subscriptions } = await supabase
      .from('vendor_subscriptions')
      .select('plan_id')
      .eq('status', 'active')
      .lte('current_period_start', `${dateStr}T23:59:59.999Z`)
      .gte('current_period_end', `${dateStr}T00:00:00.000Z`);

    // Get plan prices for subscription revenue calculation
    let subscriptionRevenue = 0;
    if (subscriptions && subscriptions.length > 0) {
      const planIds = [...new Set(subscriptions.map(s => s.plan_id))];
      const { data: plans } = await supabase
        .from('subscription_plans')
        .select('id, price_monthly')
        .in('id', planIds);
      
      if (plans) {
        const planPrices = new Map(plans.map(p => [p.id, p.price_monthly || 0]));
        // Daily portion of monthly subscriptions
        subscriptionRevenue = subscriptions.reduce((sum, s) => {
          return sum + (planPrices.get(s.plan_id) || 0) / 30;
        }, 0);
      }
    }

    const metrics = {
      date: dateStr,
      total_users: totalUsersRes.count || 0,
      new_users: newUsersRes.count || 0,
      active_users: activeUserIds.size,
      total_providers: totalProvidersRes.count || 0,
      active_providers: activeProvidersRes.count || 0,
      new_providers: newProvidersRes.count || 0,
      total_bookings: totalBookingsRes.count || 0,
      new_bookings: newBookingsRes.count || 0,
      completed_bookings: completedBookingsRes.count || 0,
      cancelled_bookings: cancelledBookingsRes.count || 0,
      gmv: gmv,
      platform_revenue: platformRevenue,
      subscription_revenue: subscriptionRevenue
    };

    console.log('Calculated metrics:', metrics);

    // Upsert metrics
    const { error: upsertError } = await supabase
      .from('platform_metrics')
      .upsert(metrics, { onConflict: 'date' });

    if (upsertError) {
      console.error('Error upserting metrics:', upsertError);
      throw upsertError;
    }

    console.log(`Successfully saved metrics for ${dateStr}`);

    return new Response(
      JSON.stringify({ success: true, metrics }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error calculating metrics:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
