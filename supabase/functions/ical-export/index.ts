import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const propertyId = url.searchParams.get('property');

    if (!token || !propertyId) {
      console.error('Missing token or property parameter');
      return new Response('Missing required parameters', { status: 400 });
    }

    // Initialize Supabase client with service role for public access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify token matches property
    const { data: property, error: propertyError } = await supabase
      .from('owner_properties')
      .select('id, title, title_ru, address, ical_token, owner_id')
      .eq('id', propertyId)
      .eq('ical_token', token)
      .single();

    if (propertyError || !property) {
      console.error('Invalid token or property not found:', propertyError);
      return new Response('Unauthorized', { status: 401 });
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
      return new Response('Error fetching bookings', { status: 500 });
    }

    // Generate iCal content
    const domain = 'uno.app';
    const propertyName = property.title || property.title_ru || 'Property';
    const calendarName = `UNO - ${propertyName}`;

    let icalContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//UNO//Property Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${escapeICalText(calendarName)}`,
      'X-WR-TIMEZONE:UTC',
    ];

    for (const booking of bookings || []) {
      const checkIn = new Date(booking.check_in);
      const checkOut = new Date(booking.check_out);
      const created = new Date(booking.created_at);
      const updated = new Date(booking.updated_at);

      const summary = booking.guest_name 
        ? `Reserved - ${booking.guest_name}`
        : 'Reserved';

      const description = [
        booking.guest_name ? `Guest: ${booking.guest_name}` : '',
        booking.guest_phone ? `Phone: ${booking.guest_phone}` : '',
        booking.guest_email ? `Email: ${booking.guest_email}` : '',
        booking.guests_count ? `Guests: ${booking.guests_count}` : '',
        booking.source ? `Source: ${booking.source}` : 'Source: UNO',
        booking.notes ? `Notes: ${booking.notes}` : '',
      ].filter(Boolean).join('\\n');

      icalContent.push(
        'BEGIN:VEVENT',
        `UID:${generateUID(booking.id, domain)}`,
        `DTSTAMP:${formatICalDate(updated)}`,
        `DTSTART;VALUE=DATE:${booking.check_in.replace(/-/g, '')}`,
        `DTEND;VALUE=DATE:${booking.check_out.replace(/-/g, '')}`,
        `SUMMARY:${escapeICalText(summary)}`,
        `DESCRIPTION:${description}`,
        `CREATED:${formatICalDate(created)}`,
        `LAST-MODIFIED:${formatICalDate(updated)}`,
        'STATUS:CONFIRMED',
        'TRANSP:OPAQUE',
        'END:VEVENT'
      );
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
    return new Response('Internal server error', { status: 500 });
  }
});
