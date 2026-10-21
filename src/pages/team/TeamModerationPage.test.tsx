import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import TeamModerationPage from './TeamModerationPage';
const state = vi.hoisted(() => ({ page: vi.fn(), counts: vi.fn(), review: vi.fn() }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'synthetic-reviewer' } }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/components/team/TeamLayout', () => ({ TeamLayout: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
vi.mock('@/lib/teamModeration', () => ({ TEAM_MODERATION_PAGE_SIZE: 50, fetchTeamModerationPage: (...args: unknown[]) => state.page(...args), fetchTeamModerationCounts: () => state.counts(), reviewTeamModerationItem: (...args: unknown[]) => state.review(...args) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const clients: QueryClient[] = [];
const mount = () => { const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } }); clients.push(client); render(<QueryClientProvider client={client}><TeamModerationPage /></QueryClientProvider>); };
beforeEach(() => { vi.clearAllMocks(); state.page.mockResolvedValue({ items: [], total: 151 }); state.counts.mockResolvedValue({ pending: 151, approved: 8, rejected: 2 }); state.review.mockResolvedValue({ id: 'one', status: 'approved' }); });
afterEach(() => { cleanup(); clients.splice(0).forEach(client => client.clear()); });
it('requests selected status pages beyond100 and resets page on a status change', async () => {
  mount(); await waitFor(() => expect(state.page).toHaveBeenCalledWith('pending', 0));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled());
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  await waitFor(() => expect(state.page).toHaveBeenCalledWith('pending', 1));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled());
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  await waitFor(() => expect(state.page).toHaveBeenCalledWith('pending', 2));
  fireEvent.mouseDown(screen.getByRole('tab', { name: 'Approved' }));
  await waitFor(() => expect(state.page).toHaveBeenCalledWith('approved', 0));
});
it('shows retry and unknown counts on failure rather than an empty queue', async () => {
  state.page.mockRejectedValue(new Error('offline')); state.counts.mockResolvedValue({ pending: null, approved: null, rejected: null });
  mount(); await screen.findByRole('alert');
  expect(screen.queryByText('Queue is empty')).toBeNull();
  expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  await waitFor(() => expect(state.page.mock.calls.length).toBeGreaterThan(1));
});
it('submits the displayed pending revision and waits for the canonical writer', async () => {
  state.page.mockResolvedValue({ items: [{ id: 'one', title: 'Synthetic pending review', status: 'pending', updated_at: 'revision', created_at: '2026-10-20', item_type: 'listing' }], total: 1 });
  mount(); await screen.findByText('Synthetic pending review');
  fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
  await waitFor(() => expect(state.review).toHaveBeenCalledWith(expect.objectContaining({ id: 'one', status: 'approved', expectedUpdatedAt: 'revision' }), expect.anything()));
});
