import { beforeEach, expect, it, vi } from 'vitest';
const client = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: client }));
import { readPropertyOrderHold } from '../propertyOrderHold';
beforeEach(() => vi.clearAllMocks());
it('preserves the exact checked read contract and strict boolean outcome', async () => {
  client.rpc.mockResolvedValue({ data: true, error: null });
  expect(await readPropertyOrderHold('synthetic-order')).toEqual({ data: true, error: null });
  expect(client.rpc).toHaveBeenCalledWith('property_order_has_active_hold', { p_order_id: 'synthetic-order' });
});
it('does not turn denied or absent hold evidence into success', async () => {
  client.rpc.mockResolvedValue({ data: null, error: { code: '42501' } });
  expect(await readPropertyOrderHold('synthetic-order')).toEqual({ data: null, error: { code: '42501' } });
});