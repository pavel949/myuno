import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PropertyInquiry from '../PropertyInquiry';

const fixture = vi.hoisted(() => ({
  user: { id: 'guest-a' } as { id: string } | null,
  profile: { full_name: 'Synthetic Guest', email: '', phone: '+66000000000' },
  seasons: [],
  rpc: vi.fn(), reserve: vi.fn(), success: vi.fn(), error: vi.fn(),
}));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: fixture.rpc } }));
vi.mock('@/lib/propertyReservation', () => ({ reserveProperty: fixture.reserve }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: fixture.user }) }));
vi.mock('@/contexts/AuthSheetContext', () => ({ useAuthSheet: () => ({ openAuthSheet: vi.fn() }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/contexts/CurrencyContext', () => ({ useCurrency: () => ({ formatPrice: (n: number) => String(n) }) }));
vi.mock('@/contexts/LocationContext', () => ({ useLocation: () => ({ currentCity: { default_currency: 'THB' } }) }));
vi.mock('@/hooks/useProfile', () => ({ useProfile: () => ({ profile: fixture.profile }) }));
vi.mock('@/hooks/useProperties', () => ({ usePropertyWithRentalTerms: (id: string) => ({ data: { id, title_en: `Synthetic ${id}`, price: 100, price_per_night: 100, instant_booking: false, tenancy_modes: ['short'] } }) }));
vi.mock('@/hooks/usePropertyAvailability', () => ({ usePropertyBlockedDates: () => ({ data: [] }) }));
vi.mock('@/hooks/usePropertyRateSeasons', () => ({ usePropertyRateSeasons: () => ({ data: fixture.seasons }) }));
vi.mock('@/hooks/useRareFindBadge', () => ({ useRareFindBadge: () => ({ data: false }) }));
vi.mock('@/components/property/DepositPaymentOptions', () => ({ DepositPaymentOptions: () => null }));
vi.mock('@/components/property/PayWhenSelector', () => ({ PayWhenSelector: () => null }));
vi.mock('sonner', () => ({ toast: { info: vi.fn(), success: fixture.success, error: fixture.error } }));

const query = '?checkIn=2030-01-10&checkOut=2030-01-13&guests=2';
const reply = (id: string) => ({ success: true, order: { id, status: 'pending' } });
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}
function Controls() {
  const navigate = useNavigate();
  return <>
    <button onClick={() => navigate(`/property/home-a/inquiry${query}`)}>Home A</button>
    <button onClick={() => navigate(`/property/home-b/inquiry${query}`)}>Home B</button>
    <button onClick={() => navigate('/property/home-a/inquiry?checkIn=2030-02-10&checkOut=2030-02-13&guests=2')}>Other dates</button>
    <button onClick={() => navigate('/property/home-a/inquiry?checkIn=2030-01-10&checkOut=2030-01-13&guests=3')}>Other guests</button>
  </>;
}
function App() {
  return <MemoryRouter initialEntries={[`/property/home-a/inquiry${query}`]}>
    <Controls /><Routes><Route path="/property/:id/inquiry" element={<PropertyInquiry />} /></Routes>
  </MemoryRouter>;
}
async function submit() {
  const button = await screen.findByRole('button', { name: 'Request to book' });
  await act(async () => fireEvent.click(button));
}
beforeEach(() => {
  localStorage.clear(); vi.resetAllMocks(); fixture.user = { id: 'guest-a' };
  // Price data is controlled: no real backend and no render-loop side effects.
  fixture.rpc.mockImplementation(() => new Promise(() => {}));
  fixture.reserve.mockResolvedValue(reply('order-a'));
});

describe('PropertyInquiry request context', () => {
  it.each(['actor', 'property', 'dates', 'guests'])('does not retain a completed confirmation after changing %s', async kind => {
    const view = render(<App />); await submit();
    expect(await screen.findByRole('heading', { name: 'Reservation request saved' })).toBeInTheDocument();
    if (kind === 'actor') { fixture.user = { id: 'guest-b' }; view.rerender(<App />); }
    else fireEvent.click(screen.getByRole('button', { name: kind === 'property' ? 'Home B' : kind === 'dates' ? 'Other dates' : 'Other guests' }));
    expect(screen.queryByRole('heading', { name: 'Reservation request saved' })).not.toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Request to book' })).toBeInTheDocument();
  });

  it('ignores a response for the previous property without clearing its draft or showing acceptance', async () => {
    const pending = deferred<ReturnType<typeof reply>>(); fixture.reserve.mockReturnValue(pending.promise);
    render(<App />); await submit();
    const oldDraft = localStorage.getItem('uno_inquiry_draft_home-a'); expect(oldDraft).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Home B' }));
    await act(async () => pending.resolve(reply('old-order')));
    expect(screen.queryByRole('heading', { name: 'Reservation request saved' })).not.toBeInTheDocument();
    expect(screen.getByText('Synthetic home-b')).toBeInTheDocument();
    expect(localStorage.getItem('uno_inquiry_draft_home-a')).toBe(oldDraft);
    expect(fixture.success).not.toHaveBeenCalled();
  });

  it('old completion cannot clear the in-flight state of the new context', async () => {
    const old = deferred<ReturnType<typeof reply>>(), current = deferred<ReturnType<typeof reply>>();
    fixture.reserve.mockReturnValueOnce(old.promise).mockReturnValueOnce(current.promise);
    render(<App />); await submit(); fireEvent.click(screen.getByRole('button', { name: 'Home B' }));
    const newButton = screen.getByRole('button', { name: 'Request to book' });
    expect(newButton).toBeEnabled(); fireEvent.click(newButton); expect(fixture.reserve).toHaveBeenCalledTimes(2);
    await act(async () => old.resolve(reply('old-order')));
    expect(newButton).toBeDisabled(); expect(fixture.success).not.toHaveBeenCalled();
    await act(async () => current.resolve(reply('current-order')));
    expect(await screen.findByRole('heading', { name: 'Reservation request saved' })).toBeInTheDocument();
    expect(fixture.success).toHaveBeenCalledTimes(1);
  });

  it('leaving and returning to the same context cannot accept the old in-flight response', async () => {
    const pending = deferred<ReturnType<typeof reply>>(); fixture.reserve.mockReturnValue(pending.promise);
    render(<App />); await submit(); fireEvent.click(screen.getByRole('button', { name: 'Home B' }));
    fireEvent.click(screen.getByRole('button', { name: 'Home A' }));
    await act(async () => pending.resolve(reply('old-order')));
    expect(screen.queryByRole('heading', { name: 'Reservation request saved' })).not.toBeInTheDocument();
    expect(fixture.success).not.toHaveBeenCalled();
  });

  it('fetches date prices once per date context, without a response-triggered render loop', async () => {
    fixture.rpc.mockResolvedValueOnce({ data: [], error: null });
    render(<App />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Request to book' })).toBeEnabled());
    await act(async () => {});
    expect(fixture.rpc).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Other dates' }));
    expect(fixture.rpc).toHaveBeenCalledTimes(2);
  });
});
