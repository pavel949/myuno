/**
 * devmod-stripe-onboard — Stripe Connect Express onboarding for developers.
 *
 * POST body { action: 'create_link', developer_id, return_url, refresh_url }
 *   → creates (or reuses) Stripe Express account, returns account_link URL
 *
 * POST body { action: 'status', developer_id }
 *   → returns { connected, charges_enabled, payouts_enabled, account_id }
 *
 * Rate limited: max 5 link creation attempts per developer per hour.
 */
import { createServiceClient } from "../_shared/supabase.ts";
import { createStripeClient } from "../_shared/stripe.ts";
import { requireAuth } from "../_shared/auth-guard.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const authResult = await requireAuth(req, CORS);
    if (authResult instanceof Response) return authResult;

    const body = await req.json() as {
      action?: string;
      developer_id: string;
      return_url?: string;
      refresh_url?: string;
    };
    const { developer_id, return_url, refresh_url } = body;
    const action = body.action ?? "create_link";

    if (!developer_id) {
      return new Response(JSON.stringify({ error: "developer_id required" }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const sb = createServiceClient();

    // Fetch developer
    const { data: dev, error: devErr } = await sb
      .from("developers")
      .select("id, name_en, email, stripe_connect_id")
      .eq("id", developer_id)
      .single();
    if (devErr || !dev) {
      return new Response(JSON.stringify({ error: "Developer not found" }), {
        status: 404, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const stripe = createStripeClient();

    // ── Status check ──────────────────────────────────────────────────
    if (action === "status") {
      const accountId = dev.stripe_connect_id as string | null;
      if (!accountId) {
        return new Response(
          JSON.stringify({ connected: false, charges_enabled: false, payouts_enabled: false, account_id: null }),
          { headers: { ...CORS, "Content-Type": "application/json" } }
        );
      }
      const account = await stripe.accounts.retrieve(accountId);
      return new Response(
        JSON.stringify({
          connected: true,
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          account_id: accountId,
        }),
        { headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    // ── Create / resume onboarding link ──────────────────────────────
    if (!return_url || !refresh_url) {
      return new Response(JSON.stringify({ error: "return_url and refresh_url required" }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    let accountId = dev.stripe_connect_id as string | null;

    // Create Express account if not already exists
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: (dev as Record<string, string>).country ?? "TH",
        email: dev.email ?? undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: {
          name: dev.name_en,
        },
        metadata: {
          developer_id,
          platform: "myuno",
        },
      });
      accountId = account.id;

      // Save account ID immediately
      await sb
        .from("developers")
        .update({ stripe_connect_id: accountId } as Record<string, unknown>)
        .eq("id", developer_id);
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url,
      return_url,
      type: "account_onboarding",
    });

    return new Response(JSON.stringify({ url: accountLink.url, account_id: accountId }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[devmod-stripe-onboard]", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
});
