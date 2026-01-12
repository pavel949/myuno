import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Anchor, Star, Users, MapPin, Clock, Shield, Check, 
  Calendar, Share2, Heart, Phone, MessageCircle, Ruler, Gauge, Fuel
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BackButton } from '@/components/uno/BackButton';
import { Skeleton } from '@/components/ui/skeleton';
import { useYacht } from '@/hooks/useYachts';

export default function YachtDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [currentImage, setCurrentImage] = useState(0);
  
  const { yacht, isLoading } = useYacht(id || '');

  if (isLoading) {
    return (
      <AppLayout>
        <div className="h-72 bg-muted animate-pulse" />
        <PageContainer className="-mt-4 relative z-10 bg-background rounded-t-3xl pt-6">
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-4 w-1/2 mb-6" />
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-16" />)}
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  if (!yacht) {
    return (
      <AppLayout>
        <PageContainer className="py-20 text-center">
          <Anchor className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            {language === 'ru' ? 'Яхта не найдена' : 'Yacht not found'}
          </h2>
          <Button onClick={() => navigate('/yachts')}>
            {language === 'ru' ? 'К списку яхт' : 'Back to yachts'}
          </Button>
        </PageContainer>
      </AppLayout>
    );
  }

  const images = yacht.images?.length ? yacht.images : [yacht.cover_image || 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800'];
  const name = language === 'ru' ? yacht.name_ru : yacht.name_en;
  const description = language === 'ru' ? yacht.description_ru : yacht.description_en;
  const location = language === 'ru' ? yacht.location_ru : yacht.location_name;
  const features = language === 'ru' ? yacht.features_ru : yacht.features_en;

  return (
    <AppLayout>
      {/* Image Gallery */}
      <div className="relative h-72">
        <img
          src={images[currentImage]}
          alt={name}
          className="w-full h-full object-cover"
        />
        {/* Back button */}
        <div className="absolute top-4 left-4">
          <BackButton fallbackPath="/yachts" variant="overlay" />
        </div>
        {/* Actions */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white">
            <Share2 className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white">
            <Heart className="w-5 h-5" />
          </button>
        </div>
        {/* Image dots */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImage(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentImage ? 'bg-white w-4' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
        {/* Badges */}
        <div className="absolute bottom-4 left-4 flex gap-2">
          {yacht.is_verified && (
            <Badge className="bg-primary text-primary-foreground">
              <Shield className="w-3 h-3 mr-1" />
              {language === 'ru' ? 'Проверено' : 'Verified'}
            </Badge>
          )}
          {yacht.is_featured && (
            <Badge className="bg-amber-500 text-white">
              <Star className="w-3 h-3 mr-1" />
              {language === 'ru' ? 'Рекомендуем' : 'Featured'}
            </Badge>
          )}
        </div>
      </div>

      <PageContainer className="-mt-4 relative z-10 bg-background rounded-t-3xl pt-6">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-start justify-between">
            <h1 className="text-2xl font-bold">{name}</h1>
            <Badge variant="secondary" className="capitalize">
              {yacht.yacht_type}
            </Badge>
          </div>
          <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{location || 'Phuket'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span>{yacht.rating}</span>
              <span>({yacht.review_count})</span>
            </div>
          </div>
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-4 gap-3 p-4 bg-muted/50 rounded-xl mb-6">
          <div className="text-center">
            <Users className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
            <p className="text-sm font-medium">{yacht.capacity}</p>
            <p className="text-xs text-muted-foreground">{language === 'ru' ? 'гостей' : 'guests'}</p>
          </div>
          <div className="text-center">
            <Ruler className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
            <p className="text-sm font-medium">{yacht.length_meters ? `${yacht.length_meters}m` : '—'}</p>
            <p className="text-xs text-muted-foreground">{language === 'ru' ? 'длина' : 'length'}</p>
          </div>
          <div className="text-center">
            <Clock className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
            <p className="text-sm font-medium">{yacht.year_built || '—'}</p>
            <p className="text-xs text-muted-foreground">{language === 'ru' ? 'год' : 'year'}</p>
          </div>
          <div className="text-center">
            <Anchor className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
            <p className="text-sm font-medium">{yacht.cabins || '—'}</p>
            <p className="text-xs text-muted-foreground">{language === 'ru' ? 'каюты' : 'cabins'}</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="mb-24">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="overview">{language === 'ru' ? 'Обзор' : 'Overview'}</TabsTrigger>
            <TabsTrigger value="specs">{language === 'ru' ? 'Характеристики' : 'Specs'}</TabsTrigger>
            <TabsTrigger value="reviews">{language === 'ru' ? 'Отзывы' : 'Reviews'}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-4">
            {description && (
              <div>
                <h3 className="font-semibold mb-2">{language === 'ru' ? 'Описание' : 'Description'}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            )}

            {features && features.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">{language === 'ru' ? 'Включено' : 'Features'}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Crew info */}
            {yacht.has_crew && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <span className="font-medium">
                    {language === 'ru' ? 'Экипаж включён' : 'Crew included'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {language === 'ru' 
                    ? 'Профессиональный капитан и команда входят в стоимость'
                    : 'Professional captain and crew are included in the price'}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="specs" className="mt-4">
            <div className="grid grid-cols-2 gap-4">
              {yacht.length_meters && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">{language === 'ru' ? 'Длина' : 'Length'}</p>
                  <p className="font-medium">{yacht.length_meters}m</p>
                </div>
              )}
              {yacht.beam && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">{language === 'ru' ? 'Ширина' : 'Beam'}</p>
                  <p className="font-medium">{yacht.beam}</p>
                </div>
              )}
              {yacht.draft && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">{language === 'ru' ? 'Осадка' : 'Draft'}</p>
                  <p className="font-medium">{yacht.draft}</p>
                </div>
              )}
              {yacht.engines && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">{language === 'ru' ? 'Двигатели' : 'Engines'}</p>
                  <p className="font-medium">{yacht.engines}</p>
                </div>
              )}
              {yacht.cruising_speed && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">{language === 'ru' ? 'Крейсерская скорость' : 'Cruising Speed'}</p>
                  <p className="font-medium">{yacht.cruising_speed}</p>
                </div>
              )}
              {yacht.max_speed && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">{language === 'ru' ? 'Макс. скорость' : 'Max Speed'}</p>
                  <p className="font-medium">{yacht.max_speed}</p>
                </div>
              )}
              {yacht.fuel_capacity && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">{language === 'ru' ? 'Топливный бак' : 'Fuel Capacity'}</p>
                  <p className="font-medium">{yacht.fuel_capacity}</p>
                </div>
              )}
              {yacht.cabins && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">{language === 'ru' ? 'Каюты' : 'Cabins'}</p>
                  <p className="font-medium">{yacht.cabins}</p>
                </div>
              )}
              {yacht.bathrooms && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">{language === 'ru' ? 'Санузлы' : 'Bathrooms'}</p>
                  <p className="font-medium">{yacht.bathrooms}</p>
                </div>
              )}
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">{language === 'ru' ? 'Вместимость' : 'Capacity'}</p>
                <p className="font-medium">{yacht.capacity} {language === 'ru' ? 'чел.' : 'guests'}</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="mt-4">
            <div className="text-center py-8 text-muted-foreground">
              <Star className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="font-medium">{yacht.rating} / 5</p>
              <p className="text-sm">{yacht.review_count} {language === 'ru' ? 'отзывов' : 'reviews'}</p>
              <p className="text-sm mt-4">{language === 'ru' ? 'Подробные отзывы скоро появятся' : 'Detailed reviews coming soon'}</p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Fixed Bottom Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{language === 'ru' ? 'от' : 'from'}</p>
            <p className="text-xl font-bold text-primary">
              {yacht.currency === 'THB' ? '฿' : '$'}
              {(yacht.price_half_day || yacht.price_full_day || 0).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              {yacht.price_half_day ? (language === 'ru' ? '/полдня' : '/half day') : (language === 'ru' ? '/день' : '/day')}
            </p>
          </div>
          <div className="flex gap-2">
            {yacht.price_half_day && (
              <Button variant="outline" onClick={() => navigate(`/yachts/${id}/booking?type=half`)}>
                {language === 'ru' ? 'Полдня' : 'Half Day'}
                <span className="ml-1 text-xs text-muted-foreground">
                  {yacht.currency === 'THB' ? '฿' : '$'}{yacht.price_half_day.toLocaleString()}
                </span>
              </Button>
            )}
            <Button onClick={() => navigate(`/yachts/${id}/booking`)}>
              <Calendar className="w-4 h-4 mr-2" />
              {language === 'ru' ? 'Забронировать' : 'Book Now'}
            </Button>
          </div>
        </div>
      </PageContainer>
    </AppLayout>
  );
}
