import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import OwnerChatRoom from '@/pages/owner/OwnerChatRoom';

const boundary = vi.hoisted(() => ({
  actor: 'actor-a',
  users: {
    'actor-a': { id: 'actor-a' },
    'actor-b': { id: 'actor-b' },
  },
  from: vi.fn(),
  channel: vi.fn(),
  removeChannel: vi.fn(),
}));
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: boundary.users[boundary.actor as keyof typeof boundary.users] }),
}));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/hooks/usePropertyCare', () => ({ useOwnerProperty: () => ({ data: undefined }) }));
vi.mock('@/hooks/useChatModeration', () => ({ useChatModeration: () => ({ isDelegated: false }) }));
vi.mock('@/components/chat/QuickReplies', () => ({ QuickReplies: () => null }));
vi.mock('@/components/chat/ChatMessageTranslation', () => ({ ChatMessageTranslation: () => null }));
vi.mock('@/components/ui/voice-input-button', () => ({ VoiceInputButton: () => null }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: boundary.from, channel: boundary.channel, removeChannel: boundary.removeChannel },
}));

const booking = {
  id: 'synthetic-stay', property_id: 'synthetic-home', owner_id: 'actor-a',
  guest_name: 'Synthetic guest', check_in: '2030-01-10', check_out: '2030-01-12',
  guests_count: 2, status: 'confirmed', properties: { title: 'Synthetic home' },
};
const priorMessage = {
  id: 'synthetic-message', property_id: booking.property_id, booking_id: booking.id,
  sender_id: 'synthetic-guest', sender_name: 'Synthetic guest', sender_type: 'guest',
  message: 'Actor A synthetic transcript marker', attachments: null, is_read: true,
  created_at: '2030-01-10T06:00:00Z',
};

const nativeScroll = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollIntoView');
afterEach(() => {
  cleanup();
  if (nativeScroll) Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', nativeScroll);
  else Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
});

it('keeps the actual transcript and composer behind the current actor’s verified booking', async () => {
  boundary.actor = 'actor-a';
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { value: () => {}, configurable: true });
  const ownership = vi.fn();
  const transcript = vi.fn();
  let finishTransition: (result: { data: null; error: null }) => void = () => {};
  boundary.from.mockImplementation((table: string) => {
    const filters: Record<string, string> = {};
    const recordRead = () => {
      ownership({ ...filters });
      return filters.owner_id === 'actor-a' && filters.id === booking.id
        ? Promise.resolve({ data: booking, error: null })
        : new Promise(resolve => { finishTransition = resolve; });
    };
    const query = {
      select: () => query,
      order: () => query,
      eq: (column: string, value: string) => { filters[column] = value; return query; },
      maybeSingle: recordRead,
      single: recordRead,
      then: (resolve: (result: { data: typeof priorMessage[]; error: null }) => unknown) => {
        if (table !== 'property_chat_messages') throw new Error('Unexpected unscoped fixture read');
        transcript({ ...filters });
        return Promise.resolve({ data: [priorMessage], error: null }).then(resolve);
      },
    };
    if (!['property_bookings', 'property_chat_messages'].includes(table)) throw new Error('Unexpected fixture table');
    return query; // No write methods or real transport exist in this fixture.
  });
  const listener = { on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() };
  boundary.channel.mockReturnValue(listener);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const tree = () => <QueryClientProvider client={client}>
    <MemoryRouter initialEntries={[`/mc/chat/booking/${booking.id}`]}>
      <Routes><Route path="/mc/chat/:type/:id" element={<OwnerChatRoom />} /></Routes>
    </MemoryRouter>
  </QueryClientProvider>;
  const view = render(tree());
  expect(await screen.findByText(priorMessage.message)).toBeVisible();
  const composer = screen.getByRole('textbox');
  fireEvent.change(composer, { target: { value: 'Actor A unsent draft' } });
  expect(composer).toHaveValue('Actor A unsent draft');
  expect(ownership.mock.calls).toEqual([
    [{ id: booking.id, owner_id: 'actor-a' }],
    [{ id: booking.id, owner_id: 'actor-a' }],
  ]);
  expect(transcript.mock.calls).toEqual([[{ booking_id: booking.id }]]);
  expect(client.getQueryData(['property-chat', 'actor-a', booking.property_id, booking.id])).toEqual([priorMessage]);
  const subscriptions = boundary.channel.mock.calls.length;
  expect(subscriptions).toBeGreaterThan(0);

  boundary.actor = 'actor-b';
  view.rerender(tree());
  expect(screen.getByRole('status')).toHaveTextContent('Checking booking access');
  expect(screen.queryByText(priorMessage.message)).not.toBeInTheDocument();
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Send' })).not.toBeInTheDocument();
  expect(ownership).toHaveBeenLastCalledWith({ id: booking.id, owner_id: 'actor-b' });
  expect(boundary.removeChannel).toHaveBeenCalledWith(listener);

  await act(async () => { finishTransition({ data: null, error: null }); });
  expect(await screen.findByRole('alert')).toHaveTextContent('Booking conversation unavailable');
  expect(screen.queryByText(priorMessage.message)).not.toBeInTheDocument();
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  expect(transcript).toHaveBeenCalledTimes(1);
  expect(boundary.channel).toHaveBeenCalledTimes(subscriptions);
  expect(client.getQueryData(['property-chat', 'actor-b', booking.property_id, booking.id])).toBeUndefined();
});
