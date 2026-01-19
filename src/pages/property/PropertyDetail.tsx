import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  MapPin, Star, BedDouble, Bath, Users, Maximize, 
  Share2, Calendar, Phone, MessageCircle, Shield,
  Zap, Loader2, ChevronRight, Home, Eye, Sofa, Building2,
  Sparkles, Clock, Award, Copy, Check
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { FavoriteButton } from '@/components/uno/FavoriteButton';
import { BackButton } from '@/components/uno/BackButton';
import { usePropertyWithRentalTerms, PropertyRentalTerms, PropertyProject } from '@/hooks/useProperties';
import { 
  IncludedServices, 
  ExtraServices, 
  UtilitiesInfo, 
  CheckInDetails, 
  HouseRules,
  PropertyPriceBreakdown,
  PropertyBookingCard
} from '@/components/property';
import { ProjectInfoCard } from '@/components/property/ProjectInfoCard';
import { UnitSpecs } from '@/components/property/UnitSpecs';

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
    min_stay_nights: 30,
    max_guests: 8,
    weekly_discount: 10,
    monthly_discount: 25,
    check_in_time: '14:00',
    check_out_time: '12:00',
    deposit_amount: 10000,
    deposit_currency: 'THB',
    deposit_type: 'fixed',
    house_rules: 'No smoking indoors. Quiet hours after 10pm. Please respect the neighbors.',
    house_rules_ru: 'Не курить в помещении. Тишина после 22:00. Пожалуйста, уважайте соседей.',
    cancellation_policy: 'flexible',
    instant_booking: true,
    electricity_included: false,
    electricity_unit_price: 7,
    electricity_provider: 'PEA',
    electricity_metering: 'meter',
    electricity_notes: undefined,
    electricity_notes_ru: undefined,
    water_included: true,
    water_unit_price: undefined,
    water_notes: undefined,
    water_notes_ru: undefined,
    internet_speed: '100 Mbps',
    internet_provider: 'True',
    included_services: ['wifi', 'ac', 'cleaning_weekly', 'pool', 'parking', 'security'],
    extra_services: [
      { id: 'extra_cleaning', price: 500, currency: 'THB' },
      { id: 'airport_transfer', price: 1200, currency: 'THB' },
      { id: 'linen_change', price: 300, currency: 'THB' },
    ],
    key_handover: 'in_person',
    check_in_instructions: 'Meet at the property entrance',
    check_in_instructions_ru: 'Встреча у входа в объект',
    transfer_available: true,
    transfer_airport_price: 1200,
    transfer_notes: undefined,
    transfer_notes_ru: undefined,
    manager_name: 'Somchai',
    manager_phone: '+66-81-234-5678',
    manager_line_id: undefined,
    host_languages: ['Thai', 'English', 'Russian'],
    pets_allowed: false,
    pet_deposit: undefined,
    pet_notes: undefined,
    pet_notes_ru: undefined,
    parties_allowed: false,
    max_party_guests: undefined,
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00',
    children_friendly: true,
    has_crib: true,
    has_high_chair: true,
    extra_guest_price: 500,
    extra_guest_threshold: 4,
    early_checkin_price: 500,
    late_checkout_price: 500,
    late_checkout_penalty: 2000,
    smoking_penalty: 5000,
    emergency_contact_name: undefined,
    emergency_contact_phone: undefined,
  } as PropertyRentalTerms,
  project_id: undefined as string | undefined,
  floor: undefined as number | undefined,
  unit_number: undefined as string | undefined,
  view_type: undefined as string | undefined,
  furnishing_level: undefined as string | undefined,
  equipment: undefined as string[] | undefined,
  project: null as PropertyProject | null,
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

