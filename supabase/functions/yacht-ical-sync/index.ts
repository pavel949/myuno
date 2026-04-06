/**
 * Yacht iCal Sync Edge Function
 * INTERNAL: Cron/service-role endpoint. Requires X-Internal-Secret header.
 */
import { createClient } from '../_shared/supabase.ts';
import { withRateLimit, RATE_LIMITS } from '../_shared/rate-limit.ts';
import { requireInternalSecret } from '../_shared/internal-secret.ts';

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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log(`[yacht-ical-sync] ${req.method} ${req.url}`);

  // Rate limit
  const rlResponse = await withRateLimit(req, 'yacht-ical-sync', RATE_LIMITS.default, corsHeaders);
  if (rlResponse) return rlResponse;

  // Require internal secret for cron/service calls
  const internalErr = requireInternalSecret(req, corsHeaders);
  if (internalErr) return internalErr;

  // Health check (still requires secret)
  const reqUrl = new URL(req.url);
  if (req.method === "GET" && reqUrl.searchParams.get("health") === "1") {
    return new Response(
      JSON.stringify({ ok: true, fn: "yacht-ical-sync", ts: new Date().toISOString() }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body for specific calendar sync
    let calendarIds: string[] = [];
    
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      calendarIds = body.calendar_ids || [];
    }

    // Build query for calendars to sync
    let query = supabase
      .from('yacht_external_calendars')
      .select('*, yachts!inner(id, provider_id)')
      .eq('is_active', true);

    if (calendarIds.length > 0) {
      query = query.in('id', calendarIds);
    }

    const { data: calendars, error: calendarsError } = await query;

    if (calendarsError) {
      console.error('Error fetching yacht calendars:', calendarsError);
      return new Response(JSON.stringify({ error: 'Error fetching calendars' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Syncing ${calendars?.length || 0} yacht external calendars`);

    const results: Array<{
      calendar_id: string;
      yacht_id: string;
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
            'User-Agent': 'UNO Yacht Calendar Sync/1.0',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const icalContent = await response.text();
        const events = parseICalEvents(icalContent);
        
        console.log(`Parsed ${events.length} events from ${calendar.name}`);

        // Get existing availability entries from this calendar
        const { data: existingEntries } = await supabase
          .from('yacht_availability')
          .select('id, date, note')
          .eq('yacht_id', calendar.yacht_id)
          .like('note', `%[${calendar.name}]%`);

        const existingDates = new Set((existingEntries || []).map(e => e.date));
        const newEventDates = new Set<string>();

        // Process events
        let syncedCount = 0;
        for (const event of events) {
          if (!event.dtstart || !event.dtend) continue;

          // Mark each day in the event range as blocked
          const currentDate = new Date(event.dtstart);
          const endDate = new Date(event.dtend);

          while (currentDate < endDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            newEventDates.add(dateStr);

            const entryData = {
              yacht_id: calendar.yacht_id,
              date: dateStr,
              status: 'blocked' as const,
              note: `${event.summary} [${calendar.name}]`,
            };

            // Upsert the availability entry
            await supabase
              .from('yacht_availability')
              .upsert(entryData, {
                onConflict: 'yacht_id,date',
                ignoreDuplicates: false,
              });

            syncedCount++;
            currentDate.setDate(currentDate.getDate() + 1);
          }
        }

        // Remove entries that no longer exist in the calendar
        const datesToRemove = (existingEntries || [])
          .filter(e => !newEventDates.has(e.date) && e.note?.includes(`[${calendar.name}]`))
          .map(e => e.id);

        if (datesToRemove.length > 0) {
          await supabase
            .from('yacht_availability')
            .delete()
            .in('id', datesToRemove);
          console.log(`Removed ${datesToRemove.length} outdated entries`);
        }

        // Update last sync time
        await supabase
          .from('yacht_external_calendars')
          .update({
            last_synced_at: new Date().toISOString(),
            sync_error: null,
          })
          .eq('id', calendar.id);

        results.push({
          calendar_id: calendar.id,
          yacht_id: calendar.yacht_id,
          name: calendar.name,
          success: true,
          events_synced: syncedCount,
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error syncing calendar ${calendar.name}:`, error);
        
        // Update with error
        await supabase
          .from('yacht_external_calendars')
          .update({
            sync_error: errorMessage,
          })
          .eq('id', calendar.id);

        results.push({
          calendar_id: calendar.id,
          yacht_id: calendar.yacht_id,
          name: calendar.name,
          success: false,
          error: errorMessage,
        });
      }
    }

    console.log('Yacht iCal sync completed:', results);

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in yacht iCal sync:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
