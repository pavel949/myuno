export type IcalStatus = 'ok' | 'stale' | 'error' | 'none';

export interface CalendarHealth {
  propertyId: string;
  lastSyncedAt: string | null;
  syncError: string | null;
  syncIntervalMinutes: number | null;
  isActive: boolean;
}

const MIN_STALE_MINUTES = 360;
const STALE_INTERVAL_MULTIPLIER = 3;

export function classifyCalendar(c: CalendarHealth, now: Date): IcalStatus {
  if (!c.isActive) return 'none';
  if (c.syncError) return 'error';
  if (!c.lastSyncedAt) return 'stale';
  const last = new Date(c.lastSyncedAt).getTime();
  if (!Number.isFinite(last)) return 'stale';
  const limit = Math.max(STALE_INTERVAL_MULTIPLIER * (c.syncIntervalMinutes ?? 0), MIN_STALE_MINUTES);
  const ageMinutes = (now.getTime() - last) / 60_000;
  return ageMinutes > limit ? 'stale' : 'ok';
}

const SEVERITY: Record<IcalStatus, number> = { none: 0, ok: 1, stale: 2, error: 3 };

export function worstIcalStatus(list: readonly CalendarHealth[], now: Date): IcalStatus {
  let worst: IcalStatus = 'none';
  for (const c of list) {
    const s = classifyCalendar(c, now);
    if (SEVERITY[s] > SEVERITY[worst]) worst = s;
  }
  return worst;
}
