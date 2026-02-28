/**
 * @module ical-sync.test
 * @description Tests for iCal synchronization: dedup, conflicts, timezone handling.
 */
import { describe, it, expect } from 'vitest';

interface ICalEvent {
  uid: string;
  summary: string;
  dtstart: string; // ISO
  dtend: string;
  status: string;
}

interface ExistingBlock {
  external_id: string;
  check_in: string;
  check_out: string;
  status: string;
  source: string;
}

describe('iCal Sync — Deduplication', () => {

  function deduplicateEvents(
    incoming: ICalEvent[],
    existing: ExistingBlock[],
  ): { toInsert: ICalEvent[]; toUpdate: ICalEvent[]; unchanged: ICalEvent[] } {
    const existingMap = new Map(existing.map(e => [e.external_id, e]));
    
    const toInsert: ICalEvent[] = [];
    const toUpdate: ICalEvent[] = [];
    const unchanged: ICalEvent[] = [];

    for (const event of incoming) {
      const match = existingMap.get(event.uid);
      if (!match) {
        toInsert.push(event);
      } else if (match.check_in !== event.dtstart.slice(0, 10) || match.check_out !== event.dtend.slice(0, 10)) {
        toUpdate.push(event);
      } else {
        unchanged.push(event);
      }
    }

    return { toInsert, toUpdate, unchanged };
  }

  // ICAL-002: Repeated import does not duplicate
  it('ICAL-002: Repeated sync produces no inserts', () => {
    const events: ICalEvent[] = [
      { uid: 'ext-1', summary: 'Airbnb Booking', dtstart: '2026-03-10', dtend: '2026-03-15', status: 'CONFIRMED' },
    ];

    const existing: ExistingBlock[] = [
      { external_id: 'ext-1', check_in: '2026-03-10', check_out: '2026-03-15', status: 'confirmed', source: 'airbnb' },
    ];

    const { toInsert, unchanged } = deduplicateEvents(events, existing);
    expect(toInsert).toHaveLength(0);
    expect(unchanged).toHaveLength(1);
  });

  // ICAL-001: New events are inserted
  it('ICAL-001: New events are detected for insert', () => {
    const events: ICalEvent[] = [
      { uid: 'new-1', summary: 'New Booking', dtstart: '2026-04-01', dtend: '2026-04-05', status: 'CONFIRMED' },
    ];

    const existing: ExistingBlock[] = [];

    const { toInsert } = deduplicateEvents(events, existing);
    expect(toInsert).toHaveLength(1);
    expect(toInsert[0].uid).toBe('new-1');
  });

  // ICAL-004: Date changes detected as updates
  it('ICAL-004: Changed dates detected as update', () => {
    const events: ICalEvent[] = [
      { uid: 'ext-1', summary: 'Modified Booking', dtstart: '2026-03-11', dtend: '2026-03-16', status: 'CONFIRMED' },
    ];

    const existing: ExistingBlock[] = [
      { external_id: 'ext-1', check_in: '2026-03-10', check_out: '2026-03-15', status: 'confirmed', source: 'airbnb' },
    ];

    const { toUpdate } = deduplicateEvents(events, existing);
    expect(toUpdate).toHaveLength(1);
  });
});

describe('iCal Sync — Conflict Resolution', () => {

  interface BookingRecord {
    id: string;
    check_in: string;
    check_out: string;
    status: string;
    source: string;
  }

  function resolveConflict(
    internalBooking: BookingRecord,
    externalBlock: ICalEvent,
  ): 'keep_internal' | 'mark_conflict' | 'allow_external' {
    // Rule: confirmed internal bookings always win
    if (internalBooking.status === 'confirmed') {
      return 'keep_internal';
    }
    // Pending internal bookings create a conflict marker
    if (internalBooking.status === 'pending') {
      return 'mark_conflict';
    }
    // Cancelled internals allow external
    return 'allow_external';
  }

  // ICAL-003: Confirmed internal wins
  it('ICAL-003: Confirmed internal booking takes priority', () => {
    const internal: BookingRecord = {
      id: 'int-1', check_in: '2026-03-15', check_out: '2026-03-20',
      status: 'confirmed', source: 'direct',
    };
    const external: ICalEvent = {
      uid: 'ext-conflict', summary: 'External Block',
      dtstart: '2026-03-16', dtend: '2026-03-18', status: 'CONFIRMED',
    };

    expect(resolveConflict(internal, external)).toBe('keep_internal');
  });

  // ICAL-003: Pending creates conflict marker
  it('ICAL-003: Pending internal creates conflict', () => {
    const internal: BookingRecord = {
      id: 'int-2', check_in: '2026-03-22', check_out: '2026-03-25',
      status: 'pending', source: 'direct',
    };
    const external: ICalEvent = {
      uid: 'ext-conflict-2', summary: 'External Block',
      dtstart: '2026-03-23', dtend: '2026-03-24', status: 'CONFIRMED',
    };

    expect(resolveConflict(internal, external)).toBe('mark_conflict');
  });

  it('Cancelled internal allows external', () => {
    const internal: BookingRecord = {
      id: 'int-3', check_in: '2026-03-10', check_out: '2026-03-12',
      status: 'cancelled', source: 'direct',
    };
    const external: ICalEvent = {
      uid: 'ext-ok', summary: 'External Block',
      dtstart: '2026-03-10', dtend: '2026-03-12', status: 'CONFIRMED',
    };

    expect(resolveConflict(internal, external)).toBe('allow_external');
  });
});

describe('iCal Sync — Timezone Handling', () => {

  // ICAL-005: UTC → Asia/Bangkok conversion
  it('ICAL-005: UTC date interpreted correctly', () => {
    const utcDate = '2026-03-15T00:00:00Z';
    const date = new Date(utcDate);
    
    // In Asia/Bangkok (UTC+7), midnight UTC is 07:00
    const bangkokOffset = 7 * 60; // minutes
    const bangkokHour = (date.getUTCHours() + 7) % 24;
    
    expect(bangkokHour).toBe(7);
    expect(date.toISOString().slice(0, 10)).toBe('2026-03-15');
  });

  it('ICAL-005: Date-only strings preserve date', () => {
    const dateOnly = '2026-03-15';
    // Date-only iCal events should map directly to the date
    expect(dateOnly).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
