import React, { memo, forwardRef } from 'react';
import { Shield, Users, Headphones, AlertTriangle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Surface } from '@/components/ui/surface';

interface TrustBannerProps {
  showEmergency?: boolean;
}

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
    { icon: Shield, value: isRu ? 'Проверено' : 'Verified', label: isRu ? 'партнёры' : 'partners', color: 'text-primary' },
    { icon: Users, value: displayCount, label: isRu ? 'провайдеров' : 'providers', color: 'text-accent-cyan' },
    { icon: Headphones, value: '24/7', label: isRu ? 'поддержка' : 'support', color: 'text-success' },
  ];

  return (
    <Surface ref={ref} variant="card" padding="none" radius="2xl" className="flex items-center justify-around py-4">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <React.Fragment key={i}>
            {i > 0 && <div className="w-px h-8 bg-border/40" />}
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-none bg-muted/60 flex items-center justify-center">
                <Icon className={cn("w-4 h-4", stat.color)} />
              </div>
              <span className={cn(
                "text-sm font-bold text-foreground transition-opacity duration-300",
                stat.value === '…' ? 'opacity-40' : 'opacity-100'
              )}>{stat.value}</span>
              <span className="text-[10px] text-muted-foreground font-medium">{stat.label}</span>
            </div>
          </React.Fragment>
        );
      })}

      {showEmergency && (
        <>
          <div className="w-px h-8 bg-border/40" />
          <Link
            to="/sos"
            className="flex flex-col items-center gap-1 group transition-colors"
          >
            <div className="w-8 h-8 rounded-none bg-destructive/10 flex items-center justify-center group-hover:bg-destructive/15 transition-colors">
              <AlertTriangle className="w-4 h-4 text-destructive" />
            </div>
            <span className="text-sm font-bold text-foreground group-hover:text-destructive transition-colors">
              SOS
            </span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 font-medium">
              {isRu ? 'экстренно' : 'emergency'}
              <ChevronRight className="w-2.5 h-2.5" />
            </span>
          </Link>
        </>
      )}
    </Surface>
  );
}));

TrustBanner.displayName = 'TrustBanner';
