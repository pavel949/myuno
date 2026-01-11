import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  MapPin, Star, BedDouble, Bath, Users, Maximize, 
  Share2, Calendar, Phone, MessageCircle, Shield,
  Clock, Zap, FileText, Loader2
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { FavoriteButton } from '@/components/uno/FavoriteButton';
import { BackButton } from '@/components/uno/BackButton';
import { usePropertyWithRentalTerms } from '@/hooks/useProperties';

// Demo property data as fallback
const demoProperty = {
  id: 'prop-1',
  title_en: 'Luxury Ocean View Villa',
  title_ru: 'Роскошная вилла с видом на океан',
  description_en: 'Stunning 4-bedroom villa with panoramic ocean views, private infinity pool, and modern amenities. Perfect for families or groups seeking luxury accommodation in the heart of Kamala.',
  description_ru: 'Потрясающая вилла с 4 спальнями и панорамным видом на океан, частным бассейном-инфинити и современными удобствами. Идеально подходит для семей или групп, ищущих роскошное жильё в самом сердце Камалы.',
  images: [
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
  ],
  cover_image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
  rating: 4.9,
  review_count: 48,
  district: 'Kamala',
  address: '123 Kamala Beach Road, Kamala, Phuket 83150',
  price: 85000,
  price_period: 'month',
  property_type: 'villa',
  listing_type: 'rent',
  bedrooms: 4,
  bathrooms: 3,
  area_sqm: 350,
  max_guests: 8,
  min_stay_nights: 30,
  is_verified: true,
  amenities: ['Pool', 'Ocean View', 'Fitness Center', 'Garden', 'Parking', 'WiFi', 'AC', 'Kitchen'],
  rentalTerms: {
    price_per_night: 3500,
    check_in_time: '14:00',
    check_out_time: '12:00',
    deposit_amount: 10000,
    deposit_currency: 'THB',
    house_rules: 'No smoking, no pets, quiet hours after 10pm',
    house_rules_ru: 'Не курить, без животных, тишина после 22:00',
    cancellation_policy: 'flexible',
    instant_booking: true,
  },
  host: {
    name: 'Phuket Luxury Homes',
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100',
    responseRate: 98,
    responseTime: '< 1 hour',
  },
};

// Amenity icons mapping
const amenityIcons: Record<string, string> = {
  'pool': '🏊', 'Pool': '🏊',
  'ocean view': '🌊', 'Ocean View': '🌊', 'sea view': '🌊', 'Sea View': '🌊',
  'gym': '🏋️', 'Gym': '🏋️', 'fitness': '🏋️', 'Fitness Center': '🏋️',
  'garden': '🌳', 'Garden': '🌳',
  'parking': '🅿️', 'Parking': '🅿️',
  'wifi': '📶', 'WiFi': '📶',
  'ac': '❄️', 'AC': '❄️', 'Air Conditioning': '❄️',
  'kitchen': '👨‍🍳', 'Kitchen': '👨‍🍳',
  'cleaning': '🧹', 'Daily Cleaning': '🧹',
  'security': '🛡️', '24/7 Security': '🛡️',
  'balcony': '🌅', 'Balcony': '🌅',
  'beach': '🏖️', 'Beach Access': '🏖️',
};

