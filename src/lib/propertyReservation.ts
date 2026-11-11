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
