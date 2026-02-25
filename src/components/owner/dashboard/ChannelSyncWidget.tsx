import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useChannelHealth } from '@/hooks/useChannelHealth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Radio, CheckCircle2, AlertTriangle, XCircle, Clock, RefreshCw, ChevronRight 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { toast } from 'sonner';

const STATUS_CONFIG = {
  healthy: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  warning: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  error: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
  unknown: { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted' },
} as const;

const CHANNEL_EMOJI: Record<string, string> = {
  airbnb: '🏠', booking: '🅱️', vrbo: '🏡', expedia: '✈️', google: '📅', other: '📆',
};

export function ChannelSyncWidget() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const locale = isRu ? ru : enUS;
  const { channels, stats, isLoading } = useChannelHealth();
  const [syncing, setSyncing] = useState(false);

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      const calendarIds = channels?.map(c => c.id) || [];
      if (calendarIds.length === 0) return;
      const { error } = await supabase.functions.invoke('ical-sync', {
        body: { calendar_ids: calendarIds },
      });
      if (error) throw error;
      toast.success(isRu ? 'Каналы синхронизированы' : 'Channels synced');
    } catch {
      toast.error(isRu ? 'Ошибка синхронизации' : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="h-20 bg-muted animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!channels || channels.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-6 text-center">
          <Radio className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground mb-3">
            {isRu ? 'Подключите OTA-каналы для синхронизации' : 'Connect OTA channels to sync'}
          </p>
          <Button size="sm" variant="outline" onClick={() => navigate('/owner/channels')}>
            {isRu ? 'Подключить' : 'Connect'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const hasIssues = (stats?.error || 0) + (stats?.warning || 0) > 0;

  return (
    <Card className={cn(hasIssues && "border-amber-300 dark:border-amber-800")}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Radio className="h-4 w-4 text-primary" />
            {isRu ? 'Каналы' : 'Channels'}
            {hasIssues && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                {(stats?.error || 0) + (stats?.warning || 0)}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={syncing}
              onClick={handleSyncAll}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", syncing && "animate-spin")} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => navigate('/owner/channels')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Summary row */}
        <div className="flex items-center gap-4 mb-3 text-xs">
          <span className="flex items-center gap-1 text-emerald-600">
            <CheckCircle2 className="h-3 w-3" />
            {stats?.healthy || 0} OK
          </span>
          {(stats?.warning || 0) > 0 && (
            <span className="flex items-center gap-1 text-amber-600">
              <AlertTriangle className="h-3 w-3" />
              {stats?.warning}
            </span>
          )}
          {(stats?.error || 0) > 0 && (
            <span className="flex items-center gap-1 text-red-600">
              <XCircle className="h-3 w-3" />
              {stats?.error}
            </span>
          )}
          <span className="ml-auto text-muted-foreground">
            {isRu ? 'Авто: каждые 5 мин' : 'Auto: every 5 min'}
          </span>
        </div>

        {/* Channel list (compact) */}
        <div className="space-y-1.5">
          {channels.slice(0, 5).map(channel => {
            const cfg = STATUS_CONFIG[channel.status];
            const StatusIcon = cfg.icon;
            return (
              <div key={channel.id} className="flex items-center gap-2.5 py-1">
                <span className="text-base">{CHANNEL_EMOJI[channel.channelType] || '📆'}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium truncate block">{channel.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {channel.lastSyncAt && (
                    <span className="text-[10px] text-muted-foreground hidden sm:block">
                      {formatDistanceToNow(new Date(channel.lastSyncAt), { addSuffix: true, locale })}
                    </span>
                  )}
                  <StatusIcon className={cn("h-3.5 w-3.5", cfg.color)} />
                </div>
              </div>
            );
          })}
          {channels.length > 5 && (
            <button
              onClick={() => navigate('/owner/channels')}
              className="text-xs text-primary hover:underline w-full text-left py-1"
            >
              {isRu ? `Ещё ${channels.length - 5} каналов...` : `${channels.length - 5} more channels...`}
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
