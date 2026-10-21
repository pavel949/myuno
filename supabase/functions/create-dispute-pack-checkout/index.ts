/**
 * create-dispute-pack-checkout — Order-First Stripe checkout for the
 * Deposit Dispute Pack (Trust Stack v1.0 §3 A-3).
 *
 * ฿1,490 · single-pack (per vault). On payment confirmation the
 * stripe-webhook flips dispute_packs.status to 'paid' and the client
 * triggers `generate-ocpb-letter` to produce the OCPB letter draft.
 */

import { createCheckoutHandler } from "../_shared/checkout-handler.ts";
import type { StripeLineItem } from "../_shared/checkout-handler.ts";

const PRICE_THB = 1490;
const LABEL = "Deposit Dispute Pack — OCPB letter + evidence index";

Deno.serve(
  createCheckoutHandler({
    endpoint: "create-dispute-pack-checkout",

    async build(raw, user, origin, supabaseAdmin) {
      const {
        vaultId,
        language = "ru",
        depositAmountThb,
        landlordName,
        landlordContact,
        complaintSummary,
      } = raw as {
        vaultId?: string;
        language?: "ru" | "en";
        depositAmountThb?: number;
        landlordName?: string;
        landlordContact?: string;
        complaintSummary?: string;
      };

      if (!vaultId) throw new Error("vaultId is required");

      // Pre-create a pending dispute_packs row so the success page can find it.
      const { data: pack, error: insertError } = await supabaseAdmin
        .from("dispute_packs")
        .insert({
          user_id: user.id,
          vault_id: vaultId,
          status: "pending",
          language,
          deposit_amount_thb: depositAmountThb ?? null,
          landlord_name: landlordName ?? null,
          landlord_contact: landlordContact ?? null,
          complaint_summary: complaintSummary ?? null,
        })
        .select("id")
        .single();

      if (insertError || !pack) {
        console.error("[create-dispute-pack-checkout] insert error:", insertError);
        throw new Error("Failed to create dispute pack record");
      }

      const lineItems: StripeLineItem[] = [{
        price_data: {
          currency: "thb",
          product_data: {
            name: LABEL,
            description: `Vault ${vaultId.slice(0, 8)} · OCPB letter (${language.toUpperCase()})`,
          },
          unit_amount: PRICE_THB * 100,
        },
        quantity: 1,
      }];

      return {
        order: {
          order_type: "dispute_pack",
          customer_user_id: user.id,
          status: "pending",
          total_amount: PRICE_THB,
          currency: "THB",
          metadata: {
            dispute_pack_id: pack.id,
            vault_id: vaultId,
            language,
          },
        },
        items: [{
          product_id: null,
          item_name: LABEL,
          item_type: "dispute-pack",
          qty: 1,
          unit_price: PRICE_THB,
          amount: PRICE_THB,
          status: "pending",
          metadata: { dispute_pack_id: pack.id, vault_id: vaultId },
        }],
        participants: [{
          role: "primary",
          name: user.email ?? "Dispute pack buyer",
          email: user.email ?? null,
        }],
        lineItems,
        successUrl: `${origin}/legal/deposit-vault/dispute/${pack.id}?status=paid&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${origin}/legal/deposit-vault?status=dispute_cancelled`,
        sessionMetadata: {
          checkout_type: "dispute_pack",
          dispute_pack_id: pack.id,
          vault_id: vaultId,
        },
        statusReason: `Deposit Dispute Pack purchase for vault ${vaultId}`,
      };
    },
  }),
);
