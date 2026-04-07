// Creates order with server-side prices from marketplace_products. Returns order_id for create-order-checkout.
import { createClient } from "../_shared/supabase.ts";
import { withRateLimit, RATE_LIMITS } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://myuno.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateOrderItem {
  product_id: string;
  qty: number;
  item_name?: string;
  resource_id?: string;
  provider_org_id?: string;
}

interface CreateOrderRequest {
  order_type: string;
  items: CreateOrderItem[];
  start_at?: string;
  end_at?: string;
  currency?: string;
  metadata?: Record<string, unknown>;
  participants?: Array<{ role: string; name: string; phone?: string; email?: string }>;
  addresses?: Array<{ address_type: string; address_text: string; lat?: number; lng?: number }>;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rateLimitResponse = await withRateLimit(
      req,
      "create-order",
      RATE_LIMITS.payment,
      corsHeaders,
      user.id
    );
    if (rateLimitResponse) return rateLimitResponse;

    const body: CreateOrderRequest = await req.json();
    const { order_type, items, start_at, end_at, currency = "THB", metadata, participants, addresses } = body;

    if (!order_type || typeof order_type !== "string") {
      return new Response(JSON.stringify({ error: "Invalid order_type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: "Order must have at least one item" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    for (const item of items) {
      if (!item.product_id || !UUID_REGEX.test(item.product_id) || typeof item.qty !== "number" || item.qty < 1) {
        return new Response(JSON.stringify({ error: "Invalid item: product_id (UUID) and qty (>= 1) required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const productIds = [...new Set(items.map((i) => i.product_id))];
    const { data: products, error: productsError } = await supabaseClient
      .from("products")
      .select("id, base_price, name_en, name_ru")
      .in("id", productIds);

    if (productsError) {
      console.error("Failed to fetch products:", productsError);
      return new Response(JSON.stringify({ error: "Failed to resolve products" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const productMap = new Map((products ?? []).map((p) => [p.id, p]));
    for (const id of productIds) {
      if (!productMap.has(id)) {
        return new Response(JSON.stringify({ error: `Unknown product: ${id}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const orderItemsWithPrice: Array<{
      product_id: string;
      qty: number;
      item_name: string;
      resource_id: string | null;
      provider_org_id: string | null;
      unit_price: number;
      amount: number;
    }> = [];
    let total_amount = 0;
    for (const item of items) {
      const product = productMap.get(item.product_id)!;
      const unit_price = Number((product as { base_price?: number }).base_price ?? 0);
      const amount = unit_price * item.qty;
      total_amount += amount;
      orderItemsWithPrice.push({
        product_id: item.product_id,
        qty: item.qty,
        item_name: item.item_name ?? (product as { name_en?: string; name_ru?: string }).name_en ?? (product as { name_ru?: string }).name_ru ?? "Product",
        resource_id: item.resource_id ?? null,
        provider_org_id: item.provider_org_id ?? null,
        unit_price,
        amount,
      });
    }

    if (total_amount < 1) {
      return new Response(JSON.stringify({ error: "Order total must be at least 1" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: order, error: orderError } = await supabaseClient
      .from("orders")
      .insert({
        order_type,
        customer_user_id: user.id,
        provider_org_id: orderItemsWithPrice[0]?.provider_org_id ?? null,
        status: "pending",
        start_at: start_at ?? null,
        end_at: end_at ?? null,
        total_amount,
        currency,
        metadata: metadata ?? {},
      })
      .select("id, order_number")
      .single();

    if (orderError) {
      console.error("Failed to create order:", orderError);
      return new Response(JSON.stringify({ error: "Failed to create order" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const orderItemsInsert = orderItemsWithPrice.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      resource_id: item.resource_id,
      provider_org_id: item.provider_org_id,
      item_name: item.item_name,
      item_type: "product",
      qty: item.qty,
      unit_price: item.unit_price,
      amount: item.amount,
      status: "pending",
    }));

    const { error: itemsError } = await supabaseClient.from("order_items").insert(orderItemsInsert);
    if (itemsError) {
      console.error("Failed to create order items:", itemsError);
      await supabaseClient.from("orders").delete().eq("id", order.id);
      return new Response(JSON.stringify({ error: "Failed to create order items" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabaseClient.from("order_status_history").insert({
      order_id: order.id,
      from_status: null,
      to_status: "pending",
      actor_user_id: user.id,
      reason: "Order created",
    });

    if (participants?.length) {
      await supabaseClient.from("order_participants").insert(
        participants.map((p) => ({ order_id: order.id, ...p }))
      );
    }
    if (addresses?.length) {
      await supabaseClient.from("order_addresses").insert(
        addresses.map((a) => ({ order_id: order.id, ...a }))
      );
    }

    return new Response(
      JSON.stringify({ order_id: order.id, order_number: order.order_number }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[create-order]", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
