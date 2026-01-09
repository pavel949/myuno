import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Star, MapPin, Users, Fuel, Settings2, Calendar,
  Shield, Check, Share2, Phone, MessageCircle
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FavoriteButton } from '@/components/uno/FavoriteButton';

// Demo vehicle data
const demoVehicle = {
  id: 'car-1',
  type: 'car',
  nameEn: 'Toyota Camry 2023',
  nameRu: 'Тойота Камри 2023',
  descriptionEn: 'Comfortable sedan perfect for city driving and island exploration. Automatic transmission, excellent fuel economy, and all safety features included.',
  descriptionRu: 'Комфортный седан, идеальный для городских поездок и исследования острова. Автоматическая коробка передач, отличная экономия топлива и все функции безопасности.',
  images: [
    'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800',
    'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800',
    'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800',
  ],
  pricePerDay: 1500,
  rating: 4.8,
  reviewCount: 89,
  location: 'Patong',
  locationRu: 'Патонг',
  seats: 5,
  doors: 4,
  transmission: 'Automatic',
  transmissionRu: 'Автомат',
  fuel: 'Petrol',
  fuelRu: 'Бензин',
  year: 2023,
  isAvailable: true,
  features: [
    { icon: '❄️', labelEn: 'Air Conditioning', labelRu: 'Кондиционер' },
    { icon: '📻', labelEn: 'Bluetooth Audio', labelRu: 'Bluetooth Аудио' },
    { icon: '📍', labelEn: 'GPS Navigation', labelRu: 'GPS Навигация' },
    { icon: '📸', labelEn: 'Backup Camera', labelRu: 'Камера заднего вида' },
    { icon: '🛡️', labelEn: 'Insurance Included', labelRu: 'Страховка включена' },
    { icon: '🆓', labelEn: 'Free Delivery', labelRu: 'Бесплатная доставка' },
  ],
  owner: {
    name: 'Phuket Car Rentals',
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100',
    responseRate: 95,
  },
  requirements: [
    { en: 'Valid driver license', ru: 'Действующие водительские права' },
    { en: 'Minimum age 21', ru: 'Минимальный возраст 21 год' },
    { en: 'Deposit required', ru: 'Требуется залог' },
  ],
};

export default function VehicleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [activeImage, setActiveImage] = useState(0);

  const vehicle = demoVehicle;

  return (
    <AppLayout showBottomNav={false}>
      <div className="pb-24">
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between p-4 bg-background/80 backdrop-blur-sm border-b border-border/50">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <FavoriteButton
              itemType="vehicle"
              itemId={id || 'car-1'}
              itemData={{
                title_en: vehicle.nameEn,
                title_ru: vehicle.nameRu,
                image: vehicle.images[0],
                price: vehicle.pricePerDay,
                location: vehicle.location,
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
              src={vehicle.images[activeImage]}
              alt={language === 'ru' ? vehicle.nameRu : vehicle.nameEn}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex gap-2 p-4 overflow-x-auto">
            {vehicle.images.map((img, i) => (
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
        </div>

        <div className="px-4 space-y-6">
          {/* Title & Price */}
          <div>
            <h1 className="text-2xl font-display font-bold">
              {language === 'ru' ? vehicle.nameRu : vehicle.nameEn}
            </h1>
            <div className="flex items-center gap-2 mt-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{language === 'ru' ? vehicle.locationRu : vehicle.location}</span>
            </div>
            
            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-500/10">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="font-semibold">{vehicle.rating}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                ({vehicle.reviewCount} {language === 'ru' ? 'отзывов' : 'reviews'})
              </span>
            </div>
          </div>

          {/* Price Card */}
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-sm text-muted-foreground">
                  {language === 'ru' ? 'Цена' : 'Price'}
                </span>
                <p className="text-3xl font-bold text-primary">
                  ฿{vehicle.pricePerDay}
                  <span className="text-lg font-normal text-muted-foreground">
                    /{language === 'ru' ? 'день' : 'day'}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-1 text-success">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {language === 'ru' ? 'Страховка' : 'Insured'}
                </span>
              </div>
            </div>
          </div>

          {/* Specs */}
          <div className="grid grid-cols-4 gap-3">
            <div className="flex flex-col items-center p-3 rounded-xl bg-card border border-border/50">
              <Users className="w-5 h-5 text-primary mb-1" />
              <span className="text-lg font-bold">{vehicle.seats}</span>
              <span className="text-xs text-muted-foreground">
                {language === 'ru' ? 'Мест' : 'Seats'}
              </span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-xl bg-card border border-border/50">
              <Settings2 className="w-5 h-5 text-primary mb-1" />
              <span className="text-sm font-bold">{vehicle.transmission.slice(0, 4)}</span>
              <span className="text-xs text-muted-foreground">Trans</span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-xl bg-card border border-border/50">
              <Fuel className="w-5 h-5 text-primary mb-1" />
              <span className="text-sm font-bold">{vehicle.fuel}</span>
              <span className="text-xs text-muted-foreground">Fuel</span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-xl bg-card border border-border/50">
              <Calendar className="w-5 h-5 text-primary mb-1" />
              <span className="text-lg font-bold">{vehicle.year}</span>
              <span className="text-xs text-muted-foreground">Year</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h2 className="text-lg font-semibold mb-3">
              {language === 'ru' ? 'Описание' : 'Description'}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {language === 'ru' ? vehicle.descriptionRu : vehicle.descriptionEn}
            </p>
          </div>

          {/* Features */}
          <div>
            <h2 className="text-lg font-semibold mb-3">
              {language === 'ru' ? 'Включено' : 'Features'}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {vehicle.features.map((feature, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50"
                >
                  <span className="text-xl">{feature.icon}</span>
                  <span className="text-sm">
                    {language === 'ru' ? feature.labelRu : feature.labelEn}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Requirements */}
          <div>
            <h2 className="text-lg font-semibold mb-3">
              {language === 'ru' ? 'Требования' : 'Requirements'}
            </h2>
            <div className="space-y-2">
              {vehicle.requirements.map((req, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-primary" />
                  <span>{language === 'ru' ? req.ru : req.en}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Owner */}
          <div className="p-4 rounded-xl bg-card border border-border/50">
            <h2 className="text-lg font-semibold mb-3">
              {language === 'ru' ? 'Владелец' : 'Owner'}
            </h2>
            <div className="flex items-center gap-4">
              <img
                src={vehicle.owner.image}
                alt={vehicle.owner.name}
                className="w-14 h-14 rounded-full object-cover"
              />
              <div className="flex-1">
                <p className="font-medium">{vehicle.owner.name}</p>
                <p className="text-sm text-muted-foreground">
                  {vehicle.owner.responseRate}% {language === 'ru' ? 'ответов' : 'response rate'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Bottom CTA */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border/50">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <div className="flex-1">
              <span className="text-sm text-muted-foreground">
                {language === 'ru' ? 'От' : 'From'}
              </span>
              <p className="text-xl font-bold text-primary">
                ฿{vehicle.pricePerDay}/{language === 'ru' ? 'день' : 'day'}
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
              onClick={() => navigate(`/transport/booking/${id}`)}
            >
              <Calendar className="w-4 h-4 mr-2" />
              {language === 'ru' ? 'Забронировать' : 'Book Now'}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
