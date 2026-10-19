import { validateExternalUrlForSSRF } from './ssrf-guard.ts';
import { propertyBookingHoldsInventory, propertyOrderHoldsInventory } from './property-inventory.ts';

/** iCal proves unavailable dates, never a price, payment, or confirmed guest stay. */
interface CalendarSource {
  id: string;
  property_id: string;
  owner_id: string;
  name: string;
  ical_url: string;
}
interface InventoryEvent { uid: string; check_in: string; check_out: string; summary: string }

// Deno-side civil-date validation. No instant/UTC conversion or invented night.
function parseInventoryDate(value: string): string {
  if (!/^\d{8}$/.test(value)) throw new Error('iCal requires all-day DATE values; timed events need reconciliation');
  const year = Number(value.slice(0, 4)), month = Number(value.slice(4, 6)), day = Number(value.slice(6, 8));
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > days[month - 1]) throw new Error('Invalid iCal civil date');
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

/** Reject incomplete/unsupported feeds before any inventory write. Never infer cancellations. */
function parseInventoryFeed(content: string): InventoryEvent[] {
  const lines = content.replace(/^\uFEFF/, '').replace(/\r?\n[ \t]/g, '').trim().split(/\r?\n/);
  if (lines[0] !== 'BEGIN:VCALENDAR' || lines.at(-1) !== 'END:VCALENDAR') throw new Error('Incomplete iCal calendar');
  const events: InventoryEvent[] = [];
  const ids = new Set<string>();
  let current: Record<string, string> | null = null;
  for (const line of lines.slice(1, -1)) {
    if (line === 'BEGIN:VEVENT') {
      if (current) throw new Error('Malformed nested iCal event');
      current = {};
    } else if (line === 'END:VEVENT') {
      if (!current?.UID || !current.DTSTART || !current.DTEND) throw new Error('Incomplete iCal event');
      const check_in = parseInventoryDate(current.DTSTART), check_out = parseInventoryDate(current.DTEND);
      if (check_out <= check_in) throw new Error('Invalid iCal stay interval');
      if (ids.has(current.UID)) throw new Error('Duplicate iCal UID needs reconciliation');
      ids.add(current.UID);
      events.push({ uid: current.UID, check_in, check_out, summary: current.SUMMARY || '' });
      current = null;
    } else if (current) {
      if (line.startsWith('BEGIN:') || line.startsWith('END:')) throw new Error('Unsupported nested iCal component');
      const colon = line.indexOf(':');
      if (colon < 1) throw new Error('Malformed iCal event field');
      const [key, ...params] = line.slice(0, colon).toUpperCase().split(';');
      const value = line.slice(colon + 1).trim();
      if (['RRULE', 'RDATE', 'EXDATE', 'EXRULE', 'RECURRENCE-ID'].includes(key) || (key === 'STATUS' && value.toUpperCase() === 'CANCELLED')) {
        throw new Error('Recurring or cancelled iCal event needs reconciliation; existing blocks retained');
      }
      if (['UID', 'DTSTART', 'DTEND', 'SUMMARY'].includes(key)) {
        if (key in current) throw new Error('Duplicate iCal event field');
        if ((key === 'DTSTART' || key === 'DTEND') && params.some(param => param !== 'VALUE=DATE')) {
          throw new Error('Unsupported iCal date parameters');
        }
        current[key] = value;
      }
      // DESCRIPTION, contacts and vendor price extensions are not commercial evidence.
    }
  }
  if (current) throw new Error('Truncated iCal event');
  return events;
}

const NULL_INVENTORY_FIELDS = [
  'total_amount', 'currency', 'deposit_amount', 'service_fee', 'cleaning_fee', 'platform_commission', 'refund_amount',
  'order_id', 'marketplace_booking_id', 'guest_id', 'deposit_paid_at', 'deposit_payment_method',
  'deposit_stripe_session_id', 'refund_status', 'refund_processed_at', 'confirmed_at', 'confirmed_by',
] as const;
const INVENTORY_COLUMNS = `id,property_id,owner_id,source_calendar_id,external_id,source,status,check_in,check_out,${NULL_INVENTORY_FIELDS.join(',')}`;

function isOwnedInventoryBlock(row: any, calendar: CalendarSource): boolean {
  return row.property_id === calendar.property_id && row.owner_id === calendar.owner_id && row.source_calendar_id === calendar.id
    && row.source === 'ical' && row.status === 'blocked' && NULL_INVENTORY_FIELDS.every(key => row[key] == null);
}

