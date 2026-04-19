// iCal sync — Deno edge function
// Writes external bookings (Airbnb / Booking / Agoda / VRBO) ONLY to public.property_bookings.
// Orders are reserved for monetary transactions (Stripe / cash). This separation prevents
// finance reports from being polluted by technical sync records.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { withRateLimit, RATE_LIMITS } from "../_shared/rate-limit.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ICalEvent {
  uid: string;
  summary: string;
  description?: string;
  dtstart: string | null;
  dtend: string | null;
}

function parseICalDate(dateStr: string): string | null {
  if (!dateStr) return null;
  const cleaned = dateStr.replace(/[^\d]/g, '');
  if (cleaned.length < 8) return null;
  const year = cleaned.substring(0, 4);
  const month = cleaned.substring(4, 6);
  const day = cleaned.substring(6, 8);
  return `${year}-${month}-${day}`;
}

function parseICalEvents(icalContent: string): ICalEvent[] {
  const events: ICalEvent[] = [];
  const lines = icalContent
    .split(/\r?\n/)
    .reduce<string[]>((acc, line) => {
      if (line.startsWith(' ') || line.startsWith('\t')) {
        if (acc.length > 0) acc[acc.length - 1] += line.slice(1);
      } else {
        acc.push(line);
      }
      return acc;
    }, []);

  let currentEvent: Partial<ICalEvent> | null = null;
  for (const line of lines) {
    if (line.startsWith('BEGIN:VEVENT')) {
      currentEvent = {};
    } else if (line.startsWith('END:VEVENT')) {
      if (currentEvent?.uid && currentEvent.dtstart && currentEvent.dtend) {
        events.push(currentEvent as ICalEvent);
      }
      currentEvent = null;
    } else if (currentEvent) {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;
      const keyPart = line.substring(0, colonIdx);
      const value = line.substring(colonIdx + 1);
      const key = keyPart.split(';')[0];
      switch (key) {
        case 'UID':
          currentEvent.uid = value.trim();
          break;
        case 'SUMMARY':
          currentEvent.summary = value.trim();
          break;
        case 'DESCRIPTION':
          currentEvent.description = value.trim();
          break;
        case 'DTSTART':
          currentEvent.dtstart = parseICalDate(value);
          break;
        case 'DTEND':
          currentEvent.dtend = parseICalDate(value);
          break;
      }
    }
  }
  return events;
}

async function getPropertyPricing(supabase: any, propertyId: string): Promise<number> {
  const { data } = await supabase
    .from('properties')
    .select('rental_price_per_night')
    .eq('id', propertyId)
    .single();
  return Number(data?.rental_price_per_night || 0);
}

function calculateNights(startStr: string, endStr: string): number {
  const start = new Date(startStr);
  const end = new Date(endStr);
  const diffMs = end.getTime() - start.getTime();
  return Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
}

// Detect channel from calendar name / iCal URL
function detectChannel(calendar: { name?: string; ical_url?: string }): string {
  const haystack = `${calendar.name || ''} ${calendar.ical_url || ''}`.toLowerCase();
  if (haystack.includes('airbnb')) return 'airbnb';
  if (haystack.includes('booking')) return 'booking';
  if (haystack.includes('agoda')) return 'agoda';
  if (haystack.includes('vrbo') || haystack.includes('homeaway')) return 'vrbo';
  return 'ical';
}

