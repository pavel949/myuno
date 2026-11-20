import { getCorsHeaders } from "../_shared/cors.ts";

Deno.serve((request) => {
  const headers = { ...getCorsHeaders(request), "Content-Type": "application/json" };
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (request.method !== "POST") return new Response(null, { status: 405, headers });
  // The old endpoint accepted an address, requested interval and fees from the
  // browser. Flower delivery now needs an operator-confirmed quote. No legacy
  // request should reach order creation or Stripe.
  return new Response(JSON.stringify({ error: "flower_delivery_review_required" }), {
    status: 409,
    headers,
  });
});
