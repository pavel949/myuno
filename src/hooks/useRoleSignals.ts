/**
 * useRoleSignals — live, per-persona signal cards for the Home screen.
 *
 * For each of the user's active personas we run a small, targeted query against
 * the real DB (orders, property_bookings, visa_records, agent_deals, …) and
 * derive a single "what matters right now" signal: lead, value, tail, state.
 *
 * Missing or failed sources never become synthetic bookings. The caller gets
 * separate loading, empty and partial-error state alongside verified records.
 *
 * Cached for 60s via React Query — cheap to mount on every Home render.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { UserPersona } from '@/hooks/useUserPersonas';
import { bangkokTodayISO, bangkokTodayDate, parseCivilDate } from '@/lib/hotelDates';
import { differenceInCalendarDays } from 'date-fns';
import { PROPERTY_BOOKING_RELEASE_FILTER, propertyBookingHoldsInventory } from '@/lib/propertyInventory';
import { logger } from '@/lib/logger';
import { APP_ROUTES } from '@/lib/config/routes';

export interface RoleSignal {
  lead: string;
  leadRu: string;
  leadTh?: string;
  value: string;
  valueRu?: string;
  valueTh?: string;
  tail: string;
  tailRu: string;
  tailTh?: string;
  state: 'live' | 'warn' | 'active';
  /** Signals are always backed by a successfully read account record. */
  isLive: boolean;
  /** An existing detail route, only when the source supplies the record ID. */
  href?: string;
}

type SignalMap = Partial<Record<UserPersona, RoleSignal>>;

/** Civil dates stay calendar dates; timestamp events display in Phuket time. */
export const formatSignalDate = (iso: string, locale: 'ru' | 'en' | 'th') => {
  const civil = /^\d{4}-\d{2}-\d{2}$/.test(iso);
  return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : locale === 'th' ? 'th-TH' : 'en-GB', {
    day: 'numeric', month: 'short',
    ...(civil ? {} : { timeZone: 'Asia/Bangkok' }),
  }).format(civil ? parseCivilDate(iso) : new Date(iso));
};

export const formatSignalTime = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(new Date(iso));

export const signalDaysUntil = (iso: string) =>
  differenceInCalendarDays(parseCivilDate(iso.slice(0, 10)), bangkokTodayDate());

// ─────────────────────────────────────────────────────────────
// Per-persona resolvers — each returns a RoleSignal or null.
// ─────────────────────────────────────────────────────────────

async function resolveTourist(userId: string): Promise<RoleSignal | null> {
  // Next upcoming airport transfer
  const { data, error } = await supabase
    .from('airport_bookings')
    .select('flight_date, flight_time, direction, flight_number, status')
    .eq('user_id', userId)
    .gte('flight_date', bangkokTodayISO())
    .not('status', 'in', '("cancelled","refunded")')
    .order('flight_date', { ascending: true })
    .order('flight_time', { ascending: true })
    .limit(1);

  if (error) throw error;
  const b = data?.[0];
  if (!b) return null;
  const dirEn = b.direction === 'arrival' ? 'HKT → hotel' : 'hotel → HKT';
  const dirRu = b.direction === 'arrival' ? 'HKT → отель' : 'отель → HKT';
  return {
    lead: `Transfer ${formatSignalDate(b.flight_date, 'en')}`,
    leadRu: `Трансфер ${formatSignalDate(b.flight_date, 'ru')}`,
    leadTh: `รถรับส่ง ${formatSignalDate(b.flight_date, 'th')}`,
    value: b.flight_time?.slice(0, 5) ?? '—',
    tail: `${dirEn} · ${b.flight_number}`,
    tailRu: `${dirRu} · ${b.flight_number}`,
    tailTh: `${b.direction === 'arrival' ? 'HKT → โรงแรม' : 'โรงแรม → HKT'} · ${b.flight_number}`,
    state: 'live',
    isLive: true,
  };
}

async function resolveResident(userId: string): Promise<RoleSignal | null> {
  // Visa with the soonest expiry
  const { data, error } = await supabase
    .from('visa_records')
    .select('visa_type, expiry_date, status')
    .eq('user_id', userId)
    .gte('expiry_date', bangkokTodayISO())
    .order('expiry_date', { ascending: true })
    .limit(1);

  if (error) throw error;
  const v = data?.[0];
  if (!v) return null;
  const days = signalDaysUntil(v.expiry_date);
  return {
    lead: 'Visa',
    leadRu: 'Виза',
    leadTh: 'วีซ่า',
    value: `${days} ${days === 1 ? 'day' : 'days'} left`,
    valueRu: `Осталось ${days} дн.`,
    valueTh: `เหลือ ${days} วัน`,
    tail: `${v.visa_type} · ${v.status ?? 'status unavailable'}`,
    tailRu: `${v.visa_type} · ${v.status === 'active' ? 'активна' : v.status ?? 'не указан'}`,
    tailTh: `${v.visa_type} · ${v.status ?? 'ไม่ระบุสถานะ'}`,
    state: days <= 30 ? 'warn' : 'active',
    isLive: true,
  };
}

