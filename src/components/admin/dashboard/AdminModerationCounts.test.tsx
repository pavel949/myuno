import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminOperationalAlerts } from './AdminOperationalAlerts';
import { AdminWorkQueues } from './AdminWorkQueues';
import { DashboardCount, dashboardCountState } from './DashboardCount';
import type { DashboardStats } from '@/hooks/useAdminDashboardStats';

const state = vi.hoisted(() => ({ data: undefined as DashboardStats | undefined, language: 'en', loading: false }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/hooks/useAdminDashboardStats', () => ({ useAdminDashboardStats: () => ({ data: state.data, isLoading: state.loading }) }));
vi.mock('@/hooks/useHapticFeedback', () => ({ triggerHaptic: vi.fn() }));
vi.mock('@/hooks/useSoundEffects', () => ({ playSound: vi.fn() }));
function data(count: number | null): DashboardStats {
  return { pendingContent: count, pendingListings: count === null ? 240 : 240, pendingProperties: count === null ? null : 8,
    pendingOrders: 0, pendingOrders24h: 0, pendingManualPayments: 0, openTickets: 0, openDisputes: 0, pendingProviders: 0,
    pendingPartnerApplications: 0, sourceUpdatedAt: { pendingContent: Date.now() }, sourceErrors: count === null ? { pendingProperties: 'unavailable', pendingContent: 'unavailable' } : {},
    ordersCreatedBefore: '2026-10-19T00:00:00.000Z',
  } as DashboardStats;
}
const mount = (node: React.ReactNode) => render(<MemoryRouter>{node}</MemoryRouter>);
beforeEach(() => { state.data = data(null); state.language = 'en'; state.loading = false; });
afterEach(cleanup);

describe('task-first dashboard source truthfulness', () => {
  it('keeps a failed moderation source explicit and links to each exact source', () => {
    mount(<AdminWorkQueues data={state.data} loading={false} />);
    const card = document.querySelector('[data-queue="pendingContent"]') as HTMLElement;
    expect(within(card).getAllByText('Unavailable')).toHaveLength(2);
    expect(within(card).getByRole('link', { name: /Listings:/ })).toHaveAttribute('href', '/admin/operations?tab=moderation&type=listing');
    expect(within(card).getByRole('link', { name: /Properties:/ })).toHaveAttribute('href', '/admin/operations?tab=moderation&type=property');
    expect(within(card).getByRole('link', { name: /Listings:/ })).toHaveTextContent('240');
  });
  it('does not sum overlapping work queues or use count thresholds as red priority', () => {
    state.data = data(248); state.data.pendingOrders24h = 5;
    mount(<><AdminOperationalAlerts /><AdminWorkQueues data={state.data} loading={false} /></>);
    expect(screen.queryByText('253')).not.toBeInTheDocument();
    expect(screen.getByText('Queues overlap and are not summed as unique tasks.')).toBeInTheDocument();
    const decision = document.querySelector('[data-decision="pendingOrders24h"]') as HTMLElement;
    expect(within(decision).getByRole('link', { name: 'Review' })).toHaveAttribute('href', '/admin/operations?tab=bookings&status=pending&created_before=2026-10-19T00%3A00%3A00.000Z');
    expect(within(decision).getByText('Pending status; payment state is not inferred')).toBeInTheDocument();
    expect(decision.className).not.toMatch(/destructive/);
  });
  it('only shows an empty decision state when all observed decision counts are verified zero', () => {
    mount(<AdminOperationalAlerts />);
    expect(screen.getByText('No items in these decision queues.')).toBeInTheDocument();
    cleanup(); state.data!.openTickets = null;
    mount(<AdminOperationalAlerts />);
    expect(screen.queryByText('No items in these decision queues.')).not.toBeInTheDocument();
    expect(screen.getByText('Unavailable')).toBeInTheDocument();
  });
  it.each([['ru', 'Недоступно'], ['th', 'ไม่พร้อมใช้งาน']])('localizes unknown source in %s', (language, unavailable) => {
    state.language = language;
    mount(<DashboardCount data={state.data} countKey="pendingContent" />);
    expect(screen.getByText(unavailable)).toBeInTheDocument();
  });
  it('distinguishes loading, empty, stale and failed readings', () => {
    const now = Date.now();
    expect(dashboardCountState(undefined, 'pendingContent', true, now)).toBe('loading');
    expect(dashboardCountState(data(null), 'pendingContent', false, now)).toBe('unavailable');
    const available = data(0); available.sourceUpdatedAt.pendingContent = now;
    expect(dashboardCountState(available, 'pendingContent', false, now)).toBe('empty');
    expect(dashboardCountState(available, 'pendingContent', false, now + 60001)).toBe('stale');
  });
});
