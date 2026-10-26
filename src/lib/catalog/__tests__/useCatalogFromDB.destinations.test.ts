import { describe, expect, it, vi } from 'vitest';
import { useCatalogFromDB } from '../useCatalogFromDB';
import { CATEGORIES } from '../taxonomy';
import { catalogServicePath } from '../serviceLookup';
const fixture = vi.hoisted(() => ({ data: {
  groups: [], clusterLifeSituations: [], categories: [
    { id: 'synthetic-parent', slug: 'cat-home-services', name_en: 'Home', name_ru: 'Дом', parent_id: null, group_id: null, status: 'available' },
    { id: 'synthetic-child', slug: 'services', name_en: 'All home services', name_ru: 'Для дома', parent_id: 'synthetic-parent', app_path: '/services', status: 'available' },
  ],
} }));
vi.mock('@tanstack/react-query', () => ({ useQuery: () => ({ data: fixture.data, isError: false, refetch: vi.fn() }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
describe('DB-shaped canonical home destination', () => {
  it('adapts the existing seed path to the same filtered destination as the static catalogue', () => {
    const actual = useCatalogFromDB();
    expect(actual.isFromDB).toBe(true);
    const service = actual.categories[0].services[0];
    const expected = CATEGORIES.find(c => c.id === 'cat-home-services')!.services.find(s => s.id === 'services')!;
    expect(service.path).toBe(expected.path);
    expect(new URL(service.path, 'https://fixture.test').searchParams.get('category')).toBe('cat-home-services');
    expect(service.situationCodes).toEqual(expected.situationCodes);
  });
  it('preserves unrelated, unknown and explicit specialized DB destinations', () => {
    expect(catalogServicePath('cat-home-services', 'cleaning', '/services')).toBe('/services');
    expect(catalogServicePath('unknown', 'services', '/services')).toBe('/services');
    expect(catalogServicePath('cat-home-services', 'services', '/services?custom=1')).toBe('/services?custom=1');
    expect(catalogServicePath('cat-home-services', 'services', '/services/order/deep_cleaning')).toBe('/services/order/deep_cleaning');
  });
});
