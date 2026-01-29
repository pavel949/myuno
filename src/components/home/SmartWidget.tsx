import { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Cloud, CloudRain, Calendar, Thermometer, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWeather } from '@/hooks/useWeather';
import { useTodayEvents, useSmartRecommendations } from '@/hooks/useTodayEvents';
import { Skeleton } from '@/components/ui/skeleton';

// Memoized weather icon component
const WeatherIcon = memo(function WeatherIcon({ condition, isLoading }: { condition: string; isLoading?: boolean }) {
  if (isLoading) {
    return <Skeleton className="w-8 h-8 rounded-full" />;
  }
  
  switch (condition) {
    case 'sunny':
      return <Sun className="w-8 h-8 text-amber-400" />;
    case 'cloudy':
      return <Cloud className="w-8 h-8 text-slate-400" />;
    case 'rainy':
      return <CloudRain className="w-8 h-8 text-blue-400" />;
    default:
      return <Sun className="w-8 h-8 text-amber-400" />;
  }
});

export const SmartWidget = memo(function SmartWidget() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { data: weather, isLoading: isWeatherLoading } = useWeather();
  const { data: todayEvents, isLoading: isEventsLoading } = useTodayEvents();
  const { data: recommendations, isLoading: isRecsLoading } = useSmartRecommendations();
  
  const [currentHour, setCurrentHour] = useState(() => new Date().getHours());

  useEffect(() => {
    // Only update when hour changes (affects greeting)
    const checkHour = () => {
      const hour = new Date().getHours();
      if (hour !== currentHour) {
        setCurrentHour(hour);
      }
    };
    
    const timer = setInterval(checkHour, 60000);
    return () => clearInterval(timer);
  }, [currentHour]);

  // Get one random recommendation - only recalculate when recommendations change
  const recommendation = useMemo(() => {
    if (!recommendations || recommendations.length === 0) return null;
    return recommendations[Math.floor(Math.random() * recommendations.length)];
  }, [recommendations]);

  // Get first event of the day
  const todayEvent = todayEvents?.[0] || null;

  const greeting = useMemo(() => {
    if (currentHour < 12) return language === 'ru' ? 'Доброе утро' : 'Good morning';
    if (currentHour < 17) return language === 'ru' ? 'Добрый день' : 'Good afternoon';
    return language === 'ru' ? 'Добрый вечер' : 'Good evening';
  }, [currentHour, language]);

  const isRu = language === 'ru';
  
  const handleEventClick = useCallback(() => {
    navigate(todayEvent ? `/events/${todayEvent.id}` : '/events');
  }, [navigate, todayEvent]);
  
  const handleRecClick = useCallback(() => {
    if (recommendation) navigate(recommendation.path);
  }, [navigate, recommendation]);

  return (
    <div className="relative overflow-hidden rounded-xl bg-card border border-border">
      <div className="p-3">
        {/* Header with greeting and weather */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{greeting}</p>
            <h2 className="text-lg font-semibold text-foreground">
              {isRu ? 'Пхукет сегодня' : 'Phuket Today'}
            </h2>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/50 backdrop-blur-sm border border-border/50">
            <WeatherIcon condition={weather?.condition || 'sunny'} isLoading={isWeatherLoading} />
            <div className="text-right">
              {isWeatherLoading ? (
                <>
                  <Skeleton className="h-4 w-12 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </>
              ) : (
                <>
                  <p className="text-sm font-bold text-foreground flex items-center gap-1">
                    <Thermometer className="w-3 h-3" />
                    {weather?.temp || 31}°C
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {isRu ? weather?.descriptionRu : weather?.description}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Today's Event */}
          <button
            onClick={handleEventClick}
            className="flex flex-col p-3 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all group text-left"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-purple-500" />
              </div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                {isRu ? 'Сегодня' : 'Today'}
              </span>
            </div>
            {isEventsLoading ? (
              <>
                <Skeleton className="h-4 w-3/4 mb-1" />
                <Skeleton className="h-3 w-1/2" />
              </>
            ) : todayEvent ? (
              <>
                <p className="text-sm font-medium text-foreground line-clamp-1">
                  {isRu ? todayEvent.title_ru || todayEvent.title_en : todayEvent.title_en}
                </p>
                <p className="text-xs text-primary mt-0.5">
                  {todayEvent.event_time || (isRu ? 'Весь день' : 'All day')}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-foreground line-clamp-1">
                  {isRu ? 'Нет событий' : 'No events'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isRu ? 'Посмотреть все →' : 'Browse all →'}
                </p>
              </>
            )}
          </button>

          {/* Daily Recommendation */}
          <button
            onClick={handleRecClick}
            className="flex flex-col p-3 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all group text-left"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-lg">
                {isRecsLoading ? (
                  <Skeleton className="w-5 h-5 rounded" />
                ) : (
                  recommendation?.icon || <Sparkles className="w-4 h-4 text-primary" />
                )}
              </div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                {isRu ? 'Рекомендуем' : 'For You'}
              </span>
            </div>
            {isRecsLoading ? (
              <>
                <Skeleton className="h-4 w-3/4 mb-1" />
                <Skeleton className="h-3 w-1/2" />
              </>
            ) : recommendation ? (
              <>
                <p className="text-sm font-medium text-foreground line-clamp-1">
                  {isRu ? recommendation.title_ru || recommendation.title_en : recommendation.title_en}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {isRu ? recommendation.subtitle_ru : recommendation.subtitle_en}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-foreground line-clamp-1">
                  {isRu ? 'Откройте для себя' : 'Discover'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isRu ? 'Лучшее на острове' : 'Best on the island'}
                </p>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});
