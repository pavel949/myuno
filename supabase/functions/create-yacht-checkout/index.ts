import { createCheckoutHandler } from "../_shared/checkout-handler.ts";

interface YachtCheckoutBody {
  yacht_id: string;
  yacht_name: string;
  charter_type: "half_day" | "full_day" | "sunset" | "overnight";
  base_price: number;
  guests: number;
  experiences: Array<{ id: string; name: string; price: number }>;
  service_fee: number;
  deposit_amount: number;
  total_amount: number;
  currency?: string;
  scheduled_at: string;
  end_at: string;
  contact_name: string;
  contact_phone: string;
  contact_email?: string;
  notes?: string;
  provider_id?: string;
}

Deno.serve(
  createCheckoutHandler({
    endpoint: "create-yacht-checkout",

    build(raw, user, origin) {
      const body = raw as YachtCheckoutBody;
      const {
        yacht_id, yacht_name, charter_type, base_price, guests,
        experiences = [], service_fee, deposit_amount, total_amount,
        currency = "THB", scheduled_at, end_at,
        contact_name, contact_phone, contact_email, notes, provider_id,
      } = body;

      if (!yacht_id) throw new Error("Yacht ID is required");
      if (total_amount < 1) throw new Error("Total must be at least 1");

      const cur = currency.toLowerCase();
      const payAmount = deposit_amount > 0 ? deposit_amount : total_amount;

      const lineItems = [
        {
          price_data: {
            currency: cur,
            product_data: { name: `${yacht_name} — ${charter_type.replace("_", " ")}` },
            unit_amount: Math.round(base_price * 100),
          },
          quantity: 1,
        },
        ...experiences.map((exp) => ({
          price_data: {
            currency: cur,
            product_data: { name: exp.name },
            unit_amount: Math.round(exp.price * 100),
          },
          quantity: 1,
        })),
      ];

      if (service_fee > 0) {
        lineItems.push({
          price_data: {
            currency: cur,
            product_data: { name: "Service Fee / Сервисный сбор" },
            unit_amount: Math.round(service_fee * 100),
          },
          quantity: 1,
        });
      }

      return {
        order: {
          order_type: "yacht",
          customer_user_id: user.id,
          provider_org_id: provider_id || null,
          status: "pending",
          total_amount: payAmount,
          currency,
          start_at: scheduled_at,
          end_at,
          metadata: {
            yacht_id, charter_type, guests_count: guests,
            deposit_amount, balance_amount: total_amount - payAmount,
            experiences: experiences.map((e) => e.id),
          },
        },
        items: [
          {
            product_id: yacht_id,
            item_name: yacht_name,
            item_type: "yacht-rental",
            qty: 1,
            unit_price: base_price,
            amount: base_price,
            status: "pending",
          },
          ...experiences.map((exp) => ({
            product_id: exp.id,
            item_name: exp.name,
            item_type: "yacht-experience" as const,
            qty: 1,
            unit_price: exp.price,
            amount: exp.price,
            status: "pending" as const,
          })),
        ],
        lineItems,
        participants: [
          { role: "primary", name: contact_name, phone: contact_phone, email: contact_email || null },
        ],
        successUrl: `${origin}/yachts/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${origin}/yachts/${yacht_id}?canceled=true`,
        sessionMetadata: {
          type: "yacht_charter",
          yacht_id,
          charter_type,
          guests: guests.toString(),
          contact_name,
          contact_phone,
          notes: notes || "",
        },
        statusReason: "Yacht charter order created",
      };
    },
  }),
);
