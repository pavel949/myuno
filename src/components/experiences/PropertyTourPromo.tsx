import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Gift, ArrowRight, MapPin, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PropertyTourLeadForm } from '@/components/property/PropertyTourLeadForm';
import propertyTourImg from '@/assets/solutions/property-tour.webp';

export function PropertyTourPromo() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [formOpen, setFormOpen] = useState(false);

  return (
    <>
      <div
        className="relative rounded-none overflow-hidden cursor-pointer group border border-primary/20"
        onClick={() => setFormOpen(true)}
      >
        <div className="flex flex-col sm:flex-row">
          {/* Image */}
          <div className="relative sm:w-2/5 aspect-[16/9] sm:aspect-auto">
            <img
              src={propertyTourImg}
              alt={isRu ? 'Бесплатный тур по недвижимости' : 'Free Property Tour'}
              className="w-full h-full object-cover transition-transform duration-500"
              loading="lazy"
            />
            <span className="absolute top-3 left-3 inline-flex items-center gap-1 text-xs font-bold uppercase text-primary-foreground bg-primary px-2.5 py-1 rounded-full shadow-lg">
              <Gift className="w-3.5 h-3.5" />
              {isRu ? 'Бесплатно' : 'Free'}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 sm:p-5 flex flex-col justify-center">
            <h3 className="text-base sm:text-lg font-bold text-foreground mb-1.5">
              {isRu ? 'Бесплатный тур по недвижимости Пхукета' : 'Free Phuket Property Tour'}
            </h3>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {isRu
                ? 'Индивидуальная экскурсия по проверенным виллам и кондо с экспертом рынка'
                : 'Personalized tour of verified villas & condos with a market expert'}
            </p>

            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-4">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {isRu ? '3-4 часа' : '3-4 hours'}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> {isRu ? 'Пхукет' : 'Phuket'}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> {isRu ? '1-6 чел' : '1-6 persons'}
              </span>
            </div>

            <Button size="sm" className="gap-2 self-start">
              {isRu ? 'Записаться' : 'Book Now'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <PropertyTourLeadForm
        open={formOpen}
        onOpenChange={setFormOpen}
        source="experiences_page"
      />
    </>
  );
}
