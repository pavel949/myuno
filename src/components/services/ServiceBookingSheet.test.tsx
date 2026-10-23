import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ServiceBookingSheet, type BookableService } from './ServiceBookingSheet';

let user: { id: string } | null;
let hours: Record<string, unknown>, busy: Record<string, unknown>;
const mutate = vi.fn(), hoursRetry = vi.fn(), busyRetry = vi.fn(), redirect = vi.fn();
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/lib/auth/redirectToAuth', () => ({ redirectToAuth: (...args: unknown[]) => redirect(...args) }));
vi.mock('@/hooks/useServiceMarketplace', () => ({
  useProviderHours: () => hours, useBusySlots: () => busy,
  useCreateServiceOrder: () => ({ mutateAsync: mutate, isPending: false }),
  orderErrorCode: () => 'UNKNOWN',
}));
const service: BookableService = { id: 'service-a', providerId: 'provider-a', name: 'Synthetic cleaning', price: 0, currency: 'USD', durationMinutes: 60, leadTimeHours: 0 };
const view = (s = service, open = true) => <MemoryRouter><ServiceBookingSheet service={s} open={open} onOpenChange={vi.fn()} /></MemoryRouter>;
function selectAndContact() {
  fireEvent.click(screen.getByRole('button', { name: '09:00' }));
  fireEvent.change(screen.getByLabelText('Your name'), { target: { value: '  Synthetic Guest  ' } });
  fireEvent.change(screen.getByLabelText('Phone / WhatsApp'), { target: { value: '  +000  ' } });
}
beforeEach(() => {
  // Date construction must share the deterministic clock used to generate slots.
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2030-01-07T00:00:00Z'));
  user = { id: 'guest-a' };
  hours = { isSuccess: true, isLoading: false, isError: false, isFetching: false, refetch: hoursRetry, data: [{ weekday: 1, start_time: '09:00', end_time: '12:00' }] };
  busy = { isSuccess: true, isLoading: false, isError: false, isFetching: false, refetch: busyRetry, data: [] };
  mutate.mockReset().mockResolvedValue({ id: 'request-a' }); hoursRetry.mockClear(); busyRetry.mockClear(); redirect.mockClear();
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe('service request journey', () => {
  it('requires contacts, sends one trimmed request and links to the real account route', async () => {
    render(view());
    expect(screen.getByText(/^0 USD/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '09:00' }));
    expect(screen.getByRole('button', { name: 'Book 09:00' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Your name'), { target: { value: '  Synthetic Guest  ' } });
    fireEvent.change(screen.getByLabelText('Phone / WhatsApp'), { target: { value: '  +000  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Book 09:00' }));
    await waitFor(() => expect(screen.getByText('Order sent')).toBeInTheDocument());
    expect(mutate).toHaveBeenCalledOnce();
    expect(mutate.mock.calls[0][0]).toMatchObject({ serviceId: 'service-a', providerId: 'provider-a', guestId: 'guest-a', guestName: 'Synthetic Guest', guestPhone: '+000' });
    expect(screen.getByRole('link', { name: 'My services' })).toHaveAttribute('href', '/me/services');
  });
  it('shows confirmation only for a confirmed status returned by the server', async () => {
    mutate.mockResolvedValue({ id: 'booking-a', status: 'confirmed' });
    render(view()); selectAndContact();
    fireEvent.click(screen.getByRole('button', { name: 'Book 09:00' }));
    await waitFor(() => expect(screen.getByText('Booking confirmed')).toBeInTheDocument());
    expect(screen.queryByText('Order sent')).toBeNull();
  });
  it('drops the chosen slot when switching providers/services', () => {
    const { rerender } = render(view()); selectAndContact();
    rerender(view({ ...service, id: 'service-b', providerId: 'provider-b', name: 'Synthetic repair' }));
    expect(screen.queryByLabelText('Your name')).toBeNull();
    expect(screen.getByRole('button', { name: 'Pick a time' })).toBeDisabled();
  });
  it('clears success and contacts when the sheet is closed and opened again', async () => {
    const { rerender } = render(view()); selectAndContact();
    fireEvent.click(screen.getByRole('button', { name: 'Book 09:00' }));
    await waitFor(() => expect(screen.getByText('Order sent')).toBeInTheDocument());
    rerender(view(service, false)); rerender(view());
    expect(screen.queryByText('Order sent')).toBeNull();
    selectAndContact();
    expect(screen.getByLabelText('Your name')).toHaveValue('  Synthetic Guest  ');
  });
  it('blocks stale selection when schedule loading fails and offers retry', () => {
    const { rerender } = render(view()); selectAndContact();
    busy = { ...busy, isError: true, isSuccess: false };
    rerender(view());
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load the schedule');
    expect(screen.getByRole('button', { name: 'Book 09:00' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(hoursRetry).toHaveBeenCalledOnce(); expect(busyRetry).toHaveBeenCalledOnce(); expect(mutate).not.toHaveBeenCalled();
  });
  it('does not submit a time that became busy during refetch', () => {
    const { rerender } = render(view()); selectAndContact();
    busy = { ...busy, data: [{ starts_at: '2030-01-07T02:00:00Z', ends_at: '2030-01-07T03:00:00Z' }] };
    rerender(view());
    expect(screen.getByRole('button', { name: 'Book 09:00' })).toBeDisabled();
    expect(mutate).not.toHaveBeenCalled();
  });
  it('ignores late acknowledgement from the previous service', async () => {
    let resolve!: (v: { id: string }) => void;
    mutate.mockImplementation(() => new Promise(r => { resolve = r; }));
    const { rerender } = render(view()); selectAndContact();
    fireEvent.click(screen.getByRole('button', { name: 'Book 09:00' }));
    rerender(view({ ...service, id: 'service-b', name: 'Another service' }));
    await act(async () => resolve({ id: 'old-request' }));
    expect(screen.queryByText('Order sent')).toBeNull(); expect(screen.getByText('Another service')).toBeInTheDocument();
  });
});
