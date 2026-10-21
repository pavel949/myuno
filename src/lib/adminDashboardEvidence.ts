import { addDays } from 'date-fns';
import { bangkokTodayISO, civilDateKey, parseCivilDate } from '@/lib/hotelDates';

export interface DashboardSnapshot {
  date: string;
  gmv: number | null;
  platform_revenue: number | null;
  completed_bookings: number | null;
}

/** Completed Phuket calendar days only; today is an incomplete snapshot period. */
export function dashboardSnapshotPeriod(days: number, now = new Date()) {
  const today = parseCivilDate(bangkokTodayISO(now));
  const dates = Array.from({ length: days }, (_, index) => civilDateKey(addDays(today, index - days)));
  return { days, dates, from: dates[0], through: dates[dates.length - 1] };
}

export function summarizeDashboardSnapshots(rows: DashboardSnapshot[], dates: string[]) {
  const selected = rows.filter(row => dates.includes(row.date));
  const unique = new Set(selected.map(row => row.date));
  const complete = unique.size === dates.length && selected.length === dates.length;
  const sum = (key: keyof Pick<DashboardSnapshot, 'gmv' | 'platform_revenue' | 'completed_bookings'>) =>
    complete && selected.every(row => typeof row[key] === 'number' && Number.isFinite(row[key]))
      ? selected.reduce((total, row) => total + row[key]!, 0) : null;
  return { coverage: unique.size, complete, gmv: sum('gmv'), platformRevenue: sum('platform_revenue'), completedBookings: sum('completed_bookings') };
}

export type PlatformStatus = 'configured' | 'not_configured' | 'verified' | 'needs_review' | 'unknown';
export interface PlatformStatusItem { key: string; status: PlatformStatus }

export function configurationStatus(value: unknown, kind: 'stripe' | 'email' | 'whatsapp'): PlatformStatus {
  if (kind === 'stripe') return value === 'live' ? 'configured' : 'not_configured';
  if (kind === 'whatsapp') return typeof value === 'string' && value.trim().length > 5 ? 'configured' : 'not_configured';
  try {
    const parsed: unknown = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(parsed) && parsed.length > 0 && parsed.every(email => typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) ? 'configured' : 'not_configured';
  } catch { return 'not_configured'; }
}

export function verticalConfigurationStatus(rows: { value: unknown }[] | null): PlatformStatus {
  if (!rows?.length) return 'unknown';
  const values = rows.map(row => {
    try {
      const value: unknown = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
      if (typeof value === 'boolean') return value;
      if (typeof value === 'object' && value !== null && 'enabled' in value && typeof value.enabled === 'boolean') return value.enabled;
    } catch { /* Invalid persisted configuration is unknown. */ }
    return null;
  });
  if (values.some(value => value === null)) return 'unknown';
  return values.some(Boolean) ? 'configured' : 'not_configured';
}
