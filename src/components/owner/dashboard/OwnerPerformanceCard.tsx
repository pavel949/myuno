import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSuperhostStatus } from '@/hooks/useSuperhostStatus';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Star, 
  MessageSquare, 
  CheckCircle2, 
  XCircle,
  ChevronRight,
  Award,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function OwnerPerformanceCard() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { metrics, progress, isSuperhost, isLoading } = useSuperhostStatus();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-24 rounded-none" />
      </div>
    );
  }

  // If no metrics yet, show a call-to-action
  if (!metrics) {
    return (
      <div className="space-y-3">
        <h2 className="font-semibold text-base">
          {isRu ? 'Эффективность' : 'Performance'}
        </h2>
        
        <Card className="p-4 border-dashed border-2 border-muted-foreground/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-primary/10">
              <Award className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">
                {isRu ? 'Станьте Суперхозяином' : 'Become a Superhost'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isRu 
                  ? 'Получите первое бронирование для начала' 
                  : 'Get your first booking to start tracking'}
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const metricsDisplay = [
    {
      icon: Star,
      label: isRu ? 'Рейтинг' : 'Rating',
      value: progress?.rating.current.toFixed(1) || '0.0',
      target: progress?.rating.required || 4.8,
      met: progress?.rating.met || false,
      color: 'text-warning',
    },
    {
      icon: MessageSquare,
      label: isRu ? 'Ответы' : 'Response',
      value: `${Math.round(progress?.responseRate.current || 0)}%`,
      target: `${progress?.responseRate.required}%`,
      met: progress?.responseRate.met || false,
      color: 'text-info',
    },
    {
      icon: CheckCircle2,
      label: isRu ? 'Брони' : 'Bookings',
      value: progress?.bookings.current || 0,
      target: progress?.bookings.required || 10,
      met: progress?.bookings.met || false,
      color: 'text-success',
    },
    {
      icon: XCircle,
      label: isRu ? 'Отмены' : 'Cancellations',
      value: `${(progress?.cancellationRate.current || 0).toFixed(1)}%`,
      target: `<${progress?.cancellationRate.required}%`,
      met: progress?.cancellationRate.met || false,
      color: 'text-destructive',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-base">
            {isRu ? 'Эффективность' : 'Performance'}
          </h2>
          {isSuperhost && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-warning/10 text-warning">
              {isRu ? 'Суперхозяин' : 'Superhost'}
            </span>
          )}
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate('/owner/superhost')}>
          {isRu ? 'Подробнее' : 'Details'}
          <ChevronRight className="h-3 w-3 ml-1" />
        </Button>
      </div>

      {/* Progress towards Superhost */}
      {!isSuperhost && progress && (
        <Card className="p-3 bg-warning/5 border-warning/20">
          <div className="flex items-center gap-3 mb-2">
            <Award className="h-4 w-4 text-warning" />
            <span className="text-sm font-medium">
              {isRu ? 'Путь к Суперхозяину' : 'Superhost Progress'}
            </span>
            <span className="text-xs text-muted-foreground ml-auto">
              {progress.requirementsMet}/{progress.totalRequirements}
            </span>
          </div>
          <Progress value={progress.overallProgress} className="h-2" />
        </Card>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-2">
        {metricsDisplay.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card 
              key={metric.label}
              className={cn(
                "p-3",
                metric.met && "border-success/30 bg-success/5"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={cn("h-4 w-4", metric.color)} />
                <span className="text-xs text-muted-foreground">{metric.label}</span>
                {metric.met && <CheckCircle2 className="h-3 w-3 text-success ml-auto" />}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold">{metric.value}</span>
                <span className="text-xs text-muted-foreground">/ {metric.target}</span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Response time if available */}
      {metrics.avg_response_time_minutes !== null && (
        <Card className="p-3 flex items-center gap-3">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <div>
            <span className="text-sm font-medium">
              {metrics.avg_response_time_minutes < 60 
                ? `${Math.round(metrics.avg_response_time_minutes)} ${isRu ? 'мин' : 'min'}`
                : `${Math.round(metrics.avg_response_time_minutes / 60)} ${isRu ? 'ч' : 'h'}`
              }
            </span>
            <span className="text-xs text-muted-foreground ml-2">
              {isRu ? 'среднее время ответа' : 'avg response time'}
            </span>
          </div>
        </Card>
      )}
    </div>
  );
}
