import { createClient } from '../_shared/supabase.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Parse iCal date format
function parseICalDate(dateStr: string): string | null {
  if (!dateStr) return null;
  
  // Handle DATE format (YYYYMMDD)
  if (dateStr.length === 8) {
    return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
  }
  
  // Handle DATETIME format (YYYYMMDDTHHMMSS or YYYYMMDDTHHMMSSZ)
  if (dateStr.length >= 15) {
    const year = dateStr.slice(0, 4);
    const month = dateStr.slice(4, 6);
    const day = dateStr.slice(6, 8);
    return `${year}-${month}-${day}`;
  }
  
  return null;
}

// Parse iCal content into events with extended metadata
function parseICalEvents(icalContent: string, sourceUrl: string): Array<{
  uid: string;
  summary: string;
  dtstart: string | null;
  dtend: string | null;
  description?: string;
  location?: string;
  price?: number;
  guestCount?: number;
  organizer?: string;
}> {
  const events: Array<{
    uid: string;
    summary: string;
    dtstart: string | null;
    dtend: string | null;
    description?: string;
    location?: string;
    price?: number;
    guestCount?: number;
    organizer?: string;
  }> = [];
  
  // Unfold long lines (lines starting with space/tab are continuations)
  const unfoldedContent = icalContent.replace(/\r?\n[ \t]/g, '');
  const lines = unfoldedContent.split(/\r?\n/);
  
  let currentEvent: Record<string, string> | null = null;
  
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      currentEvent = {};
    } else if (line === 'END:VEVENT' && currentEvent) {
      if (currentEvent.UID && currentEvent.DTSTART) {
        const event: any = {
          uid: currentEvent.UID,
          summary: currentEvent.SUMMARY || 'Blocked',
          dtstart: parseICalDate(currentEvent.DTSTART),
          dtend: parseICalDate(currentEvent.DTEND || currentEvent.DTSTART),
          description: currentEvent.DESCRIPTION,
          location: currentEvent.LOCATION,
          organizer: currentEvent.ORGANIZER,
        };
        
        // Parse extended Airbnb fields
        if (currentEvent['X-AIRBNB-PRICE']) {
          event.price = parseFloat(currentEvent['X-AIRBNB-PRICE']);
        }
        
        // Parse guest count from various fields
        if (currentEvent['X-BOOKING-GUESTS'] || currentEvent['X-NUM-GUESTS']) {
          event.guestCount = parseInt(currentEvent['X-BOOKING-GUESTS'] || currentEvent['X-NUM-GUESTS']);
        }
        
        events.push(event);
      }
      currentEvent = null;
    } else if (currentEvent) {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        let propName = line.slice(0, colonIndex);
        const propValue = line.slice(colonIndex + 1);
        
        const semiIndex = propName.indexOf(';');
        if (semiIndex > 0) {
          propName = propName.slice(0, semiIndex);
        }
        
        currentEvent[propName] = propValue;
      }
    }
  }
  
  return events;
}

// Detect channel type from URL
function detectChannelType(url: string, name: string): string {
  const urlLower = url.toLowerCase();
  const nameLower = name.toLowerCase();
  
  if (urlLower.includes('airbnb') || nameLower.includes('airbnb')) return 'airbnb';
  if (urlLower.includes('booking.com') || nameLower.includes('booking')) return 'booking';
  if (urlLower.includes('vrbo') || urlLower.includes('homeaway') || nameLower.includes('vrbo')) return 'vrbo';
  if (urlLower.includes('expedia') || nameLower.includes('expedia')) return 'expedia';
  if (urlLower.includes('google') || nameLower.includes('google')) return 'google';
  
  return 'other';
}

