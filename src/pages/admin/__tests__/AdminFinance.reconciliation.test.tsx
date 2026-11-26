import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import AdminFinance from '../AdminFinance';
import { en } from '@/i18n/en';

const state = vi.hoisted(() => ({ isError: false, refetch: vi.fn() }));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: 'en', t: (key: string) => en[key] ?? key }),
}));
vi.mock('@/hooks/useLedgerReconciliation', () => ({
  useLedgerReconciliation: () => ({
    data: state.isError ? undefined : {
      totalOrders: 8, matchedOrders: 5, missingLedger: 2, amountMismatch: 1, isHealthy: false,
    },
    isLoading: false,
    isError: state.isError,
    refetch: state.refetch,
  }),
}));
vi.mock('@/components/admin/control/ControlFinanceTab', () => ({ ControlFinanceTab: () => <p>Transactions view</p> }));
vi.mock('@/components/admin/control/ControlAnalyticsTab', () => ({ ControlAnalyticsTab: () => <p>Analytics view</p> }));
vi.mock('@/components/admin/finance/AdminPromotionsTab', () => ({ AdminPromotionsTab: () => <p>Promotions view</p> }));
vi.mock('@/components/admin/finance/ManualPaymentForm', () => ({ ManualPaymentForm: () => null }));
vi.mock('@/components/admin/PayoutManager', () => ({ PayoutManager: () => <p>Payouts workspace</p> }));

function CurrentSearch() {
  const { search } = useLocation();
  return <output data-testid="finance-search">{search}</output>;
}

function showFinance() {
  return render(
    <MemoryRouter initialEntries={['/admin/finance?tab=reconciliation&source=workspace']}>
      <CurrentSearch />
      <AdminFinance />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  state.isError = false;
  state.refetch.mockReset().mockResolvedValue(undefined);
});

it('opens reconciliation from the URL and keeps workspace context when switching to payouts', () => {
  showFinance();
  const panel = screen.getByRole('tabpanel', { name: 'Reconciliation' });
  expect(within(panel).getByText('Orders checked').parentElement).toHaveTextContent('8');
  expect(within(panel).getByText('Matched orders').parentElement).toHaveTextContent('5');
  expect(within(panel).getByText('Missing ledger entries').parentElement).toHaveTextContent('2');
  expect(within(panel).getByText('Amount differences').parentElement).toHaveTextContent('1');

  fireEvent.mouseDown(screen.getByRole('tab', { name: en['admin.finance.tabs.payouts'] }), { button: 0, ctrlKey: false });
  expect(screen.getByText('Payouts workspace')).toBeVisible();
  expect(screen.getByTestId('finance-search')).toHaveTextContent('?tab=payouts&source=workspace');
});

it('offers retry on a failed reconciliation instead of reporting an empty or matched ledger', () => {
  state.isError = true;
  showFinance();
  expect(screen.getByText('Reconciliation unavailable')).toBeVisible();
  expect(screen.queryByText('Orders checked')).toBeNull();
  expect(screen.queryByText(en['admin.finance.recon.noData'])).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: /retry|try again/i }));
  expect(state.refetch).toHaveBeenCalledOnce();
});
