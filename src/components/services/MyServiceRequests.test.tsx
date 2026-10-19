import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MyServiceRequests } from './MyServiceRequests';
let user: { id: string } | null;
let orders: Record<string, unknown>[];
let error: Error | null;
const refetch = vi.fn(), cancel = vi.fn();
let cancelError = false;
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/hooks/useServiceOrders', () => ({ useGuestServiceOrders: () => ({ orders, error, isLoading: false, refetch, cancelOrder: { mutate: cancel, isPending: false, isError: cancelError } }) }));
beforeEach(() => {
  user = { id: 'synthetic-guest' }; error = null; cancelError = false; refetch.mockClear(); cancel.mockClear();
  orders = [{ id: 'synthetic-order', service_name: 'Synthetic repair', status: 'pending', amount: 0, currency: 'USD', scheduled_at: '2030-01-07T03:00:00Z', notes: 'Fixture request' }];
});
describe('guest service account projection', () => {
  it('shows the persisted request and allows cancellation only while pending', () => {
    const { rerender } = render(<MyServiceRequests />);
    expect(screen.getByText('Synthetic repair')).toBeInTheDocument(); expect(screen.getByText('0 USD')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel request' })); expect(cancel).toHaveBeenCalledWith('synthetic-order');
    orders = [{ ...orders[0], status: 'confirmed' }]; rerender(<MyServiceRequests />);
    expect(screen.getByText('Confirmed')).toBeInTheDocument(); expect(screen.queryByRole('button', { name: 'Cancel request' })).toBeNull();
  });
  it('keeps failed loading distinct from no requests and offers refresh', () => {
    orders = []; error = new Error('Synthetic failure'); render(<MyServiceRequests />);
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load'); expect(screen.queryByText(/No service requests yet/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' })); expect(refetch).toHaveBeenCalledOnce();
  });
  it('preserves unknown server statuses instead of showing pending', () => {
    orders = [{ ...orders[0], status: 'future_status' }]; render(<MyServiceRequests />);
    expect(screen.getByText('Unknown status: future_status')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel request' })).toBeNull();
  });
  it('shows an unconfirmed cancellation explicitly', () => {
    cancelError = true; render(<MyServiceRequests />); expect(screen.getByRole('alert')).toHaveTextContent('Cancellation was not confirmed');
  });
  it('does not project cached private orders into the signed-out account', () => {
    user = null; const { container } = render(<MyServiceRequests />); expect(container).toBeEmptyDOMElement();
  });
});