const cancellationPolicies: Record<string, { en: string; ru: string }> = {
  'flexible': { en: 'Flexible - Free cancellation 24h before', ru: 'Гибкая - бесплатная отмена за 24ч' },
  'moderate': { en: 'Moderate - Free cancellation 5 days before', ru: 'Умеренная - бесплатная отмена за 5 дней' },
  'strict': { en: 'Strict - 50% refund up to 1 week before', ru: 'Строгая - 50% возврат за неделю' },
  'non_refundable': { en: 'Non-refundable', ru: 'Без возврата' },
};

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [activeImage, setActiveImage] = useState(0);
  const isRu = language === 'ru';

  // Fetch real property from DB
  const { data: dbProperty, isLoading } = usePropertyWithRentalTerms(id);

  // Use DB data or fallback to demo
  const property = useMemo(() => {
    if (dbProperty) return dbProperty;
    // For demo IDs, use demo data
    if (id?.startsWith('prop-')) return demoProperty;
    return demoProperty;
  }, [dbProperty, id]);

  const formatPrice = (price?: number, period?: string) => {
    if (!price) return '';
    const periodLabels: Record<string, { en: string; ru: string }> = {
      night: { en: '/night', ru: '/ночь' },
      week: { en: '/week', ru: '/неделю' },
      month: { en: '/month', ru: '/месяц' },
      year: { en: '/year', ru: '/год' },
      total: { en: '', ru: '' },
    };
    return `฿${price.toLocaleString()}${periodLabels[period || '']?.[language] || ''}`;
  };

  const images = property.images || [property.cover_image].filter(Boolean);
  const amenities = property.amenities || [];
  const rentalTerms = property.rentalTerms;

  if (isLoading) {
    return (
      <AppLayout showBottomNav={false}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

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
                title_en: property.title_en,
                title_ru: property.title_ru,
                image: images[0],
                price: property.price,
                location: property.district,
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
              src={images[activeImage] || images[0]}
              alt={isRu ? property.title_ru : property.title_en}
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
          {/* Title & Badges */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl font-display font-bold text-foreground">
                  {isRu ? property.title_ru : property.title_en}
                </h1>
                <div className="flex items-center gap-2 mt-2 text-muted-foreground flex-wrap">
                  <MapPin className="w-4 h-4" />
                  <span>{property.district}</span>
                  {property.is_verified && (
                    <span className="flex items-center gap-1 text-primary text-sm">
                      <Shield className="w-4 h-4" />
                      {isRu ? 'Проверено' : 'Verified'}
                    </span>
                  )}
                  {rentalTerms?.instant_booking && (
                    <Badge variant="secondary" className="gap-1">
                      <Zap className="w-3 h-3" />
                      {isRu ? 'Мгновенное' : 'Instant'}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            {/* Rating */}
            {property.rating && (
              <div className="flex items-center gap-2 mt-3">
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-500/10">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-semibold">{property.rating}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  ({property.review_count || 0} {isRu ? 'отзывов' : 'reviews'})
                </span>
              </div>
            )}
          </div>

          {/* Price Card */}
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-sm text-muted-foreground">
                  {isRu ? 'Цена' : 'Price'}
                </span>
                <p className="text-3xl font-bold text-primary">
                  {formatPrice(property.price, property.price_period)}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground">
                  {isRu ? 'Мин. срок' : 'Min. stay'}
                </span>
                <p className="text-sm font-medium">
                  {property.min_stay_nights || rentalTerms?.min_stay_nights || 1} {isRu ? 'ночей' : 'nights'}
                </p>
              </div>
            </div>
          </div>

          {/* Specs */}
          <div className="grid grid-cols-4 gap-3">
            <div className="flex flex-col items-center p-3 rounded-xl bg-card border border-border/50">
              <BedDouble className="w-5 h-5 text-primary mb-1" />
              <span className="text-lg font-bold">{property.bedrooms || 0}</span>
              <span className="text-xs text-muted-foreground">
                {isRu ? 'Спальни' : 'Beds'}
              </span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-xl bg-card border border-border/50">
              <Bath className="w-5 h-5 text-primary mb-1" />
              <span className="text-lg font-bold">{property.bathrooms || 0}</span>
              <span className="text-xs text-muted-foreground">
                {isRu ? 'Ванные' : 'Baths'}
              </span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-xl bg-card border border-border/50">
              <Maximize className="w-5 h-5 text-primary mb-1" />
              <span className="text-lg font-bold">{property.area_sqm || 0}</span>
              <span className="text-xs text-muted-foreground">м²</span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-xl bg-card border border-border/50">
              <Users className="w-5 h-5 text-primary mb-1" />
              <span className="text-lg font-bold">{property.max_guests || rentalTerms?.max_guests || 0}</span>
              <span className="text-xs text-muted-foreground">
                {isRu ? 'Гости' : 'Guests'}
              </span>
            </div>
          </div>

          {/* Rental Terms (if available) */}
          {rentalTerms && (
            <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                {isRu ? 'Условия аренды' : 'Rental Terms'}
              </h2>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                {rentalTerms.check_in_time && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{isRu ? 'Заезд:' : 'Check-in:'} {rentalTerms.check_in_time}</span>
                  </div>
                )}
                {rentalTerms.check_out_time && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{isRu ? 'Выезд:' : 'Check-out:'} {rentalTerms.check_out_time}</span>
                  </div>
                )}
              </div>

              {rentalTerms.deposit_amount && (
                <div className="text-sm text-muted-foreground">
                  {isRu ? 'Залог:' : 'Deposit:'} ฿{rentalTerms.deposit_amount.toLocaleString()}
                </div>
              )}

              {rentalTerms.cancellation_policy && (
                <div className="text-sm">
                  <span className="text-muted-foreground">{isRu ? 'Отмена:' : 'Cancellation:'} </span>
                  <span>{cancellationPolicies[rentalTerms.cancellation_policy]?.[isRu ? 'ru' : 'en'] || rentalTerms.cancellation_policy}</span>
                </div>
              )}

              {(rentalTerms.house_rules || rentalTerms.house_rules_ru) && (
                <div className="text-sm border-t border-border/50 pt-3 mt-3">
                  <p className="font-medium mb-1">{isRu ? 'Правила дома:' : 'House rules:'}</p>
                  <p className="text-muted-foreground">
                    {isRu ? rentalTerms.house_rules_ru || rentalTerms.house_rules : rentalTerms.house_rules}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <h2 className="text-lg font-semibold mb-3">
              {isRu ? 'Описание' : 'Description'}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isRu ? property.description_ru : property.description_en}
            </p>
          </div>

          {/* Amenities */}
          {amenities.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">
                {isRu ? 'Удобства' : 'Amenities'}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {amenities.map((amenity, i) => {
                  const amenityName = typeof amenity === 'string' ? amenity : amenity;
                  const icon = amenityIcons[amenityName] || '✓';
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50"
                    >
                      <span className="text-xl">{icon}</span>
                      <span className="text-sm">{amenityName}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Host (for demo) */}
          {'host' in property && property.host && (
            <div className="p-4 rounded-xl bg-card border border-border/50">
              <h2 className="text-lg font-semibold mb-3">
                {isRu ? 'Владелец' : 'Host'}
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
                    <span>{property.host.responseRate}% {isRu ? 'ответов' : 'response'}</span>
                    <span>{property.host.responseTime}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Location */}
          <div>
            <h2 className="text-lg font-semibold mb-3">
              {isRu ? 'Расположение' : 'Location'}
            </h2>
            <div className="flex items-start gap-2 text-muted-foreground">
              <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <p>{property.address || property.district}</p>
            </div>
          </div>
        </div>

        {/* Fixed Bottom CTA */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border/50">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <div className="flex-1">
              <span className="text-sm text-muted-foreground">
                {isRu ? 'От' : 'From'}
              </span>
              <p className="text-xl font-bold text-primary">
                {formatPrice(property.price, property.price_period)}
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
              onClick={() => navigate(`/property/inquiry/${id}`)}
            >
              <Calendar className="w-4 h-4 mr-2" />
              {isRu ? 'Забронировать' : 'Book Now'}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
