import { ManualBookingRequestIdentity, readPropertyBookingReply, type ManualBookingReply } from '@/lib/manualPropertyBooking';
import type { CreateBookingInput } from '@/hooks/usePropertyBookings';

interface Transport { rpc(name: string, args: Record<string, unknown>): PromiseLike<{ data: unknown; error: unknown }> }
const identity = new ManualBookingRequestIdentity();

/** One unpaid guest command, never inquiry + order writes or an invented org ID. */
export async function reserveProperty(client: unknown, actorId: string, input: CreateBookingInput): Promise<ManualBookingReply> {
  const requestId = await identity.forIntent(actorId, { operation: 'guest-reservation', input });
  const { property_id, ...payload } = input;
  const { data, error } = await (client as Transport).rpc('create_property_reservation_checked', {
    p_request_id: requestId, p_property_id: property_id, p_input: payload,
  });
  if (error) throw error; // Keep durable intent on unknown acknowledgement.
  const reply = readPropertyBookingReply(data, requestId, property_id);
  identity.acknowledge(requestId);
  return reply;
}

export async function readPropertyReservation(client: unknown, orderId: string): Promise<ManualBookingReply> {
  const { data, error } = await (client as Transport).rpc('read_property_reservation_checked', { p_order_id: orderId });
  if (error) throw error;
  return readPropertyBookingReply(data, orderId);
}

/** Same PR160 checked cohort; item identity is canonical, not order metadata. */
export async function listPropertyReservations(client: unknown, propertyIds: string[]): Promise<ManualBookingReply[]> {
  if (!propertyIds.length) return [];
  const { data, error } = await (client as Transport).rpc('list_property_reservations_checked', { p_property_ids: propertyIds });
  if (error) throw error;
  return readReservationList(data, propertyIds);
}

export async function listMyPropertyReservations(client: unknown, actorId: string): Promise<ManualBookingReply[]> {
  const { data, error } = await (client as Transport).rpc('list_my_property_reservations_checked', {});
  if (error) throw error;
  const replies = readReservationList(data);
  if (replies.some(reply => reply.order.customer_user_id !== actorId)) throw new Error('Guest reservation account mismatch');
  return replies;
}

function readReservationList(data: unknown, propertyIds?: string[]): ManualBookingReply[] {
  if (!Array.isArray(data)) throw new Error('Checked reservation list unavailable');
  const seen = new Set<string>();
  return data.map(value => {
    const id = (value as { order?: { id?: string } })?.order?.id;
    if (!id || seen.has(id)) throw new Error('Checked reservation identity unavailable');
    seen.add(id);
    const reply = readPropertyBookingReply(value, id);
    if (propertyIds && !propertyIds.includes(reply.order_items[0].resource_id)) throw new Error('Checked reservation property scope mismatch');
    return reply;
  });
}

export function mergePropertyReservationRows(raw: readonly unknown[], checked: ManualBookingReply[]): unknown[] {
  const merged = new Map<string, unknown>();
  for (const value of raw) {
    const id = (value as { id?: string })?.id;
    if (!id) throw new Error('Property order identity unavailable');
    merged.set(id, value);
  }
  for (const reply of checked) merged.set(reply.order.id, {
    ...reply.order, order_items: reply.order_items, order_participants: reply.order_participants,
  });
  return [...merged.values()];
}
