import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Lightbulb, AlertTriangle, TrendingUp } from 'lucide-react';
import { useWeeklySummary } from '@/hooks/useAIInsights';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export function AIWeeklySummary() {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const { data: summary, isLoading } = useWeeklySummary();
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }
  
  if (!summary) return null;
  
  const recommendationBadge = {
    keep: { variant: 'secondary' as const, label: isRussian ? 'Продолжать' : 'Keep' },
    adjust: { variant: 'destructive' as const, label: isRussian ? 'Настроить' : 'Adjust' },
    scale: { variant: 'default' as const, label: isRussian ? 'Масштабировать' : 'Scale' },
    insufficient_data: { variant: 'outline' as const, label: isRussian ? 'Мало данных' : 'Need Data' },
  };
  
  const badge = recommendationBadge[summary.recommendation];
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="w-5 h-5" />
            {isRussian ? 'Недельная сводка' : 'Weekly Summary'}
          </CardTitle>
          <Badge variant={badge.variant} className="text-xs">
            {badge.label}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{summary.dateRange}</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-none bg-muted/50">
            <div className="text-lg font-bold">{summary.totalAnalyzed}</div>
            <div className="text-[10px] text-muted-foreground">
              {isRussian ? 'Проанализировано' : 'Analyzed'}
            </div>
          </div>
          <div className="p-2 rounded-none bg-muted/50">
            <div className="text-lg font-bold">{summary.avgScore ?? '—'}</div>
            <div className="text-[10px] text-muted-foreground">
              {isRussian ? 'Ср. балл' : 'Avg Score'}
            </div>
          </div>
          <div className="p-2 rounded-none bg-muted/50">
            <div className="text-lg font-bold">{summary.suspiciousRate}%</div>
            <div className="text-[10px] text-muted-foreground">
              {isRussian ? 'Подозрит.' : 'Suspicious'}
            </div>
          </div>
        </div>
        
        {/* Top Issues */}
        {summary.topIssues.length > 0 && (
          <div className="space-y-1">
            <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {isRussian ? 'Топ проблем' : 'Top Issues'}
            </h4>
            <div className="flex flex-wrap gap-1">
              {summary.topIssues.map((issue, i) => (
                <Badge key={i} variant="outline" className="text-[10px]">
                  {issue}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* Insights */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Lightbulb className="w-3 h-3" />
            {isRussian ? 'Выводы' : 'Insights'}
          </h4>
          <ul className="space-y-1.5">
            {summary.insights.map((insight, i) => (
              <li key={i} className="text-xs text-foreground/80 flex items-start gap-2">
                <TrendingUp className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                {insight}
              </li>
            ))}
          </ul>
        </div>
        
        {/* Feedback Score */}
        {summary.feedbackScore !== null && (
          <div className="pt-2 border-t text-xs text-muted-foreground">
            {isRussian ? 'Оценка от админов:' : 'Admin feedback:'}{' '}
            <span className="font-medium text-foreground">{summary.feedbackScore}/5</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