async function updateInventoryBlock(supabase: any, calendar: CalendarSource, row: any, event: InventoryEvent): Promise<void> {
  if (!isOwnedInventoryBlock(row, calendar)) throw new Error('Existing booking needs reconciliation; commercial/legacy inventory retained');
  // Also guard the write, so a concurrently adopted commercial row cannot be overwritten.
  let query = supabase.from('property_bookings')
    .update({ check_in: event.check_in, check_out: event.check_out, notes: inventoryNotes(calendar, event) })
    .eq('id', row.id).eq('property_id', calendar.property_id).eq('owner_id', calendar.owner_id)
    .eq('source_calendar_id', calendar.id).eq('external_id', event.uid).eq('source', 'ical').eq('status', 'blocked');
  for (const key of NULL_INVENTORY_FIELDS) query = query.is(key, null);
  const { data, error } = await query.select('id').maybeSingle();
  if (error) throw new Error(`Inventory update failed (${error.code || 'unknown'})`);
  if (!data) throw new Error('Inventory changed during sync; reconciliation required');
}

function inventoryNotes(calendar: CalendarSource, event: InventoryEvent): string {
  return `Imported iCal availability block; no confirmed guest stay or monetary evidence.\nCalendar: ${calendar.name}\nSummary: ${event.summary}`;
}

async function writeInventoryEvent(supabase: any, calendar: CalendarSource, event: InventoryEvent, existing?: any): Promise<'added' | 'updated'> {
  if (existing) {
    await updateInventoryBlock(supabase, calendar, existing, event);
    return 'updated';
  }
  const { error } = await supabase.from('property_bookings').insert({
    property_id: calendar.property_id, owner_id: calendar.owner_id,
    source_calendar_id: calendar.id, external_id: event.uid, source: 'ical', status: 'blocked',
    check_in: event.check_in, check_out: event.check_out, notes: inventoryNotes(calendar, event),
    guest_name: null, guest_email: null, guest_phone: null, guests_count: null,
    ...Object.fromEntries(NULL_INVENTORY_FIELDS.map(key => [key, null])),
  });
  if (!error) return 'added';
  if (error.code === '23505') {
    // Both entrypoints share this identity. Never upsert onto a foreign calendar,
    // property or commercial row; global/partial unique-index collisions fail closed.
    const { data: raced, error: readError } = await supabase.from('property_bookings').select(INVENTORY_COLUMNS)
      .eq('source_calendar_id', calendar.id).eq('property_id', calendar.property_id).eq('external_id', event.uid).maybeSingle();
    if (readError || !raced) throw new Error('iCal UID collision needs reconciliation');
    await updateInventoryBlock(supabase, calendar, raced, event);
    return 'updated';
  }
  if (error.code === '23P01') throw new Error('iCal conflicts with retained inventory; reconciliation required');
  throw new Error(`Inventory insert failed (${error.code || 'unknown'})`);
}

// Exact counts make a PostgREST row cap an explicit failure rather than an
// incomplete conflict scan. This bounded tranche fails closed instead of paging.
function completeRows(result: { data: any[] | null; error: unknown; count: number | null }, label: string): any[] {
  if (result.error || !Array.isArray(result.data) || result.count == null || result.count !== result.data.length) {
    throw new Error(`${label} read failed or was incomplete; reconciliation required`);
  }
  return result.data;
}

async function readLegacyOrders(supabase: any, calendar: CalendarSource) {
  // Legacy scheduled records may have no item or canonical inventory row at all.
  const calendarOrders = completeRows(await supabase.from('orders')
    .select('id,metadata', { count: 'exact' }).eq('vertical', 'property')
    .contains('metadata', { source_calendar_id: calendar.id }), 'Calendar orders');
  const items = completeRows(await supabase.from('order_items')
    .select('order_id,resource_id,metadata', { count: 'exact' }).eq('item_type', 'property')
    .or(`resource_id.eq.${calendar.property_id},metadata->>property_id.eq.${calendar.property_id}`), 'Property order links');
  const ids = [...new Set(items.map(item => item.order_id))];
  const propertyOrders = ids.length ? completeRows(await supabase.from('orders')
    .select('id,start_at,end_at,status,deleted_at', { count: 'exact' })
    .eq('vertical', 'property').in('id', ids).is('deleted_at', null), 'Property orders') : [];
  return { calendarOrders, propertyOrders };
}

