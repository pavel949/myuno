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
        role="button"
        tabIndex={0}
        aria-label={isRu ? 'Открыть форму: тур по недвижимости или консультация' : 'Open form: property tour or advice'}
        className="relative rounded-none overflow-hidden cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        onClick={() => setFormOpen(true)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFormOpen(true); } }}
      >
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src={propertyTourImg}
            alt={isRu ? 'Тур по недвижимости или консультация на Пхукете' : 'Phuket property tour or advice'}
            className="w-full h-full object-cover transition-transform duration-500 "
            loading="lazy"
          />
          {/* Strong primary overlay on left fading to image on right — ensures text contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--primary))] from-30% via-[hsl(var(--primary))]/85 via-65% to-[hsl(var(--primary))]/40" />
          {/* Bottom darken for additional safety on small viewports */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative px-5 py-5 md:py-6 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground bg-white/25 px-2 py-0.5 rounded-full">
                <Gift className="w-3 h-3" />
                {isRu ? 'Бесплатно' : 'Free'}
              </span>
            </div>
            <h3 className="text-base md:text-lg font-bold text-primary-foreground leading-tight [text-shadow:0_1px_2px_rgb(0_0_0_/_0.25)]">
              {isRu ? 'Тур по недвижимости или консультация' : 'Phuket Property Tour or Advice'}
            </h3>
            <p className="text-sm text-primary-foreground/90 mt-1 line-clamp-2 [text-shadow:0_1px_2px_rgb(0_0_0_/_0.2)]">
              {isRu
                ? 'Покажем виллы и кондо или ответим на вопросы — без обязательств'
                : 'See villas & condos, or get expert advice — no commitment'}
            </p>
          </div>

          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center transition-transform ">
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
