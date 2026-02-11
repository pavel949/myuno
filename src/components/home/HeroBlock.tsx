import React, { memo, useMemo } from 'react';
import { MapPin, AlertTriangle, Sun, Cloud, CloudRain, Calendar, Trophy, Flame, Bell, Wind, Droplets } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { InlineSearch } from '@/components/search/InlineSearch';
import { useWeather } from '@/hooks/useWeather';
import { useIsDesktop } from '@/hooks/use-desktop';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * HeroBlock — personalized "Welcome Home" hero
 * Mobile: Dark navy gradient header matching Figma spec
 * Desktop: Clean card-based hero
 */
export const HeroBlock = memo(function HeroBlock() {
  const { language } = useLanguage();
  const { data: weather } = useWeather();
  const { user } = useAuth();
  const isDesktop = useIsDesktop();
  const isRu = language === 'ru';

  // Fetch profile + loyalty in parallel
  const { data: profile } = useQuery({
    queryKey: ['hero-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: loyaltyTier } = useQuery({
    queryKey: ['hero-loyalty-tier', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      try {
        const { data } = await supabase
          .rpc('get_or_create_loyalty_status', { p_user_id: user.id });
        const parsed = data as any;
        return parsed?.current_tier ? {
          name: parsed.current_tier.tier_name,
          icon: parsed.current_tier.icon,
          color: parsed.current_tier.color,
          cashback: parsed.current_tier.cashback_percent,
        } : null;
      } catch { return null; }
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000,
  });

  const { data: activityStreak } = useQuery({
    queryKey: ['hero-streak', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const { count } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('customer_user_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString());
      return count || 0;
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000,
  });

  const firstName = useMemo(() => {
    if (!profile?.full_name) return null;
    return profile.full_name.split(' ')[0];
  }, [profile]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return isRu ? 'Доброе утро' : 'Good morning';
    if (hour < 18) return isRu ? 'Добрый день' : 'Good afternoon';
    return isRu ? 'Добрый вечер' : 'Good evening';
  }, [isRu]);

  const WeatherIcon = weather?.condition === 'rainy' ? CloudRain 
    : weather?.condition === 'cloudy' ? Cloud : Sun;

  const langCode = isRu ? 'RU' : 'TH';

  // Mobile — Dark navy header matching Figma
  if (!isDesktop) {
    return (
      <div className="-mx-4 -mt-5">
        {/* Navy gradient header */}
        <div className="relative bg-hero-navy overflow-hidden">
          {/* Gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0f223a] via-[#152d45] to-[#1a3a54] opacity-90" />
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/[0.03] rounded-full -translate-y-1/2 translate-x-1/4" />
          
          <div className="relative z-10 px-5 pt-12 pb-16">
            {/* Top row: Location + actions */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-white/60" />
                <span className="text-[13px] text-white/80 font-medium">
                  {isRu ? 'Пхукет, Таиланд' : 'Phuket, Thailand'}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <Link
                  to="/notifications"
                  className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10"
                >
                  <Bell className="w-4.5 h-4.5 text-white/80" />
                </Link>
                <Link
                  to="/account/settings"
                  className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10"
                >
                  <span className="text-xs font-bold text-white/80">{langCode}</span>
                </Link>
              </div>
            </div>

            {/* Greeting + Name */}
            <div>
              <p className="text-sm text-emerald-400/90 font-medium">{greeting}</p>
              <h1 className="text-3xl font-bold text-white mt-1 font-display">
                {firstName || (isRu ? 'Гость' : 'Guest')}
              </h1>
              <p className="text-sm text-white/50 mt-1">
                {isRu ? 'Ваш персональный консьерж' : 'Your personal concierge'}
              </p>
            </div>
          </div>
        </div>

        {/* Weather card — floating overlap */}
        <div className="px-4 -mt-8 relative z-20">
          <div className="bg-card rounded-2xl border border-border/60 shadow-lg p-4">
            <div className="flex items-center gap-4">
              {/* Weather icon + temp */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                  <WeatherIcon className="w-7 h-7 text-amber-500" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">
                    {isRu ? 'Погода на Пхукете' : 'Weather in Phuket'}
                  </p>
                  <p className="text-3xl font-bold text-foreground leading-none mt-0.5">
                    {weather?.temp || 31}°
                  </p>
                </div>
              </div>

              {/* Condition + details */}
              <div className="ml-auto text-right">
                <p className="text-sm font-semibold text-foreground capitalize">
                  {weather?.condition === 'rainy'
                    ? (isRu ? 'Дождь' : 'Rainy')
                    : weather?.condition === 'cloudy'
                    ? (isRu ? 'Облачно' : 'Cloudy')
                    : (isRu ? 'Солнечно' : 'Sunny')}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  H: {(weather?.temp || 31) + 3}° • L: {(weather?.temp || 31) - 4}°
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {isRu ? 'Ощущ.' : 'Feels like'} {(weather?.temp || 31) + 2}°
                </p>
              </div>
            </div>

            {/* Bottom stats row */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
              <div className="text-center flex-1">
                <p className="text-[10px] text-muted-foreground">{isRu ? 'Ветер' : 'Wind'}</p>
                <p className="text-xs font-semibold text-foreground mt-0.5">
                  12 {isRu ? 'км/ч' : 'km/h'}
                </p>
              </div>
              <div className="text-center flex-1 border-x border-border/50">
                <p className="text-[10px] text-muted-foreground">{isRu ? 'Влажность' : 'Humidity'}</p>
                <p className="text-xs font-semibold text-foreground mt-0.5">68%</p>
              </div>
              <div className="text-center flex-1">
                <p className="text-[10px] text-muted-foreground">{isRu ? 'UV индекс' : 'UV Index'}</p>
                <p className="text-xs font-semibold text-foreground mt-0.5">
                  8 {isRu ? 'Высокий' : 'High'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search below weather */}
        <div className="px-4 mt-4">
          <InlineSearch />
        </div>
      </div>
    );
  }

  // Desktop — unchanged
  const now = new Date();
  const dayName = now.toLocaleDateString(isRu ? 'ru-RU' : 'en-US', { weekday: 'long' });
  const dateStr = now.toLocaleDateString(isRu ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'long' });
  const displayGreeting = firstName ? `${greeting}, ${firstName}` : greeting;

  return (
    <div className="rounded-2xl bg-muted/30 border border-border/50 p-8 xl:p-10">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-[15px] text-muted-foreground font-medium">
            {isRu ? 'Ваш дом на острове' : 'Your home away from home'}
          </p>
          <h1 className="text-4xl xl:text-5xl font-bold text-foreground leading-tight font-display">
            {displayGreeting}
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
            {loyaltyTier && (
              <>
                <span className="text-border">·</span>
                <Link to="/wallet" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                  <Trophy className="w-4 h-4 text-primary" />
                  <span className="font-medium">{loyaltyTier.name}</span>
                  <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{loyaltyTier.cashback}% cashback</span>
                </Link>
              </>
            )}
            {activityStreak && activityStreak > 0 ? (
              <>
                <span className="text-border">·</span>
                <div className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span>{activityStreak} {isRu ? 'заказов за 30д' : 'orders in 30d'}</span>
                </div>
              </>
            ) : null}
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
