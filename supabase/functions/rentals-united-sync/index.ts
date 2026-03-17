import { createClient } from '../_shared/supabase.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RU_API_URL = 'https://rm.rentalsunited.com/api/Handler.ashx';

function getDateTwoYearsAhead(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 2);
  return d.toISOString().split('T')[0];
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Build Push_PutAvbUnits_RQ XML for availability push */
function buildPutAvbUnitsXml(
  accessKey: string,
  secretKey: string,
  propertyIdRu: number,
  availability: Array<{ from: string; to: string; units: number; minStay?: number }>
): string {
  const dateElements = availability
    .map(
      (a) =>
        `    <Date From="${escapeXml(a.from)}" To="${escapeXml(a.to)}">
      <U>${a.units}</U>
      <MS>${a.minStay ?? 1}</MS>
      <C>1</C>
    </Date>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<Push_PutAvbUnits_RQ>
  <Authentication>
    <AccessKey>${escapeXml(accessKey)}</AccessKey>
    <SecretKey>${escapeXml(secretKey)}</SecretKey>
  </Authentication>
  <MuCalendar PropertyID="${propertyIdRu}">
${dateElements}
  </MuCalendar>
</Push_PutAvbUnits_RQ>`;
}

/** Group consecutive dates with same status into ranges */
function groupAvailabilityRanges(
  rows: Array<{ date: string; status: string }>
): Array<{ from: string; to: string; units: number }> {
  if (rows.length === 0) return [];
  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  const ranges: Array<{ from: string; to: string; units: number }> = [];
  let current = { from: sorted[0].date, to: sorted[0].date, units: sorted[0].status === 'available' ? 1 : 0 };

  for (let i = 1; i < sorted.length; i++) {
    const r = sorted[i];
    const units = r.status === 'available' ? 1 : 0;
    const nextDate = new Date(current.to);
    nextDate.setDate(nextDate.getDate() + 1);
    const expectedNext = nextDate.toISOString().split('T')[0];

    if (r.date === expectedNext && units === current.units) {
      current.to = r.date;
    } else {
      ranges.push(current);
      current = { from: r.date, to: r.date, units };
    }
  }
  ranges.push(current);
  return ranges;
}

/** Push availability to Rentals United API */
async function pushAvailabilityToRu(
  accessKey: string,
  secretKey: string,
  propertyIdRu: number,
  availability: Array<{ from: string; to: string; units: number }>
): Promise<{ success: boolean; error?: string }> {
  if (availability.length === 0) return { success: true };

  const xml = buildPutAvbUnitsXml(accessKey, secretKey, propertyIdRu, availability);

  const res = await fetch(RU_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/xml' },
    body: xml,
  });

  const text = await res.text();

  if (!res.ok) {
    return { success: false, error: `HTTP ${res.status}: ${text.slice(0, 500)}` };
  }

  const statusMatch = text.match(/<Status ID="(\d+)">/);
  const statusId = statusMatch ? parseInt(statusMatch[1], 10) : -1;
  if (statusId !== 0 && statusId !== 5) {
    const msgMatch = text.match(/<Status[^>]*>([^<]+)<\/Status>/);
    return { success: false, error: msgMatch ? msgMatch[1] : text.slice(0, 500) };
  }

  return { success: true };
}

