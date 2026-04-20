/**
 * useRoleSignals — live, per-persona signal cards for the Home screen.
 *
 * For each of the user's active personas we run a small, targeted query against
 * the real DB (orders, property_bookings, visa_records, agent_deals, …) and
 * derive a single "what matters right now" signal: lead, value, tail, state.
 *
 * If a persona has no live data, the SIGNAL_SEED demo card from `roleBlend.ts`
 * is used as fallback so the UI never collapses.
 *
 * Cached for 60s via React Query — cheap to mount on every Home render.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { UserPersona } from '@/hooks/useUserPersonas';
import { SIGNAL_SEED } from '@/lib/roleBlend';

export interface RoleSignal {
  lead: string;
  leadRu: string;
  value: string;
  tail: string;
  tailRu: string;
  state: 'live' | 'warn' | 'active';
  /** true → real data, false → seed fallback */
  isLive: boolean;
}

type SignalMap = Partial<Record<UserPersona, RoleSignal>>;

const fmtDate = (iso: string, locale: 'ru' | 'en') =>
  new Date(iso).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', {
    day: 'numeric',
    month: 'short',
  });

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

const daysUntil = (iso: string) => {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / (24 * 3600 * 1000));
};

const fmtTHB = (n: number) => {
  if (n >= 1_000_000) return `฿ ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `฿ ${(n / 1_000).toFixed(1)}K`;
  return `฿ ${Math.round(n)}`;
};

// ─────────────────────────────────────────────────────────────
// Per-persona resolvers — each returns a RoleSignal or null.
// ─────────────────────────────────────────────────────────────

async function resolveTourist(userId: string): Promise<RoleSignal | null> {
  // Next upcoming airport transfer
  const { data } = await supabase
    .from('airport_bookings')
    .select('flight_date, flight_time, direction, flight_number, status')
    .eq('user_id', userId)
    .gte('flight_date', new Date().toISOString().slice(0, 10))
    .not('status', 'in', '("cancelled","refunded")')
    .order('flight_date', { ascending: true })
    .order('flight_time', { ascending: true })
    .limit(1);

  const b = data?.[0];
  if (!b) return null;
  const dirEn = b.direction === 'arrival' ? 'HKT → hotel' : 'hotel → HKT';
  const dirRu = b.direction === 'arrival' ? 'HKT → отель' : 'отель → HKT';
  return {
    lead: `Transfer ${fmtDate(b.flight_date, 'en')}`,
    leadRu: `Трансфер ${fmtDate(b.flight_date, 'ru')}`,
    value: b.flight_time?.slice(0, 5) ?? '—',
    tail: `${dirEn} · ${b.flight_number}`,
    tailRu: `${dirRu} · ${b.flight_number}`,
    state: 'live',
    isLive: true,
  };
}

async function resolveResident(userId: string): Promise<RoleSignal | null> {
  // Visa with the soonest expiry
  const { data } = await supabase
    .from('visa_records')
    .select('visa_type, expiry_date, status')
    .eq('user_id', userId)
    .gte('expiry_date', new Date().toISOString().slice(0, 10))
    .order('expiry_date', { ascending: true })
    .limit(1);

  const v = data?.[0];
  if (!v) return null;
  const days = daysUntil(v.expiry_date);
  return {
    lead: 'Visa',
    leadRu: 'Виза',
    value: `${days} ${days === 1 ? 'day' : 'days'} left`,
    tail: `${v.visa_type} · ${v.status ?? 'active'}`,
    tailRu: `${v.visa_type} · ${v.status === 'active' ? 'активна' : v.status ?? 'активна'}`,
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
  const todayIso = new Date().toISOString().slice(0, 10);
  const { data: current } = await supabase
    .from('property_bookings')
    .select('check_in, check_out, guest_name, status')
    .eq('owner_id', userId)
    .lte('check_in', todayIso)
    .gte('check_out', todayIso)
    .not('status', 'in', '("cancelled","refunded")')
    .order('check_out', { ascending: true })
    .limit(1);

  if (current?.[0]) {
    const c = current[0];
    return {
      lead: 'Your property',
      leadRu: 'Ваш объект',
      value: 'Occupied',
      tail: `Check-out ${fmtDate(c.check_out, 'en')}`,
      tailRu: `Выезд ${fmtDate(c.check_out, 'ru')}`,
      state: 'live',
      isLive: true,
    };
  }

  const { data: upcoming } = await supabase
    .from('property_bookings')
    .select('check_in, check_out, guest_name, status')
    .eq('owner_id', userId)
    .gt('check_in', todayIso)
    .not('status', 'in', '("cancelled","refunded")')
    .order('check_in', { ascending: true })
    .limit(1);

  const u = upcoming?.[0];
  if (!u) return null;
  return {
    lead: 'Next booking',
    leadRu: 'Следующая бронь',
    value: fmtDate(u.check_in, 'en'),
    tail: `${u.guest_name ?? 'Guest'} · ${u.status}`,
    tailRu: `${u.guest_name ?? 'Гость'} · ${u.status}`,
    state: 'active',
    isLive: true,
  };
}

async function resolveInvestor(userId: string): Promise<RoleSignal | null> {
  // Sum of active deal values where user is the agent
  const { data } = await supabase
    .from('agent_deals')
    .select('deal_value, currency, stage, deal_status')
    .eq('agent_id', userId)
    .eq('deal_status', 'active');

  if (!data || data.length === 0) return null;
  const total = data.reduce((s, d) => s + Number(d.deal_value ?? 0), 0);
  const pending = data.filter(d => ['proposal', 'negotiation', 'pending'].includes(d.stage)).length;
  return {
    lead: 'Portfolio',
    leadRu: 'Портфель',
    value: total > 0 ? fmtTHB(total) : `${data.length} deals`,
    tail: `${data.length} active · ${pending} pending`,
    tailRu: `${data.length} активных · ${pending} в ожидании`,
    state: 'active',
    isLive: true,
  };
}

async function resolveDeveloper(userId: string): Promise<RoleSignal | null> {
  // Closest project completion (developer_id may be a user id or org id)
  const { data } = await supabase
    .from('property_projects')
    .select('name_en, name_ru, completion_date, total_units, units_sold, project_status')
    .eq('developer_id', userId)
    .not('completion_date', 'is', null)
    .order('completion_date', { ascending: true })
    .limit(1);

  const p = data?.[0];
  if (!p) return null;
  const days = p.completion_date ? daysUntil(p.completion_date) : null;
  const nameEn = (p.name_en ?? p.name_ru ?? 'Project').slice(0, 24);
  const nameRu = (p.name_ru ?? p.name_en ?? 'Проект').slice(0, 24);
  return {
    lead: nameEn,
    leadRu: nameRu,
    value: p.total_units ? `${p.units_sold ?? 0} / ${p.total_units}` : (p.project_status ?? 'active'),
    tail: days !== null ? `Handover in ${days} days` : (p.project_status ?? ''),
    tailRu: days !== null ? `Сдача через ${days} дн.` : (p.project_status ?? ''),
    state: days !== null && days <= 90 ? 'warn' : 'active',
    isLive: true,
  };
}

async function resolveProvider(userId: string): Promise<RoleSignal | null> {
  // Today's vendor bookings count + revenue
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();   endOfDay.setHours(23, 59, 59, 999);

  const { data } = await supabase
    .from('orders')
    .select('id, total_amount, status, vendor_payout_amount')
    .eq('provider_org_id', userId) // best-effort; org membership lookup is heavier
    .gte('created_at', startOfDay.toISOString())
    .lte('created_at', endOfDay.toISOString())
    .is('deleted_at', null);

  if (!data || data.length === 0) return null;
  const revenue = data.reduce((s, o) => s + Number(o.vendor_payout_amount ?? o.total_amount ?? 0), 0);
  const pending = data.filter(o => ['pending', 'awaiting_payment'].includes(String(o.status))).length;
  return {
    lead: 'Today',
    leadRu: 'Сегодня',
    value: `${data.length} bookings`,
    tail: `${fmtTHB(revenue)} · ${pending} pending`,
    tailRu: `${fmtTHB(revenue)} · ${pending} ожидают`,
    state: 'active',
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

  const { data } = await q;
  const o = data?.[0];
  if (!o || !o.start_at) return null;
  return {
    lead: o.vertical ?? o.order_type ?? 'Booking',
    leadRu: o.vertical ?? o.order_type ?? 'Бронь',
    value: fmtTime(o.start_at),
    tail: `${fmtDate(o.start_at, 'en')} · ${o.status}`,
    tailRu: `${fmtDate(o.start_at, 'ru')} · ${o.status}`,
    state: 'live',
    isLive: true,
  };
}

// Resolver dispatch table
const RESOLVERS: Partial<Record<UserPersona, (uid: string) => Promise<RoleSignal | null>>> = {
  tourist: resolveTourist,
  resident: resolveResident,
  relocation: resolveRelocation,
  property_owner: resolveOwner,
  investor: resolveInvestor,
  real_estate_developer: resolveDeveloper,
  local_services_provider: resolveProvider,
  family: (uid) => resolveNextOrder(uid),
  couple: (uid) => resolveNextOrder(uid),
  nightlife: (uid) => resolveNextOrder(uid),
  active: (uid) => resolveNextOrder(uid),
  business: (uid) => resolveNextOrder(uid, ['legal', 'medical']),
  nomad: (uid) => resolveNextOrder(uid),
  pet_owner: (uid) => resolveNextOrder(uid, ['pet_service', 'medical']),
};

/**
 * Returns a SignalMap covering the requested personas. For each persona we run
 * its resolver in parallel; failures and empty results fall back to SIGNAL_SEED.
 */
export function useRoleSignals(personas: UserPersona[]) {
  const { user } = useAuth();
  const userId = user?.id;
  const personaKey = personas.join(',');

  const query = useQuery({
    queryKey: ['role-signals', userId, personaKey],
    queryFn: async (): Promise<SignalMap> => {
      if (!userId) return {};
      const entries = await Promise.all(
        personas.map(async (p) => {
          const fn = RESOLVERS[p];
          if (!fn) return [p, null] as const;
          try {
            const sig = await fn(userId);
            return [p, sig] as const;
          } catch (err) {
            console.warn('[useRoleSignals] resolver failed for', p, err);
            return [p, null] as const;
          }
        }),
      );
      const out: SignalMap = {};
      for (const [p, sig] of entries) if (sig) out[p] = sig;
      return out;
    },
    enabled: !!userId && personas.length > 0,
    staleTime: 60_000,
  });

  // Merge live data with seed fallback so every persona always has a signal.
  const signals: SignalMap = {};
  for (const p of personas) {
    const live = query.data?.[p];
    if (live) {
      signals[p] = live;
    } else {
      const seed = SIGNAL_SEED[p];
      if (seed) signals[p] = { ...seed, isLive: false };
    }
  }

  return {
    signals,
    isLoading: query.isLoading,
    isAuthenticated: !!userId,
  };
}
