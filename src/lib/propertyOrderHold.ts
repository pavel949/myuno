import { supabase } from '@/integrations/supabase/client';
import type { PostgrestError } from '@supabase/supabase-js';

/** Additive source RPC contract, pending managed type regeneration; same client. */
type HoldRpc = (name: 'property_order_has_active_hold', args: { p_order_id: string }) => PromiseLike<{
  data: boolean | null;
  error: PostgrestError | null;
}>;

export function readPropertyOrderHold(orderId: string) {
  const rpc = supabase.rpc.bind(supabase) as unknown as HoldRpc;
  return rpc('property_order_has_active_hold', { p_order_id: orderId });
}