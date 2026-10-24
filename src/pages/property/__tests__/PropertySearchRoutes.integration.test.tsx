import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation, useNavigate, parsePath } from 'react-router-dom';
import { PROPERTY_FEATURE_MAP } from '@/lib/config/propertyFeatures';
import PropertySearchPage from '../PropertySearchPage';
import { CompareProvider } from '@/components/property/PropertyCompare';
import PropertySearchRedirect from '@/components/property/PropertySearchRedirect';
import GoalEntryPage from '@/pages/discover/GoalEntryPage';
import { PropertyHubIndex } from '@/components/layout/routes/propertyHubRoutes';

const state = vi.hoisted(() => ({ filters: {} as Record<string, unknown>, mobile: false, language: 'en', loading: false, properties: [] as Record<string, unknown>[] }));
const calendar = vi.hoisted(() => ({ pending: false, failed: false, hasNextPage: false }));
vi.mock('@/hooks/useSearchPropertyAvailability', () => ({ useSearchPropertyAvailability: (_ids: string[], start?: string, end?: string) => ({ enabled: !!start && !!end, availableIds: new Set(), pending: calendar.pending, failed: calendar.failed, retry: vi.fn() }) }));
vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => state.mobile }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/hooks/useProperties', () => ({ usePropertiesInfinite: (filters: Record<string, unknown>) => { state.filters = filters; return { data: { pages: [{ properties: state.properties }] }, isLoading: state.loading, isError: false, hasNextPage: calendar.hasNextPage, fetchNextPage: vi.fn() }; } }));
vi.mock('@/hooks/useManagementCompanies', () => ({ useManagementCompanies: () => { throw new Error('Guest discovery must not fetch management companies'); } }));
vi.mock('@/hooks/usePropertyQuickFilters', () => ({ usePropertyQuickFilters: () => ({ districts: [{ id: 'layan', valueKey: 'layan', labelEn: 'Layan', labelRu: 'Лаян' }], isLoading: false }), applyQuickFilters: (items: unknown) => items }));
vi.mock('@/hooks/usePropertyFilterOptions', () => ({ usePropertyFilterOptions: () => ({ propertyTypes: [{ id: 'villa', labelEn: 'Villa', labelRu: 'Вилла' }], filterConfig: { sections: [] }, isLoading: false }) }));
vi.mock('@/hooks/useMapListSync', () => ({ useMapListSync: () => ({ selectedId: null, select: vi.fn() }) }));
vi.mock('@/components/property/PropertyListingCard', () => ({ PropertyListingCard: ({ property }: { property: { id: string } }) => <article data-testid="synthetic-property-card">{property.id}</article> }));
vi.mock('@/components/property/PropertyMapView', () => ({ PropertyMapView: ({ properties, className }: { properties: unknown[]; className: string }) => <div data-testid="existing-map-boundary" data-property-count={properties.length} className={className} /> }));
vi.mock('@/components/crosssell', () => ({ CrossSellSection: () => null }));
vi.mock('@/components/leads/VerticalCTA', () => ({ VerticalCTA: () => null }));
vi.mock('@/components/property/OffplanCTASection', () => ({ OffplanCTASection: () => null }));
vi.mock('@/components/uno/BackButton', () => ({ BackButton: () => null }));
vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('@/pages/services/ServicesIndex', () => ({ default: () => null }));

