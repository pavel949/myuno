import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useNavigate, useSearchParams } from 'react-router-dom';
import { PropertyBookingCard } from '../PropertyBookingCard';
import { format, addDays } from 'date-fns';
import { readPropertyGuestContext } from '@/lib/real-estate/propertyGuestContext';
const datePriceRead = vi.hoisted(() => vi.fn());
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: datePriceRead } }));
const availability = vi.hoisted(() => ({ isSuccess: false, isError: false, data: [], refetch: vi.fn() }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/contexts/CurrencyContext', () => ({ useCurrency: () => ({ formatPrice: (v: number) => String(v) }) }));
vi.mock('@/hooks/usePropertyUnavailableDates', () => ({ usePropertyUnavailableDates: () => availability }));
vi.mock('@/hooks/usePropertyRateSeasons', () => ({ usePropertyRateSeasons: () => ({ data: [] }) }));
vi.mock('@/hooks/useBreakpoint', () => ({ useBreakpoint: () => ({ isDesktop: true }) }));
vi.mock('../GuestPriceProposal', () => ({ GuestPriceProposal: () => null }));
datePriceRead.mockResolvedValue({ data: [], error: null });
afterEach(() => { cleanup(); availability.isSuccess = false; availability.isError = false; });
const nextQuery = '?checkIn=2099-12-10&checkOut=2099-12-14&guests=2';
function RoutedCard() {
  const [params] = useSearchParams(); const navigate = useNavigate();
  return <><button onClick={() => navigate(nextQuery)}>New URL</button><PropertyBookingCard propertyId="home" pricePerNight={2000} initialGuestContext={readPropertyGuestContext(params.toString(), 4)} /></>;
}
function mountRouted() { return render(<MemoryRouter initialEntries={['/property/home?checkIn=2099-12-01&checkOut=2099-12-04&guests=3']}><RoutedCard /></MemoryRouter>); }
const context = readPropertyGuestContext('checkIn=2099-12-01&checkOut=2099-12-04&guests=3', 4);
function Card({ initial = context }) { return <MemoryRouter><PropertyBookingCard propertyId="home" pricePerNight={2000} initialGuestContext={initial} /></MemoryRouter>; }
describe('booking card initial guest context', () => {
  it('hydrates both dates and party while keeping unknown availability blocked', () => {
    render(<Card />);
    expect(screen.getByText('3 guests')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Request to book' })).toBeDisabled();
    expect(screen.getByText('Checking availability…')).toBeInTheDocument();
  });
  it('updates untouched dates and guests on same-property URL navigation', () => {
    mountRouted(); fireEvent.click(screen.getByRole('button', { name: 'New URL' }));
    expect(screen.getByText('2 guests')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Check-in.*10 Dec 2099.*Check-out.*14 Dec 2099/ })).toBeInTheDocument();
  });
  it('preserves a cleared date range but updates untouched guests on navigation', () => {
    mountRouted();
    fireEvent.click(screen.getByRole('button', { name: /Check-in.*1 Dec 2099/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: 'New URL' }));
    expect(screen.getByText('2 guests')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Request to book' })).not.toBeInTheDocument();
  });
  it('does not replace user edits when parent initial context changes', () => {
    mountRouted();
    fireEvent.click(screen.getByRole('button', { name: /Guests\s*3 guests/ }));
    fireEvent.click(screen.getByRole('button', { name: 'More guests' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: 'New URL' }));
    expect(screen.getByText('4 guests')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Check-in.*10 Dec 2099.*Check-out.*14 Dec 2099/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Request to book' })).toBeDisabled();
  });
});

it('keeps validated intent on the existing desktop inquiry route', async () => {
  availability.isSuccess = true;
  function Destination() { const [params] = useSearchParams(); return <output data-testid="inquiry-query">{params.toString()}</output>; }
  render(<MemoryRouter><PropertyBookingCard propertyId="home" pricePerNight={2000} initialGuestContext={context} guestSearch="mode=rent&tenancy=short&intent=holiday" /><Destination /></MemoryRouter>);
  const button = screen.getByRole('button', { name: 'Request to book' });
  await waitFor(() => expect(button).toBeEnabled());
  fireEvent.click(button);
  expect(Object.fromEntries(new URLSearchParams(screen.getByTestId('inquiry-query').textContent ?? ''))).toEqual({ mode: 'rent', tenancy: 'short', intent: 'holiday', checkIn: '2099-12-01', checkOut: '2099-12-04', guests: '3' });
});

it('blocks a price and CTA when dates fail, then uses the confirmed nightly override on retry', async () => {
  availability.isSuccess = true;
  datePriceRead.mockResolvedValueOnce({ data: null, error: new Error('synthetic outage') })
    .mockResolvedValueOnce({ data: [{ date: '2099-12-01', price_override: 3000 }], error: null });
  render(<Card />);
  const reserve = screen.getByRole('button', { name: 'Request to book' });
  expect(screen.getByText('Checking the price for your selected dates…')).toBeVisible();
  expect(reserve).toBeDisabled();
  const retry = await screen.findByRole('button', { name: 'Retry' });
  expect(screen.queryByText('6000')).not.toBeInTheDocument();
  expect(reserve).toBeDisabled();
  fireEvent.click(retry);
  await waitFor(() => expect(reserve).toBeEnabled());
  expect(screen.getAllByText('7000').length).toBeGreaterThan(0);
});

it('lets a first-time guest choose two actual calendar dates before pricing is ready', async () => {
  availability.isSuccess = true;
  datePriceRead.mockClear();
  render(<MemoryRouter><PropertyBookingCard propertyId="home" pricePerNight={2000} /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: 'Calculate stay cost' }));
  const now = new Date();
  const start = addDays(now, 2);
  const end = addDays(now, 3);
  // Both months are in view on desktop, including when today is at month end.
  const day = (value: Date) => {
    const key = format(value, 'yyyy-MM-dd');
    return Array.from(document.querySelectorAll<HTMLElement>('td[data-day]'))
      .find(cell => cell.dataset.day === key && !cell.hasAttribute('data-outside'))?.querySelector('button');
  };
  const first = day(start);
  const second = day(end);
  expect(first).toBeTruthy();
  expect(second).toBeTruthy();
  fireEvent.click(first!);
  fireEvent.click(second!);
  await waitFor(() => expect(datePriceRead).toHaveBeenCalledWith('get_property_date_prices', {
    _property_id: 'home', _from: format(start, 'yyyy-MM-dd'), _to: format(end, 'yyyy-MM-dd'),
  }));
  expect(screen.getByRole('button', { name: 'Request to book' })).toBeEnabled();
});
