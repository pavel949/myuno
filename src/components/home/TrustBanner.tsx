import React, { memo } from 'react';
import { Shield, Users, Headphones } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * TrustBanner — Subtle trust signals
 * Calm, factual, no marketing noise
 */
const stats = [
  { icon: Shield, valueEn: 'Verified', valueRu: 'Проверено', labelEn: 'partners', labelRu: 'партнёры' },
  { icon: Users, valueEn: '100+', valueRu: '100+', labelEn: 'providers', labelRu: 'провайдеров' },
  { icon: Headphones, valueEn: '24/7', valueRu: '24/7', labelEn: 'support', labelRu: 'поддержка' },
];

export const TrustBanner = memo(function TrustBanner() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <div className="flex items-center justify-around py-3 rounded-xl bg-muted/40 border border-border/40">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <React.Fragment key={i}>
            {i > 0 && <div className="w-px h-6 bg-border/60" />}
            <div className="flex flex-col items-center gap-0.5">
              <Icon className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">
                {isRu ? stat.valueRu : stat.valueEn}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {isRu ? stat.labelRu : stat.labelEn}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
});
