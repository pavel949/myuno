// URL/reader contract tests render filter contents inline; real sheet behavior is covered separately.
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { Link, MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import ExperiencesIndex from '../ExperiencesIndex';
import ExperienceDetail from '../ExperienceDetail';
import { UnifiedHeader } from '@/components/shared/UnifiedHeader';
const state = vi.hoisted(() => ({ language: 'en', currency: 'THB', mixedCurrency: false, error: false, loading: false, categoryError: false, useActualDetail: false, detailError: false, detailLoading: false, detailRetry: vi.fn(), retry: vi.fn(), categoryRetry: vi.fn(), read: vi.fn() }));
const categories = [
 { id: 'island-category', slug: 'islands', name_en: 'Islands', name_ru: 'Острова', experience_type: 'tour' },
 { id: 'diving-category', slug: 'diving', name_en: 'Diving', name_ru: 'Дайвинг', experience_type: 'activity' },
];
const offers = [
 { id: 'sea', title_en: 'Island route', title_ru: 'Островной маршрут', category: 'islands', experience_type: 'tour', price: 200, rating: 4 },
 { id: 'dive', title_en: 'Underwater activity', title_ru: 'Погружение', category: 'diving', experience_type: 'activity', price: 400, rating: 5 },
 { id: 'unknown', title_en: 'Request-priced tour', title_ru: 'Экскурсия по запросу', category: 'islands', experience_type: 'tour', price: null, rating: 0 },
];
vi.mock('@/components/services/MarketplaceFilterSheet', () => ({ MarketplaceFilterSheet: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/hooks/useExperiences', () => ({
 useExperiences: (options: { type?: string; category?: string; search?: string }) => {
  state.read(options);
  return { experiences: state.error || state.loading ? [] : offers.filter(item => (!options.type || item.experience_type === options.type) && (!options.category || item.category === options.category) && (!options.search || item.title_en.toLowerCase().includes(options.search.toLowerCase()))).map((item, index) => ({ ...item, currency: state.mixedCurrency && index === 0 ? 'USD' : state.currency })), error: state.error ? Error('Synthetic read failure') : null, isLoading: state.loading, refetch: state.retry };
 }, useExperience: () => ({ experience: undefined, isLoading: state.detailLoading, error: state.detailError ? Error('Synthetic detail failure') : null, refetch: state.detailRetry }), formatDuration: () => '', getDifficultyColor: () => '',
}));
vi.mock('@/hooks/useExperienceCategories', () => ({ useExperienceCategories: () => ({ data: categories, isError: state.categoryError, refetch: state.categoryRetry }) }));
vi.mock('@/components/miniapp', () => ({
 MiniAppLayout: ({ title, subtitle, searchPlaceholder, searchValue, onSearchChange, filterButton, stickySubHeader, children }: { title: string; subtitle: string; searchPlaceholder: string; searchValue: string; onSearchChange: (v: string) => void; filterButton: ReactNode; stickySubHeader: ReactNode; children: ReactNode }) => <main><h1>{title}</h1><p>{subtitle}</p><input aria-label={searchPlaceholder} value={searchValue} onChange={event => onSearchChange(event.target.value)} />{filterButton}{stickySubHeader}{children}</main>,
 CatalogCard: ({ title, onClick, href, navigationState, priceLabel }: { title: string; onClick?: () => void; href?: string; navigationState?: unknown; priceLabel?: string }) => href ? <Link data-testid="offer" to={href} state={navigationState}>{title}{priceLabel && <span>{priceLabel}</span>}</Link> : <button data-testid="offer" onClick={onClick}>{title}</button>,
}));
vi.mock('@/hooks/useExperiencePricing', () => ({ useExperiencePricing: () => ({ data: [] }) }));
vi.mock('@/components/miniapp/MiniAppLayout', () => ({ MiniAppLayout: ({ children, title, fallbackPath, onBack }: { children: ReactNode; title: string; fallbackPath: string; onBack?: () => void }) => <main><UnifiedHeader title={title} fallbackPath={fallbackPath} onBack={onBack} />{children}</main> }));
vi.mock('@/components/seo', () => ({ SEOHead: () => null }));
vi.mock('@/components/crosssell', () => ({ CrossSellSection: () => null }));
vi.mock('@/components/experiences/PropertyTourPromo', () => ({ PropertyTourPromo: () => null }));
vi.mock('@/components/vertical/VerticalContextBanner', () => ({ VerticalContextBanner: () => null }));
vi.mock('@/components/vertical/VerticalInsightPanel', () => ({ VerticalInsightPanel: () => null }));
function Journey() {
 const location = useLocation(), navigate = useNavigate();
 return <><Routes><Route path="/experiences" element={<ExperiencesIndex />} /><Route path="/experiences/:id" element={state.useActualDetail ? <ExperienceDetail /> : <h1>Offer details</h1>} /></Routes><output data-testid="url">{location.pathname + location.search}</output><button onClick={() => navigate(-1)}>History back</button><Link to="/experiences?type=activity">Native activity link</Link></>;
}
function mount(url = '/experiences') { return render(<MemoryRouter initialEntries={[url]}><Journey /></MemoryRouter>); }
beforeEach(() => { state.language = 'en'; state.currency = 'THB'; state.mixedCurrency = false; state.error = false; state.loading = false; state.categoryError = false; state.useActualDetail = false; state.detailError = false; state.detailLoading = false; state.detailRetry.mockClear(); state.retry.mockClear(); state.categoryRetry.mockClear(); state.read.mockClear(); });
afterEach(cleanup);
describe('public experience catalogue journey', () => {
 it('combines budget with search, clears one chip and preserves unrelated URL context', () => {
  mount('/experiences?q=Island&maxPrice=300&ref=campaign');
  expect(screen.getAllByTestId('offer')).toHaveLength(1);
  expect(screen.getByRole('spinbutton', { name: 'Maximum price' })).toHaveValue(300);
  fireEvent.click(screen.getByRole('button', { name: 'Remove filter: Up to 300 THB' }));
  expect(screen.getByTestId('url')).toHaveTextContent('/experiences?q=Island&ref=campaign');
  expect(screen.getByRole('textbox', { name: 'Search experiences…' })).toHaveValue('Island');
  fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
  expect(screen.getByTestId('url')).toHaveTextContent('/experiences?ref=campaign');
 });
 it('shows invalid budget as a validation failure instead of unfiltered offers', () => {
  mount('/experiences?minPrice=500&maxPrice=100');
  expect(screen.getByRole('alert')).toHaveTextContent('minimum cannot exceed the maximum');
  expect(screen.queryAllByTestId('offer')).toHaveLength(0);
 });
 it('keeps duration in URL and removes it through its chip', () => {
  mount('/experiences?ref=campaign');
  fireEvent.change(screen.getByRole('combobox', { name: 'Duration' }), { target: { value: 'half-day' } });
  expect(screen.getByTestId('url')).toHaveTextContent('duration=half-day');
  fireEvent.click(screen.getByRole('button', { name: 'Remove filter: 2–6 hours' }));
  expect(screen.getByTestId('url')).toHaveTextContent('/experiences?ref=campaign');
 });
 it('shows one category entry and a native yacht catalogue link before real offers', () => {
  mount(); expect(screen.getAllByTestId('offer')).toHaveLength(3);
  expect(screen.getAllByRole('button', { name: 'Sea & islands' })).toHaveLength(1);
  expect(screen.queryByRole('button', { name: 'Wellness & relaxation' })).toBeNull();
  expect(screen.getByRole('link', { name: 'Yachts' })).toHaveAttribute('href', '/yachts');
  expect(screen.queryByText('Experiences worth remembering')).toBeNull();
 });
 it('updates the actual reader and selected controls after a same-page category link', () => {
  mount('/experiences?type=tour'); fireEvent.click(screen.getByRole('link', { name: 'Native activity link' }));
  expect(screen.getByRole('button', { name: 'Activities' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getAllByTestId('offer')).toHaveLength(1);
  expect(state.read).toHaveBeenLastCalledWith({ publishedOnly: true, type: 'activity', category: undefined, search: undefined });
 });
 it('uses only returned category slugs and retains URL filters after returning from a detail', () => {
  mount(); fireEvent.change(screen.getByRole('combobox', { name: 'Category' }), { target: { value: 'islands' } });
  expect(screen.getByTestId('url')).toHaveTextContent('/experiences?category=islands');
  fireEvent.click(screen.getByRole('link', { name: 'Island route' }));
  expect(screen.getByRole('heading', { name: 'Offer details' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'History back' }));
  expect(screen.getByTestId('url')).toHaveTextContent('/experiences?category=islands');
  expect(screen.getAllByTestId('offer')).toHaveLength(2);
 });
 it('clears an incompatible category when changing type, keeping unrelated URL context', () => {
  mount('/experiences?type=tour&category=islands&ref=source');
  fireEvent.click(screen.getByRole('button', { name: 'Activities' }));
  expect(screen.getByTestId('url')).toHaveTextContent('/experiences?type=activity&ref=source');
  expect(screen.getAllByTestId('offer')).toHaveLength(1);
 });
 it('preserves a compatible category when changing to all types', () => {
  mount('/experiences?type=tour&category=islands');fireEvent.click(screen.getByRole('button', { name: 'All' }));
  expect(screen.getByTestId('url')).toHaveTextContent('/experiences?category=islands');
 });
 it.each(['price_asc', 'price_desc'])('keeps unrecorded prices last with %s and persists sorting in the URL', sort => {
  mount(); fireEvent.change(screen.getByRole('combobox', { name: 'Sort experiences' }), { target: { value: sort } });
  expect(screen.getByTestId('url')).toHaveTextContent('/experiences?sort=' + sort);
  expect(screen.getAllByTestId('offer').at(-1)).toHaveTextContent('Request-priced tour');
  expect(screen.getAllByTestId('offer')[0]).toHaveTextContent(sort === 'price_asc' ? 'Island route' : 'Underwater activity');
 });
 it('reads search from the URL, sanitizes the reader query, and resets only catalogue filters', () => {
  mount('/experiences?ref=source'); fireEvent.change(screen.getByRole('textbox', { name: 'Search experiences…' }), { target: { value: 'Island,()%' } });
  expect(state.read).toHaveBeenLastCalledWith({ publishedOnly: true, type: undefined, category: undefined, search: 'Island' });
  expect(screen.getAllByTestId('offer')).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
  expect(screen.getByTestId('url')).toHaveTextContent('/experiences?ref=source');
 });
 it('shows a retryable read failure separately from confirmed empty results', () => {
  state.error = true; mount();
  expect(screen.getByRole('alert')).toHaveTextContent('Experiences could not be loaded');
  expect(screen.queryByText('No offers match these filters')).not.toBeInTheDocument();
  expect(screen.queryByText('0 results')).not.toBeInTheDocument();
  fireEvent.click(within(screen.getByRole('alert')).getByRole('button', { name: 'Try again' })); expect(state.retry).toHaveBeenCalledTimes(1);
 });
 it('keeps category failures distinct while the actual catalogue remains browsable', () => {
  state.categoryError = true; mount();
  expect(screen.getAllByTestId('offer')).toHaveLength(3);
  fireEvent.click(screen.getByRole('button', { name: 'Retry categories' })); expect(state.categoryRetry).toHaveBeenCalledTimes(1);
 });
 it.each(['type=unknown', 'sort=unknown'])('does not silently show all offers for unknown filter %s', query => {
  mount('/experiences?' + query);
  expect(screen.getByText('Unknown filter')).toBeInTheDocument();
  expect(screen.queryAllByTestId('offer')).toHaveLength(0);
  fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));expect(screen.getAllByTestId('offer')).toHaveLength(3);
 });
 it('renders the primary filter controls and states in Thai', () => {
  state.language = 'th'; mount();
  expect(screen.getByRole('heading', { level: 1, name: 'ประสบการณ์' })).toBeInTheDocument();
  expect(screen.getByRole('group', { name: 'ประเภทประสบการณ์' })).toBeInTheDocument();
  expect(screen.getByRole('combobox', { name: 'เรียงลำดับประสบการณ์' })).toBeInTheDocument();
 });
});


describe('actual experience detail return states', () => {
 it('keeps filters through an error and retry, then returns via the actual header button', () => {
  state.useActualDetail = true; state.detailError = true;
  mount('/experiences?type=tour&category=islands&sort=price_desc');
  fireEvent.click(screen.getByRole('link', { name: 'Island route' }));
  expect(screen.getByRole('alert')).toHaveTextContent('The experience could not be loaded');
  expect(screen.queryByText('Not Found')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));expect(state.detailRetry).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: 'Go back' }));
  expect(screen.getByTestId('url')).toHaveTextContent('/experiences?type=tour&category=islands&sort=price_desc');
  expect(screen.getAllByTestId('offer')).toHaveLength(2);
 });
 it('distinguishes confirmed missing from failure and returns to the selected category', () => {
  state.useActualDetail = true; mount('/experiences?category=islands');
  fireEvent.click(screen.getByRole('link', { name: 'Island route' }));
  expect(screen.getByRole('heading', { name: 'Not Found' })).toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Back to list' }));
  expect(screen.getByTestId('url')).toHaveTextContent('/experiences?category=islands');
 });
 it('allows a safe return while the detail read is loading', () => {
  state.useActualDetail = true; state.detailLoading = true; mount('/experiences?type=tour');
  fireEvent.click(screen.getByRole('link', { name: 'Island route' }));
  fireEvent.click(screen.getByRole('button', { name: 'Go back' }));
  expect(screen.getByTestId('url')).toHaveTextContent('/experiences?type=tour');
 });
});


