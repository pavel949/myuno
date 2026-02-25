import { useLanguage } from '@/contexts/LanguageContext';
import { useSyncLogs, useSyncLogsByDay } from '@/hooks/useSyncLogs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Plus, 
  RefreshCw,
  Trash2,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';

interface SyncTimelineProps {
  propertyId?: string;
  calendarId?: string;
  limit?: number;
}

export function SyncTimeline({ propertyId, calendarId, limit = 20 }: SyncTimelineProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const locale = isRu ? ru : enUS;

  const { logs, isLoading } = useSyncLogs({ propertyId, calendarId, limit, days: 7 });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Clock className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p>{isRu ? 'Нет истории синхронизации' : 'No sync history'}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {logs.map((log, index) => (
        <Card key={log.id} className={cn(
          "transition-all",
          log.error && "border-destructive/20"
        )}>
          <CardContent className="p-3">
            <div className="flex items-start gap-3">
              {/* Status Icon */}
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                log.error 
                  ? "bg-destructive/10 text-destructive" 
                  : "bg-success/10 text-success"
              )}>
                {log.error ? (
                  <XCircle className="h-4 w-4" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">
                    {log.error 
                      ? (isRu ? 'Ошибка синхронизации' : 'Sync Failed')
                      : (isRu ? 'Синхронизация' : 'Sync Complete')}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {log.sync_type === 'scheduled' 
                      ? (isRu ? 'Авто' : 'Auto') 
                      : (isRu ? 'Ручная' : 'Manual')}
                  </Badge>
                </div>

                {!log.error && (
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {log.events_added > 0 && (
                      <span className="flex items-center gap-1 text-success">
                        <Plus className="h-3 w-3" />
                        {log.events_added}
                      </span>
                    )}
                    {log.events_updated > 0 && (
                      <span className="flex items-center gap-1 text-info">
                        <RefreshCw className="h-3 w-3" />
                        {log.events_updated}
                      </span>
                    )}
                    {log.events_removed > 0 && (
                      <span className="flex items-center gap-1 text-destructive">
                        <Trash2 className="h-3 w-3" />
                        {log.events_removed}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {log.events_found} {isRu ? 'найдено' : 'found'}
                    </span>
                  </div>
                )}

                {log.error && (
                  <p className="text-xs text-destructive truncate">
                    {log.error}
                  </p>
                )}
              </div>

              {/* Time */}
              <div className="text-xs text-muted-foreground shrink-0 text-right">
                <div>{formatDistanceToNow(new Date(log.synced_at), { addSuffix: true, locale })}</div>
                {log.sync_duration_ms && (
                  <div className="text-muted-foreground/60">
                    {(log.sync_duration_ms / 1000).toFixed(1)}s
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function SyncStatsChart({ propertyId }: { propertyId?: string }) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const { data: dailyStats, isLoading } = useSyncLogsByDay({ propertyId, days: 7 });

  if (isLoading || !dailyStats || dailyStats.length === 0) {
    return null;
  }

  const maxValue = Math.max(...dailyStats.map(d => d.eventsAdded + d.eventsUpdated));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          {isRu ? 'Активность за 7 дней' : '7-Day Activity'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-1 h-20">
          {dailyStats.map((day, index) => {
            const total = day.eventsAdded + day.eventsUpdated;
            const height = maxValue > 0 ? (total / maxValue) * 100 : 0;
            const date = new Date(day.date);
            
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col items-center">
                  <div 
                    className={cn(
                      "w-full rounded-t transition-all",
                      day.failed > 0 
                        ? "bg-destructive" 
                        : total > 0 
                          ? "bg-primary" 
                          : "bg-muted"
                    )}
                    style={{ height: `${Math.max(height, 4)}%`, minHeight: '4px' }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {format(date, 'EEE', { locale: isRu ? ru : enUS }).slice(0, 2)}
                </span>
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span>{isRu ? 'Добавлено/Обновлено' : 'Added/Updated'}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-destructive" />
            <span>{isRu ? 'Ошибки' : 'Errors'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
