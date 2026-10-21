/**
 * create-clearview-checkout — Order-First Stripe checkout for a paid
 * ClearView™ report (Trust Stack v1.0 §3 A-2).
 *
 * Tiers:
 *   - single   → ฿4,900   (1 project, 12-month access)
 *   - bundle3  → ฿12,000  (3 projects, 12-month access)
 *
 * Creates a `public.orders` row (order_type='clearview_report') with one
 * `order_items` row. The stripe-webhook materialises paid access into
 * `clearview_purchases` on payment confirmation.
 */

import { createCheckoutHandler } from "../_shared/checkout-handler.ts";
import type { StripeLineItem } from "../_shared/checkout-handler.ts";

const TIER_PRICES_THB = {
  single: 4900,
  bundle3: 12000,
} as const;

const TIER_LABELS = {
  single: "ClearView™ Report — single project (12 months)",
  bundle3: "ClearView™ Reports — 3-project bundle (12 months)",
} as const;

Deno.serve(
  createCheckoutHandler({
    endpoint: "create-clearview-checkout",

    build(raw, user, origin) {
      const { projectId, tier = "single" } = raw as {
        projectId?: string;
        tier?: keyof typeof TIER_PRICES_THB;
      };

      if (!projectId) throw new Error("projectId is required");
      if (!(tier in TIER_PRICES_THB)) {
        throw new Error(`Unknown tier: ${tier}`);
      }

      const amount = TIER_PRICES_THB[tier];
      const label = TIER_LABELS[tier];

      const lineItems: StripeLineItem[] = [{
        price_data: {
          currency: "thb",
          product_data: {
            name: label,
            description: `Project: ${projectId}`,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }];

      const validUntil = new Date();
      validUntil.setMonth(validUntil.getMonth() + 12);

      return {
        order: {
          order_type: "clearview_report",
          customer_user_id: user.id,
          status: "pending",
          total_amount: amount,
          currency: "THB",
          metadata: {
            clearview_project_id: projectId,
            clearview_tier: tier,
            clearview_valid_until: validUntil.toISOString(),
          },
        },
        items: [{
          product_id: null,
          item_name: label,
          item_type: "clearview-report",
          qty: 1,
          unit_price: amount,
          amount,
          status: "pending",
          metadata: {
            project_id: projectId,
            tier,
          },
        }],
        participants: [{
          role: "primary",
          name: user.email ?? "ClearView buyer",
          email: user.email ?? null,
        }],
        lineItems,
        successUrl: `${origin}/p/${projectId}?clearview=success&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${origin}/p/${projectId}?clearview=cancelled`,
        sessionMetadata: {
          checkout_type: "clearview_report",
          clearview_project_id: projectId,
          clearview_tier: tier,
        },
        statusReason: `ClearView ${tier} report purchase for ${projectId}`,
      };
    },
  }),
);
