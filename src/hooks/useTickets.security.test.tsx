import type { PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultQueryClientOptions } from '@/lib/queryConfig';
import { useTickets, type SupportTicket } from './useTickets';

type TicketSummary = Pick<SupportTicket, 'id' | 'user_id'>;
type ReadResult = {
  data: TicketSummary[] | null;
  error: { code: string; message: string } | null;
};

// Keep the real hook and QueryClient. Only account context and the read boundary
// are synthetic; these tests make no network calls or server/RLS assertions.
const mock = vi.hoisted(() => ({
  user: null as { id: string } | null,
  read: vi.fn<(userId: string) => Promise<ReadResult>>(),
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
}));

vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: mock.user }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mock.from } }));

const firstUser = 'synthetic-account-first';
const secondUser = 'synthetic-account-second';
const key = (userId: string) => ['user-tickets', userId];
const row = (userId: string) => ({ id: 'ticket-' + userId, user_id: userId });

function mount() {
  const queryClient = new QueryClient({
    defaultOptions: {
      ...defaultQueryClientOptions,
      queries: { ...defaultQueryClientOptions.queries, retry: false },
    },
  });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { ...renderHook(() => useTickets(), { wrapper }), queryClient };
}

beforeEach(() => {
  vi.resetAllMocks();
  mock.user = null;
  mock.from.mockReturnValue({ select: mock.select });
  mock.select.mockReturnValue({ eq: mock.eq });
  mock.eq.mockImplementation((_field: string, userId: string) => ({
    order: (...args: unknown[]) => {
      mock.order(...args);
      return mock.read(userId);
    },
  }));
  mock.read.mockImplementation(async userId => ({ data: [row(userId)], error: null }));
});

afterEach(cleanup);

describe('Support ticket history actor isolation', () => {
  it('does not read while signed out and stops exposing cached rows on sign-out', async () => {
    const { result, rerender, queryClient } = mount();
    expect(result.current.tickets).toEqual([]);
    expect(result.current.isFetching).toBe(false);
    expect(mock.from).not.toHaveBeenCalled();

    mock.user = { id: firstUser };
    rerender();
    await waitFor(() => expect(result.current.tickets).toEqual([row(firstUser)]));
    expect(mock.from).toHaveBeenCalledExactlyOnceWith('support_tickets');
    expect(mock.eq).toHaveBeenCalledExactlyOnceWith('user_id', firstUser);
    expect(mock.order).toHaveBeenCalledExactlyOnceWith('created_at', { ascending: false });

    mock.user = null;
    rerender();
    expect(result.current.tickets).toEqual([]);
    expect(result.current.isFetching).toBe(false);
    expect(queryClient.getQueryData(key(firstUser))).toEqual([row(firstUser)]);
    expect(mock.from).toHaveBeenCalledTimes(1);
  });

  it('keeps an older in-flight response isolated after switching accounts', async () => {
    let completeFirst!: (result: ReadResult) => void;
    const pendingFirst = new Promise<ReadResult>(resolve => { completeFirst = resolve; });
    mock.read.mockReturnValueOnce(pendingFirst);
    mock.user = { id: firstUser };
    const { result, rerender, queryClient } = mount();
    await waitFor(() => expect(mock.read).toHaveBeenCalledExactlyOnceWith(firstUser));

    mock.user = { id: secondUser };
    rerender();
    await waitFor(() => expect(result.current.tickets).toEqual([row(secondUser)]));
    expect(mock.eq.mock.calls).toEqual([['user_id', firstUser], ['user_id', secondUser]]);

    await act(async () => completeFirst({ data: [row(firstUser)], error: null }));
    await waitFor(() => expect(queryClient.getQueryData(key(firstUser))).toEqual([row(firstUser)]));
    expect(queryClient.getQueryData(key(secondUser))).toEqual([row(secondUser)]);
    expect(result.current.tickets).toEqual([row(secondUser)]);
  });

  it('reports a denied scoped read instead of reusing history from the prior account', async () => {
    const denied = { code: '42501', message: 'Synthetic access denied' };
    mock.read.mockImplementation(async userId => userId === secondUser
      ? { data: null, error: denied }
      : { data: [row(firstUser)], error: null });
    mock.user = { id: firstUser };
    const { result, rerender, queryClient } = mount();
    await waitFor(() => expect(result.current.tickets).toEqual([row(firstUser)]));

    mock.user = { id: secondUser };
    rerender();
    expect(result.current.tickets).toEqual([]);
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.tickets).toEqual([]);
    expect(queryClient.getQueryState(key(secondUser))?.error).toEqual(denied);
    expect(mock.eq.mock.calls).toEqual([['user_id', firstUser], ['user_id', secondUser]]);
  });
});
