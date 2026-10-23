import { expect, it } from 'vitest';
import type { CategoryEntry, ServiceEntry } from '@/lib/catalog/taxonomy';
import { homeServiceCategories } from './homeServiceCategories';
const leaf = (id: string, path: string, status: ServiceEntry['status'] = 'available') => ({ id, path, status, labelEn: id, labelRu: id }) as ServiceEntry;
const category = (id: string, services: ServiceEntry[] = [], status?: ServiceEntry['status']) => ({ id, services, status, labelEn: id, labelRu: id }) as CategoryEntry;
it('selects each existing category destination once across parent and child levels', () => {
  const rows = homeServiceCategories([
    category('cat-leisure', [leaf('flowers', '/flowers'), leaf('flowers', '/flowers')]),
    category('cat-transport', [leaf('vehicle', '/transport')]),
    category('cat-tourism', [leaf('yacht', '/yachts')]),
    category('cat-home-services', [leaf('services', '/services')]),
  ]);
  expect(rows.map(row => row.path)).toEqual(['/flowers', '/transport', '/yachts', '/services']);
  expect(rows.at(-1)?.labelEn).toBe('cat-home-services');
  expect(new Set(rows.map(row => row.id)).size).toBe(4);
});
it('never manufactures categories when the live taxonomy is empty or partial', () => {
  expect(homeServiceCategories([])).toEqual([]);
  expect(homeServiceCategories([category('cat-leisure', [leaf('flowers', '/flowers')])]).map(row => row.path)).toEqual(['/flowers']);
});
it('omits disabled parents, gated children, external and mismatched destinations', () => {
  expect(homeServiceCategories([
    category('cat-leisure', [leaf('flowers', '/flowers')], 'soon'),
    category('cat-transport', [leaf('vehicle', '/transport', 'pro')]),
    category('cat-tourism', [leaf('yacht', 'https://example.invalid')]),
    category('other', [leaf('flowers', '#'), leaf('vehicle', '/admin/users')]),
    category('cat-home-services', [], 'soon'),
  ])).toEqual([]);
});
it('supports existing flat taxonomy identities without changing public routes', () => {
  expect(homeServiceCategories([category('flowers'), category('transport'), category('yachts'), category('services')]).map(row => row.path))
    .toEqual(['/flowers', '/transport', '/yachts', '/services']);
});
