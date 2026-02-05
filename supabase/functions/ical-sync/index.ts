import { createClient } from '../_shared/supabase.ts';
import { withRateLimit, RATE_LIMITS } from '../_shared/rate-limit.ts';

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

// Parse iCal content into events
function parseICalEvents(icalContent: string): Array<{
  uid: string;
  summary: string;
  dtstart: string | null;
  dtend: string | null;
  description?: string;
}> {
  const events: Array<{
    uid: string;
    summary: string;
    dtstart: string | null;
    dtend: string | null;
    description?: string;
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
        events.push({
          uid: currentEvent.UID,
          summary: currentEvent.SUMMARY || 'Blocked',
          dtstart: parseICalDate(currentEvent.DTSTART),
          dtend: parseICalDate(currentEvent.DTEND || currentEvent.DTSTART),
          description: currentEvent.DESCRIPTION,
        });
      }
      currentEvent = null;
    } else if (currentEvent) {
      // Parse property:value or property;params:value
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        let propName = line.slice(0, colonIndex);
        const propValue = line.slice(colonIndex + 1);
        
        // Remove parameters from property name (e.g., DTSTART;VALUE=DATE)
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

// Create or update an order for an external calendar event
async function upsertOrderForEvent(
  supabase: any,
  event: { uid: string; summary: string; dtstart: string | null; dtend: string | null; description?: string },
  calendar: any,
  existingOrderId?: string
): Promise<string> {
  const startAt = `${event.dtstart}T14:00:00Z`;
  const endAt = `${event.dtend}T12:00:00Z`;
  
  const orderData = {
    order_type: 'property',
    vertical: 'property',
    start_at: startAt,
    end_at: endAt,
    status: 'confirmed',
    notes: event.description || `Synced from ${calendar.name}`,
    metadata: {
      source: 'ical',
      source_calendar_id: calendar.id,
      source_calendar_name: calendar.name,
      external_id: event.uid,
      guest_name: event.summary || 'External Booking',
    },
  };

  if (existingOrderId) {
    // Update existing order
    await supabase
      .from('orders')
      .update(orderData)
      .eq('id', existingOrderId);
    return existingOrderId;
  } else {
    // Insert new order
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
        unit_price: 0,
        amount: 0,
        start_at: startAt,
        end_at: endAt,
        metadata: {
          property_id: calendar.property_id,
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

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting - public read endpoints (100/min)
    const rateLimitResponse = await withRateLimit(
      req,
      'ical-sync',
      RATE_LIMITS.publicRead,
      corsHeaders
    );
    if (rateLimitResponse) return rateLimitResponse;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body for specific calendar sync, or sync all if no body
    let calendarIds: string[] = [];
    
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      calendarIds = body.calendar_ids || [];
    }

    // Build query for calendars to sync
    let query = supabase
      .from('property_external_calendars')
      .select('*, owner_properties!inner(id, owner_id)')
      .eq('is_active', true);

    if (calendarIds.length > 0) {
      query = query.in('id', calendarIds);
    }

    const { data: calendars, error: calendarsError } = await query;

    if (calendarsError) {
      console.error('Error fetching calendars:', calendarsError);
      return new Response(JSON.stringify({ error: 'Error fetching calendars' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Syncing ${calendars?.length || 0} external calendars`);

    const results: Array<{
      calendar_id: string;
      property_id: string;
      name: string;
      success: boolean;
      events_synced?: number;
      error?: string;
    }> = [];

    for (const calendar of calendars || []) {
      try {
        console.log(`Fetching iCal from: ${calendar.name} (${calendar.ical_url})`);
        
        // Fetch iCal content
        const response = await fetch(calendar.ical_url, {
          headers: {
            'User-Agent': 'UNO Calendar Sync/1.0',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const icalContent = await response.text();
        const events = parseICalEvents(icalContent);
        
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
        if (toDelete.length > 0) {
          await supabase
            .from('orders')
            .update({ deleted_at: new Date().toISOString() })
            .in('id', toDelete.map((o: any) => o.id));
          console.log(`Soft-deleted ${toDelete.length} cancelled bookings`);
        }

        // Insert or update events
        let syncedCount = 0;
        for (const event of events) {
          if (!event.dtstart || !event.dtend) continue;

          const existingOrderId = existingIdMap.get(event.uid);
          await upsertOrderForEvent(supabase, event, calendar, existingOrderId);
          syncedCount++;
        }

        // Update last sync time
        await supabase
          .from('property_external_calendars')
          .update({
            last_synced_at: new Date().toISOString(),
            sync_error: null,
          })
          .eq('id', calendar.id);

        results.push({
          calendar_id: calendar.id,
          property_id: calendar.property_id,
          name: calendar.name,
          success: true,
          events_synced: syncedCount,
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error syncing calendar ${calendar.name}:`, error);
        
        // Update with error
        await supabase
          .from('property_external_calendars')
          .update({
            sync_error: errorMessage,
          })
          .eq('id', calendar.id);

        results.push({
          calendar_id: calendar.id,
          property_id: calendar.property_id,
          name: calendar.name,
          success: false,
          error: errorMessage,
        });
      }
    }

    console.log('Sync completed:', results);

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in iCal sync:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
