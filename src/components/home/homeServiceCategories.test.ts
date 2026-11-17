import { expect, it } from 'vitest';
import type { CategoryEntry, ServiceEntry } from '@/lib/catalog/taxonomy';
const yachtArt = '/yachts/catamaran-53-1.webp';
import { homeServiceCategories } from './homeServiceCategories';
const leaf = (id: string, path: string, status: ServiceEntry['status'] = 'available') => ({ id, path, status, labelEn: id, labelRu: id }) as ServiceEntry;
const category = (id: string, services: ServiceEntry[] = [], status?: ServiceEntry['status']) => ({ id, services, status, labelEn: id, labelRu: id }) as CategoryEntry;
it('selects each existing category destination once across parent and child levels', () => {
  const rows = homeServiceCategories([
    category('cat-leisure', [leaf('flowers', '/flowers'), leaf('flowers', '/flowers')]),
    category('cat-transport', [leaf('transfer', '/transport/airport-transfer'), leaf('fast-track', '/transport/fast-track'), leaf('vehicle', '/transport')]),
    category('cat-tourism', [leaf('yacht', '/yachts')]),
    category('cat-home-services', [leaf('services', '/services')]),
  ]);
  expect(rows.map(row => row.path)).toEqual(['/flowers', '/yachts', '/transport/airport-transfer', '/transport', '/discover/services?category=cat-home-services']);
  expect(rows.at(-1)?.labelEn).toBe('cat-home-services');
  expect(new Set(rows.map(row => row.id)).size).toBe(5);
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
it('supports existing flat taxonomy identities and preserves the home category intent', () => {
  expect(homeServiceCategories([category('flowers'), category('transfer'), category('transport'), category('services')]).map(row => row.path))
    .toEqual(['/flowers', '/transport/airport-transfer', '/transport', '/discover/services?category=cat-home-services']);
});

it('only advertises Fast Track when its exact active route exists in the returned taxonomy', () => {
 const supplied = category('cat-transport', [leaf('transfer', '/transport/airport-transfer'), leaf('fast-track', '/transport/fast-track')]);
 const row = homeServiceCategories([supplied])[0];
 expect(row.labelRu).toBe('Трансфер и Fast Track');
 expect(row.secondary?.path).toBe('/transport/fast-track');
 expect(homeServiceCategories([category('cat-transport', [leaf('transfer', '/transport/airport-transfer'), leaf('fast-track', '/admin/users')])])[0].secondary).toBeUndefined();
});

it.each([{ extra: [] }, { extra: [leaf('fast-track', '/transport/fast-track', 'soon')] }])('does not advertise absent/gated Fast Track in any fallback language', ({ extra }) => {
 const row = homeServiceCategories([category('cat-transport', [leaf('transfer', '/transport/airport-transfer'), ...extra])])[0];
 expect([row.labelRu, row.labelEn, row.labelTh, ...Object.values(row.benefit)].join(' ')).not.toMatch(/fast.?track|фаст|ฟาสต์/i);
 expect(row.secondary).toBeUndefined();
});

it.each(['absent', 'soon'])('keeps independently active Fast Track when transfer is %s', status => {
 const leaves = [leaf('fast-track', '/transport/fast-track')];
 if (status === 'soon') leaves.push(leaf('transfer', '/transport/airport-transfer', 'soon'));
 const rows = homeServiceCategories([category('cat-transport', leaves)]);
 expect(rows).toHaveLength(1);
 expect(rows[0].path).toBe('/transport/fast-track');
 expect(rows[0].secondary).toBeUndefined();
 expect([rows[0].labelRu, rows[0].labelEn, ...Object.values(rows[0].benefit)].join(' ')).not.toMatch(/transfers|Трансфер|поездка/i);
});


it('uses the active canonical yacht category once, with an illustration and no invented inventory', () => {
  const rows = homeServiceCategories([category('cat-tourism', [leaf('yacht', '/yachts'), leaf('yacht', '/yachts')])]);
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({ id: 'yacht', path: '/yachts', labelEn: 'yacht' });
  expect(rows[0].image).toBe(yachtArt);
  expect(rows[0]).not.toHaveProperty('price');
  expect(rows[0]).not.toHaveProperty('availability');
});

it.each(['soon', 'pro'] as const)('does not promote a %s yacht parent or child', status => {
  expect(homeServiceCategories([category('cat-tourism', [leaf('yacht', '/yachts')], status)])).toEqual([]);
  expect(homeServiceCategories([category('cat-tourism', [leaf('yacht', '/yachts', status)])])).toEqual([]);
});

it.each(['/yacht', '/admin/yachts', '//example.invalid/yachts', '/yachts?available=true'])('does not replace the unverified yacht route %s with a catalogue claim', path => {
  expect(homeServiceCategories([category('cat-tourism', [leaf('yacht', path)])])).toEqual([]);
});
