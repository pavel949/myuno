import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Get raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      console.error("No Stripe signature found");
      throw new Error("No Stripe signature");
    }

    // Verify webhook signature
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    let event: Stripe.Event;

    if (webhookSecret) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err: unknown) {
        const errMessage = err instanceof Error ? err.message : "Unknown error";
        console.error("Webhook signature verification failed:", errMessage);
        throw new Error(`Webhook signature verification failed: ${errMessage}`);
      }
    } else {
      // For development without webhook secret
      console.warn("No STRIPE_WEBHOOK_SECRET set, parsing event without verification");
      event = JSON.parse(body);
    }

    console.log("Received Stripe event:", event.type, event.id);

    // Initialize Supabase with service role for admin access
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log("Processing checkout session:", session.id);
      console.log("Session metadata:", session.metadata);

      if (session.metadata?.type === "wallet_topup") {
        const userId = session.metadata.user_id;
        const amount = parseFloat(session.metadata.amount);
        const currency = session.metadata.currency || "RUB";

        console.log("Processing wallet top up for user:", userId, "amount:", amount);

        // Get or create wallet
        const { data: walletData, error: walletError } = await supabaseAdmin
          .rpc('get_or_create_wallet', { p_user_id: userId });

        if (walletError) {
          console.error("Error getting wallet:", walletError);
          throw walletError;
        }

        console.log("Got wallet:", walletData.id, "current balance:", walletData.balance);

        // Update wallet balance
        const newBalance = Number(walletData.balance) + amount;
        const { error: updateError } = await supabaseAdmin
          .from('wallets')
          .update({ balance: newBalance })
          .eq('id', walletData.id);

        if (updateError) {
          console.error("Error updating wallet balance:", updateError);
          throw updateError;
        }

        console.log("Updated wallet balance to:", newBalance);

        // Create transaction record
        const { error: txError } = await supabaseAdmin
          .from('wallet_transactions')
          .insert({
            wallet_id: walletData.id,
            user_id: userId,
            type: 'topup',
            amount: amount,
            currency: currency.toUpperCase(),
            description: `Wallet top up via Stripe`,
            description_ru: `Пополнение кошелька через Stripe`,
            reference_type: 'stripe_checkout',
            reference_id: session.id,
            status: 'completed',
          });

        if (txError) {
          console.error("Error creating transaction:", txError);
          throw txError;
        }

        console.log("Created transaction record for amount:", amount);

        // Create notification for user
        await supabaseAdmin
          .from('notifications')
          .insert({
            user_id: userId,
            title: 'Wallet Top Up Successful',
            body: `Your wallet has been topped up with ${amount} ${currency.toUpperCase()}`,
            type: 'payment',
            data: {
              amount,
              currency,
              session_id: session.id,
            },
          });

        console.log("Wallet top up completed successfully");
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Webhook error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
