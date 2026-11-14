import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MarketplaceServiceGrid } from './MarketplaceServiceGrid';
import type { MarketplaceService } from '@/hooks/useServiceMarketplace';
const state = vi.hoisted(() => ({ services: [] as MarketplaceService[], slots: {} as Record<string, { status: 'available' | 'unknown' | 'unavailable'; date: string; error?: 'schedule-read-failed' }>, checking: false }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/hooks/useServiceMarketplace', () => ({ useMarketplaceServices: () => ({ data: state.services, isLoading: false, isError: false, refetch: vi.fn() }) }));
vi.mock('@/hooks/useMarketplaceAvailability', () => ({ useMarketplaceAvailability: () => ({ data: state.slots, isFetching: state.checking, refetch: vi.fn() }) }));
vi.mock('./ServiceBookingSheet', () => ({ ServiceBookingSheet: ({ service, initialDate }: { service: { id: string } | null; initialDate: string }) => service ? <output data-testid="booking-date">{initialDate}</output> : null }));
const make = (id: string, currency = 'THB', count: number | null = null): MarketplaceService => ({ id, provider_id: id,
  name_en: `Test ${id}`, name_ru: null, description_en: null, description_ru: null, price: 100, currency, duration_minutes: 60,
  lead_time_hours: 2, images: [], is_active: true, approval_status: 'approved', location: { district: 'Rawai' },
  provider: { id, name: `Provider ${id}`, is_verified: false, logo_url: null, rating: count ? 4.8 : null, review_count: count },
});
const concierge = vi.fn();
function Harness() { const location = useLocation(); return <><MarketplaceServiceGrid search={new URLSearchParams(location.search).get('q') || ''} returnTo={`${location.pathname}${location.search}`} onConcierge={concierge} /><output data-testid="url">{location.search}{location.hash}|{JSON.stringify(location.state)}</output></>; }
const mount = (search = '') => render(<MemoryRouter initialEntries={[{ pathname: '/discover/services', search, hash: '#offers', state: { from: 'trip' } }]}><Harness /></MemoryRouter>);
beforeEach(() => { state.services = [make('a'), make('b', 'USD')]; state.slots = {}; state.checking = false; concierge.mockClear(); });
describe('marketplace discovery integration', () => {
  it('distinguishes schedule API failures from missing schedules', () => {
    state.slots = { a: { status: 'unknown', date: '2099-01-01', error: 'schedule-read-failed' }, b: { status: 'unknown', date: '2099-01-01' } };
    mount('?date=2099-01-01');
    expect(screen.getByRole('alert')).toHaveTextContent('Some schedules could not be checked');
    expect(screen.getByText(/schedule is unknown for 1 offers/)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Retry schedule check' })).toBeVisible();
  });
  it('filters price in one currency and preserves unrelated URL/context', () => {
    mount('?ref=trip');
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Max price' }), { target: { value: '200' } });
    expect(screen.getByText('Test a')).toBeVisible();
    expect(screen.queryByText('Test b')).toBeNull();
    expect(screen.getByTestId('url')).toHaveTextContent('ref=trip');
    expect(screen.getByTestId('url')).toHaveTextContent('maxPrice=200');
    expect(screen.getByTestId('url')).toHaveTextContent('#offers|{"from":"trip"}');
    fireEvent.click(screen.getByRole('button', { name: 'Clear offer filters' }));
    expect(screen.getByText('Test b')).toBeVisible();
    expect(screen.getByTestId('url')).not.toHaveTextContent('maxPrice=');
  });
  it('filters an exact area and offers concierge when nothing matches', () => {
    mount('?district=Kata');
    expect(screen.queryByText('Test a')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Find a service with concierge' }));
    expect(concierge).toHaveBeenCalledOnce();
  });
  it('excludes unknown and unavailable schedules on a selected future date', () => {
    state.slots = { a: { status: 'available', date: '2099-01-01' }, b: { status: 'unknown', date: '2099-01-01' } };
    mount('?date=2099-01-01');
    expect(screen.getByText('Test a')).toBeVisible();
    expect(screen.queryByText('Test b')).toBeNull();
    expect(screen.getByText(/schedule is unknown for 1 offers/)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Request service' }));
    expect(screen.getByTestId('booking-date')).toHaveTextContent('2099-01-01');
  });
  it('does not misreport loading schedules as empty', () => {
    state.checking = true;
    mount('?date=2099-01-01');
    expect(screen.getByText('Checking request slots…')).toBeVisible();
    expect(screen.queryByText(/No confirmed offers match/)).toBeNull();
  });
  it('popular cards do not duplicate in the remaining catalogue', () => {
    state.services = [make('a', 'THB', 15), make('b')];
    mount();
    const section = screen.getByRole('heading', { name: 'Popular now' }).closest('section')!;
    expect(within(section).getByText('Test a')).toBeVisible();
    expect(screen.getAllByText('Test a')).toHaveLength(1);
    expect(screen.getByText(/not live booking demand/)).toBeVisible();
  });
  it('does not invent popularity when review evidence is absent', () => {
    mount();
    expect(screen.queryByRole('heading', { name: 'Popular now' })).toBeNull();
  });
});
