import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Trash2, X, Scissors, Home, Utensils, Car, Dumbbell, Stethoscope, Calendar, GraduationCap } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useViewHistory } from '@/hooks/useViewHistory';
import { PremiumButton } from '@/components/uno/PremiumButton';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { formatDistanceToNow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';

const typeIcons: Record<string, React.ElementType> = {
  salon: Scissors,
  property: Home,
  restaurant: Utensils,
  vehicle: Car,
  gym: Dumbbell,
  clinic: Stethoscope,
  event: Calendar,
  course: GraduationCap,
};

const typeLabels: Record<string, { en: string; ru: string }> = {
  salon: { en: 'Beauty Salon', ru: 'Салон красоты' },
  property: { en: 'Property', ru: 'Недвижимость' },
  restaurant: { en: 'Restaurant', ru: 'Ресторан' },
  vehicle: { en: 'Vehicle', ru: 'Транспорт' },
  gym: { en: 'Gym', ru: 'Фитнес' },
  clinic: { en: 'Clinic', ru: 'Клиника' },
  event: { en: 'Event', ru: 'Мероприятие' },
  course: { en: 'Course', ru: 'Курс' },
};

const typeRoutes: Record<string, string> = {
  salon: '/beauty/salon',
  property: '/property',
  restaurant: '/food/restaurant',
  vehicle: '/transport/vehicle',
  gym: '/fitness/gym',
  clinic: '/medical/clinic',
  event: '/events/event',
  course: '/education/course',
};

export default function ViewHistory() {
  const { language } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const { history, isLoading, clearHistory, removeFromHistory, refetch } = useViewHistory();
  const navigate = useNavigate();

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  if (authLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
          <Clock className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            {language === 'ru' ? 'Войдите в аккаунт' : 'Sign in to continue'}
          </h2>
          <p className="text-muted-foreground mb-4">
            {language === 'ru' 
              ? 'Чтобы просматривать историю, войдите в аккаунт'
              : 'Sign in to view your browsing history'}
          </p>
          <PremiumButton onClick={() => navigate('/auth')}>
            {language === 'ru' ? 'Войти' : 'Sign In'}
          </PremiumButton>
        </div>
      </AppLayout>
    );
  }

  const handleItemClick = (itemType: string, itemId: string) => {
    const baseRoute = typeRoutes[itemType] || '/';
    navigate(`${baseRoute}/${itemId}`);
  };

  return (
    <AppLayout>
      <PullToRefresh onRefresh={handleRefresh} className="h-[calc(100vh-8rem)]">
        <div className="p-4 space-y-4">
          {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            {language === 'ru' ? 'История просмотров' : 'View History'}
          </h1>
          {history.length > 0 && (
            <PremiumButton
              variant="ghost"
              size="sm"
              onClick={clearHistory}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              {language === 'ru' ? 'Очистить' : 'Clear'}
            </PremiumButton>
          )}
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-card rounded-xl p-4 flex gap-3">
                <div className="w-16 h-16 bg-muted rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Clock className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-lg font-medium mb-2">
              {language === 'ru' ? 'История пуста' : 'No history yet'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {language === 'ru' 
                ? 'Просмотренные салоны и услуги появятся здесь'
                : 'Viewed salons and services will appear here'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => {
              const Icon = typeIcons[item.item_type] || Clock;
              const typeLabel = typeLabels[item.item_type];
              const itemName = item.item_data?.name 
                || (language === 'ru' ? item.item_data?.name_ru : item.item_data?.name_en)
                || `${typeLabel?.[language] || item.item_type} #${item.item_id.slice(0, 6)}`;

              return (
                <div
                  key={item.id}
                  className="bg-card border border-border rounded-xl p-3 flex items-center gap-3"
                >
                  {/* Image or Icon */}
                  <button
                    onClick={() => handleItemClick(item.item_type, item.item_id)}
                    className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0"
                  >
                    {item.item_data?.image ? (
                      <img
                        src={item.item_data.image}
                        alt={itemName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icon className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </button>

                  {/* Content */}
                  <button
                    onClick={() => handleItemClick(item.item_type, item.item_id)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <h3 className="font-medium truncate">{itemName}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Icon className="w-3 h-3" />
                        {typeLabel?.[language] || item.item_type}
                      </span>
                      {item.view_count > 1 && (
                        <span>• {item.view_count}x</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(item.viewed_at), {
                        addSuffix: true,
                        locale: language === 'ru' ? ru : enUS
                      })}
                    </p>
                  </button>

                  {/* Remove button */}
                  <button
                    onClick={() => removeFromHistory(item.id)}
                    className="p-2 hover:bg-secondary rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
        </div>
      </PullToRefresh>
    </AppLayout>
  );
}
