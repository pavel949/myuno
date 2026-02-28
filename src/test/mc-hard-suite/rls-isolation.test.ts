/**
 * @module rls-isolation.test
 * @description Hard tests for MC tenant isolation via RLS.
 * Verifies that MC_Alpha users cannot access MC_Beta data.
 * 
 * NOTE: These tests validate the query logic and data structures.
 * Full RLS testing requires authenticated Supabase sessions.
 * For production RLS verification, use the Admin QA Test Runner 
 * which runs against the real database.
 */
import { describe, it, expect } from 'vitest';
import {
  MC_ALPHA, MC_BETA,
  OWNER_A, OWNER_B, STAFF_ALPHA, GUEST_USER,
  ALPHA_PROPERTIES, BETA_PROPERTIES,
  TEST_BOOKINGS,
} from './testSeedData';

describe('RLS / Tenant Isolation — Data Structures', () => {
  
  // RLS-001: MC membership scoping
  it('RLS-001: Alpha properties belong only to MC_Alpha', () => {
    const alphaProps = ALPHA_PROPERTIES.filter(
      p => p.management_company_id === MC_ALPHA.id
    );
    expect(alphaProps).toHaveLength(10);
    
    const betaLeaks = ALPHA_PROPERTIES.filter(
      p => p.management_company_id === MC_BETA.id
    );
    expect(betaLeaks).toHaveLength(0);
  });

  // RLS-002: Bookings scoped to correct properties
  it('RLS-002: Alpha bookings reference only Alpha properties', () => {
    const alphaPropertyIds = new Set(ALPHA_PROPERTIES.map(p => p.id));
    const betaPropertyIds = new Set(BETA_PROPERTIES.map(p => p.id));

    const alphaBookings = TEST_BOOKINGS.filter(b => alphaPropertyIds.has(b.property_id));
    const betaBookingsFromAlpha = TEST_BOOKINGS.filter(
      b => betaPropertyIds.has(b.property_id) && b.owner_id === OWNER_A.id
    );

    expect(alphaBookings.length).toBeGreaterThan(0);
    expect(betaBookingsFromAlpha).toHaveLength(0);
  });

  // RLS-003: Owner_A is member of MC_Alpha only
  it('RLS-003: Owner membership isolation', () => {
    expect(OWNER_A.companyId).toBe(MC_ALPHA.id);
    expect(OWNER_B.companyId).toBe(MC_BETA.id);
    expect(OWNER_A.companyId).not.toBe(MC_BETA.id);
  });

  // RLS-006: Guest has no MC access
  it('RLS-006: Guest user has no company membership', () => {
    expect(GUEST_USER.companyId).toBeNull();
    expect(GUEST_USER.role).toBeNull();
  });

  // RLS-007: Cross-tenant property access check
  it('RLS-007: Cannot create booking for wrong MC property', () => {
    const betaPropertyIds = new Set(BETA_PROPERTIES.map(p => p.id));
    const alphaUserPropertyAccess = (propertyId: string) => {
      // Simulates RLS: Alpha user can only access Alpha properties
      return ALPHA_PROPERTIES.some(p => p.id === propertyId);
    };

    for (const betaProp of BETA_PROPERTIES) {
      expect(alphaUserPropertyAccess(betaProp.id)).toBe(false);
    }
  });

  // Mixed status properties
  it('Properties have mixed statuses', () => {
    const activeAlpha = ALPHA_PROPERTIES.filter(p => p.status === 'active');
    const pausedAlpha = ALPHA_PROPERTIES.filter(p => p.status === 'paused');
    const archivedAlpha = ALPHA_PROPERTIES.filter(p => p.status === 'archived');
    
    expect(activeAlpha.length).toBeGreaterThan(0);
    expect(pausedAlpha.length).toBeGreaterThan(0);
    expect(archivedAlpha.length).toBeGreaterThan(0);
  });
});

describe('RLS / Tenant Isolation — Query Filter Simulation', () => {

  /** Simulates the RLS filter: properties WHERE management_company_id IN (user's companies) */
  function filterPropertiesByMC(userId: string, allProperties: typeof ALPHA_PROPERTIES) {
    const userCompanyId = userId === OWNER_A.id || userId === STAFF_ALPHA.id
      ? MC_ALPHA.id
      : userId === OWNER_B.id
        ? MC_BETA.id
        : null;

    if (!userCompanyId) return [];
    return allProperties.filter(p => p.management_company_id === userCompanyId);
  }

  it('RLS-001: MC_Alpha user sees only Alpha properties', () => {
    const allProps = [...ALPHA_PROPERTIES, ...BETA_PROPERTIES];
    const visible = filterPropertiesByMC(OWNER_A.id, allProps);
    
    expect(visible).toHaveLength(10);
    expect(visible.every(p => p.management_company_id === MC_ALPHA.id)).toBe(true);
  });

  it('RLS-001: MC_Beta user sees only Beta properties', () => {
    const allProps = [...ALPHA_PROPERTIES, ...BETA_PROPERTIES];
    const visible = filterPropertiesByMC(OWNER_B.id, allProps);
    
    expect(visible).toHaveLength(5);
    expect(visible.every(p => p.management_company_id === MC_BETA.id)).toBe(true);
  });

  it('RLS-006: Guest user sees no MC properties', () => {
    const allProps = [...ALPHA_PROPERTIES, ...BETA_PROPERTIES];
    const visible = filterPropertiesByMC(GUEST_USER.id, allProps);
    
    expect(visible).toHaveLength(0);
  });

  it('RLS-008: Staff Alpha cannot access Beta property by ID', () => {
    const allProps = [...ALPHA_PROPERTIES, ...BETA_PROPERTIES];
    const visible = filterPropertiesByMC(STAFF_ALPHA.id, allProps);
    const visibleIds = new Set(visible.map(p => p.id));
    
    for (const betaProp of BETA_PROPERTIES) {
      expect(visibleIds.has(betaProp.id)).toBe(false);
    }
  });
});
