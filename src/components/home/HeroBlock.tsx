import React, { memo, useMemo, useCallback, useState } from 'react';
import { MapPin, Sun, Cloud, CloudRain, Calendar, Trophy, Flame, Search, ArrowRight,
  Plane, Home, Building2, TrendingUp, Baby, Heart, Music, Dumbbell, Briefcase, Laptop, PawPrint
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWeather } from '@/hooks/useWeather';
import { useIsDesktop } from '@/hooks/use-desktop';
import { useAuth } from '@/contexts/AuthContext';
import { useHeroData } from '@/hooks/useHeroData';
import { useUserPersonas, UserPersona, PERSONA_OPTIONS, PERSONA_INFO } from '@/hooks/useUserPersonas';
import { cn } from '@/lib/utils';
import { useIsDesktop } from '@/hooks/use-desktop';
import { useAuth } from '@/contexts/AuthContext';
import { useHeroData } from '@/hooks/useHeroData';
import { useUserPersonas, UserPersona, PERSONA_OPTIONS, PERSONA_INFO } from '@/hooks/useUserPersonas';
import { cn } from '@/lib/utils';

function HeroSearchInput({ isRu }: { isRu: boolean }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSubmit = useCallback(() => {
    const q = query.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
  }, [query, navigate]);

  return (
    <div className="flex items-center gap-2 rounded-[var(--radius-md)] px-4 py-3"
      style={{
        background: 'hsl(var(--bg-elevated))',
        border: '1px solid hsl(0 0% 100% / 0.07)',
      }}
    >
      <Search className="w-4 h-4 text-muted-foreground shrink-0" />
      <input
        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
        placeholder={isRu ? 'Поиск сервисов...' : 'Search services...'}
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
      />
      <button
        onClick={handleSubmit}
        aria-label={isRu ? 'Искать' : 'Search'}
        className="flex items-center justify-center w-8 h-8 rounded-[var(--radius-sm)] bg-primary text-primary-foreground shrink-0 hover:bg-primary-hover active:scale-95 transition-all"
      >
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function PersonaSwitcher({ isRu }: { isRu: boolean }) {
  const { personas, setPersonas, isSetting } = useUserPersonas();
  const activePersona = useMemo(() => personas[0] ?? ('tourist' as UserPersona), [personas]);

  return (
    <div className="w-full space-y-1.5">
      {/* Row 1: core 5 */}
      <div className="flex gap-1 rounded-[var(--radius-md)] p-1"
        style={{
          background: 'hsl(var(--bg-surface))',
          border: '1px solid hsl(0 0% 100% / 0.07)',
        }}
      >
        {PERSONA_OPTIONS.slice(0, 5).map((p) => {
          const info = PERSONA_INFO[p];
          const isActive = activePersona === p;
          return (
            <button
              key={p}
              onClick={() => setPersonas([p])}
              disabled={isSetting}
              className={cn(
                "flex-1 min-w-0 px-1.5 py-2 rounded-[var(--radius-sm)] text-[11px] font-semibold transition-all duration-200 whitespace-nowrap flex items-center justify-center gap-1",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="text-[13px]">{info.icon}</span>
              <span className="hidden sm:inline">{isRu ? info.labelRu : info.labelEn}</span>
            </button>
          );
        })}
      </div>
      {/* Row 2: lifestyle 5 */}
      <div className="flex gap-1 rounded-[var(--radius-md)] p-1"
        style={{
          background: 'hsl(var(--bg-surface))',
          border: '1px solid hsl(0 0% 100% / 0.07)',
        }}
      >
        {PERSONA_OPTIONS.slice(5).map((p) => {
          const info = PERSONA_INFO[p];
          const isActive = activePersona === p;
          return (
            <button
              key={p}
              onClick={() => setPersonas([p])}
              disabled={isSetting}
              className={cn(
                "flex-1 min-w-0 px-1.5 py-2 rounded-[var(--radius-sm)] text-[11px] font-semibold transition-all duration-200 whitespace-nowrap flex items-center justify-center gap-1",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="text-[13px]">{info.icon}</span>
              <span className="hidden sm:inline">{isRu ? info.labelRu : info.labelEn}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const HeroBlock = memo(function HeroBlock() {
  const { language } = useLanguage();
  const { data: weather } = useWeather();
  const { user } = useAuth();
  const isDesktop = useIsDesktop();
  const isRu = language === 'ru';

  const { data: heroData } = useHeroData(user?.id);
  const { firstName, loyaltyTier, activityStreak } = heroData ?? {
    firstName: null, loyaltyTier: null, activityStreak: 0,
  };

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const name = firstName ? `, ${firstName}` : '';
    if (hour < 12) return (isRu ? 'Доброе утро' : 'Good morning') + name;
    if (hour < 18) return (isRu ? 'Добрый день' : 'Good afternoon') + name;
    return (isRu ? 'Добрый вечер' : 'Good evening') + name;
  }, [isRu, firstName]);

  const WeatherIcon = weather?.condition === 'rainy' ? CloudRain 
    : weather?.condition === 'cloudy' ? Cloud : Sun;

  const now = new Date();
  const dayName = now.toLocaleDateString(isRu ? 'ru-RU' : 'en-US', { weekday: 'short' });
  const dateStr = now.toLocaleDateString(isRu ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short' });

  if (!isDesktop) {
    return (
      <div className="relative rounded-[var(--radius-lg)] overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, hsl(216 60% 7%) 0%, hsl(214 50% 14%) 100%)'
        }} />
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, hsl(0 0% 100%) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />
        
        <div className="relative px-4 py-6 space-y-4">
          {/* Location + SOS */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="font-medium text-foreground">{isRu ? 'Пхукет' : 'Phuket'}</span>
              <span className="text-muted-foreground/40">·</span>
              <WeatherIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{weather?.temp || 31}°</span>
              <span className="text-muted-foreground/40">·</span>
              <span className="capitalize">{dayName}, {dateStr}</span>
            </div>
            <Link 
              to="/sos" 
              className="sos-pulse flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-full)] shrink-0 min-w-[44px] min-h-[44px] justify-center"
              style={{
                background: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.4)',
              }}
            >
              <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              <span className="text-[11px] font-semibold text-warning">SOS</span>
            </Link>
          </div>
          
          {/* Greeting */}
          <div className="anim-hero">
            <h1 className="text-2xl font-bold text-foreground leading-tight font-display">{greeting}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {user 
                ? (isRu ? 'Чем можем помочь сегодня?' : 'How can we help today?')
                : (isRu ? 'Всё для жизни за рубежом' : 'One place for everything abroad')}
            </p>
            
            {user && (loyaltyTier || (activityStreak && activityStreak > 0)) && (
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {loyaltyTier && (
                  <Link to="/wallet" className="flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-full)] text-xs min-h-[44px]"
                    style={{ background: 'hsl(0 0% 100% / 0.07)', border: '1px solid hsl(0 0% 100% / 0.1)' }}
                  >
                    <Trophy className="w-3 h-3 text-primary" />
                    <span className="font-medium text-foreground">{loyaltyTier.name}</span>
                    <span className="text-muted-foreground">{loyaltyTier.cashback}%</span>
                  </Link>
                )}
                {activityStreak && activityStreak > 0 ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-full)] text-xs min-h-[44px]"
                    style={{ background: 'hsl(0 0% 100% / 0.07)', border: '1px solid hsl(0 0% 100% / 0.1)' }}
                  >
                    <Flame className="w-3 h-3 text-warning" />
                    <span className="font-medium text-foreground">
                      {activityStreak} {isRu ? 'заказов' : 'orders'}
                    </span>
                  </div>
                ) : null}
              </div>
            )}
          </div>
          
          <PersonaSwitcher isRu={isRu} />
          <HeroSearchInput isRu={isRu} />
        </div>
      </div>
    );
  }

  // Desktop
  return (
    <div className="relative rounded-[var(--radius-lg)] overflow-hidden p-8 xl:p-10" style={{ boxShadow: 'var(--shadow-card)' }}>
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(135deg, hsl(216 60% 7%) 0%, hsl(214 50% 14%) 100%)'
      }} />
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: 'radial-gradient(circle at 2px 2px, hsl(0 0% 100%) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }} />
      
      <div className="relative flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <p className="text-[15px] text-muted-foreground font-medium">
            {isRu ? 'Всё для жизни за рубежом — в одном месте' : 'One place for everything abroad'}
          </p>
          <h1 className="text-4xl xl:text-5xl font-bold text-foreground leading-tight font-display">
            {greeting}
          </h1>
          <div className="flex items-center gap-5 text-muted-foreground text-[15px] pt-1">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span className="font-medium text-foreground">{isRu ? 'Пхукет' : 'Phuket'}</span>
            </div>
            <span className="text-muted-foreground/30">·</span>
            <div className="flex items-center gap-1.5">
              <WeatherIcon className="w-4 h-4" />
              <span>{weather?.temp || 31}°C</span>
            </div>
            <span className="text-muted-foreground/30">·</span>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span className="capitalize">{dayName}, {dateStr}</span>
            </div>
            {loyaltyTier && (
              <>
                <span className="text-muted-foreground/30">·</span>
                <Link to="/wallet" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                  <Trophy className="w-4 h-4 text-primary" />
                  <span className="font-medium text-foreground">{loyaltyTier.name}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-[var(--radius-full)]"
                    style={{ background: 'hsl(var(--primary) / 0.12)' }}
                  >{loyaltyTier.cashback}% cashback</span>
                </Link>
              </>
            )}
            {activityStreak && activityStreak > 0 ? (
              <>
                <span className="text-muted-foreground/30">·</span>
                <div className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-warning" />
                  <span>{activityStreak} {isRu ? 'заказов за 30д' : 'orders in 30d'}</span>
                </div>
              </>
            ) : null}
          </div>
          <div className="pt-3 max-w-2xl">
            <PersonaSwitcher isRu={isRu} />
          </div>
        </div>

        <Link 
          to="/sos" 
          className="sos-pulse flex items-center gap-2 px-4 py-2 rounded-[var(--radius-full)] transition-all hover:scale-105"
          style={{
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.4)',
          }}
        >
          <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
          <span className="text-sm font-semibold text-foreground">SOS</span>
        </Link>
      </div>
    </div>
  );
});
