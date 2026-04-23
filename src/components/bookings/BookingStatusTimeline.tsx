import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import {
  Clock,
  CheckCircle2,
  Send,
  PlayCircle,
  PartyPopper,
  XCircle,
  AlertTriangle,
  FileEdit,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export interface BookingStatusEvent {
  id?: string;
  from_status?: string | null;
  to_status: string;
  notes?: string | null;
  created_at: string;
}

interface BookingStatusTimelineProps {
  events: BookingStatusEvent[];
  currentStatus?: string;
  createdAt?: string;
  className?: string;
  compact?: boolean;
  /** Event IDs that should briefly flash to draw attention (e.g. just-arrived realtime events). */
  highlightIds?: Set<string> | string[];
}

const STATUS_CONFIG: Record<
  string,
  { icon: typeof Clock; en: string; ru: string; tone: string }
> = {
  draft: { icon: FileEdit, en: 'Draft', ru: 'Черновик', tone: 'text-muted-foreground' },
  pending: { icon: Clock, en: 'Pending', ru: 'Ожидает', tone: 'text-warning' },
  submitted: { icon: Send, en: 'Submitted', ru: 'Отправлено', tone: 'text-info' },
  confirmed: { icon: CheckCircle2, en: 'Confirmed', ru: 'Подтверждено', tone: 'text-info' },
  in_progress: { icon: PlayCircle, en: 'In Progress', ru: 'В процессе', tone: 'text-accent-purple' },
  completed: { icon: PartyPopper, en: 'Completed', ru: 'Завершено', tone: 'text-success' },
  cancelled: { icon: XCircle, en: 'Cancelled', ru: 'Отменено', tone: 'text-destructive' },
  cancelled_by_user: { icon: XCircle, en: 'Cancelled by you', ru: 'Отменено вами', tone: 'text-destructive' },
  cancelled_by_provider: { icon: XCircle, en: 'Declined', ru: 'Отклонено', tone: 'text-destructive' },
  expired: { icon: AlertTriangle, en: 'Expired', ru: 'Истекло', tone: 'text-muted-foreground' },
};

function getStatusMeta(status: string, isRu: boolean) {
  const cfg = STATUS_CONFIG[status] ?? {
    icon: Clock,
    en: status,
    ru: status,
    tone: 'text-muted-foreground',
  };
  return { Icon: cfg.icon, label: isRu ? cfg.ru : cfg.en, tone: cfg.tone };
}

export function BookingStatusTimeline({
  events,
  currentStatus,
  createdAt,
  className,
  compact = false,
}: BookingStatusTimelineProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const locale = isRu ? ru : enUS;

  // Build a chronological list. Always seed with "created" event if we know createdAt.
  const sorted = [...events].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  let timeline: BookingStatusEvent[] = sorted;
  if (sorted.length === 0 && currentStatus && createdAt) {
    timeline = [{ to_status: currentStatus, created_at: createdAt }];
  } else if (sorted.length > 0 && createdAt) {
    const firstEvent = sorted[0];
    const firstFrom = firstEvent.from_status ?? 'draft';
    const seedTime = new Date(createdAt).getTime();
    const firstTime = new Date(firstEvent.created_at).getTime();
    if (firstTime - seedTime > 1000) {
      timeline = [{ to_status: firstFrom, created_at: createdAt }, ...sorted];
    }
  }

  if (timeline.length === 0) {
    return (
      <p className={cn('text-xs text-muted-foreground', className)}>
        {isRu ? 'История статусов недоступна' : 'No status history yet'}
      </p>
    );
  }

  return (
    <ol className={cn('relative', className)} aria-label={isRu ? 'История статусов' : 'Status history'}>
      <div
        aria-hidden="true"
        className="absolute left-[11px] top-2 bottom-2 w-px bg-border"
      />
      {timeline.map((event, idx) => {
        const { Icon, label, tone } = getStatusMeta(event.to_status, isRu);
        const isLast = idx === timeline.length - 1;
        const date = new Date(event.created_at);
        return (
          <li
            key={event.id ?? `${event.to_status}-${event.created_at}-${idx}`}
            className={cn('relative flex gap-3', compact ? 'pb-2.5 last:pb-0' : 'pb-3.5 last:pb-0')}
          >
            <span
              className={cn(
                'relative z-10 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border bg-background',
                isLast ? 'border-primary/40 ring-2 ring-primary/15' : 'border-border',
                tone,
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-baseline justify-between gap-2">
                <p
                  className={cn(
                    'text-sm font-medium leading-tight',
                    isLast ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {label}
                </p>
                <time
                  dateTime={date.toISOString()}
                  className="text-[11px] tabular-nums text-muted-foreground/80 flex-shrink-0"
                >
                  {format(date, 'd MMM, HH:mm', { locale })}
                </time>
              </div>
              {event.notes && (
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{event.notes}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

interface BookingStatusTimelineSkeletonProps {
  rows?: number;
  compact?: boolean;
  className?: string;
}

export function BookingStatusTimelineSkeleton({
  rows = 3,
  compact = true,
  className,
}: BookingStatusTimelineSkeletonProps) {
  return (
    <div
      className={cn('relative', className)}
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading status timeline"
    >
      <div
        aria-hidden="true"
        className="absolute left-[11px] top-2 bottom-2 w-px bg-border"
      />
      {Array.from({ length: rows }).map((_, idx) => (
        <div
          key={idx}
          className={cn('relative flex gap-3', compact ? 'pb-2.5 last:pb-0' : 'pb-3.5 last:pb-0')}
        >
          <Skeleton className="relative z-10 h-6 w-6 flex-shrink-0 rounded-full" />
          <div className="flex-1 min-w-0 pt-0.5 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-3.5 w-28 rounded" />
              <Skeleton className="h-3 w-16 rounded" />
            </div>
            {idx === 0 && <Skeleton className="h-3 w-3/4 rounded" />}
          </div>
        </div>
      ))}
    </div>
  );
}
