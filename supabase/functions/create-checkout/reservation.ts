/** Persist the pending intent under the order lock before any provider side effect. */
export async function reserveCheckout(client: { rpc: (name: string, args: Record<string, string>) => PromiseLike<{ data: unknown; error: unknown }> }, orderId: string, actorId: string) {
  const { data, error } = await client.rpc('reserve_customer_order_checkout', { p_order_id: orderId, p_actor_id: actorId });
  const value = data as { version?: number; order_id?: string; intent_id?: string; amount?: number; currency?: string } | null;
  if (error || !value || value.version !== 1 || value.order_id !== orderId || !value.intent_id ||
      typeof value.amount !== 'number' || !Number.isFinite(value.amount) || value.amount <= 0 || !value.currency?.trim()) {
    throw new Error('checkout_reservation_not_confirmed');
  }
  return { intentId: value.intent_id, amount: value.amount, currency: value.currency };
}
