import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

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
function generateUID(id: string, domain: string): string {
  return `yacht-${id}@${domain}`;
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
  console.log('Yacht calendar export request received');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const yachtId = url.searchParams.get('yacht');

    if (!token || !yachtId) {
      console.error('Missing token or yacht parameter');
      return new Response('Missing required parameters', { 
        status: 400,
        headers: corsHeaders 
      });
    }

    // Initialize Supabase client with service role for public access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate token
    const { data: yacht, error: yachtError } = await supabase
      .from('yachts')
      .select('id, name_en, name_ru, ical_token')
      .eq('id', yachtId)
      .single();

    if (yachtError || !yacht) {
      console.error('Yacht not found:', yachtError);
      return new Response('Yacht not found', { 
        status: 404,
        headers: corsHeaders 
      });
    }

    if (yacht.ical_token !== token) {
      console.error('Invalid token');
      return new Response('Unauthorized', { 
        status: 401,
        headers: corsHeaders 
      });
    }

    console.log(`Generating iCal for yacht: ${yacht.name_en || yacht.name_ru}`);

    // Fetch availability entries (blocked dates)
    const { data: availability, error: availabilityError } = await supabase
      .from('yacht_availability')
      .select('*')
      .eq('yacht_id', yachtId)
      .in('status', ['blocked', 'booked', 'maintenance'])
      .order('date', { ascending: true });

    if (availabilityError) {
      console.error('Error fetching availability:', availabilityError);
      return new Response('Error fetching availability', { 
        status: 500,
        headers: corsHeaders 
      });
    }

    // Fetch orders for this yacht
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*, order_item_yacht_details(*)')
      .eq('vertical', 'yacht')
      .eq('entity_id', yachtId)
      .neq('status', 'cancelled')
      .order('scheduled_start', { ascending: true });

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
    }

    // Generate iCal content
    const domain = 'uno.app';
    const yachtName = yacht.name_en || yacht.name_ru || 'Yacht';
    const calendarName = `UNO - ${yachtName}`;

    const icalContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//UNO//Yacht Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${escapeICalText(calendarName)}`,
      'X-WR-TIMEZONE:UTC',
    ];

    // Add blocked dates as events
    let currentBlockStart: { date: string; note?: string } | null = null;
    
    for (let i = 0; i < (availability || []).length; i++) {
      const entry = availability![i];
      const nextEntry = availability![i + 1];
      
      if (!currentBlockStart) {
        currentBlockStart = { date: entry.date, note: entry.note };
      }
      
      // Check if this is the end of a block
      const currentDate = new Date(entry.date);
      const nextDate = nextEntry ? new Date(nextEntry.date) : null;
      const daysDiff = nextDate 
        ? Math.round((nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
        : 2;
      
      if (daysDiff > 1 || !nextEntry) {
        // End of block - create event
        const startDate = new Date(currentBlockStart.date);
        const endDate = new Date(entry.date);
        endDate.setDate(endDate.getDate() + 1);
        
        const summary = currentBlockStart.note || 'Blocked';
        
        icalContent.push(
          'BEGIN:VEVENT',
          `UID:${generateUID(`avail-${currentBlockStart.date}`, domain)}`,
          `DTSTAMP:${formatICalDate(new Date())}`,
          `DTSTART;VALUE=DATE:${currentBlockStart.date.replace(/-/g, '')}`,
          `DTEND;VALUE=DATE:${entry.date.replace(/-/g, '')}`,
          `SUMMARY:${escapeICalText(summary)}`,
          'STATUS:CONFIRMED',
          'TRANSP:OPAQUE',
          'END:VEVENT'
        );
        
        currentBlockStart = null;
      }
    }

    // Add orders as events
    for (const order of orders || []) {
      if (!order.scheduled_start) continue;
      
      const startDate = new Date(order.scheduled_start);
      const endDate = order.scheduled_end 
        ? new Date(order.scheduled_end)
        : new Date(startDate.getTime() + 8 * 60 * 60 * 1000); // Default 8 hours

      const details = order.order_item_yacht_details?.[0];
      const charterType = details?.charter_type || 'full_day';
      const summary = `Charter - ${order.customer_name || 'Guest'} (${charterType})`;

      icalContent.push(
        'BEGIN:VEVENT',
        `UID:${generateUID(`order-${order.id}`, domain)}`,
        `DTSTAMP:${formatICalDate(new Date(order.created_at))}`,
        `DTSTART:${formatICalDate(startDate)}`,
        `DTEND:${formatICalDate(endDate)}`,
        `SUMMARY:${escapeICalText(summary)}`,
        `DESCRIPTION:Order #${order.order_number}\\nGuests: ${details?.guests_count || 1}`,
        'STATUS:CONFIRMED',
        'TRANSP:OPAQUE',
        'END:VEVENT'
      );
    }

    icalContent.push('END:VCALENDAR');

    const icalString = icalContent.join('\r\n');

    console.log(`Generated iCal with ${availability?.length || 0} blocked dates and ${orders?.length || 0} orders`);

    return new Response(icalString, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${yachtId}.ics"`,
      },
    });
  } catch (error) {
    console.error('Error generating yacht iCal:', error);
    return new Response('Internal server error', { 
      status: 500,
      headers: corsHeaders 
    });
  }
});
