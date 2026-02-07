import React from 'react';
import { Bell, Calendar, Tag, Info, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

export type NotificationFilterType = 'all' | 'booking' | 'promotion' | 'status';

interface NotificationFiltersProps {
  activeFilter: NotificationFilterType;
  onFilterChange: (filter: NotificationFilterType) => void;
  counts: {
    all: number;
    booking: number;
    promotion: number;
    status: number;
  };
}

const filters: { id: NotificationFilterType; icon: React.ElementType; labelEn: string; labelRu: string }[] = [
  { id: 'all', icon: Bell, labelEn: 'All', labelRu: 'Все' },
  { id: 'booking', icon: Calendar, labelEn: 'Bookings', labelRu: 'Брони' },
  { id: 'promotion', icon: Tag, labelEn: 'Promos', labelRu: 'Акции' },
  { id: 'status', icon: Info, labelEn: 'Updates', labelRu: 'Статус' },
];

export function NotificationFilters({ activeFilter, onFilterChange, counts }: NotificationFiltersProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide touch-pan-y">
      {filters.map((filter) => {
        const Icon = filter.icon;
        const count = counts[filter.id];
        const isActive = activeFilter === filter.id;

        return (
          <Button
            key={filter.id}
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            className={cn(
              "flex-shrink-0 gap-1.5 h-8 px-3",
              isActive && "shadow-md"
            )}
            onClick={() => onFilterChange(filter.id)}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="text-xs">{isRu ? filter.labelRu : filter.labelEn}</span>
            {count > 0 && (
              <Badge 
                variant={isActive ? "secondary" : "outline"} 
                className="h-4 min-w-4 px-1 text-[10px]"
              >
                {count > 99 ? '99+' : count}
              </Badge>
            )}
          </Button>
        );
      })}
    </div>
  );
}
