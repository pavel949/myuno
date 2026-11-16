import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import PropertyDetail from '../PropertyDetail';
import { CompareProvider } from '@/components/property/PropertyCompare';
import { ECOSYSTEM_PAGE_CONTAINER } from '@/design-system/ecosystemLayout';
const state = vi.hoisted(() => ({ language: 'en' as 'en' | 'ru' | 'th', result: {} as Record<string, unknown>, refetch: vi.fn(), reads: vi.fn(), property: { id: 'unit', rating: 0, project: { id: 'complex', name_en: 'Complex', name_ru: '' }, title_en: 'Dual home', title_ru: 'Квартира', listing_type: 'rent', listing_modes: ['rent','sale'], is_for_sale: true, sale_price: 5000000 as number | null, price: 2000, price_per_night: 2000, property_type: 'condo', tenancy_modes: [] as string[], images: [], amenities: [], rentalTerms: { price_per_night: 2000, deposit_amount: 1000, included_services: [], extra_services: [] } } }));
vi.mock('@/hooks/useProperties', () => ({ usePropertyWithRentalTerms: (id: string) => { state.reads(id); return { data: state.property, isLoading: false, isError: false, isFetching: false, refetch: state.refetch, ...state.result }; } }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/contexts/CurrencyContext', () => ({ useCurrency: () => ({ formatPrice: (v: number) => String(v) }) }));
vi.mock('@/contexts/LocationContext', () => ({ useLocation: () => ({ currentCity: { default_currency: 'THB' } }) }));
vi.mock('@/hooks/useFeatureFlag', () => ({ useFeatureFlag: () => false }));
vi.mock('@/hooks/usePropertyUnavailableDates', () => ({ usePropertyUnavailableDates: () => ({ data: [], isSuccess: true, isError: false, refetch: vi.fn() }) }));
vi.mock('@/hooks/usePropertyListingQuality', () => ({ usePropertyMedia: () => ({ data: [] }), mediaAlt: () => '', mediaCaption: () => '' }));
vi.mock('@/components/seo', () => ({ SEOHead: () => null, createRealEstateListingSchema: () => ({}) }));
vi.mock('@/components/property', () => ({ IncludedServices: () => null, ExtraServices: () => null, UtilitiesInfo: () => null, CheckInDetails: ({ showPricingDeposit, onViewPricing }: { showPricingDeposit: boolean; onViewPricing?: () => void }) => showPricingDeposit && onViewPricing ? <button onClick={onViewPricing}>Go to Pricing</button> : null, GuestAssuranceCard: () => null, HouseRules: () => null, GuestExtraFeesDisplay: () => null, PropertyBookingCard: ({ initialGuestContext }: { initialGuestContext: { guests: number; dateRange?: { from?: Date } } }) => { const [draft, setDraft] = React.useState(''); return <><input aria-label="Synthetic inquiry draft" value={draft} onChange={event => setDraft(event.target.value)}/><button data-guests={initialGuestContext.guests} data-check-in={initialGuestContext.dateRange?.from?.getFullYear()}>Book rental</button></>; }, MessageHostButton: ({ labelEn }: { labelEn: string }) => <button>{labelEn}</button> }));
vi.mock('@/components/property/detail', () => ({ PropertyDetailGallery: () => <div data-testid="property-gallery" />, PropertyDetailHighlights: () => null, PropertyDetailDateSheet: ({ open, guestCount, dateRange, onGuestCountChange, onDateRangeChange }: { open?: boolean; dateRange?: { from?: Date }; guestCount: number; onGuestCountChange: (value: number) => void; onDateRangeChange: (value: undefined) => void }) => <><output data-testid="mobile-date-sheet-open">{String(open)}</output><output data-testid="mobile-guests">{guestCount}</output><output data-testid="mobile-date">{dateRange?.from?.getDate() ?? "empty"}</output><button onClick={() => onGuestCountChange(4)}>Edit mobile party</button><button onClick={() => onDateRangeChange(undefined)}>Clear mobile dates</button></>, PropertyHeroFacts: () => null, PropertyDetailMobileBar: ({ isSaleListing, isLongStayOnly }: { isSaleListing: boolean; isLongStayOnly: boolean }) => <span data-testid="mobile-intent" data-long-stay={isLongStayOnly}>{isSaleListing ? 'buy' : 'rent'}</span> }));
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

beforeEach(() => { state.result = {}; state.language = 'en'; vi.clearAllMocks(); });
afterEach(() => { cleanup(); localStorage.clear(); });
function Boundary() { const navigate = useNavigate(); const location = useLocation(); return <><output data-testid="location">{location.pathname + location.search}</output><button onClick={() => navigate('/property/next?guests=2')}>Next property</button></>; }
function Harness({entry='/property/unit?mode=rent&guests=3&checkIn=2099-12-01&checkOut=2099-12-04'}:{entry?:string}) { return <MemoryRouter initialEntries={[entry]} future={{v7_startTransition:true,v7_relativeSplatPath:true}}><CompareProvider><Boundary/><div className={ECOSYSTEM_PAGE_CONTAINER} data-testid="parent-frame"><Routes><Route path="/property/:id" element={<PropertyDetail/>}/><Route path="/property" element={<h1>Listings destination</h1>}/></Routes></div></CompareProvider></MemoryRouter>; }
function mount() { return render(<Harness/>); }
const copy = {
 en: { loading: 'Loading property…', error: 'Property could not be loaded', missing: 'Property not found', retry: 'Try again', back: 'Back to listings' },
 ru: { loading: 'Загрузка объекта…', error: 'Не удалось загрузить объект', missing: 'Объект не найден', retry: 'Повторить', back: 'К списку' },
 th: { loading: 'กำลังโหลดที่พัก…', error: 'ไม่สามารถโหลดที่พักได้', missing: 'ไม่พบที่พัก', retry: 'ลองอีกครั้ง', back: 'กลับไปยังรายการที่พัก' },
};
describe.each(['en','ru','th'] as const)('property read states (%s)', language => {
 beforeEach(() => { state.language = language; });
 it('announces loading without an error, not-found claim or stale property actions', () => {
  state.result = { isLoading: true, data: undefined }; mount();
  expect(screen.getByRole('status', { name: copy[language].loading })).toHaveAttribute('aria-busy','true');
  expect(screen.queryByRole('alert')).not.toBeInTheDocument(); expect(screen.queryByText(copy[language].missing)).not.toBeInTheDocument(); expect(screen.queryByTestId('property-gallery')).not.toBeInTheDocument();
 });
 it('distinguishes a failed read from successful missing data and preserves the listings destination', () => {
  state.result = { isError: true, data: undefined, error: new Error('Internal read diagnostics') }; mount();
  expect(screen.getByRole('alert', { name: copy[language].error })).toBeVisible();
  expect(screen.queryByText('Internal read diagnostics')).not.toBeInTheDocument();
  expect(screen.queryByText(copy[language].missing)).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: copy[language].back })).toHaveAttribute('href','/property');
  fireEvent.click(screen.getByRole('button', { name: copy[language].retry })); expect(state.refetch).toHaveBeenCalledOnce();
 });
 it('uses the shared empty state for successful null and does not invent a retry error', () => {
  state.result = { data: null }; mount();
  expect(screen.getByRole('heading', { name: copy[language].missing })).toBeVisible(); expect(screen.queryByRole('alert')).not.toBeInTheDocument(); expect(screen.queryByRole('button', { name: copy[language].retry })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('link', { name: copy[language].back }));expect(screen.getByRole('heading', { name:'Listings destination' })).toBeVisible();
 });
});
it('keeps query context and transitions retry through loading to the existing success page', () => {
 state.result = { isError: true, data: undefined }; const view=mount();
 fireEvent.click(screen.getByRole('button', { name: 'Try again' })); expect(state.refetch).toHaveBeenCalledOnce();
 state.result = { isError: true, isFetching: true, data: undefined }; view.rerender(<Harness/>);
 expect(screen.getByRole('status',{name:'Loading property…'})).toBeVisible(); expect(screen.queryByRole('button',{name:'Try again'})).not.toBeInTheDocument();
 state.result = {};view.rerender(<Harness/>);
 expect(screen.getByRole('heading',{name:'Dual home'})).toBeVisible(); expect(screen.getByRole('button',{name:'Book rental'})).toHaveAttribute('data-guests','3');expect(screen.getByTestId('location')).toHaveTextContent('checkIn=2099-12-01');
});
it('hides retained successful data after a failed read, including on a new route ID', () => {
 mount(); expect(screen.getByRole('heading',{name:'Dual home'})).toBeVisible();
 state.result = { isError: true, data: state.property };fireEvent.click(screen.getByRole('button',{name:'Next property'}));
 expect(state.reads).toHaveBeenLastCalledWith('next');expect(screen.getByTestId('location')).toHaveTextContent('/property/next?guests=2');expect(screen.getByRole('alert',{name:'Property could not be loaded'})).toBeVisible();expect(screen.queryByTestId('property-gallery')).not.toBeInTheDocument();expect(screen.queryByRole('button',{name:'Book rental'})).not.toBeInTheDocument();
});

