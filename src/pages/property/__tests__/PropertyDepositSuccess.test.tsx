import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PropertyDepositSuccess from '../PropertyDepositSuccess';

const state = vi.hoisted(() => ({
  user: { id: 'booking-guest' } as { id: string } | null,
  status: 'pending',
  payment: { amount: 1200, status: 'pending' } as { amount: number; status: string } | null,
  readOrder: vi.fn(),
  readAttempts: vi.fn(),
}));

vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: state.user, isLoading: false }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/components/property/TripServicesGrid', () => ({ TripServicesGrid: () => null }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from(table: string) {
      const filters: Record<string, string | number> = {};
      const query = {
        select: () => query,
        eq(key: string, value: string | number) {
          filters[key] = value;
          return query;
        },
        maybeSingle: async () => {
          if (table === 'payment_intents') {
            state.readAttempts(table, { ...filters });
            return { data: state.payment, error: null };
          }
          state.readOrder({ ...filters });
          const data = filters.customer_user_id === 'booking-guest' ? {
            id: filters.id,
            order_number: 'TEST-RECEIPT',
            status: state.status,
            currency: 'THB',
            metadata: { deposit_amount: 1200 },
          } : null;
          return { data, error: null };
        },
      };
      return query;
    },
  },
}));

const orderId = '00000000-0000-4000-a000-000000000001';
const show = () => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter initialEntries={['/property/deposit-success?session_id=untrusted&order_id=' + orderId]}>
      <PropertyDepositSuccess />
    </MemoryRouter>
  </QueryClientProvider>,
);

describe('property checkout return', () => {
  beforeEach(() => {
    state.user = { id: 'booking-guest' };
    state.status = 'pending';
    state.payment = { amount: 1200, status: 'pending' };
    state.readOrder.mockClear();
    state.readAttempts.mockClear();
  });

  it('offers sign-in without reading a signed-out visitor’s order', () => {
    state.user = null;
    show();
    expect(screen.getByRole('heading', { name: 'Sign in to check your payment' })).toBeVisible();
    expect(state.readOrder).not.toHaveBeenCalled();
  });

  it('does not load payment details when the order belongs to another guest', async () => {
    state.user = { id: 'other-guest' };
    show();
    expect(await screen.findByRole('heading', { name: 'Deposit status is unavailable' })).toBeVisible();
    expect(state.readOrder).toHaveBeenCalledWith({ id: orderId, customer_user_id: 'other-guest', order_type: 'property' });
    expect(state.readAttempts).not.toHaveBeenCalled();
    expect(screen.queryByText('TEST-RECEIPT')).toBeNull();
  });

  it('waits for the recorded payment and displays the recorded amount after a refresh', async () => {
    show();
    expect(await screen.findByRole('heading', { name: 'Payment confirmation pending' })).toBeVisible();
    expect(screen.queryByText('Deposit paid')).toBeNull();
    state.payment = { amount: 1200, status: 'succeeded' };
    fireEvent.click(screen.getByRole('button', { name: 'Check status' }));
    expect(await screen.findByRole('heading', { name: 'Deposit received' })).toBeVisible();
    expect(screen.getByText('Deposit paid').nextElementSibling).toHaveTextContent(/1,200/);
    expect(screen.getByRole('link', { name: 'Track order' })).toHaveAttribute('href', '/orders/' + orderId + '/tracking');
    expect(state.readAttempts).toHaveBeenCalledWith('payment_intents', { order_id: orderId, currency: 'THB', amount: 1200, method: 'stripe' });
  });

  it('shows a recorded refund without presenting the earlier deposit as current', async () => {
    state.status = 'refunded';
    state.payment = { amount: 1200, status: 'succeeded' };
    show();
    expect(await screen.findByRole('heading', { name: 'Refund recorded for this order' })).toBeVisible();
    expect(screen.queryByText('Deposit paid')).toBeNull();
  });

  it('shows a failed payment when checkout also cancelled the order', async () => {
    state.status = 'cancelled';
    state.payment = { amount: 1200, status: 'failed' };
    show();
    expect(await screen.findByRole('heading', { name: 'Payment failed' })).toBeVisible();
    expect(screen.queryByText('Deposit paid')).toBeNull();
  });
});
