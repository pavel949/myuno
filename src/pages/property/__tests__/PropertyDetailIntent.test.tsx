import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import PropertyDetail from '../PropertyDetail';
import { CompareProvider } from '@/components/property/PropertyCompare';
import { propertyDetailHref, propertyDetailMode, propertySaleAskingPrice } from '@/lib/real-estate/propertyDetailIntent';
const state = vi.hoisted(() => ({ property: { id: 'unit', rating: 0, project: { id: 'complex', name_en: 'Complex', name_ru: '' }, title_en: 'Dual home', title_ru: 'Квартира', listing_type: 'rent', listing_modes: ['rent','sale'], is_for_sale: true, sale_price: 5000000 as number | null, price: 2000, price_per_night: 2000, property_type: 'condo', tenancy_modes: [] as string[], images: [], amenities: [], rentalTerms: { price_per_night: 2000, included_services: [], extra_services: [] } } }));
vi.mock('@/hooks/useProperties', () => ({ usePropertyWithRentalTerms: () => ({ data: state.property, isLoading: false }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/contexts/CurrencyContext', () => ({ useCurrency: () => ({ formatPrice: (v: number) => String(v) }) }));
vi.mock('@/contexts/LocationContext', () => ({ useLocation: () => ({ currentCity: { default_currency: 'THB' } }) }));
vi.mock('@/hooks/useFeatureFlag', () => ({ useFeatureFlag: () => false }));
vi.mock('@/hooks/usePropertyUnavailableDates', () => ({ usePropertyUnavailableDates: () => ({ data: [], isSuccess: true, isError: false, refetch: vi.fn() }) }));
vi.mock('@/hooks/usePropertyListingQuality', () => ({ usePropertyMedia: () => ({ data: [] }), mediaAlt: () => '', mediaCaption: () => '' }));
vi.mock('@/components/seo', () => ({ SEOHead: () => null, createRealEstateListingSchema: () => ({}) }));
vi.mock('@/components/property', () => ({ IncludedServices: () => null, ExtraServices: () => null, UtilitiesInfo: () => null, CheckInDetails: () => null, GuestAssuranceCard: () => null, HouseRules: () => null, GuestExtraFeesDisplay: () => null, PropertyBookingCard: ({ initialGuestContext }: { initialGuestContext: { guests: number; dateRange?: { from?: Date } } }) => <button data-guests={initialGuestContext.guests} data-check-in={initialGuestContext.dateRange?.from?.getFullYear()}>Book rental</button>, MessageHostButton: ({ labelEn }: { labelEn: string }) => <button>{labelEn}</button> }));
vi.mock('@/components/property/detail', () => ({ PropertyDetailGallery: () => <div data-testid="property-gallery" />, PropertyDetailHighlights: () => null, PropertyDetailDateSheet: ({ guestCount, dateRange, onGuestCountChange, onDateRangeChange }: { dateRange?: { from?: Date }; guestCount: number; onGuestCountChange: (value: number) => void; onDateRangeChange: (value: undefined) => void }) => <><output data-testid="mobile-guests">{guestCount}</output><output data-testid="mobile-date">{dateRange?.from?.getDate() ?? "empty"}</output><button onClick={() => onGuestCountChange(4)}>Edit mobile party</button><button onClick={() => onDateRangeChange(undefined)}>Clear mobile dates</button></>, PropertyHeroFacts: () => null, PropertyDetailMobileBar: ({ isSaleListing, isLongStayOnly }: { isSaleListing: boolean; isLongStayOnly: boolean }) => <span data-testid="mobile-intent" data-long-stay={isLongStayOnly}>{isSaleListing ? 'buy' : 'rent'}</span> }));
vi.mock('@/components/property/PropertyShareSheet', () => ({PropertyShareSheet: ({ children }: { children: React.ReactNode }) => <>{children}</>}));
vi.mock('@/components/uno/FavoriteButton', () => ({FavoriteButton: () => null}));
vi.mock('@/components/uno/BackButton', () => ({BackButton: () => null}));
vi.mock('@/components/property/ProjectInfoCard', () => ({ProjectInfoCard: ({ mode }: { mode: string }) => <span data-testid="complex-mode">{mode}</span>}));
vi.mock('@/components/crosssell', () => ({RelatedServicesSection: () => null}));
vi.mock('@/components/property/UnitSpecs', () => ({UnitSpecs: () => null}));
vi.mock('@/components/leads/ExitIntentModal', () => ({ExitIntentModal: () => null}));
vi.mock('@/components/property/HostProfileSection', () => ({HostProfileSection: () => null}));
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
afterEach(() => { cleanup(); localStorage.clear(); state.property.listing_type = 'rent'; state.property.listing_modes = ['rent','sale']; state.property.is_for_sale = true; state.property.sale_price = 5000000; state.property.tenancy_modes = []; });
function NavigateContext() { const navigate = useNavigate(); return <button onClick={() => navigate('/property/unit?mode=rent&checkIn=2099-12-10&checkOut=2099-12-14&guests=2')}>New URL</button>; }
function mount(mode: string) { render(<MemoryRouter initialEntries={[`/property/unit?mode=${mode}`]}><Routes><Route path="/property/:id" element={<CompareProvider><NavigateContext /><PropertyDetail /></CompareProvider>} /></Routes></MemoryRouter>); }
describe('actual property detail purchase/rental intent', () => {
  it('passes explicit medium-only rental eligibility to the mobile manager-request action', () => {
    state.property.tenancy_modes = ['medium'];
    mount('rent');
    expect(screen.getByTestId('mobile-intent')).toHaveAttribute('data-long-stay', 'true');
    expect(screen.getByRole('button', { name: 'Request rental' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Book rental' })).toBeNull();
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
