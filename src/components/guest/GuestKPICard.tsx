import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface GuestKPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: 'up' | 'down' | 'neutral';
  href?: string;
  loading?: boolean;
  onClick?: () => void;
}

export function GuestKPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-primary',
  trend,
  href,
  loading = false,
  onClick,
}: GuestKPICardProps) {
  const navigate = useNavigate();

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColorClass = trend === 'up' 
    ? 'text-success' 
    : trend === 'down' 
      ? 'text-destructive' 
      : 'text-muted-foreground';

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
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
        (href || onClick) && "cursor-pointer hover:shadow-md hover:border-primary/30"
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
              {trend && (
                <TrendIcon className={cn("h-3 w-3", trendColorClass)} />
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
