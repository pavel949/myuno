import React from 'react';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface AdminKPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: 'up' | 'down' | 'neutral';
  sparklineData?: number[];
  href?: string;
  loading?: boolean;
}

export function AdminKPICard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  iconColor = 'text-primary',
  trend = 'neutral',
  sparklineData,
  href,
  loading = false,
}: AdminKPICardProps) {
  const navigate = useNavigate();

  // Simple sparkline using SVG
  const renderSparkline = () => {
    if (!sparklineData || sparklineData.length < 2) return null;
    
    const max = Math.max(...sparklineData);
    const min = Math.min(...sparklineData);
    const range = max - min || 1;
    const width = 80;
    const height = 24;
    const padding = 2;
    
    const points = sparklineData.map((value, index) => {
      const x = (index / (sparklineData.length - 1)) * (width - padding * 2) + padding;
      const y = height - ((value - min) / range) * (height - padding * 2) - padding;
      return `${x},${y}`;
    }).join(' ');

    const trendColor = trend === 'up' ? '#22c55e' : trend === 'down' ? '#ef4444' : '#a1a1aa';
    
    return (
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        className="w-20 h-6"
        preserveAspectRatio="none"
      >
        <polyline
          fill="none"
          stroke={trendColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        {/* Gradient fill under the line */}
        <defs>
          <linearGradient id={`gradient-${title}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={trendColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={trendColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          fill={`url(#gradient-${title})`}
          points={`${padding},${height} ${points} ${width - padding},${height}`}
        />
      </svg>
    );
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColorClass = trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground';

  const handleClick = () => {
    if (href) navigate(href);
  };

  if (loading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-20 bg-muted rounded" />
              <div className="h-8 w-8 bg-muted rounded-lg" />
            </div>
            <div className="h-8 w-24 bg-muted rounded" />
            <div className="h-3 w-16 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all duration-200 group",
        href && "cursor-pointer hover:shadow-md hover:border-primary/20"
      )}
      onClick={handleClick}
    >
      <CardContent className="p-4 lg:p-3">
        {/* Header row */}
        <div className="flex items-start justify-between mb-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg bg-muted/50 transition-colors",
            href && "group-hover:bg-primary/10"
          )}>
            <Icon className={cn("h-4 w-4", iconColor)} />
          </div>
        </div>

        {/* Value */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl lg:text-xl font-bold tracking-tight">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            
            {/* Change indicator */}
            {change !== undefined && (
              <div className={cn("flex items-center gap-1 mt-1", trendColorClass)}>
                <TrendIcon className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">
                  {change > 0 ? '+' : ''}{change.toFixed(1)}%
                </span>
                {changeLabel && (
                  <span className="text-xs text-muted-foreground ml-1">
                    {changeLabel}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Sparkline */}
          {sparklineData && sparklineData.length > 0 && (
            <div className="opacity-60 group-hover:opacity-100 transition-opacity">
              {renderSparkline()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
