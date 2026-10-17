import { z } from 'npm:zod@3';
import { requireAuth } from '../_shared/auth-guard.ts';
import { requireInternalSecret } from '../_shared/internal-secret.ts';
import { createActorClient, AccessDenied } from '../_shared/operating-space-auth.ts';

const Body = z.object({ immediate_order_id: z.string().uuid().optional() }).strict();

/** Preserve secret scheduler; interactive dispatch requires stored property booking-edit authority. */
export async function authorizeBookingMessages(req: Request, cors: Record<string, string>, body: unknown) {
 const parsed = Body.safeParse(body);
 if (!parsed.success) return new Response(JSON.stringify({ error: 'Invalid notification request' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
 const secretGuard = requireInternalSecret(req, cors);
 if (!secretGuard) return { immediateOrderId: parsed.data.immediate_order_id };
 if (!parsed.data.immediate_order_id) return secretGuard;
 const auth = await requireAuth(req, cors);
 if (auth instanceof Response) return auth;
 const actor = createActorClient(req);
 const { data: admin, error: adminError } = await actor.rpc('actor_has_platform_admin');
 if (adminError) throw new AccessDenied('Forbidden');
 const orderQuery = actor.from('orders').select('id').eq('id', parsed.data.immediate_order_id)
  .eq('vertical', 'property').eq('status', 'confirmed').is('deleted_at', null);
 const { data, error } = await orderQuery.maybeSingle();
 if (error || !data) throw new AccessDenied('Forbidden');
 if (admin !== true) {
  const { data: items, error: itemsError } = await actor.from('order_items').select('resource_id')
   .eq('order_id', data.id).eq('item_type', 'property');
  if (itemsError || !items?.length) throw new AccessDenied('Forbidden');
  for (const item of items) {
   if (!item.resource_id) throw new AccessDenied('Forbidden');
   const { data: property, error: propertyError } = await actor.from('properties')
    .select('id,management_company_id').eq('id', item.resource_id).maybeSingle();
   if (propertyError || !property?.management_company_id) throw new AccessDenied('Forbidden');
   const { data: permitted, error: permissionError } = await actor.rpc('actor_can_operate_property', {
    p_property_id: property.id, p_company_id: property.management_company_id, p_module: 'bookings', p_action: 'edit',
   });
   if (permissionError || permitted !== true) throw new AccessDenied('Forbidden');
  }
 }
 return { immediateOrderId: parsed.data.immediate_order_id };
}