async function resolveRelocation(userId: string): Promise<RoleSignal | null> {
  // Same source as resident — visa is the dominant relocation signal
  return resolveResident(userId);
}

async function resolveOwner(userId: string): Promise<RoleSignal | null> {
  // Next booking on owner's properties
  const todayIso = bangkokTodayISO();
  const { data: current, error: currentError } = await supabase
    .from('property_bookings')
    .select('check_in, check_out, guest_name, status')
    .eq('owner_id', userId)
    .lte('check_in', todayIso)
    .gt('check_out', todayIso)
    .not('status', 'in', PROPERTY_BOOKING_RELEASE_FILTER)
    .order('check_out', { ascending: true })
    .limit(1);

  if (currentError) throw currentError;
  if (current?.[0] && propertyBookingHoldsInventory(current[0].status)) {
    const c = current[0];
    return {
      lead: 'Current booking',
      leadRu: 'Текущее бронирование',
      leadTh: 'การจองปัจจุบัน',
      value: `${formatSignalDate(c.check_in, 'en')} – ${formatSignalDate(c.check_out, 'en')}`,
      valueRu: `${formatSignalDate(c.check_in, 'ru')} – ${formatSignalDate(c.check_out, 'ru')}`,
      valueTh: `${formatSignalDate(c.check_in, 'th')} – ${formatSignalDate(c.check_out, 'th')}`,
      tail: `Status: ${c.status}`,
      tailRu: `Статус: ${c.status}`,
      tailTh: `สถานะ: ${c.status}`,
      state: 'live',
      isLive: true,
    };
  }

  const { data: upcoming, error: upcomingError } = await supabase
    .from('property_bookings')
    .select('check_in, check_out, guest_name, status')
    .eq('owner_id', userId)
    .gt('check_in', todayIso)
    .not('status', 'in', PROPERTY_BOOKING_RELEASE_FILTER)
    .order('check_in', { ascending: true })
    .limit(1);

  if (upcomingError) throw upcomingError;
  const u = upcoming?.[0];
  if (!u || !propertyBookingHoldsInventory(u.status)) return null;
  return {
    lead: 'Next booking',
    leadRu: 'Следующая бронь',
    leadTh: 'การจองครั้งถัดไป',
    value: formatSignalDate(u.check_in, 'en'),
    valueRu: formatSignalDate(u.check_in, 'ru'),
    valueTh: formatSignalDate(u.check_in, 'th'),
    tail: `${u.guest_name ?? 'Guest'} · ${u.status}`,
    tailRu: `${u.guest_name ?? 'Гость'} · ${u.status}`,
    tailTh: `${u.guest_name ?? 'ผู้เข้าพัก'} · ${u.status}`,
    state: 'active',
    isLive: true,
  };
}

async function resolveInvestor(userId: string): Promise<RoleSignal | null> {
  // Count active agent deals; do not mix currencies or imply realized portfolio value.
  const { data, error } = await supabase
    .from('agent_deals')
    .select('stage, deal_status')
    .eq('agent_id', userId)
    .eq('deal_status', 'active');

  if (error) throw error;
  if (!data || data.length === 0) return null;
  const pending = data.filter(d => ['proposal', 'negotiation', 'pending'].includes(d.stage)).length;
  return {
    lead: 'Active deals',
    leadRu: 'Активные сделки',
    leadTh: 'ดีลที่กำลังดำเนินการ',
    value: `${data.length} deals`,
    valueRu: `${data.length} сделок`,
    valueTh: `${data.length} ดีล`,
    tail: `${data.length} active · ${pending} pending`,
    tailRu: `${data.length} активных · ${pending} в ожидании`,
    tailTh: `กำลังดำเนินการ ${data.length} · รอดำเนินการ ${pending}`,
    state: 'active',
    isLive: true,
  };
}

