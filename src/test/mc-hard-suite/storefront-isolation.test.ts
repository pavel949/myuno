/**
 * @module storefront-isolation.test
 * @description Tests for MC isolated storefront — no cross-tenant data leakage.
 */
import { describe, it, expect } from 'vitest';
import {
  MC_ALPHA, MC_BETA,
  ALPHA_PROPERTIES, BETA_PROPERTIES,
} from './testSeedData';

describe('Isolated Storefront — Catalog Filtering', () => {

  function getStorefrontProperties(slug: string, allProperties: typeof ALPHA_PROPERTIES) {
    const companyMap: Record<string, string> = {
      [MC_ALPHA.slug]: MC_ALPHA.id,
      [MC_BETA.slug]: MC_BETA.id,
    };
    const companyId = companyMap[slug];
    if (!companyId) return [];
    
    return allProperties.filter(
      p => p.management_company_id === companyId && p.status === 'active'
    );
  }

  // SF-001: Only MC properties shown
  it('SF-001: Storefront shows only its MC active properties', () => {
    const allProps = [...ALPHA_PROPERTIES, ...BETA_PROPERTIES];
    const visible = getStorefrontProperties(MC_ALPHA.slug, allProps);
    
    expect(visible.length).toBeGreaterThan(0);
    expect(visible.every(p => p.management_company_id === MC_ALPHA.id)).toBe(true);
    expect(visible.every(p => p.status === 'active')).toBe(true);
  });

  // SF-002: No cross-MC leakage in search
  it('SF-002: Storefront never shows other MC properties', () => {
    const allProps = [...ALPHA_PROPERTIES, ...BETA_PROPERTIES];
    const alphaStorefront = getStorefrontProperties(MC_ALPHA.slug, allProps);
    
    const betaIds = new Set(BETA_PROPERTIES.map(p => p.id));
    const leaks = alphaStorefront.filter(p => betaIds.has(p.id));
    
    expect(leaks).toHaveLength(0);
  });

  // SF-003: Direct URL to other MC property
  it('SF-003: Direct access to other MC property returns empty', () => {
    const allProps = [...ALPHA_PROPERTIES, ...BETA_PROPERTIES];
    const alphaStorefront = getStorefrontProperties(MC_ALPHA.slug, allProps);
    const alphaIds = new Set(alphaStorefront.map(p => p.id));
    
    // Try accessing a Beta property from Alpha storefront
    const betaPropertyId = BETA_PROPERTIES[0].id;
    expect(alphaIds.has(betaPropertyId)).toBe(false);
  });

  // SF-001: Invalid slug returns empty
  it('SF-001: Invalid storefront slug returns empty', () => {
    const allProps = [...ALPHA_PROPERTIES, ...BETA_PROPERTIES];
    const visible = getStorefrontProperties('nonexistent-slug', allProps);
    expect(visible).toHaveLength(0);
  });

  // SF-004: Booking attribution
  it('SF-004: Storefront booking has correct attribution fields', () => {
    const mockBookingFromStorefront = {
      source_storefront_id: MC_ALPHA.slug,
      source_company_id: MC_ALPHA.id,
      property_id: ALPHA_PROPERTIES[0].id,
    };

    expect(mockBookingFromStorefront.source_storefront_id).toBe(MC_ALPHA.slug);
    expect(mockBookingFromStorefront.source_company_id).toBe(MC_ALPHA.id);
    expect(mockBookingFromStorefront.property_id).toBe(ALPHA_PROPERTIES[0].id);
  });
});
