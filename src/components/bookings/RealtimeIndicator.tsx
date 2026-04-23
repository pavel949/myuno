import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type RealtimeStatus = 'connecting' | 'live' | 'offline';

interface RealtimeIndicatorProps {
  status: RealtimeStatus;
  language: 'ru' | 'en' | string;
  className?: string;
}

const labels: Record<RealtimeStatus, { ru: string; en: string }> = {
  connecting: { ru: 'Подключение…', en: 'Connecting…' },
  live: { ru: 'В реальном времени', en: 'Live' },
  offline: { ru: 'Не в сети', en: 'Offline' },
};

const styles: Record<RealtimeStatus, string> = {
  connecting:
    'bg-muted text-muted-foreground border-border',
  live: 'bg-success/10 text-success border-success/20',
  offline: 'bg-destructive/10 text-destructive border-destructive/20',
};

export function RealtimeIndicator({ status, language, className }: RealtimeIndicatorProps) {
  const lang = language === 'ru' ? 'ru' : 'en';
  const label = labels[status][lang];

  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-none whitespace-nowrap',
        styles[status],
        className,
      )}
    >
      {status === 'connecting' ? (
        <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
      ) : status === 'live' ? (
        <span className="relative flex w-2 h-2" aria-hidden="true">
          <span className="absolute inset-0 rounded-full bg-success/60 animate-ping" />
          <span className="relative inline-flex w-2 h-2 rounded-full bg-success" />
        </span>
      ) : (
        <WifiOff className="w-3 h-3" aria-hidden="true" />
      )}
      <span>{label}</span>
    </span>
  );
}
