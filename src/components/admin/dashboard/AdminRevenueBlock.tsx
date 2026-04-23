import { useNavigate } from 'react-router-dom';
import { APP_ROUTES } from '@/lib/config/routes';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminAnalytics } from '@/hooks/useAdminAnalytics';
import { Surface } from '@/components/ui/surface';
import { Skeleton } from '@/components/ui/skeleton';
import { SectionHeader } from '@/components/ds';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCurrencySymbol } from '@/lib/config/currencies';

export function AdminRevenueBlock() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { summary, isLoading } = useAdminAnalytics(14);

  const formatCurrency = (value: number) => {
    const symbol = getCurrencySymbol('THB');
    if (value >= 1000000) return `${symbol}${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${symbol}${(value / 1000).toFixed(0)}K`;
    return `${symbol}${value.toFixed(0)}`;
  };

  if (isLoading) {
    return (
      <Surface variant="card" padding="sm" radius="xl">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-4" />
        </div>
        <Skeleton className="h-10 w-32 mb-3" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      </Surface>
    );
  }

  const gmv = summary?.totalGMV || 0;
  const revenue = summary?.totalRevenue || 0;
  const growth = summary?.bookingGrowth || 0;

  return (
    <Surface 
      variant="card" 
      padding="sm" 
      radius="xl"
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => navigate(APP_ROUTES.ADMIN_FINANCE)}
    >
      {/* Header */}
      <SectionHeader
        title={isRu ? 'Финансы' : 'Finances'}
        icon={DollarSign}
        size="sm"
        action={{ label: isRu ? 'Подробнее' : 'Details', onClick: () => navigate(APP_ROUTES.ADMIN_FINANCE) }}
        className="mb-1"
      />

      {/* GMV */}
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-3xl font-bold">{formatCurrency(gmv)}</span>
        <span className="text-sm text-muted-foreground">GMV</span>
        {growth !== 0 && (
          <div className={cn(
            "flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-none",
            growth > 0 ? "text-success bg-success/10" : "text-destructive bg-destructive/10"
          )}>
            {growth > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(growth).toFixed(0)}%
          </div>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Surface variant="muted" padding="sm" radius="lg" bordered={false} className="text-center">
          <p className="text-lg font-semibold text-success">{formatCurrency(revenue)}</p>
          <p className="text-[10px] text-muted-foreground uppercase">
            {isRu ? 'Выручка' : 'Revenue'}
          </p>
        </Surface>
        <Surface variant="muted" padding="sm" radius="lg" bordered={false} className="text-center">
          <p className="text-lg font-semibold">{growth >= 0 ? '+' : ''}{growth.toFixed(0)}%</p>
          <p className="text-[10px] text-muted-foreground uppercase">
            {isRu ? 'Рост' : 'Growth'}
          </p>
        </Surface>
      </div>
    </Surface>
  );
}
