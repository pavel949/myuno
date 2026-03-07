import { createClient } from '../_shared/supabase.ts';
import { withRateLimit, RATE_LIMITS } from '../_shared/rate-limit.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

// Generate iCal format date
function formatICalDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

// Generate unique UID for event
function generateUID(bookingId: string, domain: string): string {
  return `${bookingId}@${domain}`;
}

// Escape special characters in iCal text
function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

Deno.serve(async (req) => {
  console.log('Calendar export request received');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // P1-1: Apply rate limiting
    const rateLimitResponse = await withRateLimit(
      req,
      'calendar-export',
      RATE_LIMITS.publicRead,
      corsHeaders
    );
    if (rateLimitResponse) return rateLimitResponse;

    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const propertyId = url.searchParams.get('property');

    if (!token || !propertyId) {
      console.error('Missing token or property parameter');
      return new Response('Missing required parameters', { 
        status: 400,
        headers: corsHeaders 
      });
    }

    // Initialize Supabase client with service role for public access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // P1-2: Validate token WITH expiration check using backend function
    const { data: validationResult, error: validationError } = await supabase.rpc(
      'validate_ical_token',
      { p_property_id: propertyId, p_token: token }
    );

    if (validationError) {
      console.error('Token validation error:', validationError);
      return new Response('Token validation failed', { 
        status: 500,
        headers: corsHeaders 
      });
    }

    if (!validationResult?.valid) {
      const errorMsg = validationResult?.error || 'invalid_token';
      console.error('Invalid token:', errorMsg);
      
      // Return specific error for expired tokens
      if (errorMsg === 'token_expired') {
        return new Response('Token expired. Please regenerate the calendar link.', { 
          status: 401,
          headers: corsHeaders 
        });
      }
      
      return new Response('Unauthorized', { 
        status: 401,
        headers: corsHeaders 
      });
    }

    // Fetch property details for calendar name
    const { data: property, error: propertyError } = await supabase
      .from('owner_properties')
      .select('id, title, title_ru, address')
      .eq('id', propertyId)
      .single();

    if (propertyError || !property) {
      console.error('Property not found:', propertyError);
      return new Response('Property not found', { 
        status: 404,
        headers: corsHeaders 
      });
    }

    console.log(`Generating iCal for property: ${property.title || property.title_ru}`);

    // Fetch bookings for this property
    const { data: bookings, error: bookingsError } = await supabase
      .from('property_bookings')
      .select('*')
      .eq('property_id', propertyId)
      .neq('status', 'cancelled')
      .order('check_in', { ascending: true });

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      return new Response('Error fetching bookings', { 
        status: 500,
        headers: corsHeaders 
      });
    }

    // Fetch manual blocks from property_availability
    const today = new Date().toISOString().split('T')[0];
    const { data: availability } = await supabase
      .from('property_availability')
      .select('date, status, note')
      .eq('property_id', propertyId)
      .eq('status', 'blocked')
      .gte('date', today)
      .order('date');

    // Fetch base price and rate seasons for description enrichment
    const { data: propPricing } = await supabase
      .from('properties')
      .select('price, currency, sync_mode')
      .eq('id', propertyId)
      .single();

    const { data: rateSeasons } = await supabase
      .from('property_rate_seasons')
      .select('name, start_date, end_date, price_per_night, price_modifier')
      .eq('property_id', propertyId)
      .eq('is_active', true)
      .order('start_date');

    // Generate iCal content
    const domain = 'uno.app';
    const propertyName = property.title || property.title_ru || 'Property';
    const calendarName = `UNO - ${propertyName}`;
    const isMaster = propPricing?.sync_mode === 'myuno_master';

    const icalContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//UNO//Property Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${escapeICalText(calendarName)}`,
      'X-WR-TIMEZONE:UTC',
      // Signal refresh interval — OTAs will poll more frequently
      isMaster ? 'X-PUBLISHED-TTL:PT15M' : 'X-PUBLISHED-TTL:PT30M',
      `REFRESH-INTERVAL;VALUE=DURATION:${isMaster ? 'PT15M' : 'PT30M'}`,
    ];

    // Add bookings as events
    for (const booking of bookings || []) {
      const created = new Date(booking.created_at);
      const updated = new Date(booking.updated_at);

      const summary = booking.guest_name 
        ? `Reserved - ${booking.guest_name}`
        : 'Reserved';

      const descParts = [
        booking.guest_name ? `Guest: ${booking.guest_name}` : '',
        booking.guest_phone ? `Phone: ${booking.guest_phone}` : '',
        booking.guest_email ? `Email: ${booking.guest_email}` : '',
        booking.guests_count ? `Guests: ${booking.guests_count}` : '',
        booking.source ? `Source: ${booking.source}` : 'Source: UNO',
        booking.total_amount && propPricing?.currency
          ? `Total: ${booking.total_amount} ${propPricing.currency}`
          : '',
        booking.notes ? `Notes: ${booking.notes}` : '',
      ].filter(Boolean).join('\\n');

      icalContent.push(
        'BEGIN:VEVENT',
        `UID:${generateUID(booking.id, domain)}`,
        `DTSTAMP:${formatICalDate(updated)}`,
        `DTSTART;VALUE=DATE:${booking.check_in.replace(/-/g, '')}`,
        `DTEND;VALUE=DATE:${booking.check_out.replace(/-/g, '')}`,
        `SUMMARY:${escapeICalText(summary)}`,
        `DESCRIPTION:${descParts}`,
        `CREATED:${formatICalDate(created)}`,
        `LAST-MODIFIED:${formatICalDate(updated)}`,
        'STATUS:CONFIRMED',
        'TRANSP:OPAQUE',
        'END:VEVENT'
      );
    }

    // Add manual blocks from property_availability as separate events
    if (availability && availability.length > 0) {
      // Group consecutive blocked dates into ranges
      let rangeStart = availability[0].date;
      let rangeEnd = availability[0].date;
      let rangeNote = availability[0].note;

      const flushRange = () => {
        const endDate = new Date(rangeEnd);
        endDate.setDate(endDate.getDate() + 1);
        const endStr = endDate.toISOString().split('T')[0].replace(/-/g, '');
        const uid = `block-${rangeStart}-${rangeEnd}@${domain}`;

        icalContent.push(
          'BEGIN:VEVENT',
          `UID:${uid}`,
          `DTSTAMP:${formatICalDate(new Date())}`,
          `DTSTART;VALUE=DATE:${rangeStart.replace(/-/g, '')}`,
          `DTEND;VALUE=DATE:${endStr}`,
          `SUMMARY:${escapeICalText(rangeNote ? `Blocked - ${rangeNote}` : 'Not Available')}`,
          'STATUS:CONFIRMED',
          'TRANSP:OPAQUE',
          'END:VEVENT'
        );
      };

      for (let i = 1; i < availability.length; i++) {
        const prevDate = new Date(rangeEnd);
        prevDate.setDate(prevDate.getDate() + 1);
        const nextExpected = prevDate.toISOString().split('T')[0];

        if (availability[i].date === nextExpected) {
          rangeEnd = availability[i].date;
        } else {
          flushRange();
          rangeStart = availability[i].date;
          rangeEnd = availability[i].date;
          rangeNote = availability[i].note;
        }
      }
      flushRange();
    }

    // If myUNO is master, add rate seasons as FREEBUSY informational comments
    if (isMaster && rateSeasons && rateSeasons.length > 0) {
      for (const season of rateSeasons) {
        const price = season.price_per_night || (propPricing?.price ? propPricing.price * (1 + (season.price_modifier || 0) / 100) : null);
        const priceInfo = price ? ` — ${Math.round(price)} ${propPricing?.currency || 'THB'}/night` : '';
        icalContent.push(
          'BEGIN:VEVENT',
          `UID:rate-${season.start_date}-${season.end_date}@${domain}`,
          `DTSTAMP:${formatICalDate(new Date())}`,
          `DTSTART;VALUE=DATE:${season.start_date.replace(/-/g, '')}`,
          `DTEND;VALUE=DATE:${season.end_date.replace(/-/g, '')}`,
          `SUMMARY:${escapeICalText(`Rate: ${season.name}${priceInfo}`)}`,
          'TRANSP:TRANSPARENT',
          'END:VEVENT'
        );
      }
    }

    icalContent.push('END:VCALENDAR');

    const icalString = icalContent.join('\r\n');

    console.log(`Generated iCal with ${bookings?.length || 0} events`);

    return new Response(icalString, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${propertyId}.ics"`,
      },
    });
  } catch (error) {
    console.error('Error generating iCal:', error);
    return new Response('Internal server error', { 
      status: 500,
      headers: corsHeaders 
    });
  }
});
