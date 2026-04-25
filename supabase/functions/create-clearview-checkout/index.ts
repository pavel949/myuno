/**
 * create-clearview-checkout — Stripe one-off payment for ClearView full report access.
 *
 * Body: { projectId: string; tier: 'single' | 'bundle3' }
 * Returns: { url: string } — Stripe Checkout session URL.
 *
 * On payment_intent.succeeded the stripe-webhook function inserts a row into
 * clearview_purchases granting the user 12 months of access.
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TIERS = {
  single: { amount_thb_cents: 290000, label_en: "ClearView Full Report (1 project)", label_ru: "Полный отчёт ClearView (1 проект)" },
  bundle3: { amount_thb_cents: 750000, label_en: "ClearView Bundle (3 reports)", label_ru: "Пакет ClearView (3 отчёта)" },
} as const;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user?.email) {
      return new Response(JSON.stringify({ error: "Invalid auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = userData.user;

    // Body validation
    const body = await req.json().catch(() => ({}));
    const projectId = String(body.projectId ?? "").trim();
    const tier = (body.tier === "bundle3" ? "bundle3" : "single") as keyof typeof TIERS;
    if (!projectId || !/^[0-9a-f-]{36}$/i.test(projectId)) {
      return new Response(JSON.stringify({ error: "Invalid projectId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const t = TIERS[tier];

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Existing customer?
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data[0]?.id;

    const origin = req.headers.get("origin") ?? Deno.env.get("APP_URL") ?? "https://myuno.app";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "thb",
            product_data: {
              name: t.label_en,
              description: `ClearView Full Report · 12 months access · project ${projectId.slice(0, 8)}`,
            },
            unit_amount: t.amount_thb_cents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        order_type: "clearview_report",
        project_id: projectId,
        tier,
        user_id: user.id,
      },
      success_url: `${origin}/property/offplan/${projectId}?clearview=success`,
      cancel_url: `${origin}/property/offplan/${projectId}?clearview=cancel`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
