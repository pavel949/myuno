import React, { memo, useState, useCallback } from 'react';
import { MapPin, Sun, Cloud, CloudRain, Search, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWeather } from '@/hooks/useWeather';
import { cn } from '@/lib/utils';

export const WelcomeHero = memo(function WelcomeHero() {
  const { language, setLanguage } = useLanguage();
  const { data: weather } = useWeather();
  const isRu = language === 'ru';
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = useCallback(() => {
    const q = query.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
  }, [query, navigate]);

  const WeatherIcon = weather?.condition === 'rainy' ? CloudRain
    : weather?.condition === 'cloudy' ? Cloud : Sun;

  const now = new Date();
  const dayName = now.toLocaleDateString(isRu ? 'ru-RU' : 'en-US', { weekday: 'short' });
  const dateStr = now.toLocaleDateString(isRu ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short' });

  return (
    <div className="relative rounded-none overflow-hidden hero-block" style={{ boxShadow: 'var(--shadow-card)' }}>
      <div className="absolute inset-0 hero-bg" />
      <div className="absolute inset-0 hero-dots" />

      <div className="relative px-5 py-6 md:px-8 md:py-10 space-y-5">
        {/* Top bar: location + language */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="font-medium text-foreground">{isRu ? 'Пхукет' : 'Phuket'}</span>
            <span className="text-muted-foreground/40">&middot;</span>
            <WeatherIcon className="w-3.5 h-3.5 shrink-0" />
            <span>{weather?.temp || 31}&deg;</span>
            <span className="text-muted-foreground/40">&middot;</span>
            <span className="capitalize">{dayName}, {dateStr}</span>
          </div>

          <div className="flex items-center gap-1">
            {(['ru', 'en'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={cn(
                  "px-2.5 py-1 rounded-[var(--radius-full)] text-[11px] font-semibold uppercase transition-all min-h-[32px]",
                  language === lang
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* Headline */}
        <div className="max-w-lg">
          <h1 className="text-3xl md:text-[2.5rem] font-bold text-foreground leading-tight font-display">
            {isRu ? 'Одна платформа для жизни на Пхукете' : 'One platform for life in Phuket'}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2 leading-relaxed">
            {isRu
              ? '40+ сервисов — от трансфера из аэропорта до покупки недвижимости'
              : '40+ services — from airport transfer to buying property'}
          </p>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 rounded-none px-4 py-3"
          style={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
          }}
        >
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            placeholder={isRu ? 'Трансфер, виза, клининг...' : 'Transfer, visa, cleaning...'}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            aria-label={isRu ? 'Искать' : 'Search'}
            className="flex items-center justify-center w-8 h-8 rounded-none bg-primary text-primary-foreground shrink-0 hover:bg-primary-hover active:scale-95 transition-all"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
});
