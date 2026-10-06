/**
 * usePmsToday — "Today" operational snapshot for PMS operators.
 *
 * Built only on existing data:
 *  - property_bookings          → arrivals, departures, in-house
 *  - property_service_requests  → guest requests + cleaning/maintenance work
 *  - crm_tasks (property_id)    → open cleaning/maintenance tasks
 *
 * Unit state is DERIVED (no dedicated housekeeping table yet):
 *   maintenance > occupied > dirty > clean
 * TODO(schema): add a `unit_housekeeping_status` table so staff can set
 * inspected/clean explicitly instead of inferring it from requests.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMyProperties } from '@/hooks/useMyProperties';

export type UnitState = 'occupied' | 'dirty' | 'maintenance' | 'clean';

export interface TodayBooking {
  id: string;
  property_id: string;
  guest_name: string | null;
  guest_phone: string | null;
  guests_count: number | null;
  check_in: string;
  check_out: string;
  status: string | null;
  source: string | null;
}

export interface TodayRequest {
  id: string;
  property_id: string;
  service_type: string;
  status: string | null;
  priority: string | null;
  guest_name: string | null;
  description: string | null;
  scheduled_at: string | null;
  created_at: string;
}

export interface TodayUnit {
  property_id: string;
  title: string;
  state: UnitState;
  booking: TodayBooking | null;
}

const ACTIVE_BOOKING = ['confirmed', 'checked_in', 'pending_deposit', 'deposit_paid', 'in_progress'];
const OPEN_REQUEST = ['pending', 'new', 'assigned', 'in_progress', 'scheduled', 'open'];
const MAINT_RE = /maint|repair|plumb|electr|air|ac_|fix|pool|pest|garden/i;
const CLEAN_RE = /clean|housekeep|laundry|turnover/i;

/** Phuket-local (UTC+7) calendar date for a timestamp, "YYYY-MM-DD". */
const PHUKET_OFFSET_MIN = 7 * 60;
export const ymd = (d: Date) =>
  new Date(d.getTime() + PHUKET_OFFSET_MIN * 60_000).toISOString().slice(0, 10);
const day = (s: string) => ymd(new Date(s));

export function deriveUnitState(args: {
  inHouse: boolean;
  departedToday: boolean;
  openMaintenance: boolean;
  openCleaning: boolean;
  cleanedToday: boolean;
}): UnitState {
  if (args.openMaintenance) return 'maintenance';
  if (args.inHouse) return 'occupied';
  if (args.openCleaning || (args.departedToday && !args.cleanedToday)) return 'dirty';
  return 'clean';
}

export function usePmsToday(date: Date = new Date()) {
  const { activeProperties, isLoading: propsLoading } = useMyProperties();
  const ids = activeProperties.map((p) => p.property_id || p.id);
  const today = ymd(date);

  const query = useQuery({
    queryKey: ['pms-today', today, ids.join(',')],
    enabled: !propsLoading && ids.length > 0,
    staleTime: 60_000,
    queryFn: async () => {
      const [bk, req, tasks] = await Promise.all([
        supabase
          .from('property_bookings')
          .select('id, property_id, guest_name, guest_phone, guests_count, check_in, check_out, status, source')
          .in('property_id', ids)
          .lte('check_in', `${today}T23:59:59+07:00`)
          .gte('check_out', `${today}T00:00:00+07:00`)
          .order('check_in'),
        supabase
          .from('property_service_requests')
          .select('id, property_id, service_type, status, priority, guest_name, description, scheduled_at, created_at, completed_at')
          .in('property_id', ids)
          .or(`status.in.(${OPEN_REQUEST.join(',')}),completed_at.gte.${today}`)
          .order('created_at', { ascending: false })
          .limit(200),
        supabase
          .from('crm_tasks')
          .select('id, property_id, task_type, title, status')
          .in('property_id', ids)
          .neq('status', 'completed')
          .limit(200),
      ]);
      if (bk.error) throw bk.error;
      if (req.error) throw req.error;
      // crm_tasks is company-scoped by RLS; treat access errors as "no tasks".
      return { bookings: (bk.data ?? []) as TodayBooking[], requests: req.data ?? [], tasks: tasks.data ?? [] };
    },
  });

  const bookings = (query.data?.bookings ?? []).filter((b) => ACTIVE_BOOKING.includes(b.status ?? ''));
  const requests = query.data?.requests ?? [];
  const tasks = query.data?.tasks ?? [];

  const arrivals = bookings.filter((b) => day(b.check_in) === today);
  const departures = bookings.filter((b) => day(b.check_out) === today);
  const inHouse = bookings.filter((b) => day(b.check_in) <= today && day(b.check_out) > today);

  const openReq = requests.filter((r) => OPEN_REQUEST.includes(r.status ?? ''));
  const guestRequests: TodayRequest[] = openReq.filter(
    (r) => !MAINT_RE.test(r.service_type) && !CLEAN_RE.test(r.service_type),
  );

  const units: TodayUnit[] = activeProperties.map((p) => {
    const pid = p.property_id || p.id;
    const stay = inHouse.find((b) => b.property_id === pid) ?? null;
    const has = (re: RegExp) =>
      openReq.some((r) => r.property_id === pid && re.test(r.service_type)) ||
      tasks.some((t) => t.property_id === pid && (re.test(t.task_type) || re.test(t.title)));
    const cleanedToday = requests.some(
      (r) => r.property_id === pid && CLEAN_RE.test(r.service_type) && r.completed_at && day(r.completed_at) === today,
    );
    return {
      property_id: pid,
      title: p.title,
      booking: stay ?? arrivals.find((b) => b.property_id === pid) ?? null,
      state: deriveUnitState({
        inHouse: !!stay,
        departedToday: departures.some((b) => b.property_id === pid),
        openMaintenance: has(MAINT_RE),
        openCleaning: has(CLEAN_RE),
        cleanedToday,
      }),
    };
  });

  const titleOf = (pid: string) => activeProperties.find((p) => (p.property_id || p.id) === pid)?.title ?? '—';

  return {
    isLoading: propsLoading || query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
    hasProperties: ids.length > 0,
    arrivals, departures, inHouse, guestRequests, units, titleOf,
  };
}
