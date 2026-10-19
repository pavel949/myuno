import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ControlFinanceTab } from '@/components/admin/control/ControlFinanceTab';
import { AdminRevenueBlock } from '@/components/admin/dashboard/AdminRevenueBlock';
import { useAdminFinance } from '@/hooks/useAdminFinance';
import { useAdminAnalytics } from '@/hooks/useAdminAnalytics';
import { en } from '@/i18n/en';
import { ru } from '@/i18n/ru';

const locale = vi.hoisted(() => ({ value: 'en' }));
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    language: locale.value,
    t: (key: string) => (locale.value === 'ru' ? ru : en)[key] ?? key,
  }),
}));
vi.mock('@/contexts/CurrencyContext', () => ({
  useCurrency: () => ({ formatPrice: (value: number) => `${value} THB` }),
}));
vi.mock('@/hooks/useAdminFinance', () => ({
  useAdminFinance: vi.fn(),
  getVerticalLabel: () => 'Property',
}));
vi.mock('@/hooks/useAdminAnalytics', () => ({ useAdminAnalytics: vi.fn() }));

const financeResult = () => ({
  summary: {
    totalGmv: 1296000,
    platformRevenue: 129600,
    vendorPayouts: 1166400,
    pendingPayouts: 0,
    subscriptionRevenue: 2400,
    subscriptionRevenueUnavailable: false,
    averageTakeRate: 10,
    orderCount: 60,
  },
  byVertical: [],
  byProvider: [],
  dailyData: [],
  isLoading: false,
  refetchProviders: vi.fn(),
});
const analyticsResult = () => ({
  summary: {
    totalGMV: 0, totalRevenue: 0, totalUsers: 0, totalProviders: 0,
    totalBookings: 0, userGrowth: 0, providerGrowth: 0,
    bookingGrowth: 0, revenueGrowth: 0,
  },
  metrics: [], revenueChartData: [], userChartData: [], bookingChartData: [],
  isLoading: false, error: null,
});

beforeEach(() => {
  locale.value = 'en';
  vi.mocked(useAdminFinance).mockReturnValue(financeResult());
  vi.mocked(useAdminAnalytics).mockReturnValue(analyticsResult());
});
afterEach(cleanup);

describe.each(['en', 'ru'])('finance evidence labels (%s)', (language) => {
  const copy = language === 'ru' ? ru : en;
  beforeEach(() => { locale.value = language; });

  it('labels order-derived amounts provisional and preserves the existing sums', () => {
    render(<ControlFinanceTab />);
    expect(useAdminFinance).toHaveBeenLastCalledWith(30);
    expect(screen.getByText(copy['admin.finance.evidence.provisional30Days'])).toBeVisible();
    expect(screen.getByText(copy['admin.finance.evidence.orderSource'])).toHaveTextContent('confirmed/completed');
    expect(screen.getByText(copy['admin.finance.evidence.orderSource'])).toHaveTextContent('ledger');
    expect(screen.getByText(copy['admin.finance.evidence.subscriptionSource'])).toHaveTextContent('get_subscription_revenue');
    expect(screen.getByText(copy['admin.finance.evidence.beforeExpenses'])).toBeVisible();
    for (const value of [1296000, 129600, 1166400, 132000]) {
      expect(screen.getByText(`${value} THB`)).toBeVisible();
    }
    expect(screen.queryByText(copy['admin.finance.kpi.netIncome'])).not.toBeInTheDocument();
    expect(screen.getByText(copy['admin.finance.evidence.noBreakdown'])).toBeVisible();
    expect(screen.queryByText(copy['admin.finance.emptyOrders'])).not.toBeInTheDocument();
    expect(screen.queryByText(copy['admin.finance.kpi.platformRevenue'])).not.toBeInTheDocument();
  });

  it('does not turn zero pending into confirmation that payouts were made', () => {
    render(<ControlFinanceTab />);
    expect(screen.getByText(`${copy['admin.finance.evidence.pendingBalance']}: 0 THB`)).toBeVisible();
    expect(screen.getByText(copy['admin.finance.evidence.pendingSource'])).toHaveTextContent('providers.pending_payout');
    expect(screen.queryByText(copy['admin.finance.kpi.allPaid'])).not.toBeInTheDocument();
    expect(screen.queryByText(copy['admin.finance.kpi.vendorPayouts'])).not.toBeInTheDocument();
  });

  it('shows a nonzero pending balance without altering the order-derived vendor share', () => {
    const result = financeResult();
    result.summary.pendingPayouts = 500;
    vi.mocked(useAdminFinance).mockReturnValue(result);
    render(<ControlFinanceTab />);
    expect(screen.getByText(`${copy['admin.finance.evidence.pendingBalance']}: 500 THB`)).toBeVisible();
    expect(screen.getByText('1166400 THB')).toBeVisible();
  });

  it('does not present an unavailable summary as a zero balance', () => {
    vi.mocked(useAdminFinance).mockReturnValue({ ...financeResult(), summary: undefined });
    render(<ControlFinanceTab />);
    expect(screen.getByRole('status')).toHaveTextContent(copy['admin.finance.evidence.unavailable']);
    expect(screen.queryByText(/0 THB/)).not.toBeInTheDocument();
    expect(screen.queryByText(copy['admin.finance.emptyOrders'])).not.toBeInTheDocument();
  });

  it('does not present a failed subscription lookup as a complete revenue total', () => {
    const result = financeResult();
    result.summary.subscriptionRevenue = 0;
    result.summary.subscriptionRevenueUnavailable = true;
    vi.mocked(useAdminFinance).mockReturnValue(result);
    render(<ControlFinanceTab />);
    expect(screen.getByText(copy['admin.finance.evidence.unavailable'])).toBeVisible();
    expect(screen.getByText(copy['admin.finance.evidence.subscriptionsUnavailable'])).toBeVisible();
    expect(screen.getAllByText('129600 THB')).toHaveLength(1);
  });

  it('distinguishes dashboard snapshots, their period, and zero-filled gaps from finance', () => {
    render(<MemoryRouter><AdminRevenueBlock /></MemoryRouter>);
    expect(useAdminAnalytics).toHaveBeenLastCalledWith(14);
    const note = screen.getByRole('note');
    expect(note).toHaveTextContent(copy['admin.finance.evidence.snapshotSource']);
    expect(note).toHaveTextContent('platform_metrics');
    expect(note).toHaveTextContent('14');
    expect(note).toHaveTextContent('orders');
    expect(note).toHaveTextContent('30');
    expect(screen.getByText(copy['admin.finance.evidence.snapshotRevenue'])).toBeVisible();
    expect(screen.getAllByText('฿0')).toHaveLength(2);
  });

  it('does not turn a snapshot query error into zero revenue or booking growth', () => {
    vi.mocked(useAdminAnalytics).mockReturnValue({ ...analyticsResult(), error: 'offline' });
    render(<MemoryRouter><AdminRevenueBlock /></MemoryRouter>);
    expect(screen.getAllByText(copy['admin.finance.evidence.unavailable'])).toHaveLength(3);
    expect(screen.queryByText('฿0')).not.toBeInTheDocument();
    expect(screen.queryByText('+0%')).not.toBeInTheDocument();
  });
});
