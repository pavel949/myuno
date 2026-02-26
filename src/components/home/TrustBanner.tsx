import React, { memo, forwardRef } from 'react';
import { Shield, Users, Headphones, AlertTriangle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TrustBannerProps {
  showEmergency?: boolean;
}

/**
 * TrustBanner — real trust signals from DB + optional emergency slot
 */
export const TrustBanner = memo(forwardRef<HTMLDivElement, TrustBannerProps>(function TrustBanner({ showEmergency }, ref) {
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
    staleTime: 10 * 60 * 1000,
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
    <div ref={ref} className="flex items-center justify-around py-3 rounded-xl bg-muted/40 border border-border/40">
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

      {showEmergency && (
        <>
          <div className="w-px h-6 bg-border/60" />
          <Link
            to="/sos"
            className="flex flex-col items-center gap-0.5 group transition-colors hover:text-destructive"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
            <span className="text-xs font-semibold text-foreground group-hover:text-destructive transition-colors">
              SOS
            </span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              {isRu ? 'экстренно' : 'emergency'}
              <ChevronRight className="w-2.5 h-2.5" />
            </span>
          </Link>
        </>
      )}
    </div>
  );
}));

TrustBanner.displayName = 'TrustBanner';
