import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  PawPrint, MapPin, Star, Clock, Phone, MessageCircle,
  Shield, Check, Heart, Share2, Calendar, Loader2
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/uno/BackButton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserCollections } from '@/hooks/useUserCollections';
import { usePetService } from '@/hooks/usePetServices';
import { cn } from '@/lib/utils';
import { RelatedServicesSection } from '@/components/crosssell';

export default function PetServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { isFavorite, toggleFavorite } = useUserCollections();

  const { service, isLoading } = usePetService(id || '');
  const isFav = service ? isFavorite('pet_service', service.id) : false;

  const handleBooking = () => {
    navigate(`/pets/${id}/booking`);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!service) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <PawPrint className="w-16 h-16 text-muted-foreground" />
          <h2 className="text-xl font-semibold">{language === 'ru' ? 'Услуга не найдена' : 'Service not found'}</h2>
          <Button onClick={() => navigate('/pets')}>
            {language === 'ru' ? 'К списку услуг' : 'Back to services'}
          </Button>
        </div>
      </AppLayout>
    );
  }

  const name = language === 'ru' ? service.name_ru : service.name_en;
  const description = language === 'ru' ? service.description_ru : service.description_en;
  const heroImage = service.cover_image || 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800';
  const features = service.features || [];
  const petTypes = service.pet_types || [];

  return (
    <AppLayout>
      {/* Hero Image */}
      <div className="relative h-64">
        <BackButton fallbackPath="/pets" variant="overlay" className="absolute top-4 left-4 z-10" />
        <img src={heroImage} alt={name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        <div className="absolute top-4 right-4 flex gap-2">
          <Button size="icon" variant="secondary" className="rounded-full bg-white/20 backdrop-blur-sm"
            onClick={() => toggleFavorite('pet_service', service.id, service as any)}>
            <Heart className={cn("w-5 h-5", isFav && "fill-red-500 text-red-500")} />
          </Button>
          <Button size="icon" variant="secondary" className="rounded-full bg-white/20 backdrop-blur-sm">
            <Share2 className="w-5 h-5" />
          </Button>
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-2 text-white mb-1">
            {service.is_verified && (
              <Badge className="bg-emerald-500 text-white text-xs">
                <Shield className="w-3 h-3 mr-1" />{language === 'ru' ? 'Проверено' : 'Verified'}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-32 -mt-4 relative">
        <div className="bg-background rounded-t-2xl pt-4">
          <div className="mb-4">
            <h1 className="text-xl font-bold mb-2">{name}</h1>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="font-medium">{service.rating}</span>
                <span className="text-muted-foreground">({service.review_count})</span>
              </div>
              {service.district && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="w-4 h-4" /><span>{service.district}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 mb-6">
            {service.phone && (
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <a href={`tel:${service.phone}`}>
                  <Phone className="w-4 h-4 mr-2" />{language === 'ru' ? 'Позвонить' : 'Call'}
                </a>
              </Button>
            )}
            <Button variant="outline" size="sm" className="flex-1">
              <MessageCircle className="w-4 h-4 mr-2" />{language === 'ru' ? 'Написать' : 'Message'}
            </Button>
          </div>

          <Tabs defaultValue="about" className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="about">{language === 'ru' ? 'О нас' : 'About'}</TabsTrigger>
              <TabsTrigger value="features">{language === 'ru' ? 'Особенности' : 'Features'}</TabsTrigger>
            </TabsList>

            <TabsContent value="about" className="mt-4 space-y-4">
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
              {petTypes.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">{language === 'ru' ? 'Типы питомцев' : 'Pet Types'}</h3>
                  <div className="flex flex-wrap gap-2">
                    {petTypes.map((type, i) => (
                      <Badge key={i} variant="outline">{type}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {service.address && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" /><span>{service.address}</span>
                </div>
              )}
            </TabsContent>

            <TabsContent value="features" className="mt-4 space-y-2">
              {features.length > 0 ? features.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-emerald-500" /><span>{f}</span>
                </div>
              )) : (
                <p className="text-muted-foreground text-center py-4">{language === 'ru' ? 'Информация скоро появится' : 'Coming soon'}</p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Cross-sell */}
      <div className="px-4 pb-24">
        <RelatedServicesSection currentVertical="pets" />
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-50">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
          <div>
            <div className="text-sm text-muted-foreground">{language === 'ru' ? 'от' : 'from'}</div>
            <div className="text-xl font-bold">
              {service.price_from ? `฿${service.price_from.toLocaleString()}` : (language === 'ru' ? 'По запросу' : 'On request')}
            </div>
          </div>
          <Button onClick={handleBooking} size="lg" className="flex-1">
            <Calendar className="w-4 h-4 mr-2" />
            {language === 'ru' ? 'Записаться' : 'Book Now'}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
