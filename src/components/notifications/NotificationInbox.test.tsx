import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import { NotificationInbox } from './NotificationInbox';
import type { NotificationItemData } from './NotificationItem';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: 'en', t: (key: string) => key }),
}));

const common = { body: 'An account update', created_at: '2026-01-01T12:00:00Z', is_read: false };
const notifications: NotificationItemData[] = [
  { ...common, id: 'trip-notice', title: 'Trip update', type: 'status', data: { action_url: '/trip/example-trip' } },
  { ...common, id: 'order-notice', title: 'Order update', type: 'order', data: { order_id: 'example-order' } },
  { ...common, id: 'other-notice', title: 'Account notice', type: 'message', data: { action_url: '//elsewhere.example/account' } },
];

function showInbox(onMarkAllRead = vi.fn().mockResolvedValue(true)) {
  const onMarkRead = vi.fn();
  render(
    <MemoryRouter>
      <Routes>
        <Route
          path="/"
          element={(
            <NotificationInbox
              notifications={notifications}
              isLoading={false}
              unreadCount={3}
              onMarkRead={onMarkRead}
              onMarkAllRead={onMarkAllRead}
              onDelete={vi.fn()}
            />
          )}
        />
        <Route path="/trip/example-trip" element={<h1>Trip page</h1>} />
      </Routes>
    </MemoryRouter>,
  );
  return { onMarkRead, onMarkAllRead };
}

it('groups recorded trip and order links and opens an exact trip through a native link', async () => {
  const { onMarkRead } = showInbox();
  expect(within(screen.getByRole('region', { name: 'Orders' })).getByRole('link', { name: 'Order update' }))
    .toHaveAttribute('href', '/orders/example-order/tracking');
  expect(screen.getByRole('region', { name: 'Updates' })).toHaveTextContent('Account notice');
  expect(screen.queryByRole('link', { name: 'Account notice' })).toBeNull();
  fireEvent.click(within(screen.getByRole('region', { name: 'Trips and bookings' })).getByRole('link', { name: 'Trip update' }));
  expect(await screen.findByRole('heading', { name: 'Trip page' })).toBeVisible();
  expect(onMarkRead).toHaveBeenCalledWith('trip-notice');
});

it('keeps the status filter available for a grouped trip update', () => {
  showInbox();
  fireEvent.click(screen.getByRole('button', { name: /^Status/ }));
  expect(screen.getByRole('button', { name: /^Status/ })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('link', { name: 'Trip update' })).toHaveAttribute('href', '/trip/example-trip');
  expect(screen.queryByRole('link', { name: 'Order update' })).toBeNull();
});

it('shows a failed bulk read update and lets the user retry', async () => {
  const write = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
  showInbox(write);
  const markAll = screen.getByRole('button', { name: 'Mark all read' });
  fireEvent.click(markAll);
  expect(await screen.findByRole('alert')).toHaveTextContent('Could not mark all notifications as read');
  fireEvent.click(markAll);
  await waitFor(() => {
    expect(write).toHaveBeenCalledTimes(2);
    expect(markAll).toBeEnabled();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
