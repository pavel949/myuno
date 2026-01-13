import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Star, MapPin, Users, Fuel, Settings2, Calendar,
  Shield, Check, Share2, Phone, MessageCircle, Briefcase, DoorOpen
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { FavoriteButton } from '@/components/uno/FavoriteButton';
import { useViewHistory } from '@/hooks/useViewHistory';
import { BackButton } from '@/components/uno/BackButton';
import { useVehicle } from '@/hooks/useVehicles';

const transmissionLabels: Record<string, { en: string; ru: string }> = {
  automatic: { en: 'Auto', ru: 'Авто' },
  manual: { en: 'Manual', ru: 'Мех' },
};

const fuelLabels: Record<string, { en: string; ru: string }> = {
  petrol: { en: 'Petrol', ru: 'Бензин' },
  diesel: { en: 'Diesel', ru: 'Дизель' },
  electric: { en: 'Electric', ru: 'Электро' },
  hybrid: { en: 'Hybrid', ru: 'Гибрид' },
};

export default function VehicleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [activeImage, setActiveImage] = useState(0);
  const { trackView } = useViewHistory();
  const { vehicle, isLoading } = useVehicle(id || '');

  const isRussian = language === 'ru';

  useEffect(() => {
    if (vehicle) {
      trackView(vehicle.id, 'vehicle', {
        name_en: vehicle.name_en,
        name_ru: vehicle.name_ru,
        image: vehicle.cover_image || vehicle.images?.[0],
        price: vehicle.price_per_day,
        location: vehicle.location_name,
      });
    }
  }, [vehicle?.id]);

  if (isLoading) {
    return (
      <AppLayout showBottomNav={false}>
        <div className="pb-24">
          <div className="sticky top-0 z-20 flex items-center justify-between p-4 bg-background/80 backdrop-blur-sm border-b border-border/50">
            <BackButton fallbackPath="/transport" variant="ghost" />
          </div>
          <Skeleton className="aspect-[16/10] w-full" />
          <div className="px-4 space-y-4 mt-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20" />)}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!vehicle) {
    return (
      <AppLayout showBottomNav={false}>
        <div className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">
            {isRussian ? 'Транспорт не найден' : 'Vehicle not found'}
          </h2>
          <Button onClick={() => navigate('/transport')}>
            {isRussian ? 'Назад к каталогу' : 'Back to catalog'}
          </Button>
        </div>
      </AppLayout>
    );
  }

  const images = vehicle.images?.length > 0 
    ? vehicle.images 
    : vehicle.cover_image 
      ? [vehicle.cover_image] 
      : ['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800'];

  const name = isRussian ? vehicle.name_ru : vehicle.name_en;
  const description = isRussian ? vehicle.description_ru : vehicle.description_en;
  const location = isRussian ? (vehicle.location_ru || vehicle.location_name) : vehicle.location_name;
  const transmission = vehicle.transmission || 'automatic';
  const fuelType = vehicle.fuel_type || 'petrol';

  return (
    <AppLayout showBottomNav={false}>
      <div className="pb-24">
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between p-4 bg-background/80 backdrop-blur-sm border-b border-border/50">
          <BackButton fallbackPath="/transport" variant="ghost" />
          
          <div className="flex items-center gap-2">
            <FavoriteButton
              itemType="vehicle"
              itemId={vehicle.id}
              itemData={{
                title_en: vehicle.name_en,
                title_ru: vehicle.name_ru,
                image: images[0],
                price: vehicle.price_per_day,
                location: vehicle.location_name,
              }}
              variant="ghost"
            />
            <Button variant="ghost" size="icon">
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="relative">
          <div className="aspect-[16/10] overflow-hidden">
            <img
              src={images[activeImage]}
              alt={name}
              className="w-full h-full object-cover"
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 p-4 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    "w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all",
                    activeImage === i ? "border-primary" : "border-transparent opacity-60"
                  )}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 space-y-6">
          {/* Title & Price */}
          <div>
            <h1 className="text-2xl font-display font-bold">{name}</h1>
            {location && (
              <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{location}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-500/10">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="font-semibold">{vehicle.rating || 0}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                ({vehicle.review_count || 0} {isRussian ? 'отзывов' : 'reviews'})
              </span>
            </div>
          </div>

          {/* Price Card */}
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-sm text-muted-foreground">
                  {isRussian ? 'Цена' : 'Price'}
                </span>
                <p className="text-3xl font-bold text-primary">
                  ฿{vehicle.price_per_day?.toLocaleString() || 0}
                  <span className="text-lg font-normal text-muted-foreground">
                    /{isRussian ? 'день' : 'day'}
                  </span>
                </p>
                {vehicle.price_per_hour && (
                  <p className="text-sm text-muted-foreground mt-1">
                    ฿{vehicle.price_per_hour.toLocaleString()}/{isRussian ? 'час' : 'hour'}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 text-success">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {isRussian ? 'Страховка' : 'Insured'}
                </span>
              </div>
            </div>
          </div>

          {/* Specs */}
          <div className="grid grid-cols-4 gap-3">
            <div className="flex flex-col items-center p-3 rounded-xl bg-card border border-border/50">
              <Users className="w-5 h-5 text-primary mb-1" />
              <span className="text-lg font-bold">{vehicle.capacity || 5}</span>
              <span className="text-xs text-muted-foreground">
                {isRussian ? 'Мест' : 'Seats'}
              </span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-xl bg-card border border-border/50">
              <Settings2 className="w-5 h-5 text-primary mb-1" />
              <span className="text-sm font-bold">
                {transmissionLabels[transmission]?.[isRussian ? 'ru' : 'en'] || transmission}
              </span>
              <span className="text-xs text-muted-foreground">Trans</span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-xl bg-card border border-border/50">
              <Fuel className="w-5 h-5 text-primary mb-1" />
              <span className="text-sm font-bold">
                {fuelLabels[fuelType]?.[isRussian ? 'ru' : 'en'] || fuelType}
              </span>
              <span className="text-xs text-muted-foreground">Fuel</span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-xl bg-card border border-border/50">
              <Calendar className="w-5 h-5 text-primary mb-1" />
              <span className="text-lg font-bold">{vehicle.year_built || '-'}</span>
              <span className="text-xs text-muted-foreground">Year</span>
            </div>
          </div>

          {/* Additional Specs */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center p-3 rounded-xl bg-card border border-border/50">
              <DoorOpen className="w-5 h-5 text-primary mb-1" />
              <span className="text-lg font-bold">{vehicle.doors || 4}</span>
              <span className="text-xs text-muted-foreground">
                {isRussian ? 'Дверей' : 'Doors'}
              </span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-xl bg-card border border-border/50">
              <Briefcase className="w-5 h-5 text-primary mb-1" />
              <span className="text-lg font-bold">{vehicle.luggage_capacity || 2}</span>
              <span className="text-xs text-muted-foreground">
                {isRussian ? 'Багаж' : 'Luggage'}
              </span>
            </div>
            {vehicle.deposit_amount && (
              <div className="flex flex-col items-center p-3 rounded-xl bg-card border border-border/50">
                <Shield className="w-5 h-5 text-primary mb-1" />
                <span className="text-sm font-bold">฿{vehicle.deposit_amount.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground">
                  {isRussian ? 'Залог' : 'Deposit'}
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          {description && (
            <div>
              <h2 className="text-lg font-semibold mb-3">
                {isRussian ? 'Описание' : 'Description'}
              </h2>
              <p className="text-muted-foreground leading-relaxed">{description}</p>
            </div>
          )}

          {/* Features */}
          {vehicle.features && vehicle.features.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">
                {isRussian ? 'Включено' : 'Features'}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {vehicle.features.map((feature, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50"
                  >
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rental Info */}
          <div>
            <h2 className="text-lg font-semibold mb-3">
              {isRussian ? 'Условия аренды' : 'Rental Terms'}
            </h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-primary" />
                <span>{isRussian ? 'Минимум' : 'Minimum'} {vehicle.min_rental_days || 1} {isRussian ? 'дней' : 'days'}</span>
              </div>
              {vehicle.free_km_per_day && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-primary" />
                  <span>{vehicle.free_km_per_day} {isRussian ? 'км/день бесплатно' : 'km/day free'}</span>
                </div>
              )}
              {vehicle.extra_km_price && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-primary" />
                  <span>฿{vehicle.extra_km_price}/{isRussian ? 'доп. км' : 'extra km'}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-primary" />
                <span>{isRussian ? 'Действующие водительские права' : 'Valid driver license required'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Bottom CTA */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border/50">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <div className="flex-1">
              <span className="text-sm text-muted-foreground">
                {isRussian ? 'От' : 'From'}
              </span>
              <p className="text-xl font-bold text-primary">
                ฿{vehicle.price_per_day?.toLocaleString() || 0}/{isRussian ? 'день' : 'day'}
              </p>
            </div>
            <Button variant="outline" size="icon">
              <Phone className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="icon">
              <MessageCircle className="w-5 h-5" />
            </Button>
            <Button
              className="flex-1"
              onClick={() => navigate(`/transport/booking/${id}`, { 
                state: { 
                  vehicle: {
                    nameEn: vehicle.name_en,
                    nameRu: vehicle.name_ru,
                    pricePerDay: vehicle.price_per_day,
                    image: images[0],
                  }
                } 
              })}
            >
              <Calendar className="w-4 h-4 mr-2" />
              {isRussian ? 'Забронировать' : 'Book Now'}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
