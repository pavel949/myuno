import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminDashboardStats } from '@/hooks/useAdminDashboardStats';
import { useAdminAnalytics } from '@/hooks/useAdminAnalytics';
import { Surface } from '@/components/ui/surface';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, UserPlus, Package, DollarSign, AlertCircle, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCurrencySymbol } from '@/lib/config/currencies';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  color: string;
  onClick?: () => void;
}

const KPICard = React.forwardRef<HTMLDivElement, KPICardProps>(
  ({ title, value, change, icon: Icon, color, onClick }, ref) => {
    const hasGrowth = change !== undefined && change !== 0;
    const isPositive = (change || 0) > 0;

    return (
      <Surface
        ref={ref}
        variant="card"
        padding="md"
        radius="xl"
        className={cn(
          "lg:p-3 transition-all group",
          onClick && "cursor-pointer hover:bg-muted/30"
        )}
        onClick={onClick}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              {title}
            </p>
            <p className="text-2xl lg:text-xl font-bold">{value}</p>
            {hasGrowth && (
              <div className={cn(
                "flex items-center gap-1 mt-1 text-xs font-medium",
                isPositive ? "text-success" : "text-destructive"
              )}>
                {isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{isPositive ? '+' : ''}{change?.toFixed(1)}%</span>
              </div>
            )}
          </div>
          <div className={cn("p-2 rounded-lg", color)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </Surface>
    );
  }
);
KPICard.displayName = 'KPICard';

export function AdminKPIGrid() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const { data: stats, isLoading: statsLoading } = useAdminDashboardStats();
  const { summary, isLoading: analyticsLoading } = useAdminAnalytics(30);

  const isLoading = statsLoading || analyticsLoading;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Surface key={i} variant="card" padding="md" radius="xl">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-3 w-12" />
          </Surface>
        ))}
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    const symbol = getCurrencySymbol('THB');
    if (value >= 1000000) return `${symbol}${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${symbol}${(value / 1000).toFixed(0)}K`;
    return `${symbol}${value.toFixed(0)}`;
  };

  // Count active listings from stats
  const activeListings = (stats?.properties || 0) + (stats?.yachts || 0) + (stats?.tours || 0) + 
    (stats?.restaurants || 0) + (stats?.salons || 0) + (stats?.clinics || 0) + (stats?.gyms || 0) +
    (stats?.events || 0) + (stats?.vehicles || 0);

  const pendingApprovals = (stats?.pendingContent || 0);

  const kpis = [
    {
      title: isRu ? 'Пользователи' : 'Active Users',
      value: stats?.totalUsers || 0,
      change: summary?.userGrowth,
      icon: Users,
      color: 'bg-info',
    },
    {
      title: isRu ? 'Провайдеры' : 'Providers',
      value: stats?.providers || 0,
      change: summary?.providerGrowth,
      icon: UserPlus,
      color: 'bg-success',
    },
    {
      title: isRu ? 'Листинги' : 'Active Listings',
      value: activeListings,
      icon: Package,
      color: 'bg-primary',
    },
    {
      title: isRu ? 'Доход' : 'Revenue',
      value: formatCurrency(summary?.totalGMV || 0),
      change: summary?.revenueGrowth,
      icon: DollarSign,
      color: 'bg-warning',
    },
    {
      title: isRu ? 'На модерации' : 'Pending',
      value: pendingApprovals,
      icon: AlertCircle,
      color: pendingApprovals > 0 ? 'bg-destructive' : 'bg-muted-foreground',
      onClick: pendingApprovals > 0 ? () => navigate('/admin/catalog?status=pending') : undefined,
    },
    {
      title: isRu ? 'Здоровье' : 'System Health',
      value: '✓',
      icon: Activity,
      color: 'bg-success',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 lg:gap-2">
      {kpis.map((kpi) => (
        <KPICard key={kpi.title} {...kpi} />
      ))}
    </div>
  );
}
