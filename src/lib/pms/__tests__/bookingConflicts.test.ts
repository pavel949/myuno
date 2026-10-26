import { describe, expect, it } from 'vitest';
import type { KeyProperty } from '../complexHierarchy';
import {
  assertNoConflicts,
  BookingConflictError,
  findBookingConflicts,
  type BlockedDate,
  type HeldBooking,
} from '../bookingConflicts';

function key(id: string, parentId: string | null = null): KeyProperty {
  return {
    id, parentId, projectId: 'p', ownerId: null, unitNumber: id, title: id, titleRu: null,
    isBookable: true, isActive: true, pricePerNight: 1000, currency: 'THB',
  };
}

const villa = key('V');
const roomA = key('RA', 'V');
const roomB = key('RB', 'V');
const otherVilla = key('V2');
const keys = new Map([villa, roomA, roomB, otherVilla].map((k) => [k.id, k]));

function booking(id: string, propertyId: string, checkIn: string, checkOut: string, status: string | null = 'confirmed'): HeldBooking {
  return { id, propertyId, checkIn, checkOut, status, source: 'direct', guestName: 'Guest' };
}
const d = (day: number) => `2026-11-${String(day).padStart(2, '0')}`;

function run(target: KeyProperty, stay: [number, number], bookings: HeldBooking[], blocks: BlockedDate[] = [], ignoreBookingId?: string) {
  return findBookingConflicts({ target, stay: { checkIn: d(stay[0]), checkOut: d(stay[1]) }, keys, bookings, blocks, ignoreBookingId });
}

describe('findBookingConflicts', () => {
  it('should return same_key when the same key overlaps', () => {
    const hits = run(roomA, [5, 9], [booking('b1', 'RA', d(7), d(10))]);
    expect(hits.map((h) => h.kind)).toEqual(['same_key']);
  });

  it('should report the overlap window in the hit', () => {
    const [hit] = run(roomA, [5, 9], [booking('b1', 'RA', d(7), d(12))]);
    expect([hit.overlapStart, hit.overlapEnd, hit.bookingId]).toEqual([d(7), d(9), 'b1']);
  });

  it('should not conflict for back-to-back stays (new check-in on existing check-out)', () => {
    expect(run(roomA, [9, 12], [booking('b1', 'RA', d(5), d(9))])).toEqual([]);
  });

  it('should not conflict for back-to-back stays (new check-out on existing check-in)', () => {
    expect(run(roomA, [1, 5], [booking('b1', 'RA', d(5), d(9))])).toEqual([]);
  });

  it('should return room_vs_villa when a room is targeted and the villa is held', () => {
    const hits = run(roomA, [7, 8], [booking('b1', 'V', d(5), d(9))]);
    expect(hits.map((h) => h.kind)).toEqual(['room_vs_villa']);
  });

  it('should return villa_vs_room when the villa is targeted and a room is held', () => {
    const hits = run(villa, [8, 12], [booking('b1', 'RA', d(5), d(9))]);
    expect(hits.map((h) => h.kind)).toEqual(['villa_vs_room']);
  });

  it('should not conflict between sibling rooms', () => {
    expect(run(roomA, [5, 9], [booking('b1', 'RB', d(5), d(9))])).toEqual([]);
  });

  it('should not conflict with another villa\'s bookings', () => {
    expect(run(villa, [5, 9], [booking('b1', 'V2', d(5), d(9))])).toEqual([]);
  });

  it.each(['cancelled', 'rejected', 'expired'])('should ignore a %s booking', (status) => {
    expect(run(roomA, [5, 9], [booking('b1', 'RA', d(5), d(9), status)])).toEqual([]);
  });

  it('should hold for no_show', () => {
    expect(run(roomA, [5, 9], [booking('b1', 'RA', d(5), d(9), 'no_show')])).toHaveLength(1);
  });

  it('should hold for an unknown status', () => {
    expect(run(roomA, [5, 9], [booking('b1', 'RA', d(5), d(9), 'weird_status')])).toHaveLength(1);
  });

  it('should not hold when status is NULL', () => {
    expect(run(roomA, [5, 9], [booking('b1', 'RA', d(5), d(9), null)])).toEqual([]);
  });

  it('should skip the booking named by ignoreBookingId', () => {
    expect(run(roomA, [5, 9], [booking('b1', 'RA', d(5), d(9))], [], 'b1')).toEqual([]);
  });

  it('should still report other bookings when ignoreBookingId is set', () => {
    const hits = run(roomA, [5, 9], [booking('b1', 'RA', d(5), d(9)), booking('b2', 'V', d(6), d(7))], [], 'b1');
    expect(hits.map((h) => h.bookingId)).toEqual(['b2']);
  });

  it('should treat a manual block on the villa as blocking a room', () => {
    const hits = run(roomA, [5, 9], [], [{ propertyId: 'V', date: d(6) }]);
    expect(hits.map((h) => h.kind)).toEqual(['manual_block']);
  });

  it('should treat a manual block on a room as blocking the villa', () => {
    const hits = run(villa, [5, 9], [], [{ propertyId: 'RA', date: d(6) }]);
    expect(hits.map((h) => h.kind)).toEqual(['manual_block']);
  });

  it('should not treat a block on the check-out date as a conflict', () => {
    expect(run(roomA, [5, 9], [], [{ propertyId: 'RA', date: d(9) }])).toEqual([]);
  });

  it('should not treat a block on a sibling room as a conflict', () => {
    expect(run(roomA, [5, 9], [], [{ propertyId: 'RB', date: d(6) }])).toEqual([]);
  });
});

describe('assertNoConflicts', () => {
  it('should not throw when there are no conflicts', () => {
    expect(() => assertNoConflicts({ target: roomA, stay: { checkIn: d(5), checkOut: d(9) }, keys, bookings: [], blocks: [] })).not.toThrow();
  });

  it('should throw BookingConflictError when a conflict exists', () => {
    const call = () => assertNoConflicts({ target: roomA, stay: { checkIn: d(5), checkOut: d(9) }, keys, bookings: [booking('b1', 'V', d(6), d(8))], blocks: [] });
    expect(call).toThrow(BookingConflictError);
  });

  it('should expose the hits on the thrown error', () => {
    let caught: unknown;
    try {
      assertNoConflicts({ target: roomA, stay: { checkIn: d(5), checkOut: d(9) }, keys, bookings: [booking('b1', 'V', d(6), d(8))], blocks: [] });
    } catch (e) { caught = e; }
    expect((caught as BookingConflictError).hits.map((h) => h.kind)).toEqual(['room_vs_villa']);
  });
});
