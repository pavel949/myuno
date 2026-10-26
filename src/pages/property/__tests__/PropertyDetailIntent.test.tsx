import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import PropertyDetail from '../PropertyDetail';
import { createRealEstateListingSchema } from '@/components/seo';
import { publicJourneyState } from '@/lib/real-estate/publicJourney';
import { CompareProvider } from '@/components/property/PropertyCompare';
import { propertyDetailHref, propertyDetailMode, propertySaleAskingPrice } from '@/lib/real-estate/propertyDetailIntent';
const state = vi.hoisted(() => ({ property: { id: 'unit', currency: 'THB' as string | null, sale_currency: undefined as string | undefined, price_period: undefined as string | undefined, price_per_month: null as number | null, price_per_year: null as number | null, is_verified: false, district: 'Bang Tao', rating: 0, project: { id: 'complex', name_en: 'Complex', name_ru: '' }, title_en: 'Dual home', title_ru: 'Квартира', listing_type: 'rent', listing_modes: ['rent','sale'], is_for_sale: true, sale_price: 5000000 as number | null, price: 2000, price_per_night: 2000, property_type: 'condo', tenancy_modes: [] as string[], images: [], amenities: [], rentalTerms: { manager_name: undefined as string | undefined, price_per_night: 2000 as number | undefined, deposit_amount: 1000, included_services: [], extra_services: [] } } }));
vi.mock('@/hooks/useProperties', () => ({ usePropertyWithRentalTerms: () => ({ data: state.property, isLoading: false }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/contexts/CurrencyContext', () => ({ useCurrency: () => ({ formatPrice: (v: number) => String(v) }) }));
vi.mock('@/contexts/LocationContext', () => ({ useLocation: () => ({ currentCity: { default_currency: 'THB' } }) }));
vi.mock('@/hooks/useFeatureFlag', () => ({ useFeatureFlag: () => false }));
vi.mock('@/hooks/usePropertyUnavailableDates', () => ({ usePropertyUnavailableDates: () => ({ data: [], isSuccess: true, isError: false, refetch: vi.fn() }) }));
vi.mock('@/hooks/usePropertyListingQuality', () => ({ usePropertyMedia: () => ({ data: [] }), mediaAlt: () => '', mediaCaption: () => '' }));
vi.mock('@/components/seo', () => ({ SEOHead: () => null, createRealEstateListingSchema: vi.fn(() => ({})) }));
vi.mock('@/components/property', () => ({ IncludedServices: () => null, ExtraServices: () => null, UtilitiesInfo: () => null, CheckInDetails: ({ showPricingDeposit, onViewPricing }: { showPricingDeposit: boolean; onViewPricing?: () => void }) => showPricingDeposit && onViewPricing ? <button onClick={onViewPricing}>Go to Pricing</button> : null, GuestAssuranceCard: () => null, HouseRules: () => null, GuestExtraFeesDisplay: () => null, PropertyBookingCard: ({ initialGuestContext }: { initialGuestContext: { guests: number; dateRange?: { from?: Date } } }) => <button data-guests={initialGuestContext.guests} data-check-in={initialGuestContext.dateRange?.from?.getFullYear()}>Book rental</button>, MessageHostButton: ({ labelEn }: { labelEn: string }) => <button>{labelEn}</button> }));
vi.mock('@/components/property/detail', () => ({ PropertyDetailGallery: () => <div data-testid="property-gallery" />, PropertyDetailHighlights: () => null, PropertyDetailDateSheet: ({ open, guestCount, dateRange, onGuestCountChange, onDateRangeChange }: { open?: boolean; dateRange?: { from?: Date }; guestCount: number; onGuestCountChange: (value: number) => void; onDateRangeChange: (value: undefined) => void }) => <><output data-testid="mobile-date-sheet-open">{String(open)}</output><output data-testid="mobile-guests">{guestCount}</output><output data-testid="mobile-date">{dateRange?.from?.getDate() ?? "empty"}</output><button onClick={() => onGuestCountChange(4)}>Edit mobile party</button><button onClick={() => onDateRangeChange(undefined)}>Clear mobile dates</button></>, PropertyHeroFacts: () => null, PropertyDetailMobileBar: ({ isSaleListing, isLongStayOnly }: { isSaleListing: boolean; isLongStayOnly: boolean }) => <span data-testid="mobile-intent" data-long-stay={isLongStayOnly}>{isSaleListing ? 'buy' : 'rent'}</span> }));
vi.mock('@/components/property/PropertyShareSheet', () => ({PropertyShareSheet: ({ children }: { children: React.ReactNode }) => <>{children}</>}));
vi.mock('@/components/uno/FavoriteButton', () => ({FavoriteButton: () => null}));
vi.mock('@/components/uno/BackButton', () => ({BackButton: ({ onClick }: { onClick?: () => void }) => <button onClick={onClick}>Go back</button>}));
vi.mock('@/components/property/ProjectInfoCard', () => ({ProjectInfoCard: ({ mode }: { mode: string }) => <span data-testid="complex-mode">{mode}</span>}));
vi.mock('@/components/crosssell', () => ({RelatedServicesSection: () => null}));
vi.mock('@/components/property/UnitSpecs', () => ({UnitSpecs: () => null}));
vi.mock('@/components/leads/ExitIntentModal', () => ({ExitIntentModal: () => null}));
vi.mock('@/components/property/HostProfileSection', () => ({HostProfileSection: (props: object) => <output data-testid="host-verification-prop">{String('isVerified' in props)}</output>}));
vi.mock('@/components/property/PropertyLocationMap', () => ({PropertyLocationMap: () => null}));
vi.mock('@/components/property/SimilarProperties', () => ({SimilarProperties: () => null}));
vi.mock('@/components/property/PhotoLightbox', () => ({PhotoLightbox: () => null}));
vi.mock('@/components/property/GuestFavoriteBadge', () => ({GuestFavoriteBadge: () => null}));
vi.mock('@/components/property/TrustStrip', () => ({TrustStrip: () => null}));
vi.mock('@/components/property/InstallmentTimeline', () => ({InstallmentTimeline: () => null}));
vi.mock('@/components/property/PropertyAmenitiesSection', () => ({PropertyAmenitiesSection: () => null}));
vi.mock('@/components/property/PropertySleepingArrangements', () => ({PropertySleepingArrangements: () => null}));
vi.mock('@/components/property/PropertyReviewRatings', () => ({PropertyReviewRatings: () => null}));
vi.mock('@/components/property/StayRulesSection', () => ({StayRulesSection: () => null}));
vi.mock('@/components/property/RoomCategoryOffers', () => ({RoomCategoryOffers: () => null}));
vi.mock('@/components/reviews/ReviewsSection', () => ({ReviewsSection: () => null}));
afterEach(() => { cleanup(); localStorage.clear(); state.property.listing_type = 'rent'; state.property.listing_modes = ['rent','sale']; state.property.is_for_sale = true; state.property.sale_price = 5000000; state.property.tenancy_modes = []; state.property.currency = 'THB'; state.property.sale_currency = undefined; state.property.price_period = undefined; state.property.price_per_month = null; state.property.price_per_year = null; state.property.rentalTerms.price_per_night = 2000; state.property.is_verified = false; state.property.price_per_night = 2000; state.property.rentalTerms.manager_name = undefined; });
function NavigateContext() { const navigate = useNavigate(); return <button onClick={() => navigate('/property/unit?mode=rent&checkIn=2099-12-10&checkOut=2099-12-14&guests=2')}>New URL</button>; }
function mount(mode: string) { render(<MemoryRouter initialEntries={[`/property/unit?mode=${mode}`]}><Routes><Route path="/property/:id" element={<CompareProvider><NavigateContext /><PropertyDetail /></CompareProvider>} /></Routes></MemoryRouter>); }
describe('actual property detail purchase/rental intent', () => {
  it('opens the existing mobile date sheet from the deposit pricing action when the desktop quote is hidden', () => {
    mount('rent');
    expect(document.getElementById('property-pricing')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-date-sheet-open')).toHaveTextContent('false');
    fireEvent.click(screen.getByRole('button', { name: 'Go to Pricing' }));
    expect(screen.getByTestId('mobile-date-sheet-open')).toHaveTextContent('true');
  });
  it('passes explicit medium-only rental eligibility to the mobile manager-request action', () => {
    state.property.tenancy_modes = ['medium'];
    mount('rent');
    expect(screen.getByTestId('mobile-intent')).toHaveAttribute('data-long-stay', 'true');
    expect(screen.getByRole('button', { name: 'Request rental' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Book rental' })).toBeNull();
  });
  it.each(['medium', 'long'])('keeps supported %s intent on a dual rental offer', tenancy => {
    state.property.tenancy_modes = ['short', tenancy];
    mount(`rent&tenancy=${tenancy}`);
    expect(screen.getByRole('button', { name: 'Request rental' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Book rental' })).toBeNull();
    expect(propertyDetailHref('unit', 'rent', `?tenancy=${tenancy}`)).toContain(`tenancy=${tenancy}`);
  });
  it('does not turn unsupported rental URL intent into a long-term offer', () => {
    state.property.tenancy_modes = ['short'];
    mount('rent&tenancy=long');
    expect(screen.getByRole('button', { name: 'Book rental' })).toBeVisible();
  });
  it('updates untouched mobile fields on same-ID URL navigation', () => {
    mount('rent&checkIn=2099-12-01&checkOut=2099-12-04&guests=3');
    fireEvent.click(screen.getByRole('button', { name: 'New URL' }));
    expect(screen.getByTestId('mobile-guests')).toHaveTextContent('2');
    expect(screen.getByTestId('mobile-date')).toHaveTextContent('10');
  });
  it('preserves edited mobile guests while untouched dates follow the URL', () => {
    mount('rent&checkIn=2099-12-01&checkOut=2099-12-04&guests=3');
    fireEvent.click(screen.getByRole('button', { name: 'Edit mobile party' }));
    fireEvent.click(screen.getByRole('button', { name: 'New URL' }));
    expect(screen.getByTestId('mobile-guests')).toHaveTextContent('4');
    expect(screen.getByTestId('mobile-date')).toHaveTextContent('10');
  });
  it('preserves cleared mobile dates while untouched guests follow the URL', () => {
    mount('rent&checkIn=2099-12-01&checkOut=2099-12-04&guests=3');
    fireEvent.click(screen.getByRole('button', { name: 'Clear mobile dates' }));
    fireEvent.click(screen.getByRole('button', { name: 'New URL' }));
    expect(screen.getByTestId('mobile-guests')).toHaveTextContent('2');
    expect(screen.getByTestId('mobile-date')).toHaveTextContent('empty');
  });
  it('hydrates mobile and desktop from the same validated initial URL context', () => {
    mount('rent&checkIn=2099-12-01&checkOut=2099-12-04&guests=3');
    expect(screen.getByTestId('mobile-guests')).toHaveTextContent('3');
    expect(screen.getByRole('button', { name: 'Book rental' })).toHaveAttribute('data-guests', '3');
    expect(screen.getByRole('button', { name: 'Book rental' })).toHaveAttribute('data-check-in', '2099');
    fireEvent.click(screen.getByRole('button', { name: 'Edit mobile party' }));
    expect(screen.getByTestId('mobile-guests')).toHaveTextContent('4');
    fireEvent.click(screen.getByRole('button', { name: 'Clear mobile dates' }));
    expect(screen.getByTestId('mobile-guests')).toHaveTextContent('4');
  });
  it('passes resolved purchase intent and actual sale price to comparison', () => {
    mount('buy');
    screen.getByText('More').closest('details')!.open = true;
    fireEvent.click(screen.getByRole('button', { name: 'Compare' }));
    const [saved] = JSON.parse(localStorage.getItem('myuno_compare_properties')!);
    expect(saved).toMatchObject({ mode: 'buy', sale_price: 5000000, listing_type: 'rent', price: 2000 });
    fireEvent.click(screen.getByRole('button', { name: 'Compare (1)' }));
    expect(screen.getByText('Purchase: 5,000,000 currency unspecified')).toBeInTheDocument();
  });
  it('names Share and reveals labelled Compare/PDF actions at mobile breakpoints', () => {
    mount('rent');
    expect(screen.getByRole('button', { name: 'Share' })).toHaveAttribute('aria-label', 'Share');
    screen.getByText('More').closest('details')!.open = true;
    for (const name of ['Compare', 'PDF']) {
      const action = screen.getByRole('button', { name });
      expect(action).toHaveClass('[&>span]:inline', 'min-h-11');
      expect(action.closest('details')).toHaveAttribute('open');
    }
  });
  it('puts the full identity before the gallery without rendering a zero rating', () => {
    mount('rent');
    const identity = screen.getByTestId('property-identity');
    expect(identity.compareDocumentPosition(screen.getByTestId('property-gallery')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Dual home');
    expect(identity).not.toHaveTextContent('0');
    expect(screen.getByText('More').closest('details')).not.toHaveAttribute('open');
    expect(screen.getByRole('button', { name: 'Book rental' })).toBeInTheDocument();
  });
  it('keeps a dual-listed unit in the rental CTA from Rent', () => { mount('rent'); expect(screen.getByRole('button', { name: 'Book rental' })).toBeInTheDocument(); expect(screen.queryByRole('button', { name: 'Request consultation' })).not.toBeInTheDocument(); expect(screen.getByTestId('mobile-intent')).toHaveTextContent('rent'); expect(screen.getByTestId('complex-mode')).toHaveTextContent('rent'); });
  it('shows its sale CTA from Buy', () => { mount('buy'); expect(screen.getByRole('button', { name: 'Request consultation' })).toBeInTheDocument(); expect(screen.queryByRole('button', { name: 'Book rental' })).not.toBeInTheDocument(); expect(screen.getByTestId('mobile-intent')).toHaveTextContent('buy'); expect(screen.getByTestId('complex-mode')).toHaveTextContent('buy'); });
  it('rejects a rental URL intent on a sale-only unit', () => { state.property.listing_type = 'sale'; state.property.listing_modes = ['sale']; mount('rent'); expect(screen.getByRole('button', { name: 'Request consultation' })).toBeInTheDocument(); });
  it('rejects a purchase intent on a rental-only unit', () => { state.property.is_for_sale = false; state.property.listing_modes = ['rent']; mount('buy'); expect(screen.getByRole('button', { name: 'Book rental' })).toBeInTheDocument(); });
  it('keeps inquiry for an eligible legacy sale without displaying the rental amount as its asking price', () => { state.property.sale_price = null; mount('buy'); expect(screen.getByRole('button', { name: 'Request consultation' })).toBeInTheDocument(); expect(screen.getAllByText('Price on request')).toHaveLength(2); });
  it('does not promote a nightly amount to sale price when legacy sale type conflicts with explicit rent modes', () => {
    state.property.listing_type = 'sale';
    state.property.listing_modes = ['platform', 'rent', 'short'];
    state.property.sale_price = null;
    mount('buy');
    expect(screen.getAllByText('Price on request')).toHaveLength(2);
    expect(screen.queryByText('2000')).toBeNull();
  });
  it('uses legacy price only for a pure sale listing with absent sale_price', () => {
    expect(propertySaleAskingPrice({ listing_type: 'sale', sale_price: null, price: 7500000 })).toBe(7500000);
    expect(propertySaleAskingPrice({ listing_type: 'rent', is_for_sale: true, sale_price: null, price: 2000 })).toBeNull();
    expect(propertySaleAskingPrice({ listing_type: 'sale', sale_price: 0, price: 7500000 })).toBeNull();
    expect(propertySaleAskingPrice({ listing_type: 'sale', sale_price: null, price: null })).toBeNull();
  });
  it('preserves existing default and guest date context without copying operator scope', () => {
    expect(propertyDetailMode(state.property)).toBe('buy');
    const link = propertyDetailHref('unit','rent','?checkIn=2026-12-01&checkOut=2026-12-04&guests=2&managementCompanyId=operator');
    expect(link).toBe('/property/unit?mode=rent&checkIn=2026-12-01&checkOut=2026-12-04&guests=2');
  });
});

function SearchJourneyEntry() {
  const navigate = useNavigate(); const location = useLocation();
  return <><output data-testid="journey-search">{location.search + location.hash}</output><button onClick={() => navigate(propertyDetailHref('unit', 'rent', location.search), { state: publicJourneyState(location) })}>Open home</button></>;
}
function JourneyAreaEntry() {
  const navigate = useNavigate();
  return <button onClick={() => navigate(-1)}>Return from area</button>;
}
it('returns from the real property district link to the original filtered search without duplicate entries', () => {
  const query = '?mode=rent&tenancy=long&guests=3&view=map&f.bedrooms=2#results';
  render(<MemoryRouter initialEntries={['/property/search' + query]}><Routes>
    <Route path="/property/search" element={<SearchJourneyEntry />} />
    <Route path="/property/:id" element={<CompareProvider><PropertyDetail /></CompareProvider>} />
    <Route path="/area/bang-tao" element={<JourneyAreaEntry />} />
  </Routes></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: 'Open home' }));
  fireEvent.click(screen.getByRole('link', { name: 'Explore Bang Tao' }));
  fireEvent.click(screen.getByRole('button', { name: 'Return from area' }));
  expect(screen.getByRole('link', { name: 'Explore Bang Tao' })).toHaveAttribute('href', '/area/bang-tao');
  fireEvent.click(screen.getByRole('button', { name: 'Back to results' }));
  expect(screen.getByTestId('journey-search')).toHaveTextContent(query);
});
it('keeps guest criteria when a direct property link returns to the catalogue', () => {
  render(<MemoryRouter initialEntries={['/property/unit?mode=rent&tenancy=long&guests=4&intent=relocate']}><Routes>
    <Route path="/property/browse" element={<SearchJourneyEntry />} />
    <Route path="/property/:id" element={<CompareProvider><PropertyDetail /></CompareProvider>} />
  </Routes></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: 'Back to results' }));
  const params = new URLSearchParams(screen.getByTestId('journey-search').textContent ?? '');
  expect(Object.fromEntries(params)).toEqual({ mode: 'rent', tenancy: 'long', guests: '4', intent: 'relocate' });
});

it.each(['medium', 'long'])('shows the explicit monthly tariff for a %s request without a nightly booking card', tenancy => {
  state.property.tenancy_modes = [tenancy]; state.property.price_period = 'month'; state.property.price_per_month = 45000;
  mount(`rent&tenancy=${tenancy}`);
  expect(screen.getAllByText('45000 / month').length).toBeGreaterThan(0);
  expect(screen.getByRole('button', { name: 'Request rental' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Book rental' })).toBeNull();
});
it.each([null, 'USD'])('keeps unknown/non-THB rental currency %s on the request route', currency => {
  state.property.currency = currency; mount('rent');
  expect(screen.getAllByText('Price on request').length).toBeGreaterThan(0);
  expect(screen.getByRole('button', { name: 'Request rental' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Book rental' })).toBeNull();
});
it('does not relabel a monthly legacy amount as nightly', () => {
  state.property.price_period = 'month'; state.property.rentalTerms.price_per_night = undefined;
  // The explicit property nightly field remains a genuine separate tariff.
  state.property.price_per_night = 0;
  mount('rent');
  expect(screen.getAllByText('2000 / month').length).toBeGreaterThan(0);
  expect(screen.queryByRole('button', { name: 'Book rental' })).toBeNull();
  state.property.price_per_night = 2000;
});
it.each(['USD', undefined])('does not convert a sale amount with currency %s as THB', saleCurrency => {
  state.property.sale_currency = saleCurrency; mount('buy');
  expect(screen.getAllByText('Price on request')).toHaveLength(2);
  expect(screen.queryByText('5000000')).toBeNull();
});
it('preserves an explicit THB sale amount', () => {
  state.property.sale_currency = 'THB'; mount('buy');
  expect(screen.getAllByText('5000000')).toHaveLength(2);
});
it('offers neither rental nor purchase actions when the persisted listing supports neither', () => {
  state.property.listing_type = 'unavailable'; state.property.listing_modes = []; state.property.is_for_sale = false;
  mount('buy');
  expect(screen.getByRole('status')).toHaveTextContent('Offer unavailable');
  expect(screen.queryByRole('button', { name: 'Request consultation' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Book rental' })).toBeNull();
  expect(screen.queryByTestId('mobile-intent')).toBeNull();
});

it('does not pass listing verification as host status', () => {
  state.property.is_verified = true; state.property.rentalTerms.manager_name = 'Synthetic manager';
  mount('rent');
  expect(screen.getByTestId('host-verification-prop')).toHaveTextContent('false');
});

it('does not publish rental money as a sale offer in structured data', () => {
  mount('rent');
  expect(createRealEstateListingSchema).toHaveBeenLastCalledWith(expect.objectContaining({ price: undefined, currency: undefined }));
});
it('does not publish an unpriced or foreign-currency sale as a THB offer', () => {
  state.property.sale_currency = 'USD'; mount('buy');
  expect(createRealEstateListingSchema).toHaveBeenLastCalledWith(expect.objectContaining({ price: undefined, currency: undefined }));
});
