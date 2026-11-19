/**
 * @module useDashboardMetrics
 * Consolidated dashboard metrics hook — one batch of queries 
 * shared across BusinessKPIWidget, TodayActionsWidget, etc.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMyCompanyId } from '@/hooks/useAgentDeals';
import { useMyProperties } from '@/hooks/useMyProperties';
import { useDashboardFilter } from '@/contexts/DashboardFilterContext';
import { CACHE_PROFILES } from '@/lib/queryConfig';
import { CRM_TASK_ACTIVE_STATUSES } from '@/lib/tasks/taskStatus';
import { addMonths, differenceInCalendarDays, startOfMonth } from 'date-fns';
import { bangkokTodayISO, civilDateKey, civilStaySpan, parseCivilDate } from '@/lib/hotelDates';

export interface DashboardKPI {
  occupancyRate: number | null;
  totalBookings: number | null;
  bookedNights: number | null;
}

export interface DashboardOps {
  openTasks: number;
  activeDeals: number;
  upcomingBookings: number;
  staffCount: number;
  openServiceRequests: number;
  lowStockItems: number;
  overdueTasks: number;
  unreadMessages: number;
  pendingInvoices: number;
}

export function useDashboardMetrics() {
  const { user } = useAuth();
  const { data: company } = useMyCompanyId();
  const companyId = company?.company_id;
  const { allProperties } = useMyProperties();
  const { selectedPropertyId } = useDashboardFilter();

  // Filter property IDs based on global dashboard filter
  const filteredPropertyIds = selectedPropertyId
    ? allProperties.filter(p => p.property_id === selectedPropertyId).map(p => p.property_id)
    : allProperties.map(p => p.property_id);

  const today = bangkokTodayISO();

  return useQuery({
    queryKey: ['dashboard-metrics', user?.id, companyId, [...filteredPropertyIds].sort().join(','), today],
    queryFn: async () => {
      if (!user?.id || filteredPropertyIds.length === 0) {
        return { kpi: null, ops: null };
      }

      const monthStart = startOfMonth(parseCivilDate(today));
      const nextMonth = addMonths(monthStart, 1);
      const startKey = civilDateKey(monthStart);
      const endExclusiveKey = civilDateKey(nextMonth);
      const daysInMonth = differenceInCalendarDays(nextMonth, monthStart);

      // Pre-fetch booking IDs for unread message scoping
      const { data: propBookingIds, error: bookingScopeError } = await supabase
        .from('property_bookings').select('id').in('property_id', filteredPropertyIds);
      if (bookingScopeError) throw bookingScopeError;
      const bookingIdList = (propBookingIds || []).map(b => b.id);

      // All queries in parallel
      const [
        bookingsRes,
        crmTasksRes, overdueCrmRes, dealsRes, upcomingBookingsRes,
        staffRes, serviceReqRes, inventoryRes, unreadRes, pendingInvRes,
      ] = await Promise.all([
        // Booked nights, including future reservations, are operational, not payments.
        supabase.from('property_bookings').select('property_id, check_in, check_out')
          .in('property_id', filteredPropertyIds)
          .in('status', ['confirmed', 'checked_in', 'completed'])
          .lt('check_in', endExclusiveKey).gt('check_out', startKey),
        // CRM tasks (open)
        companyId
          ? supabase.from('crm_tasks').select('id', { count: 'exact', head: true })
              .eq('company_id', companyId).in('status', [...CRM_TASK_ACTIVE_STATUSES])
          : Promise.resolve({ count: 0, error: null }),
        // CRM tasks (overdue)
        companyId
          ? supabase.from('crm_tasks').select('id', { count: 'exact', head: true })
              .eq('company_id', companyId).in('status', [...CRM_TASK_ACTIVE_STATUSES]).lt('due_date', today)
          : Promise.resolve({ count: 0, error: null }),
        // Deals
        companyId
          ? supabase.from('agent_deals').select('id', { count: 'exact', head: true })
              .eq('company_id', companyId).not('stage', 'in', '("won","lost")')
          : Promise.resolve({ count: 0, data: [], error: null }),
        // Upcoming bookings
        supabase.from('property_bookings').select('id', { count: 'exact', head: true })
          .in('property_id', filteredPropertyIds)
          .in('status', ['confirmed', 'checked_in']).gte('check_out', today),
        // Staff — scoped to company if available, otherwise by owner
        companyId
          ? supabase.from('staff_members').select('id', { count: 'exact', head: true })
              .eq('company_id', companyId).eq('is_active', true)
          : supabase.from('staff_members').select('id', { count: 'exact', head: true })
              .eq('owner_id', user.id).eq('is_active', true),
        // Service requests — scoped to filtered properties
        supabase.from('property_service_requests').select('id', { count: 'exact', head: true })
          .in('property_id', filteredPropertyIds).in('status', ['pending', 'in_progress']),
        // Inventory (low stock) — scoped to filtered properties
        supabase.from('property_inventory_items').select('id, quantity, min_quantity')
          .in('property_id', filteredPropertyIds).eq('is_active', true),
        // Unread messages — scoped to filtered properties
        bookingIdList.length > 0
          ? supabase.from('booking_notifications_log').select('id', { count: 'exact', head: true })
              .is('read_at', null)
              .in('booking_id', bookingIdList)
              .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString())
          : Promise.resolve({ count: 0 }),
        // Pending invoices — scoped to filtered properties
        supabase.from('property_financials').select('id', { count: 'exact', head: true })
          .in('property_id', filteredPropertyIds).eq('transaction_type', 'expense').eq('status', 'pending'),
      ]);

      const bookedPropertyNights = new Set<string>();
      for (const booking of (bookingsRes.data ?? [])) {
        const span = civilStaySpan(booking, monthStart, daysInMonth);
        if (!span) continue;
        for (let day = span.startOffset; day < span.endOffset; day++) {
          bookedPropertyNights.add(`${booking.property_id}:${day}`);
        }
      }
      const totalNights = new Set(filteredPropertyIds).size * daysInMonth;
      const kpi: DashboardKPI = bookingsRes.error ? {
        occupancyRate: null, totalBookings: null, bookedNights: null,
      } : {
        occupancyRate: Math.round(bookedPropertyNights.size / totalNights * 100),
        totalBookings: bookingsRes.data?.length ?? 0,
        bookedNights: bookedPropertyNights.size,
      };

      // Do not expose a zero-count "all clear" if a dashboard source failed.
      for (const result of [crmTasksRes, overdueCrmRes, dealsRes, upcomingBookingsRes,
        staffRes, serviceReqRes, inventoryRes, unreadRes, pendingInvRes]) {
        if ('error' in result && result.error) throw result.error;
      }

      // Ops calculations
      type CountResult = { count?: number | null; data?: unknown[]; error: unknown };
      const getCount = (res: CountResult) => res.count || 0;
      const inventoryItems = ((inventoryRes as { data?: { id: string; quantity: number | null; min_quantity: number | null }[] }).data || []);
      const ops: DashboardOps = {
        openTasks: getCount(crmTasksRes as CountResult),
        overdueTasks: getCount(overdueCrmRes as CountResult),
        activeDeals: getCount(dealsRes as CountResult),
        upcomingBookings: getCount(upcomingBookingsRes as CountResult),
        staffCount: getCount(staffRes as CountResult),
        openServiceRequests: getCount(serviceReqRes as CountResult),
        lowStockItems: inventoryItems.filter(i =>
          i.min_quantity != null && i.quantity != null && i.quantity < i.min_quantity
        ).length,
        unreadMessages: getCount(unreadRes as CountResult),
        pendingInvoices: getCount(pendingInvRes as CountResult),
      };

      return { kpi, ops };
    },
    enabled: !!user?.id && filteredPropertyIds.length > 0,
    ...CACHE_PROFILES.DYNAMIC,
  });
}
