import React, { memo, useMemo, useCallback, useState, useEffect } from 'react';
import { MapPin, Sun, Cloud, CloudRain, Calendar, Trophy, Flame, Search, ArrowRight, Plane } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWeather } from '@/hooks/useWeather';
import { useIsDesktop } from '@/hooks/use-desktop';
import { useAuth } from '@/contexts/AuthContext';
import { useHeroData } from '@/hooks/useHeroData';
import {
  useUserPersonas, UserPersona,
  PERSONA_OPTIONS, PERSONA_INFO, PERSONA_ICONS, PERSONA_GRADIENTS,
} from '@/hooks/useUserPersonas';
import { APP_ROUTES } from '@/lib/config/routes';
import { cn } from '@/lib/utils';

function HeroSearchInput({ isRu }: { isRu: boolean }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSubmit = useCallback(() => {
    const q = query.trim();
    navigate(q ? `${APP_ROUTES.SEARCH}?q=${encodeURIComponent(q)}` : APP_ROUTES.SEARCH);
  }, [query, navigate]);

  return (
    <div
      className="flex items-center gap-2 rounded-[var(--radius-md)] px-4 py-3 bg-[hsl(var(--bg-elevated))] border border-border focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background transition-shadow"
    >
      <Search className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden />
      <input
        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
        placeholder={isRu ? 'Поиск сервисов...' : 'Search services...'}
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        aria-label={isRu ? 'Поиск сервисов' : 'Search services'}
      />
      <button
        onClick={handleSubmit}
        aria-label={isRu ? 'Искать' : 'Search'}
        className="flex items-center justify-center w-9 h-9 rounded-[var(--radius-sm)] bg-primary text-primary-foreground shrink-0 hover:bg-primary-hover active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function PersonaSwitcher({ isRu, layout }: { isRu: boolean; layout: 'scroll' | 'wrap' }) {
  const { personas, setPersonas, isSetting } = useUserPersonas();
  const [pendingPersona, setPendingPersona] = useState<UserPersona | null>(null);

  useEffect(() => {
    if (!isSetting) setPendingPersona(null);
  }, [isSetting]);

  const activePersona = useMemo(() => {
    if (isSetting && pendingPersona) return pendingPersona;
    return personas[0] ?? ('tourist' as UserPersona);
  }, [isSetting, pendingPersona, personas]);

  const isWrap = layout === 'wrap';

  return (
    <div
      className={cn(
        'w-full min-w-0',
        !isWrap &&
          'overflow-x-auto overflow-y-hidden scrollbar-hide snap-x snap-mandatory scroll-pl-3 scroll-pr-3 -mx-1 px-1 pb-1'
      )}
    >
      <div
        className={cn(
          'flex gap-2 py-1',
          isWrap ? 'flex-wrap' : 'flex-nowrap w-max'
        )}
      >
        {PERSONA_OPTIONS.map((p) => {
          const info = PERSONA_INFO[p];
          const Icon = PERSONA_ICONS[info.icon] || Plane;
          const isActive = activePersona === p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => {
                setPendingPersona(p);
                setPersonas([p]);
              }}
              disabled={isSetting}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 min-h-10 rounded-[var(--radius-full)] shrink-0 transition-all duration-200 border',
                !isWrap && 'snap-start',
                isActive
                  ? 'shadow-lg ring-1 ring-white/20 text-white border-white/30'
                  : 'text-foreground/90 hover:text-foreground border-white/15'
              )}
              style={{
                background: isActive
                  ? PERSONA_GRADIENTS[p]
                  : 'hsl(var(--muted) / 0.92)',
                backdropFilter: isActive ? 'none' : 'blur(8px)',
              }}
            >
              <Icon className="w-4 h-4 shrink-0" strokeWidth={2} aria-hidden />
              <span
                className={cn(
                  'text-[11px] sm:text-xs font-semibold leading-none whitespace-nowrap',
                  isActive ? 'text-white' : ''
                )}
              >
                {isRu ? info.labelRu : info.labelEn}
              </span>
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

  // Force Phuket timezone (UTC+7) so greeting/date match the user's actual location
  const phuketNow = useMemo(() => {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Bangkok',
      hour: 'numeric',
      hour12: false,
    });
    const hour = parseInt(fmt.format(new Date()), 10);
    return { hour, date: new Date() };
  }, []);

  const greeting = useMemo(() => {
    const name = firstName ? `, ${firstName}` : '';
    if (phuketNow.hour < 12) return (isRu ? 'Доброе утро' : 'Good morning') + name;
    if (phuketNow.hour < 18) return (isRu ? 'Добрый день' : 'Good afternoon') + name;
    return (isRu ? 'Добрый вечер' : 'Good evening') + name;
  }, [isRu, firstName, phuketNow.hour]);

  const WeatherIcon = weather?.condition === 'rainy' ? CloudRain
    : weather?.condition === 'cloudy' ? Cloud : Sun;

  const dayName = phuketNow.date.toLocaleDateString(isRu ? 'ru-RU' : 'en-US', { weekday: 'short', timeZone: 'Asia/Bangkok' });
  const dateStr = phuketNow.date.toLocaleDateString(isRu ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short', timeZone: 'Asia/Bangkok' });

  if (!isDesktop) {
    return (
      <div className="relative rounded-[var(--radius-lg)] overflow-hidden hero-dark-surface bg-gradient-to-br from-[hsl(var(--bg-base))] to-[hsl(var(--bg-card))]" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} aria-hidden />
        
        <div className="relative px-4 py-6 space-y-4">
          {/* Location + SOS */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden />
              <span className="font-medium text-foreground">{isRu ? 'Пхукет' : 'Phuket'}</span>
              <span className="text-muted-foreground/40" aria-hidden>·</span>
              <WeatherIcon className="w-3.5 h-3.5 shrink-0" aria-hidden />
              <span>{weather?.temp || 31}°</span>
              <span className="text-muted-foreground/40" aria-hidden>·</span>
              <span className="capitalize">{dayName}, {dateStr}</span>
            </div>
            <Link 
              to={APP_ROUTES.SOS}
              aria-label="SOS"
              className="sos-pulse flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-full)] shrink-0 min-w-[44px] min-h-[44px] justify-center bg-destructive/15 border border-destructive/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2"
            >
              <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" aria-hidden />
              <span className="text-[11px] font-semibold text-destructive">SOS</span>
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
                  <Link to="/wallet" className="flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-full)] text-xs min-h-[36px] bg-muted border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <Trophy className="w-3 h-3 text-primary" aria-hidden />
                    <span className="font-medium text-foreground">{loyaltyTier.name}</span>
                    <span className="text-muted-foreground">{loyaltyTier.cashback}%</span>
                  </Link>
                )}
                {activityStreak && activityStreak > 0 ? (
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-full)] text-xs min-h-[36px] bg-muted border border-border"
                  >
                    <Flame className="w-3 h-3 text-warning" aria-hidden />
                    <span className="font-medium text-foreground">
                      {activityStreak} {isRu ? 'заказов' : 'orders'}
                    </span>
                  </div>
                ) : null}
              </div>
            )}
          </div>
          
          <PersonaSwitcher isRu={isRu} layout="scroll" />
          <HeroSearchInput isRu={isRu} />
        </div>
      </div>
    );
  }

  // Desktop
  return (
    <div className="relative rounded-[var(--radius-lg)] overflow-hidden p-8 xl:p-10 hero-dark-surface bg-gradient-to-br from-[hsl(var(--bg-base))] to-[hsl(var(--bg-card))]" style={{ boxShadow: 'var(--shadow-card)' }}>
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: 'radial-gradient(circle at 2px 2px, hsl(var(--foreground)) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }} aria-hidden />
      
      <div className="relative flex items-start justify-between gap-6">
        <div className="space-y-3 flex-1 min-w-0 pr-2">
          <p className="text-[15px] text-muted-foreground font-medium">
            {isRu ? 'Всё для жизни за рубежом — в одном месте' : 'One place for everything abroad'}
          </p>
          <h1 className="text-4xl xl:text-5xl font-bold text-foreground leading-tight font-display">
            {greeting}
          </h1>
          <div className="flex items-center gap-5 text-muted-foreground text-[15px] pt-1">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" aria-hidden />
              <span className="font-medium text-foreground">{isRu ? 'Пхукет' : 'Phuket'}</span>
            </div>
            <span className="text-muted-foreground/30" aria-hidden>·</span>
            <div className="flex items-center gap-1.5">
              <WeatherIcon className="w-4 h-4" aria-hidden />
              <span>{weather?.temp || 31}°C</span>
            </div>
            <span className="text-muted-foreground/30" aria-hidden>·</span>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" aria-hidden />
              <span className="capitalize">{dayName}, {dateStr}</span>
            </div>
            {loyaltyTier && (
              <>
                <span className="text-muted-foreground/30" aria-hidden>·</span>
                <Link to="/wallet" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                  <Trophy className="w-4 h-4 text-primary" aria-hidden />
                  <span className="font-medium text-foreground">{loyaltyTier.name}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-[var(--radius-full)] bg-primary/10"
                  >{loyaltyTier.cashback}% cashback</span>
                </Link>
              </>
            )}
            {activityStreak && activityStreak > 0 ? (
              <>
                <span className="text-muted-foreground/30" aria-hidden>·</span>
                <div className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-warning" aria-hidden />
                  <span>{activityStreak} {isRu ? 'заказов за 30д' : 'orders in 30d'}</span>
                </div>
              </>
            ) : null}
          </div>
          <div className="pt-3 w-full min-w-0">
            <PersonaSwitcher isRu={isRu} layout="wrap" />
          </div>
        </div>

        <Link 
          to={APP_ROUTES.SOS}
          aria-label="SOS"
          className="sos-pulse flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-[var(--radius-full)] transition-all hover:scale-105 bg-destructive/15 border border-destructive/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2"
        >
          <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" aria-hidden />
          <span className="text-sm font-semibold text-destructive">SOS</span>
        </Link>
      </div>
    </div>
  );
});
