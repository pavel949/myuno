import { CalendarCheck, ClipboardList, Handshake, BedDouble, Users, Wrench, PackageOpen, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { OwnerKPICard } from '@/components/owner/OwnerKPICard';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { type BusinessRole } from '@/lib/businessRoles';
import { APP_ROUTES } from '@/lib/config/routes';

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
  const { data: metrics, isLoading: loading, isError } = useDashboardMetrics();
  const data = metrics?.kpi ?? null;
  const ops = metrics?.ops ?? null;

  const availableOps = isError ? null : ops;
  const bookedShare = isError ? null : data?.occupancyRate;

  const visibleOpsCards = ROLE_OPS_CARDS[role] || ROLE_OPS_CARDS.general;

  const alertBadge = (count: number) =>
    count > 0 ? (
      <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4 leading-none">
        !{count}
      </Badge>
    ) : null;

  const opsCards: Record<OpsCardKey, { title: string; value: string; icon: LucideIcon; iconColor: string; href: string; badge?: React.ReactNode }> = {
    tasks: {
      title: isRu ? 'Задачи' : 'Tasks',
      value: String(availableOps?.openTasks ?? '—'),
      icon: ClipboardList,
      iconColor: 'text-primary',
      href: APP_ROUTES.MC_TASKS,
      badge: availableOps && availableOps.openTasks > 5 ? alertBadge(availableOps.openTasks) : undefined,
    },
    deals: {
      title: isRu ? 'Сделки' : 'Deals',
      value: String(availableOps?.activeDeals ?? '—'),
      icon: Handshake,
      iconColor: 'text-accent-foreground',
      href: APP_ROUTES.MC_SALES,
    },
    bookings: {
      title: isRu ? 'Бронирования' : 'Bookings',
      value: String(availableOps?.upcomingBookings ?? '—'),
      icon: BedDouble,
      iconColor: 'text-success',
      href: APP_ROUTES.MC_CALENDAR,
    },
    staff: {
      title: isRu ? 'Персонал' : 'Staff',
      value: String(availableOps?.staffCount ?? '—'),
      icon: Users,
      iconColor: 'text-primary',
      href: APP_ROUTES.MC_STAFF,
    },
    service: {
      title: isRu ? 'Заявки' : 'Requests',
      value: String(availableOps?.openServiceRequests ?? '—'),
      icon: Wrench,
      iconColor: 'text-warning',
      href: APP_ROUTES.MC_TASKS,
      badge: availableOps && availableOps.openServiceRequests > 3 ? alertBadge(availableOps.openServiceRequests) : undefined,
    },
    inventory: {
      title: isRu ? 'Расходные материалы' : 'Stock',
      value: !availableOps ? '—' : availableOps.lowStockItems ? `!${availableOps.lowStockItems}` : '✓',
      icon: PackageOpen,
      iconColor: availableOps?.lowStockItems ? 'text-destructive' : 'text-success',
      href: APP_ROUTES.MC_INVENTORY,
      badge: availableOps?.lowStockItems ? alertBadge(availableOps.lowStockItems) : undefined,
    },
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1 border bg-card p-4">
          <h3 className="text-sm font-semibold">{isRu ? 'Фактические финансы' : 'Actual financial results'}</h3>
          <p className="text-sm text-muted-foreground">{isRu ? 'Не сверено' : 'Not reconciled'}</p>
          <Link to={APP_ROUTES.MC_FINANCE} className="inline-block text-sm font-medium text-primary underline">
            {isRu ? 'Открыть финансы' : 'Open finance'}
          </Link>
        </div>
        <OwnerKPICard
          title={isRu ? 'Ночи забронированы в этом месяце' : 'Share of nights booked this month'}
          value={bookedShare == null ? '—' : `${bookedShare}%`}
          icon={CalendarCheck}
          iconColor="text-accent-foreground"
          href={APP_ROUTES.MC_CALENDAR}
          loading={loading}
        />
      </div>
      {isError && <p role="alert" className="text-sm text-muted-foreground">
        {isRu ? 'Не удалось загрузить рабочие показатели.' : 'Could not load operational metrics.'}
      </p>}

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
