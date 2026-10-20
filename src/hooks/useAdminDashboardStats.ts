import { useAuth } from '@/contexts/AuthContext';
import { useAdminCheck } from '@/hooks/useAdmin';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CACHE_PROFILES } from '@/lib/queryConfig';
import { pendingModeration } from '@/lib/adminModeration';
import { applyOrderQueue, applyManualPaymentQueue, applyTicketQueue } from '@/lib/adminDashboardQueues';

export const DASHBOARD_COUNT_KEYS = [
  'providers', 'services', 'activeProviders', 'pendingProviders', 'yachts', 'tours',
  'properties', 'restaurants', 'salons', 'clinics', 'gyms', 'vehicles', 'events',
  'education', 'pets', 'cleaning', 'babysitters', 'flowers', 'pharmacies', 'stores',
  'insurance', 'waterActivities', 'totalUsers', 'unoTeamMembers', 'totalBookings',
  'pendingBookings', 'pendingProperties', 'pendingListings', 'pendingContent',
  'openTickets', 'openDisputes', 'pendingPartnerApplications', 'pendingManualPayments',
  'pendingOrders', 'pendingOrders24h',
] as const;
export type DashboardCountKey = typeof DASHBOARD_COUNT_KEYS[number];
export type DashboardStats = Record<DashboardCountKey, number | null> & {
  sourceErrors: Partial<Record<DashboardCountKey, string>>;
  sourceUpdatedAt: Partial<Record<DashboardCountKey, number>>;
  ordersCreatedBefore: string;
};
type CountResult = { count: number | null; error: unknown };

/** Independent exact reads: a failed source never becomes a verified zero. */
export async function fetchAdminDashboardStats(now = new Date()): Promise<DashboardStats> {
  const counts = Object.fromEntries(DASHBOARD_COUNT_KEYS.map(key => [key, null])) as Record<DashboardCountKey, number | null>;
  const sourceErrors: DashboardStats['sourceErrors'] = {};
  const sourceUpdatedAt: DashboardStats['sourceUpdatedAt'] = {};
  const options = { count: 'exact' as const, head: true };
  const ordersCreatedBefore = new Date(now.getTime() - 86400000).toISOString();
  const read = async (key: DashboardCountKey, run: () => PromiseLike<CountResult>) => {
    try {
      const result = await run();
      if (result.error || result.count === null || !Number.isSafeInteger(result.count) || result.count < 0) {
        sourceErrors[key] = 'unavailable';
      } else {
        counts[key] = result.count;
        sourceUpdatedAt[key] = Date.now();
      }
    } catch { sourceErrors[key] = 'unavailable'; }
  };
  const verticals = {
    yachts: 'yacht', tours: 'experience', restaurants: 'restaurant', clinics: 'clinic',
    vehicles: 'vehicle', education: 'education', pets: 'pet_service', cleaning: 'cleaning', babysitters: 'babysitter',
  } as const;
  await Promise.all([
    ...Object.entries(verticals).map(([key, vertical]) => read(key as DashboardCountKey,
      () => supabase.from('listings').select('id', options).eq('vertical', vertical))),
    read('providers', () => supabase.from('providers').select('id', options)),
    read('services', () => supabase.from('services').select('id', options)),
    read('properties', () => supabase.from('properties').select('id', options).is('deleted_at', null)),
    read('totalUsers', () => supabase.from('profiles').select('id', options)),
    read('unoTeamMembers', () => supabase.from('user_roles').select('id', options).eq('role', 'uno_team')),
    read('totalBookings', () => supabase.from('bookings').select('id', options)),
    // Legacy booking metric remains distinct; never linked to an orders queue.
    read('pendingBookings', () => supabase.from('bookings').select('id', options).eq('status', 'submitted')),
    read('salons', () => supabase.from('salons').select('id', options)),
    read('gyms', () => supabase.from('gyms').select('id', options)),
    read('events', () => supabase.from('events').select('id', options)),
    read('pharmacies', () => supabase.from('pharmacies').select('id', options)),
    read('stores', () => supabase.from('marketplace_products').select('id', options)),
    read('insurance', () => supabase.from('insurance_plans').select('id', options)),
    read('waterActivities', () => supabase.from('water_activities').select('id', options)),
    read('flowers', () => supabase.from('flower_shops').select('id', options)),
    read('pendingProperties', () => pendingModeration((column, value) => supabase.from('properties').select('id', options).eq(column, value)).is('deleted_at', null)),
    read('pendingListings', () => pendingModeration((column, value) => supabase.from('listings').select('id', options).eq(column, value))),
    read('openTickets', () => applyTicketQueue(supabase.from('support_tickets').select('id', options), 'active')),
    read('openDisputes', () => supabase.from('disputes').select('id', options).eq('status', 'open')),
    read('pendingPartnerApplications', () => supabase.from('partner_applications').select('id', options).eq('status', 'pending')),
    read('pendingManualPayments', () => applyManualPaymentQueue(supabase.from('manual_payment_requests').select('id', options), 'review')),
    read('pendingOrders', () => applyOrderQueue(supabase.from('orders').select('id', options), { status: 'pending', createdBefore: null })),
    read('pendingOrders24h', () => applyOrderQueue(supabase.from('orders').select('id', options), { status: 'pending', createdBefore: ordersCreatedBefore })),
    read('activeProviders', () => supabase.from('providers').select('id', options).eq('is_active', true)),
    read('pendingProviders', () => supabase.from('providers').select('id', options).eq('is_verified', false)),
  ]);
  if (counts.pendingProperties !== null && counts.pendingListings !== null) {
    counts.pendingContent = counts.pendingProperties + counts.pendingListings;
    sourceUpdatedAt.pendingContent = Math.min(sourceUpdatedAt.pendingProperties!, sourceUpdatedAt.pendingListings!);
  } else sourceErrors.pendingContent = 'unavailable';
  return { ...counts, sourceErrors, sourceUpdatedAt, ordersCreatedBefore };
}

export function useAdminDashboardStats() {
  const { user } = useAuth();
  const { isAdmin, isLoading: checkingAccess } = useAdminCheck();
  return useQuery({
    ...CACHE_PROFILES.ADMIN,
    enabled: !!user && isAdmin && !checkingAccess,
    queryKey: ['admin-dashboard-stats', user?.id],
    queryFn: () => fetchAdminDashboardStats(),
  });
}
