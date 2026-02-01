import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
  newBookingIds: string[];
  error?: string;
  durationMs: number;
}> {
  const startTime = Date.now();
  const newBookingIds: string[] = [];
  
  try {
    console.log(`Fetching iCal from: ${calendar.name} (${calendar.ical_url})`);
    
    // Fetch iCal content
    const response = await fetch(calendar.ical_url, {
      headers: {
        'User-Agent': 'UNO Calendar Sync/2.0',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const icalContent = await response.text();
    const events = parseICalEvents(icalContent, calendar.ical_url);
    
    console.log(`Parsed ${events.length} events from ${calendar.name}`);

    // Get existing bookings from this calendar
    const { data: existingBookings } = await supabase
      .from('property_bookings')
      .select('id, external_id')
      .eq('property_id', calendar.property_id)
      .eq('source_calendar_id', calendar.id);

    const existingIds = new Set((existingBookings || []).map((b: any) => b.external_id));
    const existingMap = new Map((existingBookings || []).map((b: any) => [b.external_id, b.id]));
    const newEventIds = new Set(events.map(e => e.uid));

    // Delete bookings that no longer exist in external calendar
    const toDelete = (existingBookings || []).filter((b: any) => !newEventIds.has(b.external_id));
    const eventsRemoved = toDelete.length;
    
    if (toDelete.length > 0) {
      await supabase
        .from('property_bookings')
        .delete()
        .in('id', toDelete.map((b: any) => b.id));
      console.log(`Deleted ${toDelete.length} cancelled bookings`);
    }

    // Insert or update events
    let eventsAdded = 0;
    let eventsUpdated = 0;
    
    for (const event of events) {
      if (!event.dtstart || !event.dtend) continue;

      const bookingData: any = {
        property_id: calendar.property_id,
        owner_id: calendar.owner_id,
        guest_name: event.summary || 'External Booking',
        check_in: event.dtstart,
        check_out: event.dtend,
        source: calendar.name,
        source_calendar_id: calendar.id,
        external_id: event.uid,
        status: 'confirmed',
        sync_priority: calendar.priority || 0,
      };
      
      // Add extended fields if available
      if (event.price) {
        bookingData.total_amount = event.price;
      }
      if (event.guestCount) {
        bookingData.number_of_guests = event.guestCount;
      }
      
      // Build notes from available info
      const notesParts = [];
      if (event.description) notesParts.push(event.description);
      if (event.location) notesParts.push(`Location: ${event.location}`);
      if (event.organizer) notesParts.push(`Contact: ${event.organizer}`);
      notesParts.push(`Synced from ${calendar.name}`);
      bookingData.notes = notesParts.join('\n');

      if (existingIds.has(event.uid)) {
        // Update existing
        await supabase
          .from('property_bookings')
          .update(bookingData)
          .eq('external_id', event.uid)
          .eq('source_calendar_id', calendar.id);
        eventsUpdated++;
      } else {
        // Insert new
        const { data: newBooking } = await supabase
          .from('property_bookings')
          .insert(bookingData)
          .select('id')
          .single();
        
        if (newBooking) {
          newBookingIds.push(newBooking.id);
        }
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
      newBookingIds,
      durationMs,
    };

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

    return {
      success: false,
      eventsFound: 0,
      eventsAdded: 0,
      eventsUpdated: 0,
      eventsRemoved: 0,
      newBookingIds: [],
      error: errorMessage,
      durationMs: Date.now() - startTime,
    };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request for optional filters
    let ownerId: string | null = null;
    let propertyId: string | null = null;
    let syncType = 'scheduled';
    
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      ownerId = body.owner_id || null;
      propertyId = body.property_id || null;
      syncType = body.sync_type || 'scheduled';
    }

    // Build query for calendars to sync (only auto_sync enabled)
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
      new_booking_ids: string[];
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
            new_booking_ids: result.newBookingIds,
            error: result.error,
            duration_ms: result.durationMs,
          };
        })
      );
      
      results.push(...batchResults);
    }

    // Summary
    const summary = {
      total_calendars: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      total_events_added: results.reduce((sum, r) => sum + r.events_added, 0),
      total_events_updated: results.reduce((sum, r) => sum + r.events_updated, 0),
      total_events_removed: results.reduce((sum, r) => sum + r.events_removed, 0),
      total_new_bookings: results.reduce((sum, r) => sum + r.new_booking_ids.length, 0),
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