// View type labels
const viewTypeLabels: Record<string, { en: string; ru: string }> = {
  'sea': { en: 'Sea View', ru: 'Вид на море' },
  'ocean': { en: 'Ocean View', ru: 'Вид на океан' },
  'pool': { en: 'Pool View', ru: 'Вид на бассейн' },
  'garden': { en: 'Garden View', ru: 'Вид на сад' },
  'city': { en: 'City View', ru: 'Вид на город' },
  'mountain': { en: 'Mountain View', ru: 'Вид на горы' },
  'lagoon': { en: 'Lagoon View', ru: 'Вид на лагуну' },
};

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [activeImage, setActiveImage] = useState(0);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [copied, setCopied] = useState(false);
  const isRu = language === 'ru';

  // Fetch real property from DB
  const { data: dbProperty, isLoading } = usePropertyWithRentalTerms(id);

  // Use DB data or fallback to demo
  const property = useMemo(() => {
    if (dbProperty) return dbProperty;
    if (id?.startsWith('prop-')) return demoProperty;
    return demoProperty;
  }, [dbProperty, id]);

  const images = (property.images && property.images.length > 0) 
    ? property.images 
    : [property.cover_image].filter(Boolean);
  const amenities = property.amenities || [];
  const rentalTerms = property.rentalTerms;

  // Parse included_services and extra_services from JSON if needed
  const includedServices = useMemo(() => {
    if (!rentalTerms?.included_services) return [];
    if (Array.isArray(rentalTerms.included_services)) return rentalTerms.included_services;
    try {
      return JSON.parse(rentalTerms.included_services as string);
    } catch {
      return [];
    }
  }, [rentalTerms?.included_services]);

  const extraServices = useMemo(() => {
    if (!rentalTerms?.extra_services) return [];
    if (Array.isArray(rentalTerms.extra_services)) return rentalTerms.extra_services;
    try {
      return JSON.parse(rentalTerms.extra_services as string);
    } catch {
      return [];
    }
  }, [rentalTerms?.extra_services]);

  // Share functionality (after property is defined)
  const handleShare = useCallback(async () => {
    const shareUrl = window.location.href;
    const shareTitle = isRu ? property.title_ru : property.title_en;
    const shareText = isRu 
      ? `Посмотрите это жильё: ${shareTitle}` 
      : `Check out this property: ${shareTitle}`;

    // Try Web Share API first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // User cancelled or error - fall through to clipboard
        if ((err as Error).name === 'AbortError') return;
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success(isRu ? 'Ссылка скопирована!' : 'Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(isRu ? 'Не удалось скопировать' : 'Failed to copy');
    }
  }, [isRu, property.title_en, property.title_ru]);

  if (isLoading) {
    return (
      <AppLayout showBottomNav={false}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const pricePerNight = rentalTerms?.price_per_night || property.price || 0;
  const viewLabel = property.view_type ? viewTypeLabels[property.view_type] : null;

  return (
    <AppLayout showBottomNav={false}>
      <div className="pb-28">
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between p-4 bg-background/95 backdrop-blur-md border-b border-border/30">
          <BackButton fallbackPath="/property" variant="ghost" />
          
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2 text-sm"
              onClick={handleShare}
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
              <span className="hidden sm:inline">
                {copied ? (isRu ? 'Скопировано' : 'Copied') : (isRu ? 'Поделиться' : 'Share')}
              </span>
            </Button>
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
          </div>
        </div>

        {/* Airbnb-style Image Gallery */}
        <div className="relative">
          {images.length >= 5 ? (
            // Grid layout for 5+ images
            <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[50vh] min-h-[300px] max-h-[500px]">
              <div 
                className="col-span-2 row-span-2 relative cursor-pointer overflow-hidden rounded-l-xl"
                onClick={() => setActiveImage(0)}
              >
                <img
                  src={images[0]}
                  alt=""
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
              {images.slice(1, 5).map((img, i) => (
                <div 
                  key={i}
                  className={cn(
                    "relative cursor-pointer overflow-hidden",
                    i === 1 && "rounded-tr-xl",
                    i === 3 && "rounded-br-xl"
                  )}
                  onClick={() => setActiveImage(i + 1)}
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                  {i === 3 && images.length > 5 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white font-medium">+{images.length - 5}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            // Single image with thumbnails for fewer images
            <div>
              <div className="aspect-[16/10] overflow-hidden">
                <img
                  src={images[activeImage] || images[0]}
                  alt={isRu ? property.title_ru : property.title_en}
                  className="w-full h-full object-cover"
                />
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto bg-background/50">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={cn(
                        "w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all",
                        activeImage === i ? "border-primary ring-2 ring-primary/30" : "border-transparent opacity-70 hover:opacity-100"
                      )}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Photo counter badge */}
          <button
            onClick={() => setShowAllPhotos(true)}
            className="absolute bottom-4 right-4 px-3 py-1.5 bg-background/90 backdrop-blur-sm rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-background transition-colors"
          >
            <Eye className="w-4 h-4" />
            {images.length} {isRu ? 'фото' : 'photos'}
          </button>
        </div>

        {/* Main Content with Sidebar Layout for Desktop */}
        <div className="px-4 py-6">
          <div className="grid lg:grid-cols-[1fr,380px] gap-8">
            {/* Main Content Column */}
            <div className="space-y-6">
          {/* Title Section - Airbnb Style */}
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground leading-tight">
              {isRu ? property.title_ru : property.title_en}
            </h1>
            
            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm">
              {property.rating && (
                <>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-primary fill-primary" />
                    <span className="font-semibold">{property.rating}</span>
                  </div>
                  <span className="text-muted-foreground">
                    · {property.review_count || 0} {isRu ? 'отзывов' : 'reviews'}
                  </span>
                </>
              )}
              {property.is_verified && (
                <span className="flex items-center gap-1 text-primary">
                  · <Shield className="w-3.5 h-3.5" />
                  <span className="underline font-medium">{isRu ? 'Проверено' : 'Verified'}</span>
                </span>
              )}
              <span className="text-muted-foreground">
                · <MapPin className="w-3.5 h-3.5 inline" /> {property.district}
              </span>
            </div>
          </div>

          <Separator />

          {/* Quick Highlights - Airbnb style */}
          <div className="space-y-4">
            {/* Property Type Highlight */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Home className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">
                  {property.property_type === 'villa' ? (isRu ? 'Вилла целиком' : 'Entire villa') : 
                   property.property_type === 'condo' ? (isRu ? 'Апартаменты целиком' : 'Entire apartment') :
                   (isRu ? 'Жильё целиком' : 'Entire place')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {property.bedrooms || 0} {isRu ? 'спал.' : 'bed'} · {property.bathrooms || 0} {isRu ? 'ванн.' : 'bath'} · {property.area_sqm || 0} м² · {property.max_guests || rentalTerms?.max_guests || 0} {isRu ? 'гостей' : 'guests'}
                </p>
              </div>
            </div>

            {/* View Type Highlight */}
            {viewLabel && (
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Eye className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{isRu ? viewLabel.ru : viewLabel.en}</p>
                  <p className="text-sm text-muted-foreground">
                    {isRu ? 'Потрясающий вид из окон' : 'Amazing views from the windows'}
                  </p>
                </div>
              </div>
            )}

            {/* Instant Booking Highlight */}
            {rentalTerms?.instant_booking && (
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{isRu ? 'Мгновенное бронирование' : 'Instant booking'}</p>
                  <p className="text-sm text-muted-foreground">
                    {isRu ? 'Бронируйте без ожидания подтверждения' : 'Book without waiting for approval'}
                  </p>
                </div>
              </div>
            )}

            {/* Project/Building Highlight */}
            {property.project && (
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">
                    {isRu ? property.project.name_ru : property.project.name_en}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {property.floor && `${isRu ? 'Этаж' : 'Floor'} ${property.floor}`}
                    {property.unit_number && ` · ${property.unit_number}`}
                  </p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Specs Grid - Compact */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: BedDouble, value: property.bedrooms || 0, label: isRu ? 'Спальни' : 'Beds' },
              { icon: Bath, value: property.bathrooms || 0, label: isRu ? 'Ванные' : 'Baths' },
              { icon: Maximize, value: property.area_sqm || 0, label: 'м²' },
              { icon: Users, value: property.max_guests || rentalTerms?.max_guests || 0, label: isRu ? 'Гости' : 'Guests' },
            ].map((spec, i) => (
              <div key={i} className="flex flex-col items-center p-3 rounded-xl bg-muted/50">
                <spec.icon className="w-5 h-5 text-muted-foreground mb-1" />
                <span className="text-lg font-bold">{spec.value}</span>
                <span className="text-xs text-muted-foreground">{spec.label}</span>
              </div>
            ))}
          </div>

          {/* Unit Specs */}
          <UnitSpecs
            floor={property.floor}
            unitNumber={property.unit_number}
            viewType={property.view_type}
            furnishingLevel={property.furnishing_level}
            equipment={property.equipment}
          />

          {/* Project Info Card */}
          {property.project && (
            <>
              <Separator />
              <ProjectInfoCard project={property.project} />
            </>
          )}

          <Separator />

          {/* Description */}
          <div>
            <h2 className="text-xl font-semibold mb-3">
              {isRu ? 'Об этом жилье' : 'About this place'}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isRu ? property.description_ru : property.description_en}
            </p>
          </div>

          {/* Price Breakdown */}
          {rentalTerms && (
            <>
              <Separator />
              <PropertyPriceBreakdown
                pricePerNight={rentalTerms.price_per_night}
                weeklyDiscount={rentalTerms.weekly_discount}
                monthlyDiscount={rentalTerms.monthly_discount}
                depositAmount={rentalTerms.deposit_amount}
                depositType={rentalTerms.deposit_type}
                depositCurrency={rentalTerms.deposit_currency}
                extraGuestPrice={rentalTerms.extra_guest_price}
                extraGuestThreshold={rentalTerms.extra_guest_threshold}
                minStayNights={rentalTerms.min_stay_nights}
                currency="THB"
              />
            </>
          )}

          {/* Included Services */}
          {includedServices.length > 0 && (
            <>
              <Separator />
              <IncludedServices services={includedServices} />
            </>
          )}

          {/* Extra Services */}
          {extraServices.length > 0 && (
            <>
              <Separator />
              <ExtraServices services={extraServices} currency="THB" />
            </>
          )}

          {/* Utilities Info */}
          {rentalTerms && (
            <>
              <Separator />
              <UtilitiesInfo
                electricity={{
                  included: rentalTerms.electricity_included || false,
                  unitPrice: rentalTerms.electricity_unit_price,
                  provider: rentalTerms.electricity_provider,
                  metering: rentalTerms.electricity_metering,
                  notes: rentalTerms.electricity_notes,
                  notes_ru: rentalTerms.electricity_notes_ru,
                }}
                water={{
                  included: rentalTerms.water_included !== false,
                  unitPrice: rentalTerms.water_unit_price,
                  notes: rentalTerms.water_notes,
                  notes_ru: rentalTerms.water_notes_ru,
                }}
                internet={{
                  speed: rentalTerms.internet_speed,
                  provider: rentalTerms.internet_provider,
                }}
              />
            </>
          )}

          {/* Check-in Details */}
          {rentalTerms && (
            <>
              <Separator />
              <CheckInDetails
                checkIn={rentalTerms.check_in_time}
                checkOut={rentalTerms.check_out_time}
                earlyCheckinPrice={rentalTerms.early_checkin_price}
                lateCheckoutPrice={rentalTerms.late_checkout_price}
                lateCheckoutPenalty={rentalTerms.late_checkout_penalty}
                keyHandover={rentalTerms.key_handover}
                instructions={rentalTerms.check_in_instructions}
                instructions_ru={rentalTerms.check_in_instructions_ru}
                transfer={{
                  available: rentalTerms.transfer_available || false,
                  airportPrice: rentalTerms.transfer_airport_price,
                  notes: rentalTerms.transfer_notes,
                  notes_ru: rentalTerms.transfer_notes_ru,
                }}
                manager={{
                  name: rentalTerms.manager_name,
                  phone: rentalTerms.manager_phone,
                  lineId: rentalTerms.manager_line_id,
                  languages: rentalTerms.host_languages,
                }}
                currency="THB"
              />
            </>
          )}

          {/* Amenities */}
          {amenities.length > 0 && (
            <>
              <Separator />
              <div>
                <h2 className="text-xl font-semibold mb-4">
                  {isRu ? 'Что есть в жилье' : 'What this place offers'}
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {amenities.slice(0, 8).map((amenity, i) => {
                    const amenityName = typeof amenity === 'string' ? amenity : amenity;
                    const icon = amenityIcons[amenityName] || '✓';
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-3 py-2"
                      >
                        <span className="text-xl w-8">{icon}</span>
                        <span className="text-sm">{amenityName}</span>
                      </div>
                    );
                  })}
                </div>
                {amenities.length > 8 && (
                  <Button variant="outline" className="mt-4 w-full">
                    {isRu ? `Показать все ${amenities.length} удобств` : `Show all ${amenities.length} amenities`}
                  </Button>
                )}
              </div>
            </>
          )}

          {/* House Rules */}
          {rentalTerms && (
            <>
              <Separator />
              <HouseRules
                rules={rentalTerms.house_rules}
                rules_ru={rentalTerms.house_rules_ru}
                pets={{
                  allowed: rentalTerms.pets_allowed || false,
                  deposit: rentalTerms.pet_deposit,
                  notes: rentalTerms.pet_notes,
                  notes_ru: rentalTerms.pet_notes_ru,
                }}
                parties={{
                  allowed: rentalTerms.parties_allowed || false,
                  maxGuests: rentalTerms.max_party_guests,
                }}
                quietHours={{
                  start: rentalTerms.quiet_hours_start,
                  end: rentalTerms.quiet_hours_end,
                }}
                children={{
                  friendly: rentalTerms.children_friendly || false,
                  hasCrib: rentalTerms.has_crib,
                  hasHighChair: rentalTerms.has_high_chair,
                }}
                smoking={{
                  allowed: false,
                  penalty: rentalTerms.smoking_penalty,
                }}
                emergencyContact={{
                  name: rentalTerms.emergency_contact_name,
                  phone: rentalTerms.emergency_contact_phone,
                }}
                cancellationPolicy={rentalTerms.cancellation_policy}
              />
            </>
          )}

          {/* Host Card - Airbnb Style */}
          {'host' in property && property.host && (
            <>
              <Separator />
              <div className="p-5 rounded-2xl border border-border bg-card">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={property.host.image}
                      alt={property.host.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <Award className="w-3.5 h-3.5 text-primary-foreground" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{property.host.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {isRu ? 'Суперхозяин' : 'Superhost'}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-2xl font-bold">{property.host.responseRate}%</p>
                    <p className="text-sm text-muted-foreground">{isRu ? 'Ответов' : 'Response rate'}</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{property.host.responseTime}</p>
                    <p className="text-sm text-muted-foreground">{isRu ? 'Время ответа' : 'Response time'}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Location */}
          <Separator />
          <div>
            <h2 className="text-xl font-semibold mb-3">
              {isRu ? 'Где вы будете' : 'Where you\'ll be'}
            </h2>
            <div className="flex items-start gap-2 text-muted-foreground">
              <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <p>{property.address || property.district}</p>
            </div>
          </div>
            </div>

            {/* Sidebar - Booking Card (Desktop Only) */}
            <div className="hidden lg:block">
              <PropertyBookingCard
                propertyId={id || 'prop-1'}
                pricePerNight={pricePerNight}
                rentalTerms={rentalTerms}
                currency="THB"
              />
            </div>
          </div>
        </div>

        {/* Fixed Bottom CTA - Mobile Only */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t border-border shadow-lg lg:hidden">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-foreground">
                  ฿{pricePerNight.toLocaleString()}
                </span>
                <span className="text-sm text-muted-foreground">
                  /{isRu ? 'ночь' : 'night'}
                </span>
              </div>
              {rentalTerms?.instant_booking && (
                <div className="flex items-center gap-1 text-xs text-primary mt-0.5">
                  <Zap className="w-3 h-3" />
                  <span>{isRu ? 'Мгновенное бронирование' : 'Instant booking'}</span>
                </div>
              )}
            </div>
            <Button variant="outline" size="icon" className="flex-shrink-0">
              <Phone className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="icon" className="flex-shrink-0">
              <MessageCircle className="w-5 h-5" />
            </Button>
            <Button
              size="lg"
              className="flex-shrink-0 px-6"
              onClick={() => navigate(`/property/${id}/inquiry`)}
            >
              <Calendar className="w-4 h-4 mr-2" />
              {isRu ? 'Бронировать' : 'Reserve'}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
