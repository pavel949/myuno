import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  MapPin, Star, BedDouble, Bath, Users, Maximize, 
  Check, Share2, Calendar, Phone, MessageCircle, Shield
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FavoriteButton } from '@/components/uno/FavoriteButton';
import { BackButton } from '@/components/uno/BackButton';

// Demo property data
const demoProperty = {
  id: 'prop-1',
  titleEn: 'Luxury Ocean View Villa',
  titleRu: 'Роскошная вилла с видом на океан',
  descriptionEn: 'Stunning 4-bedroom villa with panoramic ocean views, private infinity pool, and modern amenities. Perfect for families or groups seeking luxury accommodation in the heart of Kamala.',
  descriptionRu: 'Потрясающая вилла с 4 спальнями и панорамным видом на океан, частным бассейном-инфинити и современными удобствами. Идеально подходит для семей или групп, ищущих роскошное жильё в самом сердце Камалы.',
  images: [
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
  ],
  rating: 4.9,
  reviewCount: 48,
  location: 'Kamala',
  locationRu: 'Камала',
  address: '123 Kamala Beach Road, Kamala, Phuket 83150',
  price: 85000,
  pricePeriod: 'month',
  propertyType: 'villa',
  listingType: 'rent',
  bedrooms: 4,
  bathrooms: 3,
  area: 350,
  maxGuests: 8,
  minStay: 30,
  isVerified: true,
  amenities: [
    { icon: '🏊', labelEn: 'Private Pool', labelRu: 'Частный бассейн' },
    { icon: '🌊', labelEn: 'Ocean View', labelRu: 'Вид на океан' },
    { icon: '🏋️', labelEn: 'Fitness Center', labelRu: 'Фитнес-центр' },
    { icon: '🌳', labelEn: 'Garden', labelRu: 'Сад' },
    { icon: '🅿️', labelEn: 'Parking', labelRu: 'Парковка' },
    { icon: '📶', labelEn: 'High-speed WiFi', labelRu: 'Быстрый WiFi' },
    { icon: '❄️', labelEn: 'Air Conditioning', labelRu: 'Кондиционер' },
    { icon: '👨‍🍳', labelEn: 'Full Kitchen', labelRu: 'Полная кухня' },
    { icon: '🧹', labelEn: 'Daily Cleaning', labelRu: 'Ежедневная уборка' },
    { icon: '🛡️', labelEn: '24/7 Security', labelRu: 'Охрана 24/7' },
  ],
  host: {
    name: 'Phuket Luxury Homes',
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100',
    responseRate: 98,
    responseTime: '< 1 hour',
  },
};

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [activeImage, setActiveImage] = useState(0);

  const property = demoProperty;

  const formatPrice = (price: number, period: string) => {
    const periodLabels: Record<string, { en: string; ru: string }> = {
      night: { en: '/night', ru: '/ночь' },
      week: { en: '/week', ru: '/неделю' },
      month: { en: '/month', ru: '/месяц' },
      year: { en: '/year', ru: '/год' },
      total: { en: '', ru: '' },
    };
    return `฿${price.toLocaleString()}${periodLabels[period]?.[language] || ''}`;
  };

  return (
    <AppLayout showBottomNav={false}>
      <div className="pb-24">
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between p-4 bg-background/80 backdrop-blur-sm border-b border-border/50">
          <BackButton fallbackPath="/property" variant="ghost" />
          
          <div className="flex items-center gap-2">
            <FavoriteButton
              itemType="property"
              itemId={id || 'prop-1'}
              itemData={{
                title_en: property.titleEn,
                title_ru: property.titleRu,
                image: property.images[0],
                price: property.price,
                location: property.location,
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
          <div className="aspect-[4/3] overflow-hidden">
            <img
              src={property.images[activeImage]}
              alt={language === 'ru' ? property.titleRu : property.titleEn}
              className="w-full h-full object-cover"
            />
          </div>
          {/* Thumbnails */}
          <div className="flex gap-2 p-4 overflow-x-auto">
            {property.images.map((img, i) => (
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
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl font-display font-bold text-foreground">
                  {language === 'ru' ? property.titleRu : property.titleEn}
                </h1>
                <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{language === 'ru' ? property.locationRu : property.location}</span>
                  {property.isVerified && (
                    <span className="flex items-center gap-1 text-primary text-sm">
                      <Shield className="w-4 h-4" />
                      {language === 'ru' ? 'Проверено' : 'Verified'}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Rating */}
            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-500/10">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="font-semibold">{property.rating}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                ({property.reviewCount} {language === 'ru' ? 'отзывов' : 'reviews'})
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
                  {formatPrice(property.price, property.pricePeriod)}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground">
                  {language === 'ru' ? 'Мин. срок' : 'Min. stay'}
                </span>
                <p className="text-sm font-medium">
                  {property.minStay} {language === 'ru' ? 'дней' : 'days'}
                </p>
              </div>
            </div>
          </div>

          {/* Specs */}
          <div className="grid grid-cols-4 gap-3">
            <div className="flex flex-col items-center p-3 rounded-xl bg-card border border-border/50">
              <BedDouble className="w-5 h-5 text-primary mb-1" />
              <span className="text-lg font-bold">{property.bedrooms}</span>
              <span className="text-xs text-muted-foreground">
                {language === 'ru' ? 'Спальни' : 'Beds'}
              </span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-xl bg-card border border-border/50">
              <Bath className="w-5 h-5 text-primary mb-1" />
              <span className="text-lg font-bold">{property.bathrooms}</span>
              <span className="text-xs text-muted-foreground">
                {language === 'ru' ? 'Ванные' : 'Baths'}
              </span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-xl bg-card border border-border/50">
              <Maximize className="w-5 h-5 text-primary mb-1" />
              <span className="text-lg font-bold">{property.area}</span>
              <span className="text-xs text-muted-foreground">м²</span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-xl bg-card border border-border/50">
              <Users className="w-5 h-5 text-primary mb-1" />
              <span className="text-lg font-bold">{property.maxGuests}</span>
              <span className="text-xs text-muted-foreground">
                {language === 'ru' ? 'Гости' : 'Guests'}
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h2 className="text-lg font-semibold mb-3">
              {language === 'ru' ? 'Описание' : 'Description'}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {language === 'ru' ? property.descriptionRu : property.descriptionEn}
            </p>
          </div>

          {/* Amenities */}
          <div>
            <h2 className="text-lg font-semibold mb-3">
              {language === 'ru' ? 'Удобства' : 'Amenities'}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {property.amenities.map((amenity, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50"
                >
                  <span className="text-xl">{amenity.icon}</span>
                  <span className="text-sm">
                    {language === 'ru' ? amenity.labelRu : amenity.labelEn}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Host */}
          <div className="p-4 rounded-xl bg-card border border-border/50">
            <h2 className="text-lg font-semibold mb-3">
              {language === 'ru' ? 'Владелец' : 'Host'}
            </h2>
            <div className="flex items-center gap-4">
              <img
                src={property.host.image}
                alt={property.host.name}
                className="w-14 h-14 rounded-full object-cover"
              />
              <div className="flex-1">
                <p className="font-medium">{property.host.name}</p>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                  <span>{property.host.responseRate}% {language === 'ru' ? 'ответов' : 'response'}</span>
                  <span>{property.host.responseTime}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <h2 className="text-lg font-semibold mb-3">
              {language === 'ru' ? 'Расположение' : 'Location'}
            </h2>
            <div className="flex items-start gap-2 text-muted-foreground">
              <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <p>{property.address}</p>
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
                {formatPrice(property.price, property.pricePeriod)}
              </p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {/* Call action */}}
            >
              <Phone className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {/* Message action */}}
            >
              <MessageCircle className="w-5 h-5" />
            </Button>
            <Button
              className="flex-1"
              onClick={() => navigate(`/property/inquiry/${id}`)}
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
