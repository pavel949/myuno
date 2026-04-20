/**
 * Shared checkout factory for Edge Functions.
 *
 * Consolidates the common flow used by ALL checkout functions:
 *   auth → rate limit → create Stripe customer → create session → return URL
 *
 * Each vertical provides a handler that maps its request into line items and metadata.
 */

import { createStripeClient } from "./stripe.ts";
import { createClient } from "./supabase.ts";
import { withRateLimit, RATE_LIMITS } from "./rate-limit.ts";

const ALLOWED_CHECKOUT_ORIGINS = new Set([
  "https://myuno.app",
  "https://www.myuno.app",
  "https://uno-connect-hub.lovable.app",
  "https://id-preview--dcc2b024-7627-4ad9-a915-a3df3dd839f0.lovable.app",
  "https://dcc2b024-7627-4ad9-a915-a3df3dd839f0.lovableproject.com",
  "http://localhost:8080",
  "http://localhost:5173",
  "http://localhost:3000",
]);

function buildCheckoutCors(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const allowed = ALLOWED_CHECKOUT_ORIGINS.has(origin) ? origin : "https://myuno.app";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Vary": "Origin",
  };
}

/** @deprecated Kept for backward compat — prefer dynamic per-request headers. */
export const CHECKOUT_CORS = {
  "Access-Control-Allow-Origin": "https://myuno.app",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export interface StripeLineItem {
  price_data: {
    currency: string;
    product_data: { name: string; description?: string };
    unit_amount: number; // in cents
  };
  quantity: number;
}

export interface CheckoutSpec {
  /** Stripe line items */
  lineItems: StripeLineItem[];
  /** Total in major units (e.g. 1500 = 1500 THB) — used for validation only */
  totalAmount: number;
  /** Currency code (default THB) */
  currency: string;
  /** Metadata attached to Stripe session */
  metadata: Record<string, string>;
  /** Custom success URL (optional) */
  successUrl?: string;
  /** Custom cancel URL (optional) */
  cancelUrl?: string;
  /** Optional order description for simple single-item checkouts */
  description?: string;
  /** DB operations to run BEFORE Stripe session creation (e.g. create order row) */
  beforeStripe?: (supabaseAdmin: any) => Promise<void>;
  /** DB operations to run AFTER Stripe session creation (e.g. store session ID) */
  afterStripe?: (
    supabaseAdmin: any,
    sessionId: string,
  ) => Promise<void>;
}

/**
 * Handler that converts a raw request body into a CheckoutSpec.
 * Each vertical implements this.
 */
export type CheckoutHandler = (
  body: Record<string, unknown>,
  userId: string,
  userEmail: string,
) => CheckoutSpec | Promise<CheckoutSpec>;

/**
 * Create a Deno.serve handler for a checkout function.
 *
 * @param functionName - For rate-limiting and logging
 * @param handler - Converts request body → CheckoutSpec
 */
export function createCheckoutHandler(
  functionName: string,
  handler: CheckoutHandler,
) {
  return async (req: Request): Promise<Response> => {
    const cors = buildCheckoutCors(req);

    if (req.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    try {
      // ── Auth ────────────────────────────────────────
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) throw new Error("No authorization header");

      const token = authHeader.replace("Bearer ", "");
      const {
        data: { user },
        error: userError,
      } = await supabaseClient.auth.getUser(token);

      if (userError || !user) throw new Error("Unauthorized");

      // ── Rate limit ──────────────────────────────────
      const rateLimitResponse = await withRateLimit(
        req,
        functionName,
        RATE_LIMITS.payment,
        cors,
        user.id,
      );
      if (rateLimitResponse) return rateLimitResponse;

      // ── Build checkout spec ─────────────────────────
      const body = await req.json();
      const spec = await handler(body, user.id, user.email ?? "");

      if (spec.totalAmount < 1) {
        throw new Error("Total must be at least 1");
      }

      // ── Pre-Stripe DB operations ────────────────────
      if (spec.beforeStripe) {
        await spec.beforeStripe(supabaseAdmin);
      }

      // ── Stripe customer ─────────────────────────────
      const stripe = createStripeClient();
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

      // ── Stripe session ──────────────────────────────
      const currency = spec.currency?.toLowerCase() || "thb";
      const origin =
        req.headers.get("origin") ||
        Deno.env.get("SITE_URL") ||
        "https://myuno.app";

      const paymentMethods: ("card" | "promptpay")[] =
        currency === "thb" ? ["card", "promptpay"] : ["card"];

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: paymentMethods,
        line_items: spec.lineItems,
        mode: "payment",
        success_url:
          spec.successUrl || `${origin}/bookings?success=true`,
        cancel_url:
          spec.cancelUrl || `${origin}/cart?canceled=true`,
        metadata: {
          ...spec.metadata,
          user_id: user.id,
          type: "order_payment",
        },
      });

      console.log(`[${functionName}] Session ${session.id} for user ${user.id}`);

      // ── Post-Stripe DB operations ───────────────────
      if (spec.afterStripe) {
        await spec.afterStripe(supabaseAdmin, session.id);
      }

      return new Response(
        JSON.stringify({ url: session.url, sessionId: session.id }),
        {
          headers: { ...cors, "Content-Type": "application/json" },
          status: 200,
        },
      );
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      console.error(`[${functionName}] Error:`, msg);
      return new Response(JSON.stringify({ error: msg }), {
        headers: { ...cors, "Content-Type": "application/json" },
        status: 400,
      });
    }
  };
}
