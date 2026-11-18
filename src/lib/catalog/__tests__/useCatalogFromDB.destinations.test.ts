import { describe, expect, it, vi } from 'vitest';
import { useCatalogFromDB } from '../useCatalogFromDB';
import { catalogServiceLifeId, type ServiceSituationLink } from '../serviceSituationLinks';
import { projectServiceDiscovery } from '@/lib/services/serviceDiscoveryProjection';
import { catalogServicePath } from '../serviceLookup';
const fixture = vi.hoisted(() => ({ data: {
  serviceSituationLinks: [] as ServiceSituationLink[], groups: [], clusterLifeSituations: [], categories: [
    { id: 'synthetic-parent', slug: 'cat-home-services', name_en: 'Home', name_ru: 'Дом', parent_id: null, group_id: null, status: 'available' },
    { id: 'synthetic-child', slug: 'services', name_en: 'All home services', name_ru: 'Для дома', parent_id: 'synthetic-parent', app_path: '/services', status: 'available' },
  ],
} }));
vi.mock('@tanstack/react-query', () => ({ useQuery: () => ({ data: fixture.data, isError: false, refetch: vi.fn() }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
describe('DB-shaped canonical home destination', () => {
  it.each(['cat-home-services', 'cat-home-living', 'home-services', 'services'])('adapts the existing seed path for %s without changing the DB identity', parentId => {
    fixture.data.categories[0].slug = parentId;
    const actual = useCatalogFromDB();
    expect(actual.isFromDB).toBe(true);
    const service = actual.categories[0].services[0];
    expect(actual.categories[0].id).toBe(parentId);
    expect(service.path).toBe('/discover/services?category='+parentId);
    expect(new URL(service.path, 'https://fixture.test').searchParams.get('category')).toBe(parentId);
    expect(service.situationCodes).toEqual([]);
  });
  it('keeps unknown parents unclassified instead of inventing a home mapping', () => {
    fixture.data.categories[0].slug = 'cat-home-unknown';
    const actual = useCatalogFromDB();
    expect(actual.categories[0].id).toBe('cat-home-unknown');
    expect(actual.categories[0].services[0].path).toBe('/services');
    expect(actual.categories[0].services[0].situationCodes).toEqual([]);
  });
  it('reflects edited situations without dropping the destination from All', () => {
    fixture.data.categories[1].slug = 'restaurants';
    fixture.data.serviceSituationLinks = [{ entity_id: catalogServiceLifeId('restaurant')!, role_scope: null, life_situations: { code: 'arrival', is_active: true } }];
    const filters = { query: '', category: '', situation: 'arrival' };
    expect(projectServiceDiscovery(useCatalogFromDB().categories, filters)).toHaveLength(1);
    fixture.data.serviceSituationLinks = [];
    expect(projectServiceDiscovery(useCatalogFromDB().categories, filters)).toHaveLength(0);
    expect(projectServiceDiscovery(useCatalogFromDB().categories, { ...filters, situation: '' })).toHaveLength(1);
    fixture.data.categories[1].slug = 'services';
  });
  it('preserves unrelated, unknown and explicit specialized DB destinations', () => {
    expect(catalogServicePath('cat-home-services', 'cleaning', '/services')).toBe('/services');
    expect(catalogServicePath('unknown', 'services', '/services')).toBe('/services');
    expect(catalogServicePath('cat-home-living', 'services', '/services')).toBe('/discover/services?category=cat-home-living');
    expect(catalogServicePath('cat-home-living', 'services', '/services/order/deep_cleaning')).toBe('/services/order/deep_cleaning');
    expect(catalogServicePath('cat-home-services', 'services', '/services?custom=1')).toBe('/services?custom=1');
    expect(catalogServicePath('cat-home-services', 'services', '/services/order/deep_cleaning')).toBe('/services/order/deep_cleaning');
  });
});
