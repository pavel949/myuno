 // Deno.serve used (native edge runtime)
import { createStripeClient } from "../_shared/stripe.ts";
import { createClient } from "../_shared/supabase.ts";
import { withRateLimit, RATE_LIMITS } from "../_shared/rate-limit.ts";

 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
 };
 
 interface CheckoutRequest {
   order_id: string;
   order_type: string;
   amount: number;
   currency?: string;
   description?: string;
   success_url?: string;
   cancel_url?: string;
 }
 
 Deno.serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   const supabaseClient = createClient(
     Deno.env.get("SUPABASE_URL") ?? "",
     Deno.env.get("SUPABASE_ANON_KEY") ?? ""
   );
 
   try {
     const authHeader = req.headers.get("Authorization");
     if (!authHeader) throw new Error("No authorization header");
 
     const token = authHeader.replace("Bearer ", "");
     const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
     
     if (userError || !user) throw new Error("Unauthorized");

     // Rate limiting
     const rlResponse = await withRateLimit(req, 'create-checkout', RATE_LIMITS.payment, corsHeaders, user.id);
     if (rlResponse) return rlResponse;

     const body: CheckoutRequest = await req.json();
     const { order_id, order_type, amount, currency = "THB", description, success_url, cancel_url } = body;
 
     if (!order_id || !amount) throw new Error("Missing order_id or amount");
 
     console.log(`[create-checkout] Processing ${order_type} order ${order_id} for ${amount} ${currency}`);
 
     const stripe = createStripeClient();
 
     // Get or create Stripe customer
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
     
     // Enable PromptPay for THB
     const paymentMethods: ("card" | "promptpay")[] = currency.toUpperCase() === "THB" 
       ? ["card", "promptpay"] 
       : ["card"];
 
     const session = await stripe.checkout.sessions.create({
       customer: customerId,
       payment_method_types: paymentMethods,
       line_items: [{
         price_data: {
           currency: currency.toLowerCase(),
           product_data: {
             name: description || `Order Payment`,
           },
           unit_amount: Math.round(amount * 100),
         },
         quantity: 1,
       }],
       mode: "payment",
       success_url: success_url || `${origin}/bookings/${order_id}?success=true`,
       cancel_url: cancel_url || `${origin}/bookings?canceled=true`,
       metadata: {
         order_id,
         order_type,
         user_id: user.id,
         type: "order_payment",
       },
     });
 
     // Update order status to pending payment
     await supabaseClient
       .from('orders')
       .update({ metadata: { stripe_session_id: session.id } })
       .eq('id', order_id);
 
     console.log(`[create-checkout] Session created: ${session.id}`);
 
     return new Response(
       JSON.stringify({ url: session.url, sessionId: session.id }),
       { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
     );
   } catch (error: unknown) {
     const errorMessage = error instanceof Error ? error.message : "Unknown error";
     console.error("[create-checkout] Error:", errorMessage);
     return new Response(
       JSON.stringify({ error: errorMessage }),
       { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
     );
   }
 });