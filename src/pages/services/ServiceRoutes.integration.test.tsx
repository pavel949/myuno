import { Suspense, type ReactNode } from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation, useSearchParams } from 'react-router-dom';
import { Discover, GoalEntryPage, MeServices, ServicesIndex, SituationNavigator } from '@/components/layout/pageRegistry';
import { BackButton } from '@/components/uno/BackButton';
import { CATEGORIES, LIFE_SITUATIONS } from '@/lib/catalog/taxonomy';
import { serviceCatalogueReturnTo } from '@/lib/services/serviceNavigation';

vi.mock('@/lib/catalog/useCatalogFromDB', () => ({ useCatalogFromDB: () => ({ categories: CATEGORIES, lifeSituations: LIFE_SITUATIONS, isFromDB: true, isLoading: false, error: null }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en', t: (s: string) => s }) }));
vi.mock('@/hooks/usePersonaFilter', () => ({ usePersonaFilter: () => ({ applyFilter: (rows: unknown[]) => rows }) }));
vi.mock('@/components/miniapp/MiniAppLayout', () => ({ MiniAppLayout: ({ children, searchValue, onSearchChange }: { children: ReactNode; searchValue: string; onSearchChange: (value: string) => void }) => <main data-testid="public-catalog-shell"><input aria-label="Search services" value={searchValue} onChange={e => onSearchChange(e.target.value)} />{children}</main> }));
vi.mock('@/components/layout/MeShellLayout', () => ({ MeShellLayout: ({ children }: { children: ReactNode }) => <main data-testid="account-shell">{children}</main> }));
vi.mock('@/components/home/HomeDiscoverySearch', () => ({ HomeDiscoverySearch: () => null }));
vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock('@/components/services', () => ({ ServiceFunctionCard: ({ fn, onClick }: { fn: { name: string }; onClick: () => void }) => <button onClick={onClick}>{fn.name}</button> }));
vi.mock('@/components/services/ServiceBookingSheet', () => ({ ServiceBookingSheet: () => null }));
vi.mock('@/hooks/useServiceMarketplace', () => ({ useMarketplaceServices: () => ({ data: [{ id: 'cleaning', name_en: 'Fixture cleaning', provider_id: 'fixture', provider: { id: 'fixture', name: 'Fixture provider' } }], isLoading: false, isError: false }) }));
vi.mock('@/components/navigation/v3/NavigatorPageV3', () => ({ default: () => <p>Optional situation navigator</p> }));

function Location() { const location = useLocation(); return <output data-testid="location">{location.pathname}{location.search}</output>; }
function Detail() { const [params] = useSearchParams(); return <><p>Selected service</p><BackButton fallbackPath={serviceCatalogueReturnTo(params.get('returnTo'))} /></>; }
function mount(path: string) {
  return render(<MemoryRouter initialEntries={[path]}><Suspense fallback={<p>Loading route</p>}><Routes>
    <Route path="/discover" element={<Discover />} />
    <Route path="/discover/services" element={<GoalEntryPage goal="services" />} />
    <Route path="/discover/situations" element={<SituationNavigator />} />
    <Route path="/services" element={<ServicesIndex />} />
    <Route path="/me/services" element={<MeServices />} />
    <Route path="/services/order/:id" element={<Detail />} />
    <Route path="/services/provider/:id" element={<Detail />} />
  </Routes></Suspense><Location /></MemoryRouter>);
}
beforeAll(() => { Element.prototype.scrollIntoView = vi.fn(); Element.prototype.hasPointerCapture = vi.fn(() => false); });
afterEach(cleanup);

describe('integrated direct service route ownership', () => {
  it.each(['/discover', '/discover/services', '/services', '/me/services'])('preserves combined filters and request/provider return paths at %s', async path => {
    const original = `${path}?category=ac&q=cleaning&ref=fixture`;
    mount(original);
    await act(async () => { await vi.dynamicImportSettled(); });
    expect(await screen.findByRole('button', { name: /^AC Cleaning$/ })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^AC Cleaning$/ })).toHaveLength(1);
    expect(screen.queryByRole('button', { name: /^AC Installation$/ })).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Home services' })).toHaveTextContent('Air Conditioning');
    if (path === '/me/services') {
      expect(screen.getAllByTestId('account-shell')).toHaveLength(1);
      expect(screen.queryByTestId('public-catalog-shell')).not.toBeInTheDocument();
    }
    fireEvent.click(screen.getByRole('button', { name: /^AC Cleaning$/ }));
    expect(await screen.findByText('Selected service')).toBeInTheDocument();
    expect(screen.getByTestId('location').textContent).toContain(`returnTo=${encodeURIComponent(original)}`);
    fireEvent.click(screen.getByRole('button', { name: 'Go back' }));
    expect(await screen.findByRole('button', { name: /^AC Cleaning$/ })).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent(original);
    // Provider rows have no category metadata: the UI makes this limitation
    // explicit and preserves text/ref when the user chooses to remove it.
    expect(screen.queryByRole('link', { name: 'Fixture provider' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Browse provider offers' }));
    const providerContext = `${path}?q=cleaning&ref=fixture`;
    expect(screen.getByTestId('location')).toHaveTextContent(providerContext);
    fireEvent.click(screen.getByRole('link', { name: 'Fixture provider' }));
    expect(await screen.findByText('Selected service')).toBeInTheDocument();
    expect(screen.getByTestId('location').textContent).toContain(`returnTo=${encodeURIComponent(providerContext)}`);
    fireEvent.click(screen.getByRole('button', { name: 'Go back' }));
    expect(await screen.findByRole('link', { name: 'Fixture provider' })).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent(providerContext);
  });
  it.each(['/discover', '/discover/services', '/me/services'])('keeps unsupported categories empty at %s', async path => {
    mount(`${path}?category=photography&ref=fixture`);
    expect(await screen.findByText('No services found')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^AC Cleaning$/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear search and filters' }));
    expect(screen.getByTestId('location')).toHaveTextContent(`${path}?ref=fixture`);
  });
  it('keeps situations optional on its dedicated registry destination', async () => {
    mount('/discover/situations');
    expect(await screen.findByText('Optional situation navigator')).toBeInTheDocument();
    expect(screen.queryByText('Home service requests')).not.toBeInTheDocument();
  });
  it.each(['/discover?q=cleaning', '/me/services?category=ac'])('allows exact catalog destination %s', path => expect(serviceCatalogueReturnTo(path)).toBe(path));
  it.each(['/discoverevil?q=x', '/discover/situations', '/me/services/private', '//evil.test', 'https://evil.test', '/discover#outside'])('rejects non-catalog destination %s', path => expect(serviceCatalogueReturnTo(path)).toBe('/discover/services'));
});
