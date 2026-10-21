import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useNavigate, useSearchParams } from 'react-router-dom';
import { PropertyBookingCard } from '../PropertyBookingCard';
import { readPropertyGuestContext } from '@/lib/real-estate/propertyGuestContext';
const availability = vi.hoisted(() => ({ isSuccess: false, isError: false, data: [], refetch: vi.fn() }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/contexts/CurrencyContext', () => ({ useCurrency: () => ({ formatPrice: (v: number) => String(v) }) }));
vi.mock('@/hooks/usePropertyUnavailableDates', () => ({ usePropertyUnavailableDates: () => availability }));
vi.mock('@/hooks/usePropertyRateSeasons', () => ({ usePropertyRateSeasons: () => ({ data: [] }) }));
vi.mock('@/hooks/useBreakpoint', () => ({ useBreakpoint: () => ({ isDesktop: true }) }));
vi.mock('../GuestPriceProposal', () => ({ GuestPriceProposal: () => null }));
afterEach(cleanup);
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
    expect(screen.getByRole('button', { name: 'Reserve' })).toBeDisabled();
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
    expect(screen.queryByRole('button', { name: 'Reserve' })).not.toBeInTheDocument();
  });
  it('does not replace user edits when parent initial context changes', () => {
    mountRouted();
    fireEvent.click(screen.getByRole('button', { name: /Guests\s*3 guests/ }));
    fireEvent.click(screen.getByRole('button', { name: 'More guests' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: 'New URL' }));
    expect(screen.getByText('4 guests')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Check-in.*10 Dec 2099.*Check-out.*14 Dec 2099/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reserve' })).toBeDisabled();
  });
});
