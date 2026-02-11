import React, { memo, useMemo } from 'react';
import { MapPin, AlertTriangle, Sun, Cloud, CloudRain, Calendar, Trophy, Flame } from 'lucide-react';
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
 * Shows user name, loyalty tier, and activity streak when logged in
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

  // Calculate "streak" — consecutive days of activity (orders in last 30 days)
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
    const name = firstName ? `, ${firstName}` : '';
    if (hour < 12) return (isRu ? 'Доброе утро' : 'Good morning') + name;
    if (hour < 18) return (isRu ? 'Добрый день' : 'Good afternoon') + name;
    return (isRu ? 'Добрый вечер' : 'Good evening') + name;
  }, [isRu, firstName]);

  const WeatherIcon = weather?.condition === 'rainy' ? CloudRain 
    : weather?.condition === 'cloudy' ? Cloud : Sun;

  // Mobile
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
          {/* Loyalty + streak mini-bar */}
          {user && (loyaltyTier || (activityStreak && activityStreak > 0)) && (
            <div className="flex items-center gap-3 mt-2">
              {loyaltyTier && (
                <Link to="/wallet" className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/8 border border-primary/15 text-xs">
                  <Trophy className="w-3 h-3 text-primary" />
                  <span className="font-medium text-primary">{loyaltyTier.name}</span>
                  <span className="text-muted-foreground">{loyaltyTier.cashback}%</span>
                </Link>
              )}
              {activityStreak && activityStreak > 0 ? (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/8 border border-orange-500/15 text-xs">
                  <Flame className="w-3 h-3 text-orange-500" />
                  <span className="font-medium text-orange-600 dark:text-orange-400">
                    {activityStreak} {isRu ? 'заказов' : 'orders'}
                  </span>
                </div>
              ) : null}
            </div>
          )}
        </div>
        <div className="lg:hidden">
          <InlineSearch />
        </div>
      </div>
    );
  }

  // Desktop
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
