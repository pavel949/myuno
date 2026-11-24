import type { ReactNode } from 'react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Link, MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import YachtsIndex from '../YachtsIndex';
import FlowersIndex from '../../flowers/FlowersIndex';
import RestaurantsIndex from '../../restaurants/RestaurantsIndex';
vi.mock('@/hooks/useRestaurants', () => ({ useRestaurants: () => ({ restaurants: [{ id: 'pad-thai', name_en: 'Pad Thai Place', cuisine: 'thai' }], isLoading: false, error: state.error ? Error('Synthetic') : null, refetch: state.retry }) }));
const state = vi.hoisted(() => ({ error: false, retry: vi.fn() }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/contexts/CartContext', () => ({ useCart: () => ({ getItemsByType: () => [] }) }));
vi.mock('@/hooks/useDebouncedValue', () => ({ useDebouncedValue: (x: unknown) => x }));
vi.mock('@/hooks/useYachts', () => ({ useYachts: () => ({ yachts: [{ id: 'boat', name_en: 'Boat', capacity: 8, price_full_day: 100, currency: 'THB' }], isLoading: false, error: state.error ? Error('Synthetic') : null, refetch: state.retry }) }));
vi.mock('@/hooks/useBouquets', () => ({ useBouquets: () => ({ bouquets: [{ id: 'rose', name_en: 'Rose', price: 1200, colors: ['red'] }], isLoading: false, error: state.error ? Error('Synthetic') : null, refetch: state.retry }) }));
vi.mock('@/hooks/useDynamicFilterOptions', () => ({ useFlowerFilterOptions: () => ({ categoryRibbon: [], filterConfig: { sections: [] } }) }));
vi.mock('@/hooks/useExperiences', () => ({ formatDuration: () => '' }));
vi.mock('@/components/miniapp', () => ({
 MiniAppLayout: ({ title, subtitle, searchValue, onSearchChange, stickySubHeader, children }: { title: string; subtitle: string; searchValue: string; onSearchChange: (v: string) => void; stickySubHeader: ReactNode; children: ReactNode }) => <main><h1>{title}</h1><p>{subtitle}</p><input aria-label="Search" value={searchValue} onChange={e => onSearchChange(e.target.value)} />{stickySubHeader}{children}</main>,
 CatalogCard: ({ title, href }: { title: string; href: string }) => <Link to={href}>{title}</Link>,
}));
vi.mock('@/components/seo', () => ({ SEOHead: () => null }));
vi.mock('react-helmet-async', () => ({ Helmet: () => null }));
vi.mock('@/components/crosssell', () => ({ CrossSellSection: () => null }));
vi.mock('@/components/vertical/VerticalContextBanner', () => ({ VerticalContextBanner: () => null }));
vi.mock('@/components/vertical/VerticalInsightPanel', () => ({ VerticalInsightPanel: () => null }));
function Journey() {
 const location = useLocation(), navigate = useNavigate();
 return <><Routes><Route path="/yachts" element={<YachtsIndex />} /><Route path="/flowers" element={<FlowersIndex />} /><Route path="/restaurants" element={<RestaurantsIndex />} /><Route path="*" element={<p>Detail</p>} /></Routes><output data-testid="url">{location.pathname + location.search}</output><button onClick={() => navigate(-1)}>Back</button><button onClick={() => navigate(1)}>Forward</button></>;
}
const mount = (url: string) => render(<MemoryRouter initialEntries={[url]}><Journey /></MemoryRouter>);
beforeEach(() => { state.error = false; state.retry.mockClear(); });
afterEach(cleanup);
describe('yacht and flower discovery journeys', () => {
 it.each(['/yachts','/flowers'])('%s distinguishes errors from empty results and retries', path => {
  state.error = true; mount(path);
  expect(screen.getByRole('alert')).toBeInTheDocument();
  expect(screen.queryByText('0 results')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(state.retry).toHaveBeenCalledTimes(1);
 });
 it.each([['/yachts?q=Boat&guests=6','Boat'],['/flowers?q=Rose&colorPalette=red','Rose']])('restores %s after detail and browser Back/Forward', (url, name) => {
  mount(url);
  fireEvent.click(screen.getByRole('link', { name }));
  expect(screen.getByText('Detail')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Back' }));
  expect(screen.getByTestId('url')).toHaveTextContent(url);
  expect(screen.getByRole('textbox', { name: 'Search' })).toHaveValue(name);
  fireEvent.click(screen.getByRole('button', { name: 'Forward' }));
  expect(screen.getByText('Detail')).toBeInTheDocument();
 });
 it('resets all flower constraints rather than leaving an empty search, preserving attribution', () => {
  mount('/flowers?q=absent&colorPalette=red&category=roses&utm_source=test');
  fireEvent.click(screen.getByRole('button', { name: 'Clear all' }));
  expect(screen.getByTestId('url')).toHaveTextContent('/flowers?utm_source=test');
  expect(screen.getByRole('link', { name: 'Rose' })).toBeInTheDocument();
 });
 it.each([
  ['/flowers?persona=family&q=Rose', 'Rose', 'No bouquets match'],
  ['/restaurants?persona=family&ref=fixture', 'Pad Thai Place', 'No restaurants match'],
 ])('shows a true no-match state in %s and clears only the scenario', (url, name, noMatch) => {
  mount(url);
  expect(screen.getByText(new RegExp(noMatch))).toBeVisible();
  expect(screen.queryByText(name)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Search without scenario' }));
  expect(screen.getByTestId('url')).toHaveTextContent(url.replace('persona=family&', ''));
  expect(screen.getByText(name)).toBeVisible();
 });
 it('updates yacht sorting and restores it through history', () => {
  mount('/yachts');
  fireEvent.change(screen.getByRole('combobox', { name: 'Sort by' }), { target: { value: 'capacity' } });
  expect(screen.getByTestId('url')).toHaveTextContent('sort=capacity');
  fireEvent.click(screen.getByRole('button', { name: 'Back' }));
  expect(screen.getByRole('combobox', { name: 'Sort by' })).toHaveValue('featured');
 });
});
