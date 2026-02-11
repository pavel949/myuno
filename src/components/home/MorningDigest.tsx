/**
 * MorningDigest — enhanced daily value widget with weather, document reminders,
 * upcoming bookings, and contextual tips. Replaces/enhances SmartWidget on desktop.
 */
import React, { useMemo } from 'react';
import { Sun, CloudRain, Cloud, Calendar, FileWarning, MapPin, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWeather } from '@/hooks/useWeather';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const TIPS_RU = [
  'Пейте больше воды — влажность сегодня высокая',
  'Лучшее время для прогулки — до 10:00 утра',
  'Попробуйте местный рынок Night Market сегодня',
  'Не забудьте солнцезащитный крем SPF 50+',
  'Закат сегодня будет отличным — Promthep Cape',
];

const TIPS_EN = [
  'Stay hydrated — humidity is high today',
  'Best time for a walk — before 10:00 AM',
  'Try the local Night Market tonight',
  "Don't forget SPF 50+ sunscreen today",
  'Great sunset expected — head to Promthep Cape',
];

export function MorningDigest() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: weather } = useWeather();
  const isRu = language === 'ru';

  // Upcoming bookings count
  const { data: upcomingCount } = useQuery({
    queryKey: ['upcoming-bookings-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('status', ['confirmed', 'submitted'])
        .gte('scheduled_at', new Date().toISOString());
      return count || 0;
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
  });

  // Expiring documents count
  const { data: expiringDocs } = useQuery({
    queryKey: ['expiring-docs-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const in90 = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
      const { count } = await supabase
        .from('user_documents')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .not('expiry_date', 'is', null)
        .lte('expiry_date', in90.toISOString().split('T')[0])
        .gte('expiry_date', new Date().toISOString().split('T')[0]);
      return count || 0;
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
  });

  const tipOfDay = useMemo(() => {
    const tips = isRu ? TIPS_RU : TIPS_EN;
    const dayIndex = new Date().getDate() % tips.length;
    return tips[dayIndex];
  }, [isRu]);

  const WeatherIcon = weather?.condition === 'rainy' 
    ? CloudRain 
    : weather?.condition === 'cloudy' ? Cloud : Sun;

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      {/* Header */}
      <div className="p-4 pb-3 flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          {isRu ? 'Ваш день' : 'Your Day'}
        </h3>
        <div className="flex items-center gap-1.5 text-sm">
          <WeatherIcon className="w-4 h-4 text-amber-400" />
          <span className="font-medium text-foreground">{weather?.temp || 31}°C</span>
        </div>
      </div>

      {/* Cards grid */}
      <div className="px-4 pb-4 grid grid-cols-2 gap-2">
        {/* Tip of the day */}
        <button 
          onClick={() => navigate('/explore')}
          className="col-span-2 p-3 rounded-xl bg-primary/5 border border-primary/10 text-left hover:bg-primary/10 transition-colors"
        >
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-foreground">{tipOfDay}</p>
          </div>
        </button>

        {/* Upcoming bookings */}
        {user && (
          <button
            onClick={() => navigate('/bookings')}
            className="p-3 rounded-xl bg-background border border-border hover:border-primary/30 transition-all text-left"
          >
            <Calendar className="w-4 h-4 text-blue-500 mb-1.5" />
            <p className="text-lg font-bold text-foreground">{upcomingCount || 0}</p>
            <p className="text-xs text-muted-foreground">
              {isRu ? 'Предстоящих' : 'Upcoming'}
            </p>
          </button>
        )}

        {/* Expiring docs */}
        {user && (
          <button
            onClick={() => navigate('/profile/documents')}
            className={`p-3 rounded-xl border text-left transition-all ${
              (expiringDocs || 0) > 0 
                ? 'bg-orange-500/5 border-orange-500/20 hover:border-orange-500/40'
                : 'bg-background border-border hover:border-primary/30'
            }`}
          >
            <FileWarning className={`w-4 h-4 mb-1.5 ${(expiringDocs || 0) > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
            <p className="text-lg font-bold text-foreground">{expiringDocs || 0}</p>
            <p className="text-xs text-muted-foreground">
              {isRu ? 'Истекают' : 'Expiring'}
            </p>
          </button>
        )}
      </div>
    </div>
  );
}
