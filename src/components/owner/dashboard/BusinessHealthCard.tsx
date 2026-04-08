import { useLanguage } from '@/contexts/LanguageContext';
import { useBusinessHealthScore, type HealthPillar } from '@/hooks/useBusinessHealthScore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';

function PillarBar({ pillar, isRu }: { pillar: HealthPillar; isRu: boolean }) {
  const colors = {
    good: 'bg-success',
    warning: 'bg-warning',
    critical: 'bg-destructive',
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {isRu ? pillar.labelRu : pillar.labelEn}
        </span>
        <span className="text-xs font-medium">{pillar.score}/20</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', colors[pillar.status])}
          style={{ width: `${Math.min(100, pillar.percent)}%` }}
        />
      </div>
    </div>
  );
}

export function BusinessHealthCard() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { score, pillars, isLoading, urgentCount, onTrackCount } = useBusinessHealthScore();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-3 w-full" />
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const scoreColor = score >= 70 ? 'text-success' : score >= 40 ? 'text-warning' : 'text-destructive';
  const progressColor = score >= 70 ? '[&>div]:bg-success' : score >= 40 ? '[&>div]:bg-warning' : '[&>div]:bg-destructive';

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-4">
        {/* Score header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-sm">
              {isRu ? 'Здоровье бизнеса' : 'Business Health'}
            </h3>
          </div>
          <span className={cn('text-2xl font-bold tabular-nums', scoreColor)}>
            {score}<span className="text-sm font-normal text-muted-foreground">/100</span>
          </span>
        </div>

        {/* Progress bar */}
        <Progress value={score} className={cn('h-2', progressColor)} />

        {/* Status badges */}
        <div className="flex items-center gap-2">
          {urgentCount > 0 && (
            <Badge variant="destructive" className="text-xs gap-1">
              <AlertTriangle className="h-3 w-3" />
              {urgentCount} {isRu ? 'срочных' : 'urgent'}
            </Badge>
          )}
          {onTrackCount > 0 && (
            <Badge variant="secondary" className="text-xs gap-1 bg-success/10 text-success">
              <CheckCircle2 className="h-3 w-3" />
              {onTrackCount} {isRu ? 'в норме' : 'on track'}
            </Badge>
          )}
        </div>

        {/* Pillar breakdown */}
        <div className="space-y-2.5">
          {pillars.map((pillar) => (
            <PillarBar key={pillar.key} pillar={pillar} isRu={isRu} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
