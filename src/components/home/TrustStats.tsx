/**
 * TrustStats — Ignatev Group trust signals with real stats
 * Shows verified numbers from the database
 */
import React, { memo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Home, CalendarCheck, Clock, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

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
    {
      icon: Home,
      value: stats ? `${stats.properties}+` : '…',
      label: isRu ? 'объектов' : 'properties',
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      icon: CalendarCheck,
      value: stats ? `${stats.bookings}+` : '…',
      label: isRu ? 'бронирований' : 'bookings',
      color: 'text-success',
      bg: 'bg-success/10',
    },
    {
      icon: Shield,
      value: stats ? `${stats.providers}+` : '…',
      label: isRu ? 'партнёров' : 'partners',
      color: 'text-accent-cyan',
      bg: 'bg-accent-cyan/10',
    },
    {
      icon: Clock,
      value: '24/7',
      label: isRu ? 'поддержка' : 'support',
      color: 'text-warning',
      bg: 'bg-warning/10',
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="space-y-3"
    >
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {isRu ? 'Почему myUNO' : 'Why myUNO'}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="flex flex-col items-center gap-1.5 py-3">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', item.bg)}>
                <Icon className={cn('w-5 h-5', item.color)} />
              </div>
              <span className={cn(
                'text-lg font-bold text-foreground transition-opacity',
                item.value === '…' ? 'opacity-40' : 'opacity-100'
              )}>
                {item.value}
              </span>
              <span className="text-[10px] text-muted-foreground font-medium text-center leading-tight">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
});
