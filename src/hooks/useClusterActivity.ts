/**
 * useClusterActivity — real-time activity counters per home cluster.
 *
 * Powers the orange-dot indicator on the PersonaHalo grid. Each cluster
 * has a strict definition of what counts as "open / awaiting action" so
 * the dot is meaningful, not noisy.
 *
 * Cluster → signal mapping (canonical, 2026-04):
 *
 *  - arrive  : open `orders` of consumer type (tour/vehicle/yacht/flowers/food)
 *              + pending/assigned `airport_bookings`.
 *  - live    : open `orders` of lifestyle type (beauty/cleaning/service)
 *              + open `support_tickets`.
 *  - manage  : pending `property_bookings` (owner side)
 *              + pending `property_operational_tasks` assigned to user
 *              + open `property_inquiries` to user's properties.
 *  - invest  : open `investor_inquiries` by user
 *              + pending `listing_applications`.
 *  - legal   : in-flight `visa_records` (pending / submitted / in_progress).
 *  - build   : pending `partner_applications`.
 *
 * Returns a stable record `{ clusterId: count }`. UI treats `count > 0`
 * as "show the orange dot". Per-cluster counts are also exposed so we
 * can later upgrade the visual to a small numeric badge.
 *
 * All queries are head-only (`count: 'exact', head: true`) to avoid
 * pulling rows into the client. Failures degrade silently to 0 — we
 * never block the home render on a signal probe.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ClusterId } from '@/lib/catalog/taxonomy';

export type ClusterActivityCounts = Record<ClusterId, number>;

const EMPTY: ClusterActivityCounts = {
  arrive: 0,
  live: 0,
  manage: 0,
  invest: 0,
  legal: 0,
  build: 0,
};

const ARRIVE_ORDER_TYPES = ['tour', 'vehicle', 'yacht', 'flowers', 'food'];
const LIVE_ORDER_TYPES = ['beauty', 'cleaning', 'service'];
// Statuses that mean "user still owes an action or is waiting on us".
// Narrow literal tuples — match the generated Database enums for each table.
const OPEN_ORDER_STATUSES = [
  'pending',
  'awaiting_client_payment',
  'pending_deposit',
  'in_progress',
] as const;
const OPEN_AIRPORT_STATUSES = ['pending', 'assigned'];
const OPEN_PROPERTY_BOOKING_STATUSES = ['pending', 'awaiting_payment'];
const OPEN_PROPERTY_INQUIRY_STATUSES = ['new', 'pending', 'open'];
const OPEN_TICKET_STATUSES = ['open', 'pending', 'awaiting_response'];
const OPEN_INVESTOR_STATUSES = ['new', 'qualified', 'contacted'] as const;
const OPEN_VISA_STATUSES = ['pending', 'submitted', 'in_progress', 'review'];
const OPEN_LISTING_APPLICATION_STATUSES = ['pending', 'under_review', 'revision_requested'] as const;
const OPEN_PARTNER_APPLICATION_STATUSES = ['pending', 'in_review'];
const OPEN_TASK_STATUSES = ['pending', 'open', 'in_progress'];

/** Safely run a head-count query; resolve to 0 on any error. */
async function safeCount(
  promise: PromiseLike<{ count: number | null; error: unknown }>,
): Promise<number> {
  try {
    const { count, error } = await promise;
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

async function fetchClusterActivity(userId: string): Promise<ClusterActivityCounts> {
  const out: ClusterActivityCounts = { ...EMPTY };

  const [
    arriveOrders,
    airportBookings,
    liveOrders,
    supportTickets,
    propertyBookings,
    operationalTasks,
    propertyInquiries,
    investorInquiries,
    listingApplications,
    visaRecords,
    partnerApplications,
  ] = await Promise.all([
    // arrive — consumer one-off bookings
    safeCount(
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('customer_user_id', userId)
        .in('order_type', ARRIVE_ORDER_TYPES)
        .in('status', OPEN_ORDER_STATUSES) as unknown as PromiseLike<{ count: number | null; error: unknown }>,
    ),
    safeCount(
      supabase
        .from('airport_bookings')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('status', OPEN_AIRPORT_STATUSES) as unknown as PromiseLike<{ count: number | null; error: unknown }>,
    ),

    // live — lifestyle services + support
    safeCount(
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('customer_user_id', userId)
        .in('order_type', LIVE_ORDER_TYPES)
        .in('status', OPEN_ORDER_STATUSES) as unknown as PromiseLike<{ count: number | null; error: unknown }>,
    ),
    safeCount(
      supabase
        .from('support_tickets')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('status', OPEN_TICKET_STATUSES) as unknown as PromiseLike<{ count: number | null; error: unknown }>,
    ),

    // manage — owner side
    safeCount(
      supabase
        .from('property_bookings')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', userId)
        .in('status', OPEN_PROPERTY_BOOKING_STATUSES) as unknown as PromiseLike<{ count: number | null; error: unknown }>,
    ),
    safeCount(
      supabase
        .from('property_operational_tasks')
        .select('id', { count: 'exact', head: true })
        .eq('assigned_to', userId)
        .in('status', OPEN_TASK_STATUSES) as unknown as PromiseLike<{ count: number | null; error: unknown }>,
    ),
    safeCount(
      // Inquiries directed at user (owner). RLS scopes rows to the right side.
      supabase
        .from('property_inquiries')
        .select('id', { count: 'exact', head: true })
        .in('status', OPEN_PROPERTY_INQUIRY_STATUSES) as unknown as PromiseLike<{ count: number | null; error: unknown }>,
    ),

    // invest
    safeCount(
      supabase
        .from('investor_inquiries')
        .select('id', { count: 'exact', head: true })
        .eq('inquirer_user_id', userId)
        .in('status', OPEN_INVESTOR_STATUSES) as unknown as PromiseLike<{ count: number | null; error: unknown }>,
    ),
    safeCount(
      supabase
        .from('listing_applications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('status', OPEN_APPLICATION_STATUSES) as unknown as PromiseLike<{ count: number | null; error: unknown }>,
    ),

    // legal — visa pipeline
    safeCount(
      supabase
        .from('visa_records')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('status', OPEN_VISA_STATUSES) as unknown as PromiseLike<{ count: number | null; error: unknown }>,
    ),

    // build — partner / vendor / developer applications
    safeCount(
      supabase
        .from('partner_applications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('status', OPEN_APPLICATION_STATUSES) as unknown as PromiseLike<{ count: number | null; error: unknown }>,
    ),
  ]);

  out.arrive = arriveOrders + airportBookings;
  out.live = liveOrders + supportTickets;
  out.manage = propertyBookings + operationalTasks + propertyInquiries;
  out.invest = investorInquiries + listingApplications;
  out.legal = visaRecords;
  out.build = partnerApplications;

  return out;
}

export function useClusterActivity(userId: string | undefined) {
  return useQuery<ClusterActivityCounts>({
    queryKey: ['cluster-activity', userId],
    queryFn: () => (userId ? fetchClusterActivity(userId) : Promise.resolve({ ...EMPTY })),
    enabled: !!userId,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
