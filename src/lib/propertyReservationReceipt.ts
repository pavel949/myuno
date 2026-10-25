import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

/** Read-only adapter for PR160's existing canonical receipt contract. No writer. */
export interface PropertyReservationReceipt {
  success: true;
  replayed: boolean;
  order: { id: string; status: 'pending' | 'confirmed' | 'cancelled'; start_at: string; end_at: string; updated_at: string };
  order_items: Array<{ item_type: 'property'; resource_id: string }>;
  order_participants: Array<{ role: 'guest'; name: string; phone: string | null; email: string | null }>;
}
interface Reader { rpc(name: string, args: Record<string, unknown>): PromiseLike<{ data: unknown; error: unknown }> }

export function propertyReservationReceipt(data: unknown, orderId: string): PropertyReservationReceipt {
  const reply = data as Partial<PropertyReservationReceipt> | null;
  if (reply?.success !== true || typeof reply.replayed !== 'boolean' || reply.order?.id !== orderId
    || !['pending', 'confirmed', 'cancelled'].includes(reply.order.status)
    || !reply.order.updated_at || !Number.isFinite(Date.parse(reply.order.updated_at))
    || !Number.isFinite(Date.parse(reply.order.start_at)) || !Number.isFinite(Date.parse(reply.order.end_at))
    || Date.parse(reply.order.end_at) <= Date.parse(reply.order.start_at)
    || !Array.isArray(reply.order_items) || reply.order_items.length !== 1
    || reply.order_items[0]?.item_type !== 'property' || typeof reply.order_items[0].resource_id !== 'string'
    || !Array.isArray(reply.order_participants) || reply.order_participants.length !== 1
    || reply.order_participants[0]?.role !== 'guest' || typeof reply.order_participants[0].name !== 'string') {
    throw new Error('Persisted property reservation could not be verified');
  }
  return reply as PropertyReservationReceipt;
}

export async function readPropertyReservationReceipt(client: Reader, orderId: string): Promise<PropertyReservationReceipt> {
  const { data, error } = await client.rpc('read_property_reservation_checked', { p_order_id: orderId });
  if (error) throw error;
  return propertyReservationReceipt(data, orderId);
}

/** Freeze the verified actor's token for this read lifetime; no persistent session. */
export async function bindPropertyReservationReader(actorId: string, assertCurrent: () => void) {
  assertCurrent();
  const { data, error } = await supabase.auth.getSession();
  assertCurrent();
  if (error || data.session?.user.id !== actorId || !data.session.access_token) throw new Error('Account changed');
  const token = data.session.access_token;
  const verified = await supabase.auth.getUser(token);
  assertCurrent();
  if (verified.error || verified.data.user?.id !== actorId) throw new Error('Account changed');
  return createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, {
    accessToken: async () => { assertCurrent(); return token; },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => { assertCurrent(); return globalThis.fetch(input, init); } },
  });
}
