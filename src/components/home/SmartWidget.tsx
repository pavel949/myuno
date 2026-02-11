import { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Cloud, CloudRain, Calendar, Thermometer, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWeather } from '@/hooks/useWeather';
import { useTodayEvents, useSmartRecommendations } from '@/hooks/useTodayEvents';
import { Skeleton } from '@/components/ui/skeleton';
import { QuickStatsRibbon } from './QuickStatsRibbon';

interface WeatherIconProps {
  condition: string;
  isLoading?: boolean;
}

const WeatherIcon = memo(function WeatherIcon({ condition, isLoading }: WeatherIconProps) {
  if (isLoading) {
    return <Skeleton className="w-6 h-6 rounded-full" />;
  }
  
  switch (condition) {
    case 'sunny':
      return <Sun className="w-6 h-6 text-amber-400" />;
    case 'cloudy':
      return <Cloud className="w-6 h-6 text-slate-400" />;
    case 'rainy':
      return <CloudRain className="w-6 h-6 text-blue-400" />;
    default:
      return <Sun className="w-6 h-6 text-amber-400" />;
  }
});
WeatherIcon.displayName = 'WeatherIcon';

export const SmartWidget = memo(function SmartWidget() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { data: weather, isLoading: isWeatherLoading } = useWeather();
  const { data: todayEvents, isLoading: isEventsLoading } = useTodayEvents();
  const { data: recommendations, isLoading: isRecsLoading } = useSmartRecommendations();
  
  const [currentHour, setCurrentHour] = useState(() => new Date().getHours());

  useEffect(() => {
    const checkHour = () => {
      const hour = new Date().getHours();
      if (hour !== currentHour) {
        setCurrentHour(hour);
      }
    };
    
    const timer = setInterval(checkHour, 60000);
    return () => clearInterval(timer);
  }, [currentHour]);

  const recommendation = useMemo(() => {
    if (!recommendations || recommendations.length === 0) return null;
    return recommendations[Math.floor(Math.random() * recommendations.length)];
  }, [recommendations]);

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
      <div className="p-3 lg:p-4 space-y-3">
        {/* Compact Header: Greeting + Weather in one row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WeatherIcon condition={weather?.condition || 'sunny'} isLoading={isWeatherLoading} />
            {isWeatherLoading ? (
              <Skeleton className="h-5 w-12" />
            ) : (
              <span className="text-base lg:text-lg font-bold text-foreground">
                {weather?.temp || 31}°C
              </span>
            )}
            <span className="text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">{greeting}</span>
          </div>
          <span className="text-sm font-medium text-foreground">
            {isRu ? 'Пхукет сегодня' : 'Phuket Today'}
          </span>
        </div>

        {/* Quick Stats Ribbon */}
        <QuickStatsRibbon />

        {/* Content grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* Today's Event */}
          <button
            onClick={handleEventClick}
            className="flex flex-col p-2.5 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all group text-left"
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-6 h-6 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Calendar className="w-3 h-3 text-purple-500" />
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
            className="flex flex-col p-2.5 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all group text-left"
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-lg">
                {isRecsLoading ? (
                  <Skeleton className="w-4 h-4 rounded" />
                ) : (
                  recommendation?.icon || <Sparkles className="w-3 h-3 text-primary" />
                )}
              </div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                {isRu ? 'Для вас' : 'For You'}
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