function assertNoLegacyCommitment(event: InventoryEvent, legacy: { calendarOrders: any[]; propertyOrders: any[] }) {
  // Even a cancelled/deleted legacy UID requires deliberate reconciliation,
  // rather than silently resurrecting or adopting its external identity.
  if (legacy.calendarOrders.some(order => order.metadata?.external_id === event.uid)) {
    throw new Error('Legacy calendar order requires reconciliation; existing order retained');
  }
  for (const order of legacy.propertyOrders) {
    if (!propertyOrderHoldsInventory(order.status)) continue;
    const start = order.start_at?.slice(0, 10), end = order.end_at?.slice(0, 10);
    if (!start || !end || start >= end || (start < event.check_out && event.check_in < end)) {
      throw new Error('Existing property order may hold these dates; reconciliation required');
    }
  }
}

export async function syncICalInventory(supabase: any, calendar: CalendarSource) {
  const started = Date.now();
  let eventsFound = 0, eventsAdded = 0, eventsUpdated = 0;
  try {
    const ssrf = validateExternalUrlForSSRF(calendar.ical_url ?? '');
    if (!ssrf.allowed) throw new Error(`Blocked iCal URL: ${ssrf.reason}`);
    // Do not permit a redirect to evade the checked destination.
    const response = await fetch(calendar.ical_url, { headers: { 'User-Agent': 'UNO Calendar Sync/3.0' }, redirect: 'error' });
    if (!response.ok) throw new Error(`iCal HTTP ${response.status}`);
    const events = parseInventoryFeed(await response.text());
    eventsFound = events.length;
    const { data: property, error: propertyError } = await supabase.from('properties').select('id,owner_id').eq('id', calendar.property_id).single();
    if (propertyError || !property?.owner_id || property.owner_id !== calendar.owner_id) throw new Error('Canonical property owner mismatch; inventory retained');
    const existing = completeRows(await supabase.from('property_bookings')
      .select(INVENTORY_COLUMNS, { count: 'exact' }).eq('source_calendar_id', calendar.id), 'Inventory');
    // Resolve all legacy commitments before any mutation. Neither missing
    // resource_id nor a missing property_bookings mirror proves availability.
    const legacy = await readLegacyOrders(supabase, calendar);
    const existingByUid = new Map<string, any>();
    for (const row of existing || []) {
      if (!row.external_id || existingByUid.has(row.external_id)) throw new Error('Ambiguous calendar inventory; reconciliation required');
      existingByUid.set(row.external_id, row);
    }
    const errors: string[] = [];
    const present = new Set(events.map(event => event.uid));
    // The legacy writer could leave orders with no canonical inventory mirror.
    // Missing legacy UIDs (including an empty feed) are not evidence of release,
    // and must not clear a reconciliation error or advance the success timestamp.
    if (legacy.calendarOrders.some(order => !order.metadata?.external_id || !present.has(order.metadata.external_id))) {
      errors.push('Legacy calendar orders missing from feed; reconciliation required; existing orders retained');
    }
    if ((existing || []).some((row: any) => propertyBookingHoldsInventory(row.status) && !present.has(row.external_id))) {
      errors.push('Events missing from feed; existing blocks retained pending reconciliation');
    }
    for (const event of events) {
      try {
        assertNoLegacyCommitment(event, legacy);
        const outcome = await writeInventoryEvent(supabase, calendar, event, existingByUid.get(event.uid));
        if (outcome === 'added') eventsAdded++; else eventsUpdated++;
      } catch (error) {
        errors.push(error instanceof Error ? error.message : 'Inventory write failed');
      }
    }
    if (errors.length) throw new Error([...new Set(errors)].join('; '));
    const { error: metadataError } = await supabase.from('property_external_calendars')
      .update({ last_synced_at: new Date().toISOString(), sync_error: null }).eq('id', calendar.id);
    if (metadataError) throw new Error('Sync completion could not be recorded');
    return { success: true, eventsFound, eventsAdded, eventsUpdated, eventsRemoved: 0, durationMs: Date.now() - started };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'iCal inventory sync failed';
    const { error: metadataError } = await supabase.from('property_external_calendars').update({ sync_error: message }).eq('id', calendar.id);
    return { success: false, eventsFound, eventsAdded, eventsUpdated, eventsRemoved: 0,
      error: metadataError ? `${message}; sync error could not be recorded` : message, durationMs: Date.now() - started };
  }
}