async function resolveDeveloper(userId: string): Promise<RoleSignal | null> {
  // Closest project completion (developer_id may be a user id or org id)
  const { data, error } = await supabase
    .from('property_projects')
    .select('name_en, name_ru, completion_date, total_units, units_sold, project_status')
    .eq('developer_id', userId)
    .not('completion_date', 'is', null)
    .order('completion_date', { ascending: true })
    .limit(1);

  if (error) throw error;
  const p = data?.[0];
  if (!p) return null;
  const days = p.completion_date ? signalDaysUntil(p.completion_date) : null;
  const nameEn = (p.name_en ?? p.name_ru ?? 'Project').slice(0, 24);
  const nameRu = (p.name_ru ?? p.name_en ?? 'Проект').slice(0, 24);
  return {
    lead: nameEn,
    leadRu: nameRu,
    value: p.total_units ? `${p.units_sold ?? '—'} / ${p.total_units}` : (p.project_status ?? 'Status unavailable'),
    valueRu: p.total_units ? `${p.units_sold ?? '—'} / ${p.total_units}` : (p.project_status ?? 'Статус не указан'),
    valueTh: p.total_units ? `${p.units_sold ?? '—'} / ${p.total_units}` : (p.project_status ?? 'ไม่ระบุสถานะ'),
    tail: days !== null ? `Handover in ${days} days` : (p.project_status ?? ''),
    tailRu: days !== null ? `Сдача через ${days} дн.` : (p.project_status ?? ''),
    tailTh: days !== null ? `กำหนดส่งมอบใน ${days} วัน` : (p.project_status ?? ''),
    state: days !== null && days <= 90 ? 'warn' : 'active',
    isLive: true,
  };
}

// Generic order-based signal: next upcoming order across all verticals
async function resolveNextOrder(userId: string, vertical?: string[]): Promise<RoleSignal | null> {
  let q = supabase
    .from('orders')
    .select('id, order_type, vertical, start_at, total_amount, status, currency')
    .eq('customer_user_id', userId)
    .is('deleted_at', null)
    .gte('start_at', new Date().toISOString())
    .not('status', 'in', '("cancelled","refunded")')
    .order('start_at', { ascending: true })
    .limit(1);

  if (vertical?.length) q = q.in('vertical', vertical);

  const { data, error } = await q;
  if (error) throw error;
  const o = data?.[0];
  if (!o || !o.start_at) return null;
  return {
    lead: o.vertical ?? o.order_type ?? 'Booking',
    leadRu: o.vertical ?? o.order_type ?? 'Бронь',
    value: formatSignalTime(o.start_at),
    tail: `${formatSignalDate(o.start_at, 'en')} · ${o.status}`,
    tailRu: `${formatSignalDate(o.start_at, 'ru')} · ${o.status}`,
    tailTh: `${formatSignalDate(o.start_at, 'th')} · ${o.status}`,
    href: APP_ROUTES.ORDER_TRACKING(o.id),
    state: 'live',
    isLive: true,
  };
}

async function resolvePetOrder(userId: string): Promise<RoleSignal | null> {
  // Pet services use their own vertical, including veterinary care. Human
  // medical orders are not pet updates. This is not a service_orders summary.
  const signal = await resolveNextOrder(userId, ['pet_service']);
  return signal ? {
    ...signal,
    lead: 'Pet-service order',
    leadRu: 'Заказ для питомца',
    leadTh: 'คำสั่งซื้อบริการสัตว์เลี้ยง',
  } : null;
}

// Resolver dispatch table
const RESOLVERS: Partial<Record<UserPersona, (uid: string) => Promise<RoleSignal | null>>> = {
  tourist: resolveTourist,
  resident: resolveResident,
  relocation: resolveRelocation,
  property_owner: resolveOwner,
  investor: resolveInvestor,
  real_estate_developer: resolveDeveloper,
  family: (uid) => resolveNextOrder(uid),
  couple: (uid) => resolveNextOrder(uid),
  nightlife: (uid) => resolveNextOrder(uid),
  active: (uid) => resolveNextOrder(uid),
  business: (uid) => resolveNextOrder(uid, ['legal', 'medical']),
  nomad: (uid) => resolveNextOrder(uid),
  pet_owner: resolvePetOrder,
};

/** Read real signals without conflating empty, failed and loading sources. */
export function useRoleSignals(personas: UserPersona[]) {
  const { user } = useAuth();
  const userId = user?.id;
  const personaKey = personas.join(',');
  // Auth user IDs are not provider org IDs. Use the verified vendor workspace
  // until this surface can reuse its canonical organization scope.
  const unavailablePersonas = personas.filter(p => p === 'local_services_provider');

  const query = useQuery({
    queryKey: ['role-signals', 'real-only-v3', userId, personaKey],
    queryFn: async () => {
      const signals: SignalMap = {};
      const failedPersonas: UserPersona[] = [];
      if (!userId) return { signals, failedPersonas };
      await Promise.all(personas.map(async (p) => {
        const resolver = RESOLVERS[p];
        if (!resolver) return;
        try {
          const signal = await resolver(userId);
          if (signal) signals[p] = signal;
        } catch (error) {
          logger.warn('[useRoleSignals] resolver failed for', p, error);
          failedPersonas.push(p);
        }
      }));
      return { signals, failedPersonas };
    },
    enabled: !!userId && personas.length > 0,
    staleTime: 60_000,
  });

  return {
    signals: query.data?.signals ?? {},
    isLoading: query.isLoading,
    unavailablePersonas,
    hasError: query.isError || (query.data?.failedPersonas?.length ?? 0) > 0,
    retry: () => { void query.refetch(); },
    isAuthenticated: !!userId,
  };
}
