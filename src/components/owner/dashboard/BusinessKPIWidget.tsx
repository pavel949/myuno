import { useEffect, useState } from 'react';
import { DollarSign, TrendingDown, Percent, CalendarCheck, ClipboardList, Handshake, BedDouble, Users, Wrench, PackageOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMyCompanyId } from '@/hooks/useAgentDeals';
import { OwnerKPICard } from '@/components/owner/OwnerKPICard';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { type BusinessRole } from '@/lib/businessRoles';

interface KPIData {
  revenue: number;
  expenses: number;
  margin: number;
  occupancyRate: number;
  revenuePrev: number;
  expensesPrev: number;
}

interface OpsData {
  openTasks: number;
  activeDeals: number;
  dealsPipelineValue: number;
  upcomingBookings: number;
  staffCount: number;
  openServiceRequests: number;
  lowStockItems: number;
}

type OpsCardKey = 'tasks' | 'deals' | 'bookings' | 'staff' | 'service' | 'inventory';

const ROLE_OPS_CARDS: Record<BusinessRole, OpsCardKey[]> = {
  property_manager: ['tasks', 'deals', 'bookings', 'staff', 'service', 'inventory'],
  sales_agent: ['tasks', 'deals', 'bookings'],
  service_provider: ['tasks', 'service', 'inventory'],
  general: ['tasks', 'deals', 'bookings', 'staff', 'service', 'inventory'],
};

interface BusinessKPIWidgetProps {
  role?: BusinessRole;
}

