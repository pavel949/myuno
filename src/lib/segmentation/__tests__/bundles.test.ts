import { describe, it, expect } from 'vitest';
import { SERVICE_BUNDLES, getBundleForPersona } from '../bundles';

describe('Service bundles — § 10', () => {
  it('defines all 14 canonical bundles', () => {
    expect(SERVICE_BUNDLES).toHaveLength(14);
  });

  it('every bundle has a unique id and non-empty composition + price', () => {
    const ids = SERVICE_BUNDLES.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const b of SERVICE_BUNDLES) {
      expect(b.items.length).toBeGreaterThan(0);
      expect(b.price.en.length).toBeGreaterThan(0);
      expect(b.price.ru.length).toBeGreaterThan(0);
      expect(b.personaCodes.length).toBeGreaterThan(0);
    }
  });

  it('maps snowbird persona P5 → Snowbird Winter Pack', () => {
    expect(getBundleForPersona('P5')?.id).toBe('snowbird-winter-pack');
  });

  it('maps pet-owner persona P13 → Pet Arrival Pack', () => {
    expect(getBundleForPersona('P13')?.id).toBe('pet-arrival-pack');
  });

  it('maps wedding persona P15 → Destination Wedding', () => {
    expect(getBundleForPersona('P15')?.id).toBe('destination-wedding');
  });

  it('returns undefined for a persona with no bundle', () => {
    expect(getBundleForPersona('P26')).toBeUndefined();
    expect(getBundleForPersona('P999')).toBeUndefined();
  });
});
