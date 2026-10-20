import { describe, expect, it } from 'vitest';
import type { KeyProperty } from '../complexHierarchy';
import type { HeldBooking } from '../bookingConflicts';
import { planTurnoverTasks } from '../turnover';

function key(id: string, parentId: string | null = null): KeyProperty {
  return {
    id, parentId, projectId: 'p', ownerId: null, unitNumber: id, title: id, titleRu: null,
    isBookable: true, isActive: true, pricePerNight: 1000, currency: 'THB',
  };
}
const keys = new Map([key('V'), key('RA', 'V'), key('RB', 'V'), key('V2')].map((k) => [k.id, k]));
const d = (day: number) => `2026-11-${String(day).padStart(2, '0')}`;
function b(id: string, propertyId: string, inDay: number, outDay: number, status: string | null = 'confirmed'): HeldBooking {
  return { id, propertyId, checkIn: d(inDay), checkOut: d(outDay), status, source: null, guestName: null };
}
function plan(bookings: HeldBooking[], existing: string[] = [], today = d(10)) {
  return planTurnoverTasks({ bookings, keys, existingTaskBookingIds: new Set(existing), today });
}

describe('planTurnoverTasks', () => {
  it('should create one draft per qualifying booking', () => {
    const { create } = plan([b('b1', 'RA', 12, 15), b('b2', 'V2', 13, 16)]);
    expect(create.map((c) => c.bookingId).sort()).toEqual(['b1', 'b2']);
  });

  it('should schedule the draft on check-out for the booked property', () => {
    const [draft] = plan([b('b1', 'RA', 12, 15)]).create;
    expect([draft.propertyId, draft.scheduledDate, draft.notes, draft.priority]).toEqual(['RA', d(15), 'auto:turnover', 'normal']);
  });

  it('should include a bilingual title', () => {
    const [draft] = plan([b('b1', 'RA', 12, 15)]).create;
    expect([draft.title.length > 0, draft.titleRu.length > 0]).toEqual([true, true]);
  });

  it.each(['confirmed', 'checked_in', 'checked_out', 'completed'])('should create a draft for %s', (status) => {
    expect(plan([b('b1', 'RA', 12, 15, status)]).create).toHaveLength(1);
  });

  it('should include a booking checking out today', () => {
    expect(plan([b('b1', 'RA', 8, 10)]).create).toHaveLength(1);
  });

  it('should skip a booking that checked out before today', () => {
    expect(plan([b('b1', 'RA', 5, 9)]).create).toEqual([]);
  });

  it('should skip bookings that already have a task', () => {
    expect(plan([b('b1', 'RA', 12, 15)], ['b1']).create).toEqual([]);
  });

  it('should not create tasks for pending bookings', () => {
    expect(plan([b('b1', 'RA', 12, 15, 'pending')]).create).toEqual([]);
  });

  it('should not create tasks for cancelled bookings', () => {
    expect(plan([b('b1', 'RA', 12, 15, 'cancelled')]).create).toEqual([]);
  });

  it('should mark urgent when the villa has a same-day arrival after a room checkout', () => {
    const { create } = plan([b('b1', 'RA', 12, 15), b('b2', 'V', 15, 18)]);
    expect(create.find((c) => c.bookingId === 'b1')?.priority).toBe('urgent');
  });

  it('should mark urgent when a room has a same-day arrival after a villa checkout', () => {
    const { create } = plan([b('b1', 'V', 12, 15), b('b2', 'RB', 15, 18)]);
    expect(create.find((c) => c.bookingId === 'b1')?.priority).toBe('urgent');
  });

  it('should mark urgent on same-key same-day arrival', () => {
    const { create } = plan([b('b1', 'RA', 12, 15), b('b2', 'RA', 15, 18)]);
    expect(create.find((c) => c.bookingId === 'b1')?.priority).toBe('urgent');
  });

  it('should stay normal for a sibling arrival on the same day', () => {
    const { create } = plan([b('b1', 'RA', 12, 15), b('b2', 'RB', 15, 18)]);
    expect(create.find((c) => c.bookingId === 'b1')?.priority).toBe('normal');
  });

  it('should list cancelled bookings with an existing task in cancelBookingIds', () => {
    expect(plan([b('b1', 'RA', 12, 15, 'cancelled')], ['b1']).cancelBookingIds).toEqual(['b1']);
  });

  it('should not list cancelled bookings without an existing task', () => {
    expect(plan([b('b1', 'RA', 12, 15, 'cancelled')]).cancelBookingIds).toEqual([]);
  });

  it('should not cancel the task of a still-held booking', () => {
    expect(plan([b('b1', 'RA', 12, 15)], ['b1']).cancelBookingIds).toEqual([]);
  });
});
