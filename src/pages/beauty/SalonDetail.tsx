import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Star, MapPin, Clock, Phone, Globe, 
  BadgeCheck, Heart, Share2, Calendar, Loader2, Scissors
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PremiumButton } from '@/components/uno/PremiumButton';
import { useViewHistory } from '@/hooks/useViewHistory';
import { cn } from '@/lib/utils';
import { BackButton } from '@/components/uno/BackButton';
import { useSalon, useSalonServices } from '@/hooks/useSalons';
import { Button } from '@/components/ui/button';
import { FavoriteButton } from '@/components/uno/FavoriteButton';
import { RelatedServicesSection } from '@/components/crosssell';
import { PLACEHOLDER_IMAGES } from '@/lib/config/placeholders';

export default function SalonDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { trackView } = useViewHistory();
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const { salon, isLoading } = useSalon(id || '');
  const { services, isLoading: servicesLoading } = useSalonServices(id || '');

  useEffect(() => {
    if (salon && id) {
      trackView(id, 'salon', {
        name: salon.name_en,
        name_en: salon.name_en,
        name_ru: salon.name_ru,
        image: salon.cover_image || salon.images?.[0],
        rating: salon.rating,
        location: salon.district,
      });
    }
  }, [salon?.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
        <Scissors className="w-16 h-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">{language === 'ru' ? 'Салон не найден' : 'Salon not found'}</h2>
        <Button onClick={() => navigate('/beauty')}>
          {language === 'ru' ? 'К списку салонов' : 'Back to salons'}
        </Button>
      </div>
    );
  }

  const name = language === 'ru' ? salon.name_ru : salon.name_en;
  const description = language === 'ru' ? salon.description_ru : salon.description_en;
  const heroImage = salon.cover_image || salon.images?.[0] || PLACEHOLDER_IMAGES.salon;

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) ? prev.filter(s => s !== serviceId) : [...prev, serviceId]
    );
  };

  const totalPrice = services.filter(s => selectedServices.includes(s.id)).reduce((sum, s) => sum + s.price, 0);
  const totalDuration = services.filter(s => selectedServices.includes(s.id)).reduce((sum, s) => sum + s.duration_minutes, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Image */}
      <div className="relative h-72 sm:h-96">
        <img src={heroImage} alt={name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <BackButton fallbackPath="/beauty" variant="overlay" />
          <div className="flex gap-2">
            <FavoriteButton
              itemType="salon"
              itemId={id || ''}
              itemData={{ title_en: salon.name_en, title_ru: salon.name_ru, image: heroImage, price: salon.price_from, location: salon.district }}
              variant="secondary"
            />
            <button className="w-10 h-10 rounded-full glass flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 -mt-8 relative z-10 space-y-6 pb-32">
        <div className="bg-card rounded-none p-5 border border-border/50 shadow-lg">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h1 className="text-xl font-display font-bold flex items-center gap-2">
                {name}
                {salon.is_verified && <BadgeCheck className="w-5 h-5 text-primary" />}
              </h1>
              {salon.district && (
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" /><span>{salon.district}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-none">
              <Star className="w-4 h-4 fill-primary text-primary" />
              <span className="font-semibold">{salon.rating}</span>
              <span className="text-xs text-muted-foreground">({salon.review_count})</span>
            </div>
          </div>
          
          {description && <p className="text-sm text-muted-foreground">{description}</p>}

          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border/50">
            {salon.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-primary" /><span>{salon.phone}</span>
              </div>
            )}
            {salon.address && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-primary" /><span>{salon.address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Services */}
        <div>
          <h2 className="text-lg font-semibold mb-4">
            {language === 'ru' ? 'Выберите услуги' : 'Select Services'}
          </h2>
          {servicesLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : services.length > 0 ? (
            <div className="space-y-3">
              {services.map((service) => {
                const isSelected = selectedServices.includes(service.id);
                return (
                  <button
                    key={service.id}
                    onClick={() => toggleService(service.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-none border transition-all",
                      isSelected ? "bg-primary/10 border-primary" : "bg-card border-border/50 hover:border-primary/30"
                    )}
                  >
                    <div className="text-left">
                      <h3 className="font-medium">{language === 'ru' ? service.name_ru : service.name_en}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{service.duration_minutes} {language === 'ru' ? 'мин' : 'min'}</span>
                      </div>
                    </div>
                    <span className="font-semibold text-primary">฿{service.price.toLocaleString()}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              {language === 'ru' ? 'Услуги скоро будут добавлены' : 'Services coming soon'}
            </p>
          )}
        </div>
      </div>

      {/* Cross-sell */}
      <div className="px-4 pb-24">
        <RelatedServicesSection currentVertical="beauty" />
      </div>

      {/* Bottom booking bar */}
      {selectedServices.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 border-t border-border/50 z-50">
          <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                {selectedServices.length} {language === 'ru' ? 'услуг' : 'services'} • {totalDuration} {language === 'ru' ? 'мин' : 'min'}
              </p>
              <p className="text-xl font-bold text-primary">฿{totalPrice.toLocaleString()}</p>
            </div>
            <PremiumButton
              onClick={() => navigate(`/beauty/booking/${salon.id}`, { state: { selectedServices, salon } })}
              className="flex-1 max-w-[200px]"
            >
              <Calendar className="w-4 h-4 mr-2" />
              {t('action.book')}
            </PremiumButton>
          </div>
        </div>
      )}
    </div>
  );
}
