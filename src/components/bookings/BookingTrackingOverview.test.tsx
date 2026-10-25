import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { BookingTrackingOverview } from './BookingTrackingOverview';
const state = vi.hoisted(() => ({ homes: { bookings: [] as unknown[], isLoading: false, error: null as unknown, refetch: vi.fn() }, services: { orders: [] as unknown[], isLoading: false, error: null as unknown, refetch: vi.fn() } }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/hooks/usePropertyBookings', () => ({ useGuestPropertyBookings: () => state.homes }));
vi.mock('@/hooks/useServiceOrders', () => ({ useGuestServiceOrders: () => state.services }));
afterEach(cleanup);
beforeEach(() => { state.homes.bookings = []; state.services.orders = []; state.homes.error = null; state.services.error = null; state.homes.isLoading = false; state.services.isLoading = false; vi.clearAllMocks(); });
const show = () => render(<MemoryRouter><BookingTrackingOverview /></MemoryRouter>);
it('provides existing tracking destinations and independent honest empty states', () => {
 show();
 expect(screen.getByText('No property bookings yet.')).toBeVisible();
 expect(screen.getByText('No service orders yet.')).toBeVisible();
 expect(screen.getByRole('link', { name: 'Requests and enquiries' })).toHaveAttribute('href', '/me/requests');
 expect(screen.getByRole('link', { name: 'My stay' })).toHaveAttribute('href', '/my-stay');
});
it('shows real record references and statuses without linking order IDs to legacy inventory details', () => {
 state.homes.bookings = [{ id: 'order-a', order_number: 'PROP-1', check_in: '2026-11-01', check_out: '2026-11-03', status: 'pending', owner_properties: { title: 'Synthetic home' } }];
 state.services.orders = [{ id: 'svc-a', order_number: 'SVC-2', service_name: 'Synthetic cleaning', status: 'assigned' }];
 const { container } = show();
 expect(screen.getByText('Synthetic home')).toBeVisible();
 expect(screen.getByText('order-a · Pending confirmation')).toBeVisible();
 expect(screen.getByText('SVC-2 · Assigned')).toBeVisible();
 expect(container.querySelector('a[href="/trip/order-a"]')).toBeNull();
 expect(screen.getByRole('link', { name: 'Order details' })).toHaveAttribute('href', '/orders/order-a/tracking');
 expect(container.querySelector('img')).toBeNull();
});
it('keeps a failed reader distinct from empty and retries only that reader', () => {
 state.homes.error = new Error('synthetic denied');
 show();
 expect(screen.queryByText('No property bookings yet.')).toBeNull();
 expect(screen.getByText('No service orders yet.')).toBeVisible();
 fireEvent.click(screen.getByRole('button', { name: 'Could not load. Retry' }));
 expect(state.homes.refetch).toHaveBeenCalledOnce();
 expect(state.services.refetch).not.toHaveBeenCalled();
});
it('shows pending state without presenting an empty result', () => {
 state.services.isLoading = true;
 show();
 expect(screen.getByRole('status')).toHaveTextContent('Loading');
 expect(screen.queryByText('No service orders yet.')).toBeNull();
});
it('never repeats an unavailable property UUID as its primary name', () => {
 state.homes.bookings = [{ id: 'order-a', check_in: '2026-11-01', check_out: '2026-11-03', status: 'pending', owner_properties: null }];
 show();
 expect(screen.getByText('Property name unavailable')).toBeVisible();
 expect(screen.getAllByText(/order-a/)).toHaveLength(1);
});
it('uses a historical human-readable name when current public details are unavailable', () => {
 state.homes.bookings = [{ id: 'order-a', check_in: '2026-11-01', check_out: '2026-11-03', status: 'pending', owner_properties: null, historicalPropertyName: 'Stored home name' }];
 show(); expect(screen.getByText('Stored home name')).toBeVisible();
});

it('keeps section anchors and page links as native navigation, not incomplete ARIA tabs', () => {
 show();
 expect(screen.getByRole('link', { name: 'Homes' })).toHaveAttribute('href', '#property-bookings');
 expect(screen.getByRole('link', { name: 'Service orders' })).toHaveAttribute('href', '#service-orders');
 expect(screen.queryByRole('tab')).not.toBeInTheDocument();
});
