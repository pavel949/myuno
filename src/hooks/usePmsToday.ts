/**
 * usePmsToday — "Today" operational snapshot for PMS operators.
 *
 * Built only on existing data:
 *  - property_bookings          → arrivals, departures, in-house
 *  - property_service_requests  → guest requests + cleaning/maintenance work
 *  - crm_tasks (property_id)    → property-linked work
 *  - property_operational_tasks → booking preparation + operations
 *
 * Unit state is DERIVED (no dedicated housekeeping table yet):
 *   maintenance > occupied > dirty > clean
 * These signals do not certify inspection or readiness.
 */
import { useQuery } from '@tanstack/react-query';
import { addDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useMyProperties } from '@/hooks/useMyProperties';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { bangkokTodayISO, civilDateKey, parseCivilDate, toBangkokDateKey } from '@/lib/hotelDates';
import { isTaskClosedStatus, TASK_CLOSED_STATUSES } from '@/lib/tasks/taskStatus';

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

/** A read projection, not another task or booking identity model. */
export interface TodayTask {
  id: string;
  source: 'crm' | 'ops';
  property_id: string;
  title: string;
  title_ru: string | null;
  task_type: string;
  status: string | null;
  priority: string | null;
  due_date: string | null;
}

export const TODAY_SOURCE_LIMIT = 200;
export type TodaySource = 'bookings' | 'requests' | 'crm' | 'ops';
const SCOPE_UNAVAILABLE = new Error('An authenticated active company is required for Today');
const ACTIVE_BOOKING = ['confirmed', 'checked_in', 'pending_deposit', 'deposit_paid', 'in_progress'];
const OPEN_REQUEST = ['pending', 'new', 'assigned', 'in_progress', 'scheduled', 'open'];
const MAINT_RE = /maint|repair|plumb|electr|air|ac_|fix|pool|pest|garden/i;
const CLEAN_RE = /clean|housekeep|laundry|turnover/i;

