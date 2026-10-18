import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { PROPERTY_FEATURE_MAP } from '@/lib/config/propertyFeatures';
import PropertySearchPage from '../PropertySearchPage';
import PropertySearchRedirect from '@/components/property/PropertySearchRedirect';
import GoalEntryPage from '@/pages/discover/GoalEntryPage';

const state = vi.hoisted(() => ({ filters: {} as Record<string, unknown>, mobile: false }));
vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => state.mobile }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/hooks/useProperties', () => ({ usePropertiesInfinite: (filters: Record<string, unknown>) => { state.filters = filters; return { data: { pages: [{ properties: [] }] }, isLoading: false, isError: false }; } }));
vi.mock('@/hooks/useManagementCompanies', () => ({ useManagementCompanies: () => ({ data: [] }) }));
vi.mock('@/hooks/usePropertyQuickFilters', () => ({ usePropertyQuickFilters: () => ({ districts: [{ id: 'layan', valueKey: 'layan', labelEn: 'Layan', labelRu: 'Лаян' }], isLoading: false }), applyQuickFilters: (items: unknown) => items }));
vi.mock('@/hooks/usePropertyFilterOptions', () => ({ usePropertyFilterOptions: () => ({ propertyTypes: [{ id: 'villa', labelEn: 'Villa', labelRu: 'Вилла' }], filterConfig: { sections: [] }, isLoading: false }) }));
vi.mock('@/hooks/useMapListSync', () => ({ useMapListSync: () => ({ selectedId: null, select: vi.fn() }) }));
vi.mock('@/components/property/PropertyListingCard', () => ({ PropertyListingCard: () => null }));
vi.mock('@/components/property/PropertyMapView', () => ({ PropertyMapView: () => null }));
vi.mock('@/components/property/PropertyCategoryIcons', () => ({ PropertyCategoryIcons: () => null, matchesCategory: () => true }));
vi.mock('@/components/crosssell', () => ({ CrossSellSection: () => null }));
vi.mock('@/components/leads/VerticalCTA', () => ({ VerticalCTA: () => null }));
vi.mock('@/components/property/OffplanCTASection', () => ({ OffplanCTASection: () => null }));
vi.mock('@/components/uno/BackButton', () => ({ BackButton: () => null }));
vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('@/pages/services/ServicesIndex', () => ({ default: () => null }));

function Location() {
  const location = useLocation(); const navigate = useNavigate();
  return <><output data-testid="location">{location.pathname}{location.search}{location.hash}</output><button onClick={() => navigate(-1)}>History back</button><button onClick={() => navigate(1)}>History forward</button></>;
}
function mount(entry: string) {
  return render(<MemoryRouter initialEntries={[entry]}><Location /><Routes>
    <Route path="/property/search" element={<PropertySearchPage />} />
    <Route path="/property/browse" element={<PropertySearchRedirect />} />
    <Route path="/discover/stay" element={<GoalEntryPage goal="stay" />} />
    <Route path="/property/rent/medium-term" element={<PropertySearchRedirect defaults={{ mode: 'rent', tenancy: 'medium' }} />} />
  </Routes></MemoryRouter>);
}
beforeEach(() => { state.mobile = false; Element.prototype.scrollIntoView = vi.fn(); });
afterEach(cleanup);

