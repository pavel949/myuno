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
import { getCorsHeaders, getAllowedOrigin } from "./cors.ts";

// Re-export for thin wrappers
export { createServiceClient };

// Extra headers the Supabase JS client may send on these endpoints, merged into
// the request-scoped allow-list headers from cors.ts so preflight succeeds while
// the origin stays restricted to the cors.ts allow-list (no wildcard on money moves).
const EXTRA_ALLOW_HEADERS =
  "x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version";

function corsHeadersFor(req: Request): Record<string, string> {
  const base = getCorsHeaders(req);
  return {
    ...base,
    "Access-Control-Allow-Headers": `${base["Access-Control-Allow-Headers"]}, ${EXTRA_ALLOW_HEADERS}`,
  };
}

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
  /**
   * When true, the persisted order total is forced to equal the sum of the
   * Stripe line items (anti-tampering). Only enable for verticals where Stripe
   * charges the FULL order amount up-front — NOT for deposit/partial-payment
   * verticals (yacht, property-deposit) where the charge is intentionally less
   * than the order total.
   */
  enforceLineItemTotal?: boolean;
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
    const CORS_HEADERS = corsHeadersFor(req);

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

      console.info(`[${config.endpoint}] User authenticated: ${user.id}`);

      // 3. Parse body & build vertical-specific data
      const body = await req.json();
      // The raw `origin` header is attacker-controlled and is used by verticals to
      // build Stripe success_url/cancel_url. Validate against the allow-list so a
      // forged origin can't turn the post-payment redirect into an open redirect;
      // unknown origins fall back to the canonical site URL.
      const origin = getAllowedOrigin(req.headers.get("origin"));
      const supabaseAdmin = createServiceClient();
      const result = await config.build(body, { id: user.id, email: user.email ?? undefined }, origin, supabaseAdmin);

      // Anti-tampering guard (opt-in via enforceLineItemTotal): for verticals
      // that charge the FULL amount up-front, Stripe charges the sum of
      // `lineItems`, so the persisted order total MUST equal that sum — never a
      // client-supplied `total_amount`. If they diverge we override the order
      // total with the authoritative line-item sum (and log it) so the order
      // record and ledger can never disagree with the money actually collected.
      if (config.enforceLineItemTotal && result.order) {
        const lineItemsTotal = result.lineItems.reduce(
          (sum, li) => sum + (li.price_data.unit_amount * li.quantity) / 100,
          0,
        );
        if (Number.isFinite(lineItemsTotal)) {
          const claimed = Number(result.order.total_amount);
          if (!Number.isFinite(claimed) || Math.abs(claimed - lineItemsTotal) > 0.01) {
            console.warn(
              `[${config.endpoint}] total_amount mismatch: client=${claimed} lineItems=${lineItemsTotal} — using line-item sum`,
            );
            result.order.total_amount = lineItemsTotal;
          }
        }
      }

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
        console.info(`[${config.endpoint}] Order created: ${orderId} ${orderNumber}`);

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

        // Insert addresses. Non-fatal (the order + payment still proceed), but a
        // silent failure leaves delivery/transfer orders with no address, so log
        // prominently with the order id for reconciliation.
        if (result.addresses && result.addresses.length > 0) {
          const { error: addrError } = await supabaseAdmin.from("order_addresses").insert(
            result.addresses.map((a) => ({ order_id: orderId!, ...a })),
          );
          if (addrError) {
            console.error(`[${config.endpoint}] order_addresses insert failed for order ${orderId}:`, addrError);
          }
        }

        // Insert participants
        const providedParticipants = result.participants ?? [];
        const hasPrimary = providedParticipants.some((p) => p.role === 'primary');

        // Auto-backfill primary participant from auth profile if vertical didn't provide one.
        // This ensures admin order screens always show a customer instead of "Guest".
        if (!hasPrimary) {
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('full_name, phone')
            .eq('id', user.id)
            .maybeSingle();
          providedParticipants.push({
            role: 'primary',
            name: profile?.full_name || user.email?.split('@')[0] || 'Customer',
            phone: profile?.phone ?? null,
            email: user.email ?? null,
          });
        }

        if (providedParticipants.length > 0) {
          const { error: partError } = await supabaseAdmin.from("order_participants").insert(
            providedParticipants.map((p) => ({ order_id: orderId!, ...p })),
          );
          if (partError) {
            console.error(`[${config.endpoint}] order_participants insert failed for order ${orderId}:`, partError);
          }
        }

        // Status history (non-fatal, but log so the audit trail gap is visible).
        const { error: statusError } = await supabaseAdmin.from("order_status_history").insert({
          order_id: orderId,
          from_status: null,
          to_status: "pending",
          actor_user_id: user.id,
          reason: result.statusReason || "Order created",
        });
        if (statusError) {
          console.error(`[${config.endpoint}] order_status_history insert failed for order ${orderId}:`, statusError);
        }

        // Vertical-specific child rows (e.g. order_item_yacht_details)
        if (result.afterOrderCreated) {
          try {
            await result.afterOrderCreated(orderId, supabaseAdmin);
          } catch (hookErr) {
            console.error(`[${config.endpoint}] afterOrderCreated error:`, hookErr);
          }
        }



        // Payment intent. If this insert fails, the Stripe session metadata gets
        // no payment_intent_id and the webhook can't transition the intent to
        // succeeded → reconciliation_alerts will flag the order permanently.
        // Non-fatal to checkout, but must be logged loudly with the order id.
        const { data: pi, error: piError } = await supabaseAdmin
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
        if (piError) {
          console.error(`[${config.endpoint}] payment_intents insert failed for order ${orderId} — webhook linkage/reconciliation at risk:`, piError);
        }
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
        // Charge/refund webhooks receive PaymentIntent metadata, not Session
        // metadata. Carry the commercial order linkage into that object too.
        ...(orderId ? { payment_intent_data: { metadata: { order_id: orderId, type: 'order_payment' } } } : {}),
      });

      console.info(`[${config.endpoint}] Checkout session created: ${session.id}`);

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
