import { cleanup, render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { InboxRequestDetail } from './InboxRequestDetail';
import { INBOX_SOURCES } from '@/lib/adminInbox';
const state = vi.hoisted(() => ({ actor: 'admin-a', admin: true, read: vi.fn() }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: state.actor } }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/hooks/useIsAdmin', () => ({ useIsAdmin: () => ({ isAdmin: state.admin, isLoading: false, error: null }) }));
vi.mock('@/lib/adminInbox', async importOriginal => ({ ...await importOriginal<typeof import('@/lib/adminInbox')>(), fetchInboxRequest: (...args: unknown[]) => state.read(...args) }));
const id = '11111111-1111-4111-8111-111111111111';
let client: QueryClient;
beforeEach(() => { state.admin = true; state.actor = 'admin-a'; state.read.mockReset().mockResolvedValue({ id, message: 'Exact selected message', name: 'Selected person' }); client = new QueryClient({ defaultOptions: { queries: { retry: false } } }); });
afterEach(() => { cleanup(); client.clear(); });
const detail = (source: string, requestId = id) => <QueryClientProvider client={client}><InboxRequestDetail source={source} requestId={requestId} onClose={() => {}} /></QueryClientProvider>;
it.each(INBOX_SOURCES)('opens the chosen %s record independently of queue rows', async source => {
  render(detail(source)); await waitFor(() => expect(state.read).toHaveBeenCalledWith(source, id));
  await waitFor(() => expect(client.getQueryData(['admin-inbox-request', 'admin-a', source, id])).toMatchObject({ id }));
});
it('does not fetch invalid links or unknown sources', () => { render(detail('orders')); expect(screen.getByRole('alert')).toHaveTextContent('Invalid'); expect(state.read).not.toHaveBeenCalled(); });
it('does not fetch for a non-admin', () => { state.admin = false; render(detail('nb_leads')); expect(screen.getByRole('alert')).toHaveTextContent('not authorized'); expect(state.read).not.toHaveBeenCalled(); });
it('removes former actor data when admission is revoked', async () => {
  const view = render(detail('property_inquiries')); await screen.findByText('Exact selected message');
  state.actor = 'other-user'; state.admin = false; view.rerender(detail('property_inquiries'));
  expect(screen.queryByText('Exact selected message')).toBeNull(); expect(state.read).toHaveBeenCalledTimes(1);
});
it('reports missing records and preserves retry for read failures', async () => {
  state.read.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(null);
  render(detail('nb_leads')); await screen.findByText('Could not load request.'); fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  await screen.findByText('Request not found or unavailable.');
});