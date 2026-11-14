import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ from: vi.fn(), queryCalls: [] as unknown[][] }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: mocks.from, auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) } },
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import { usePublicListings } from './useUserListings';

describe('usePublicListings publication contract', () => {
  beforeEach(() => {
    mocks.from.mockReset();
    mocks.queryCalls.length = 0;
    mocks.from.mockImplementation(() => {
      const query = new Proxy({}, {
        get: (_, method) => method === 'then'
          ? (resolve: (value: unknown) => unknown) => Promise.resolve({ data: [], error: null }).then(resolve)
          : (...args: unknown[]) => { mocks.queryCalls.push([method, ...args]); return query; },
      });
      return query;
    });
  });

  it('requests only active listings that are moderation approved', async () => {
    renderHook(() => usePublicListings());
    await waitFor(() => expect(mocks.from).toHaveBeenCalledWith('user_listings'));

    expect(mocks.queryCalls).toContainEqual(['eq', 'moderation_status', 'approved']);
    expect(mocks.queryCalls).toContainEqual(['eq', 'status', 'active']);
    expect(mocks.queryCalls).not.toContainEqual(['in', 'status', ['active', 'pending']]);
  });
});
