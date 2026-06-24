 // Deno.serve used (native edge runtime)
import { createStripeClient } from "../_shared/stripe.ts";
import { createClient, createServiceClient } from "../_shared/supabase.ts";
import { getCorsHeaders, getAllowedOrigin } from "../_shared/cors.ts";
import { withRateLimit, RATE_LIMITS } from "../_shared/rate-limit.ts";

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
   // CORS is scoped to the allow-list (echoes a trusted Origin, else canonical).
   const corsHeaders = getCorsHeaders(req);

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
     const { order_id, order_type, success_url, cancel_url } = body;

     if (!order_id) throw new Error("Missing order_id");

     // SECURITY: never trust the client-supplied `amount`/`currency`. Look up the
     // authoritative order with the service role and charge its persisted total.
     // This prevents an authenticated user from paying an arbitrary amount (e.g.
     // 1 THB) for any order by tampering with the request body.
     const serviceClient = createServiceClient();
     const { data: order, error: orderError } = await serviceClient
       .from("orders")
       .select("total_amount, currency, customer_user_id")
       .eq("id", order_id)
       .single();

     if (orderError || !order) throw new Error("Order not found");

     // Ownership guard: the order must belong to the caller.
     if (order.customer_user_id && order.customer_user_id !== user.id) {
       return new Response(
         JSON.stringify({ error: "Forbidden", message: "Order does not belong to the authenticated user" }),
         { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
       );
     }

     const amount = Number(order.total_amount);
     if (!Number.isFinite(amount) || amount <= 0) {
       throw new Error("Order has no valid amount to charge");
     }
     const currency = (order.currency || "THB").toString();

     console.info(`[create-checkout] Processing ${order_type} order ${order_id} for ${amount} ${currency}`);

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

     // SECURITY: validate client-supplied redirect URLs against the origin
     // allow-list so a forged `success_url`/`cancel_url` (or `origin` header)
     // can't turn the post-payment redirect into an open redirect. We keep the
     // caller's path but force a trusted origin.
     const trustedOrigin = getAllowedOrigin(req.headers.get("origin"));
     const safeRedirect = (candidate: string | undefined, fallbackPath: string): string => {
       if (candidate) {
         try {
           const u = new URL(candidate);
           if (getAllowedOrigin(u.origin) === u.origin) {
             return candidate; // origin is trusted — keep verbatim
           }
           return `${trustedOrigin}${u.pathname}${u.search}`; // re-host on a trusted origin
         } catch {
           // fall through to fallback
         }
       }
       return `${trustedOrigin}${fallbackPath}`;
     };

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
             name: body.description || `Order Payment`,
           },
           unit_amount: Math.round(amount * 100),
         },
         quantity: 1,
       }],
       mode: "payment",
       success_url: safeRedirect(success_url, `/bookings/${order_id}?success=true`),
       cancel_url: safeRedirect(cancel_url, `/bookings?canceled=true`),
       metadata: {
         order_id,
         order_type,
         user_id: user.id,
         type: "order_payment",
       },
     });

     // Update order status to pending payment (service role — bypasses RLS so the
     // session id is reliably persisted).
     await serviceClient
       .from('orders')
       .update({ metadata: { stripe_session_id: session.id } })
       .eq('id', order_id);

     console.info(`[create-checkout] Session created: ${session.id}`);

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
