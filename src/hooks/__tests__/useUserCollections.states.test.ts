import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useUserCollections } from '@/hooks/useUserCollections';

const mocks = vi.hoisted(() => ({
  auth: { user: { id: 'guest-a' } },
  read: vi.fn(),
}));

vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => mocks.auth }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/lib/errorHandler', () => ({ createErrorHandler: () => ({ silent: vi.fn() }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: (_key: string, actorId: string) => ({
          order: () => mocks.read(actorId),
        }),
      }),
    }),
  },
}));

function savedFor(actorId: string) {
  return {
    data: [{
      id: 'saved-' + actorId,
      user_id: actorId,
      item_type: 'property',
      item_id: 'property-' + actorId,
      item_data: null,
      created_at: '2026-11-24T06:00:00Z',
    }],
    error: null,
  };
}

describe('useUserCollections read states', () => {
  beforeEach(() => {
    mocks.auth.user = { id: 'guest-a' };
    mocks.read.mockReset();
  });

  it('reports a failed read separately from an empty collection and recovers on retry', async () => {
    mocks.read
      .mockResolvedValueOnce({ data: null, error: new Error('unavailable') })
      .mockResolvedValueOnce({ data: [], error: null });
    const { result } = renderHook(() => useUserCollections());

    await waitFor(() => expect(result.current.loadFailed).toBe(true));
    expect(result.current.favorites).toEqual([]);

    await act(async () => result.current.refetch());
    expect(result.current.loading).toBe(false);
    expect(result.current.loadFailed).toBe(false);
    expect(result.current.favorites).toEqual([]);
  });

  it('ignores a late response after a different guest signs in', async () => {
    let resolveEarlier!: (value: ReturnType<typeof savedFor>) => void;
    const earlier = new Promise<ReturnType<typeof savedFor>>(resolve => { resolveEarlier = resolve; });
    mocks.read
      .mockReturnValueOnce(earlier)
      .mockResolvedValueOnce(savedFor('guest-b'));
    const { result, rerender } = renderHook(() => useUserCollections());
    await waitFor(() => expect(mocks.read).toHaveBeenCalledWith('guest-a'));

    mocks.auth.user = { id: 'guest-b' };
    rerender();
    await waitFor(() => expect(result.current.favorites[0]?.user_id).toBe('guest-b'));

    await act(async () => { resolveEarlier(savedFor('guest-a')); });
    expect(result.current.favorites.map(item => item.user_id)).toEqual(['guest-b']);
    expect(result.current.loadFailed).toBe(false);
  });
});
