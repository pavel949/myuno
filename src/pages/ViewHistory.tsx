import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Trash2, X, Scissors, Home, Utensils, Car, Dumbbell, Stethoscope, Calendar, GraduationCap } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useViewHistory } from '@/hooks/useViewHistory';
import { PremiumButton } from '@/components/uno/PremiumButton';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { LoadingState } from '@/components/uno/LoadingSpinner';
import { EmptyState } from '@/components/uno/EmptyState';
import { SectionCard } from '@/components/uno/SectionCard';
import { AnimatedList, AnimatedItem } from '@/components/layout/AnimatedList';
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
  restaurant: '/restaurants',
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
        <LoadingState />
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout>
        <EmptyState
          icon={Clock}
          title={language === 'ru' ? 'Войдите в аккаунт' : 'Sign in to continue'}
          description={language === 'ru' 
            ? 'Чтобы просматривать историю, войдите в аккаунт'
            : 'Sign in to view your browsing history'}
          action={
            <PremiumButton onClick={() => navigate('/auth')}>
              {language === 'ru' ? 'Войти' : 'Sign In'}
            </PremiumButton>
          }
        />
      </AppLayout>
    );
  }

  const handleItemClick = (itemType: string, itemId: string) => {
    const baseRoute = typeRoutes[itemType] || '/';
    navigate(`${baseRoute}/${itemId}`);
  };

  return (
    <AppLayout>
      <PullToRefresh onRefresh={handleRefresh} className="flex-1">
        <PageContainer>
          <PageHeader
            title={language === 'ru' ? 'История просмотров' : 'View History'}
            actions={
              history.length > 0 && (
                <PremiumButton
                  variant="ghost"
                  size="sm"
                  onClick={clearHistory}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  {language === 'ru' ? 'Очистить' : 'Clear'}
                </PremiumButton>
              )
            }
          />

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <SectionCard key={i} className="animate-pulse flex gap-3">
                  <div className="w-16 h-16 bg-muted rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </SectionCard>
              ))}
            </div>
          ) : history.length === 0 ? (
            <EmptyState
              icon={Clock}
              title={language === 'ru' ? 'История пуста' : 'No history yet'}
              description={language === 'ru' 
                ? 'Просмотренные салоны и услуги появятся здесь'
                : 'Viewed salons and services will appear here'}
            />
          ) : (
            <AnimatedList className="space-y-3">
              {history.map((item) => {
                const Icon = typeIcons[item.item_type] || Clock;
                const typeLabel = typeLabels[item.item_type];
                const itemName = item.item_data?.name 
                  || (language === 'ru' ? item.item_data?.name_ru : item.item_data?.name_en)
                  || `${typeLabel?.[language] || item.item_type} #${item.item_id.slice(0, 6)}`;

                return (
                  <AnimatedItem key={item.id}>
                    <SectionCard className="flex items-center gap-3">
                      <button
                        onClick={() => handleItemClick(item.item_type, item.item_id)}
                        className="relative w-16 h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0"
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

                      <button
                        onClick={() => removeFromHistory(item.id)}
                        className="p-2 hover:bg-secondary rounded-xl transition-colors"
                      >
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </SectionCard>
                  </AnimatedItem>
                );
              })}
            </AnimatedList>
          )}
        </PageContainer>
      </PullToRefresh>
    </AppLayout>
  );
}
