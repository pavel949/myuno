import { memo, useMemo, useCallback, useState } from 'react';
import { MapPin, AlertTriangle, Sun, Cloud, CloudRain, Calendar, Trophy, Flame, Search, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWeather } from '@/hooks/useWeather';
import { useIsDesktop } from '@/hooks/use-desktop';
import { useAuth } from '@/contexts/AuthContext';
import { useHeroData } from '@/hooks/useHeroData';
import { useUserPersonas, UserPersona, PERSONA_INFO } from '@/hooks/useUserPersonas';
import { cn } from '@/lib/utils';


const PERSONA_OPTIONS: UserPersona[] = ['tourist', 'resident', 'property_owner', 'investor'];

/** Inline search bar that navigates to /search?q=... */
function HeroSearchInput({ isRu }: { isRu: boolean }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSubmit = useCallback(() => {
    const q = query.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
  }, [query, navigate]);

  return (
    <div className="flex items-center gap-2 bg-background/95 backdrop-blur-sm rounded-xl px-3 py-2.5 shadow-sm border border-border/40">
      <Search className="w-4 h-4 text-muted-foreground shrink-0" />
      <input
        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
        placeholder={isRu ? 'Ищите что угодно...' : 'Search anything...'}
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
      />
      <button
        onClick={handleSubmit}
        aria-label={isRu ? 'Искать' : 'Search'}
        className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary text-primary-foreground shrink-0 transition-opacity hover:opacity-90 active:scale-95"
      >
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

/** Compact 2×2 persona switcher with multi-select */
function PersonaSwitcher({ isRu }: { isRu: boolean }) {
  const { personas, setPersonas, isSetting } = useUserPersonas();

  const activePersona = useMemo(() => {
    return personas[0] ?? ('tourist' as UserPersona);
  }, [personas]);

  return (
    <div className="grid grid-cols-2 gap-2">
      {PERSONA_OPTIONS.map((p) => {
        const info = PERSONA_INFO[p];
        const isActive = activePersona === p;
        return (
          <button
            key={p}
            onClick={() => setPersonas([p])}
            disabled={isSetting}
            className={cn(
              "relative flex items-center gap-2.5 px-3 py-3 rounded-xl text-left transition-all duration-200",
              "focus-visible:ring-2 focus-visible:ring-primary/50",
              isActive
                ? "bg-card shadow-lg border border-border scale-[1.01]"
                : "bg-card/10 border border-card/15 hover:bg-card/20 hover:border-card/25"
            )}
          >
            <span className="text-xl shrink-0">{info.icon}</span>
            <div className="min-w-0 flex-1">
              <span className={cn(
                "block text-[13px] font-bold leading-tight",
                isActive ? "text-foreground" : "text-primary-foreground"
              )}>
                {isRu ? info.labelRu : info.labelEn}
              </span>
              <span className={cn(
                "block text-[11px] leading-tight mt-0.5",
                isActive ? "text-muted-foreground" : "text-primary-foreground/80"
              )}>
                {isRu ? info.descRu : info.descEn}
              </span>
            </div>
            {isActive && (
              <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-primary shadow-sm" />
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * HeroBlock — personalized "Welcome Home" hero
 * Shows user name, loyalty tier, and activity streak when logged in
 */
export const HeroBlock = memo(function HeroBlock() {
  const { language } = useLanguage();
  const { data: weather } = useWeather();
  const { user } = useAuth();
  const isDesktop = useIsDesktop();
  const isRu = language === 'ru';

  // Single parallel query replacing 3 separate round-trips
  const { data: heroData } = useHeroData(user?.id);
  const { firstName, loyaltyTier, activityStreak } = heroData ?? {
    firstName: null,
    loyaltyTier: null,
    activityStreak: 0,
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

  const { dayName, dateStr } = useMemo(() => {
    const now = new Date();
    return {
      dayName: now.toLocaleDateString(isRu ? 'ru-RU' : 'en-US', { weekday: 'short' }),
      dateStr: now.toLocaleDateString(isRu ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short' }),
    };
  }, [isRu]);

  // Mobile
  if (!isDesktop) {
    return (
    <div className="hero-on-dark relative rounded-2xl overflow-hidden shadow-[var(--shadow-elevated)]">
        {/* Hero gradient — uses CSS vars for theme consistency */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, hsl(var(--icon-dark)) 0%, hsl(225 40% 16%) 40%, hsl(230 45% 24%) 100%)'
        }} />
        {/* Subtle texture overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />
        
        <div className="relative px-5 py-5 space-y-4">
          {/* Location + SOS */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-white/70">
              <MapPin className="w-3.5 h-3.5 text-white/80" />
              <span className="font-medium text-white/90">{isRu ? 'Пхукет' : 'Phuket'}</span>
              <span className="text-white/30">·</span>
              <WeatherIcon className="w-3.5 h-3.5 text-white/80" />
              <span>{weather?.temp || 31}°</span>
              <span className="text-white/30">·</span>
              <span className="capitalize">{dayName}, {dateStr}</span>
            </div>
            <Link 
              to="/sos" 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 border border-white/20 hover:bg-white/25 active:scale-[0.97] transition-all"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-white" />
              <span className="text-[11px] font-semibold text-white">SOS</span>
            </Link>
          </div>
          
          {/* Greeting */}
          <div>
            <h1 className="text-2xl font-bold text-white leading-tight">{greeting}</h1>
            <p className="text-sm text-white/60 mt-1">
              {user 
                ? (isRu ? 'Чем можем помочь сегодня?' : 'How can we help today?')
                : (isRu ? 'Всё для жизни за рубежом — в одном месте' : 'One place for everything abroad')}
            </p>
            
            {/* Loyalty + streak chips */}
            {user && (loyaltyTier || (activityStreak && activityStreak > 0)) && (
              <div className="flex items-center gap-2 mt-3">
                {loyaltyTier && (
                  <Link to="/wallet" className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 border border-white/20 text-xs">
                    <Trophy className="w-3 h-3 text-white" />
                    <span className="font-medium text-white">{loyaltyTier.name}</span>
                    <span className="text-white/60">{loyaltyTier.cashback}%</span>
                  </Link>
                )}
                {activityStreak && activityStreak > 0 ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 border border-white/20 text-xs">
                    <Flame className="w-3 h-3" style={{ color: 'hsl(var(--warning))' }} />
                    <span className="font-medium text-white">
                      {activityStreak} {isRu ? 'заказов' : 'orders'}
                    </span>
                  </div>
                ) : null}
              </div>
            )}
          </div>
          
          {/* Persona switcher */}
          <PersonaSwitcher isRu={isRu} />
          
          {/* Search */}
          <HeroSearchInput isRu={isRu} />
        </div>
      </div>
    );
  }

  // Desktop
  return (
    <div className="hero-on-dark relative rounded-2xl overflow-hidden p-8 xl:p-10 shadow-[var(--shadow-elevated)]">
      {/* Hero gradient — uses CSS vars for theme consistency */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(135deg, hsl(var(--icon-dark)) 0%, hsl(225 40% 16%) 40%, hsl(230 45% 24%) 100%)'
      }} />
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }} />
      
      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-[15px] text-white/85 font-medium">
            {isRu ? 'Всё для жизни за рубежом — в одном месте' : 'One place for everything abroad'}
          </p>
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight font-display">
            {greeting}
          </h1>
          <div className="flex items-center gap-5 text-white/80 text-[15px] pt-1">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-white/80" />
              <span className="font-medium text-white/90">{isRu ? 'Пхукет' : 'Phuket'}</span>
            </div>
            <span className="text-white/20">·</span>
            <div className="flex items-center gap-1.5">
              <WeatherIcon className="w-4 h-4 text-white/70" />
              <span>{weather?.temp || 31}°C</span>
            </div>
            <span className="text-white/20">·</span>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-white/70" />
              <span className="capitalize">{dayName}, {dateStr}</span>
            </div>
            {loyaltyTier && (
              <>
                <span className="text-white/20">·</span>
                <Link to="/wallet" className="flex items-center gap-1.5 hover:text-white transition-colors">
                  <Trophy className="w-4 h-4 text-white/80" />
                  <span className="font-medium text-white/90">{loyaltyTier.name}</span>
                  <span className="text-xs bg-white/15 text-white px-1.5 py-0.5 rounded-full">{loyaltyTier.cashback}% cashback</span>
                </Link>
              </>
            )}
            {activityStreak && activityStreak > 0 ? (
              <>
                <span className="text-white/20">·</span>
                <div className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4" style={{ color: 'hsl(var(--warning))' }} />
                  <span>{activityStreak} {isRu ? 'заказов за 30д' : 'orders in 30d'}</span>
                </div>
              </>
            ) : null}
          </div>
          <div className="pt-3">
            <PersonaSwitcher isRu={isRu} />
          </div>
        </div>

        <Link 
          to="/sos" 
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 transition-all"
        >
          <AlertTriangle className="w-4 h-4 text-white" />
          <span className="text-sm font-semibold text-white">SOS</span>
        </Link>
      </div>
    </div>
  );
});
