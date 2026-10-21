import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PropertyIndex from './PropertyIndex';

const state = vi.hoisted(() => ({
  query: {
    data: { pages: [{ properties: [
      { id: 'villa', title_en: 'Villa', amenities: ['pool'] },
      { id: 'condo', title_en: 'Condo', amenities: [] },
    ] }] },
    isLoading: false,
    isError: false,
    fetchNextPage: vi.fn(),
    refetch: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
  },
  applyPersonaFilter: (items: unknown[]) => items,
}));
vi.mock('@/hooks/useProperties', () => ({ usePropertiesInfinite: () => state.query }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/contexts/CurrencyContext', () => ({ useCurrency: () => ({}) }));
vi.mock('@/hooks/useRecentlyViewed', () => ({ useRecentlyViewed: () => ({ items: [] }) }));
vi.mock('@/hooks/usePropertyFilterOptions', () => ({ usePropertyFilterOptions: () => ({ filterConfig: [] }) }));
vi.mock('@/hooks/usePersonaFilter', () => ({ usePersonaFilter: () => ({ applyFilter: state.applyPersonaFilter }) }));
vi.mock('@/components/seo', () => ({ SEOHead: () => null }));
vi.mock('./PropertyHub', () => ({ PropertyHubTabs: () => null }));
vi.mock('@/components/uno/BackButton', () => ({ BackButton: () => null }));
vi.mock('@/components/crosssell', () => ({ CrossSellSection: () => null }));
vi.mock('@/components/vertical/VerticalContextBanner', () => ({ VerticalContextBanner: () => null }));
vi.mock('@/components/vertical/VerticalInsightPanel', () => ({ VerticalInsightPanel: () => null }));
vi.mock('@/components/landings/PersonaFilterChip', () => ({ PersonaFilterChip: () => null }));
vi.mock('@/components/filters/UniversalFilter', () => ({
  UniversalFilter: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('@/components/property/AirbnbSearchBar', () => ({ AirbnbSearchBar: () => null }));
vi.mock('@/components/property/PropertyCategoryIcons.ribbon', () => ({ AirbnbCategoryRibbon: () => null }));
vi.mock('@/components/property/PropertyCategoryIcons', () => ({
  matchesCategory: (property: { amenities: string[] }, category: string) => property.amenities.includes(category),
}));
vi.mock('@/components/property/PropertyListingCard', () => ({
  PropertyListingCard: ({ property, isSelected, onSelect }: {
    property: { id: string }; isSelected: boolean; onSelect?: (id: string) => void;
  }) => {
    const navigate = useNavigate();
    return <button data-testid="listing" aria-pressed={isSelected} onClick={() => onSelect ? onSelect(property.id) : navigate(`/property/${property.id}`)}>{property.id}</button>;
  },
}));
vi.mock('@/components/property/PropertyMapView', () => ({
  PropertyMapView: ({ properties, selectedId, onSelect, mode }: {
    properties: { id: string }[]; selectedId: string | null; onSelect: (id: string) => void; mode: string;
  }) => <div data-testid="map" data-mode={mode}>
    {properties.map(property => <button key={property.id} data-testid="marker"
      aria-pressed={selectedId === property.id} onClick={() => onSelect(property.id)}>{property.id}</button>)}
  </div>,
}));

function LocationProbe() {
  const location = useLocation();
  const navigate = useNavigate();
  return <><output data-testid="location">{location.pathname}{location.search}</output>
    <button onClick={() => navigate(-1)}>Back in history</button></>;
}

function renderPage(search = '') {
  return render(<MemoryRouter initialEntries={['/property/browse' + search]}>
    <PropertyIndex /><LocationProbe />
  </MemoryRouter>);
}

beforeEach(() => {
  localStorage.clear();
  state.query.isError = false;
  state.query.isLoading = false;
  state.query.hasNextPage = false;
  state.query.isFetchingNextPage = false;
  state.query.data = { pages: [{ properties: [
    { id: 'villa', title_en: 'Villa', amenities: ['pool'] },
    { id: 'condo', title_en: 'Condo', amenities: [] },
  ] }] };
  vi.clearAllMocks();
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('Network forbidden in presentation test'))));
  vi.stubGlobal('IntersectionObserver', class {
    observe() {}
    disconnect() {}
    unobserve() {}
  });
});

describe('browse map continuity', () => {
  it('keeps query context and maps exactly the filtered result set without a second catalog query', () => {
    const params = new URLSearchParams({
      mode: 'buy', tenancy: 'long', intent: 'assignment', cats: 'pool',
      'f.price_min': '1000', district: 'Bang Tao', checkIn: '2026-11-01',
      checkOut: '2026-11-05', guests: '3', company: 'company-a',
    });
    renderPage('?' + params);
    expect(screen.getAllByTestId('listing').map(node => node.textContent)).toEqual(['villa']);
    fireEvent.click(screen.getByRole('button', { name: 'Map' }));
    expect(screen.getByTestId('map').getAttribute('data-mode')).toBe('buy');
    expect(screen.getAllByTestId('marker').map(node => node.textContent)).toEqual(['villa']);
    const after = new URLSearchParams(screen.getByTestId('location').textContent!.split('?')[1]);
    params.forEach((value, key) => expect(after.get(key)).toBe(value));
    expect(after.get('view')).toBe('map');
    expect(screen.getByTestId('location').textContent).toContain('/property/browse?');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('shares selection with cards and restores the same filters on map/list/history round trip', async () => {
    renderPage('?cats=pool&checkIn=2026-11-01&focus=villa');
    fireEvent.click(screen.getByRole('button', { name: 'Map' }));
    expect(screen.getByTestId('marker').getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByTestId('marker'));
    expect(screen.getByTestId('listing').getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'List' }));
    expect(screen.queryByTestId('map')).toBeNull();
    expect(screen.getByTestId('location').textContent).toContain('cats=pool');
    expect(screen.getByTestId('location').textContent).toContain('checkIn=2026-11-01');
    fireEvent.click(screen.getByRole('button', { name: 'Back in history' }));
    await waitFor(() => expect(screen.getByTestId('map')).toBeTruthy());
    expect(screen.getByTestId('listing').textContent).toBe('villa');
  });

  it('can load a later page when the loaded page has no category matches', () => {
    state.query.data = { pages: [{ properties: [{ id: 'condo', title_en: 'Condo', amenities: [] }] }] };
    state.query.hasNextPage = true;
    const view = renderPage('?cats=pool&view=map');
    expect(screen.queryByTestId('listing')).toBeNull();
    expect(screen.getByText('No matches in loaded listings yet. Check the next listings.')).toBeTruthy();
    expect(screen.queryByText('No properties match selected filters')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Load more' }));
    expect(state.query.fetchNextPage).toHaveBeenCalledOnce();
    state.query.data = { pages: [...state.query.data.pages, { properties: [{ id: 'villa', title_en: 'Villa', amenities: ['pool'] }] }] };
    state.query.hasNextPage = false;
    view.rerender(<MemoryRouter initialEntries={['/property/browse?cats=pool&view=map']}>
      <PropertyIndex /><LocationProbe />
    </MemoryRouter>);
    expect(screen.getByTestId('listing').textContent).toBe('villa');
    expect(screen.getByTestId('marker').textContent).toBe('villa');
    expect(screen.queryByRole('button', { name: 'Load more' })).toBeNull();
  });

  it('does not request another page while pagination is busy', () => {
    state.query.data = { pages: [{ properties: [{ id: 'condo', title_en: 'Condo', amenities: [] }] }] };
    state.query.hasNextPage = true;
    state.query.isFetchingNextPage = true;
    renderPage('?cats=pool');
    const button = screen.getByRole('button', { name: 'Loading...' });
    expect(button.hasAttribute('disabled')).toBe(true);
    fireEvent.click(button);
    fireEvent.click(button);
    expect(state.query.fetchNextPage).not.toHaveBeenCalled();
  });

  it('shows an exhausted no-match state only when there are no further pages', () => {
    state.query.data = { pages: [{ properties: [{ id: 'condo', title_en: 'Condo', amenities: [] }] }] };
    renderPage('?cats=pool');
    expect(screen.getByText('No properties match selected filters')).toBeTruthy();
    expect(screen.queryByText('No matches in loaded listings yet. Check the next listings.')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Load more' })).toBeNull();
  });

  it('keeps card detail navigation available while showing the map', () => {
    renderPage('?view=map&cats=pool');
    fireEvent.click(screen.getByTestId('listing'));
    expect(screen.getByTestId('location').textContent).toBe('/property/villa');
  });

  it('opens a shared map view URL directly', () => {
    renderPage('?view=map&mode=rent&cats=pool&focus=villa');
    expect(screen.getByTestId('map')).toBeTruthy();
    expect(screen.getByTestId('marker').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'List' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('distinguishes a failed catalog request from empty inventory and provides retry', () => {
    state.query.isError = true;
    state.query.data = { pages: [{ properties: [] }] };
    renderPage('?view=map');
    expect(screen.getByRole('alert').textContent).toContain('Could not load listings');
    expect(screen.queryByText('No properties yet')).toBeNull();
    expect(screen.queryByTestId('map')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(state.query.refetch).toHaveBeenCalledOnce();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('does not label cached partial results as complete after a request fails', () => {
    state.query.isError = true;
    renderPage('?view=map');
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.queryByTestId('map')).toBeNull();
    expect(screen.queryByText('Total: 2')).toBeNull();
  });
});

