// Scheduled iCal uses the same inventory-only writer as manual sync. Never create orders.
import { createClient } from '../_shared/supabase.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import { syncICalInventory } from '../_shared/ical-inventory-sync.ts';
import { requireInternalSecret } from '../_shared/internal-secret.ts';

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, Allow: 'POST, OPTIONS', 'Content-Type': 'application/json' } });
  const denied = requireInternalSecret(req, corsHeaders);
  if (denied) return denied;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    let body: unknown;
    try { body = await req.json(); } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!body || typeof body !== 'object' || Array.isArray(body) ||
        Object.keys(body).some(key => !['owner_id', 'property_id', 'sync_type'].includes(key))) {
      return new Response(JSON.stringify({ error: 'Invalid scheduled scope' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const filters = body as { owner_id?: unknown; property_id?: unknown; sync_type?: unknown };
    if ([filters.owner_id, filters.property_id].some(id => id != null && (typeof id !== 'string' || !uuid.test(id))) ||
        (filters.sync_type != null && (typeof filters.sync_type !== 'string' || !['scheduled', 'manual', 'webhook'].includes(filters.sync_type)))) {
      return new Response(JSON.stringify({ error: 'Invalid scheduled scope' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const ownerId = filters.owner_id as string | undefined;
    const propertyId = filters.property_id as string | undefined;
    const syncType = (filters.sync_type as string | undefined) || 'scheduled';
    const supabase = createClient(supabaseUrl, supabaseKey);

    let query = supabase
      .from('property_external_calendars')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .eq('auto_sync', true);

    if (ownerId) {
      query = query.eq('owner_id', ownerId);
    }
    if (propertyId) {
      query = query.eq('property_id', propertyId);
    }

    const { data: calendars, error: calendarsError, count } = await query;

    if (calendarsError || !Array.isArray(calendars) || count == null || count !== calendars.length) {
      console.error('Error fetching calendars:', calendarsError);
      return new Response(JSON.stringify({ error: 'Calendar scope read failed or was incomplete' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.info(`Scheduled sync: ${calendars?.length || 0} calendars`);

    const results: Array<{
      calendar_id: string;
      calendar_name: string;
      property_id: string;
      success: boolean;
      events_found: number;
      events_added: number;
      events_updated: number;
      events_removed: number;
      new_order_ids: string[];
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
          const result = await syncICalInventory(supabase, calendar);
          
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
            new_order_ids: [], // Retained response field: inventory sync never creates orders.
            error: result.error,
            duration_ms: result.durationMs,
          };
        })
      );
      
      results.push(...batchResults);
    }

    const summary = {
      total_calendars: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      total_events_added: results.reduce((sum, r) => sum + r.events_added, 0),
      total_events_updated: results.reduce((sum, r) => sum + r.events_updated, 0),
      total_events_removed: results.reduce((sum, r) => sum + r.events_removed, 0),
      total_new_orders: results.reduce((sum, r) => sum + r.new_order_ids.length, 0),
    };

    console.info('Scheduled sync completed:', summary);

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
