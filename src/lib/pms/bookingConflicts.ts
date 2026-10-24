import { propertyBookingHoldsInventory } from '@/lib/propertyInventory';
import { addCivilDays, maxIso, minIso, rangesOverlap } from './civilDate';
import { isFamilyConflict, type KeyProperty } from './complexHierarchy';

export interface StayRange { checkIn: string; checkOut: string }
export interface HeldBooking extends StayRange {
  id: string;
  propertyId: string;
  status: string | null;
  source: string | null;
  guestName: string | null;
  /** Present when the booking was mirrored from an order (UI detail lookup only). */
  orderId?: string | null;
}
export interface BlockedDate { propertyId: string; date: string }
export type ConflictKind = 'same_key' | 'villa_vs_room' | 'room_vs_villa' | 'manual_block';
export interface ConflictHit {
  kind: ConflictKind;
  propertyId: string;
  bookingId: string | null;
  overlapStart: string;
  overlapEnd: string;
  source: string | null;
}

export class BookingConflictError extends Error {
  readonly hits: readonly ConflictHit[];
  constructor(hits: readonly ConflictHit[]) {
    super(`BOOKING_CONFLICT: ${hits.map(h => h.kind).join(',')}`);
    this.name = 'BookingConflictError';
    this.hits = hits;
  }
}

export interface ConflictInput {
  target: KeyProperty;
  stay: StayRange;
  keys: ReadonlyMap<string, KeyProperty>;
  bookings: readonly HeldBooking[];
  blocks: readonly BlockedDate[];
  ignoreBookingId?: string;
}

function bookingKind(target: KeyProperty, other: KeyProperty | undefined, propertyId: string): ConflictKind | null {
  if (propertyId === target.id) return 'same_key';
  if (!other) return null;
  if (other.parentId === target.id) return 'villa_vs_room';
  if (target.parentId === other.id) return 'room_vs_villa';
  return null;
}

function bookingHits(a: ConflictInput): ConflictHit[] {
  const hits: ConflictHit[] = [];
  for (const b of a.bookings) {
    if (b.id === a.ignoreBookingId || !propertyBookingHoldsInventory(b.status)) continue;
    if (!rangesOverlap(a.stay.checkIn, a.stay.checkOut, b.checkIn, b.checkOut)) continue;
    const kind = bookingKind(a.target, a.keys.get(b.propertyId), b.propertyId);
    if (!kind) continue;
    hits.push({
      kind,
      propertyId: b.propertyId,
      bookingId: b.id,
      overlapStart: maxIso(a.stay.checkIn, b.checkIn),
      overlapEnd: minIso(a.stay.checkOut, b.checkOut),
      source: b.source,
    });
  }
  return hits;
}

function blockHits(a: ConflictInput): ConflictHit[] {
  const byProperty = new Map<string, string[]>();
  for (const blk of a.blocks) {
    if (blk.date < a.stay.checkIn || blk.date >= a.stay.checkOut) continue;
    const other = a.keys.get(blk.propertyId);
    const family = blk.propertyId === a.target.id || (other !== undefined && isFamilyConflict(a.target, other));
    if (!family) continue;
    byProperty.set(blk.propertyId, [...(byProperty.get(blk.propertyId) ?? []), blk.date]);
  }
  const hits: ConflictHit[] = [];
  for (const [propertyId, dates] of byProperty) {
    for (const run of contiguousRuns([...new Set(dates)].sort())) {
      hits.push({ kind: 'manual_block', propertyId, bookingId: null, overlapStart: run.start, overlapEnd: run.end, source: null });
    }
  }
  return hits;
}

function contiguousRuns(sorted: string[]): { start: string; end: string }[] {
  const runs: { start: string; end: string }[] = [];
  for (const d of sorted) {
    const last = runs[runs.length - 1];
    if (last && last.end === d) last.end = addCivilDays(d, 1);
    else runs.push({ start: d, end: addCivilDays(d, 1) });
  }
  return runs;
}

export function findBookingConflicts(a: ConflictInput): ConflictHit[] {
  return [...bookingHits(a), ...blockHits(a)];
}

export function assertNoConflicts(a: Parameters<typeof findBookingConflicts>[0]): void {
  const hits = findBookingConflicts(a);
  if (hits.length > 0) throw new BookingConflictError(hits);
}