it('composes rapid search and sorting controls over the intended URL', () => {
 mount('/experiences?ref=source');
 act(() => {
  fireEvent.change(screen.getByRole('textbox', { name: 'Search experiences…' }), { target: { value: 'Island' } });
  fireEvent.change(screen.getByRole('combobox', { name: 'Sort experiences' }), { target: { value: 'price_desc' } });
 });
 expect(screen.getByTestId('url')).toHaveTextContent('ref=source&q=Island&sort=price_desc');
 expect(screen.getAllByTestId('offer')).toHaveLength(1);
});
it('shows stored foreign currency and unknown prices without claiming THB or zero', () => {
 state.currency = 'USD'; mount();
 expect(screen.getAllByTestId('offer')[0]).toHaveTextContent('USD 200.00');
 expect(screen.getAllByTestId('offer')[2]).toHaveTextContent('Price on request');
});
it('does not broaden a search containing only filter operators to all offers', () => {
 mount('/experiences?q=%25()');
 expect(screen.queryAllByTestId('offer')).toHaveLength(0);
 expect(screen.getByText('Unknown filter')).toBeInTheDocument();
});


it('does not compare raw amounts across currencies as though they were one price', () => {
 state.mixedCurrency = true; mount('/experiences?sort=price_asc');
 expect(screen.getByText(/Prices use different or unspecified currencies/)).toHaveAttribute('role', 'status');
 expect(screen.getByRole('option', { name: 'Price: low to high' })).toBeDisabled();
 expect(screen.getAllByTestId('offer')).toHaveLength(3);
});

 it('drills from a group into existing topics and preserves group on history return', () => {
  mount(); fireEvent.click(screen.getByRole('button', { name: 'Sea & islands' }));
  expect(screen.getByTestId('url')).toHaveTextContent('group=sea');
  fireEvent.click(screen.getByRole('button', { name: 'Diving' }));
  expect(screen.getByTestId('url')).toHaveTextContent('group=sea&category=diving');
  expect(screen.getAllByTestId('offer')).toHaveLength(1);
 });
 it.each(['group=unknown', 'place=unknown'])('rejects unknown discovery filter %s', query => {
  mount('/experiences?' + query); expect(screen.getByText('Unknown filter')).toBeInTheDocument();
  expect(screen.queryAllByTestId('offer')).toHaveLength(0);
 });
 it('does not infer a visitable venue from an activity category', () => {
  mount('/experiences?place=fixed'); expect(screen.queryAllByTestId('offer')).toHaveLength(0);
  expect(screen.getByText('No offers match these filters')).toBeInTheDocument();
 });
