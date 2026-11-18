import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import MapView from './MapView';

// UI integration only: no production reads/writes, network, or WebGL required.
// Keep fixture references stable to exercise real MapView effects and URL sync.
const queries = vi.hoisted(() => new Map<string, () => Promise<unknown>>());
const calls = vi.hoisted(() => [] as Array<{ table: string; columns: string; filters: Array<[string, unknown]> }>);
const fixtures = vi.hoisted(() => ({
  empty: [],
  places: Object.fromEntries(['salons-map','gyms-map','pharmacies-map','veterinary_clinics-map'].map((key,index)=>[key,[{id:'place-'+index,name_en:'Place '+index,name_ru:'Место '+index,lat:8+index*.01,lng:98.3}]])),
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
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  from: (table: string) => {
    const call = { table, columns: '', filters: [] as Array<[string, unknown]> };
    calls.push(call);
    const chain = {
      select: (columns: string) => { call.columns = columns; return chain; },
      eq: (column: string, value: unknown) => { call.filters.push([column, value]); return chain; },
      not: () => chain,
      or: () => chain,
      then: (resolve: (value: { data: never[]; error: null }) => unknown) => Promise.resolve(resolve({ data: [], error: null })),
    };
    return chain;
  },
} }));
vi.mock('@tanstack/react-query', () => ({ useQuery: ({queryKey, queryFn}: {queryKey:string[]; queryFn: () => Promise<unknown>}) => { queries.set(queryKey[0], queryFn); return { data: (queryKey[0] === 'restaurants-map' ? fixtures.restaurants : fixtures.places[queryKey[0]]) ?? fixtures.empty, isLoading: false }; } }));
vi.mock('@/hooks/useProperties', () => ({ usePropertiesForMap: () => ({ data: fixtures.empty, isLoading: false }), transformPropertiesToMarkers: () => fixtures.empty }));
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


describe('MapView source publication guards', () => {
  it('applies approval to moderated places and events even in privileged sessions, without querying nonexistent columns', async () => {
    queries.clear(); calls.length = 0;
    render(<MemoryRouter><MapView /></MemoryRouter>);
    for (const key of ['restaurants-map', 'salons-map', 'gyms-map', 'pharmacies-map', 'veterinary_clinics-map', 'flower_shops-map', 'venues-map', 'events-map', 'communities-map']) {
      expect(queries.has(key)).toBe(true);
      await queries.get(key)!();
    }
    for (const table of ['restaurants', 'public_salon_catalog', 'gyms', 'pharmacies', 'flower_shops', 'events']) {
      const call = calls.find(item => item.table === table)!;
      expect(call.filters).toContainEqual(['is_active', true]);
      expect(call.filters).toContainEqual(['approval_status', 'approved']);
      expect(call.columns).not.toContain('*');
    }
    for (const table of ['veterinary_clinics', 'venues', 'communities']) {
      const call = calls.find(item => item.table === table)!;
      expect(call.filters).toEqual([['is_active', true]]);
      expect(call.columns).not.toContain('*');
    }
    expect(calls.find(call => call.table === 'restaurants')?.columns).toBe('id, name_en, name_ru, lat, lng, rating, cover_image, district, cuisine, working_hours');
    expect(calls).toHaveLength(9);
  });
});