function Location() {
  const location = useLocation(); const navigate = useNavigate();
  return <><output hidden data-testid="navigation-state">{JSON.stringify(location.state)}</output><output data-testid="location">{location.pathname}{location.search}{location.hash}</output><button onClick={() => navigate(-1)}>History back</button><button onClick={() => navigate(1)}>History forward</button></>;
}
function mount(entry: string, navigationState?: unknown) {
  const initialEntry = navigationState === undefined ? entry : { ...parsePath(entry), state: navigationState };
  const result = render(<MemoryRouter initialEntries={[initialEntry]}><Location /><Routes>
    <Route path="/property/search" element={<PropertySearchPage />} />
    <Route path="/property" element={<PropertyHubIndex />} />
    <Route path="/property/browse" element={<PropertySearchRedirect />} />
    <Route path="/discover/stay" element={<GoalEntryPage goal="stay" />} />
    <Route path="/property/rent/medium-term" element={<PropertySearchRedirect defaults={{ mode: 'rent', tenancy: 'medium' }} />} />
  </Routes></MemoryRouter>);
  fireEvent.click(result.container.querySelector('summary')!);
  return result;
}
beforeEach(() => { state.language = 'en'; state.loading = false; state.properties = []; calendar.pending = false; calendar.failed = false; calendar.hasNextPage = false; state.mobile = false; Element.prototype.scrollIntoView = vi.fn(); });
afterEach(cleanup);

