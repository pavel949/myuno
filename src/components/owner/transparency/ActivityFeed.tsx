import React, { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePropertyActivityLog, PropertyActivityLog } from '@/hooks/usePropertyDelegates';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  CalendarCheck, DollarSign, Wrench, ClipboardList, AlertCircle,
  ArrowRightLeft, UserCheck, Camera, RefreshCw
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

const ACTION_CONFIG: Record<string, { 
  icon: React.ElementType; 
  color: string; 
  labelEn: string; 
  labelRu: string 
}> = {
  booking_created: { icon: CalendarCheck, color: 'text-success bg-success/10', labelEn: 'Booking confirmed', labelRu: 'Бронирование подтверждено' },
  booking_status_changed: { icon: ArrowRightLeft, color: 'text-info bg-info/10', labelEn: 'Booking status changed', labelRu: 'Статус бронирования изменён' },
  income_recorded: { icon: DollarSign, color: 'text-success bg-success/10', labelEn: 'Income recorded', labelRu: 'Доход записан' },
  expense_recorded: { icon: DollarSign, color: 'text-destructive bg-destructive/10', labelEn: 'Expense recorded', labelRu: 'Расход записан' },
  task_created: { icon: ClipboardList, color: 'text-warning bg-warning/10', labelEn: 'Task created', labelRu: 'Задача создана' },
  task_status_changed: { icon: Wrench, color: 'text-accent-purple bg-accent-purple/10', labelEn: 'Task updated', labelRu: 'Задача обновлена' },
  service_request_created: { icon: AlertCircle, color: 'text-warning bg-warning/10', labelEn: 'Service request', labelRu: 'Запрос на обслуживание' },
  service_request_updated: { icon: Wrench, color: 'text-accent-teal bg-accent-teal/10', labelEn: 'Service request updated', labelRu: 'Запрос обновлён' },
  inspection_completed: { icon: Camera, color: 'text-info bg-info/10', labelEn: 'Inspection completed', labelRu: 'Осмотр проведён' },
  delegate_invited: { icon: UserCheck, color: 'text-info bg-info/10', labelEn: 'Team member invited', labelRu: 'Приглашён участник' },
};

function getActionConfig(action: string) {
  return ACTION_CONFIG[action] || { 
    icon: ClipboardList, 
    color: 'text-muted-foreground bg-muted', 
    labelEn: action.replace(/_/g, ' '), 
    labelRu: action.replace(/_/g, ' ') 
  };
}

function formatActivityDetail(entry: PropertyActivityLog, isRu: boolean): string {
  const d = entry.details;
  if (!d) return '';

  switch (entry.action) {
    case 'booking_created':
      return `${d.guest_name || '?'} · ${d.check_in} → ${d.check_out} · ${d.total_price?.toLocaleString()} ${d.currency || 'THB'}`;
    case 'booking_status_changed':
      return `${d.guest_name || '?'} · ${d.old_status} → ${d.new_status}`;
    case 'income_recorded':
    case 'expense_recorded':
      return `${d.category || ''} · ${d.amount?.toLocaleString()} ${d.currency || 'THB'}${d.description ? ` — ${d.description}` : ''}`;
    case 'task_created':
    case 'task_status_changed':
      return d.title || '';
    case 'service_request_created':
    case 'service_request_updated':
      return d.description || d.request_type || '';
    default:
      return JSON.stringify(d).slice(0, 100);
  }
}

function formatTime(dateStr: string, isRu: boolean) {
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, 'HH:mm');
  if (isYesterday(d)) return isRu ? 'Вчера' : 'Yesterday';
  return format(d, 'd MMM', { locale: isRu ? ru : undefined });
}

interface ActivityFeedProps {
  propertyId: string;
  limit?: number;
}

export function ActivityFeed({ propertyId, limit = 50 }: ActivityFeedProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: activities = [], isLoading, refetch } = usePropertyActivityLog(propertyId, limit);
  const queryClient = useQueryClient();

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel(`activity-${propertyId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'property_activity_log',
        filter: `property_id=eq.${propertyId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['property-activity', propertyId] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [propertyId, queryClient]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-9 h-9 rounded-full bg-muted" />
            <div className="flex-1 space-y-1">
              <div className="h-4 bg-muted rounded w-2/3" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        {isRu ? 'Пока нет активности' : 'No activity yet'}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">
          {isRu ? 'Лента активности' : 'Activity Feed'}
        </h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => refetch()}>
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </div>
      {activities.map((entry) => {
        const config = getActionConfig(entry.action);
        const Icon = config.icon;
        const detail = formatActivityDetail(entry, isRu);

        return (
          <div key={entry.id} className="flex gap-3 py-2.5 border-b border-border/30 last:border-0">
            <div className={cn("w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0", config.color)}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-foreground truncate">
                  {isRu ? config.labelRu : config.labelEn}
                </p>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatTime(entry.created_at, isRu)}
                </span>
              </div>
              {detail && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">{detail}</p>
              )}
              {entry.actor?.full_name && (
                <div className="flex items-center gap-1.5 mt-1">
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={entry.actor.avatar_url || undefined} />
                    <AvatarFallback className="text-[8px]">
                      {entry.actor.full_name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-[11px] text-muted-foreground">{entry.actor.full_name}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
