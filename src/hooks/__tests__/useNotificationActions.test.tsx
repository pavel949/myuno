import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { useNotificationActions, type Notification } from '../useNotificationActions';

const state = vi.hoisted(() => ({
  actor: null as string | null,
  select: vi.fn(),
  read: vi.fn(),
  update: vi.fn(),
  removeChannel: vi.fn(),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: state.actor ? { id: state.actor } : null }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({ select: state.select, update: state.update }),
    channel: () => {
      const channel = { on: vi.fn(), subscribe: vi.fn() };
      channel.on.mockReturnValue(channel);
      channel.subscribe.mockReturnValue(channel);
      return channel;
    },
    removeChannel: state.removeChannel,
  },
}));

const notification = (id: string): Notification => ({
  id,
  title: `Notification ${id}`,
  body: 'A test notification',
  type: 'booking',
  data: null,
  is_read: false,
  created_at: '2026-01-01T12:00:00Z',
});

function renderNotifications() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return renderHook(useNotificationActions, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  state.actor = 'account-a';
  state.select.mockReturnValue({
    eq: (_field: string, actorId: string) => ({
      order: () => ({ limit: () => state.read(actorId) }),
    }),
  });
});

it('keeps an earlier signed-in account’s delayed read out of the current inbox', async () => {
  let resolveFirstRead: (value: { data: Notification[]; error: null }) => void;
  const firstRead = new Promise<{ data: Notification[]; error: null }>(resolve => { resolveFirstRead = resolve; });
  state.read.mockImplementation((actorId: string) => actorId === 'account-a'
    ? firstRead
    : Promise.resolve({ data: [notification('current')], error: null }));
  const { result, rerender } = renderNotifications();
  await waitFor(() => expect(state.read).toHaveBeenCalledWith('account-a'));

  state.actor = 'account-b';
  rerender();
  await waitFor(() => expect(result.current.notifications.map(item => item.id)).toEqual(['current']));
  await act(async () => resolveFirstRead({ data: [notification('late')], error: null }));
  expect(result.current.notifications.map(item => item.id)).toEqual(['current']);
  expect(result.current.unreadCount).toBe(1);
  expect(state.removeChannel).toHaveBeenCalled();
});

it('exposes a failed read and recovers when the same account retries', async () => {
  state.read
    .mockResolvedValueOnce({ data: null, error: new Error('Read failed') })
    .mockResolvedValueOnce({ data: [notification('recovered')], error: null });
  const { result } = renderNotifications();
  await waitFor(() => expect(result.current.isError).toBe(true));

  await act(async () => result.current.refresh());
  await waitFor(() => {
    expect(result.current.isError).toBe(false);
    expect(result.current.notifications.map(item => item.id)).toEqual(['recovered']);
  });
  expect(state.read).toHaveBeenCalledTimes(2);
});
