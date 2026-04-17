/**
 * devmod-stripe-webhook — handles Stripe Connect account events + booking fee payments.
 *
 * Listens for:
 *   account.updated              — updates charges_enabled / payouts_enabled state
 *   checkout.session.completed   — booking fee paid: transition unit to reserved,
 *                                  update unit_holds, create reservation record
 *
 * Verifies webhook signature using STRIPE_CONNECT_WEBHOOK_SECRET or STRIPE_WEBHOOK_SECRET.
 */
import { createServiceClient } from "../_shared/supabase.ts";
import { createStripeClient } from "../_shared/stripe.ts";

Deno.serve(async (req) => {
  const sig = req.headers.get("stripe-signature");
  // Accept either connect webhook secret or platform webhook secret
  const webhookSecret =
    Deno.env.get("STRIPE_CONNECT_WEBHOOK_SECRET") ??
    Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";

  if (!sig || !webhookSecret) {
    return new Response("Missing signature or webhook secret", { status: 400 });
  }

  let event;
  try {
    const stripe = createStripeClient();
    const body = await req.text();
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
  } catch (err) {
    console.error("[devmod-stripe-webhook] Signature verification failed:", err);
    return new Response("Webhook signature verification failed", { status: 400 });
  }

  const sb = createServiceClient();

  try {
    // ── account.updated — developer connect onboarding ────────────────────
    if (event.type === "account.updated") {
      const account = event.data.object as {
        id: string;
        charges_enabled: boolean;
        payouts_enabled: boolean;
        metadata?: { developer_id?: string };
      };

      const developerId = account.metadata?.developer_id;
      if (!developerId) {
        const { data: dev } = await sb
          .from("developers")
          .select("id")
          .eq("stripe_connect_id", account.id)
          .maybeSingle();
        if (!dev) {
          console.warn("[devmod-stripe-webhook] Developer not found for account:", account.id);
          return new Response("OK", { status: 200 });
        }
        await sb
          .from("developers")
          .update({ stripe_connect_id: account.id } as Record<string, unknown>)
          .eq("id", dev.id);
      } else {
        await sb
          .from("developers")
          .update({ stripe_connect_id: account.id } as Record<string, unknown>)
          .eq("id", developerId);
      }

      console.log(`[devmod-stripe-webhook] account.updated: ${account.id}, charges=${account.charges_enabled}, payouts=${account.payouts_enabled}`);
    }

    // ── checkout.session.completed — booking fee paid ─────────────────────
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as {
        id: string;
        payment_status: string;
        payment_intent: string;
        amount_total: number | null;
        customer_email: string | null;
        metadata: Record<string, string>;
      };

      if (session.metadata?.type !== "booking_fee") {
        return new Response("OK", { status: 200 });
      }

      if (session.payment_status !== "paid") {
        console.warn("[devmod-stripe-webhook] Session completed but not paid:", session.id);
        return new Response("OK", { status: 200 });
      }

      const { unit_id, hold_id, project_id } = session.metadata;

      if (!unit_id || !hold_id) {
        console.error("[devmod-stripe-webhook] Missing metadata on session:", session.id);
        return new Response("OK", { status: 200 });
      }

      // 1. Get unit's current status_version for optimistic lock
      const { data: unit } = await sb
        .from("project_units")
        .select("id, unit_status, status_version")
        .eq("id", unit_id)
        .maybeSingle();

      if (!unit) {
        console.error("[devmod-stripe-webhook] Unit not found:", unit_id);
        return new Response("OK", { status: 200 });
      }

      const unitRecord = unit as { id: string; unit_status: string; status_version: number };

      // 2. Transition unit soft_hold → reserved (if still in soft_hold)
      if (unitRecord.unit_status === "soft_hold") {
        const { data: transitioned } = await sb.rpc("devmod_attempt_unit_transition", {
          p_unit_id: unit_id,
          p_from_status: "soft_hold",
          p_to_status: "reserved",
          p_expected_version: unitRecord.status_version,
        });

        if (!transitioned) {
          console.warn("[devmod-stripe-webhook] Unit transition failed (version conflict):", unit_id);
          // Unit may have already been transitioned — proceed anyway to update hold record
        }
      } else if (unitRecord.unit_status !== "reserved") {
        console.warn("[devmod-stripe-webhook] Unit in unexpected state:", unitRecord.unit_status);
      }

      // 3. Update unit_hold: mark as booking_fee paid
      const paidAmountTHB = session.amount_total ? session.amount_total / 100 : 0;
      await sb
        .from("unit_holds")
        .update({
          hold_type: "booking_fee",
          fee_status: "paid",
          fee_amount_thb: paidAmountTHB,
          stripe_payment_intent_id: session.payment_intent,
        } as never)
        .eq("id", hold_id);

      // 4. Generate RES number and create reservation record (minimal — KYC fills the rest)
      //    We need a buyer_id, which requires KYC (Task 10). For now, store pending state
      //    in a lightweight way: just log the payment against the hold.
      //    Full reservation created in Task 10 when buyer completes KYC.
      const year = new Date().getFullYear();
      const { count: resCount } = await sb
        .from("reservations" as never)
        .select("id", { count: "exact", head: true });
      const resSeq = String(((resCount as number | null) ?? 0) + 1).padStart(5, "0");
      const resNumber = `RES-${year}-${resSeq}`;

      // Attempt to find project details for reservation
      if (project_id) {
        const { data: proj } = await sb
          .from("property_projects")
          .select("developer_id")
          .eq("id", project_id)
          .maybeSingle();

        // Only create reservation if we can find a buyer linked to the hold's lead
        const { data: holdRecord } = await sb
          .from("unit_holds")
          .select("lead_id")
          .eq("id", hold_id)
          .maybeSingle();

        const leadId = (holdRecord as { lead_id: string | null } | null)?.lead_id;

        if (leadId) {
          // Find or create a minimal buyer from the lead
          const { data: existingBuyer } = await sb
            .from("buyers" as never)
            .select("id")
            .eq("lead_id", leadId)
            .maybeSingle();

          if (existingBuyer && proj) {
            const buyerId = (existingBuyer as { id: string }).id;
            const developerId = (proj as { developer_id: string | null }).developer_id;

            if (developerId) {
              await sb.from("reservations" as never).insert({
                unit_id,
                buyer_id: buyerId,
                hold_id,
                project_id,
                developer_id: developerId,
                reservation_number: resNumber,
                deposit_amount_thb: paidAmountTHB,
                deposit_paid_at: new Date().toISOString(),
                deposit_stripe_pi_id: session.payment_intent,
                reservation_fee_status: "paid",
                agreed_price_thb: (unit as Record<string, number>).price ?? paidAmountTHB,
                status: "reserved",
              });

              console.log(`[devmod-stripe-webhook] Reservation created: ${resNumber}`);
            }
          }
        }
      }

      console.log(`[devmod-stripe-webhook] Booking fee paid for unit ${unit_id}, hold ${hold_id}, session ${session.id}`);
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("[devmod-stripe-webhook] Handler error:", err);
    return new Response("Internal error", { status: 500 });
  }
});
