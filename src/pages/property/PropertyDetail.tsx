import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  MapPin, Star, BedDouble, Bath, Users, Maximize, 
  Share2, Calendar as CalendarIcon, Phone, MessageCircle, Shield,
  Zap, Loader2, ChevronRight, Home, Eye, Sofa, Building2,
  Sparkles, Clock, Award, Copy, Check, Minus, Plus
} from 'lucide-react';
import { resolveIcon } from '@/lib/iconMap';
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
  PropertyBookingCard,
  MessageHostButton
} from '@/components/property';
import { ProjectInfoCard } from '@/components/property/ProjectInfoCard';
import { RelatedServicesSection } from '@/components/crosssell';
import { UnitSpecs } from '@/components/property/UnitSpecs';
import { ExitIntentModal } from '@/components/leads/ExitIntentModal';
import { SEOHead, createRealEstateListingSchema } from '@/components/seo';
import { HostProfileSection } from '@/components/property/HostProfileSection';
import { PropertyLocationMap } from '@/components/property/PropertyLocationMap';
import { ReviewsSection } from '@/components/reviews/ReviewsSection';
import { PhotoLightbox } from '@/components/property/PhotoLightbox';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Calendar } from '@/components/ui/calendar';
import { useIsMobile } from '@/hooks/use-mobile';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';

// Demo fallback removed — only real DB data is used