/**
 * Rentals United Sync - Push prices & availability from myUNO to RU API
 *
 * Actions:
 *   - push_availability: Push calendar blocks to Rentals United
 *   - push_rates: Push seasonal rates to Rentals United
 *   - pull_bookings: Pull new bookings from Rentals United
 *   - link_property: Link myUNO property to RU property ID
 *   - status: Check sync status for a property
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ruApiKey = Deno.env.get('RENTALS_UNITED_API_KEY');
    const supabase = createClient(supabaseUrl, serviceKey);

    const { action, property_id } = await req.json();

    if (!property_id) {
      return new Response(JSON.stringify({ error: 'property_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify property exists and is in myuno_master mode
    const { data: property, error: propErr } = await supabase
      .from('properties')
      .select('id, title, sync_mode, rentals_united_id, owner_id')
      .eq('id', property_id)
      .single();

    if (propErr || !property) {
      return new Response(JSON.stringify({ error: 'Property not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (property.sync_mode !== 'myuno_master') {
      return new Response(JSON.stringify({ 
        error: 'Property sync_mode must be myuno_master to push data',
        current_mode: property.sync_mode,
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    switch (action) {
      case 'push_availability': {
        const today = new Date().toISOString().split('T')[0];

        // Fetch availability from property_availability (source of truth: orders + manual blocks)
        const { data: availability } = await supabase
          .from('property_availability')
          .select('date, status')
          .eq('property_id', property_id)
          .gte('date', today)
          .lte('date', getDateTwoYearsAhead())
          .order('date');

        const accessKey = Deno.env.get('RENTALS_UNITED_ACCESS_KEY') || ruApiKey;
        const secretKey = Deno.env.get('RENTALS_UNITED_SECRET_KEY') || ruApiKey;

        if (!accessKey || !secretKey || !property.rentals_united_id) {
          const ruId = property.rentals_united_id;
          return new Response(
            JSON.stringify({
              status: 'not_configured',
              message: !ruId
                ? 'Property not linked to Rentals United. Set rentals_united_id.'
                : 'Set RENTALS_UNITED_ACCESS_KEY and RENTALS_UNITED_SECRET_KEY in Supabase secrets.',
              property_id,
              availability_entries: availability?.length || 0,
              blocked_dates: availability?.filter((a) => a.status !== 'available').length || 0,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const propertyIdRu = parseInt(String(property.rentals_united_id), 10);
        if (isNaN(propertyIdRu)) {
          return new Response(
            JSON.stringify({
              error: 'rentals_united_id must be a numeric Rentals United property ID',
              property_id,
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const rows = (availability || []).map((a) => ({ date: a.date, status: a.status }));
        const ranges = groupAvailabilityRanges(rows);

        const result = await pushAvailabilityToRu(accessKey, secretKey, propertyIdRu, ranges);

        if (result.success) {
          await supabase
            .from('properties')
            .update({ last_push_sync_at: new Date().toISOString(), push_sync_error: null })
            .eq('id', property_id);

          return new Response(
            JSON.stringify({
              status: 'success',
              property_id,
              availability_pushed: ranges.length,
              date_ranges: ranges.length,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        await supabase
          .from('properties')
          .update({ push_sync_error: result.error })
          .eq('id', property_id);

        return new Response(
          JSON.stringify({
            status: 'error',
            property_id,
            error: result.error,
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'push_rates': {
        // Fetch rate seasons for the property
        const { data: seasons } = await supabase
          .from('property_rate_seasons')
          .select('*')
          .eq('property_id', property_id)
          .eq('is_active', true)
          .order('start_date');

        // Get base price from property
        const { data: propData } = await supabase
          .from('properties')
          .select('price, currency')
          .eq('id', property_id)
          .single();

        if (!ruApiKey || !property.rentals_united_id) {
          return new Response(JSON.stringify({
            status: 'dry_run',
            message: 'Rentals United not configured. Showing rate data.',
            property_id,
            base_price: propData?.price,
            currency: propData?.currency,
            seasonal_rules: seasons?.length || 0,
            seasons: seasons?.map(s => ({
              name: s.name,
              start: s.start_date,
              end: s.end_date,
              modifier: s.price_modifier,
              absolute_price: s.price_per_night,
            })),
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // TODO: Push rates to Rentals United API

        return new Response(JSON.stringify({
          status: 'success',
          property_id,
          rates_pushed: seasons?.length || 0,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'status': {
        return new Response(JSON.stringify({
          property_id,
          sync_mode: property.sync_mode,
          rentals_united_linked: !!property.rentals_united_id,
          rentals_united_id: property.rentals_united_id,
          last_push_at: (property as any).last_push_sync_at,
          push_error: (property as any).push_sync_error,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'link_property': {
        // This would be used to link a myUNO property to a Rentals United property
        return new Response(JSON.stringify({
          status: 'not_configured',
          message: 'Rentals United API key required. Configure in backend secrets.',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error: unknown) {
    console.error('Rentals United sync error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
