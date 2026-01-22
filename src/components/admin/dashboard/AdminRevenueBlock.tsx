import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminAnalytics } from '@/hooks/useAdminAnalytics';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, DollarSign, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AdminRevenueBlock() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { summary, isLoading } = useAdminAnalytics(14);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `฿${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `฿${(value / 1000).toFixed(0)}K`;
    return `฿${value.toFixed(0)}`;
  };

  if (isLoading) {
    return (
      <Card className="p-3">
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
      </Card>
    );
  }

  const gmv = summary?.totalGMV || 0;
  const revenue = summary?.totalRevenue || 0;
  const growth = summary?.bookingGrowth || 0;

  return (
    <Card 
      className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => navigate('/admin/finance')}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {isRu ? 'Финансы' : 'Finances'}
          </span>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* GMV */}
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-3xl font-bold">{formatCurrency(gmv)}</span>
        <span className="text-sm text-muted-foreground">GMV</span>
        {growth !== 0 && (
          <div className={cn(
            "flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded",
            growth > 0 ? "text-success bg-success/10" : "text-destructive bg-destructive/10"
          )}>
            {growth > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(growth).toFixed(0)}%
          </div>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center p-2 rounded-lg bg-muted/50">
          <p className="text-lg font-semibold text-success">{formatCurrency(revenue)}</p>
          <p className="text-[10px] text-muted-foreground uppercase">
            {isRu ? 'Выручка' : 'Revenue'}
          </p>
        </div>
        <div className="text-center p-2 rounded-lg bg-muted/50">
          <p className="text-lg font-semibold">{growth >= 0 ? '+' : ''}{growth.toFixed(0)}%</p>
          <p className="text-[10px] text-muted-foreground uppercase">
            {isRu ? 'Рост' : 'Growth'}
          </p>
        </div>
      </div>
    </Card>
  );
}
