import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createStripeClient } from "../_shared/stripe.ts";
import { createClient } from "../_shared/supabase.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ServiceCheckoutRequest {
  services: Array<{
    id: string;
    name: string;
    price: number;
    duration_minutes?: number;
  }>;
  service_fee: number;
  total_amount: number;
  currency?: string;
  scheduled_at: string;
  address: string;
  contact_name: string;
  contact_phone: string;
  contact_email?: string;
  provider_id: string;
  provider_name: string;
  notes?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("create-service-checkout: Starting request processing");
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Please sign in to continue" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Session expired. Please sign in again." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const body: ServiceCheckoutRequest = await req.json();
    const { 
      services, service_fee, total_amount, currency = "THB",
      scheduled_at, address, contact_name, contact_phone, contact_email,
      provider_id, provider_name, notes
    } = body;

    if (!services || services.length === 0) throw new Error("No services selected");
    if (total_amount < 1) throw new Error("Total must be at least 1");

    const stripe = createStripeClient();

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
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

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = services.map(s => ({
      price_data: {
        currency: currency.toLowerCase(),
        product_data: { name: s.name },
        unit_amount: Math.round(s.price * 100),
      },
      quantity: 1,
    }));

    if (service_fee > 0) {
      lineItems.push({
        price_data: {
          currency: currency.toLowerCase(),
          product_data: { name: "Service Fee / Сервисный сбор" },
          unit_amount: Math.round(service_fee * 100),
        },
        quantity: 1,
      });
    }

    const paymentMethods: ("card" | "promptpay")[] = currency.toUpperCase() === "THB" 
      ? ["card", "promptpay"] : ["card"];
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: paymentMethods,
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/services/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/services/booking/${provider_id}?canceled=true`,
      metadata: {
        user_id: user.id,
        type: "service_payment",
        provider_id, provider_name, scheduled_at, address,
        contact_name, contact_phone, contact_email: contact_email || "",
        notes: notes || "", total_amount: total_amount.toString(), currency,
      },
    });

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error creating service checkout:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
