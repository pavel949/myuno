import React, { memo } from 'react';
import { Shield, Users, Headphones } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * TrustBanner — real trust signals from DB
 * Provider count is live; support is always 24/7; verified badge is static.
 */
export const TrustBanner = memo(function TrustBanner() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const { data: providerCount } = useQuery({
    queryKey: ['trust-provider-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('providers')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true);
      return count ?? 0;
    },
    staleTime: 10 * 60 * 1000, // cache 10 min
  });

  const displayCount = providerCount
    ? providerCount >= 100
      ? `${Math.floor(providerCount / 10) * 10}+`
      : `${providerCount}`
    : '…';

  const stats = [
    { icon: Shield, value: isRu ? 'Проверено' : 'Verified', label: isRu ? 'партнёры' : 'partners' },
    { icon: Users, value: displayCount, label: isRu ? 'провайдеров' : 'providers' },
    { icon: Headphones, value: '24/7', label: isRu ? 'поддержка' : 'support' },
  ];

  return (
    <div className="flex items-center justify-around py-3 rounded-xl bg-muted/40 border border-border/40">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <React.Fragment key={i}>
            {i > 0 && <div className="w-px h-6 bg-border/60" />}
            <div className="flex flex-col items-center gap-0.5">
              <Icon className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">{stat.value}</span>
              <span className="text-[10px] text-muted-foreground">{stat.label}</span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
});
