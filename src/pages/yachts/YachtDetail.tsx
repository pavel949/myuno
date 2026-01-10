import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Anchor, Star, Users, MapPin, Clock, Shield, Check, 
  Calendar, ChevronLeft, Share2, Heart, Phone, MessageCircle
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Demo yacht data - in production would come from API
const getYachtById = (id: string) => ({
  id,
  nameEn: 'Luxury Ocean Dream',
  nameRu: 'Люкс Океан Дрим',
  type: 'yacht',
  images: [
    'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800',
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
    'https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=800',
  ],
  price: 45000,
  priceHalfDay: 28000,
  capacity: 12,
  length: '24m',
  year: 2021,
  rating: 4.9,
  reviewCount: 45,
  location: 'Chalong Bay',
  locationRu: 'Бухта Чалонг',
  descriptionEn: 'Experience luxury on the water with our premium 24-meter yacht. Perfect for day trips, sunset cruises, or multi-day adventures around Phuket\'s beautiful islands.',
  descriptionRu: 'Испытайте роскошь на воде на нашей премиальной 24-метровой яхте. Идеально подходит для дневных поездок, закатных круизов или многодневных приключений по прекрасным островам Пхукета.',
  features: [
    { en: 'Professional captain & crew', ru: 'Профессиональный капитан и экипаж' },
    { en: 'Full catering available', ru: 'Полный кейтеринг доступен' },
    { en: 'Snorkeling equipment', ru: 'Оборудование для снорклинга' },
    { en: 'Kayaks & paddleboards', ru: 'Каяки и SUP-борды' },
    { en: 'Sound system & WiFi', ru: 'Аудиосистема и WiFi' },
    { en: 'Air-conditioned cabins', ru: 'Каюты с кондиционером' },
  ],
  specs: {
    length: '24m / 79ft',
    beam: '6.5m',
    draft: '2.1m',
    engines: '2x 1000HP',
    cruisingSpeed: '18 knots',
    maxSpeed: '26 knots',
    fuelCapacity: '4000L',
    cabins: 4,
    bathrooms: 3,
  },
  isVerified: true,
  providerName: 'Phuket Luxury Yachts',
  providerRating: 4.9,
  providerBookings: 234,
});

export default function YachtDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [currentImage, setCurrentImage] = useState(0);

  const yacht = getYachtById(id || 'yacht-1');

  return (
    <AppLayout>
      {/* Image Gallery */}
      <div className="relative h-72">
        <img
          src={yacht.images[currentImage]}
          alt=""
          className="w-full h-full object-cover"
        />
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
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
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          {yacht.images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentImage(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentImage ? 'bg-white w-4' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
        {/* Badges */}
        {yacht.isVerified && (
          <Badge className="absolute bottom-4 left-4 bg-primary text-primary-foreground">
            <Shield className="w-3 h-3 mr-1" />
            {language === 'ru' ? 'Проверено' : 'Verified'}
          </Badge>
        )}
      </div>

      <PageContainer className="-mt-4 relative z-10 bg-background rounded-t-3xl pt-6">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold">
            {language === 'ru' ? yacht.nameRu : yacht.nameEn}
          </h1>
          <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{language === 'ru' ? yacht.locationRu : yacht.location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span>{yacht.rating}</span>
              <span>({yacht.reviewCount})</span>
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
            <Anchor className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
            <p className="text-sm font-medium">{yacht.length}</p>
            <p className="text-xs text-muted-foreground">{language === 'ru' ? 'длина' : 'length'}</p>
          </div>
          <div className="text-center">
            <Clock className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
            <p className="text-sm font-medium">{yacht.year}</p>
            <p className="text-xs text-muted-foreground">{language === 'ru' ? 'год' : 'year'}</p>
          </div>
          <div className="text-center">
            <Shield className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
            <p className="text-sm font-medium">{yacht.specs.cabins}</p>
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
            <div>
              <h3 className="font-semibold mb-2">{language === 'ru' ? 'Описание' : 'Description'}</h3>
              <p className="text-sm text-muted-foreground">
                {language === 'ru' ? yacht.descriptionRu : yacht.descriptionEn}
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-3">{language === 'ru' ? 'Включено' : 'Features'}</h3>
              <div className="grid grid-cols-2 gap-2">
                {yacht.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>{language === 'ru' ? feature.ru : feature.en}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Provider */}
            <div className="p-4 bg-muted/50 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{yacht.providerName}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>{yacht.providerRating}</span>
                    <span>•</span>
                    <span>{yacht.providerBookings} {language === 'ru' ? 'бронирований' : 'bookings'}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="specs" className="mt-4">
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(yacht.specs).map(([key, value]) => (
                <div key={key} className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                  <p className="font-medium">{value}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="mt-4">
            <div className="text-center py-8 text-muted-foreground">
              {language === 'ru' ? 'Отзывы скоро появятся' : 'Reviews coming soon'}
            </div>
          </TabsContent>
        </Tabs>

        {/* Fixed Bottom Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{language === 'ru' ? 'от' : 'from'}</p>
            <p className="text-xl font-bold text-primary">฿{yacht.price.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{language === 'ru' ? '/день' : '/day'}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/yachts/${id}/booking?type=half`)}>
              {language === 'ru' ? 'Полдня' : 'Half Day'}
            </Button>
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
