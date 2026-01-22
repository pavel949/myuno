import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminDashboardStats } from '@/hooks/useAdminDashboardStats';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Ship, Home, Utensils, Scissors, MapPin, Dumbbell, ChevronRight, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const VERTICALS = [
  { key: 'yachts', icon: Ship, label: 'Yachts', labelRu: 'Яхты', href: '/admin/yachts', color: 'text-info' },
  { key: 'properties', icon: Home, label: 'Properties', labelRu: 'Недвижимость', href: '/admin/properties', color: 'text-success' },
  { key: 'restaurants', icon: Utensils, label: 'Restaurants', labelRu: 'Рестораны', href: '/admin/restaurants', color: 'text-destructive' },
  { key: 'salons', icon: Scissors, label: 'Salons', labelRu: 'Салоны', href: '/admin/salons', color: 'text-purple-500' },
  { key: 'tours', icon: MapPin, label: 'Tours', labelRu: 'Туры', href: '/admin/tours', color: 'text-warning' },
  { key: 'gyms', icon: Dumbbell, label: 'Fitness', labelRu: 'Фитнес', href: '/admin/gyms', color: 'text-pink-500' },
];

export function AdminVerticalsBlock() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data, isLoading } = useAdminDashboardStats();

  if (isLoading) {
    return (
      <Card className="p-3">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-16 w-16 flex-shrink-0 rounded-xl" />
          ))}
        </div>
      </Card>
    );
  }

  const getCount = (key: string): number => {
    if (!data) return 0;
    const stats = data as { yachts?: number; properties?: number; restaurants?: number; salons?: number; tours?: number; gyms?: number };
    return (stats[key as keyof typeof stats] as number) || 0;
  };

  const totalCount = VERTICALS.reduce((sum, v) => sum + getCount(v.key), 0);

  return (
    <Card 
      className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => navigate('/admin/services')}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {isRu ? 'Вертикали' : 'Verticals'}
          </span>
          <span className="text-xs font-medium text-foreground">{totalCount}</span>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Verticals scroll */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {VERTICALS.slice(0, 5).map((vertical) => {
          const Icon = vertical.icon;
          const count = getCount(vertical.key);
          return (
            <div
              key={vertical.key}
              className="flex-shrink-0 w-16 p-2 rounded-xl bg-muted/50 hover:bg-muted text-center cursor-pointer transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                navigate(vertical.href);
              }}
            >
              <div className={cn("mx-auto mb-1", vertical.color)}>
                <Icon className="h-5 w-5 mx-auto" />
              </div>
              <p className="text-sm font-semibold">{count}</p>
              <p className="text-[9px] text-muted-foreground truncate">
                {isRu ? vertical.labelRu : vertical.label}
              </p>
            </div>
          );
        })}
        
        {/* Add new button */}
        <div
          className="flex-shrink-0 w-16 p-2 rounded-xl border border-dashed hover:bg-muted/50 text-center cursor-pointer transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            navigate('/admin/services?action=new');
          }}
        >
          <div className="mx-auto mb-1 text-muted-foreground">
            <Plus className="h-5 w-5 mx-auto" />
          </div>
          <p className="text-[9px] text-muted-foreground">
            {isRu ? 'Добавить' : 'Add'}
          </p>
        </div>
      </div>
    </Card>
  );
}
