import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { pickLang } from '@/lib/i18n/pickLang';

export type NotificationFilterType = 'all' | 'booking' | 'order' | 'promotion' | 'status';

interface NotificationFiltersProps {
  activeFilter: NotificationFilterType;
  onFilterChange: (filter: NotificationFilterType) => void;
  counts: Record<NotificationFilterType, number>;
}

export function NotificationFilters({ activeFilter, onFilterChange, counts }: NotificationFiltersProps) {
  const { language } = useLanguage();
  const local = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });

  const filters: { key: NotificationFilterType; label: string }[] = [
    { key: 'all', label: local('Все', 'All', 'ทั้งหมด') },
    { key: 'booking', label: local('Бронирования', 'Bookings', 'การจอง') },
    { key: 'order', label: local('Заказы', 'Orders', 'คำสั่งซื้อ') },
    { key: 'promotion', label: local('Акции', 'Promotions', 'โปรโมชัน') },
    { key: 'status', label: local('Статусы', 'Status', 'สถานะ') },
  ];

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={local('Фильтры уведомлений', 'Filter notifications', 'ตัวกรองการแจ้งเตือน')}>
      {filters.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          aria-pressed={activeFilter === key}
          onClick={() => onFilterChange(key)}
          className={cn(
            'flex min-h-11 items-center gap-1.5 rounded-[var(--bible-radius-control)] px-3 py-1.5 text-sm font-medium transition-colors',
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
