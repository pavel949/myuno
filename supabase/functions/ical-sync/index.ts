// Manual iCal imports availability blocks, never commercial orders or guest stays.
import { createClient } from '../_shared/supabase.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import { withRateLimit, RATE_LIMITS } from '../_shared/rate-limit.ts';
import { syncICalInventory } from '../_shared/ical-inventory-sync.ts';
import { authorizeICalSync } from './access.ts';

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, Allow: 'POST, OPTIONS', 'Content-Type': 'application/json' } });

  try {
    const access = await authorizeICalSync(req, corsHeaders);
    if (access instanceof Response) return access;
    const rateLimitResponse = await withRateLimit(
      req,
      'ical-sync',
      RATE_LIMITS.publicRead,
      corsHeaders,
      access.userId,
      true,
    );
    if (rateLimitResponse) return rateLimitResponse;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { calendars } = access;

    console.info(`Syncing ${calendars?.length || 0} external calendars`);

    const results: Array<Record<string, unknown>> = [];

    for (const calendar of calendars || []) {
      const result = await syncICalInventory(supabase, calendar);
      results.push({
        calendar_id: calendar.id,
        property_id: calendar.property_id,
        name: calendar.name,
        success: result.success,
        events_synced: result.eventsAdded + result.eventsUpdated,
        cancelled: 0, // Missing events require reconciliation; never implicitly release inventory.
        error: result.error,
      });
    }

    const failed = results.some(result => result.success !== true);
    return new Response(JSON.stringify({ results, ...(failed ? { error: 'One or more calendars require reconciliation' } : {}) }), {
      status: failed ? 502 : 200,
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
