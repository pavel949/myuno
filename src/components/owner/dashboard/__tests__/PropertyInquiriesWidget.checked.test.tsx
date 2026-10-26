import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PropertyInquiriesWidget } from '../PropertyInquiriesWidget';
const fixture = vi.hoisted(() => ({ status: 'pending', error: null as Error | null, inquiryError: null as Error | null,
  change: vi.fn(), bind: vi.fn(), from: vi.fn(), success: vi.fn(), failure: vi.fn(), refetch: vi.fn() }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'manager-a' } }) }));
vi.mock('@/hooks/useActiveCompany', () => ({ useActiveCompany: () => ({ activeCompany: { company_id: 'company-a' } }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/hooks/useMyProperties', () => ({ useMyProperties: () => ({ allProperties: [{ id: 'physical-a', property_id: 'physical-a', title: 'Synthetic property' }], isLoading: false, error: null }) }));
vi.mock('@/hooks/usePropertyBookings', () => ({ useAllPropertyBookings: () => ({ bookings: [{ id: 'order-a', property_id: 'physical-a', guest_name: 'Synthetic guest', status: fixture.status, check_in: '2026-11-10', check_out: '2026-11-13', created_at: '2026-10-25T04:00:00Z', updated_at: '2026-10-25T04:00:00.123456Z' }], isLoading: false, error: fixture.error, refetch: fixture.refetch }) }));
vi.mock('@/lib/manualPropertyBooking', () => ({ executePropertyBookingChange: fixture.change }));
vi.mock('@/lib/propertyReservationReceipt', () => ({ bindPropertyReservationReader: fixture.bind }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: fixture.from } }));
vi.mock('sonner', () => ({ toast: { success: fixture.success, error: fixture.failure } }));
function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter><PropertyInquiriesWidget /></MemoryRouter></QueryClientProvider>);
}
beforeEach(() => {
  vi.clearAllMocks(); fixture.status = 'pending'; fixture.error = null; fixture.inquiryError = null;
  const query = { select: () => query, in: () => query, order: () => query,
    limit: async () => ({ data: [], error: fixture.inquiryError }) };
  fixture.from.mockReturnValue(query); fixture.bind.mockResolvedValue({});
  fixture.change.mockImplementation(async () => { fixture.status = 'confirmed'; return {}; });
});
describe('MC canonical reservation queue', () => {
  it('shows a checked item-linked reservation without inquiry or metadata linkage and confirms through CAS', async () => {
    mount();
    expect(await screen.findByText('Synthetic guest')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
    await waitFor(() => expect(fixture.change).toHaveBeenCalledExactlyOnceWith({}, 'manager-a', 'order-a', { status: 'confirmed' }, '2026-10-25T04:00:00.123456Z'));
    await waitFor(() => expect(fixture.success).toHaveBeenCalledOnce());
    expect(fixture.from.mock.calls.every(([table]) => table === 'property_inquiries')).toBe(true);
  });
  it('hides stale queue records when the checked booking source fails and permits retry', async () => {
    fixture.error = new Error('checked list denied'); mount();
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not verify the request queue');
    expect(screen.queryByText('Synthetic guest')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(fixture.refetch).toHaveBeenCalled();
  });
  it('propagates denied commands without raw orders fallback or success notification', async () => {
    fixture.change.mockRejectedValue(new Error('bookings edit denied')); mount();
    await screen.findByText('Synthetic guest');
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
    await waitFor(() => expect(fixture.failure).toHaveBeenCalledOnce());
    expect(fixture.success).not.toHaveBeenCalled();
    expect(fixture.from.mock.calls.some(([table]) => table === 'orders')).toBe(false);
  });
});
