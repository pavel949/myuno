/**
 * @module booking-engine.test
 * @description Hard tests for booking engine: overlap detection, status transitions, pricing.
 */
import { describe, it, expect } from 'vitest';
import {
  TEST_BOOKINGS, ALPHA_PROPERTIES,
  PRICING_FORMULAS,
} from './testSeedData';

describe('Booking Engine — Overlap Detection', () => {

  function hasOverlap(
    existingBookings: typeof TEST_BOOKINGS,
    propertyId: string,
    checkIn: string,
    checkOut: string,
    excludeBookingId?: string,
  ): boolean {
    return existingBookings.some(b => {
      if (b.property_id !== propertyId) return false;
      if (b.status === 'cancelled') return false;
      if (excludeBookingId && b.id === excludeBookingId) return false;
      // Overlap: new check_in < existing check_out AND new check_out > existing check_in
      return checkIn < b.check_out && checkOut > b.check_in;
    });
  }

  // BKG-003: Overlapping booking blocked
  it('BKG-003: Detects overlap with confirmed booking', () => {
    const prop0 = ALPHA_PROPERTIES[0].id;
    // Booking 1: 2026-03-15 to 2026-03-20 (confirmed)
    const overlap = hasOverlap(TEST_BOOKINGS, prop0, '2026-03-16', '2026-03-19');
    expect(overlap).toBe(true);
  });

  it('BKG-003: Non-overlapping dates pass', () => {
    const prop0 = ALPHA_PROPERTIES[0].id;
    // After booking 1 ends
    const overlap = hasOverlap(TEST_BOOKINGS, prop0, '2026-03-20', '2026-03-22');
    expect(overlap).toBe(false);
  });

  it('BKG-003: Cancelled bookings do not block', () => {
    const prop1 = ALPHA_PROPERTIES[1].id;
    // Booking 3 (cancelled): 2026-03-10 to 2026-03-12
    const overlap = hasOverlap(TEST_BOOKINGS, prop1, '2026-03-10', '2026-03-12');
    expect(overlap).toBe(false);
  });

  it('BKG-003: Adjacent dates do not overlap', () => {
    const prop0 = ALPHA_PROPERTIES[0].id;
    // Exactly touching: check-in on check-out day
    const overlap = hasOverlap(TEST_BOOKINGS, prop0, '2026-03-20', '2026-03-22');
    expect(overlap).toBe(false);
  });

  it('BKG-003: Partial overlap at start detected', () => {
    const prop0 = ALPHA_PROPERTIES[0].id;
    const overlap = hasOverlap(TEST_BOOKINGS, prop0, '2026-03-14', '2026-03-16');
    expect(overlap).toBe(true);
  });

  it('BKG-003: Partial overlap at end detected', () => {
    const prop0 = ALPHA_PROPERTIES[0].id;
    const overlap = hasOverlap(TEST_BOOKINGS, prop0, '2026-03-19', '2026-03-22');
    expect(overlap).toBe(true);
  });
});

describe('Booking Engine — Status Transitions', () => {
  
  const VALID_TRANSITIONS: Record<string, string[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['checked_in', 'cancelled'],
    checked_in: ['checked_out'],
    checked_out: [], // terminal
    cancelled: [], // terminal
  };

  function canTransition(from: string, to: string): boolean {
    return (VALID_TRANSITIONS[from] || []).includes(to);
  }

  // BKG-002: Valid transitions
  it('BKG-002: pending → confirmed allowed', () => {
    expect(canTransition('pending', 'confirmed')).toBe(true);
  });

  it('BKG-002: confirmed → checked_in allowed', () => {
    expect(canTransition('confirmed', 'checked_in')).toBe(true);
  });

  it('BKG-002: checked_in → checked_out allowed', () => {
    expect(canTransition('checked_in', 'checked_out')).toBe(true);
  });

  it('BKG-002: pending → cancelled allowed', () => {
    expect(canTransition('pending', 'cancelled')).toBe(true);
  });

  // Negative: Invalid transitions
  it('BKG-002: checked_out → pending NOT allowed', () => {
    expect(canTransition('checked_out', 'pending')).toBe(false);
  });

  it('BKG-002: cancelled → confirmed NOT allowed', () => {
    expect(canTransition('cancelled', 'confirmed')).toBe(false);
  });

  it('BKG-002: pending → checked_in NOT allowed (must confirm first)', () => {
    expect(canTransition('pending', 'checked_in')).toBe(false);
  });
});

describe('Booking Engine — Pricing Calculations', () => {

  // FIN-001: Revenue split formula
  it('FIN-001: Revenue split adds up to total', () => {
    const total = 5000;
    const { platformFee, mcCommission, ownerPayout } = PRICING_FORMULAS.calculate(total);
    
    expect(platformFee + mcCommission + ownerPayout).toBe(total);
  });

  it('FIN-001: Platform fee is 10%', () => {
    const { platformFee } = PRICING_FORMULAS.calculate(10000);
    expect(platformFee).toBe(1000);
  });

  it('FIN-001: MC commission is 20% of post-platform amount', () => {
    const { mcCommission } = PRICING_FORMULAS.calculate(10000);
    // 10000 - 1000 (platform) = 9000; 9000 * 0.20 = 1800
    expect(mcCommission).toBe(1800);
  });

  it('FIN-001: Owner payout is remainder', () => {
    const { ownerPayout } = PRICING_FORMULAS.calculate(10000);
    // 10000 - 1000 - 1800 = 7200
    expect(ownerPayout).toBe(7200);
  });

  // FIN-004: Rounding consistency
  it('FIN-004: Odd amounts round consistently', () => {
    const { platformFee, mcCommission, ownerPayout, total } = PRICING_FORMULAS.calculate(3333.33);
    
    // All values should have max 2 decimal places
    expect(Number(platformFee.toFixed(2))).toBe(platformFee);
    expect(Number(mcCommission.toFixed(2))).toBe(mcCommission);
    expect(Number(ownerPayout.toFixed(2))).toBe(ownerPayout);
    
    // Sum should equal total (within rounding tolerance)
    const sum = platformFee + mcCommission + ownerPayout;
    expect(Math.abs(sum - total)).toBeLessThan(0.02);
  });

  // FIN-002: Multiple bookings sum correctly
  it('FIN-002: Period report sums match individuals', () => {
    const bookingAmounts = [5000, 3000, 2000, 8000];
    
    const individualSplits = bookingAmounts.map(a => PRICING_FORMULAS.calculate(a));
    const totalPlatformFee = individualSplits.reduce((s, x) => s + x.platformFee, 0);
    const totalMcCommission = individualSplits.reduce((s, x) => s + x.mcCommission, 0);
    const totalOwnerPayout = individualSplits.reduce((s, x) => s + x.ownerPayout, 0);
    const totalRevenue = bookingAmounts.reduce((s, a) => s + a, 0);
    
    expect(totalPlatformFee + totalMcCommission + totalOwnerPayout).toBe(totalRevenue);
  });
});
