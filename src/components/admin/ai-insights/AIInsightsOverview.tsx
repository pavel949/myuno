import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle, 
  CheckCircle2,
  BarChart3,
  Eye,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { useAIInsights, type AIInsightMetrics } from '@/hooks/useAIInsights';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface TrendIndicatorProps {
  direction: 'up' | 'down' | 'stable';
  value?: number;
  goodDirection?: 'up' | 'down';
}

function TrendIndicator({ direction, value, goodDirection = 'up' }: TrendIndicatorProps) {
  const isGood = direction === goodDirection || direction === 'stable';
  
  const Icon = direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : Minus;
  
  return (
    <div className={cn(
      "flex items-center gap-1 text-xs font-medium",
      isGood ? "text-success" : "text-warning"
    )}>
      <Icon className="w-3 h-3" />
      {value !== undefined && <span>{value > 0 ? '+' : ''}{value}%</span>}
    </div>
  );
}

function MetricCard({ 
  title, 
  value, 
  subtitle,
  icon: Icon,
  trend,
  className 
}: { 
  title: string; 
  value: string | number; 
  subtitle?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'stable';
  className?: string;
}) {
  return (
    <div className={cn("flex items-start gap-3 p-4 rounded-xl bg-muted/50", className)}>
      <div className="p-2 rounded-lg bg-primary/10">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">{value}</span>
          {trend && <TrendIndicator direction={trend} />}
        </div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

export function AIInsightsOverview() {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const { data: metrics, isLoading } = useAIInsights('14d');
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }
  
  if (!metrics?.dataAvailable) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="w-5 h-5" />
            {isRussian ? 'AI Аналитика качества' : 'AI Quality Analytics'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="font-medium">
              {isRussian ? 'Нет данных' : 'No Data Available'}
            </p>
            <p className="text-sm mt-1">
              {isRussian 
                ? 'AI-анализ ещё не запускался на листингах' 
                : 'AI analysis has not been run on listings yet'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="w-5 h-5" />
            {isRussian ? 'AI Аналитика качества' : 'AI Quality Analytics'}
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {isRussian ? 'Последние 14 дней' : 'Last 14 days'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Main Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard
            icon={BarChart3}
            title={isRussian ? 'Средний балл' : 'Avg Score'}
            value={metrics.avgScore !== null ? `${Math.round(metrics.avgScore)}` : '—'}
            subtitle="/100"
            trend="stable"
          />
          <MetricCard
            icon={AlertTriangle}
            title={isRussian ? 'Подозрительные' : 'Suspicious'}
            value={`${Math.round(metrics.suspiciousPercent)}%`}
            subtitle={`${metrics.suspiciousCount} ${isRussian ? 'из' : 'of'} ${metrics.totalArtifacts}`}
            trend={metrics.suspiciousPercent > 20 ? 'up' : 'stable'}
          />
          <MetricCard
            icon={Eye}
            title={isRussian ? 'Проверено' : 'Reviewed'}
            value={`${Math.round(metrics.reviewedPercent)}%`}
            subtitle={`${metrics.reviewedCount} ${isRussian ? 'листингов' : 'listings'}`}
            trend="stable"
          />
          <MetricCard
            icon={CheckCircle2}
            title={isRussian ? 'Принято' : 'Acknowledged'}
            value={`${Math.round(metrics.acknowledgeRatio * 100)}%`}
            subtitle={`${metrics.acknowledgedCount} vs ${metrics.dismissedCount}`}
            trend={metrics.acknowledgeRatio > 0.6 ? 'up' : 'stable'}
          />
        </div>
        
        {/* Top Issues */}
        {metrics.topIssues.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              {isRussian ? 'Частые проблемы' : 'Top Issues This Week'}
            </h4>
            <div className="flex flex-wrap gap-2">
              {metrics.topIssues.slice(0, 3).map((issue) => (
                <Badge key={issue.code} variant="secondary" className="text-xs">
                  {issue.label} ({issue.count})
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* Score Distribution */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            {isRussian ? 'Распределение качества' : 'Quality Distribution'}
          </h4>
          <div className="flex gap-1 h-8 rounded-lg overflow-hidden">
            {metrics.scoreDistribution.excellent > 0 && (
              <div 
                className="bg-emerald-500 flex items-center justify-center text-white text-xs font-medium"
                style={{ width: `${(metrics.scoreDistribution.excellent / metrics.totalArtifacts) * 100}%` }}
                title={isRussian ? 'Отлично (80-100)' : 'Excellent (80-100)'}
              >
                {metrics.scoreDistribution.excellent}
              </div>
            )}
            {metrics.scoreDistribution.good > 0 && (
              <div 
                className="bg-blue-500 flex items-center justify-center text-white text-xs font-medium"
                style={{ width: `${(metrics.scoreDistribution.good / metrics.totalArtifacts) * 100}%` }}
                title={isRussian ? 'Хорошо (60-79)' : 'Good (60-79)'}
              >
                {metrics.scoreDistribution.good}
              </div>
            )}
            {metrics.scoreDistribution.fair > 0 && (
              <div 
                className="bg-amber-500 flex items-center justify-center text-white text-xs font-medium"
                style={{ width: `${(metrics.scoreDistribution.fair / metrics.totalArtifacts) * 100}%` }}
                title={isRussian ? 'Средне (40-59)' : 'Fair (40-59)'}
              >
                {metrics.scoreDistribution.fair}
              </div>
            )}
            {metrics.scoreDistribution.poor > 0 && (
              <div 
                className="bg-red-500 flex items-center justify-center text-white text-xs font-medium"
                style={{ width: `${(metrics.scoreDistribution.poor / metrics.totalArtifacts) * 100}%` }}
                title={isRussian ? 'Плохо (0-39)' : 'Poor (0-39)'}
              >
                {metrics.scoreDistribution.poor}
              </div>
            )}
            {metrics.totalArtifacts === 0 && (
              <div className="flex-1 bg-muted flex items-center justify-center text-xs text-muted-foreground">
                {isRussian ? 'Нет данных' : 'No data'}
              </div>
            )}
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {isRussian ? 'Отлично' : 'Excellent'}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              {isRussian ? 'Хорошо' : 'Good'}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              {isRussian ? 'Средне' : 'Fair'}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              {isRussian ? 'Плохо' : 'Poor'}
            </span>
          </div>
        </div>
        
        {/* Feedback Loop */}
        {(metrics.falsePositives > 0 || metrics.missedIssues > 0) && (
          <div className="flex gap-4 pt-2 border-t">
            <div className="flex items-center gap-2 text-sm">
              <ThumbsDown className="w-4 h-4 text-warning" />
              <span className="text-muted-foreground">
                {isRussian ? 'Ложные срабатывания:' : 'False positives:'}
              </span>
              <span className="font-medium">{metrics.falsePositives}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <ThumbsUp className="w-4 h-4 text-destructive" />
              <span className="text-muted-foreground">
                {isRussian ? 'Пропущенные:' : 'Missed issues:'}
              </span>
              <span className="font-medium">{metrics.missedIssues}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
