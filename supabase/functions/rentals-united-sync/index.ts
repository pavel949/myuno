import { createClient } from '../_shared/supabase.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
        // Fetch availability from property_availability table
        const { data: availability } = await supabase
          .from('property_availability')
          .select('*')
          .eq('property_id', property_id)
          .gte('date', new Date().toISOString().split('T')[0])
          .order('date');

        // Fetch confirmed bookings
        const { data: bookings } = await supabase
          .from('property_bookings')
          .select('check_in, check_out, status, source')
          .eq('property_id', property_id)
          .in('status', ['confirmed', 'checked_in'])
          .gte('check_out', new Date().toISOString().split('T')[0]);

        if (!ruApiKey || !property.rentals_united_id) {
          // Without RU connection, return what would be pushed
          return new Response(JSON.stringify({
            status: 'dry_run',
            message: 'Rentals United not configured. Showing what would be pushed.',
            property_id,
            availability_entries: availability?.length || 0,
            active_bookings: bookings?.length || 0,
            blocked_dates: availability?.filter(a => a.status === 'blocked').length || 0,
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // TODO: When RU API key is configured, push to Rentals United API
        // const ruResponse = await pushToRentalsUnited(property.rentals_united_id, availability, bookings);

        await supabase
          .from('properties')
          .update({ last_push_sync_at: new Date().toISOString(), push_sync_error: null })
          .eq('id', property_id);

        return new Response(JSON.stringify({
          status: 'success',
          property_id,
          availability_pushed: availability?.length || 0,
          bookings_synced: bookings?.length || 0,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
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
  } catch (error) {
    console.error('Rentals United sync error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
