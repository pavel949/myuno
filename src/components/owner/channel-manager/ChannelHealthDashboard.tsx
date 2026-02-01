import { useLanguage } from '@/contexts/LanguageContext';
import { useChannelHealth, useAllBookingConflicts } from '@/hooks/useChannelHealth';
import { useSyncLogs } from '@/hooks/useSyncLogs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock,
  RefreshCw,
  Calendar,
  AlertCircle,
  Settings2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';

const CHANNEL_ICONS: Record<string, string> = {
  airbnb: '🏠',
  booking: '🅱️',
  vrbo: '🏡',
  expedia: '✈️',
  google: '📅',
  other: '📆',
};

const CHANNEL_COLORS: Record<string, string> = {
  airbnb: 'bg-rose-100 dark:bg-rose-900/30',
  booking: 'bg-blue-100 dark:bg-blue-900/30',
  vrbo: 'bg-cyan-100 dark:bg-cyan-900/30',
  expedia: 'bg-yellow-100 dark:bg-yellow-900/30',
  google: 'bg-emerald-100 dark:bg-emerald-900/30',
  other: 'bg-slate-100 dark:bg-slate-900/30',
};

export function ChannelHealthDashboard() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const locale = isRu ? ru : enUS;

  const { channels, stats, isLoading, updateChannel } = useChannelHealth();
  const { count: conflictCount } = useAllBookingConflicts().data || { count: 0 };
  const { stats: syncStats } = useSyncLogs({ days: 1 });
  
  const [syncing, setSyncing] = useState<string | null>(null);

  const handleSyncChannel = async (calendarId: string) => {
    setSyncing(calendarId);
    try {
      const { error } = await supabase.functions.invoke('ical-sync', {
        body: { calendar_ids: [calendarId] },
      });
      if (error) throw error;
      toast.success(isRu ? 'Канал синхронизирован' : 'Channel synced');
    } catch (err) {
      toast.error(isRu ? 'Ошибка синхронизации' : 'Sync failed');
    } finally {
      setSyncing(null);
    }
  };

  const handleToggleAutoSync = async (id: string, currentValue: boolean) => {
    try {
      await updateChannel({ id, autoSync: !currentValue });
      toast.success(isRu ? 'Настройки обновлены' : 'Settings updated');
    } catch (err) {
      toast.error(isRu ? 'Ошибка обновления' : 'Update failed');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label={isRu ? 'Здоровые' : 'Healthy'}
          value={stats?.healthy || 0}
          color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"
        />
        <SummaryCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label={isRu ? 'Внимание' : 'Warning'}
          value={stats?.warning || 0}
          color={stats?.warning ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600" : "bg-muted text-muted-foreground"}
        />
        <SummaryCard
          icon={<XCircle className="h-5 w-5" />}
          label={isRu ? 'Ошибки' : 'Errors'}
          value={stats?.error || 0}
          color={stats?.error ? "bg-red-100 dark:bg-red-900/30 text-red-600" : "bg-muted text-muted-foreground"}
        />
        <SummaryCard
          icon={<AlertCircle className="h-5 w-5" />}
          label={isRu ? 'Конфликты' : 'Conflicts'}
          value={conflictCount}
          color={conflictCount > 0 ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600" : "bg-muted text-muted-foreground"}
        />
      </div>

      {/* Sync Activity (last 24h) */}
      {syncStats && syncStats.totalSyncs > 0 && (
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">
                {isRu ? 'Активность за 24ч' : 'Last 24h Activity'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{syncStats.totalSyncs}</div>
                <div className="text-xs text-muted-foreground">{isRu ? 'Синхр.' : 'Syncs'}</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-600">{syncStats.totalEventsAdded}</div>
                <div className="text-xs text-muted-foreground">{isRu ? 'Добавлено' : 'Added'}</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{syncStats.totalEventsUpdated}</div>
                <div className="text-xs text-muted-foreground">{isRu ? 'Обновлено' : 'Updated'}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Channel List */}
      <div className="space-y-2">
        {channels?.map(channel => (
          <Card key={channel.id} className={cn(
            "transition-all",
            channel.status === 'error' && "border-red-300 dark:border-red-800",
            channel.status === 'warning' && "border-amber-300 dark:border-amber-800"
          )}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {/* Channel Icon */}
                <div className={cn(
                  "w-11 h-11 rounded-lg flex items-center justify-center text-xl shrink-0",
                  CHANNEL_COLORS[channel.channelType] || CHANNEL_COLORS.other
                )}>
                  {CHANNEL_ICONS[channel.channelType] || CHANNEL_ICONS.other}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm truncate">{channel.name}</h3>
                    <StatusBadge status={channel.status} isRu={isRu} />
                  </div>

                  {channel.propertyName && (
                    <p className="text-xs text-muted-foreground truncate mb-1">
                      {channel.propertyName}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {channel.lastSyncAt && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(channel.lastSyncAt), { addSuffix: true, locale })}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {channel.bookingsCount} {isRu ? 'брон.' : 'book.'}
                    </span>
                  </div>

                  {channel.syncError && (
                    <p className="text-xs text-red-500 mt-1 truncate">
                      {channel.syncError}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <Switch
                      checked={channel.autoSync}
                      onCheckedChange={() => handleToggleAutoSync(channel.id, channel.autoSync)}
                      className="scale-75"
                    />
                    <span className="text-xs text-muted-foreground">
                      {isRu ? 'Авто' : 'Auto'}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={syncing === channel.id}
                    onClick={() => handleSyncChannel(channel.id)}
                  >
                    <RefreshCw className={cn("h-4 w-4", syncing === channel.id && "animate-spin")} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!channels || channels.length === 0) && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>{isRu ? 'Нет подключённых каналов' : 'No connected channels'}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ 
  icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: number; 
  color: string;
}) {
  return (
    <Card>
      <CardContent className="pt-3 pb-2">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-1.5", color)}>
          {icon}
        </div>
        <div className="text-xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status, isRu }: { status: string; isRu: boolean }) {
  if (status === 'healthy') {
    return (
      <Badge variant="secondary" className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 px-1.5">
        <CheckCircle2 className="h-3 w-3 mr-0.5" />
        {isRu ? 'OK' : 'OK'}
      </Badge>
    );
  }
  if (status === 'warning') {
    return (
      <Badge variant="secondary" className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-600 px-1.5">
        <AlertTriangle className="h-3 w-3 mr-0.5" />
        {isRu ? 'Внимание' : 'Warning'}
      </Badge>
    );
  }
  if (status === 'error') {
    return (
      <Badge variant="destructive" className="text-xs px-1.5">
        <XCircle className="h-3 w-3 mr-0.5" />
        {isRu ? 'Ошибка' : 'Error'}
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-xs px-1.5">
      {isRu ? 'Неизвестно' : 'Unknown'}
    </Badge>
  );
}
