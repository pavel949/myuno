import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowRight, Gift } from 'lucide-react';
import { PropertyTourLeadForm } from '@/components/property/PropertyTourLeadForm';
import propertyTourImg from '@/assets/solutions/property-tour.webp';

export function PropertyTourBanner() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [formOpen, setFormOpen] = useState(false);

  return (
    <>
      <section
        className="relative rounded-2xl overflow-hidden cursor-pointer group"
        onClick={() => setFormOpen(true)}
      >
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src={propertyTourImg}
            alt={isRu ? 'Тур по недвижимости Пхукета' : 'Phuket Property Tour'}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--primary))]/90 via-[hsl(var(--primary))]/70 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative px-5 py-5 md:py-6 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground/80 bg-white/20 px-2 py-0.5 rounded-full">
                <Gift className="w-3 h-3" />
                {isRu ? 'Бесплатно' : 'Free'}
              </span>
            </div>
            <h3 className="text-lg md:text-xl font-bold text-primary-foreground leading-tight">
              {isRu ? 'Тур по недвижимости Пхукета' : 'Phuket Property Tour'}
            </h3>
            <p className="text-sm text-primary-foreground/80 mt-1 line-clamp-2">
              {isRu
                ? 'Покажем лучшие виллы и кондо — без обязательств'
                : 'See the best villas & condos — no commitment'}
            </p>
          </div>

          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center transition-transform group-hover:translate-x-1">
            <ArrowRight className="w-5 h-5 text-primary-foreground" />
          </div>
        </div>
      </section>

      <PropertyTourLeadForm 
        open={formOpen} 
        onOpenChange={setFormOpen} 
        source="home_banner" 
      />
    </>
  );
}
