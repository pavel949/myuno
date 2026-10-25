import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { PropertyReservationReceipt } from '../PropertyReservationReceipt';

const fixture = vi.hoisted(() => ({ actor: 'guest-a', read: vi.fn(), bind: vi.fn() }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: fixture.actor }, isLoading: false }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('@/lib/propertyReservationReceipt', () => ({ bindPropertyReservationReader: fixture.bind, readPropertyReservationReceipt: fixture.read }));
const receipt = (name: string) => ({ order: { id: 'order-a', status: 'pending', start_at: '2026-11-01T14:00:00+07:00', end_at: '2026-11-04T12:00:00+07:00' }, order_participants: [{ role: 'guest', name }] });
const view = (legacyUnsupported = false) => <MemoryRouter initialEntries={['/bookings/order-a']}><Routes><Route path="/bookings/:id" element={<PropertyReservationReceipt legacyUnsupported={legacyUnsupported} />} /></Routes></MemoryRouter>;
beforeEach(() => { vi.clearAllMocks(); fixture.actor = 'guest-a'; fixture.bind.mockResolvedValue({}); });
describe('property receipt actor/context isolation', () => {
  it('shows a persisted pending request as pending, with no payment or cancellation write', async () => {
    fixture.read.mockResolvedValue(receipt('Guest A'));
    render(view());
    expect(await screen.findByText('Guest A')).toBeInTheDocument();
    expect(screen.getByTestId('property-reservation-status')).toHaveTextContent('Awaiting manager confirmation');
    expect(screen.queryByRole('button', { name: /pay|cancel/i })).not.toBeInTheDocument();
  });
  it('hides actor A immediately on actor B change and discards late A responses', async () => {
    let finishA!: (value: unknown) => void;
    fixture.read.mockImplementationOnce(() => new Promise(resolve => { finishA = resolve; })).mockResolvedValueOnce(receipt('Guest B'));
    const rendered = render(view());
    await waitFor(() => expect(fixture.read).toHaveBeenCalledTimes(1));
    fixture.actor = 'guest-b'; rendered.rerender(view());
    expect(await screen.findByText('Guest B')).toBeInTheDocument();
    await act(async () => { finishA(receipt('Guest A')); });
    expect(screen.queryByText('Guest A')).not.toBeInTheDocument();
    expect(screen.getByText('Guest B')).toBeInTheDocument();
  });
  it('treats a legacy order id as unknown instead of claiming a canonical reservation', () => {
    render(view(true));
    expect(screen.getByRole('alert')).toHaveTextContent('order number alone does not confirm a booking');
    expect(fixture.read).not.toHaveBeenCalled();
    expect(fixture.bind).not.toHaveBeenCalled();
  });
  it('reports checked reader failure with retry, not an empty successful booking', async () => {
    fixture.read.mockRejectedValue(new Error('access denied'));
    render(view());
    expect(await screen.findByRole('alert')).toHaveTextContent('could not be verified');
    expect(screen.getByRole('button', { name: 'Retry verification' })).toBeInTheDocument();
    expect(screen.queryByTestId('property-reservation-status')).not.toBeInTheDocument();
  });
});
