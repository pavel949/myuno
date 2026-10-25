import { describe, expect, it } from 'vitest';
import { AREA_GUIDES, areaInventoryFilters, areaSearchHref, findAreaGuide } from './areaRegistry';
import { PHUKET_DISTRICTS, normalizeDistrictId } from '@/lib/propertyTaxonomy';

describe('existing area registry extension', () => {
  it('uses four existing district identities and keeps Laguna distinct', () => {
    expect(AREA_GUIDES.map(area => area.key)).toEqual(['laguna', 'bang-tao', 'nai-yang', 'kamala']);
    for (const area of AREA_GUIDES) {
      expect(PHUKET_DISTRICTS.some(district => district.id === area.key)).toBe(true);
      expect(area.aliases.every(alias => normalizeDistrictId(alias) === area.key)).toBe(true);
      expect(area.sources.every(source => source.checkedAt === '2026-10-25' && source.url.startsWith('https://'))).toBe(true);
      expect(area.content.th).toBeNull();
    }
    expect(findAreaGuide('Bangtao')?.key).toBe('bang-tao');
    expect(findAreaGuide('Laguna')?.relationship?.key).toBe('bang-tao');
    expect(areaInventoryFilters(findAreaGuide('Laguna')!).rentals).toEqual({ district: 'laguna', listingType: 'rent' });
  });
  it('preserves distinct search field contracts and existing date filters', () => {
    const area = findAreaGuide('nai-yang')!;
    const rental = new URL(areaSearchHref(area, 'rentals', '?checkIn=2026-12-01&guests=2&district=kamala'), 'https://myuno.app');
    expect(rental.searchParams.get('district')).toBe('nai-yang');
    expect(rental.searchParams.get('checkIn')).toBe('2026-12-01');
    expect(rental.searchParams.get('guests')).toBe('2');
    expect(areaSearchHref(area, 'projects')).toBe('/property/offplan?district=Nai+Yang');
    expect(areaSearchHref(area, 'resale', '?district=kamala')).toBe('/property/resale?zone=Nai+Yang');
  });
  it.each(['rent-long', 'rent-month'])('preserves applicable legacy rental intent %s', intent => {
    const area = findAreaGuide('kamala')!;
    const params = new URL(areaSearchHref(area, 'rentals', `?mode=buy&intent=${intent}`), 'https://myuno.app').searchParams;
    expect(params.get('mode')).toBe('rent');
    expect(params.get('intent')).toBe(intent);
    expect(new URL(areaSearchHref(area, 'rentals', '?intent=assignment'), 'https://myuno.app').searchParams.has('intent')).toBe(false);
  });

});
