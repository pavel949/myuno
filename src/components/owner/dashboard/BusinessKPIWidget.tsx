import { DollarSign, TrendingDown, Percent, CalendarCheck, ClipboardList, Handshake, BedDouble, Users, Wrench, PackageOpen, BarChart3, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { OwnerKPICard } from '@/components/owner/OwnerKPICard';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { type BusinessRole } from '@/lib/businessRoles';

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
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: metrics, isLoading: loading } = useDashboardMetrics();
  const data = metrics?.kpi ?? null;
  const ops = metrics?.ops ?? null;

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
      href: '/mc/operations',
      badge: ops && ops.openTasks > 5 ? alertBadge(ops.openTasks) : undefined,
    },
    deals: {
      title: isRu ? 'Сделки' : 'Deals',
      value: ops ? `${ops.activeDeals} / ฿${fmt(ops.dealsPipelineValue)}` : '0',
      icon: Handshake,
      iconColor: 'text-accent-foreground',
      href: '/mc/sales',
    },
    bookings: {
      title: isRu ? 'Брони' : 'Bookings',
      value: String(ops?.upcomingBookings ?? 0),
      icon: BedDouble,
      iconColor: 'text-success',
      href: '/mc/calendar',
    },
    staff: {
      title: isRu ? 'Персонал' : 'Staff',
      value: String(ops?.staffCount ?? 0),
      icon: Users,
      iconColor: 'text-primary',
      href: '/mc/staff',
    },
    service: {
      title: isRu ? 'Заявки' : 'Requests',
      value: String(ops?.openServiceRequests ?? 0),
      icon: Wrench,
      iconColor: 'text-warning',
      href: '/mc/operations',
      badge: ops && ops.openServiceRequests > 3 ? alertBadge(ops.openServiceRequests) : undefined,
    },
    inventory: {
      title: isRu ? 'Склад' : 'Stock',
      value: ops?.lowStockItems ? `!${ops.lowStockItems}` : '✓',
      icon: PackageOpen,
      iconColor: ops?.lowStockItems ? 'text-destructive' : 'text-success',
      href: '/mc/inventory',
      badge: ops?.lowStockItems ? alertBadge(ops.lowStockItems) : undefined,
    },
  };

  return (
    <div className="space-y-3">
      {/* Tier 1: Financial KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <OwnerKPICard
          title={isRu ? 'Доход' : 'Revenue'}
          value={`฿${fmt(data?.revenue ?? 0)}`}
          icon={DollarSign}
          iconColor="text-success"
          change={revChange}
          trend={revChange >= 0 ? 'up' : 'down'}
          changeLabel={isRu ? 'vs прошлый месяц' : 'vs last month'}
          href="/mc/financials"
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
          href="/mc/financials"
          loading={loading}
        />
        <OwnerKPICard
          title={isRu ? 'Маржа' : 'Margin'}
          value={`${data?.margin ?? 0}%`}
          icon={Percent}
          iconColor="text-primary"
          trend={data && data.margin >= 30 ? 'up' : data && data.margin >= 0 ? 'neutral' : 'down'}
          href="/mc/financials"
          loading={loading}
        />
        <OwnerKPICard
          title={isRu ? 'Загрузка' : 'Occupancy'}
          value={`${data?.occupancyRate ?? 0}%`}
          icon={CalendarCheck}
          iconColor="text-accent-foreground"
          trend={data && data.occupancyRate >= 70 ? 'up' : data && data.occupancyRate >= 40 ? 'neutral' : 'down'}
          href="/mc/calendar"
          loading={loading}
        />
        <OwnerKPICard
          title="ADR"
          value={`฿${fmt(data?.adr ?? 0)}`}
          icon={BarChart3}
          iconColor="text-primary"
          trend={data && data.adr > 0 ? 'up' : 'neutral'}
          href="/owner/analytics"
          loading={loading}
        />
        <OwnerKPICard
          title="RevPAR"
          value={`฿${fmt(data?.revpar ?? 0)}`}
          icon={TrendingUp}
          iconColor="text-accent-foreground"
          trend={data && data.revpar > 0 ? 'up' : 'neutral'}
          href="/owner/analytics"
          loading={loading}
        />
      </div>

      {/* Tier 2: Operational Metrics */}
      <ScrollArea className="w-full md:hidden">
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
      <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
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
    </div>
  );
}