describe('one residential results surface', () => {
  it('starts mobile with a readable summary and expands only one editor', () => {
    state.mobile = true;
    mount('/property/search?district=layan&types=villa&guests=3&tenancy=medium&checkIn=2027-11-10&checkOut=2027-11-15');
    expect(screen.queryByRole('form')).toBeNull();
    expect(screen.getByText('Villa · Layan')).toBeVisible();
    expect(screen.getByText(/Monthly ·.*Guests: 3/)).toBeVisible();
    const edit = screen.getByRole('button', { name: 'Edit search' });
    expect(edit).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(edit);
    expect(screen.getAllByRole('form')).toHaveLength(1);
    expect(screen.getByRole('spinbutton')).toHaveValue(3);
    const close = screen.getByRole('button', { name: 'Close search' });
    close.focus();
    fireEvent.click(close);
    expect(screen.queryByRole('form')).toBeNull();
    expect(screen.getByRole('button', { name: 'Edit search' })).toHaveFocus();
  });
  it('shows no implied guest restriction for legacy unfiltered browsing', () => {
    state.mobile = true;
    mount('/property/browse');
    expect(screen.getByText(/Guests not specified/)).toBeVisible();
    expect(screen.queryByText(/Guests: 2/)).toBeNull();
  });
  it('retains an edited desktop draft and focus when resized to mobile', () => {
    const view = mount('/property/search?guests=3');
    const guests = screen.getByRole('spinbutton');
    guests.focus();
    fireEvent.change(guests, { target: { value: '5' } });
    state.mobile = true;
    view.rerender(<MemoryRouter initialEntries={['/property/search?guests=3']}><Location /><Routes><Route path="/property/search" element={<PropertySearchPage />} /></Routes></MemoryRouter>);
    expect(screen.getByRole('spinbutton')).toHaveValue(5);
    expect(screen.getByRole('spinbutton')).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Close search' })).toHaveAttribute('aria-expanded', 'true');
  });
  it('does not invent dates and hides retained rental context in the purchase summary', () => {
    state.mobile = true;
    const view = mount('/property/search?guests=3');
    expect(screen.getByText(/Any dates/)).toBeVisible();
    view.unmount();
    mount('/property/search?mode=buy&checkIn=2027-11-10&checkOut=2027-11-15&guests=3');
    expect(screen.getByText('Buy')).toBeVisible();
    expect(screen.queryByText(/Guests:/)).toBeNull();
    expect(screen.queryByText(/Nov/)).toBeNull();
  });
  it('collapses submitted mobile edits and focuses results, but history does not steal focus', () => {
    state.mobile = true;
    mount('/property/search?guests=3');
    fireEvent.click(screen.getByRole('button', { name: 'Edit search' }));
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '5' } });
    fireEvent.submit(screen.getByRole('form'));
    expect(screen.queryByRole('form')).toBeNull();
    expect(screen.getByRole('heading', { level: 1 })).toHaveFocus();
    expect(screen.getByText(/Guests: 5/)).toBeVisible();
    const back = screen.getByRole('button', { name: 'History back' });
    back.focus();
    fireEvent.click(back);
    expect(screen.getByText(/Guests: 3/)).toBeVisible();
    expect(back).toHaveFocus();
    expect(screen.queryByRole('form')).toBeNull();
  });
  it('keeps desktop editor visible without scrolling or focusing results on submit', () => {
    mount('/property/search?guests=3');
    expect(screen.queryByRole('button', { name: 'Edit search' })).toBeNull();
    fireEvent.submit(screen.getByRole('form'));
    expect(screen.getByRole('form')).toBeVisible();
    expect(screen.getByRole('heading', { level: 1 })).not.toHaveFocus();
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });
  it.each(['/property/browse', '/discover/stay', '/property/rent/medium-term'])('adapts %s with filters and hash intact', route => {
    mount(`${route}?district=layan&types=villa&guests=4&tenancy=medium&f.priceLevel=2&company=operator&source=bookmark#results`);
    expect(screen.getByTestId('location').textContent).toContain('/property/search?');
    const url = new URL(screen.getByTestId('location').textContent!, 'https://myuno.app');
    expect(url.searchParams.get('source')).toBe('bookmark');
    expect(url.hash).toBe('#results');
    expect(screen.getAllByRole('form')).toHaveLength(1);
    expect(screen.getByRole('combobox', { name: 'Home type' })).toHaveTextContent('Villa');
    expect(screen.getByRole('combobox', { name: 'Choose an area' })).toHaveTextContent('Layan');
    expect(state.filters).toMatchObject({ district: 'layan', propertyType: 'villa', minGuests: 4, rentTenancy: 'medium', managementCompanyId: 'operator', minPrice: 3000 });
  });
  it('edits the URL in place and rehydrates on Back and Forward', () => {
    mount('/property/search?district=layan&types=villa&guests=3&tenancy=short&source=bookmark');
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Number of guests' }), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Monthly' }));
    fireEvent.submit(screen.getByRole('form'));
    expect(state.filters).toMatchObject({ minGuests: 5, rentTenancy: 'medium' });
    expect(screen.getByTestId('location').textContent).toContain('source=bookmark');
    fireEvent.click(screen.getByRole('button', { name: 'History back' }));
    expect(screen.getByRole('spinbutton')).toHaveValue(3);
    expect(state.filters.rentTenancy).toBe('short');
    fireEvent.click(screen.getByRole('button', { name: 'History forward' }));
    expect(screen.getByRole('spinbutton')).toHaveValue(5);
    expect(state.filters.rentTenancy).toBe('medium');
  });
  it('does not add an implicit guest restriction to an unfiltered legacy catalogue', () => {
    mount('/property/browse');
    expect(state.filters.minGuests).toBeUndefined();
  });
  it('keeps sale price and quick-sale semantics without rental guest filtering', () => {
    mount('/property/browse?mode=buy&intent=quick_sale&f.priceLevel=2&f.district=layan&f.propertyType=villa&guests=8&instant=1&f.instantBooking=yes');
    expect(screen.queryByRole('spinbutton')).toBeNull();
    expect(state.filters).toMatchObject({ listingType: 'sale', district: 'layan', propertyType: 'villa', saleIntent: 'quick_sale', isQuickSale: true, minPrice: 5000000, maxPrice: 15000000 });
    expect(state.filters.minGuests).toBeUndefined();
    expect(state.filters.instantBooking).toBeUndefined();
  });
  it('does not resurrect explicitly cleared legacy constraints when editing categories', () => {
    mount('/property/search?instant=0&f.instantBooking=yes&bedrooms=&f.bedrooms=2&cats=pool');
    expect(state.filters.instantBooking).toBeUndefined();
    expect(state.filters.minBedrooms).toBeUndefined();
    fireEvent.click(screen.getByRole('button', { name: `Remove ${PROPERTY_FEATURE_MAP.get('pool')!.labelEn}` }));
    expect(state.filters.instantBooking).toBeUndefined();
    expect(state.filters.minBedrooms).toBeUndefined();
    const url = new URL(screen.getByTestId('location').textContent!, 'https://myuno.app');
    expect(url.searchParams.has('f.instantBooking')).toBe(false);
    expect(url.searchParams.has('f.bedrooms')).toBe(false);
  });
  it('lets legacy feature bookmarks be removed individually without dropping unrelated filters', () => {
    mount('/property/search?amenities=pool,wifi&cats=sea_view&f.priceLevel=2&source=bookmark');
    fireEvent.click(screen.getByRole('button', { name: `Remove ${PROPERTY_FEATURE_MAP.get('pool')!.labelEn}` }));
    const url = new URL(screen.getByTestId('location').textContent!, 'https://myuno.app');
    expect(url.searchParams.has('amenities')).toBe(false);
    expect(url.searchParams.get('cats')?.split(',')).toEqual(['sea_view', 'wifi']);
    expect(url.searchParams.get('f.priceLevel')).toBe('2');
    expect(url.searchParams.get('source')).toBe('bookmark');
  });
});
