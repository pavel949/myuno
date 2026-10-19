import { requireAuth } from '../_shared/auth-guard.ts';
import { createActorClient } from '../_shared/operating-space-auth.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_CALENDARS = 50;

function rejectSync(cors: Record<string, string>, status: number, error: string) {
  return new Response(JSON.stringify({ error }), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}

/** Authorize every explicit calendar with the verified actor before privileged work. */
export async function authorizeICalSync(req: Request, cors: Record<string, string>) {
  const auth = await requireAuth(req, cors);
  if (auth instanceof Response) return auth;
  let body: unknown;
  try { body = await req.json(); } catch { return rejectSync(cors, 400, 'Invalid JSON'); }
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => key !== 'calendar_ids')) {
    return rejectSync(cors, 400, 'Expected explicit calendar_ids');
  }
  const ids = (body as { calendar_ids?: unknown }).calendar_ids;
  if (!Array.isArray(ids) || !ids.length || ids.length > MAX_CALENDARS || ids.some(id => typeof id !== 'string' || !UUID.test(id))) {
    return rejectSync(cors, 400, 'Expected 1 to 50 calendar UUIDs');
  }
  const calendarIds = [...new Set(ids as string[])];
  const actor = createActorClient(req);
  const { data: calendars, error, count } = await actor.from('property_external_calendars')
    .select('id,property_id,owner_id,name,ical_url,is_active', { count: 'exact' })
    .in('id', calendarIds).eq('is_active', true);
  // Missing, inaccessible, inactive and truncated selections all fail closed.
  if (error || !Array.isArray(calendars) || count !== calendarIds.length || calendars.length !== calendarIds.length ||
      new Set(calendars.map(calendar => calendar.id)).size !== calendarIds.length ||
      calendars.some(calendar => !calendarIds.includes(calendar.id))) {
    return rejectSync(cors, 403, 'Forbidden calendar scope');
  }
  for (const calendar of calendars) {
    const { data: property, error: propertyError } = await actor.from('properties')
      .select('id,owner_id,management_company_id').eq('id', calendar.property_id).maybeSingle();
    if (propertyError || !property?.owner_id || property.owner_id !== calendar.owner_id) {
      return rejectSync(cors, 403, 'Forbidden calendar scope');
    }
    if (property.owner_id === auth.user.id) continue;
    if (!property.management_company_id) return rejectSync(cors, 403, 'Forbidden calendar scope');
    const { data: permitted, error: permissionError } = await actor.rpc('actor_can_operate_property', {
      p_property_id: property.id, p_company_id: property.management_company_id, p_module: 'bookings', p_action: 'edit',
    });
    if (permissionError || permitted !== true) return rejectSync(cors, 403, 'Forbidden calendar scope');
  }
  return { calendars, userId: auth.user.id };
}
