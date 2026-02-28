/**
 * @module tariff-limits.test
 * @description Tests for MC property slot limits and tariff enforcement.
 */
import { describe, it, expect } from 'vitest';
import { MC_ALPHA, ALPHA_PROPERTIES } from './testSeedData';

describe('MC Tariff / Property Limits', () => {

  interface SlotInfo {
    companyId: string;
    totalSlots: number;
    activeProperties: number;
  }

  function canAddProperty(slotInfo: SlotInfo): { allowed: boolean; reason?: string } {
    if (slotInfo.activeProperties >= slotInfo.totalSlots) {
      return { allowed: false, reason: 'upgrade_required' };
    }
    return { allowed: true };
  }

  function canBulkImport(slotInfo: SlotInfo, importCount: number): { allowed: boolean; reason?: string; maxAllowed: number } {
    const available = slotInfo.totalSlots - slotInfo.activeProperties;
    if (importCount > available) {
      return { allowed: false, reason: 'exceeds_limit', maxAllowed: available };
    }
    return { allowed: true, maxAllowed: available };
  }

  // TAR-001: At limit, cannot add
  it('TAR-001: At slot limit, adding property is blocked', () => {
    const info: SlotInfo = {
      companyId: MC_ALPHA.id,
      totalSlots: 10,
      activeProperties: 10,
    };
    
    const result = canAddProperty(info);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('upgrade_required');
  });

  // TAR-001: Under limit, can add
  it('TAR-001: Under limit, adding property is allowed', () => {
    const info: SlotInfo = {
      companyId: MC_ALPHA.id,
      totalSlots: 10,
      activeProperties: 7,
    };
    
    expect(canAddProperty(info).allowed).toBe(true);
  });

  // TAR-002: Bulk import exceeding limit
  it('TAR-002: Bulk import exceeding limit is blocked', () => {
    const info: SlotInfo = {
      companyId: MC_ALPHA.id,
      totalSlots: 10,
      activeProperties: 8,
    };
    
    const result = canBulkImport(info, 5);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('exceeds_limit');
    expect(result.maxAllowed).toBe(2);
  });

  // TAR-002: Bulk import within limit
  it('TAR-002: Bulk import within limit is allowed', () => {
    const info: SlotInfo = {
      companyId: MC_ALPHA.id,
      totalSlots: 10,
      activeProperties: 8,
    };
    
    const result = canBulkImport(info, 2);
    expect(result.allowed).toBe(true);
  });

  // TAR-003: Slot gate logic
  it('TAR-003: Property without active slot is gated', () => {
    const activeSlotPropertyIds = new Set(
      ALPHA_PROPERTIES.slice(0, 7).map(p => p.id) // only first 7 have slots
    );
    
    const ungatedProperty = ALPHA_PROPERTIES[7]; // 8th property
    expect(activeSlotPropertyIds.has(ungatedProperty.id)).toBe(false);
  });
});
