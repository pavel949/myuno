import { cleanup, fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import CommercialIndex from '../CommercialIndex';
import CommercialDetail from '../CommercialDetail';
import LandIndex from '../LandIndex';
import LandDetail from '../LandDetail';
import HotelsIndex from '../HotelsIndex';
import DevelopersIndex from '../DevelopersIndex';
import { CommercialFilters } from '@/components/property/commercial/CommercialFilters';
import { HotelFiltersSheet } from '@/components/property/commercial/HotelFilters';
import type { CommercialProperty } from '@/hooks/useCommercialProperties';
const state = vi.hoisted(() => ({ language: 'en', data: [] as CommercialProperty[], record: null as CommercialProperty | null, isLoading: false, error: null as Error | null, retry: vi.fn() }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/contexts/CurrencyContext', () => ({ useCurrency: () => ({ formatPrice: (n: number) => `THB ${n}` }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('@/components/seo', () => ({ SEOHead: () => null }));
vi.mock('@/hooks/useCommercialProperties', () => ({
  useCommercialProperties: () => ({ data: state.data, error: state.error, isLoading: state.isLoading, refetch: state.retry }),
  useLandPlots: () => ({ data: state.data, error: state.error, isLoading: state.isLoading, refetch: state.retry }),
  useCommercialProperty: () => ({ data: state.record, error: state.error, isLoading: state.isLoading, refetch: state.retry }),
}));
vi.mock('@/hooks/useHotelProperties', () => ({ useHotelProperties: () => ({ data: state.data, error: state.error, isLoading: state.isLoading, refetch: state.retry }) }));
vi.mock('@/hooks/useDevelopers', () => ({ useDevelopers: () => ({ data: [], isLoading: state.isLoading, isError: !!state.error, refetch: state.retry }) }));
vi.mock('@/components/property/commercial/HotelHeroBanner', () => ({ HotelHeroBanner: () => null }));
vi.mock('@/components/property/commercial/HotelManagementLeadSheet', () => ({ HotelManagementLeadSheet: () => null }));
function Position() { const l = useLocation(); return <output data-testid="location">{l.pathname + l.search}</output>; }
function mount(element: React.ReactNode, path = '/property/commercial') { return render(<MemoryRouter initialEntries={[path]}>{element}<Position /></MemoryRouter>); }
const fixture: CommercialProperty = { id: '11111111-1111-4111-8111-111111111111', title_en: 'Synthetic office', title_ru: 'Тестовый офис', listing_type: 'sale', property_type: 'office', asset_class: 'commercial', created_at: '2026-11-16', sale_price: 200000, sale_currency: 'USD' };
beforeEach(() => { state.language = 'en'; state.data = []; state.record = null; state.error = null; state.isLoading = false; state.retry.mockClear(); });
afterEach(cleanup);
describe('public property read and URL recovery', () => {
  it.each([CommercialIndex, LandIndex, HotelsIndex, DevelopersIndex])('offers retry instead of pretending a failed catalogue is empty', Page => {
    state.error = new Error('private diagnostic'); mount(<Page />);
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load data');
    expect(screen.queryByText('private diagnostic')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' })); expect(state.retry).toHaveBeenCalledOnce();
  });
  it.each([CommercialDetail, LandDetail])('does not report a failed detail as missing', Page => {
    state.error = new Error('failed read'); mount(<Page />);
    expect(screen.getByRole('alert')).toBeVisible();
    expect(screen.queryByText('Listing not found')).toBeNull(); expect(screen.queryByText('Plot not found')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Go back' }));
    expect(screen.getByTestId('location')).toHaveTextContent(Page === LandDetail ? '/property/land' : '/property/commercial');
  });
  it('never shows a residential record as a land plot', () => { state.record = { ...fixture, asset_class: 'residential' }; mount(<LandDetail />); expect(screen.getByText('Plot not found')).toBeVisible(); expect(screen.queryByText('Synthetic office')).toBeNull(); });
  it('never shows an office as a hotel', () => { state.record = fixture; mount(<CommercialDetail />, '/property/hotels/' + fixture.id); expect(screen.getByText('Listing not found')).toBeVisible(); });
  it.each(['intent=bogus', 'minPrice=100&maxPrice=50', 'minArea=-1', 'tenant=1'])('does not broaden an invalid or unavailable filter into all offers: %s', query => {
    state.data = [fixture]; mount(<CommercialIndex />, '/property/commercial?' + query + '&ref=fixture');
    expect(screen.getByRole('alert')).toBeVisible(); expect(screen.queryByText('Synthetic office')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Reset filters' })); expect(screen.getByTestId('location')).toHaveTextContent('/property/commercial?ref=fixture');
  });
  it('makes hotel management an enquiry rather than a false empty catalogue', () => {
    mount(<HotelsIndex />, '/property/hotels?mode=management');
    expect(screen.getByRole('heading', { name: 'Operator opportunities — by enquiry' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Discuss a property' })).toBeVisible();
    expect(screen.queryByText('No listings yet')).toBeNull();
  });
  it('returns from a commercial detail to the complete source filter URL', () => {
    state.data = [fixture]; state.record = fixture;
    mount(<Routes><Route path="/property/commercial" element={<CommercialIndex />} /><Route path="/property/commercial/:id" element={<CommercialDetail />} /></Routes>, '/property/commercial?intent=sale&type=office&ref=fixture');
    fireEvent.click(screen.getByRole('link', { name: /Synthetic office/ }));
    expect(screen.getByRole('heading', { name: 'Synthetic office' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Go back' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/property/commercial?intent=sale&type=office&ref=fixture');
  });
});
describe('public filter drawers', () => {
  it('refreshes the draft from the current URL values on each open', async () => {
    const change = vi.fn(); const view = mount(<CommercialFilters value={{ minPrice: '100' }} onChange={change} />);
    fireEvent.click(screen.getByRole('button', { name: /^Filters/ })); expect(screen.getByLabelText('Minimum sale price, THB')).toHaveValue(100);
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Apply' })); await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    view.rerender(<MemoryRouter><CommercialFilters value={{ minPrice: '300' }} onChange={change} /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: /^Filters/ })); expect(screen.getByLabelText('Minimum sale price, THB')).toHaveValue(300);
    expect(screen.queryByLabelText('With current tenant')).toBeNull();
  });
  it('does not advertise a monthly price filter without a comparable public tariff', () => {
    mount(<CommercialFilters value={{}} onChange={vi.fn()} priceEnabled={false} />); fireEvent.click(screen.getByRole('button', { name: /^Filters/ }));
    expect(screen.queryByLabelText('Minimum sale price, THB')).toBeNull(); expect(screen.getByText('Confirm rental pricing and billing period for each listing.')).toBeVisible();
  });
  it('keeps private hotel occupancy and management filters out of the public drawer', () => {
    mount(<HotelFiltersSheet value={{}} onChange={vi.fn()} />); fireEvent.click(screen.getByRole('button', { name: /^Filters/ }));
    expect(screen.getByLabelText('Minimum rooms')).toBeVisible(); expect(screen.getByLabelText('License type')).toBeVisible();
    expect(screen.queryByText('Management status')).toBeNull(); expect(screen.queryByText('Min occupancy, %')).toBeNull();
  });
});
