import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createStripeClient } from "../_shared/stripe.ts";
import { createClient } from "../_shared/supabase.ts";
import { withRateLimit, RATE_LIMITS } from '../_shared/rate-limit.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  console.log(`[CHECK-VENDOR-SUB] ${step}`, details ? JSON.stringify(details) : '');
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Rate limiting - auth/subscription endpoints (5/min)
    const rateLimitResponse = await withRateLimit(
      req,
      'check-vendor-subscription',
      RATE_LIMITS.auth,
      corsHeaders,
      user.id
    );
    if (rateLimitResponse) return rateLimitResponse;

    // Get provider for this user
    const { data: provider } = await supabaseClient
      .from('providers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!provider) {
      return new Response(JSON.stringify({ 
        subscribed: false, 
        plan: null,
        message: 'No vendor profile found'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get subscription with plan details
    const { data: subscription } = await supabaseClient
      .from('vendor_subscriptions')
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq('provider_id', provider.id)
      .single();

    if (!subscription) {
      // Return free plan info if no subscription
      const { data: freePlan } = await supabaseClient
        .from('subscription_plans')
        .select('*')
        .eq('slug', 'free')
        .single();

      return new Response(JSON.stringify({ 
        subscribed: false,
        plan: freePlan,
        limits: freePlan?.limits || { max_listings: 3, commission_percent: 15 },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const isActive = subscription.status === 'active' || subscription.status === 'trialing';
    const plan = subscription.plan;

    logStep("Subscription found", { 
      status: subscription.status, 
      plan: plan?.slug,
      ends: subscription.current_period_end 
    });

    return new Response(JSON.stringify({
      subscribed: isActive,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        billing_cycle: subscription.billing_cycle,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
      },
      plan: plan,
      limits: plan?.limits || {},
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message });
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
