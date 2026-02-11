import React, { memo, useMemo } from 'react';
import { MapPin, AlertTriangle, Sun, Cloud, CloudRain, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { InlineSearch } from '@/components/search/InlineSearch';
import { useWeather } from '@/hooks/useWeather';
import { useIsDesktop } from '@/hooks/use-desktop';

/**
 * HeroBlock — "Welcome Home" hero
 * Mobile: Location + Greeting + Search + SOS (unchanged)
 * Desktop: Full-width photo banner with greeting, weather, and tagline overlay
 */
export const HeroBlock = memo(function HeroBlock() {
  const { language } = useLanguage();
  const { data: weather } = useWeather();
  const isDesktop = useIsDesktop();
  const isRu = language === 'ru';

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return isRu ? 'Доброе утро' : 'Good morning';
    if (hour < 18) return isRu ? 'Добрый день' : 'Good afternoon';
    return isRu ? 'Добрый вечер' : 'Good evening';
  }, [isRu]);

  const WeatherIcon = weather?.condition === 'rainy' ? CloudRain 
    : weather?.condition === 'cloudy' ? Cloud : Sun;

  // Mobile: compact layout (unchanged)
  if (!isDesktop) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            <span className="font-medium">{isRu ? 'Пхукет' : 'Phuket'}</span>
          </div>
          <Link 
            to="/sos" 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive/8 border border-destructive/20 hover:bg-destructive/12 active:scale-[0.97] transition-all"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
            <span className="text-[11px] font-semibold text-destructive">SOS</span>
          </Link>
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground leading-tight">{greeting}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isRu ? 'Чем можем помочь сегодня?' : 'How can we help today?'}
          </p>
        </div>
        <div className="lg:hidden">
          <InlineSearch />
        </div>
      </div>
    );
  }

  // Desktop: clean dashboard greeting — no background photo
  const now = new Date();
  const dayName = now.toLocaleDateString(isRu ? 'ru-RU' : 'en-US', { weekday: 'long' });
  const dateStr = now.toLocaleDateString(isRu ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'long' });

  return (
    <div className="rounded-2xl bg-muted/30 border border-border/50 p-8 xl:p-10">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-[15px] text-muted-foreground font-medium">
            {isRu ? 'Ваш дом на острове' : 'Your home away from home'}
          </p>
          <h1 className="text-4xl xl:text-5xl font-bold text-foreground leading-tight font-display">
            {greeting}
          </h1>
          <div className="flex items-center gap-5 text-muted-foreground text-[15px] pt-1">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="font-medium">{isRu ? 'Пхукет' : 'Phuket'}</span>
            </div>
            <span className="text-border">·</span>
            <div className="flex items-center gap-1.5">
              <WeatherIcon className="w-4 h-4" />
              <span>{weather?.temp || 31}°C</span>
            </div>
            <span className="text-border">·</span>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span className="capitalize">{dayName}, {dateStr}</span>
            </div>
          </div>
        </div>

        {/* SOS pill */}
        <Link 
          to="/sos" 
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-all"
        >
          <AlertTriangle className="w-4 h-4 text-destructive" />
          <span className="text-sm font-semibold text-destructive">SOS</span>
        </Link>
      </div>
    </div>
  );
});