// Upsert ONE property_bookings row per iCal event. NO orders — pure availability/calendar layer.
async function upsertBookingForEvent(
  supabase: any,
  event: ICalEvent,
  calendar: { id: string; name: string; property_id: string; owner_properties: { owner_id: string } | { owner_id: string }[] | null },
  existingBookingId?: string,
): Promise<string | null> {
  if (!event.dtstart || !event.dtend) return null;

  const ownerProp = Array.isArray(calendar.owner_properties)
    ? calendar.owner_properties[0]
    : calendar.owner_properties;
  const ownerId = ownerProp?.owner_id;
  if (!ownerId) {
    console.warn(`No owner for property ${calendar.property_id} — skipping event ${event.uid}`);
    return null;
  }

  const pricePerNight = await getPropertyPricing(supabase, calendar.property_id);
  const nights = calculateNights(event.dtstart, event.dtend);
  const totalAmount = pricePerNight * nights;
  const channel = detectChannel(calendar);

  const bookingData = {
    property_id: calendar.property_id,
    owner_id: ownerId,
    guest_name: event.summary || `${channel} booking`,
    check_in: event.dtstart,
    check_out: event.dtend,
    total_amount: totalAmount,
    currency: 'THB',
    source: channel,
    external_id: event.uid,
    source_calendar_id: calendar.id,
    status: 'confirmed',
    notes: event.description || `Synced from ${calendar.name}`,
  };

  if (existingBookingId) {
    const { error } = await supabase
      .from('property_bookings')
      .update(bookingData)
      .eq('id', existingBookingId);
    if (error) {
      // Exclusion violation: overlap with another active booking
      if (error.code === '23P01') {
        console.warn(`Overlap on update for ${event.uid}; logging conflict`);
        await supabase.from('booking_conflicts').insert({
          property_id: calendar.property_id,
          conflict_date: event.dtstart,
          channel_a: channel,
          channel_b: 'unknown',
          order_id_a: null,
          order_id_b: null,
          resolved: false,
        });
        return null;
      }
      console.error('Update booking error:', error.message);
      return null;
    }
    return existingBookingId;
  }

  // Upsert by (property_id, external_id) — matches the unique index for ical source
  const { data: upserted, error } = await supabase
    .from('property_bookings')
    .upsert(bookingData, { onConflict: 'property_id,external_id', ignoreDuplicates: false })
    .select('id')
    .single();

  if (error) {
    // Exclusion violation: this event overlaps another active booking
    if (error.code === '23P01') {
      console.warn(`Overlap detected for event ${event.uid} on property ${calendar.property_id}; logging conflict`);
      await supabase.from('booking_conflicts').insert({
        property_id: calendar.property_id,
        conflict_date: event.dtstart,
        channel_a: channel,
        channel_b: 'unknown',
        order_id_a: null,
        order_id_b: null,
        resolved: false,
      });
      return null;
    }
    // Race-safe fallback for unique constraint
    if (error.code === '23505') {
      const { data: existing } = await supabase
        .from('property_bookings')
        .select('id')
        .eq('property_id', calendar.property_id)
        .eq('external_id', event.uid)
        .maybeSingle();
      return existing?.id ?? null;
    }
    console.error('Upsert booking error:', error.message);
    return null;
  }
  return upserted.id;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rateLimitResponse = await withRateLimit(
      req,
      'ical-sync',
      RATE_LIMITS.publicRead,
      corsHeaders,
    );
    if (rateLimitResponse) return rateLimitResponse;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    let calendarIds: string[] = [];
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      calendarIds = body.calendar_ids || [];
    }

    let query = supabase
      .from('property_external_calendars')
      .select('*, owner_properties!inner(id, owner_id)')
      .eq('is_active', true);
    if (calendarIds.length > 0) query = query.in('id', calendarIds);

    const { data: calendars, error: calendarsError } = await query;
    if (calendarsError) {
      console.error('Error fetching calendars:', calendarsError);
      return new Response(JSON.stringify({ error: 'Error fetching calendars' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Syncing ${calendars?.length || 0} external calendars`);

    const results: Array<Record<string, unknown>> = [];

    for (const calendar of calendars || []) {
      try {
        console.log(`Fetching iCal: ${calendar.name}`);
        const response = await fetch(calendar.ical_url, {
          headers: { 'User-Agent': 'UNO Calendar Sync/1.0' },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

        const icalContent = await response.text();
        const events = parseICalEvents(icalContent);
        console.log(`Parsed ${events.length} events from ${calendar.name}`);

        // Existing bookings from this calendar
        const { data: existingBookings } = await supabase
          .from('property_bookings')
          .select('id, external_id')
          .eq('source_calendar_id', calendar.id);

        const existingIdMap = new Map<string, string>();
        for (const b of existingBookings || []) {
          if (b.external_id) existingIdMap.set(b.external_id, b.id);
        }

        const newEventIds = new Set(events.map((e) => e.uid));

        // Cancel bookings that disappeared from external feed
        const toCancel = (existingBookings || []).filter(
          (b: any) => b.external_id && !newEventIds.has(b.external_id),
        );
        if (toCancel.length > 0) {
          await supabase
            .from('property_bookings')
            .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
            .in('id', toCancel.map((b: any) => b.id));
          console.log(`Cancelled ${toCancel.length} removed bookings`);
        }

        let syncedCount = 0;
        for (const event of events) {
          if (!event.dtstart || !event.dtend) continue;
          const existingId = existingIdMap.get(event.uid);
          const result = await upsertBookingForEvent(supabase, event, calendar, existingId);
          if (result) syncedCount++;
        }

        await supabase
          .from('property_external_calendars')
          .update({ last_synced_at: new Date().toISOString(), sync_error: null })
          .eq('id', calendar.id);

        results.push({
          calendar_id: calendar.id,
          property_id: calendar.property_id,
          name: calendar.name,
          success: true,
          events_synced: syncedCount,
          cancelled: toCancel.length,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error syncing ${calendar.name}:`, message);
        await supabase
          .from('property_external_calendars')
          .update({ sync_error: message })
          .eq('id', calendar.id);
        results.push({
          calendar_id: calendar.id,
          property_id: calendar.property_id,
          name: calendar.name,
          success: false,
          error: message,
        });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Fatal in iCal sync:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
