/**
 * In-memory cache for `booking_status_history` rows, grouped by booking id.
 *
 * Goal: avoid refetching status history when the user collapses/re-expands a
 * timeline, or navigates away from the Bookings screen and comes back within
 * the TTL window. Realtime INSERTs continue to mutate this cache so it stays
 * fresh while a session is open.
 *
 * Scope: per browser tab (module-level Map). Cleared on full reload.
 */

import type { BookingStatusEvent } from '@/components/bookings/BookingStatusTimeline';

export type StatusHistoryMap = Record<string, BookingStatusEvent[]>;

interface CacheEntry {
  data: StatusHistoryMap;
  fetchedAt: number;
}

/** TTL for cached history. Realtime keeps it fresh while the tab is open;
 *  the TTL just bounds staleness after long idle periods. */
const TTL_MS = 5 * 60 * 1000;

const store = new Map<string, CacheEntry>();

function keyFor(userId: string): string {
  return `user:${userId}`;
}

export function getCachedStatusHistory(userId: string): StatusHistoryMap | null {
  const entry = store.get(keyFor(userId));
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > TTL_MS) {
    store.delete(keyFor(userId));
    return null;
  }
  return entry.data;
}

export function setCachedStatusHistory(userId: string, data: StatusHistoryMap): void {
  store.set(keyFor(userId), { data, fetchedAt: Date.now() });
}

/** Merge realtime updates into the cache so it stays in sync with React state. */
export function updateCachedStatusHistory(
  userId: string,
  updater: (prev: StatusHistoryMap) => StatusHistoryMap,
): void {
  const entry = store.get(keyFor(userId));
  const prev = entry?.data ?? {};
  const next = updater(prev);
  store.set(keyFor(userId), { data: next, fetchedAt: entry?.fetchedAt ?? Date.now() });
}

export function invalidateStatusHistoryCache(userId?: string): void {
  if (userId) {
    store.delete(keyFor(userId));
  } else {
    store.clear();
  }
}
