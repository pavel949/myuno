import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AdminDashboard from '../AdminDashboard';
import type { DashboardStats } from '@/hooks/useAdminDashboardStats';

const mocks = vi.hoisted(() => ({
  roles: [{ role: 'admin' }], checking: false,
  stats: vi.fn(), invalidate: vi.fn(async () => {}),
}));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/hooks/useUserRoles', () => ({ useUserRoles: () => ({ roles: mocks.roles, isLoading: mocks.checking }) }));
vi.mock('@/hooks/useAdminDashboardStats', () => ({ useAdminDashboardStats: mocks.stats }));
vi.mock('@tanstack/react-query', async original => ({ ...await original<typeof import('@tanstack/react-query')>(),
  useQueryClient: () => ({ invalidateQueries: mocks.invalidate }), useIsFetching: () => 0,
}));
vi.mock('@/components/admin/AdminStaffOverview', () => ({ AdminStaffOverview: () => <p>Existing staff workspace</p> }));
vi.mock('@/components/admin/GoLiveChecklist', () => ({ GoLiveChecklist: () => <section>Platform status fixture boundary</section> }));
vi.mock('@/components/admin/dashboard/AdminRevenueBlock', () => ({ AdminRevenueBlock: () => <section>Period analytics fixture boundary</section> }));
vi.mock('@/hooks/useHapticFeedback', () => ({ triggerHaptic: vi.fn() }));
vi.mock('@/hooks/useSoundEffects', () => ({ playSound: vi.fn(), isTypingKey: () => false }));

function stats() {
  return { pendingContent: 3, pendingListings: 2, pendingProperties: 1, pendingOrders: 1, pendingOrders24h: 1,
    pendingProviders: 4, openTickets: 1, openDisputes: 0, pendingManualPayments: 0, pendingPartnerApplications: 0,
    sourceErrors: {}, sourceUpdatedAt: { pendingOrders: Date.now() }, ordersCreatedBefore: '2026-10-19T00:00:00.000Z' } as DashboardStats;
}
const mount = () => render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><AdminDashboard /></MemoryRouter>);
beforeEach(() => { vi.clearAllMocks(); mocks.roles = [{ role: 'admin' }]; mocks.checking = false; mocks.stats.mockReturnValue({ data: stats(), isLoading: false, isError: false, isFetching: false }); });
afterEach(cleanup);

describe('platform Today workspace', () => {
  it('uses available admin width and only functional queue search/add actions', () => {
    mount();
    expect(screen.getByRole('heading', { name: 'Today' }).closest('.max-w-full')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Add property' })).toHaveAttribute('href', '/admin/properties?action=new');
    expect(screen.getByRole('link', { name: 'Add service' })).toHaveAttribute('href', '/admin/services?action=new');
    const search = screen.getByRole('textbox', { name: 'Find a work queue' });
    fireEvent.change(search, { target: { value: 'Support' } });
    expect(document.querySelector('[data-queue="pendingContent"]')).not.toBeInTheDocument();
    expect(document.querySelector('[data-queue="openTickets"]')).toBeInTheDocument();
    fireEvent.keyDown(search, { key: 'Escape' });
    expect(search).toHaveValue('');
    expect(document.querySelector('[data-queue="pendingContent"]')).toBeInTheDocument();
  });
  it('keeps unavailable source and stale freshness explicit without discarding other queues', () => {
    const data = stats(); data.openTickets = null; data.sourceErrors.openTickets = 'unavailable'; data.sourceUpdatedAt.pendingOrders = Date.now() - 120000;
    mocks.stats.mockReturnValue({ data, isLoading: false });
    mount();
    expect(screen.getByRole('alert')).toHaveTextContent('Some sources are unavailable');
    expect(screen.getByTestId('dashboard-freshness')).toHaveTextContent('Stale');
    expect(document.querySelector('[data-queue="openTickets"] [data-count-state="unavailable"]')).toHaveTextContent('Unavailable');
    expect(document.querySelector('[data-queue="pendingOrders"]')).toHaveTextContent('1');
  });
  it('coalesces repeated refresh clicks into one invalidation flight', async () => {
    let release!: () => void;
    const pending = new Promise<void>(resolve => { release = resolve; });
    mocks.invalidate.mockReturnValue(pending);
    mount();
    const refresh = screen.getByRole('button', { name: 'Refresh' });
    fireEvent.click(refresh); fireEvent.click(refresh);
    expect(mocks.invalidate.mock.calls.map(call => call[0])).toEqual([
      { queryKey: ['admin-dashboard-stats'] }, { queryKey: ['admin-dashboard'] },
    ]);
    await act(async () => { release(); await pending; });
    fireEvent.click(refresh);
    expect(mocks.invalidate).toHaveBeenCalledTimes(4);
  });
  it.each(['staff', 'uno_team'])('preserves %s workspace without mounting platform reads', role => {
    mocks.roles = [{ role }]; mount();
    expect(screen.getByText('Existing staff workspace')).toBeInTheDocument();
    expect(mocks.stats).not.toHaveBeenCalled();
  });
  it('does not mount platform reads before role resolution or for missing permission', () => {
    mocks.checking = true; mount();
    expect(screen.getByRole('status')).toHaveTextContent('Checking access');
    expect(mocks.stats).not.toHaveBeenCalled();
    cleanup(); mocks.checking = false; mocks.roles = []; mount();
    expect(screen.getByRole('alert')).toHaveTextContent('administrator access is required');
    expect(mocks.stats).not.toHaveBeenCalled();
  });
});
