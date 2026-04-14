/**
 * TrustStats — with section reveal animation
 */
import React, { memo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Home, CalendarCheck, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export const TrustStats = memo(function TrustStats() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const { data: stats } = useQuery({
    queryKey: ['trust-stats-home'],
    queryFn: async () => {
      const [properties, bookings, providers] = await Promise.all([
        supabase.from('properties').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('property_bookings').select('id', { count: 'exact', head: true }),
        supabase.from('providers').select('id', { count: 'exact', head: true }).eq('is_active', true),
      ]);
      return {
        properties: properties.count ?? 0,
        bookings: bookings.count ?? 0,
        providers: providers.count ?? 0,
      };
    },
    staleTime: 10 * 60 * 1000,
  });

  const items = [
    { icon: Home, value: stats ? `${stats.properties}+` : '…', label: isRu ? 'объектов' : 'properties', color: '#00D68F' },
    { icon: CalendarCheck, value: stats ? `${stats.bookings}+` : '…', label: isRu ? 'бронирований' : 'bookings', color: '#4E7BFF' },
    { icon: Shield, value: stats ? `${stats.providers}+` : '…', label: isRu ? 'партнёров' : 'partners', color: '#06B6D4' },
    { icon: Clock, value: '24/7', label: isRu ? 'поддержка' : 'support', color: '#F59E0B' },
  ];

  return (
    <section className="anim-stats space-y-4">
      <div className="rounded-[var(--radius-lg)] p-5"
        style={{
          background: 'hsl(var(--bg-surface))',
          borderTop: '1px solid hsl(0 0% 100% / 0.07)',
          borderBottom: '1px solid hsl(0 0% 100% / 0.07)',
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground text-center mb-4">
          {isRu ? 'Почему myUNO' : 'Why myUNO'}
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {items.map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-2 py-3 relative">
              {i > 0 && (
                <div className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 w-px h-8"
                  style={{ background: 'hsl(0 0% 100% / 0.07)' }}
                />
              )}
              <span className="text-2xl md:text-3xl font-bold font-display" style={{ color: item.color }}>
                {item.value}
              </span>
              <span className="text-xs text-muted-foreground font-medium text-center leading-tight">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {[
          { icon: Shield, text: isRu ? 'Верифицировано' : 'Verified' },
          { icon: Clock, text: isRu ? 'Быстрый ответ' : 'Fast Response' },
        ].map((badge, i) => (
          <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-full)] text-xs font-medium text-muted-foreground min-h-[44px]"
            style={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(0 0% 100% / 0.07)',
            }}
          >
            <badge.icon className="w-3.5 h-3.5 text-primary" />
            {badge.text}
          </div>
        ))}
      </div>
    </section>
  );
});
