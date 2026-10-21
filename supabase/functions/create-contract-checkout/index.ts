/**
 * create-contract-checkout — Order-First Stripe checkout for the
 * ContractAI full report (Trust Stack v1.0 §3 A-2).
 *
 * ฿4,900 · single report. On payment confirmation the stripe-webhook
 * flips contract_analyses.status to 'paid', then the client calls
 * `analyze-contract` with mode='full' to generate the full report.
 */

import { createCheckoutHandler } from "../_shared/checkout-handler.ts";
import type { StripeLineItem } from "../_shared/checkout-handler.ts";

const PRICE_THB = 4900;
const LABEL = "ContractAI — full risk report";

Deno.serve(
  createCheckoutHandler({
    endpoint: "create-contract-checkout",

    async build(raw, user, origin, supabaseAdmin) {
      const { analysisId } = raw as { analysisId?: string };
      if (!analysisId) throw new Error("analysisId is required");

      const { data: row, error } = await supabaseAdmin
        .from("contract_analyses")
        .select("id, user_id, file_name, status")
        .eq("id", analysisId)
        .single();
      if (error || !row) throw new Error("Contract analysis not found");
      if (row.user_id !== user.id) throw new Error("Forbidden");
      if (row.status === "paid") throw new Error("Already paid");

      await supabaseAdmin
        .from("contract_analyses")
        .update({ status: "pending_payment" })
        .eq("id", row.id);

      const lineItems: StripeLineItem[] = [{
        price_data: {
          currency: "thb",
          product_data: {
            name: LABEL,
            description: `Contract: ${row.file_name}`,
          },
          unit_amount: PRICE_THB * 100,
        },
        quantity: 1,
      }];

      return {
        order: {
          order_type: "contract_analysis",
          customer_user_id: user.id,
          status: "pending",
          total_amount: PRICE_THB,
          currency: "THB",
          metadata: {
            contract_analysis_id: row.id,
          },
        },
        items: [{
          product_id: null,
          item_name: LABEL,
          item_type: "contract-analysis",
          qty: 1,
          unit_price: PRICE_THB,
          amount: PRICE_THB,
          status: "pending",
          metadata: { contract_analysis_id: row.id },
        }],
        participants: [{
          role: "primary",
          name: user.email ?? "Contract analysis buyer",
          email: user.email ?? null,
        }],
        lineItems,
        successUrl: `${origin}/legal/contract-analysis?status=paid&analysisId=${row.id}&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${origin}/legal/contract-analysis?status=cancelled&analysisId=${row.id}`,
        sessionMetadata: {
          checkout_type: "contract_analysis",
          contract_analysis_id: row.id,
        },
        statusReason: `Contract analysis purchase ${row.id}`,
      };
    },
  }),
);
