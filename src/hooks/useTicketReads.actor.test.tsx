import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTicketDetail, useTicketMessages } from './useTickets';
const state = vi.hoisted(() => ({ user: { id: 'actor-a' } as { id: string } | null,
  options: [] as { enabled: boolean; queryKey: unknown[]; queryFn: () => Promise<unknown> }[], error: false, missingMessages: false,
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: state.user }) }));
vi.mock('@tanstack/react-query', () => ({ useQuery: (options: typeof state.options[number]) => {
  state.options.push(options); return { data: [{ id: 'private-cached-record' }], isError: state.error };
} }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => {
  const query = { select: () => query, eq: () => query,
    maybeSingle: async () => ({ data: null, error: null }),
    order: async () => ({ data: state.missingMessages ? null : [], error: null }) };
  return query;
} } }));
beforeEach(() => { state.user = { id: 'actor-a' }; state.options = []; state.error = false; state.missingMessages = false; });
describe('support read cache isolation', () => {
  it('reports an absent ticket as not found rather than a failed connection', async () => {
    renderHook(() => useTicketDetail('missing-ticket'));
    await expect(state.options[0].queryFn()).resolves.toBeNull();
  });
  it('separates a confirmed empty conversation from an unavailable response', async () => {
    renderHook(() => useTicketMessages('ticket-a'));
    await expect(state.options[0].queryFn()).resolves.toEqual([]);
    state.missingMessages = true;
    await expect(state.options[0].queryFn()).rejects.toThrow('Support conversation unavailable');
  });
  it('binds detail and conversation keys to both the exact object and current actor, preserving invalidation prefixes', () => {
    const { rerender } = renderHook(() => { useTicketDetail('ticket-a'); useTicketMessages('ticket-a'); });
    expect(state.options.map(option => option.queryKey)).toEqual([
      ['ticket-detail', 'ticket-a', 'actor-a'], ['ticket-messages', 'ticket-a', 'actor-a'],
    ]);
    state.user = { id: 'actor-b' }; rerender();
    expect(state.options.slice(2).map(option => option.queryKey)).toEqual([
      ['ticket-detail', 'ticket-a', 'actor-b'], ['ticket-messages', 'ticket-a', 'actor-b'],
    ]);
  });
  it('disables signed-out reads and hides cached private records', () => {
    state.user = null;
    const { result } = renderHook(() => [useTicketDetail('ticket-a'), useTicketMessages('ticket-a')]);
    expect(state.options.every(option => !option.enabled)).toBe(true);
    expect(result.current.every(query => query.data === undefined)).toBe(true);
  });
  it('does not retain stale successful data as current after a failed refresh', () => {
    state.error = true;
    const { result } = renderHook(() => [useTicketDetail('ticket-a'), useTicketMessages('ticket-a')]);
    expect(result.current.every(query => query.data === undefined)).toBe(true);
  });
});
