import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Cloud, CloudRain, Calendar, Thermometer } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWeather } from '@/hooks/useWeather';
import { Skeleton } from '@/components/ui/skeleton';

interface TodayEvent {
  id: string;
  title: string;
  titleRu: string;
  time: string;
  path: string;
}

interface DailyRecommendation {
  title: string;
  titleRu: string;
  subtitle: string;
  subtitleRu: string;
  path: string;
  icon: string;
}

const mockEvent: TodayEvent = {
  id: '1',
  title: 'Patong Night Market',
  titleRu: 'Ночной рынок Патонг',
  time: '18:00',
  path: '/events',
};

const dailyRecommendations: DailyRecommendation[] = [
  { title: 'Island Hopping', titleRu: 'По островам', subtitle: 'Perfect weather today', subtitleRu: 'Отличная погода сегодня', path: '/tours', icon: '🏝️' },
  { title: 'Sunset Dinner', titleRu: 'Ужин на закате', subtitle: 'Book a table with a view', subtitleRu: 'Столик с видом', path: '/restaurants', icon: '🌅' },
  { title: 'Spa Day', titleRu: 'День в СПА', subtitle: 'Treat yourself', subtitleRu: 'Побалуй себя', path: '/beauty', icon: '💆' },
];

const WeatherIcon = ({ condition, isLoading }: { condition: string; isLoading?: boolean }) => {
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
};

export function SmartWidget() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { data: weather, isLoading: isWeatherLoading } = useWeather();
  const [recommendation] = useState(() => 
    dailyRecommendations[Math.floor(Math.random() * dailyRecommendations.length)]
  );
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const greeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return language === 'ru' ? 'Доброе утро' : 'Good morning';
    if (hour < 17) return language === 'ru' ? 'Добрый день' : 'Good afternoon';
    return language === 'ru' ? 'Добрый вечер' : 'Good evening';
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-card to-primary/10 border border-border">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl opacity-50" />
      
      <div className="relative z-10 p-4">
        {/* Header with greeting and weather */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{greeting()}</p>
            <h2 className="text-lg font-semibold text-foreground">
              {language === 'ru' ? 'Пхукет сегодня' : 'Phuket Today'}
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
                    {language === 'ru' ? weather?.descriptionRu : weather?.description}
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
            onClick={() => navigate(mockEvent.path)}
            className="flex flex-col p-3 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all group text-left"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-purple-500" />
              </div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                {language === 'ru' ? 'Сегодня' : 'Today'}
              </span>
            </div>
            <p className="text-sm font-medium text-foreground line-clamp-1">
              {language === 'ru' ? mockEvent.titleRu : mockEvent.title}
            </p>
            <p className="text-xs text-primary mt-0.5">{mockEvent.time}</p>
          </button>

          {/* Daily Recommendation */}
          <button
            onClick={() => navigate(recommendation.path)}
            className="flex flex-col p-3 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all group text-left"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-lg">
                {recommendation.icon}
              </div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                {language === 'ru' ? 'Рекомендуем' : 'For You'}
              </span>
            </div>
            <p className="text-sm font-medium text-foreground line-clamp-1">
              {language === 'ru' ? recommendation.titleRu : recommendation.title}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {language === 'ru' ? recommendation.subtitleRu : recommendation.subtitle}
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
