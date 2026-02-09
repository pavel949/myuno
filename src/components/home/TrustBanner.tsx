import React, { memo } from 'react';
import { Layers, Users, Headphones } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Stat {
  icon: React.ElementType;
  value: string;
  labelEn: string;
  labelRu: string;
}

const stats: Stat[] = [
  { icon: Layers, value: '500+', labelEn: 'Services', labelRu: 'Услуг' },
  { icon: Users, value: '100+', labelEn: 'Verified Partners', labelRu: 'Партнёров' },
  { icon: Headphones, value: '24/7', labelEn: 'Support', labelRu: 'Поддержка' },
];

export const TrustBanner = memo(function TrustBanner() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <div className="flex items-center justify-around py-4 rounded-2xl bg-muted/50">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <React.Fragment key={stat.value}>
            {i > 0 && <div className="w-px h-8 bg-border" />}
            <div className="flex flex-col items-center gap-1">
              <Icon className="w-4 h-4 text-primary" />
              <span className="text-lg font-bold text-foreground">{stat.value}</span>
              <span className="text-[11px] text-muted-foreground">{isRu ? stat.labelRu : stat.labelEn}</span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
});
