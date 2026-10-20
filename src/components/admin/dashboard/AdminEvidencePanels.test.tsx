import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminRevenueBlock } from './AdminRevenueBlock';
import { GoLiveChecklist } from '../GoLiveChecklist';
import { useAdminDashboardSnapshots, useAdminPlatformStatus } from '@/hooks/useAdminDashboardEvidence';
import { dashboardSnapshotResult, platformStatusResult } from '@/test/adminDashboardEvidenceMocks';

const state = vi.hoisted(() => ({ language: 'en' }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/hooks/useAdminDashboardEvidence', () => ({ useAdminDashboardSnapshots: vi.fn(), useAdminPlatformStatus: vi.fn() }));
vi.mock('@/hooks/useHapticFeedback', () => ({ triggerHaptic: vi.fn() }));
vi.mock('@/hooks/useSoundEffects', () => ({ playSound: vi.fn() }));
beforeEach(() => {
  vi.clearAllMocks(); state.language = 'en';
  vi.mocked(useAdminDashboardSnapshots).mockReturnValue(dashboardSnapshotResult());
  vi.mocked(useAdminPlatformStatus).mockReturnValue(platformStatusResult());
});
afterEach(() => { cleanup(); vi.useRealTimers(); });
const mount = (element: React.ReactNode) => render(<MemoryRouter>{element}</MemoryRouter>);

describe('dashboard period metrics', () => {
  it.each([
    ['en', 'How metrics are calculated', 'Currency is unavailable'],
    ['ru', 'Как считаются показатели', 'Валюта не указана'],
    ['th', 'วิธีคำนวณตัวชี้วัด', 'ไม่มีข้อมูลสกุลเงิน'],
  ])('keeps essential uncertainty visible and calculation details expandable in %s', (language, summary, currency) => {
    state.language = language;
    mount(<AdminRevenueBlock />);
    expect(screen.getByRole('note')).toBeVisible();
    expect(screen.getByRole('note')).toHaveTextContent(currency);
    const calculation = screen.getByText(/platform_metrics/);
    expect(calculation).not.toBeVisible();
    const disclosure = screen.getByText(summary);
    fireEvent.click(disclosure);
    expect(calculation).toBeVisible();
    expect(calculation).toHaveTextContent('ledger');
    expect(calculation).toHaveTextContent('platform_revenue');
    fireEvent.click(disclosure);
    expect(calculation).not.toBeVisible();
    expect(screen.getByRole('note')).toBeVisible();
  });
  it('keeps absent snapshots unavailable, with separate labelled metrics and actual period controls', () => {
    mount(<AdminRevenueBlock />);
    expect(screen.getAllByText('—')).toHaveLength(3);
    expect(screen.getByRole('status')).toHaveTextContent('Unavailable');
    const essential = screen.getByRole('note');
    expect(essential).toBeVisible();
    expect(essential).toHaveTextContent('Amounts are estimates');
    expect(essential).toHaveTextContent('Currency is unavailable');
    expect(essential).toHaveTextContent('missing days are not zero');
    expect(essential).not.toHaveTextContent('platform_metrics');
    const calculation = screen.getByText(/Source: platform_metrics/);
    expect(calculation).not.toBeVisible();
    const disclosure = screen.getByText('How metrics are calculated');
    expect(disclosure.tagName).toBe('SUMMARY');
    expect(disclosure.parentElement?.tagName).toBe('DETAILS');
    fireEvent.click(disclosure);
    expect(disclosure.parentElement).toHaveAttribute('open');
    expect(calculation).toBeVisible();
    expect(calculation).toHaveTextContent('not ledger-confirmed');
    expect(calculation).toHaveTextContent('Subscription snapshots are excluded');
    expect(screen.queryByText(/฿0|\+0%/)).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox', { name: 'Period' }), { target: { value: '30' } });
    expect(useAdminDashboardSnapshots).toHaveBeenLastCalledWith(30);
    expect(screen.getByRole('link', { name: /Open reports/ })).toHaveAttribute('href', '/admin/finance');
  });
  it('does not retain successful amounts as current after a refetch error', () => {
    vi.mocked(useAdminDashboardSnapshots).mockReturnValue(dashboardSnapshotResult({ coverage: 7, complete: true, gmv: 123, platformRevenue: 7, completedBookings: 2 }, { error: new Error('synthetic refresh failure') }));
    mount(<AdminRevenueBlock />);
    expect(screen.getByRole('alert')).toHaveTextContent('unavailable');
    expect(screen.getAllByText('—')).toHaveLength(3);
    expect(screen.queryByText('123')).not.toBeInTheDocument();
  });
  it('keeps each metric distinct and omits unrelated growth', () => {
    vi.mocked(useAdminDashboardSnapshots).mockReturnValue(dashboardSnapshotResult({ coverage: 7, complete: true, gmv: 120, platformRevenue: 7, completedBookings: 2 }));
    mount(<AdminRevenueBlock />);
    expect(screen.getByText('120')).toBeVisible();
    expect(screen.getByText('7')).toBeVisible();
    expect(screen.getByText('2')).toBeVisible();
    expect(screen.queryByText(/growth/i)).not.toBeInTheDocument();
  });
  it('ages cached evidence visibly while the screen remains open', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-20T12:00:00Z'));
    vi.mocked(useAdminDashboardSnapshots).mockReturnValue(dashboardSnapshotResult(undefined, { updatedAt: Date.now() }));
    vi.mocked(useAdminPlatformStatus).mockReturnValue(platformStatusResult({ updatedAt: Date.now() }));
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
    const result = platformStatusResult();
    vi.mocked(useAdminPlatformStatus).mockReturnValue(result);
    mount(<GoLiveChecklist />);
    const card = screen.getByTestId('platform-status');
    expect(within(card).getAllByRole('term').length).toBeGreaterThan(0);
    expect(within(card).getByRole('link')).toHaveAttribute('href', '/admin/settings');
    expect(card.textContent).not.toContain('Go-Live');
    fireEvent.click(within(card).getByRole('button'));
    expect(result.refetch).toHaveBeenCalledTimes(1);
  });
});