/** Compatibility alias for the shared Bangkok business-date helper. */
export const ymd = bangkokTodayISO;
const day = toBangkokDateKey;

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
  const { user } = useAuth();
  const { activeCompany, isLoading: companyLoading } = useActiveCompany();
  const { activeProperties, isLoading: propsLoading, error: propertiesError, refetch: refetchProperties } = useMyProperties();
  const companyId = activeCompany?.company_id;
  const ids = [...new Set(activeProperties.map((p) => p.property_id || p.id))].sort();
  const today = ymd(date);
  const tomorrow = civilDateKey(addDays(parseCivilDate(today), 1));
  const scopeReady = !!user?.id && !!companyId && !companyLoading && !propsLoading && !propertiesError;

  const query = useQuery({
    queryKey: ['pms-today', user?.id, companyId, today, ids.join(',')],
    enabled: scopeReady && ids.length > 0,
    staleTime: 60_000,
    // Returning from an existing task editor must re-read its recorded status.
    refetchOnMount: 'always',
    queryFn: async () => {
      // Never interpret absent scope as "all" (also protects manual refetch).
      if (!scopeReady || ids.length === 0) throw SCOPE_UNAVAILABLE;
      const [bk, req, crm, ops] = await Promise.all([
        supabase
          .from('property_bookings')
          .select('id, property_id, guest_name, guest_phone, guests_count, check_in, check_out, status, source', { count: 'exact' })
          .in('property_id', ids)
          .lte('check_in', today)
          .gte('check_out', today)
          .order('check_in').order('id')
          .limit(TODAY_SOURCE_LIMIT + 1),
        supabase
          .from('property_service_requests')
          .select('id, property_id, service_type, status, priority, guest_name, description, scheduled_at, created_at, completed_at', { count: 'exact' })
          .in('property_id', ids)
          .or(`status.in.(${OPEN_REQUEST.join(',')}),completed_at.gte.${today}T00:00:00+07:00`)
          .order('created_at', { ascending: false }).order('id')
          .limit(TODAY_SOURCE_LIMIT + 1),
        supabase
          .from('crm_tasks')
          .select('id, company_id, property_id, task_type, title, status, priority, due_date', { count: 'exact' })
          .eq('company_id', companyId!)
          .in('property_id', ids)
          .or(`status.is.null,status.not.in.(${TASK_CLOSED_STATUSES.join(',')})`)
          .or(`due_date.is.null,due_date.lt.${tomorrow}T00:00:00+07:00`)
          .order('due_date', { ascending: true, nullsFirst: false }).order('id')
          .limit(TODAY_SOURCE_LIMIT + 1),
        supabase
          .from('property_operational_tasks')
          .select('id, property_id, task_type, title, title_ru, status, priority, scheduled_date', { count: 'exact' })
          .in('property_id', ids)
          .or(`status.is.null,status.not.in.(${TASK_CLOSED_STATUSES.join(',')})`)
          .or(`scheduled_date.is.null,scheduled_date.lte.${today}`)
          .order('scheduled_date', { ascending: true, nullsFirst: false }).order('id')
          .limit(TODAY_SOURCE_LIMIT + 1),
      ]);
      const sources = { bookings: bk, requests: req, crm, ops };
      // A failed or incomplete source cannot certify no work/readiness.
      for (const result of Object.values(sources)) if (result.error) throw result.error;
      const truncatedSources = (Object.keys(sources) as TodaySource[]).filter(source => {
        const result = sources[source];
        const loaded = result.data?.length ?? 0;
        return loaded > TODAY_SOURCE_LIMIT || (result.count != null && result.count > loaded);
      });
      // An absent requested exact count cannot prove completeness: the server's
      // row cap may be lower than our requested limit, even for an empty result.
      const countUnavailableSources = (Object.keys(sources) as TodaySource[])
        .filter(source => sources[source].count == null);
      const tasks: TodayTask[] = [
        ...(crm.data ?? []).filter(t => t.company_id === companyId && t.property_id && ids.includes(t.property_id))
          .map(t => ({ ...t, property_id: t.property_id!, source: 'crm' as const, title_ru: null })),
        ...(ops.data ?? []).filter(t => ids.includes(t.property_id))
          .map(t => ({ ...t, source: 'ops' as const, due_date: t.scheduled_date })),
      ].filter(t => !isTaskClosedStatus(t.status) && (!day(t.due_date) || day(t.due_date)! <= today))
        .sort((a, b) => (day(a.due_date) ?? '9999').localeCompare(day(b.due_date) ?? '9999') || a.source.localeCompare(b.source) || a.id.localeCompare(b.id));
      return {
        bookings: (bk.data ?? []).filter(b => ids.includes(b.property_id)) as TodayBooking[],
        requests: (req.data ?? []).filter(r => ids.includes(r.property_id)), tasks, truncatedSources, countUnavailableSources,
      };
    },
  });

  const error = propertiesError || query.error || (!companyLoading && (!user?.id || !companyId) ? SCOPE_UNAVAILABLE : null);
  const truncatedSources = scopeReady ? query.data?.truncatedSources ?? [] : [];
  const countUnavailableSources = scopeReady ? query.data?.countUnavailableSources ?? [] : [];
  const isLoading = !!companyLoading || propsLoading || query.isLoading || query.isFetching;
  const snapshot = scopeReady && !error && !isLoading && !truncatedSources.length && !countUnavailableSources.length ? query.data : undefined;
  const allBookings = snapshot?.bookings ?? [];
  const bookings = allBookings.filter((b) => ACTIVE_BOOKING.includes(b.status ?? ''));
  const requests = snapshot?.requests ?? [];
  const tasks = snapshot?.tasks ?? [];

  const arrivals = bookings.filter((b) => day(b.check_in) === today);
  // A completed checkout still creates turnover work; it must not become in-house.
  const departures = allBookings.filter((b) =>
    (ACTIVE_BOOKING.includes(b.status ?? '') || b.status === 'checked_out') && day(b.check_out) === today,
  );
  const inHouse = bookings.filter((b) => !!day(b.check_in) && !!day(b.check_out) && day(b.check_in)! <= today && day(b.check_out)! > today);

  const openReq = requests.filter((r) => OPEN_REQUEST.includes(r.status ?? ''));
  const guestRequests: TodayRequest[] = openReq.filter(
    (r) => !MAINT_RE.test(r.service_type) && !CLEAN_RE.test(r.service_type),
  );

  const units: TodayUnit[] = (snapshot ? activeProperties : []).map((p) => {
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
    isLoading, error, truncatedSources, countUnavailableSources, companyId, today,
    refetch: async () => {
      if (propertiesError) await refetchProperties?.();
      if (scopeReady && ids.length > 0) return query.refetch();
    },
    hasProperties: ids.length > 0,
    arrivals, departures, inHouse, guestRequests, units, tasks, titleOf,
  };
}

