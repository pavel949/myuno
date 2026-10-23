import type { CreateBookingInput } from '@/hooks/usePropertyBookings';

interface Identity { version: 1; actor: string; digest: string; id: string; revision?: string }
const prefix = 'myuno:property-command:v1:';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const identities = new Map<string, Promise<{ key: string; value: Identity }>>();
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, canonical(v)]));
  if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('Invalid booking intent');
  return value;
}
async function identity(actor: string, intent: unknown, revision?: () => Promise<string>) {
  if (!actor) throw new Error('Not authenticated');
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(canonical(intent))));
  const digest = Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
  const key = `${prefix}${actor}:${digest}`;
  const existing = identities.get(key);
  if (existing) return existing;
  const work = (async () => {
    // Only hashed intent and command identity are retained, never guest contacts.
    // No TTL: an uncertain command must not become a new request after restart.
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      const saved = JSON.parse(raw) as Identity;
      if (saved.version !== 1 || saved.actor !== actor || saved.digest !== digest || !uuid.test(saved.id)
        || (revision && (!saved.revision || !Number.isFinite(Date.parse(saved.revision))))) throw new Error('Stored booking request is invalid; reconcile before retry');
      return { key, value: saved };
    }
    const value: Identity = { version: 1, actor, digest, id: crypto.randomUUID() };
    if (revision) {
      value.revision = await revision();
      if (!value.revision || !Number.isFinite(Date.parse(value.revision))) throw new Error('Booking revision unavailable');
    }
    // Another same-origin tab may have retained this intent while we read its
    // revision. Reuse it rather than replacing an uncertain request.
    const raced = localStorage.getItem(key);
    if (raced !== null) {
      const saved = JSON.parse(raced) as Identity;
      if (saved.version !== 1 || saved.actor !== actor || saved.digest !== digest || !uuid.test(saved.id)
        || (revision && (!saved.revision || !Number.isFinite(Date.parse(saved.revision))))) throw new Error('Stored booking request is invalid; reconcile before retry');
      return { key, value: saved };
    }
    const encoded = JSON.stringify(value);
    localStorage.setItem(key, encoded);
    if (localStorage.getItem(key) !== encoded) throw new Error('Booking request could not be retained; do not submit');
    return { key, value };
  })();
  identities.set(key, work);
  try { return await work; } finally { if (identities.get(key) === work) identities.delete(key); }
}
function acknowledge(key: string, id: string) {
  try {
    const raw = localStorage.getItem(key);
    if (raw && (JSON.parse(raw) as Identity).id === id) localStorage.removeItem(key);
  } catch { /* A committed order remains committed; retain its safe retry. */ }
}

/** Durable actor/operation/intent identity; browser restart preserves uncertainty. */
export class ManualBookingRequestIdentity {
  private keys = new Map<string, string>();
  async forIntent(actor: string, input: object): Promise<string> {
    const result = await identity(actor, { operation: 'create', input });
    this.keys.set(result.value.id, result.key);
    return result.value.id;
  }
  acknowledge(id: string) {
    const key = this.keys.get(id);
    if (key) { acknowledge(key, id); this.keys.delete(id); }
  }
}

export interface ManualBookingReply {
  success: true;
  replayed: boolean;
  order: { id: string; status: 'pending' | 'confirmed' | 'cancelled'; start_at: string; end_at: string; updated_at: string; [key: string]: unknown };
  order_participants: Array<{ role: string; name: string; phone: string | null; email: string | null }>;
  order_items: Array<{ item_type: string; resource_id: string }>;
}
interface Transport { rpc(name: string, args: Record<string, unknown>): PromiseLike<{ data: unknown; error: unknown }> }
export function readPropertyBookingReply(data: unknown, orderId: string, propertyId?: string): ManualBookingReply {
  const reply = data as Partial<ManualBookingReply> | null;
  if (reply?.success !== true || typeof reply.replayed !== 'boolean' || reply.order?.id !== orderId
    || !['pending', 'confirmed', 'cancelled'].includes(reply.order.status)
    || !reply.order.start_at || !reply.order.end_at || !reply.order.updated_at
    || !Number.isFinite(Date.parse(reply.order.start_at)) || !Number.isFinite(Date.parse(reply.order.end_at))
    || Date.parse(reply.order.end_at) <= Date.parse(reply.order.start_at)
    || !Number.isFinite(Date.parse(reply.order.updated_at))
    || !Array.isArray(reply.order_items) || reply.order_items.length !== 1
    || reply.order_items[0]?.item_type !== 'property' || !reply.order_items[0].resource_id
    || (propertyId && reply.order_items[0].resource_id !== propertyId)
    || !Array.isArray(reply.order_participants) || reply.order_participants.length !== 1 || reply.order_participants[0]?.role !== 'guest') {
    throw new Error('Booking acknowledgement is incomplete; check the booking before starting a new request');
  }
  return reply as ManualBookingReply;
}
export async function createManualBooking(client: unknown, requestId: string, input: CreateBookingInput): Promise<ManualBookingReply> {
  const { property_id, ...payload } = input;
  const { data, error } = await (client as Transport).rpc('create_manual_property_booking', { p_request_id: requestId, p_property_id: property_id, p_input: payload });
  if (error) throw error;
  return readPropertyBookingReply(data, requestId, property_id);
}

const changes = new Map<string, Promise<ManualBookingReply>>();
export async function executePropertyBookingChange(client: unknown, actorId: string, orderId: string, patch: Record<string, unknown>, expectedUpdatedAt?: string): Promise<ManualBookingReply> {
  if (!actorId || !orderId || !Object.keys(patch).length) throw new Error('Booking change is incomplete');
  const flight = JSON.stringify(canonical([actorId, orderId, patch]));
  const active = changes.get(flight);
  if (active) return active;
  const work = (async () => {
    const command = await identity(actorId, { operation: 'change', orderId, patch }, async () => {
      if (expectedUpdatedAt) return expectedUpdatedAt;
      const { data, error } = await (client as Transport).rpc('read_property_reservation_checked', { p_order_id: orderId });
      if (error) throw error;
      return readPropertyBookingReply(data, orderId).order.updated_at;
    });
    const { data, error } = await (client as Transport).rpc('change_property_booking', {
      p_request_id: command.value.id, p_order_id: orderId, p_expected_updated_at: command.value.revision, p_patch: patch,
    });
    if (error) {
      // This exact server rejection precedes every write/receipt. An ambiguous
      // transport failure must retain identity; a proven stale CAS may be
      // reconciled with a fresh read and a new explicit user action.
      const rejection = error as { code?: string; message?: string };
      if (rejection.code === '40001' && rejection.message === 'stale_reservation') acknowledge(command.key, command.value.id);
      throw error;
    }
    const result = readPropertyBookingReply(data, orderId);
    acknowledge(command.key, command.value.id);
    return result;
  })();
  changes.set(flight, work);
  try { return await work; } finally { if (changes.get(flight) === work) changes.delete(flight); }
}
