import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { mountedRoutes } from '../../../scripts/qa/content-route-inventory.mjs';
import Support from '@/pages/Support';
import MyTickets from './MyTickets';
import { APP_ROUTES } from '@/lib/config/routes';

const state = vi.hoisted(() => ({
  user: null as { id: string } | null,
  authLoading: false,
  language: 'en',
  isError: false,
  isLoading: false,
  isFetching: false,
  refetch: vi.fn(),
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: state.user, isLoading: state.authLoading }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/hooks/useTickets', () => ({
  useTickets: () => ({
    tickets: [], isLoading: state.isLoading, isError: state.isError,
    isFetching: state.isFetching, refetch: state.refetch,
  }),
}));
vi.mock('@/hooks/useChat', () => ({ useSupportChat: () => ({}), UNO_WHATSAPP: '0000000000' }));
vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children }: { children: ReactNode }) => <main>{children}</main> }));
vi.mock('@/components/uno/PageHeader', () => ({ PageHeader: ({ title }: { title: string }) => <h1>{title}</h1> }));
vi.mock('@/components/ui/voice-input-button', () => ({ VoiceInputButton: () => null, appendTranscript: vi.fn() }));
vi.mock('@/components/uno/LoadingSpinner', () => ({ LoadingSpinner: () => <div role="status">Loading</div> }));

function mount(path: string) {
  return render(<MemoryRouter initialEntries={[path]}>
    <Routes>
      <Route path={APP_ROUTES.SUPPORT} element={<Support />} />
      <Route path={APP_ROUTES.SUPPORT_TICKETS} element={<MyTickets />} />
    </Routes>
  </MemoryRouter>);
}

beforeEach(() => {
  state.user = null;
  state.authLoading = false;
  state.language = 'en';
  state.isError = false;
  state.isLoading = false;
  state.isFetching = false;
  state.refetch.mockReset();
});
afterEach(cleanup);

describe('Support ticket discovery and access', () => {
  it.each([
    ['en', 'My support tickets'],
    ['ru', 'Мои обращения'],
    ['th', 'คำร้องขอความช่วยเหลือของฉัน'],
  ])('opens the existing ticket list without another intake in %s', (language, title) => {
    state.user = { id: 'synthetic-user' };
    state.language = language;
    mount(APP_ROUTES.SUPPORT);
    const link = screen.getByRole('link', { name: title });
    expect(link).toHaveAttribute('href', APP_ROUTES.SUPPORT_TICKETS);
    fireEvent.click(link);
    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
  });

  it('keeps WhatsApp available to visitors without showing account history', () => {
    mount(APP_ROUTES.SUPPORT);
    expect(screen.queryByRole('link', { name: 'My support tickets' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open WhatsApp' })).toBeInTheDocument();
  });

  it('preserves full return URL for a guest following a ticket-list bookmark', () => {
    const bookmark = APP_ROUTES.SUPPORT_TICKETS + '?view=closed#requests';
    mount(bookmark);
    const link = screen.getByRole('link', { name: 'Sign in' });
    const auth = new URL(link.getAttribute('href')!, 'https://myuno.invalid');
    expect(auth.pathname).toBe('/auth');
    expect(auth.searchParams.get('redirect')).toBe(bookmark);
    expect(screen.queryByRole('button', { name: 'New Ticket' })).not.toBeInTheDocument();
    expect(screen.queryByText('No active tickets')).not.toBeInTheDocument();
  });

  it('does not mistake pending authentication for signed-out or empty', () => {
    state.authLoading = true;
    mount(APP_ROUTES.SUPPORT_TICKETS);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Sign in' })).not.toBeInTheDocument();
    expect(screen.queryByText('No active tickets')).not.toBeInTheDocument();
  });

  it('offers retry on read failure rather than claiming a verified empty list', () => {
    state.user = { id: 'synthetic-user' };
    state.isError = true;
    mount(APP_ROUTES.SUPPORT_TICKETS);
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load support tickets');
    expect(screen.queryByText('No active tickets')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(state.refetch).toHaveBeenCalledOnce();
  });

  it('preserves the published legacy paths and the existing support pages', () => {
    const routes = mountedRoutes();
    expect(routes.filter(route => route.path === '/new-developments')).toMatchObject([
      { element: expect.stringContaining('CanonicalPublicRedirect to={APP_ROUTES.NEWBUILDS}') },
    ]);
    expect(routes.filter(route => route.path === '/property/map')).toMatchObject([
      { element: expect.stringContaining("PropertySearchRedirect defaults={{ view: 'map' }}") },
    ]);
    expect(routes.filter(route => [
      APP_ROUTES.SUPPORT, APP_ROUTES.SUPPORT_NEW_TICKET, APP_ROUTES.SUPPORT_TICKETS,
      APP_ROUTES.SUPPORT_TICKET_DETAIL(':ticketId'),
    ].some(path => path === route.path))).toHaveLength(4);
  });
});
