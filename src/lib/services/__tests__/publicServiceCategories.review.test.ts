import { describe, expect, it } from 'vitest';
import { CATEGORIES } from '@/lib/catalog/taxonomy';
import { publicServiceCategories } from '../publicServiceCategories';
const category = CATEGORIES.find(item => item.id === 'cat-transport')!;
const homeService = CATEGORIES.find(item => item.id === 'cat-home-services')!.services.find(item => item.id === 'services')!;
describe('home entry compatibility', () => {
  it.each(['/services', '/services?category=cat-home-services', '/discover/services?category=cat-home-services'])('recognises a canonical home leaf at %s without requiring a parent alias', path => {
    const rows = publicServiceCategories([{ ...category, services: [{ ...homeService, path }] }]);
    expect(rows.find(row => row.id === 'home')?.path).toBe('/discover/services?category=cat-home-services');
  });
  it('does not relabel an unrelated subset or inactive leaf as all home services', () => {
    expect(publicServiceCategories([{ ...category, services: [{ ...homeService, path: '/services?category=plumbing' }] }])).toEqual([]);
    expect(publicServiceCategories([{ ...category, services: [{ ...homeService, status: 'soon' }] }])).toEqual([]);
  });
});
