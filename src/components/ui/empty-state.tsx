import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, Inbox, Search, AlertCircle, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * DS2.0 EmptyState — consistent empty/error/no-results pattern
 */
type EmptyStatePreset = 'empty' | 'no-results' | 'error' | 'offline';

const presets: Record<EmptyStatePreset, { icon: LucideIcon; titleEn: string; titleRu: string }> = {
  empty: { icon: Inbox, titleEn: 'Nothing here yet', titleRu: 'Пока ничего нет' },
  'no-results': { icon: Search, titleEn: 'No results found', titleRu: 'Ничего не найдено' },
  error: { icon: AlertCircle, titleEn: 'Something went wrong', titleRu: 'Что-то пошло не так' },
  offline: { icon: WifiOff, titleEn: 'You\'re offline', titleRu: 'Нет подключения' },
};

interface EmptyStateProps {
  preset?: EmptyStatePreset;
  icon?: LucideIcon;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  preset = 'empty',
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  const p = presets[preset];
  const Icon = icon || p.icon;
  const displayTitle = title || p.titleEn;

  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-muted-foreground" />
      </div>
      <h3 className="font-display text-base font-semibold text-foreground mb-1">{displayTitle}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-xs">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="outline" size="sm" className="mt-4">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