export function BusinessKPIWidget({ role = 'general' }: BusinessKPIWidgetProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [data, setData] = useState<KPIData | null>(null);
  const [ops, setOps] = useState<OpsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: company } = useMyCompanyId();
  const companyId = company?.company_id;

  useEffect(() => {
    if (!user) return;

    async function fetchKPI() {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
      const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
      const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);
      const today = now.toISOString().slice(0, 10);

      // Financial queries (existing)
      const [incomeRes, expenseRes, incomePrevRes, expensePrevRes, bookingsRes] = await Promise.all([
        supabase
          .from('property_financials')
          .select('amount')
          .eq('owner_id', user!.id)
          .eq('transaction_type', 'income')
          .gte('transaction_date', startOfMonth)
          .lte('transaction_date', endOfMonth),
        supabase
          .from('property_financials')
          .select('amount')
          .eq('owner_id', user!.id)
          .eq('transaction_type', 'expense')
          .gte('transaction_date', startOfMonth)
          .lte('transaction_date', endOfMonth),
        supabase
          .from('property_financials')
          .select('amount')
          .eq('owner_id', user!.id)
          .eq('transaction_type', 'income')
          .gte('transaction_date', startOfPrevMonth)
          .lte('transaction_date', endOfPrevMonth),
        supabase
          .from('property_financials')
          .select('amount')
          .eq('owner_id', user!.id)
          .eq('transaction_type', 'expense')
          .gte('transaction_date', startOfPrevMonth)
          .lte('transaction_date', endOfPrevMonth),
        supabase
          .from('property_bookings')
          .select('check_in, check_out')
          .eq('owner_id', user!.id)
          .in('status', ['confirmed', 'checked_in', 'completed'])
          .lte('check_in', endOfMonth)
          .gte('check_out', startOfMonth),
      ]);

      const sum = (rows: { amount: number }[] | null) =>
        (rows || []).reduce((s, r) => s + Number(r.amount || 0), 0);

      const revenue = sum(incomeRes.data as any);
      const expenses = sum(expenseRes.data as any);
      const revenuePrev = sum(incomePrevRes.data as any);
      const expensesPrev = sum(expensePrevRes.data as any);
      const margin = revenue > 0 ? Math.round(((revenue - expenses) / revenue) * 100) : 0;

      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      let bookedNights = 0;
      for (const b of (bookingsRes.data || [])) {
        const ci = new Date(Math.max(new Date(b.check_in).getTime(), new Date(startOfMonth).getTime()));
        const co = new Date(Math.min(new Date(b.check_out).getTime(), new Date(endOfMonth).getTime()));
        const nights = Math.max(0, Math.ceil((co.getTime() - ci.getTime()) / (1000 * 60 * 60 * 24)));
        bookedNights += nights;
      }

      const { count: propCount } = await supabase
        .from('properties')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', user!.id);

      const totalNights = (propCount || 1) * daysInMonth;
      const occupancyRate = Math.min(100, Math.round((bookedNights / totalNights) * 100));

      setData({ revenue, expenses, margin, occupancyRate, revenuePrev, expensesPrev });

      // Operational queries
      const opsPromises = await Promise.all([
        // 0: open CRM tasks
        companyId
          ? supabase.from('crm_tasks').select('id', { count: 'exact', head: true }).eq('company_id', companyId).neq('status', 'done')
          : Promise.resolve({ count: 0, error: null }),
        // 1: active deals count
        companyId
          ? supabase.from('agent_deals').select('id, deal_value', { count: 'exact' }).eq('company_id', companyId).not('stage', 'in', '("won","lost")')
          : Promise.resolve({ count: 0, data: [], error: null }),
        // 2: upcoming bookings
        supabase
          .from('property_bookings')
          .select('id', { count: 'exact', head: true })
          .eq('owner_id', user!.id)
          .in('status', ['confirmed', 'checked_in'])
          .gte('check_out', today),
        // 3: staff count
        supabase
          .from('staff_members')
          .select('id', { count: 'exact', head: true })
          .eq('owner_id', user!.id)
          .eq('is_active', true),
        // 4: open service requests
        supabase
          .from('property_service_requests')
          .select('id', { count: 'exact', head: true })
          .eq('owner_id', user!.id)
          .in('status', ['pending', 'in_progress']),
        // 5: low stock items
        supabase
          .from('property_inventory_items')
          .select('id, quantity, min_quantity')
          .eq('owner_id', user!.id)
          .eq('is_active', true),
      ]);

      const openTasks = (opsPromises[0] as any).count || 0;
      const dealsData = (opsPromises[1] as any).data || [];
      const activeDeals = (opsPromises[1] as any).count || dealsData.length;
      const dealsPipelineValue = dealsData.reduce((s: number, d: any) => s + Number(d.deal_value || 0), 0);
      const upcomingBookings = (opsPromises[2] as any).count || 0;
      const staffCount = (opsPromises[3] as any).count || 0;
      const openServiceRequests = (opsPromises[4] as any).count || 0;
      const inventoryItems = (opsPromises[5] as any).data || [];
      const lowStockItems = inventoryItems.filter((i: any) =>
        i.min_quantity != null && i.quantity != null && i.quantity < i.min_quantity
      ).length;

      setOps({ openTasks, activeDeals, dealsPipelineValue, upcomingBookings, staffCount, openServiceRequests, lowStockItems });
      setLoading(false);
    }

    fetchKPI();
  }, [user, companyId]);

  const pctChange = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  const revChange = data ? pctChange(data.revenue, data.revenuePrev) : 0;
  const expChange = data ? pctChange(data.expenses, data.expensesPrev) : 0;

  const fmt = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return n.toLocaleString();
  };

  const visibleOpsCards = ROLE_OPS_CARDS[role] || ROLE_OPS_CARDS.general;

  const alertBadge = (count: number) =>
    count > 0 ? (
      <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4 leading-none">
        !{count}
      </Badge>
    ) : null;

  const opsCards: Record<OpsCardKey, { title: string; value: string; icon: any; iconColor: string; href: string; badge?: React.ReactNode }> = {
    tasks: {
      title: isRu ? 'Задачи' : 'Tasks',
      value: String(ops?.openTasks ?? 0),
      icon: ClipboardList,
      iconColor: 'text-primary',
      href: '/owner/tasks',
      badge: ops && ops.openTasks > 5 ? alertBadge(ops.openTasks) : undefined,
    },
    deals: {
      title: isRu ? 'Сделки' : 'Deals',
      value: ops ? `${ops.activeDeals} / ฿${fmt(ops.dealsPipelineValue)}` : '0',
      icon: Handshake,
      iconColor: 'text-accent-foreground',
      href: '/owner/sales',
    },
    bookings: {
      title: isRu ? 'Брони' : 'Bookings',
      value: String(ops?.upcomingBookings ?? 0),
      icon: BedDouble,
      iconColor: 'text-success',
      href: '/owner/bookings',
    },
    staff: {
      title: isRu ? 'Персонал' : 'Staff',
      value: String(ops?.staffCount ?? 0),
      icon: Users,
      iconColor: 'text-primary',
      href: '/owner/staff',
    },
    service: {
      title: isRu ? 'Заявки' : 'Requests',
      value: String(ops?.openServiceRequests ?? 0),
      icon: Wrench,
      iconColor: 'text-warning',
      href: '/owner/operations',
      badge: ops && ops.openServiceRequests > 3 ? alertBadge(ops.openServiceRequests) : undefined,
    },
    inventory: {
      title: isRu ? 'Склад' : 'Stock',
      value: ops?.lowStockItems ? `!${ops.lowStockItems}` : '✓',
      icon: PackageOpen,
      iconColor: ops?.lowStockItems ? 'text-destructive' : 'text-success',
      href: '/owner/inventory',
      badge: ops?.lowStockItems ? alertBadge(ops.lowStockItems) : undefined,
    },
  };

  return (
    <div className="space-y-3">
      {/* Tier 1: Financial KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <OwnerKPICard
          title={isRu ? 'Доход' : 'Revenue'}
          value={`฿${fmt(data?.revenue ?? 0)}`}
          icon={DollarSign}
          iconColor="text-success"
          change={revChange}
          trend={revChange >= 0 ? 'up' : 'down'}
          changeLabel={isRu ? 'vs прошлый месяц' : 'vs last month'}
          href="/owner/financials"
          loading={loading}
        />
        <OwnerKPICard
          title={isRu ? 'Расходы' : 'Expenses'}
          value={`฿${fmt(data?.expenses ?? 0)}`}
          icon={TrendingDown}
          iconColor="text-destructive"
          change={expChange}
          trend={expChange <= 0 ? 'up' : 'down'}
          changeLabel={isRu ? 'vs прошлый месяц' : 'vs last month'}
          href="/owner/financials"
          loading={loading}
        />
        <OwnerKPICard
          title={isRu ? 'Маржа' : 'Margin'}
          value={`${data?.margin ?? 0}%`}
          icon={Percent}
          iconColor="text-primary"
          trend={data && data.margin >= 30 ? 'up' : data && data.margin >= 0 ? 'neutral' : 'down'}
          href="/owner/financials"
          loading={loading}
        />
        <OwnerKPICard
          title={isRu ? 'Загрузка' : 'Occupancy'}
          value={`${data?.occupancyRate ?? 0}%`}
          icon={CalendarCheck}
          iconColor="text-accent-foreground"
          trend={data && data.occupancyRate >= 70 ? 'up' : data && data.occupancyRate >= 40 ? 'neutral' : 'down'}
          href="/owner/calendar"
          loading={loading}
        />
      </div>

      {/* Tier 2: Operational Metrics - horizontal scroll */}
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          {visibleOpsCards.map((key) => {
            const card = opsCards[key];
            return (
              <OwnerKPICard
                key={key}
                compact
                title={card.title}
                value={card.value}
                icon={card.icon}
                iconColor={card.iconColor}
                href={card.href}
                badge={card.badge}
                loading={loading}
              />
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
