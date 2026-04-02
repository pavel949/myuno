import { createStripeClient } from "../_shared/stripe.ts";
import { createClient, createServiceClient } from "../_shared/supabase.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PLATFORM_FEE_RATE = 0.10;

interface WellnessCheckoutRequest {
  vertical: "beauty" | "fitness" | "medical";
  items: Array<{
    id: string;
    name: string;
    price: number;
    duration_minutes?: number;
  }>;
  total_amount: number;
  currency?: string;
  scheduled_at: string;
  contact_name: string;
  contact_phone: string;
  contact_email?: string;
  provider_id?: string;
  provider_name?: string;
  notes?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const body: WellnessCheckoutRequest = await req.json();
    const {
      vertical, items, total_amount, currency = "THB",
      scheduled_at, contact_name, contact_phone, contact_email,
      provider_id, provider_name, notes,
    } = body;

    if (!vertical || !["beauty", "fitness", "medical"].includes(vertical)) {
      throw new Error("Invalid vertical");
    }
    if (!items || items.length === 0) throw new Error("No items selected");
    if (total_amount < 1) throw new Error("Total must be at least 1");

    // Calculate 10% platform fee
    const serviceFee = Math.round(total_amount * PLATFORM_FEE_RATE * 100) / 100;
    const totalWithFee = total_amount + serviceFee;

    // Order-First: create order before Stripe session
    const supabaseAdmin = createServiceClient();
    const { data: orderData, error: orderError } = await supabaseAdmin.rpc("create_order_atomic", {
      p_user_id: user.id,
      p_order_type: vertical,
      p_total_amount: totalWithFee,
      p_currency: currency,
      p_payment_method: "stripe",
      p_items: items.map((item) => ({
        product_id: item.id,
        product_name: item.name,
        quantity: 1,
        unit_price: item.price,
        subtotal: item.price,
      })),
      p_metadata: {
        vertical,
        scheduled_at,
        contact_name,
        contact_phone,
        contact_email: contact_email || null,
        provider_id: provider_id || null,
        provider_name: provider_name || null,
        notes: notes || null,
        service_fee: serviceFee,
        platform_fee_rate: PLATFORM_FEE_RATE,
      },
    });

    if (orderError) {
      console.error("Order creation error:", orderError);
      throw new Error("Failed to create order");
    }

    const orderId = orderData;

    // Stripe checkout
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

    const origin = req.headers.get("origin") || Deno.env.get("SITE_URL") || "https://uno.ae";

    const lineItems = items.map((s) => ({
      price_data: {
        currency: currency.toLowerCase(),
        product_data: { name: s.name },
        unit_amount: Math.round(s.price * 100),
      },
      quantity: 1,
    }));

    // Add platform service fee line item
    if (serviceFee > 0) {
      lineItems.push({
        price_data: {
          currency: currency.toLowerCase(),
          product_data: { name: "Platform Service Fee / Сервисный сбор" },
          unit_amount: Math.round(serviceFee * 100),
        },
        quantity: 1,
      });
    }

    const paymentMethods: ("card" | "promptpay")[] =
      currency.toUpperCase() === "THB" ? ["card", "promptpay"] : ["card"];

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: paymentMethods,
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/wellness/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/${vertical}?canceled=true`,
      metadata: {
        user_id: user.id,
        type: "service_payment",
        order_id: orderId,
        vertical,
        provider_id: provider_id || "",
        provider_name: provider_name || "",
        scheduled_at,
        contact_name,
        contact_phone,
        contact_email: contact_email || "",
        notes: notes || "",
        total_amount: total_amount.toString(),
        service_fee: serviceFee.toString(),
        currency,
      },
    });

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id, orderId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error creating wellness checkout:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