it.each(['loading','error','missing'] as const)('keeps %s within the existing parent frame without a viewport or nested frame', scenario => {
 state.result = scenario === 'loading' ? {data:undefined,isLoading:true} : scenario === 'error' ? {data:undefined,isError:true} : {data:null};
 mount();const frame=screen.getByTestId('parent-frame');
 expect(frame.querySelector('.ds-frame')).toBeNull();
 expect(frame.querySelector('[class~="min-h-screen"], [class~="h-screen"]')).toBeNull();
});
it('preserves a same-ID child draft through background read failure, retry and success', () => {
 const view=mount();const draft=screen.getByRole('textbox',{name:'Synthetic inquiry draft'});
 fireEvent.change(draft,{target:{value:'Keep my inquiry notes'}});
 state.result={isError:true,data:state.property};view.rerender(<Harness/>);
 expect(screen.getByRole('alert',{name:'Property update could not be loaded'})).toBeVisible();
 expect(screen.queryByText('Property could not be loaded')).not.toBeInTheDocument();
 expect(screen.getByRole('textbox',{name:'Synthetic inquiry draft'})).toBe(draft);expect(draft).toHaveValue('Keep my inquiry notes');
 fireEvent.click(screen.getByRole('button',{name:'Try again'}));expect(state.refetch).toHaveBeenCalledOnce();
 state.result={isError:true,isFetching:true,data:state.property};view.rerender(<Harness/>);
 expect(screen.getByRole('button',{name:'Try again'})).toBeDisabled();expect(screen.getByText('Refreshing property…')).toHaveAttribute('role','status');expect(draft).toHaveValue('Keep my inquiry notes');
 state.result={};view.rerender(<Harness/>);
 expect(screen.queryByRole('alert')).not.toBeInTheDocument();expect(screen.getByRole('textbox',{name:'Synthetic inquiry draft'})).toBe(draft);expect(draft).toHaveValue('Keep my inquiry notes');
 expect(screen.getByTestId('location')).toHaveTextContent('guests=3');
});

it('accepts canonical UUID data for an uppercase UUID route without a permanent loading state', () => {
 const lower='aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
 state.result={data:{...state.property,id:lower}};
 render(<Harness entry={'/property/'+lower.toUpperCase()+'?guests=3'}/>);
 expect(state.reads).toHaveBeenLastCalledWith(lower.toUpperCase());
 expect(screen.getByRole('heading',{name:'Dual home'})).toBeVisible();
 expect(screen.queryByRole('status',{name:'Loading property…'})).not.toBeInTheDocument();
});
it.each(['Unit','aaaaaaaa-bbbb-4ccc-8ddd-ffffffffffff'])('does not expose retained data for a different identity (%s)', retainedId => {
 state.result={data:{...state.property,id:retainedId},isError:true};
 mount();expect(screen.getByRole('alert',{name:'Property could not be loaded'})).toBeVisible();
 expect(screen.queryByTestId('property-gallery')).not.toBeInTheDocument();
});
