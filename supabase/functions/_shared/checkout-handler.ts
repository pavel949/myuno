/**
 * Unified Checkout Handler
 *
 * Extracts the common pipeline shared by all create-*-checkout functions:
 *   CORS → Auth → Rate Limit → (Build Order) → Stripe Customer → Session → Response
 *
 * Each vertical provides a CheckoutConfig that defines the vertical-specific logic.
 */

import { createStripeClient, Stripe } from "./stripe.ts";
import { createClient, createServiceClient } from "./supabase.ts";
import { withRateLimit, RATE_LIMITS } from "./rate-limit.ts";

// Re-export for thin wrappers
export { createServiceClient };

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Types ───────────────────────────────────────────────────────────

export interface StripeLineItem {
  price_data: {
    currency: string;
    product_data: { name: string; description?: string };
    unit_amount: number;
  };
  quantity: number;
}

export interface OrderData {
  order_type: string;
  customer_user_id: string;
  provider_org_id?: string | null;
  status: string;
  total_amount: number;
  currency: string;
  start_at?: string | null;
  end_at?: string | null;
  vertical?: string;
  metadata?: Record<string, unknown>;
}

export interface OrderItemData {
  order_id: string;
  product_id?: string | null;
  item_name?: string;
  product_name?: string;
  item_type?: string;
  qty: number;
  unit_price: number;
  amount: number;
  status: string;
  resource_id?: string | null;
  provider_org_id?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  metadata?: Record<string, unknown>;
}

export interface CheckoutResult {
  /** Order data for DB insert. Return null to skip order creation. */
  order: OrderData | null;
  /** Order items. Only used if order is not null. */
  items: Omit<OrderItemData, "order_id">[];
  /** Stripe line items for the checkout session. */
  lineItems: StripeLineItem[];
  /** Success URL (use {CHECKOUT_SESSION_ID} placeholder). */
  successUrl: string;
  /** Cancel URL. */
  cancelUrl: string;
  /** Extra metadata for the Stripe checkout session. */
  sessionMetadata?: Record<string, string>;
  /** Optional order addresses to insert. */
  addresses?: Array<{ address_type: string; address_text: string; lat?: number; lng?: number }>;
  /** Optional order participants to insert. */
  participants?: Array<{ role: string; name: string; phone?: string | null; email?: string | null }>;
  /** Status history reason, e.g. "Flower order created". */
  statusReason?: string;
  /** If set, use this RPC instead of manual insert. */
  rpc?: { name: string; params: Record<string, unknown> };
  /** Called if order creation fails, for cleanup (e.g., releasing reserved spots). */
  onOrderFailure?: () => Promise<void>;
  /** Called after order + items inserted, for vertical-specific child rows (e.g., order_item_yacht_details). */
  afterOrderCreated?: (
    orderId: string,
    supabaseAdmin: ReturnType<typeof createServiceClient>,
  ) => Promise<void>;
}

export interface CheckoutConfig {
  /** Endpoint name for rate limiting + logging. */
  endpoint: string;
  /** Build the checkout result from the parsed request body + authenticated user. */
  build(
    body: unknown,
    user: { id: string; email?: string },
    origin: string,
    supabaseAdmin: ReturnType<typeof createServiceClient>,
  ): CheckoutResult | Promise<CheckoutResult>;
}

// ── Handler ─────────────────────────────────────────────────────────

