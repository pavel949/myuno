import { requireAuth } from './auth-guard.ts';
import { requireInternalSecret } from './internal-secret.ts';
import { createActorClient, AccessDenied } from './operating-space-auth.ts';

/** Browser resend is customer-bound; status broadcasts are privileged internal/admin work. */
export async function authorizeOrderEmail(req: Request, cors: Record<string,string>, input: {
  order_id?: string; user_id?: string; type?: string;
}, statusBroadcast = false): Promise<Response | null> {
  if (requireInternalSecret(req, cors) === null) return null;
  const auth = await requireAuth(req, cors);
  if (auth instanceof Response) return auth;
  const actor = createActorClient(req);
  if (statusBroadcast) {
    const { data, error } = await actor.rpc('has_role', { _user_id: auth.user.id, _role: 'admin' });
    if (error || data !== true) throw new AccessDenied('Forbidden');
    return null;
  }
  if (!input.order_id || input.user_id !== auth.user.id || input.type === 'wallet_topup') throw new AccessDenied('Forbidden');
  const { data: order, error } = await actor.from('orders').select('id,customer_user_id,status')
    .eq('id',input.order_id).eq('customer_user_id',auth.user.id).maybeSingle();
  if (error || !order) throw new AccessDenied('Forbidden');
  if (input.type === 'order_confirmation' && !['confirmed','in_progress','completed','checked_in','checked_out'].includes(order.status)) throw new AccessDenied('Forbidden');
  if (input.type === 'order_cancellation' && !['cancelled','refunded'].includes(order.status)) throw new AccessDenied('Forbidden');
  return null;
}