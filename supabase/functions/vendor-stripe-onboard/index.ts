/**
 * vendor-stripe-onboard — Stripe Connect Express onboarding for vendors (providers).
 *
 * POST { action: 'create_link', return_url, refresh_url }
 *   → creates (or reuses) Express account for the caller's provider, returns onboarding URL.
 *
 * POST { action: 'status' }
 *   → returns { connected, charges_enabled, payouts_enabled, account_id }
 *
 * Auth: requires JWT. The provider row is resolved via providers.user_id = auth.uid().
 */
import { createServiceClient } from "../_shared/supabase.ts";
import { createStripeClient } from "../_shared/stripe.ts";
import { requireAuth } from "../_shared/auth-guard.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const auth = await requireAuth(req, CORS);
    if (auth instanceof Response) return auth;

    const body = (await req.json().catch(() => ({}))) as {
      action?: string;
      return_url?: string;
      refresh_url?: string;
    };
    const action = body.action ?? "status";

    const sb = createServiceClient();

    const { data: provider, error: provErr } = await sb
      .from("providers")
      .select("id, user_id, name, email, stripe_account_id")
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (provErr) {
      console.error("[vendor-stripe-onboard] provider lookup error", provErr);
      return json({ error: "Database error" }, 500);
    }
    if (!provider) {
      return json(
        {
          error: "No vendor profile found for this account",
          code: "no_provider",
        },
        404,
      );
    }

    const stripe = createStripeClient();

    // ── Status ──────────────────────────────────────────────────────
    if (action === "status") {
      const accountId = provider.stripe_account_id as string | null;
      if (!accountId) {
        return json({
          connected: false,
          charges_enabled: false,
          payouts_enabled: false,
          account_id: null,
        });
      }
      try {
        const account = await stripe.accounts.retrieve(accountId);
        // Best-effort sync
        await sb
          .from("providers")
          .update({
            stripe_charges_enabled: account.charges_enabled ?? false,
            stripe_payouts_enabled: account.payouts_enabled ?? false,
            stripe_onboarded_at:
              account.charges_enabled && account.payouts_enabled
                ? new Date().toISOString()
                : null,
          })
          .eq("id", provider.id);

        return json({
          connected: true,
          charges_enabled: account.charges_enabled ?? false,
          payouts_enabled: account.payouts_enabled ?? false,
          account_id: accountId,
          details_submitted: account.details_submitted ?? false,
        });
      } catch (err) {
        console.error("[vendor-stripe-onboard] retrieve failed", err);
        return json({
          connected: false,
          charges_enabled: false,
          payouts_enabled: false,
          account_id: null,
        });
      }
    }

    // ── Create / resume onboarding link ─────────────────────────────
    if (action !== "create_link") {
      return json({ error: "Unknown action" }, 400);
    }

    const { return_url, refresh_url } = body;
    if (!return_url || !refresh_url) {
      return json(
        { error: "return_url and refresh_url required" },
        400,
      );
    }

    let accountId = provider.stripe_account_id as string | null;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "TH",
        email: provider.email ?? auth.user.email ?? undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: {
          name: provider.name ?? undefined,
        },
        metadata: {
          provider_id: provider.id,
          user_id: auth.user.id,
          platform: "myuno",
          role: "vendor",
        },
      });
      accountId = account.id;
      await sb
        .from("providers")
        .update({ stripe_account_id: accountId })
        .eq("id", provider.id);
    }

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url,
      return_url,
      type: "account_onboarding",
    });

    return json({ url: link.url, account_id: accountId });
  } catch (err) {
    console.error("[vendor-stripe-onboard]", err);
    return json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      500,
    );
  }
});
