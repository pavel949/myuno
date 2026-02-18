import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export type NotificationFilterType = 'all' | 'booking' | 'promotion' | 'status';

interface NotificationFiltersProps {
  activeFilter: NotificationFilterType;
  onFilterChange: (filter: NotificationFilterType) => void;
  counts: Record<NotificationFilterType, number>;
}

export function NotificationFilters({ activeFilter, onFilterChange, counts }: NotificationFiltersProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const filters: { key: NotificationFilterType; label: string }[] = [
    { key: 'all', label: isRu ? 'Все' : 'All' },
    { key: 'booking', label: isRu ? 'Бронирования' : 'Bookings' },
    { key: 'promotion', label: isRu ? 'Акции' : 'Promotions' },
    { key: 'status', label: isRu ? 'Статусы' : 'Status' },
  ];

  return (
    <div className="flex gap-2 flex-wrap">
      {filters.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onFilterChange(key)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
            activeFilter === key
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          )}
        >
          {label}
          {counts[key] > 0 && (
            <span className={cn(
              'text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center',
              activeFilter === key ? 'bg-primary-foreground/20' : 'bg-background'
            )}>
              {counts[key]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
