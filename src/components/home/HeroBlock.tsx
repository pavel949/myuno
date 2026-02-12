import React, { memo, useMemo, useCallback } from 'react';
import { MapPin, AlertTriangle, Sun, Cloud, CloudRain, Calendar, Trophy, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { InlineSearch } from '@/components/search/InlineSearch';
import { useWeather } from '@/hooks/useWeather';
import { useIsDesktop } from '@/hooks/use-desktop';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserPersonas, UserPersona, PERSONA_INFO } from '@/hooks/useUserPersonas';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const PERSONA_OPTIONS: UserPersona[] = ['tourist', 'resident', 'property_owner', 'investor'];

/** Compact segmented persona switcher */
function PersonaSwitcher({ isRu }: { isRu: boolean }) {
  const { personas, setPersonas } = useUserPersonas();

  const activePersona = useMemo(() => {
    if (personas.length === 0) return 'tourist';
    return personas[0];
  }, [personas]);

  const handleSelect = useCallback((p: UserPersona) => {
    setPersonas([p]);
  }, [setPersonas]);

  return (
    <div className="flex gap-1 p-1 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15">
      {PERSONA_OPTIONS.map((p) => {
        const info = PERSONA_INFO[p];
        const isActive = activePersona === p;
        return (
          <button
            key={p}
            onClick={() => handleSelect(p)}
            className={cn(
              "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              "focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-1",
              !isActive && "text-white/50 hover:text-white/80"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="persona-pill"
                className="absolute inset-0 rounded-lg bg-white/20 shadow-sm border border-white/25"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{info.icon}</span>
            <span className={cn("relative z-10", isActive ? "text-white" : "")}>
              {isRu ? info.labelRu : info.labelEn}
            </span>
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

  // Mobile
  if (!isDesktop) {
    return (
    <div className="relative rounded-2xl overflow-hidden">
        {/* Deep navy gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(220,40%,8%)] via-[hsl(225,45%,14%)] to-[hsl(230,40%,20%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(230,50%,30%,0.4),transparent_70%)]" />
        
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
              {isRu ? 'Чем можем помочь сегодня?' : 'How can we help today?'}
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
                    <Flame className="w-3 h-3 text-orange-300" />
                    <span className="font-medium text-white">
                      {activityStreak} {isRu ? 'заказов' : 'orders'}
                    </span>
                  </div>
                ) : null}
              </div>
            )}
          </div>
          
          {/* Persona switcher */}
          <div className="overflow-x-auto -mx-1 px-1 scrollbar-none">
            <PersonaSwitcher isRu={isRu} />
          </div>
          
          {/* Search */}
          <div className="lg:hidden">
            <InlineSearch />
          </div>
        </div>
      </div>
    );
  }

  // Desktop
  return (
    <div className="relative rounded-2xl overflow-hidden p-8 xl:p-10">
      {/* Deep navy gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(220,40%,8%)] via-[hsl(225,45%,14%)] to-[hsl(230,40%,20%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(230,50%,30%,0.4),transparent_70%)]" />
      
      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-[15px] text-white/60 font-medium">
            {isRu ? 'Ваш дом на острове' : 'Your home away from home'}
          </p>
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight font-display">
            {greeting}
          </h1>
          <div className="flex items-center gap-5 text-white/60 text-[15px] pt-1">
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
                  <Flame className="w-4 h-4 text-orange-300" />
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
