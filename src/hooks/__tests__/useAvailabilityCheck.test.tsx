import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useAvailabilityCheck } from '../useAvailabilityCheck';

const rpc = vi.hoisted(() => vi.fn());
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc } }));

describe('yacht availability response', () => {
  const start = new Date('2026-11-21T09:00:00+07:00');
  const end = new Date('2026-11-21T13:00:00+07:00');

  it.each([null, {}, { available: 'true' }])('does not consider incomplete data %j an available slot', async data => {
    rpc.mockResolvedValueOnce({ data, error: null });
    const { result } = renderHook(useAvailabilityCheck);
    await act(async () => {
      expect(await result.current.checkYachtAvailability('yacht', start, end)).toMatchObject({ available: false, error: expect.any(String) });
    });
  });

  it('accepts an explicit boolean response and sends the exact interval', async () => {
    rpc.mockResolvedValueOnce({ data: { available: true }, error: null });
    const { result } = renderHook(useAvailabilityCheck);
    await act(async () => {
      expect(await result.current.checkYachtAvailability('yacht', start, end)).toMatchObject({ available: true });
    });
    expect(rpc).toHaveBeenLastCalledWith('check_availability', expect.objectContaining({
      p_entity_id: 'yacht', p_start_datetime: '2026-11-21T02:00:00.000Z', p_end_datetime: '2026-11-21T06:00:00.000Z',
    }));
  });
});
