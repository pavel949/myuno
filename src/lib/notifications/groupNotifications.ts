/**
 * Group in-app notifications by what they are about — Design Bible Round 4A · N1:
 * "In-app centre groups by trip and purchase". A trip = booking_id, a
 * purchase = order_id; everything else falls into "other". Groups are ordered
 * by their most recent notification; items keep their incoming order.
 */
export interface GroupableNotification {
  id: string;
  created_at: string;
  data?: { booking_id?: string; order_id?: string } | null;
}

export type NotificationGroupKind = 'trip' | 'purchase' | 'other';

export interface NotificationGroup<T extends GroupableNotification> {
  key: string;
  kind: NotificationGroupKind;
  ref: string | null;
  latest: string;
  items: T[];
}

export function groupNotifications<T extends GroupableNotification>(list: readonly T[]): NotificationGroup<T>[] {
  const groups = new Map<string, NotificationGroup<T>>();
  for (const n of list) {
    const booking = n.data?.booking_id;
    const order = n.data?.order_id;
    const kind: NotificationGroupKind = booking ? 'trip' : order ? 'purchase' : 'other';
    const ref = booking ?? order ?? null;
    const key = ref ? `${kind}:${ref}` : 'other';
    const g = groups.get(key);
    if (g) {
      g.items.push(n);
      if (n.created_at > g.latest) g.latest = n.created_at;
    } else {
      groups.set(key, { key, kind, ref, latest: n.created_at, items: [n] });
    }
  }
  return [...groups.values()].sort((a, b) => {
    if (a.kind === 'other' && b.kind !== 'other') return 1;
    if (b.kind === 'other' && a.kind !== 'other') return -1;
    return b.latest.localeCompare(a.latest);
  });
}

/** Short human reference, e.g. "MUNO-18427" style tail of a uuid. */
export function shortRef(ref: string): string {
  return ref.length > 8 ? ref.slice(0, 8).toUpperCase() : ref.toUpperCase();
}
