import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { withRateLimit, RATE_LIMITS } from '../_shared/rate-limit.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RestaurantCheckoutRequest {
  booking_type: 'table_reservation' | 'food_delivery' | 'set_menu';
  restaurant_id: string;
  restaurant_name: string;
  amount: number;
  currency?: string;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  metadata?: Record<string, string>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      console.error("User authentication failed:", userError);
      throw new Error("Unauthorized");
    }

    // Rate limiting - payment endpoints (20/min)
    const rateLimitResponse = await withRateLimit(
      req,
      'create-restaurant-checkout',
      RATE_LIMITS.payment,
      corsHeaders,
      user.id
    );
    if (rateLimitResponse) return rateLimitResponse;

    console.log("Authenticated user:", user.id, user.email);

    // Parse request body
    const { 
      booking_type, 
      restaurant_id, 
      restaurant_name, 
      amount, 
      currency = "thb",
      items = [],
      metadata = {}
    }: RestaurantCheckoutRequest = await req.json();
    
    if (!amount || amount < 1) {
      console.error("Invalid amount:", amount);
      throw new Error("Amount must be greater than 0");
    }

    console.log("Creating restaurant checkout session:", { booking_type, restaurant_id, amount, currency });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Check if customer exists
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log("Found existing customer:", customerId);
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;
      console.log("Created new customer:", customerId);
    }

    // Get origin for redirect URLs
    const origin = req.headers.get("origin") || "http://localhost:5173";
    
    // Build line items
    let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];
    
    if (items.length > 0) {
      // Use individual items for delivery/set menu
      lineItems = items.map(item => ({
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: item.name,
          },
          unit_amount: Math.round(item.price * 100), // Stripe expects amount in smallest currency unit
        },
        quantity: item.quantity,
      }));
    } else {
      // Single line item for table deposit
      const productName = booking_type === 'table_reservation' 
        ? `Table Reservation Deposit - ${restaurant_name}`
        : `Order - ${restaurant_name}`;
        
      lineItems = [{
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: productName,
            description: `${restaurant_name}`,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }];
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/restaurants/${restaurant_id}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/restaurants/${restaurant_id}?payment=cancelled`,
      metadata: {
        user_id: user.id,
        booking_type,
        restaurant_id,
        restaurant_name,
        amount: amount.toString(),
        currency,
        type: "restaurant_payment",
        ...metadata,
      },
    });

    console.log("Checkout session created:", session.id);

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error creating restaurant checkout session:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
