import React from 'react';
import { useNavigate } from 'react-router-dom';
import { History, ArrowRight, Eye } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useViewHistory } from '@/hooks/useViewHistory';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';

const typeRoutes: Record<string, string> = {
  tour: '/tours',
  property: '/property',
  event: '/events',
  water_activity: '/water',
  clinic: '/medical',
  gym: '/fitness',
  course: '/education/course',
  tutor: '/education/tutor',
  pharmacy: '/pharmacy',
};

export function RecentlyViewedSection() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { history, isLoading } = useViewHistory();

  // Show only last 6 items
  const recentItems = history.slice(0, 6);

  if (!user || isLoading) {
    return null;
  }

  if (recentItems.length === 0) return null;

  const handleItemClick = (item: typeof recentItems[0]) => {
    const baseRoute = typeRoutes[item.item_type] || '/discover';
    navigate(`${baseRoute}/${item.item_id}`);
  };

  const formatTime = (dateStr: string) => {
    return formatDistanceToNow(new Date(dateStr), {
      addSuffix: true,
      locale: language === 'ru' ? ru : enUS,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-br from-muted to-muted/50 rounded-lg">
            <History className="w-5 h-5 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">
            {language === 'ru' ? 'Недавно просмотренное' : 'Recently Viewed'}
          </h2>
        </div>
        <button 
          onClick={() => navigate('/history')}
          className="text-sm text-primary flex items-center gap-1"
        >
          {language === 'ru' ? 'Всё' : 'All'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {recentItems.map((item) => {
          const data = item.item_data || {};
          const title = language === 'ru' 
            ? (data.name_ru || data.name || 'Без названия')
            : (data.name_en || data.name || 'Untitled');
          
          return (
            <div
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={cn(
                "flex-shrink-0 w-36 bg-card rounded-xl overflow-hidden border",
                "hover:shadow-md transition-all cursor-pointer group"
              )}
            >
              <div className="relative h-24">
                <img
                  src={data.image || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300'}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                {item.view_count > 1 && (
                  <Badge 
                    className="absolute top-1.5 right-1.5 bg-background/80 backdrop-blur-sm text-foreground text-[9px] gap-0.5 px-1.5"
                    variant="secondary"
                  >
                    <Eye className="w-2.5 h-2.5" />
                    {item.view_count}
                  </Badge>
                )}
              </div>
              <div className="p-2">
                <h3 className="font-medium text-xs line-clamp-2 leading-tight">
                  {title}
                </h3>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {formatTime(item.viewed_at)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
