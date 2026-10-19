import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HomeTopBar } from '../HomeTopBar';

type NotificationResponse = { data: { id: string; is_read: boolean }[] | null; error: Error | null };
const state = vi.hoisted(() => ({
  user: { id: 'account-a', user_metadata: { full_name: 'Example Person' } } as { id: string; user_metadata: { full_name: string } } | null,
  language: 'en',
  from: vi.fn(),
  channel: vi.fn(),
  removeChannel: vi.fn(),
  read: vi.fn<(userId: string) => Promise<NotificationResponse>>(),
  writes: vi.fn(),
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: state.user }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: state.from, channel: state.channel, removeChannel: state.removeChannel } }));

function Location() { return <output aria-label="Current route">{useLocation().pathname}</output>; }
const wrapper = ({ children }: { children: React.ReactNode }) => <MemoryRouter>{children}<Location /></MemoryRouter>;
const props = { personas: [], onRoleSheetOpen: vi.fn() };

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  state.user = { id: 'account-a', user_metadata: { full_name: 'Example Person' } };
  state.language = 'en';
  state.read.mockReset().mockResolvedValue({ data: [], error: null });
  state.from.mockImplementation(() => {
    let userId = '';
    const query = {
      select: () => query,
      eq: (_column: string, id: string) => { userId = id; return query; },
      order: () => query,
      limit: () => state.read(userId),
      update: state.writes,
      delete: state.writes,
      insert: state.writes,
    };
    return query;
  });
  state.channel.mockImplementation(() => {
    const channel = { on: () => channel, subscribe: () => channel };
    return channel;
  });
});

describe('home notification source', () => {
  it('uses in-app unread notifications and opening the inbox does not write data', async () => {
    state.read.mockResolvedValue({ data: [{ id: 'notification-1', is_read: false }], error: null });
    render(<HomeTopBar {...props} />, { wrapper });
    const bell = await screen.findByRole('button', { name: 'Notifications — unread items' });
    expect(state.from.mock.calls).toEqual([['notifications']]);
    expect(state.read).toHaveBeenCalledWith('account-a');
    expect(bell).toHaveClass('w-11', 'h-11');
    fireEvent.click(bell);
    expect(screen.getByLabelText('Current route')).toHaveTextContent('/notifications');
    expect(state.writes).not.toHaveBeenCalled();
  });

  it('does not treat read notifications as unread', async () => {
    state.read.mockResolvedValue({ data: [{ id: 'notification-1', is_read: true }], error: null });
    render(<HomeTopBar {...props} />, { wrapper });
    await act(async () => {});
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /unread items/ })).not.toBeInTheDocument();
  });

  it('keeps failed notification reads neutral rather than claiming all clear', async () => {
    state.read.mockResolvedValue({ data: null, error: new Error('unavailable') });
    render(<HomeTopBar {...props} />, { wrapper });
    await act(async () => {});
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
    expect(screen.queryByText(/all clear|no notifications/i)).not.toBeInTheDocument();
  });

  it('clears the prior account badge immediately while the next account loads', async () => {
    state.read.mockResolvedValue({ data: [{ id: 'notification-1', is_read: false }], error: null });
    const { rerender } = render(<HomeTopBar {...props} />, { wrapper });
    await screen.findByRole('button', { name: 'Notifications — unread items' });
    state.read.mockImplementation(() => new Promise(() => {}));
    state.user = { id: 'account-b', user_metadata: { full_name: 'Second Person' } };
    rerender(<HomeTopBar {...props} />);
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
    expect(state.removeChannel).toHaveBeenCalledOnce();
    expect(state.read).toHaveBeenLastCalledWith('account-b');
    state.user = null;
    rerender(<HomeTopBar {...props} />);
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
    expect(state.read).toHaveBeenCalledTimes(2);
  });

  it('does not read private notifications for a guest', async () => {
    state.user = null;
    render(<HomeTopBar {...props} />, { wrapper });
    await act(async () => {});
    expect(state.from).not.toHaveBeenCalled();
    expect(state.channel).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
  });

  it.each([
    ['ru', 'Уведомления — есть непрочитанные'],
    ['en', 'Notifications — unread items'],
    ['th', 'การแจ้งเตือน มีรายการที่ยังไม่ได้อ่าน'],
  ])('localizes the real unread state in %s', async (language, label) => {
    state.language = language;
    state.read.mockResolvedValue({ data: [{ id: 'notification-1', is_read: false }], error: null });
    render(<HomeTopBar {...props} variant="onNavy" />, { wrapper });
    await waitFor(() => expect(screen.getByRole('button', { name: label })).toBeInTheDocument());
  });
});
