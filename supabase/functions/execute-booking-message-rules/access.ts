import { z } from 'npm:zod@3';
import { requireAuth } from '../_shared/auth-guard.ts';
import { requireInternalSecret } from '../_shared/internal-secret.ts';
import { createActorClient, AccessDenied } from '../_shared/operating-space-auth.ts';

const Body = z.object({ immediate_order_id: z.string().uuid().optional() }).strict();

/** Preserve secret scheduler and the existing actor-created order path; never infer company-wide send rights. */
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
 let orderQuery = actor.from('orders').select('id').eq('id', parsed.data.immediate_order_id)
  .eq('vertical', 'property').eq('status', 'confirmed').is('deleted_at', null);
 if (admin !== true) orderQuery = orderQuery.eq('customer_user_id', auth.user.id);
 const { data, error } = await orderQuery.maybeSingle();
 if (error || !data) throw new AccessDenied('Forbidden');
 return { immediateOrderId: parsed.data.immediate_order_id };
}