// Import centralized taxonomy for amenities
import { getAmenityIcon, getAmenityLabel, normalizeAmenityId } from '@/lib/taxonomies';

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
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [dateSheetOpen, setDateSheetOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [guestCount, setGuestCount] = useState(2);
  const isMobile = useIsMobile();
  const isRu = language === 'ru';

  // Fetch real property from DB
  const { data: dbProperty, isLoading } = usePropertyWithRentalTerms(id);

  const property = dbProperty;
  const rentalTerms = property?.rentalTerms;

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

  // Share functionality
  const handleShare = useCallback(async () => {
    const shareUrl = window.location.href;
    const shareTitle = isRu ? (property?.title_ru || '') : (property?.title_en || '');
    const shareText = isRu 
      ? `Посмотрите это жильё: ${shareTitle}` 
      : `Check out this property: ${shareTitle}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
        return;
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success(isRu ? 'Ссылка скопирована!' : 'Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(isRu ? 'Не удалось скопировать' : 'Failed to copy');
    }
  }, [isRu, property?.title_en, property?.title_ru]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!property) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <Home className="w-16 h-16 text-muted-foreground/50" />
          <h2 className="text-xl font-semibold">{language === 'ru' ? 'Объект не найден' : 'Property not found'}</h2>
          <Button variant="outline" onClick={() => navigate('/property')}>
            {language === 'ru' ? 'К списку' : 'Back to listings'}
          </Button>
        </div>
      </AppLayout>
    );
  }

  const images = (property.images && property.images.length > 0) 
    ? property.images 
    : [property.cover_image].filter(Boolean);
  const amenities = property.amenities || [];

  // Duplicate loading check removed (already handled above)

  const pricePerNight = rentalTerms?.price_per_night || property.price || 0;
  const viewLabel = property.view_type ? viewTypeLabels[property.view_type] : null;

  const propertyTitle = isRu ? (property.title_ru || property.title_en) : (property.title_en || property.title_ru);
  const propertyDesc = isRu ? (property.description_ru || property.description_en || '') : (property.description_en || property.description_ru || '');

  return (
    <AppLayout>
      <SEOHead
        title={propertyTitle || undefined}
        description={propertyDesc.slice(0, 160)}
        image={property.cover_image || undefined}
        type="product"
        jsonLd={createRealEstateListingSchema({
          name: propertyTitle || '',
          description: propertyDesc.slice(0, 300),
          price: pricePerNight || undefined,
          currency: 'THB',
          image: property.cover_image || undefined,
          url: `https://myuno.app/property/${id}`,
          bedrooms: property.bedrooms || undefined,
          bathrooms: property.bathrooms || undefined,
          area: property.area_sqm || undefined,
          address: property.district || undefined,
        })}
      />
      <div className="pb-28">
        {/* Sticky Header */}
        <div className="sticky top-0 z-50 flex items-center justify-between p-4 bg-background/95 backdrop-blur-md border-b border-border/30">
          <BackButton fallbackPath="/property" variant="default" size="md" />
          
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2 text-sm"
              onClick={handleShare}
            >
              {copied ? <Check className="w-4 h-4 text-success" /> : <Share2 className="w-4 h-4" />}
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
            <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-2 gap-2 h-[50vh] min-h-[300px] max-h-[500px]">
              <div 
                className="col-span-2 row-span-2 relative cursor-pointer overflow-hidden rounded-l-xl"
                onClick={() => { setLightboxIndex(0); setShowAllPhotos(true); }}
              >
                <img
                  src={images[0]}
                  alt=""
                  className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-300"
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
                  onClick={() => { setLightboxIndex(i + 1); setShowAllPhotos(true); }}
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-300"
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
                  className="w-full h-full object-contain bg-muted"
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
        <div className="px-4 lg:px-8 xl:px-12 py-6 lg:py-10">
          <div className="grid lg:grid-cols-[1fr,420px] xl:grid-cols-[1fr,460px] gap-8 lg:gap-12">
            {/* Main Content Column */}
            <div className="space-y-6">
          {/* Title Section - Airbnb Style */}
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-foreground leading-tight">
              {isRu ? property.title_ru : property.title_en}
            </h1>
            
            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm lg:text-base">
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
          <div className="grid grid-cols-2 xs:grid-cols-4 gap-2 lg:gap-4">
            {[
              { icon: BedDouble, value: property.bedrooms || 0, label: isRu ? 'Спальни' : 'Beds' },
              { icon: Bath, value: property.bathrooms || 0, label: isRu ? 'Ванные' : 'Baths' },
              { icon: Maximize, value: property.area_sqm || 0, label: 'м²' },
              { icon: Users, value: property.max_guests || rentalTerms?.max_guests || 0, label: isRu ? 'Гости' : 'Guests' },
            ].map((spec, i) => (
              <div key={i} className="flex flex-col items-center p-3 lg:p-5 rounded-xl bg-muted/50">
                <spec.icon className="w-5 h-5 lg:w-6 lg:h-6 text-muted-foreground mb-1" />
                <span className="text-lg lg:text-xl font-bold">{spec.value}</span>
                <span className="text-xs lg:text-sm text-muted-foreground">{spec.label}</span>
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

          {/* Host Profile */}
          {rentalTerms?.manager_name && (
            <>
              <Separator />
              <HostProfileSection
                rentalTerms={rentalTerms}
                isVerified={property.is_verified}
              />
            </>
          )}

          <Separator />

          {/* Description */}
          <div>
            <h2 className="text-xl lg:text-2xl font-semibold mb-3 lg:mb-4">
              {isRu ? 'Об этом жилье' : 'About this place'}
            </h2>
            <p className="text-muted-foreground leading-relaxed lg:text-base lg:leading-7">
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
                seasonalPricing={rentalTerms.seasonal_pricing as any}
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
                <h2 className="text-xl lg:text-2xl font-semibold mb-4">
                  {isRu ? 'Что есть в жилье' : 'What this place offers'}
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                  {amenities.slice(0, 8).map((amenity, i) => {
                    const amenityId = typeof amenity === 'string' ? amenity : amenity;
                    const normalizedId = normalizeAmenityId(amenityId);
                    const icon = getAmenityIcon(normalizedId);
                    const label = getAmenityLabel(normalizedId, isRu ? 'ru' : 'en');
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-3 py-2"
                      >
                        {(() => { const AmenityIcon = resolveIcon(icon); return <AmenityIcon className="w-5 h-5 text-primary" />; })()}
                        <span className="text-sm">{label}</span>
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


          {/* Reviews */}
          <Separator />
          <ReviewsSection
            itemType="property"
            itemId={id || ''}
            itemName={isRu ? property.title_ru : property.title_en}
          />

          {/* Location Map */}
          <Separator />
          <PropertyLocationMap
            lat={property.lat}
            lng={property.lng}
            district={property.district}
            address={property.address}
          />
            </div>

            {/* Sidebar - Booking Card (Desktop Only) */}
            <div className="hidden lg:block space-y-4">
              <PropertyBookingCard
                propertyId={id || 'prop-1'}
                pricePerNight={pricePerNight}
                rentalTerms={rentalTerms}
                currency="THB"
                earlyBookingDiscount={property?.early_booking_discount ?? undefined}
                earlyBookingDays={property?.early_booking_days ?? undefined}
                lastMinuteDiscount={property?.last_minute_discount ?? undefined}
                lastMinuteDays={property?.last_minute_days ?? undefined}
                paymentPolicy={property?.payment_policy ?? undefined}
                prepayPercent={property?.prepay_percent ?? undefined}
                depositAmount={property?.deposit_amount ?? undefined}
                depositCurrency={property?.deposit_currency ?? undefined}
                customLengthDiscounts={property?.custom_length_discounts as any ?? undefined}
                negotiationEnabled={property?.negotiation_enabled ?? false}
                seasonalPricing={rentalTerms?.seasonal_pricing as any ?? undefined}
              />
              {/* Message Host Button for Desktop */}
              <MessageHostButton
                propertyId={id || 'prop-1'}
                propertyTitle={property.title_en}
                propertyTitleRu={property.title_ru}
                ownerName={rentalTerms?.manager_name}
                variant="outline"
                fullWidth
              />
            </div>
          </div>
        </div>

        {/* Fixed Bottom CTA - Mobile Only */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t border-border shadow-lg lg:hidden">
          <div className="max-w-[1536px] mx-auto flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-foreground">
                  ฿{pricePerNight.toLocaleString()}
                </span>
                <span className="text-sm text-muted-foreground">
                  /{isRu ? 'ночь' : 'night'}
                </span>
              </div>
              {dateRange?.from && dateRange?.to && (
                <p className="text-xs text-muted-foreground">
                  {format(dateRange.from, 'd MMM', { locale: isRu ? ru : undefined })} – {format(dateRange.to, 'd MMM', { locale: isRu ? ru : undefined })}
                </p>
              )}
              {!dateRange?.from && rentalTerms?.instant_booking && (
                <div className="flex items-center gap-1 text-xs text-primary mt-0.5">
                  <Zap className="w-3 h-3" />
                  <span>{isRu ? 'Мгновенное бронирование' : 'Instant booking'}</span>
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="flex-shrink-0"
              onClick={() => {
                if (rentalTerms?.manager_phone) {
                  window.open(`tel:${rentalTerms.manager_phone}`);
                } else {
                  toast.info(isRu ? 'Телефон не указан' : 'Phone not available');
                }
              }}
            >
              <Phone className="w-5 h-5" />
            </Button>
            <MessageHostButton
              propertyId={id || 'prop-1'}
              propertyTitle={property.title_en}
              propertyTitleRu={property.title_ru}
              variant="outline"
              size="icon"
              showLabel={false}
            />
            <Button
              size="lg"
              className={cn(
                "flex-shrink-0 px-6",
                rentalTerms?.instant_booking && !dateRange?.from && "bg-accent-amber hover:bg-accent-amber/90"
              )}
              onClick={() => {
                if (dateRange?.from && dateRange?.to) {
                  // Dates selected — navigate to inquiry
                  const params = new URLSearchParams({
                    checkIn: format(dateRange.from, 'yyyy-MM-dd'),
                    checkOut: format(dateRange.to, 'yyyy-MM-dd'),
                    guests: guestCount.toString(),
                  });
                  navigate(`/property/${id}/inquiry?${params.toString()}`);
                } else {
                  // No dates — open date picker sheet
                  setDateSheetOpen(true);
                }
              }}
            >
              {dateRange?.from && dateRange?.to ? (
                <>
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {isRu ? 'Забронировать' : 'Reserve'}
                </>
              ) : rentalTerms?.instant_booking ? (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  {isRu ? 'Забронировать' : 'Book Now'}
                </>
              ) : (
                <>
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {isRu ? 'Выбрать даты' : 'Select Dates'}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Date Picker Sheet */}
        <Sheet open={dateSheetOpen} onOpenChange={setDateSheetOpen}>
          <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
            <SheetHeader className="pb-2">
              <SheetTitle>
                {isRu ? 'Выберите даты' : 'Select dates'}
              </SheetTitle>
            </SheetHeader>
            
            <div className="space-y-4">
              {/* Calendar */}
              <div className="flex justify-center">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={1}
                  disabled={(date) => date < new Date()}
                  className="pointer-events-auto"
                />
              </div>

              {/* Selected range summary */}
              {dateRange?.from && dateRange?.to && (
                <div className="flex items-center justify-between px-2 py-3 rounded-xl bg-muted/50">
                  <div className="text-sm">
                    <span className="font-medium">{format(dateRange.from, 'd MMM', { locale: isRu ? ru : undefined })}</span>
                    <span className="mx-2 text-muted-foreground">→</span>
                    <span className="font-medium">{format(dateRange.to, 'd MMM', { locale: isRu ? ru : undefined })}</span>
                  </div>
                  <span className="text-sm font-semibold text-primary">
                    {Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))} {isRu ? 'ночей' : 'nights'}
                  </span>
                </div>
              )}

              {/* Guest counter */}
              <div className="flex items-center justify-between px-2">
                <span className="text-sm font-medium">{isRu ? 'Гости' : 'Guests'}</span>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                    disabled={guestCount <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-6 text-center font-semibold">{guestCount}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => setGuestCount(Math.min(rentalTerms?.max_guests || 10, guestCount + 1))}
                    disabled={guestCount >= (rentalTerms?.max_guests || 10)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Min stay warning */}
              {rentalTerms?.min_stay_nights && dateRange?.from && dateRange?.to && 
                Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) < rentalTerms.min_stay_nights && (
                <p className="text-xs text-destructive px-2">
                  {isRu ? `Минимум ${rentalTerms.min_stay_nights} ночей` : `Minimum stay: ${rentalTerms.min_stay_nights} nights`}
                </p>
              )}

              {/* Confirm button */}
              <Button
                className="w-full"
                size="lg"
                disabled={!dateRange?.from || !dateRange?.to}
                onClick={() => {
                  setDateSheetOpen(false);
                  if (dateRange?.from && dateRange?.to) {
                    const params = new URLSearchParams({
                      checkIn: format(dateRange.from, 'yyyy-MM-dd'),
                      checkOut: format(dateRange.to, 'yyyy-MM-dd'),
                      guests: guestCount.toString(),
                    });
                    navigate(`/property/${id}/inquiry?${params.toString()}`);
                  }
                }}
              >
                {dateRange?.from && dateRange?.to
                  ? (isRu ? 'Перейти к бронированию' : 'Continue to booking')
                  : (isRu ? 'Выберите даты' : 'Select dates')
                }
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Cross-sell */}
      <div className="px-4 lg:px-8 xl:px-12">
        <RelatedServicesSection currentVertical="property" />
      </div>

      {/* Photo Lightbox */}
      <PhotoLightbox
        images={images}
        initialIndex={lightboxIndex}
        open={showAllPhotos}
        onClose={() => setShowAllPhotos(false)}
      />

      {/* Exit Intent Lead Capture */}
      <ExitIntentModal
        vertical="property"
        projectTitle={isRu ? property.title_ru : property.title_en}
        projectId={id}
      />
    </AppLayout>
  );
}
