import type { CreateBookingInput } from '@/hooks/usePropertyBookings';

/** Retain one draft identity through transport failures; never share across actors. */
export class ManualBookingRequestIdentity {
  private pending: { fingerprint: string; id: string } | null = null;

  forIntent(actorId: string, input: CreateBookingInput): string {
    const fingerprint = JSON.stringify([actorId, ...Object.entries(input).sort(([a], [b]) => a.localeCompare(b))]);
    if (this.pending?.fingerprint !== fingerprint) this.pending = { fingerprint, id: crypto.randomUUID() };
    return this.pending.id;
  }

  acknowledge(id: string) {
    if (this.pending?.id === id) this.pending = null;
  }
}

export interface ManualBookingReply {
  success: true;
  replayed: boolean;
  order: { id: string; status: 'pending' | 'confirmed'; start_at: string; end_at: string; [key: string]: unknown };
  order_participants: Array<{ role: string; name: string; phone: string | null; email: string | null }>;
  order_items: Array<{ item_type: string; resource_id: string }>;
}

// Narrow adapter until canonical generated types include the reviewed migration.
// A missing RPC fails explicitly. It never falls back to unprotected table writes.
interface ManualBookingTransport {
  rpc(name: string, args: Record<string, unknown>): PromiseLike<{ data: unknown; error: unknown }>;
}

export async function createManualBooking(client: unknown, requestId: string, input: CreateBookingInput): Promise<ManualBookingReply> {
  const { property_id, ...payload } = input;
  const { data, error } = await (client as ManualBookingTransport).rpc('create_manual_property_booking', {
    p_request_id: requestId, p_property_id: property_id, p_input: payload,
  });
  if (error) throw error;
  const result = data as Partial<ManualBookingReply> | null;
  if (result?.success !== true || typeof result.replayed !== 'boolean' || result.order?.id !== requestId
    || !['pending', 'confirmed'].includes(result.order?.status ?? '')
    || !result.order?.start_at || !result.order?.end_at
    || !Array.isArray(result.order_items) || result.order_items.length !== 1
    || result.order_items[0]?.resource_id !== property_id || result.order_items[0]?.item_type !== 'property'
    || !Array.isArray(result.order_participants) || result.order_participants.length !== 1
    || result.order_participants[0]?.role !== 'guest') {
    throw new Error('Manual booking acknowledgement is incomplete; check the booking before starting a new draft');
  }
  return result as ManualBookingReply;
}
