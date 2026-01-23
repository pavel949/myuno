import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminDashboardStats } from '@/hooks/useAdminDashboardStats';
import { useAdminAnalytics } from '@/hooks/useAdminAnalytics';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Building2, ShoppingCart, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  color: string;
  onClick?: () => void;
}

function KPICard({ title, value, change, icon: Icon, color, onClick }: KPICardProps) {
  const hasGrowth = change !== undefined && change !== 0;
  const isPositive = (change || 0) > 0;

  return (
    <Card 
      className={cn(
        "p-4 transition-all hover:shadow-md",
        onClick && "cursor-pointer hover:bg-muted/30"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold">{value}</p>
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
    </Card>
  );
}

export function AdminKPIGrid() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: stats, isLoading: statsLoading } = useAdminDashboardStats();
  const { summary, isLoading: analyticsLoading } = useAdminAnalytics(30);

  const isLoading = statsLoading || analyticsLoading;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-3 w-12" />
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `฿${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `฿${(value / 1000).toFixed(0)}K`;
    return `฿${value.toFixed(0)}`;
  };

  const kpis = [
    {
      title: isRu ? 'Пользователи' : 'Users',
      value: stats?.totalUsers || 0,
      change: summary?.userGrowth,
      icon: Users,
      color: 'bg-info',
    },
    {
      title: isRu ? 'Провайдеры' : 'Providers',
      value: stats?.providers || 0,
      change: summary?.providerGrowth,
      icon: Building2,
      color: 'bg-success',
    },
    {
      title: isRu ? 'Заказы' : 'Bookings',
      value: stats?.totalBookings || 0,
      change: summary?.bookingGrowth,
      icon: ShoppingCart,
      color: 'bg-warning',
    },
    {
      title: 'GMV',
      value: formatCurrency(summary?.totalGMV || 0),
      change: summary?.revenueGrowth,
      icon: DollarSign,
      color: 'bg-primary',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {kpis.map((kpi) => (
        <KPICard key={kpi.title} {...kpi} />
      ))}
    </div>
  );
}
