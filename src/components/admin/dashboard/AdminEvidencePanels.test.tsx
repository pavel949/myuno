import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminRevenueBlock } from './AdminRevenueBlock';
import { GoLiveChecklist } from '../GoLiveChecklist';
import { useAdminDashboardSnapshots, useAdminPlatformStatus } from '@/hooks/useAdminDashboardEvidence';

const state = vi.hoisted(() => ({ language: 'en', refetch: vi.fn() }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/hooks/useAdminDashboardEvidence', () => ({ useAdminDashboardSnapshots: vi.fn(), useAdminPlatformStatus: vi.fn() }));
vi.mock('@/hooks/useHapticFeedback', () => ({ triggerHaptic: vi.fn() }));
vi.mock('@/hooks/useSoundEffects', () => ({ playSound: vi.fn() }));
const snapshots = () => ({ data: { coverage: 0, complete: false, gmv: null, platformRevenue: null, completedBookings: null }, period: { days: 7, from: '2026-10-13', through: '2026-10-19', dates: [] }, isLoading: false, isError: false, isFetching: false, dataUpdatedAt: 0, refetch: state.refetch });
const health = (): Partial<ReturnType<typeof useAdminPlatformStatus>> => ({ data: [{ key: 'stripe_mode', status: 'configured' }, { key: 'admin_emails', status: 'unknown' }, { key: 'verticals', status: 'unknown' }], isLoading: false, isError: false, isFetching: false, dataUpdatedAt: 0, refetch: state.refetch });
beforeEach(() => {
  vi.clearAllMocks(); state.language = 'en';
  vi.mocked(useAdminDashboardSnapshots, { partial: true }).mockReturnValue(snapshots());
  vi.mocked(useAdminPlatformStatus, { partial: true }).mockReturnValue(health());
});
afterEach(() => { cleanup(); vi.useRealTimers(); });
const mount = (element: React.ReactNode) => render(<MemoryRouter>{element}</MemoryRouter>);

describe('dashboard period metrics', () => {
  it('keeps absent snapshots unavailable, with separate labelled metrics and actual period controls', () => {
    mount(<AdminRevenueBlock />);
    expect(screen.getAllByText('—')).toHaveLength(3);
    expect(screen.getByRole('status')).toHaveTextContent('Unavailable');
    expect(screen.getByRole('note')).toHaveTextContent('not ledger-confirmed');
    expect(screen.queryByText(/฿0|\+0%/)).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox', { name: 'Period' }), { target: { value: '30' } });
    expect(useAdminDashboardSnapshots).toHaveBeenLastCalledWith(30);
    expect(screen.getByRole('link', { name: /Open reports/ })).toHaveAttribute('href', '/admin/finance');
  });
  it('does not retain successful amounts as current after a refetch error', () => {
    vi.mocked(useAdminDashboardSnapshots, { partial: true }).mockReturnValue({ ...snapshots(), data: { coverage: 7, complete: true, gmv: 123, platformRevenue: 7, completedBookings: 2 }, isError: true });
    mount(<AdminRevenueBlock />);
    expect(screen.getByRole('alert')).toHaveTextContent('unavailable');
    expect(screen.getAllByText('—')).toHaveLength(3);
    expect(screen.queryByText('123')).not.toBeInTheDocument();
  });
  it('keeps each metric distinct and omits unrelated growth', () => {
    vi.mocked(useAdminDashboardSnapshots, { partial: true }).mockReturnValue({ ...snapshots(), data: { coverage: 7, complete: true, gmv: 120, platformRevenue: 7, completedBookings: 2 } });
    mount(<AdminRevenueBlock />);
    expect(screen.getByText('120')).toBeVisible();
    expect(screen.getByText('7')).toBeVisible();
    expect(screen.getByText('2')).toBeVisible();
    expect(screen.queryByText(/growth/i)).not.toBeInTheDocument();
  });
  it('ages cached evidence visibly while the screen remains open', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-20T12:00:00Z'));
    vi.mocked(useAdminDashboardSnapshots, { partial: true }).mockReturnValue({ ...snapshots(), dataUpdatedAt: Date.now() });
    vi.mocked(useAdminPlatformStatus, { partial: true }).mockReturnValue({ ...health(), dataUpdatedAt: Date.now() });
    mount(<><GoLiveChecklist /><AdminRevenueBlock /></>);
    expect(screen.queryByText(/Stale check/)).not.toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(70_000); });
    expect(screen.getByText(/Stale check/)).toBeVisible();
    expect(screen.getByText(/Stale snapshot read/)).toBeVisible();
  });
});

describe.each(['en', 'ru', 'th'])('platform evidence (%s)', language => {
  it('retains a compact status panel and never treats configured as delivery verified', () => {
    state.language = language;
    mount(<GoLiveChecklist />);
    const card = screen.getByTestId('platform-status');
    expect(within(card).getAllByRole('term').length).toBeGreaterThan(0);
    expect(within(card).getByRole('link')).toHaveAttribute('href', '/admin/settings');
    expect(card.textContent).not.toContain('Go-Live');
    fireEvent.click(within(card).getByRole('button'));
    expect(state.refetch).toHaveBeenCalledTimes(1);
  });
});
