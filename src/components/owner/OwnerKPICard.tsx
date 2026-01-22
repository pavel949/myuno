import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface OwnerKPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: 'up' | 'down' | 'neutral';
  href?: string;
  loading?: boolean;
  badge?: React.ReactNode;
}

export function OwnerKPICard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  iconColor = 'text-primary',
  trend,
  href,
  loading = false,
  badge,
}: OwnerKPICardProps) {
  const navigate = useNavigate();

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColorClass = trend === 'up' 
    ? 'text-success' 
    : trend === 'down' 
      ? 'text-destructive' 
      : 'text-muted-foreground';

  const handleClick = () => {
    if (href) {
      navigate(href);
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-16 bg-muted rounded" />
              <div className="h-6 w-12 bg-muted rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        "transition-all duration-200",
        href && "cursor-pointer hover:shadow-md hover:border-primary/30"
      )}
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2.5 rounded-xl bg-muted/80",
            iconColor.replace('text-', 'bg-').replace(/(\w+)$/, '$1/10')
          )}>
            <Icon className={cn("h-5 w-5", iconColor)} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground truncate">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-xl font-bold">{value}</p>
              {badge}
            </div>
          </div>
          {typeof change === 'number' && (
            <div className={cn("flex items-center gap-0.5 text-xs font-medium", trendColorClass)}>
              <TrendIcon className="h-3 w-3" />
              <span>{change > 0 ? '+' : ''}{change}%</span>
            </div>
          )}
        </div>
        {changeLabel && (
          <p className="text-xs text-muted-foreground mt-2 pl-12">{changeLabel}</p>
        )}
      </CardContent>
    </Card>
  );
}