export function createCheckoutHandler(config: CheckoutConfig) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    try {
      // 1. Auth
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      );

      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: "Please sign in to continue" }),
          { headers: { ...CORS_HEADERS, "Content-Type": "application/json" }, status: 401 },
        );
      }

      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

      if (userError || !user) {
        return new Response(
          JSON.stringify({ error: "Session expired. Please sign in again." }),
          { headers: { ...CORS_HEADERS, "Content-Type": "application/json" }, status: 401 },
        );
      }

      // 2. Rate Limit
      const rlResponse = await withRateLimit(req, config.endpoint, RATE_LIMITS.payment, CORS_HEADERS, user.id);
      if (rlResponse) return rlResponse;

      console.log(`[${config.endpoint}] User authenticated: ${user.id}`);

      // 3. Parse body & build vertical-specific data
      const body = await req.json();
      const origin = req.headers.get("origin") || Deno.env.get("SITE_URL") || "https://uno.ae";
      const supabaseAdmin = createServiceClient();
      const result = await config.build(body, { id: user.id, email: user.email ?? undefined }, origin, supabaseAdmin);

      let orderId: string | null = null;
      let orderNumber: string | null = null;
      let paymentIntentId: string | null = null;

      // 4. Create order (if provided)
      if (result.rpc) {
        // Use RPC for atomic order creation
        const { data, error } = await supabaseAdmin.rpc(result.rpc.name, result.rpc.params);
        if (error) {
          console.error(`[${config.endpoint}] RPC error:`, error);
          if (result.onOrderFailure) await result.onOrderFailure();
          throw new Error("Failed to create order");
        }
        // Handle both direct UUID and { order_id, order_number } responses
        if (typeof data === "string") {
          orderId = data;
        } else if (data && typeof data === "object") {
          const rpcResult = data as Record<string, unknown>;
          if (rpcResult.success === false) {
            if (result.onOrderFailure) await result.onOrderFailure();
            throw new Error((rpcResult.error as string) || "Failed to create order");
          }
          orderId = (rpcResult.order_id as string) || null;
          orderNumber = (rpcResult.order_number as string) || null;
        }
      } else if (result.order) {
        const { data: order, error: orderError } = await supabaseAdmin
          .from("orders")
          .insert(result.order)
          .select("id, order_number")
          .single();

        if (orderError || !order) {
          console.error(`[${config.endpoint}] Order insert error:`, orderError);
          if (result.onOrderFailure) await result.onOrderFailure();
          throw new Error("Failed to create order");
        }

        orderId = order.id;
        orderNumber = order.order_number;
        console.log(`[${config.endpoint}] Order created: ${orderId} ${orderNumber}`);

        // Insert order items
        if (result.items.length > 0) {
          const items = result.items.map((item) => ({ ...item, order_id: orderId! }));
          const { error: itemsError } = await supabaseAdmin.from("order_items").insert(items);
          if (itemsError) {
            console.error(`[${config.endpoint}] Items insert error:`, itemsError);
            if (result.onOrderFailure) await result.onOrderFailure();
            await supabaseAdmin.from("orders").delete().eq("id", orderId);
            throw new Error("Failed to create order items");
          }
        }

        // Insert addresses
        if (result.addresses && result.addresses.length > 0) {
          await supabaseAdmin.from("order_addresses").insert(
            result.addresses.map((a) => ({ order_id: orderId!, ...a })),
          );
        }

        // Insert participants
        if (result.participants && result.participants.length > 0) {
          await supabaseAdmin.from("order_participants").insert(
            result.participants.map((p) => ({ order_id: orderId!, ...p })),
          );
        }

        // Status history
        await supabaseAdmin.from("order_status_history").insert({
          order_id: orderId,
          from_status: null,
          to_status: "pending",
          actor_user_id: user.id,
          reason: result.statusReason || "Order created",
        });

        // Vertical-specific child rows (e.g. order_item_yacht_details)
        if (result.afterOrderCreated) {
          try {
            await result.afterOrderCreated(orderId, supabaseAdmin);
          } catch (hookErr) {
            console.error(`[${config.endpoint}] afterOrderCreated error:`, hookErr);
          }
        }



        // Payment intent
        const { data: pi } = await supabaseAdmin
          .from("payment_intents")
          .insert({
            order_id: orderId,
            amount: result.order.total_amount,
            currency: result.order.currency,
            method: "stripe",
            status: "pending",
          })
          .select("id")
          .single();
        paymentIntentId = pi?.id || null;
      }

      // 5. Stripe: get-or-create customer
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

      // 6. Create Stripe checkout session
      const currency = result.order?.currency?.toUpperCase() || result.sessionMetadata?.currency?.toUpperCase() || "THB";
      const paymentMethods: ("card" | "promptpay")[] =
        currency === "THB" ? ["card", "promptpay"] : ["card"];

      const sessionMetadata: Record<string, string> = {
        user_id: user.id,
        type: "order_payment",
        ...(orderId ? { order_id: orderId } : {}),
        ...(orderNumber ? { order_number: orderNumber } : {}),
        ...(paymentIntentId ? { payment_intent_id: paymentIntentId } : {}),
        ...result.sessionMetadata,
      };

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: paymentMethods,
        line_items: result.lineItems as Stripe.Checkout.SessionCreateParams.LineItem[],
        mode: "payment",
        success_url: result.successUrl,
        cancel_url: result.cancelUrl,
        metadata: sessionMetadata,
      });

      console.log(`[${config.endpoint}] Checkout session created: ${session.id}`);

      // Update payment intent with Stripe session ref
      if (paymentIntentId) {
        await supabaseAdmin
          .from("payment_intents")
          .update({ provider_ref: session.id })
          .eq("id", paymentIntentId);
      }

      // 7. Response
      return new Response(
        JSON.stringify({
          url: session.url,
          sessionId: session.id,
          ...(orderId ? { orderId } : {}),
          ...(orderNumber ? { orderNumber } : {}),
        }),
        { headers: { ...CORS_HEADERS, "Content-Type": "application/json" }, status: 200 },
      );
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      console.error(`[${config.endpoint}] Error:`, msg);
      return new Response(
        JSON.stringify({ error: msg }),
        { headers: { ...CORS_HEADERS, "Content-Type": "application/json" }, status: 400 },
      );
    }
  };
}
