import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { withRateLimit, RATE_LIMITS } from '../_shared/rate-limit.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface MarketCheckoutRequest {
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  delivery_fee: number;
  total_amount: number;
  currency?: string;
  recipient_name: string;
  recipient_phone: string;
  delivery_address: string;
  delivery_type: 'local' | 'international';
  shipping_zone?: string;
  store_id?: string;
  store_name?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("create-market-checkout: Starting request processing");
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    console.log("create-market-checkout: Auth header present:", !!authHeader);
    
    if (!authHeader) {
      console.error("create-market-checkout: No authorization header");
      return new Response(
        JSON.stringify({ error: "Please sign in to continue" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      console.error("create-market-checkout: User authentication failed:", userError);
      return new Response(
        JSON.stringify({ error: "Session expired. Please sign in again." }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    // Rate limiting - payment endpoints (20/min)
    const rateLimitResponse = await withRateLimit(
      req,
      'create-market-checkout',
      RATE_LIMITS.payment,
      corsHeaders,
      user.id
    );
    if (rateLimitResponse) return rateLimitResponse;

    console.log("create-market-checkout: User authenticated:", user.id);

    const body: MarketCheckoutRequest = await req.json();
    const { 
      items, 
      delivery_fee, 
      total_amount, 
      currency = "THB",
      recipient_name,
      recipient_phone,
      delivery_address,
      delivery_type,
      shipping_zone,
      store_id,
      store_name
    } = body;

    if (!items || items.length === 0) {
      throw new Error("Cart is empty");
    }

    if (total_amount < 1) {
      throw new Error("Total must be at least 1");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Get or create Stripe customer
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
    }

    const origin = req.headers.get("origin") || "https://id-preview--dcc2b024-7627-4ad9-a915-a3df3dd839f0.lovable.app";

    // Build line items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(item => ({
      price_data: {
        currency: currency.toLowerCase(),
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    // Add delivery fee
    if (delivery_fee > 0) {
      lineItems.push({
        price_data: {
          currency: currency.toLowerCase(),
          product_data: { 
            name: delivery_type === 'international' 
              ? `International Shipping / Международная доставка${shipping_zone ? ` (${shipping_zone})` : ''}` 
              : "Delivery / Доставка" 
          },
          unit_amount: Math.round(delivery_fee * 100),
        },
        quantity: 1,
      });
    }

    // Create Stripe Checkout Session with card and PromptPay (Thai QR)
    const paymentMethods: ("card" | "promptpay")[] = currency.toUpperCase() === "THB" 
      ? ["card", "promptpay"] 
      : ["card"];
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: paymentMethods,
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/market/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/market/checkout?canceled=true`,
      metadata: {
        user_id: user.id,
        type: "market_payment",
        store_id: store_id || "",
        store_name: store_name || "",
        recipient_name,
        recipient_phone,
        delivery_address,
        delivery_type,
        shipping_zone: shipping_zone || "",
        total_amount: total_amount.toString(),
        currency,
      },
    });

    console.log("Market checkout session created:", session.id);

    return new Response(
      JSON.stringify({ 
        url: session.url, 
        sessionId: session.id 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error creating market checkout:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
