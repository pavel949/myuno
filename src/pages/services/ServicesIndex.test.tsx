import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import ServicesIndex from './ServicesIndex';
import { isKnownRoute } from '@/lib/nav/routeRegistry';
import { serviceCatalogueReturnTo } from '@/lib/services/serviceNavigation';
import { CATEGORIES, LIFE_SITUATIONS } from '@/lib/catalog/taxonomy';
const state = vi.hoisted(() => ({ loading: false, error: false, fallback: false, providerOnly: false }));
vi.mock('@/lib/catalog/useCatalogFromDB', () => ({ useCatalogFromDB: () => ({ categories: CATEGORIES, lifeSituations: LIFE_SITUATIONS, isFromDB: !state.fallback, isLoading: state.loading, error: state.error ? new Error('fixture') : null, refetch: vi.fn() }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/components/miniapp/MiniAppLayout', () => ({ MiniAppLayout: ({ children, onSearchChange, searchValue }: { children: ReactNode; onSearchChange: (s: string) => void; searchValue: string }) => <><input type="search" aria-label="Search services…" value={searchValue} onChange={e => onSearchChange(e.target.value)} />{children}</> }));
vi.mock('@/hooks/useServiceMarketplace', () => ({ useMarketplaceServices: () => ({ data: state.providerOnly ? [{ name_en: 'Synthetic provider offer', provider: { name: 'Synthetic' } }] : [], isLoading: false, isError: false }) }));
vi.mock('@/components/services/MarketplaceServiceGrid', () => ({ MarketplaceServiceGrid: () => null }));
vi.mock('@/components/services', () => ({ ServiceFunctionCard: ({ fn, onClick }: { fn: { name: string }; onClick: () => void }) => <button onClick={onClick}>{fn.name}</button> }));
function Location() { const l = useLocation(); const navigate = useNavigate(); return <><output data-testid="location">{l.pathname}{l.search}{l.hash}|{JSON.stringify(l.state)}</output><button onClick={() => navigate(-1)}>Back fixture</button><button onClick={() => navigate(1)}>Forward fixture</button></>; }
function mount(path = '/discover/services') { return render(<MemoryRouter initialEntries={[{ pathname: path.split('?')[0], search: path.includes('?') ? '?'+path.split('?')[1] : '', state: { from: 'trip' } }]}><Routes><Route path="/discover/services" element={<ServicesIndex />} /><Route path="/services/order/:id" element={<div>Request details</div>} /></Routes><Location /></MemoryRouter>); }
beforeEach(() => { state.loading = false; state.error = false; state.fallback = false; state.providerOnly = false; Element.prototype.scrollIntoView = vi.fn(); Element.prototype.hasPointerCapture = vi.fn(() => false); });
const select = (name: string, option: string) => { fireEvent.keyDown(screen.getByRole('combobox', { name }), { key: 'Enter' }); fireEvent.click(screen.getByRole('option', { name: option })); };
describe('canonical services hub', () => {
  it('offers equal views and real specialised routes without duplicate services', () => {
    mount();
    expect(screen.getByRole('tab', { name: 'By category' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'By situation' })).toBeVisible();
    const links = within(screen.getByTestId('service-catalogue-results')).getAllByRole('link');
    expect(new Set(links.map(link => link.getAttribute('href'))).size).toBe(links.length);
    expect(links.some(link => link.getAttribute('href') === '/yachts')).toBe(true);
    expect(links.some(link => link.getAttribute('href') === '/transport/airport-transfer')).toBe(true);
    expect(screen.getByRole('link', { name: 'My requests' })).toHaveAttribute('href', '/bookings');
  });
  it('keeps only registered active destinations through full catalogue expansion', () => {
    mount();
    while (screen.queryByRole('button', { name: 'Show more' })) fireEvent.click(screen.getByRole('button', { name: 'Show more' }));
    for (const link of within(screen.getByTestId('service-catalogue-results')).getAllByRole('link')) expect(isKnownRoute(link.getAttribute('href')!)).toBe(true);
    const renderedHeadings = new Set(within(screen.getByTestId('service-catalogue-results')).getAllByRole('heading', { level: 3 }).map(heading => heading.textContent));
    for (const parent of CATEGORIES) for (const service of parent.services.filter(item => item.status === 'soon' || item.status === 'pro')) expect(renderedHeadings.has(service.labelEn)).toBe(false);
    expect(screen.queryByRole('button', { name: /role/i })).toBeNull();
  });
  it.each(['/services?category=ac', '/discover/services?q=cleaning'])('accepts an existing catalogue return %s', path => {
    expect(serviceCatalogueReturnTo(path)).toBe(path);
  });
  it.each([null, '//evil.test', 'https://evil.test', '/services/order/123', '/discover/services#outside'])('rejects unsafe catalogue return %s', path => {
    expect(serviceCatalogueReturnTo(path)).toBe('/discover/services');
  });
  it('uses category and situation as projections over identical service destinations', () => {
    mount('/discover/services?q=transfer');
    const original = within(screen.getByTestId('service-catalogue-results')).getAllByRole('link').map(link => link.getAttribute('href'));
    fireEvent.click(screen.getByRole('tab', { name: 'By situation' }));
    expect(within(screen.getByTestId('service-catalogue-results')).getAllByRole('link').map(link => link.getAttribute('href'))).toEqual(original);
    expect(screen.getByRole('searchbox')).toHaveValue('transfer');
  });
  it('groups the eleven home children and restores legacy category requests', () => {
    mount('/discover/services?category=ac&q=cleaning');
    expect(screen.getByRole('combobox', { name: 'Home services' })).toHaveTextContent('Air Conditioning');
    expect(screen.getByText('AC Cleaning')).toBeVisible();
    expect(screen.queryByText('AC Installation')).toBeNull();
    fireEvent.click(screen.getByText('AC Cleaning'));
    expect(screen.getByTestId('location').textContent).toContain('returnTo=%2Fdiscover%2Fservices%3Fcategory%3Dac%26q%3Dcleaning');
    fireEvent.click(screen.getByText('Back fixture'));
    expect(screen.getByRole('searchbox')).toHaveValue('cleaning');
    expect(screen.getByText(/Prices are estimates/)).toBeVisible();
    select('Home services', 'All home services');
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '' } });
    fireEvent.keyDown(screen.getByRole('combobox', { name: 'Home services' }), { key: 'Enter' });
    expect(screen.getAllByRole('option')).toHaveLength(12);
  });
  it('preserves query, opaque state and URL context during category Back/Forward and reset', () => {
    mount('/discover/services?ref=trip');
    select('Category', 'Tourism & Activities');
    expect(screen.getByTestId('location').textContent).toContain('category=cat-tourism');
    fireEvent.click(screen.getByText('Back fixture'));
    expect(screen.getByRole('combobox', { name: 'Category' })).toHaveTextContent('All');
    fireEvent.click(screen.getByText('Forward fixture'));
    expect(screen.getByRole('combobox', { name: 'Category' })).toHaveTextContent('Tourism & Activities');
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zz-unmatched' } });
    expect(screen.getByText('No services found')).toBeVisible();
    fireEvent.click(screen.getByText('Clear search and filters'));
    expect(screen.getByTestId('location')).toHaveTextContent('ref=trip|{"from":"trip"}');
  });
  it('shows hidden-view filters and combines them deterministically', () => {
    mount('/discover/services?category=cat-transport&situation=arrival&browse=situations');
    expect(screen.getByRole('combobox', { name: 'Situation' })).not.toHaveTextContent('All');
    fireEvent.click(screen.getByRole('tab', { name: 'By category' }));
    expect(screen.getByLabelText('Applied filters')).toBeDefined();
  });
  it.each(['photography', 'cat-unknown'])('does not silently replace unsupported category %s', category => {
    mount('/discover/services?category='+category);
    expect(screen.getByText('No services found')).toBeVisible();
    expect(screen.queryByText('AC Cleaning')).toBeNull();
  });
  it('does not show a false empty state when only a provider offer matches', () => {
    state.providerOnly = true;
    mount('/discover/services?q=synthetic');
    expect(screen.queryByText('No services found')).toBeNull();
  });
  it('keeps unknown situations empty instead of broadening results', () => {
    mount('/discover/services?situation=unknown');
    expect(screen.getByText('No services found')).toBeVisible();
  });
  it.each(['loading', 'error', 'fallback'])('does not show fallback supply in %s state', phase => {
    state.loading = phase === 'loading'; state.error = phase === 'error'; state.fallback = phase === 'fallback'; mount();
    expect(screen.queryByTestId('service-catalogue-results')).toBeNull();
    expect(phase === 'loading' ? screen.getByText('Loading catalogue…') : screen.getByRole('alert')).toBeVisible();
  });
});
