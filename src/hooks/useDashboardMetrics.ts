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

export interface DashboardKPI {
  revenue: number;
  expenses: number;
  margin: number;
  occupancyRate: number;
  revenuePrev: number;
  expensesPrev: number;
  adr: number;
  revpar: number;
  totalBookings: number;
  bookedNights: number;
}

export interface DashboardOps {
  openTasks: number;
  activeDeals: number;
  dealsPipelineValue: number;
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

  const totalPropertyCount = selectedPropertyId ? 1 : allProperties.length;

  return useQuery({
    queryKey: ['dashboard-metrics', user?.id, companyId, [...filteredPropertyIds].sort().join(',')],
    queryFn: async () => {
      if (!user?.id || filteredPropertyIds.length === 0) {
        return { kpi: null, ops: null };
      }

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
      const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
      const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);
      const today = now.toISOString().slice(0, 10);

      // Pre-fetch booking IDs for unread message scoping
      const { data: propBookingIds } = await supabase
        .from('property_bookings').select('id').in('property_id', filteredPropertyIds);
      const bookingIdList = (propBookingIds || []).map(b => b.id);

      // All queries in parallel
      const [
        incomeRes, expenseRes, incomePrevRes, expensePrevRes, bookingsRes,
        crmTasksRes, overdueCrmRes, dealsRes, upcomingBookingsRes,
        staffRes, serviceReqRes, inventoryRes, unreadRes, pendingInvRes,
      ] = await Promise.all([
        // Financial — current month
        supabase.from('property_financials').select('amount')
          .in('property_id', filteredPropertyIds).eq('transaction_type', 'income')
          .gte('transaction_date', startOfMonth).lte('transaction_date', endOfMonth),
        supabase.from('property_financials').select('amount')
          .in('property_id', filteredPropertyIds).eq('transaction_type', 'expense')
          .gte('transaction_date', startOfMonth).lte('transaction_date', endOfMonth),
        // Financial — previous month
        supabase.from('property_financials').select('amount')
          .in('property_id', filteredPropertyIds).eq('transaction_type', 'income')
          .gte('transaction_date', startOfPrevMonth).lte('transaction_date', endOfPrevMonth),
        supabase.from('property_financials').select('amount')
          .in('property_id', filteredPropertyIds).eq('transaction_type', 'expense')
          .gte('transaction_date', startOfPrevMonth).lte('transaction_date', endOfPrevMonth),
        // Bookings — current month
        supabase.from('property_bookings').select('check_in, check_out, total_amount')
          .in('property_id', filteredPropertyIds)
          .in('status', ['confirmed', 'checked_in', 'completed'])
          .lte('check_in', endOfMonth).gte('check_out', startOfMonth),
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
          ? supabase.from('agent_deals').select('id, deal_value', { count: 'exact' })
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

      // KPI calculations
      const sum = (rows: { amount: number }[] | null) => (rows || []).reduce((s: number, r) => s + Number(r.amount || 0), 0);
      const revenue = sum(incomeRes.data);
      const expenses = sum(expenseRes.data);
      const revenuePrev = sum(incomePrevRes.data);
      const expensesPrev = sum(expensePrevRes.data);
      const margin = revenue > 0 ? Math.round(((revenue - expenses) / revenue) * 100) : 0;

      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      let bookedNights = 0;
      let bookingRevenue = 0;
      const totalBookings = (bookingsRes.data || []).length;
      for (const b of (bookingsRes.data || [])) {
        const ci = new Date(Math.max(new Date(b.check_in).getTime(), new Date(startOfMonth).getTime()));
        const co = new Date(Math.min(new Date(b.check_out).getTime(), new Date(endOfMonth).getTime()));
        const nights = Math.max(0, Math.ceil((co.getTime() - ci.getTime()) / (1000 * 60 * 60 * 24)));
        bookedNights += nights;
        bookingRevenue += Number(b.total_amount || 0);
      }
      const totalNights = Math.max(1, totalPropertyCount) * daysInMonth;
      const occupancyRate = Math.min(100, Math.round((bookedNights / totalNights) * 100));
      const adr = bookedNights > 0 ? Math.round(bookingRevenue / bookedNights) : 0;
      const revpar = Math.round(bookingRevenue / totalNights);

      const kpi: DashboardKPI = {
        revenue, expenses, margin, occupancyRate, revenuePrev, expensesPrev,
        adr, revpar, totalBookings, bookedNights,
      };

      // Ops calculations
      type CountResult = { count?: number | null; data?: unknown[]; error: unknown };
      const getCount = (res: CountResult) => res.count || 0;
      const dealsData = ((dealsRes as { data?: { id: string; deal_value: number | null }[] }).data || []);
      const inventoryItems = ((inventoryRes as { data?: { id: string; quantity: number | null; min_quantity: number | null }[] }).data || []);
      const ops: DashboardOps = {
        openTasks: getCount(crmTasksRes as CountResult),
        overdueTasks: getCount(overdueCrmRes as CountResult),
        activeDeals: getCount(dealsRes as CountResult) || dealsData.length,
        dealsPipelineValue: dealsData.reduce((s, d) => s + Number(d.deal_value || 0), 0),
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
