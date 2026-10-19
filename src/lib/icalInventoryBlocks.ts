import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

/** Read-only availability evidence. Deliberately not a PropertyBooking/order. */
export interface ICalInventoryBlock {
  id: string;
  property_id: string;
  source_calendar_id: string;
  external_id: string;
  check_in: string;
  check_out: string;
}

/** Caller supplies its already resolved scope; RLS remains the authority. */
export async function loadICalInventoryBlocks(
  client: Pick<SupabaseClient<Database>, 'from'>,
  propertyIds: string[],
  range?: { from: string; to: string },
): Promise<ICalInventoryBlock[]> {
  const ids = [...new Set(propertyIds)];
  if (!ids.length) return [];
  let query = client.from('property_bookings')
    .select('id,property_id,source_calendar_id,external_id,check_in,check_out,source,status,order_id,marketplace_booking_id,total_amount', { count: 'exact' })
    .in('property_id', ids).eq('source', 'ical').eq('status', 'blocked')
    .is('order_id', null).is('marketplace_booking_id', null).order('check_in');
  if (range) query = query.lt('check_in', range.to).gt('check_out', range.from);
  const { data, error, count } = await query;
  if (error) throw error;
  if (!Array.isArray(data) || count == null || count !== data.length) {
    throw new Error('Imported inventory is incomplete; availability is unknown');
  }
  const seen = new Set<string>();
  const blocks: ICalInventoryBlock[] = [];
  for (const row of data || []) {
    if (!ids.includes(row.property_id) || row.source !== 'ical' || row.status !== 'blocked'
      || row.order_id || row.marketplace_booking_id) continue;
    if (!row.source_calendar_id || !row.external_id || row.total_amount != null || row.check_in >= row.check_out) {
      throw new Error('Imported inventory needs reconciliation');
    }
    if (range && (row.check_in >= range.to || row.check_out <= range.from)) continue;
    const key = JSON.stringify([row.property_id, row.source_calendar_id, row.external_id]);
    if (seen.has(key)) continue;
    seen.add(key);
    blocks.push({ id: row.id, property_id: row.property_id, source_calendar_id: row.source_calendar_id,
      external_id: row.external_id, check_in: row.check_in, check_out: row.check_out });
  }
  return blocks;
}
