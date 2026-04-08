import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Clock, Star, Shield, Calendar, Check } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageContainer } from '@/components/uno/PageContainer';
import { DetailPageHeader } from '@/components/uno/DetailPageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCleaningServiceById, FALLBACK_CLEANING_DETAIL } from '@/hooks/useCleaningServices';
import { RelatedServicesSection } from '@/components/crosssell';

export default function CleaningDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();

  const { service, isLoading } = useCleaningServiceById(id || 'clean-1');
  
  // Fallback while loading
  const currentService = service || FALLBACK_CLEANING_DETAIL[0];
  const name = language === 'ru' ? currentService.nameRu : currentService.nameEn;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: name,
          text: language === 'ru' ? currentService.descRu : currentService.descEn,
          url: window.location.href,
        });
      } catch {
        // User cancelled
      }
    }
  };

  return (
    <AppLayout>
      <PageContainer className="pb-28 px-0">
        {/* Hero Image with Overlay Header */}
        <div className="relative h-56">
          <img 
            src={currentService.image} 
            alt={name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <DetailPageHeader fallbackPath="/cleaning" onShare={handleShare} />
        </div>

        {/* Service Info */}
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold">
              {language === 'ru' ? currentService.nameRu : currentService.nameEn}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">{currentService.provider}</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 fill-warning text-warning" />
              <span className="font-semibold">{currentService.rating}</span>
              <span className="text-muted-foreground">({currentService.reviewCount})</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{currentService.duration}</span>
            </div>
          </div>

          <p className="text-muted-foreground">
            {language === 'ru' ? currentService.descRu : currentService.descEn}
          </p>

          {/* What's Included */}
          <div className="bg-card rounded-xl border p-5">
            <h3 className="font-semibold mb-4">
              {language === 'ru' ? 'Что включено' : "What's Included"}
            </h3>
            <div className="space-y-2">
              {(language === 'ru' ? currentService.includesRu : currentService.includes).map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trust Badge */}
          <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-xl">
            <Shield className="w-5 h-5 text-primary" />
            <span className="text-sm">
              {language === 'ru' 
                ? 'Все специалисты проверены и застрахованы'
                : 'All specialists are verified and insured'}
            </span>
          </div>
        </div>

        {/* Cross-sell */}
        <div className="pb-24">
          <RelatedServicesSection currentVertical="cleaning" />
        </div>

        {/* Bottom Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t p-4 z-50">
          <div className="flex items-center justify-between gap-4 max-w-lg mx-auto">
            <div>
              <p className="text-sm text-muted-foreground">
                {language === 'ru' ? 'От' : 'From'}
              </p>
              <p className="text-2xl font-bold text-primary">
                ฿{currentService.priceFrom}
              </p>
            </div>
            <Button 
              size="lg" 
              className="flex-1 gap-2"
              onClick={() => navigate(`/cleaning/${currentService.id}/book`)}
            >
              <Calendar className="w-5 h-5" />
              {language === 'ru' ? 'Забронировать' : 'Book Now'}
            </Button>
          </div>
        </div>
      </PageContainer>
    </AppLayout>
  );
}
