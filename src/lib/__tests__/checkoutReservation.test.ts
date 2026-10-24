import { expect, it, vi } from 'vitest';
import { reserveCheckout } from '../../../supabase/functions/create-checkout/reservation';

it.each([{ data: null, error: new Error('missing RPC') }, { data: null, error: null },
 { data: { version: 1, order_id: 'foreign', intent_id: 'intent', amount: 100, currency: 'THB' }, error: null },
 { data: { version: 1, order_id: 'order', intent_id: null, amount: 100, currency: 'THB' }, error: null }])('does not call a provider without a canonical persisted reservation %j', async result => {
 const provider = vi.fn(); const rpc = vi.fn().mockResolvedValue(result);
 const checkout = async () => { const reserved = await reserveCheckout({ rpc }, 'order', 'actor'); return provider(reserved); };
 await expect(checkout()).rejects.toThrow('checkout_reservation_not_confirmed'); expect(provider).not.toHaveBeenCalled();
 expect(rpc).toHaveBeenCalledWith('reserve_customer_order_checkout', { p_order_id: 'order', p_actor_id: 'actor' });
});
it('uses only server reservation amount and keeps the reservation after provider uncertainty', async () => {
 const rpc = vi.fn().mockResolvedValue({ error: null, data: { version: 1, order_id: 'order', intent_id: 'intent', amount: 100, currency: 'THB' } });
 const reserved = await reserveCheckout({ rpc }, 'order', 'actor');
 expect(reserved).toEqual({ intentId: 'intent', amount: 100, currency: 'THB' });
 const provider = vi.fn().mockRejectedValue(new Error('uncertain provider outcome'));
 await expect(provider(reserved)).rejects.toThrow('uncertain provider outcome');
 expect(rpc).toHaveBeenCalledOnce(); // no release/delete command on uncertainty
});
