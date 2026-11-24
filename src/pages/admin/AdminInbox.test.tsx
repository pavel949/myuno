import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import AdminInbox from './AdminInbox';
const read = vi.hoisted(() => vi.fn());
const access = vi.hoisted(() => ({ admin: true, user: 'synthetic-admin' }));
vi.mock('@/hooks/useIsAdmin', () => ({ useIsAdmin: () => ({ isAdmin: access.admin, isLoading: false, error: null }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: access.user } }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
vi.mock('@/components/page/PageShell', () => ({ PageShell: ({ children }: { children: React.ReactNode }) => <section>{children}</section> }));
vi.mock('@/lib/adminInbox', async importOriginal => ({ ...await importOriginal<typeof import('@/lib/adminInbox')>(), fetchInbox: (...args: unknown[]) => read(...args) }));
vi.mock('@/components/admin/InboxRequestDetail', () => ({ InboxRequestDetail: () => null }));
const clients: QueryClient[] = [];
function ReadLocation() {
  const location = useLocation();
  const navigate = useNavigate();
  return <><output data-testid="queue-url">{location.pathname}{location.search}{location.hash}</output><button onClick={() => navigate(-1)}>Back fixture</button></>;
}
const tree = (client: QueryClient, entries: string[]) => <QueryClientProvider client={client}>
  <MemoryRouter initialEntries={entries}><AdminInbox /><ReadLocation /></MemoryRouter>
</QueryClientProvider>;
const mount = (entries = ['/admin/inbox']) => { const client = new QueryClient({ defaultOptions: { queries: { retry: false } } }); clients.push(client); const view = render(tree(client, entries)); return { client, rerender: () => view.rerender(tree(client, entries)) }; };
beforeEach(() => { access.admin = true; access.user = 'synthetic-admin'; read.mockReset(); read.mockResolvedValue({ items: [], total: 501 }); });
afterEach(() => { cleanup(); clients.splice(0).forEach(client => client.clear()); });
it('keeps each application source on its own server-filtered page', async () => {
  mount(); await waitFor(() => expect(read).toHaveBeenCalledWith('help_requests', 0, 'new', ''));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled());
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  await waitFor(() => expect(read).toHaveBeenCalledWith('help_requests', 1, 'new', ''));
  fireEvent.click(screen.getByRole('button', { name: 'Consults' }));
  await waitFor(() => expect(read).toHaveBeenCalledWith('consultation_requests', 0, 'new', ''));
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Alice' } });
  await waitFor(() => expect(read).toHaveBeenCalledWith('consultation_requests', 0, 'new', 'Alice'));
}, 15000);
it('shows source read failure and retry rather than false zero or empty', async () => {
  read.mockRejectedValue(new Error('denied'));
  mount(); await screen.findByText('Failed to load inbox.');
  expect(screen.queryByText('Nothing here - no items match the filters.')).toBeNull();
  expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  await waitFor(() => expect(read.mock.calls.length).toBeGreaterThan(1));
});
it('labels domain statuses under All and advertises only source-supported search fields', async () => {
  read.mockImplementation(async (_source, _page, status) => ({ total: status === 'all' ? 1 : 0, items: status === 'all' ? [{ id: 'one', source: 'partner_applications', status: 'other', rawStatus: 'approved', createdAt: '2026-01-01T00:00:00Z', title: 'Approved partner', contact: null, subtitle: null, href: '/admin/partner-applications' }] : [] }));
  mount();
  fireEvent.click(screen.getByRole('button', { name: 'Partners' }));
  expect(screen.getByRole('searchbox')).toHaveAttribute('placeholder', 'Business, name, email, category');
  fireEvent.click(screen.getByRole('tab', { name: /^All/ }));
  expect(await screen.findByText('Other status: approved')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Newbuilds' }));
  expect(screen.getByRole('searchbox')).toHaveAttribute('placeholder', 'Name, email, phone');
});

it('never reads the queue without the admitted administrator role', () => { access.admin = false; mount(); expect(read).not.toHaveBeenCalled(); });

it('discards legacy contact links and debounces authorized server search without copying the term into URLs or cache keys', async () => {
  const { client } = mount(['/admin/inbox?status=all', '/admin/inbox?source=partner_applications&page=2&q=obsolete%40example.invalid#queue']);
  await waitFor(() => expect(screen.getByTestId('queue-url')).toHaveTextContent('?source=partner_applications&page=2#queue'));
  expect(screen.getByRole('searchbox')).toHaveValue('');
  expect(read.mock.calls.every(call => call[3] !== 'obsolete@example.invalid')).toBe(true);
  const input = screen.getByRole('searchbox');
  const latest = 'private-contact@example.invalid';
  read.mockImplementation(async (source, _page, _status, term) => ({
    total: term === latest ? 1 : 0,
    items: term === latest ? [{ id: 'one', source, status: 'new', rawStatus: 'new', createdAt: '2026-01-01T00:00:00Z', title: 'Matched request', contact: null, subtitle: null, href: '/admin/inbox?source=partner_applications&request=one' }] : [],
  }));
  fireEvent.change(input, { target: { value: 'private-contact@' } });
  fireEvent.change(input, { target: { value: latest } });
  expect(read.mock.calls.some(call => call[3] === latest)).toBe(false);
  await waitFor(() => expect(read).toHaveBeenCalledWith('partner_applications', 0, 'new', latest));
  expect(read.mock.calls.some(call => call[3] === 'private-contact@')).toBe(false);
  const link = await screen.findByRole('link', { name: /Matched request/ });
  expect(link.getAttribute('href')).not.toContain('q=');
  expect(screen.getByTestId('queue-url')).not.toHaveTextContent(/private-contact|q=/);
  expect(JSON.stringify(client.getQueryCache().getAll().map(q => q.queryKey))).not.toContain(latest);
  fireEvent.click(screen.getByRole('button', { name: 'Back fixture' }));
  expect(screen.getByTestId('queue-url')).toHaveTextContent('?status=all');
});
it('never replays a pending query for another admitted administrator', async () => {
  const { rerender } = mount();
  const term = 'first-account@example.invalid';
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: term } });
  access.user = 'second-synthetic-admin';
  rerender();
  expect(screen.getByRole('searchbox')).toHaveValue('');
  await waitFor(() => expect(read.mock.calls.filter(call => call[3] === '')).toHaveLength(2));
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 350)); });
  expect(read.mock.calls.some(call => call[3] === term)).toBe(false);
});
it('moves tab focus and selection with the keyboard and names the result panel', async () => {
  mount();
  const selected = screen.getByRole('tab', { name: /^New/ });
  selected.focus();
  fireEvent.keyDown(selected, { key: 'ArrowRight' });
  const target = screen.getByRole('tab', { name: /^In progress/ });
  expect(target).toHaveFocus();
  expect(target).toHaveAttribute('aria-selected', 'true');
  expect(selected).toHaveAttribute('tabindex', '-1');
  expect(screen.getByRole('tabpanel', { name: /^In progress/ })).toBeVisible();
  await waitFor(() => expect(read).toHaveBeenCalledWith('help_requests', 0, 'in_progress', ''));
});
