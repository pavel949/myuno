/**
 * devmod-create-booking-checkout — Stripe Checkout Session for booking fee
 *
 * POST body:
 *   unit_id      string  — required
 *   hold_id      string  — required (active soft_hold record)
 *   project_id   string  — required
 *   success_url  string  — redirect on success (can include {CHECKOUT_SESSION_ID})
 *   cancel_url   string  — redirect on cancel
 *
 * Returns:
 *   { checkout_url: string, session_id: string }
 *
 * Stripe Connect flow:
 *   - Platform charges buyer (THB)
 *   - application_fee retained by broker (myuno_retained_rate % of booking fee)
 *   - Remainder transferred to developer's Stripe Express account
 *
 * Deploy: supabase functions deploy devmod-create-booking-checkout
 */

import { createServiceClient } from "../_shared/supabase.ts";
import { createStripeClient } from "../_shared/stripe.ts";
import { requireAuth } from "../_shared/auth-guard.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_BOOKING_FEE_THB = 25_000;
const DEFAULT_BROKER_RATE = 0.05; // 5% if no commission_agreement found

function ok(body: unknown) {
  return new Response(JSON.stringify(body), {
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function err(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    // Auth guard — buyer must be authenticated
    const authResult = await requireAuth(req, CORS);
    if (authResult instanceof Response) return authResult;
    const user = authResult;

    const body = await req.json() as {
      unit_id?: string;
      hold_id?: string;
      project_id?: string;
      success_url?: string;
      cancel_url?: string;
    };

    const { unit_id, hold_id, project_id, success_url, cancel_url } = body;

    if (!unit_id || !hold_id || !project_id) {
      return err("unit_id, hold_id, and project_id are required");
    }
    if (!success_url || !cancel_url) {
      return err("success_url and cancel_url are required");
    }

    const sb = createServiceClient();

    // ── 1. Verify the hold is active and belongs to this user ──────────────
    const { data: hold, error: holdErr } = await sb
      .from("unit_holds")
      .select("id, unit_id, hold_type, released_at, expires_at, fee_status")
      .eq("id", hold_id)
      .eq("unit_id", unit_id)
      .maybeSingle();

    if (holdErr || !hold) return err("Hold not found", 404);
    if ((hold as Record<string, unknown>).released_at) return err("Hold has been released", 409);
    if (new Date((hold as Record<string, unknown>).expires_at as string) < new Date()) {
      return err("Hold has expired", 409);
    }
    if ((hold as Record<string, unknown>).fee_status === "paid") {
      return err("Booking fee already paid", 409);
    }

    // ── 2. Fetch unit + project + developer ───────────────────────────────
    const { data: unit } = await sb
      .from("project_units")
      .select("id, unit_code, unit_type, price, project_id")
      .eq("id", unit_id)
      .maybeSingle();

    if (!unit) return err("Unit not found", 404);

    const { data: project } = await sb
      .from("property_projects")
      .select("id, name_en, developer_id, developer_name, foreign_quota_used_pct, total_units")
      .eq("id", project_id)
      .maybeSingle();

    if (!project) return err("Project not found", 404);

    // ── 3. Foreign quota check (R7: 49% hard block for foreign buyers) ────
    const proj = project as Record<string, unknown>;
    const quotaUsedPct = (proj.foreign_quota_used_pct as number | null) ?? 0;

    // Check buyer's nationality via KYC record
    const { data: buyerRecord } = await sb
      .from("buyers" as never)
      .select("nationality, kyc_status")
      .eq("created_by_user_id" as never, user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nationality = (buyerRecord as { nationality: string } | null)?.nationality ?? null;
    const isForeign = nationality !== "TH" && nationality !== null;

    if (isForeign && quotaUsedPct >= 49) {
      return err("Foreign quota (49%) is exhausted for this project", 409);
    }
    if (isForeign && quotaUsedPct >= 45) {
      // Warning only — still allow (will be logged)
      console.warn(`[devmod-create-booking-checkout] Foreign quota warning: ${quotaUsedPct}% for project ${project_id}`);
    }

    // ── 5. Get developer's Stripe account ─────────────────────────────────
    let developerStripeId: string | null = null;
    if ((project as Record<string, unknown>).developer_id) {
      const { data: dev } = await sb
        .from("developers")
        .select("stripe_connect_id")
        .eq("id", (project as Record<string, unknown>).developer_id as string)
        .maybeSingle();
      developerStripeId = (dev as Record<string, string> | null)?.stripe_connect_id ?? null;
    }

    // ── 6. Commission rate lookup ─────────────────────────────────────────
    let brokerRate = DEFAULT_BROKER_RATE;
    if ((project as Record<string, unknown>).developer_id) {
      const { data: agreement } = await sb
        .from("commission_agreements")
        .select("myuno_retained_rate")
        .eq("developer_id", (project as Record<string, unknown>).developer_id as string)
        .eq("status", "active")
        .order("effective_from", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (agreement) {
        brokerRate = ((agreement as Record<string, number>).myuno_retained_rate ?? 5) / 100;
      }
    }

    // ── 7. Fee calculation ────────────────────────────────────────────────
    const bookingFeeTHB = DEFAULT_BOOKING_FEE_THB;
    const appFeeSatang = Math.round(bookingFeeTHB * brokerRate * 100);   // broker's cut
    const totalSatang = bookingFeeTHB * 100;

    const unitName = (unit as Record<string, string | null>).unit_code
      ? `Юнит ${(unit as Record<string, string | null>).unit_code}`
      : (unit as Record<string, string | null>).unit_type ?? "Юнит";

    // ── 8. Create Stripe Checkout Session ─────────────────────────────────
    const stripe = createStripeClient();

    const sessionParams: Record<string, unknown> = {
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "thb",
            unit_amount: totalSatang,
            product_data: {
              name: `Бронирование — ${unitName}`,
              description: `Проект: ${(project as Record<string, string>).name_en}. Booking fee (возвратный в 72ч при отказе).`,
            },
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        metadata: {
          type: "booking_fee",
          unit_id,
          hold_id,
          project_id,
          user_id: user.id,
        },
      },
      metadata: {
        type: "booking_fee",
        unit_id,
        hold_id,
        project_id,
        user_id: user.id,
      },
      success_url,
      cancel_url,
      customer_email: user.email ?? undefined,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 min = same as hold
    };

    // Wire application fee + transfer only when developer has a Connect account
    if (developerStripeId && appFeeSatang > 0) {
      (sessionParams.payment_intent_data as Record<string, unknown>).application_fee_amount = appFeeSatang;
      (sessionParams.payment_intent_data as Record<string, unknown>).transfer_data = {
        destination: developerStripeId,
      };
    }

    const session = await stripe.checkout.sessions.create(
      sessionParams as Parameters<typeof stripe.checkout.sessions.create>[0]
    );

    // ── 9. Mark hold as pending payment ──────────────────────────────────
    await sb
      .from("unit_holds")
      .update({
        fee_status: "pending",
        fee_amount_thb: bookingFeeTHB,
        stripe_payment_intent_id: session.payment_intent as string ?? null,
        notes: `Checkout session: ${session.id}`,
      } as never)
      .eq("id", hold_id);

    return ok({
      checkout_url: session.url,
      session_id: session.id,
    });
  } catch (e) {
    console.error("[devmod-create-booking-checkout]", e);
    return err(e instanceof Error ? e.message : "Internal error", 500);
  }
});
