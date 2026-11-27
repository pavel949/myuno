import { expect, it } from 'vitest';
import type { CategoryEntry, ServiceEntry } from '@/lib/catalog/taxonomy';
import { homeServiceCategories } from './homeServiceCategories';

const leaf = (path: string, status: ServiceEntry['status'] = 'available') => ({ id: path, path, status }) as ServiceEntry;
const category = (id: CategoryEntry['id'], services: ServiceEntry[] = [], status?: CategoryEntry['status']) =>
  ({ id, services, status, labelEn: id, labelRu: id }) as CategoryEntry;

it('links returned service groups to their canonical scoped marketplace', () => {
  const rows = homeServiceCategories([
    category('cat-transport', [leaf('/transport'), leaf('/transport/fast-track')]),
    category('cat-home-services'),
  ]);
  expect(rows.map(row => row.path)).toEqual([
    '/discover/services?category=cat-home-services',
    '/discover/services?category=cat-transport',
  ]);
  expect(rows[1].services.map(service => service.path)).toEqual(['/transport', '/transport/fast-track']);
  expect(rows[1]).not.toHaveProperty('image');
});

it('keeps empty and unavailable groups out of the home marketplace navigation', () => {
  expect(homeServiceCategories([])).toEqual([]);
  expect(homeServiceCategories([
    category('cat-leisure', [leaf('/flowers')], 'soon'),
    category('cat-transport', [leaf('/transport', 'pro')]),
    category('cat-tourism', [leaf('//example.invalid/yachts')]),
  ])).toEqual([]);
});