// Create or update an order for an external calendar event (unified orders table)
async function upsertOrderForEvent(
  supabase: any,
  event: { uid: string; summary: string; dtstart: string | null; dtend: string | null; description?: string; price?: number; guestCount?: number; location?: string; organizer?: string },
  calendar: any,
  existingOrderId?: string
): Promise<string> {
  const startAt = `${event.dtstart}T14:00:00Z`;
  const endAt = `${event.dtend}T12:00:00Z`;

  // Build notes from available info
  const notesParts = [];
  if (event.description) notesParts.push(event.description);
  if (event.location) notesParts.push(`Location: ${event.location}`);
  if (event.organizer) notesParts.push(`Contact: ${event.organizer}`);
  notesParts.push(`Synced from ${calendar.name}`);

  const orderData = {
    order_type: 'property',
    vertical: 'property',
    start_at: startAt,
    end_at: endAt,
    status: 'confirmed',
    notes: notesParts.join('\n'),
    metadata: {
      source: 'ical',
      source_calendar_id: calendar.id,
      source_calendar_name: calendar.name,
      external_id: event.uid,
      guest_name: event.summary || 'External Booking',
      channel_type: detectChannelType(calendar.ical_url, calendar.name),
      sync_priority: calendar.priority || 0,
    },
  };

  if (existingOrderId) {
    await supabase
      .from('orders')
      .update(orderData)
      .eq('id', existingOrderId);
    return existingOrderId;
  } else {
    const { data: order, error } = await supabase
      .from('orders')
      .insert(orderData)
      .select('id')
      .single();

    if (error) throw error;

    // Create order_item linking to property
    await supabase
      .from('order_items')
      .insert({
        order_id: order.id,
        item_type: 'property',
        item_name: event.summary || 'External Booking',
        qty: 1,
        unit_price: event.price || 0,
        amount: event.price || 0,
        start_at: startAt,
        end_at: endAt,
        metadata: {
          property_id: calendar.property_id,
          guest_count: event.guestCount,
        },
      });

    // Create guest participant
    await supabase
      .from('order_participants')
      .insert({
        order_id: order.id,
        role: 'guest',
        name: event.summary || 'External Booking',
      });

    return order.id;
  }
}

