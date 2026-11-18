import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';
import MapView from './MapView';

// UI integration only: no production reads/writes, network, or WebGL required.
// Keep fixture references stable to exercise real MapView effects and URL sync.
const fixtures = vi.hoisted(() => ({
  empty: [],
  offers: [
    { id: 'stay-1', routeId: 'villa-1', href: '/property/villa-1', layer: 'stay', name: 'Villa', nameRu: 'Вилла', lat: 7.98, lng: 98.31, rating: 0, priceFrom: 2000, district: 'Rawai', bedrooms: 3, propertyType: 'villa' },
    { id: 'sale-1', routeId: 'sale-1', href: '/property/sale-1', layer: 'sale', name: 'Sale', nameRu: 'Покупка', lat: 8, lng: 98.32, rating: 0, priceFrom: 6000000, district: 'Bang Tao' },
    { id: 'project-1', routeId: 'project-1', href: '/real-estate/newbuilds/project-1', layer: 'newbuild', name: 'Project', nameRu: 'Новый проект', lat: 8.01, lng: 98.33, rating: 0, priceFrom: null },
    { id: 'experience-1', routeId: 'experience-1', href: '/experiences/experience-1', layer: 'experience', name: 'Park', nameRu: 'Парк', lat: 7.99, lng: 98.34, rating: 0, priceFrom: 1000, category: 'adventure' },
  ],
  restaurants: [{ id: 'restaurant-1', name_en: 'Restaurant', name_ru: 'Ресторан у моря', lat: 8, lng: 98.35, rating: 0 }],
}));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'ru' }) }));
vi.mock('@/contexts/CurrencyContext', () => ({ useCurrency: () => ({ formatPrice: (value: number) => `฿${value}` }) }));
vi.mock('@/contexts/LocationContext', () => ({ useLocation: () => ({ getCityConfig: () => ({ lat: 7.98, lng: 98.31 }) }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
vi.mock('@tanstack/react-query', () => ({ useQuery: () => ({ data: fixtures.empty, isLoading: false }) }));
vi.mock('@/hooks/useProperties', () => ({ usePropertiesForMap: () => ({ data: fixtures.empty, isLoading: false }), transformPropertiesToMarkers: () => fixtures.empty }));
vi.mock('@/hooks/useRestaurants', () => ({ useRestaurants: () => ({ restaurants: fixtures.restaurants, isLoading: false }) }));
vi.mock('@/hooks/useExploreLayers', () => ({ useExploreLayers: () => ({ data: fixtures.offers, isLoading: false, layerErrors: fixtures.empty }) }));
vi.mock('@/hooks/useExperiences', () => ({ EXPERIENCE_CATEGORIES: [] }));
vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children }: React.PropsWithChildren) => <main>{children}</main> }));
vi.mock('@/components/map/PoiClaimSheet', () => ({ PoiClaimSheet: () => null }));
vi.mock('@/components/newbuilds/ProjectStartingPrice', () => ({ ProjectStartingPrice: () => <span>Цена по запросу</span> }));
vi.mock('@/components/map/MapSearchBox', () => ({ MapSearchBox: React.forwardRef(() => <input aria-label="Поиск места" />) }));
vi.mock('@/components/map/MapLibreMap', () => ({ MapLibreMap: React.forwardRef(({ markers, onMarkerClick }: { markers: Array<{ id: string; title: string }>; onMarkerClick: (marker: unknown) => void }, ref) => {
  React.useImperativeHandle(ref, () => ({ flyTo: vi.fn() }));
  return <section aria-label="Метки карты">{markers.map((marker) => <button key={marker.id} onClick={() => onMarkerClick(marker)}>{marker.title}</button>)}</section>;
}) }));

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="url">{location.pathname}{location.search}</output>;
}
function mount(url = '/map') {
  return render(<MemoryRouter initialEntries={[url]}><MapView /><LocationProbe /></MemoryRouter>);
}
const pins = () => within(screen.getByRole('region', { name: 'Метки карты' }));

describe('MapView integration smoke', () => {
  it('renders all available layers and filters them with shareable multi-layer URLs', () => {
    mount();
    expect(screen.getByRole('heading', { name: 'Найдите своё место на Пхукете' })).toBeInTheDocument();
    expect(pins().getAllByRole('button')).toHaveLength(5);
    fireEvent.click(screen.getByRole('button', { name: 'Посуточная аренда', exact: true }));
    expect(pins().getAllByRole('button')).toHaveLength(1);
    expect(screen.getByTestId('url')).toHaveTextContent('layers=stay');
    fireEvent.click(screen.getByRole('button', { name: 'Впечатления', exact: true }));
    expect(pins().getAllByRole('button')).toHaveLength(2);
    expect(screen.getByTestId('url')).toHaveTextContent('layers=stay%2Cexperience');
    fireEvent.click(screen.getByRole('button', { name: 'Все', exact: true }));
    expect(pins().getAllByRole('button')).toHaveLength(5);
  });
  it.each([
    ['Вилла', '/property/villa-1'],
    ['Покупка', '/property/sale-1'],
    ['Новый проект', '/real-estate/newbuilds/project-1'],
    ['Парк', '/experiences/experience-1'],
    ['Ресторан у моря', '/restaurants/restaurant-1'],
  ])('opens the real card route from %s', (name, route) => {
    mount();
    fireEvent.click(pins().getByRole('button', { name, exact: true }));
    expect(screen.getByTestId('url').textContent).toContain('focus=');
    fireEvent.click(screen.getByRole('button', { name: /Открыть предложение/ }));
    expect(screen.getByTestId('url').textContent?.split('?')[0]).toBe(route);
  });
  it('honors legacy vertical links and district filters, then resets without losing unrelated URL parameters', () => {
    mount('/map?vertical=stay&district=Rawai&campaign=summer');
    expect(pins().getAllByRole('button')).toHaveLength(1);
    expect(pins().getByRole('button', { name: 'Вилла' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Сбросить фильтры/ }));
    expect(pins().getAllByRole('button')).toHaveLength(5);
    expect(screen.getByTestId('url')).toHaveTextContent('/map?campaign=summer');
  });
});