describe('one residential results surface', () => {
  it.each([
    ['en', 'Pool', 'Remove Pool', 'Price & amenities', 'Popular features'],
    ['ru', 'Бассейн', 'Убрать Бассейн', 'Цена и удобства', 'Популярные удобства'],
    ['th', 'สระว่ายน้ำ', 'นำออก สระว่ายน้ำ', 'ราคาและสิ่งอำนวยความสะดวก', 'สิ่งอำนวยความสะดวกยอดนิยม'],
  ])('uses the broad pool intent consistently in actual %s selected chip and sheet', (language, label, remove, trigger, group) => {
    state.language = language;
    mount('/property/search?cats=pool');
    expect(screen.getByRole('button', { name: remove })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${trigger}`) }));
    const section = screen.getByRole('heading', { name: group }).parentElement!;
    expect(within(section).getByRole('button', { name: label })).toHaveAttribute('aria-pressed', 'true');
    expect(within(section).queryByRole('button', { name: 'Shared pool' })).toBeNull();
    expect(PROPERTY_FEATURE_MAP.get('pool')!.labelEn).toBe('Shared pool');
  });

  it('preserves a result bookmark hash and unapplied editor draft through sort history', async () => {
    mount('/property/search?q=sea&guests=3&opaque=keep#results', { origin: 'synthetic-home' });
    fireEvent.change(screen.getByRole('searchbox', { name: 'Property name' }), { target: { value: 'Draft Synthetic' } });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Number of guests' }), { target: { value: '5' } });
    fireEvent.keyDown(screen.getByRole('combobox', { name: 'Sort homes' }), { key: 'Enter' });
    fireEvent.keyDown(await screen.findByRole('option', { name: 'Price: Low → High' }), { key: 'Enter' });
    const current = () => new URL(screen.getByTestId('location').textContent!, 'https://myuno.app');
    expect(current().hash).toBe('#results');
    expect(screen.getByTestId('navigation-state')).toHaveTextContent(JSON.stringify({ origin: 'synthetic-home' }));
    expect(current().searchParams.get('sort')).toBe('price_asc');
    expect(current().searchParams.get('q')).toBe('sea');
    expect(current().searchParams.get('opaque')).toBe('keep');
    expect(screen.getByRole('searchbox', { name: 'Property name' })).toHaveValue('Draft Synthetic');
    expect(screen.getByRole('spinbutton', { name: 'Number of guests' })).toHaveValue(5);
    fireEvent.click(screen.getByRole('button', { name: 'History back' }));
    expect(current().hash).toBe('#results');
    expect(screen.getByTestId('navigation-state')).toHaveTextContent(JSON.stringify({ origin: 'synthetic-home' }));
    expect(screen.getByRole('combobox', { name: 'Sort homes' })).toHaveTextContent('Recommended');
    fireEvent.click(screen.getByRole('button', { name: 'History forward' }));
    expect(current().hash).toBe('#results');
    expect(screen.getByTestId('navigation-state')).toHaveTextContent(JSON.stringify({ origin: 'synthetic-home' }));
    expect(screen.getByRole('combobox', { name: 'Sort homes' })).toHaveTextContent('Price: Low → High');
    expect(screen.getByRole('searchbox', { name: 'Property name' })).toHaveValue('Draft Synthetic');
    expect(screen.getByRole('spinbutton', { name: 'Number of guests' })).toHaveValue(5);
    fireEvent.submit(screen.getByRole('form'));
    expect(current().searchParams.get('q')).toBe('Draft Synthetic');
    expect(current().searchParams.get('guests')).toBe('5');
    expect(current().searchParams.get('sort')).toBe('price_asc');
  });

  it('uses the same wide catalogue columns for loaded homes and skeletons without a second form frame', () => {
    state.loading = true;
    const loading = mount('/property/search?source=wide-layout');
    const columns = screen.getByTestId('property-results-skeleton').className;
    expect(loading.container.querySelector('.property-discovery')).toHaveClass('ds-frame', 'ds-frame-catalogue');
    expect(loading.container.querySelector('.property-discovery-editor')).not.toHaveClass('journey-primary');
    cleanup();
    state.loading = false;
    state.properties = [{ id: 'synthetic-wide-home', title_en: 'Synthetic wide home', listing_type: 'rent', monthly_rent: 1000 }];
    mount('/property/search?source=wide-layout');
    expect(screen.getByTestId('property-results-grid')).toHaveClass('min-[1440px]:grid-cols-4');
    expect(screen.getByTestId('property-results-grid').className).toBe(columns);
    expect(screen.getAllByTestId('synthetic-property-card')).toHaveLength(1);
  });
  it('keeps the existing map and list in separate responsive regions with identical filtered homes', async () => {
    state.properties = [{ id: 'synthetic-map-home', title_en: 'Synthetic map home', listing_type: 'rent', monthly_rent: 1000 }];
    const view = mount('/property/search?view=map&source=wide-layout');
    const regions = view.container.querySelector('.property-discovery-results--map');
    expect(regions).toContainElement(await screen.findByTestId('existing-map-boundary'));
    expect(regions).toContainElement(screen.getByTestId('property-results-grid'));
    expect(screen.getByTestId('existing-map-boundary')).toHaveAttribute('data-property-count', '1');
    expect(screen.getByTestId('existing-map-boundary')).toHaveClass('property-discovery-map');
    fireEvent.click(screen.getByRole('button', { name: 'List' }));
    expect(screen.queryByTestId('existing-map-boundary')).not.toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('source=wide-layout');
    fireEvent.click(screen.getByRole('button', { name: 'History back' }));
    expect(screen.getByTestId('existing-map-boundary')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('view=map');
  });
  it.each([['rent-month', 'medium', 'Monthly'], ['rent-long', 'long', 'Yearly']])('hydrates the legacy %s persona bookmark through the catalogue alias', (intent, tenancy, label) => {
    mount(`/property?intent=${intent}&persona=P3&returnTo=%2Ffor%2Flong-stay#anchor`);
    expect(screen.getByRole('button', { name: label })).toHaveAttribute('aria-pressed', 'true');
    expect(state.filters.rentTenancy).toBe(tenancy);
    expect(screen.getByTestId('location')).toHaveTextContent(`intent=${intent}`);
    expect(screen.getByTestId('location')).toHaveTextContent('persona=P3');
    expect(screen.getByTestId('location')).toHaveTextContent('returnTo=%2Ffor%2Flong-stay');
    expect(screen.getByTestId('location')).toHaveTextContent('#anchor');
  });
  it('opens a persisted comparison from the results actions without an overlay', () => {
    localStorage.setItem('myuno_compare_properties', JSON.stringify([{ id: 'one', title_en: 'Saved home', mode: 'rent' }]));
    render(<MemoryRouter initialEntries={['/property/search']}><CompareProvider><PropertySearchPage /></CompareProvider></MemoryRouter>);
    const compare = screen.getByRole('button', { name: 'Compare (1)' });
    expect(compare.closest('.property-discovery-result-actions')).not.toBeNull();
    expect(compare.closest('.fixed')).toBeNull();
    fireEvent.click(compare);
    expect(screen.getByRole('heading', { name: 'Compare properties' })).toBeInTheDocument();
    localStorage.removeItem('myuno_compare_properties');
  });
  it.each([1, 2, 3, 4])('maps the %s+ bookmark to a minimum and preserves it when secondary filters reset', minimum => {
    mount(`/property/search?bedrooms=${minimum}%2B&cats=pool`);
    expect(state.filters.minBedrooms).toBe(minimum);
    fireEvent.click(screen.getByRole('button', { name: /Price & amenities/ }));
    const dialog = within(screen.getByRole('dialog'));
    expect(dialog.queryByText('Bedrooms', { exact: true })).toBeNull();
    fireEvent.click(dialog.getByRole('button', { name: 'Reset' }));
    fireEvent.click(dialog.getByRole('button', { name: /Apply/ }));
    expect(state.filters.minBedrooms).toBe(minimum);
    expect(screen.getByRole('combobox', { name: 'Bedrooms' })).toHaveTextContent(`${minimum}+`);
  });
  it('applies minimum bedrooms and restores the primary selector through history and reset', () => {
    mount('/property/search?f.bedrooms=studio&source=bookmark');
    fireEvent.keyDown(screen.getByRole('combobox', { name: 'Bedrooms' }), { key: 'Enter' });
    fireEvent.click(screen.getByRole('option', { name: '2+' }));
    fireEvent.submit(screen.getByRole('form'));
    expect(state.filters.minBedrooms).toBe(2);
    expect(state.filters.bedrooms).toBeUndefined();
    expect(screen.getByTestId('location')).toHaveTextContent('bedrooms=2%2B');
    expect(screen.getByTestId('location')).toHaveTextContent('source=bookmark');
    fireEvent.click(screen.getByRole('button', { name: 'History back' }));
    expect(screen.getByRole('combobox', { name: 'Bedrooms' })).toHaveTextContent('Studio');
    expect(state.filters.bedrooms).toBe('studio');
    fireEvent.click(screen.getByRole('button', { name: 'History forward' }));
    expect(screen.getByRole('combobox', { name: 'Bedrooms' })).toHaveTextContent('2+');
    expect(state.filters.minBedrooms).toBe(2);
    fireEvent.click(screen.getByRole('button', { name: 'Clear all' }));
    expect(state.filters.minBedrooms).toBeUndefined();
    expect(screen.getByRole('combobox', { name: 'Bedrooms' })).toHaveTextContent('Any');
  });
  it.each([
    ['th', 'ค้นหาที่พักในภูเก็ต', 'เช่า', 'ซื้อ', 'ราคาและสิ่งอำนวยความสะดวก', 'เรียงลำดับที่พัก', 'ตัวกรอง', 'ใช้ตัวกรอง', 'สระว่ายน้ำส่วนตัว'],
    ['ru', 'Найдите ваш дом на Пхукете', 'Аренда', 'Покупка', 'Цена и удобства', 'Сортировка', 'Фильтры', 'Применить', 'Свой бассейн'],
  ])('renders search and filter controls in %s without changing the query', (language, heading, rent, buy, filters, sort, sheet, apply, pool) => {
    state.language = language;
    mount('/property/search?mode=rent&q=Title');
    expect(screen.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    expect(screen.getByRole('button', { name: rent })).toBeVisible();
    expect(screen.getByRole('button', { name: buy })).toBeVisible();
    expect(screen.getByRole('combobox', { name: sort })).toBeVisible();
    expect(screen.getByRole('button', { name: pool })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: filters }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(sheet, { exact: true })).toBeVisible();
    expect(within(dialog).getByRole('button', { name: apply })).toBeVisible();
    fireEvent.click(within(dialog).getByRole('button', { name: apply }));
    expect(screen.getByTestId('location')).toHaveTextContent('mode=rent&q=Title');
  });
  it.each([false, true])('discloses checked-night filtering without changing selected dates (mobile=%s)', mobile => {
    state.mobile = mobile;
    mount('/property/search?mode=rent&checkIn=2027-11-10&checkOut=2027-11-15&guests=3');
    expect(screen.getByRole('status', { name: 'Availability check' })).toHaveTextContent('Only homes without blocked calendar nights');
    expect(screen.getByTestId('location')).toHaveTextContent('checkIn=2027-11-10&checkOut=2027-11-15&guests=3');
  });
  it.each([
    '/property/search',
    '/property/search?mode=buy&checkIn=2027-11-10&checkOut=2027-11-15',
    '/property/search?checkIn=2027-11-10',
    '/property/search?checkIn=2027-11-15&checkOut=2027-11-10',
    '/property/search?checkIn=invalid&checkOut=2027-11-15',
  ])('does not display a rental-date notice for %s', route => {
    mount(route);
    expect(screen.queryByText(/Only homes without blocked calendar nights/)).toBeNull();
  });
  it.each(['pending', 'failed', 'hasNextPage'] as const)('does not claim empty results while availability is %s', status => {
    calendar[status] = true;
    mount('/property/search?mode=rent&checkIn=2027-11-10&checkOut=2027-11-15');
    expect(screen.queryByText('No properties found')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Checked date matches: 0' })).toBeVisible();
    if (status === 'pending') expect(screen.getByRole('status', { name: 'Availability check' })).toHaveTextContent('Checking availability');
    if (status === 'failed') expect(screen.getByRole('alert')).toHaveTextContent('could not be checked');
    if (status === 'hasNextPage') expect(screen.getByRole('button', { name: 'Load more' })).toBeVisible();
  });
  it.each([false, true])('shows one editable form immediately (mobile=%s)', mobile => {
    state.mobile = mobile;
    mount('/property/search?district=layan&types=villa&guests=3&tenancy=medium');
    expect(screen.getAllByRole('form')).toHaveLength(1);
    expect(screen.getByRole('searchbox', { name: 'Property name' })).toBeVisible();
    expect(screen.getByRole('spinbutton', { hidden: true })).toHaveValue(3);
    expect(screen.getByText('Villa · Layan')).toBeVisible();
  });
  it('submits a property name to server filters, preserves it through history and clears it', () => {
    mount('/property/search?district=layan&source=bookmark');
    fireEvent.change(screen.getByRole('searchbox', { hidden: true }), { target: { value: '  Layantara  ' } });
    fireEvent.submit(screen.getByRole('form'));
    expect(state.filters).toMatchObject({ search: 'Layantara', district: 'layan' });
    expect(screen.getByTestId('location')).toHaveTextContent('q=Layantara');
    fireEvent.click(screen.getByRole('button', { name: 'History back' }));
    expect(screen.getByRole('searchbox', { hidden: true })).toHaveValue('');
    fireEvent.click(screen.getByRole('button', { name: 'History forward' }));
    expect(screen.getByRole('searchbox', { hidden: true })).toHaveValue('Layantara');
    fireEvent.click(screen.getByRole('button', { name: 'Clear all' }));
    expect(state.filters.search).toBeUndefined();
    expect(screen.getByRole('searchbox', { hidden: true })).toHaveValue('');
  });
  it('shows no implied guest restriction for legacy unfiltered browsing', () => {
    state.mobile = true;
    mount('/property/browse');
    expect(screen.getByText(/Guests not specified/)).toBeVisible();
    expect(screen.queryByText(/Guests: 2/)).toBeNull();
  });
  it('retains an edited desktop draft and focus when resized to mobile', () => {
    const view = mount('/property/search?guests=3');
    const guests = screen.getByRole('spinbutton', { hidden: true });
    guests.focus();
    fireEvent.change(guests, { target: { value: '5' } });
    state.mobile = true;
    view.rerender(<MemoryRouter initialEntries={['/property/search?guests=3']}><Location /><Routes><Route path="/property/search" element={<PropertySearchPage />} /></Routes></MemoryRouter>);
    expect(screen.getByRole('spinbutton', { hidden: true })).toHaveValue(5);
    expect(screen.getByRole('spinbutton', { hidden: true })).toHaveFocus();
    expect(screen.getAllByRole('form')).toHaveLength(1);
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
  it('keeps submitted mobile edits visible and focuses results, but history does not steal focus', () => {
    state.mobile = true;
    mount('/property/search?guests=3');
    fireEvent.change(screen.getByRole('spinbutton', { hidden: true }), { target: { value: '5' } });
    fireEvent.submit(screen.getByRole('form'));
    expect(screen.getByRole('form')).toBeVisible();
    expect(screen.getByRole('heading', { level: 2 })).toHaveFocus();
    expect(screen.getByText(/Guests: 5/)).toBeVisible();
    const back = screen.getByRole('button', { name: 'History back' });
    back.focus();
    fireEvent.click(back);
    expect(screen.getByText(/Guests: 3/)).toBeVisible();
    expect(back).toHaveFocus();
    expect(screen.getByRole('form')).toBeVisible();
  });
  it('keeps desktop controls visible and focuses submitted results', () => {
    mount('/property/search?guests=3');
    expect(screen.getByRole('form')).toBeVisible();
    fireEvent.submit(screen.getByRole('form'));
    expect(screen.getByRole('form')).toBeVisible();
    expect(screen.getByRole('heading', { level: 2 })).toHaveFocus();
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
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
    expect(state.filters).toMatchObject({ district: 'layan', propertyType: 'villa', minGuests: 4, rentTenancy: 'medium', managementCompanyId: 'operator' });
  });
  it('edits the URL in place and rehydrates on Back and Forward', () => {
    mount('/property/search?district=layan&types=villa&guests=3&tenancy=short&source=bookmark');
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Number of guests' }), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Monthly' }));
    fireEvent.submit(screen.getByRole('form'));
    expect(state.filters).toMatchObject({ minGuests: 5, rentTenancy: 'medium' });
    expect(screen.getByTestId('location').textContent).toContain('source=bookmark');
    fireEvent.click(screen.getByRole('button', { name: 'History back' }));
    expect(screen.getByRole('spinbutton', { hidden: true })).toHaveValue(3);
    expect(state.filters.rentTenancy).toBe('short');
    fireEvent.click(screen.getByRole('button', { name: 'History forward' }));
    expect(screen.getByRole('spinbutton', { hidden: true })).toHaveValue(5);
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
  it('offers only three quick features, with every former ribbon feature inside Filters', () => {
    mount('/property/search');
    const quick = within(screen.getByRole('group', { name: 'Popular features' }));
    expect(quick.getAllByRole('button')).toHaveLength(3);
    expect(screen.queryByRole('button', { name: 'All companies' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Price & amenities' }));
    const dialog = within(screen.getByRole('dialog'));
    for (const label of ['Beachfront', 'Walk to beach', 'Sea view', 'Private pool', 'Pool', 'Washing machine', 'Pet-friendly', 'Kid-friendly', 'Parking', 'WiFi', 'Luxury', 'Air conditioning', 'Gym', 'Jacuzzi / Hot tub']) {
      expect(dialog.getByRole('button', { name: label })).toBeVisible();
    }
  });
  it('keeps quick features and the advanced sheet synchronized without leaking editor state into the URL', () => {
    mount('/property/search?f.priceLevel=2&source=bookmark');
    fireEvent.click(screen.getByRole('button', { name: 'Private pool' }));
    expect(screen.getByRole('button', { name: 'Private pool' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: /Price & amenities/ }));
    let dialog = within(screen.getByRole('dialog'));
    expect(dialog.getByRole('button', { name: 'Private pool' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(dialog.getByRole('button', { name: 'WiFi' }));
    expect(dialog.getByRole('button', { name: 'Apply (3)' })).toBeVisible();
    fireEvent.click(dialog.getByRole('button', { name: 'Apply (3)' }));
    let url = new URL(screen.getByTestId('location').textContent!, 'https://myuno.app');
    expect(url.searchParams.get('cats')).toBe('private_pool,wifi');
    expect(url.searchParams.get('f.priceLevel')).toBe('2');
    expect(url.searchParams.get('source')).toBe('bookmark');
    expect(url.searchParams.has('f.guestFeatures')).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Private pool' }));
    fireEvent.click(screen.getByRole('button', { name: /Price & amenities/ }));
    dialog = within(screen.getByRole('dialog'));
    expect(dialog.getByRole('button', { name: 'Private pool' })).toHaveAttribute('aria-pressed', 'false');
    expect(dialog.getByRole('button', { name: 'WiFi' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(dialog.getByRole('button', { name: /Apply/ }));
    url = new URL(screen.getByTestId('location').textContent!, 'https://myuno.app');
    expect(url.searchParams.get('cats')).toBe('wifi');
  });
  it('switches rental and purchase intent immediately while preserving the rental context and unrelated query state', () => {
    mount('/property/search?mode=rent&guests=4&tenancy=medium&checkIn=2027-11-10&checkOut=2027-11-15&district=layan&types=villa&f.priceLevel=2&source=bookmark');
    fireEvent.click(screen.getByRole('button', { name: 'Buy' }));
    expect(state.filters).toMatchObject({ listingType: 'sale', district: 'layan', propertyType: 'villa' });
    expect(state.filters.minGuests).toBeUndefined();
    expect(state.filters.rentTenancy).toBeUndefined();
    expect(screen.queryByText(/Guests:/)).toBeNull();
    const url = new URL(screen.getByTestId('location').textContent!, 'https://myuno.app');
    expect(url.searchParams.get('guests')).toBe('4');
    expect(url.searchParams.get('checkIn')).toBe('2027-11-10');
    expect(url.searchParams.get('source')).toBe('bookmark');
    fireEvent.click(screen.getByRole('button', { name: 'Rent' }));
    expect(state.filters).toMatchObject({ listingType: 'rent', minGuests: 4, rentTenancy: 'medium' });
    expect(screen.getByText(/Monthly ·.*Guests: 4/)).toBeVisible();
  });

  it.each(['medium', 'long'])('removes unsupported %s price bands while preserving other filters', tenancy => {
    mount(`/property/search?mode=rent&tenancy=${tenancy}&f.priceLevel=2&district=layan&types=villa&guests=4&cats=wifi&source=bookmark`);
    expect(state.filters.minPrice).toBeUndefined();
    expect(state.filters.maxPrice).toBeUndefined();
    const url = new URL(screen.getByTestId('location').textContent!, 'https://myuno.app');
    expect(url.searchParams.has('f.priceLevel')).toBe(false);
    expect(url.searchParams.get('district')).toBe('layan');
    expect(url.searchParams.get('cats')).toBe('wifi');
    expect(url.searchParams.get('guests')).toBe('4');
    expect(screen.getByText(/Confirm pricing for your chosen duration/)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: /Amenities/ }));
    expect(within(screen.getByRole('dialog')).queryByText('Price Level')).toBeNull();
  });
  it('drops a nightly price band when submitting a monthly search', () => {
    mount('/property/search?mode=rent&f.priceLevel=2&district=layan');
    expect(state.filters.minPrice).toBe(3000);
    fireEvent.click(screen.getByRole('button', { name: 'Monthly' }));
    fireEvent.submit(screen.getByRole('form'));
    expect(state.filters.rentTenancy).toBe('medium');
    expect(state.filters.minPrice).toBeUndefined();
    expect(screen.getByTestId('location')).not.toHaveTextContent('f.priceLevel');
    expect(state.filters.district).toBe('layan');
  });

  it('does not count a retained rental-only filter in the purchase sheet', () => {
    mount('/property/search?mode=buy&instant=1');
    fireEvent.click(screen.getByRole('button', { name: 'Price & amenities' }));
    const dialog = within(screen.getByRole('dialog'));
    expect(dialog.getByRole('button', { name: 'Apply' })).toBeVisible();
    fireEvent.click(dialog.getByRole('button', { name: 'Apply' }));
    expect(state.filters.instantBooking).toBeUndefined();
    fireEvent.click(screen.getByRole('button', { name: 'Rent' }));
    expect(state.filters.instantBooking).toBe(true);
  });

});