// Sync a single calendar with detailed logging
async function syncCalendar(
  supabase: any,
  calendar: any,
  syncType: string
): Promise<{
  success: boolean;
  eventsFound: number;
  eventsAdded: number;
  eventsUpdated: number;
  eventsRemoved: number;
  newOrderIds: string[];
  error?: string;
  durationMs: number;
}> {
  const startTime = Date.now();
  const newOrderIds: string[] = [];
  
  try {
    console.log(`Fetching iCal from: ${calendar.name} (${calendar.ical_url})`);
    
    const response = await fetch(calendar.ical_url, {
      headers: { 'User-Agent': 'UNO Calendar Sync/2.0' },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const icalContent = await response.text();
    const events = parseICalEvents(icalContent, calendar.ical_url);
    
    console.log(`Parsed ${events.length} events from ${calendar.name}`);

    // Get existing orders from this calendar (stored in metadata)
    const { data: existingOrders } = await supabase
      .from('orders')
      .select('id, metadata')
      .eq('vertical', 'property')
      .is('deleted_at', null);

    // Filter orders that came from this calendar
    const calendarOrders = (existingOrders || []).filter((o: any) =>
      o.metadata?.source_calendar_id === calendar.id
    );

    // Map external_id -> order.id
    const existingIdMap = new Map<string, string>();
    for (const order of calendarOrders) {
      const extId = order.metadata?.external_id;
      if (extId) existingIdMap.set(extId, order.id);
    }

    const newEventIds = new Set(events.map(e => e.uid));

    // Soft-delete orders that no longer exist in external calendar
    const toDelete = calendarOrders.filter((o: any) =>
      o.metadata?.external_id && !newEventIds.has(o.metadata.external_id)
    );
    const eventsRemoved = toDelete.length;

    if (toDelete.length > 0) {
      await supabase
        .from('orders')
        .update({ deleted_at: new Date().toISOString() })
        .in('id', toDelete.map((o: any) => o.id));
      console.log(`Soft-deleted ${toDelete.length} cancelled bookings`);
    }

    // Insert or update events
    let eventsAdded = 0;
    let eventsUpdated = 0;

    for (const event of events) {
      if (!event.dtstart || !event.dtend) continue;

      const existingOrderId = existingIdMap.get(event.uid);
      const orderId = await upsertOrderForEvent(supabase, event, calendar, existingOrderId);

      if (existingOrderId) {
        eventsUpdated++;
      } else {
        newOrderIds.push(orderId);
        eventsAdded++;
      }
    }

    // Update calendar metadata
    const channelType = detectChannelType(calendar.ical_url, calendar.name);
    await supabase
      .from('property_external_calendars')
      .update({
        last_synced_at: new Date().toISOString(),
        sync_error: null,
        channel_type: channelType,
      })
      .eq('id', calendar.id);

    const durationMs = Date.now() - startTime;

    return {
      success: true,
      eventsFound: events.length,
      eventsAdded,
      eventsUpdated,
      eventsRemoved,
      newOrderIds,
      durationMs,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error syncing calendar ${calendar.name}:`, error);
    
    await supabase
      .from('property_external_calendars')
      .update({ sync_error: errorMessage })
      .eq('id', calendar.id);

    return {
      success: false,
      eventsFound: 0,
      eventsAdded: 0,
      eventsUpdated: 0,
      eventsRemoved: 0,
      newOrderIds: [],
      error: errorMessage,
      durationMs: Date.now() - startTime,
    };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let ownerId: string | null = null;
    let propertyId: string | null = null;
    let syncType = 'scheduled';
    
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      ownerId = body.owner_id || null;
      propertyId = body.property_id || null;
      syncType = body.sync_type || 'scheduled';
    }

    let query = supabase
      .from('property_external_calendars')
      .select('*, owner_properties!inner(id, owner_id)')
      .eq('is_active', true)
      .eq('auto_sync', true);

    if (ownerId) {
      query = query.eq('owner_id', ownerId);
    }
    if (propertyId) {
      query = query.eq('property_id', propertyId);
    }

    const { data: calendars, error: calendarsError } = await query;

    if (calendarsError) {
      console.error('Error fetching calendars:', calendarsError);
      return new Response(JSON.stringify({ error: 'Error fetching calendars' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Scheduled sync: ${calendars?.length || 0} calendars`);

    const results: Array<{
      calendar_id: string;
      calendar_name: string;
      property_id: string;
      success: boolean;
      events_found: number;
      events_added: number;
      events_updated: number;
      events_removed: number;
      new_order_ids: string[];
      error?: string;
      duration_ms: number;
    }> = [];

    // Process calendars with concurrency limit
    const CONCURRENCY_LIMIT = 5;
    const calendarBatches = [];
    
    for (let i = 0; i < (calendars?.length || 0); i += CONCURRENCY_LIMIT) {
      calendarBatches.push((calendars || []).slice(i, i + CONCURRENCY_LIMIT));
    }

    for (const batch of calendarBatches) {
      const batchResults = await Promise.all(
        batch.map(async (calendar: any) => {
          const result = await syncCalendar(supabase, calendar, syncType);
          
          // Log to sync_logs table
          await supabase.from('calendar_sync_logs').insert({
            calendar_id: calendar.id,
            property_id: calendar.property_id,
            owner_id: calendar.owner_id,
            events_found: result.eventsFound,
            events_added: result.eventsAdded,
            events_updated: result.eventsUpdated,
            events_removed: result.eventsRemoved,
            sync_duration_ms: result.durationMs,
            sync_type: syncType,
            error: result.error || null,
          });

          return {
            calendar_id: calendar.id,
            calendar_name: calendar.name,
            property_id: calendar.property_id,
            success: result.success,
            events_found: result.eventsFound,
            events_added: result.eventsAdded,
            events_updated: result.eventsUpdated,
            events_removed: result.eventsRemoved,
            new_order_ids: result.newOrderIds,
            error: result.error,
            duration_ms: result.durationMs,
          };
        })
      );
      
      results.push(...batchResults);
    }

    const summary = {
      total_calendars: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      total_events_added: results.reduce((sum, r) => sum + r.events_added, 0),
      total_events_updated: results.reduce((sum, r) => sum + r.events_updated, 0),
      total_events_removed: results.reduce((sum, r) => sum + r.events_removed, 0),
      total_new_orders: results.reduce((sum, r) => sum + r.new_order_ids.length, 0),
    };

    console.log('Scheduled sync completed:', summary);

    return new Response(JSON.stringify({ summary, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in scheduled iCal sync:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
