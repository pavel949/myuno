import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
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

        // Get existing bookings from this calendar
        const { data: existingBookings } = await supabase
          .from('property_bookings')
          .select('id, external_id')
          .eq('property_id', calendar.property_id)
          .eq('source_calendar_id', calendar.id);

        const existingIds = new Set((existingBookings || []).map(b => b.external_id));
        const newEventIds = new Set(events.map(e => e.uid));

        // Delete bookings that no longer exist in external calendar
        const toDelete = (existingBookings || []).filter(b => !newEventIds.has(b.external_id));
        if (toDelete.length > 0) {
          await supabase
            .from('property_bookings')
            .delete()
            .in('id', toDelete.map(b => b.id));
          console.log(`Deleted ${toDelete.length} cancelled bookings`);
        }

        // Insert or update events
        let syncedCount = 0;
        for (const event of events) {
          if (!event.dtstart || !event.dtend) continue;

          const bookingData = {
            property_id: calendar.property_id,
            owner_id: calendar.owner_id,
            guest_name: event.summary || 'External Booking',
            check_in: event.dtstart,
            check_out: event.dtend,
            source: calendar.name,
            source_calendar_id: calendar.id,
            external_id: event.uid,
            notes: event.description || `Synced from ${calendar.name}`,
            status: 'confirmed',
          };

          if (existingIds.has(event.uid)) {
            // Update existing
            await supabase
              .from('property_bookings')
              .update(bookingData)
              .eq('external_id', event.uid)
              .eq('source_calendar_id', calendar.id);
          } else {
            // Insert new
            await supabase
              .from('property_bookings')
              .insert(bookingData);
          }
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
