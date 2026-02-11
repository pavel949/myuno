import React, { memo, useMemo } from 'react';
import { MapPin, AlertTriangle, Sun, Cloud, CloudRain } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { InlineSearch } from '@/components/search/InlineSearch';
import { useWeather } from '@/hooks/useWeather';
import { useIsDesktop } from '@/hooks/use-desktop';
import heroBg from '@/assets/hero-phuket-desktop.jpg';

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

  // Desktop: cinematic hero banner
  return (
    <div className="relative overflow-hidden rounded-2xl -mx-2">
      {/* Background image */}
      <img 
        src={heroBg} 
        alt="Phuket coastline" 
        className="w-full h-[280px] object-cover"
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
      
      {/* Content overlay */}
      <div className="absolute inset-0 flex items-end p-8">
        <div className="flex-1">
          <p className="text-white/70 text-sm font-medium mb-1 tracking-wide">
            {isRu ? 'Ваш дом на острове' : 'Your home away from home'}
          </p>
          <h1 className="text-3xl xl:text-4xl font-bold text-white leading-tight mb-2">
            {greeting}
          </h1>
          <div className="flex items-center gap-4 text-white/80 text-sm">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>{isRu ? 'Пхукет' : 'Phuket'}</span>
            </div>
            <span className="text-white/40">·</span>
            <div className="flex items-center gap-1.5">
              <WeatherIcon className="w-4 h-4" />
              <span>{weather?.temp || 31}°C</span>
            </div>
          </div>
        </div>

        {/* SOS button */}
        <Link 
          to="/sos" 
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 hover:bg-white/25 transition-all text-white"
        >
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-medium">SOS</span>
        </Link>
      </div>
    </div>
  );
});
