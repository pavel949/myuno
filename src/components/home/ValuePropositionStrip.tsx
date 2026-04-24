import React, { memo } from 'react';
import { Plane, Flower2, FileText, Home, SprayCan, Bike, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface ServiceProof {
  icon: React.ElementType;
  labelRu: string;
  labelEn: string;
  priceRu: string;
  priceEn: string;
  path: string;
  gradient: string;
}

const SERVICES: ServiceProof[] = [
  {
    icon: Plane, labelRu: 'Трансфер из аэропорта', labelEn: 'Airport transfer',
    priceRu: 'от 800 \u0E3F', priceEn: 'from 800 \u0E3F',
    path: '/transport/airport-transfer',
    gradient: 'linear-gradient(135deg, hsl(var(--cluster-arrive)), hsl(var(--cluster-arrive) / 0.7))',
  },
  {
    icon: Flower2, labelRu: 'Букет за 2 часа', labelEn: 'Flowers in 2 hours',
    priceRu: 'от 590 \u0E3F', priceEn: 'from 590 \u0E3F',
    path: '/flowers',
    gradient: 'linear-gradient(135deg, hsl(var(--accent-coral)), hsl(var(--accent-coral) / 0.7))',
  },
  {
    icon: FileText, labelRu: 'Продление визы', labelEn: 'Visa extension',
    priceRu: 'от 5,000 \u0E3F', priceEn: 'from 5,000 \u0E3F',
    path: '/visa',
    gradient: 'linear-gradient(135deg, hsl(var(--cluster-legal)), hsl(var(--cluster-legal) / 0.7))',
  },
  {
    icon: Home, labelRu: 'Аренда на месяц', labelEn: 'Monthly rental',
    priceRu: 'от 15,000 \u0E3F', priceEn: 'from 15,000 \u0E3F',
    path: '/property/rent',
    gradient: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.7))',
  },
  {
    icon: SprayCan, labelRu: 'Уборка квартиры', labelEn: 'Apartment cleaning',
    priceRu: 'от 1,500 \u0E3F', priceEn: 'from 1,500 \u0E3F',
    path: '/cleaning',
    gradient: 'linear-gradient(135deg, hsl(var(--cluster-manage)), hsl(var(--cluster-manage) / 0.7))',
  },
  {
    icon: Bike, labelRu: 'Аренда байка', labelEn: 'Scooter rental',
    priceRu: 'от 200 \u0E3F/\u0434\u0435\u043D\u044C', priceEn: 'from 200 \u0E3F/day',
    path: '/transport/bike-rental',
    gradient: 'linear-gradient(135deg, hsl(var(--accent-amber)), hsl(var(--accent-amber) / 0.7))',
  },
];

export const ValuePropositionStrip = memo(function ValuePropositionStrip() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <Sparkles className="w-4 h-4 text-primary shrink-0" />
        <h2 className="text-lg font-bold font-display text-foreground">
          {isRu ? 'Вот что умеет myUNO' : 'Here\u2019s what myUNO can do'}
        </h2>
      </div>

      {/* Mobile: horizontal scroll, Desktop: grid */}
      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex gap-3 w-max md:w-full md:grid md:grid-cols-3 lg:grid-cols-3">
          {SERVICES.map((svc) => {
            const Icon = svc.icon;
            return (
              <Link
                key={svc.labelEn}
                to={svc.path}
                className={cn(
                  "flex flex-col gap-3 p-4 rounded-none shrink-0 transition-all duration-200",
                  "w-[160px] md:w-auto bg-card",
                  "ring-1 ring-border hover:ring-primary/40 hover:shadow-sm active:scale-[0.98]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                )}
              >
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-none"
                  style={{ background: svc.gradient }}
                >
                  <Icon className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                <div>
                  <span className="text-sm font-semibold text-foreground block leading-tight">
                    {isRu ? svc.labelRu : svc.labelEn}
                  </span>
                  <span className="text-xs text-primary font-mono font-semibold mt-1 block">
                    {isRu ? svc.priceRu : svc.priceEn}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
});
