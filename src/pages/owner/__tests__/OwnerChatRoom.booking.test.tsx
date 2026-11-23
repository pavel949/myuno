import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import OwnerChatRoom from '../OwnerChatRoom';

const fixture = vi.hoisted(() => ({
  result: vi.fn(),
  eq: vi.fn(),
  from: vi.fn(),
  chat: vi.fn(),
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'actor-a' } }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/hooks/usePropertyCare', () => ({ useOwnerProperty: () => ({ data: undefined }) }));
vi.mock('@/components/owner/PropertyChatWindow', () => ({
  PropertyChatWindow: (props: { bookingId?: string; propertyId?: string }) => {
    fixture.chat(props);
    return <section aria-label="Synthetic composer">{props.bookingId}</section>;
  },
}));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: fixture.from } }));

const booking = {
  id: 'inventory-a', owner_id: 'actor-a', property_id: 'home-a', guest_name: 'Synthetic guest',
  check_in: '2030-01-10', check_out: '2030-01-12', guests_count: 2, total_amount: 6500,
  currency: 'THB', status: 'confirmed', properties: { title: 'Synthetic home' },
};

function openChat(pathname: string, state?: { bookingChatReturnTo: string }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[{ pathname, state }]}>
    <Routes>
      <Route path="/mc/chat/:type/:id?" element={<OwnerChatRoom />} />
      <Route path="/mc/messages" element={<p>Inbox destination</p>} />
      <Route path="/mc/today" element={<p>Today destination</p>} />
    </Routes>
  </MemoryRouter></QueryClientProvider>);
}

beforeEach(() => {
  vi.clearAllMocks();
  const builder = { select: vi.fn(), eq: fixture.eq, maybeSingle: fixture.result };
  builder.select.mockReturnValue(builder);
  fixture.eq.mockReturnValue(builder);
  fixture.from.mockReturnValue(builder);
  fixture.result.mockResolvedValue({ data: booking, error: null });
});
afterEach(cleanup);

describe('MC booking conversation (no outbound transport)', () => {
  it('opens only after the actor-owned inventory booking has been verified and returns to Today', async () => {
    openChat('/mc/chat/booking/inventory-a', { bookingChatReturnTo: '/mc/today?keep=yes#today-arrivals' });
    expect(screen.getByRole('status')).toHaveTextContent('Checking booking access');
    expect(fixture.chat).not.toHaveBeenCalled();
    expect(await screen.findByRole('region', { name: 'Synthetic composer' })).toHaveTextContent('inventory-a');
    expect(fixture.eq.mock.calls).toEqual([['id', 'inventory-a'], ['owner_id', 'actor-a']]);
    expect(fixture.chat.mock.calls[0][0]).toMatchObject({ bookingId: 'inventory-a', propertyId: 'home-a' });
    expect(screen.getByText('Confirmed')).toBeVisible();
    expect(screen.getByText(/Booking total/)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(await screen.findByText('Today destination')).toBeVisible();
  });

  it.each([undefined, { bookingChatReturnTo: '//example.test' }, { bookingChatReturnTo: '/mc/today-other' }])(
    'supports direct URLs and rejects an unrelated return route (%j)', async state => {
      openChat('/mc/chat/booking/inventory-a', state);
      await screen.findByRole('region', { name: 'Synthetic composer' });
      fireEvent.click(screen.getByRole('button', { name: 'Back' }));
      expect(await screen.findByText('Inbox destination')).toBeVisible();
    },
  );

  it.each([
    { data: null, error: null },
    { data: { ...booking, id: 'not-the-requested-id' }, error: null },
    { data: { ...booking, owner_id: 'other-actor' }, error: null },
    { data: { ...booking, property_id: null }, error: null },
    { data: null, error: new Error('Synthetic restriction') },
  ])('never mounts a composer for an absent or unauthorized booking (%j)', async result => {
    fixture.result.mockResolvedValue(result);
    openChat('/mc/chat/booking/inventory-a');
    expect(await screen.findByRole('alert')).toHaveTextContent('Booking conversation unavailable');
    expect(fixture.chat).not.toHaveBeenCalled();
  });

  it('does not query or mount chat when the booking ID is missing', () => {
    openChat('/mc/chat/booking');
    expect(screen.getByRole('alert')).toHaveTextContent('Booking conversation unavailable');
    expect(fixture.from).not.toHaveBeenCalled();
    expect(fixture.chat).not.toHaveBeenCalled();
  });
});
