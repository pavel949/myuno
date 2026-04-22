import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin, Star, BedDouble, Bath, Users, Maximize,
  Share2, Loader2, Home, Sofa, Building2, Shield,
} from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { PropertyShareSheet } from '@/components/property/PropertyShareSheet';
import { CompareButton, type CompareProperty } from '@/components/property/PropertyCompare';
import { PropertyPdfButton } from '@/components/property/PropertyPdfBrochure';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/config/routes';
import { FavoriteButton } from '@/components/uno/FavoriteButton';
import { BackButton } from '@/components/uno/BackButton';
import { usePropertyWithRentalTerms } from '@/hooks/useProperties';
import {
  IncludedServices,
  ExtraServices,
  UtilitiesInfo,
  CheckInDetails,
  GuestAssuranceCard,
  HouseRules,
  PropertyBookingCard,
  MessageHostButton,
  GuestExtraFeesDisplay,
} from '@/components/property';
import { ProjectInfoCard } from '@/components/property/ProjectInfoCard';
import { RelatedServicesSection } from '@/components/crosssell';
import { UnitSpecs } from '@/components/property/UnitSpecs';
import { ExitIntentModal } from '@/components/leads/ExitIntentModal';
import { SEOHead, createRealEstateListingSchema } from '@/components/seo';
import { HostProfileSection } from '@/components/property/HostProfileSection';
import { PropertyLocationMap } from '@/components/property/PropertyLocationMap';
import { SimilarProperties } from '@/components/property/SimilarProperties';
import { ReviewsSection } from '@/components/reviews/ReviewsSection';
import { PhotoLightbox } from '@/components/property/PhotoLightbox';
import {
  PropertyDetailGallery,
  PropertyDetailHighlights,
  PropertyDetailDateSheet,
  PropertyDetailMobileBar,
  PropertyHeroFacts,
} from '@/components/property/detail';
import { GuestFavoriteBadge } from '@/components/property/GuestFavoriteBadge';
import { usePropertyAvailabilityManagement } from '@/hooks/usePropertyAvailabilityManagement';
import { normalizeViewTypes } from '@/lib/propertyFormNormalizers';

const viewTypeLabels: Record<string, { en: string; ru: string }> = {
  sea: { en: 'Sea View', ru: 'Вид на море' },
  ocean: { en: 'Ocean View', ru: 'Вид на океан' },
  pool: { en: 'Pool View', ru: 'Вид на бассейн' },
  garden: { en: 'Garden View', ru: 'Вид на сад' },
  city: { en: 'City View', ru: 'Вид на город' },
  mountain: { en: 'Mountain View', ru: 'Вид на горы' },
  lagoon: { en: 'Lagoon View', ru: 'Вид на лагуну' },
};

const OWNERSHIP_LABELS: Record<string, { en: string; ru: string }> = {
  freehold: { en: 'Freehold', ru: 'Фрихолд' },
  leasehold: { en: 'Leasehold', ru: 'Лизхолд' },
  company: { en: 'Thai company', ru: 'Тайская компания' },
  foreign_company: { en: 'Foreign LLC', ru: 'Иностранная компания' },
};

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const isRu = language === 'ru';

  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [dateSheetOpen, setDateSheetOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [guestCount, setGuestCount] = useState(2);

  const { availability } = usePropertyAvailabilityManagement(id);
  const unavailableDates = useMemo(
    () =>
      new Set(
        availability
          .filter((a: any) => a.status === 'blocked' || a.status === 'booked')
          .map((a: any) => {
            const d = a.date instanceof Date ? a.date : new Date(a.date);
            return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
          }),
      ),
    [availability],
  );

  const { data: property, isLoading } = usePropertyWithRentalTerms(id);
  const rentalTerms = property?.rentalTerms;

  const includedServices = useMemo(() => {
    if (!rentalTerms?.included_services) return [];
    if (Array.isArray(rentalTerms.included_services)) return rentalTerms.included_services;
    try { return JSON.parse(rentalTerms.included_services as string); } catch { return []; }
  }, [rentalTerms?.included_services]);

  const extraServices = useMemo(() => {
    if (!rentalTerms?.extra_services) return [];
    if (Array.isArray(rentalTerms.extra_services)) return rentalTerms.extra_services;
    try { return JSON.parse(rentalTerms.extra_services as string); } catch { return []; }
  }, [rentalTerms?.extra_services]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Home className="w-16 h-16 text-muted-foreground/50" />
        <h2 className="text-xl font-semibold">{isRu ? 'Объект не найден' : 'Property not found'}</h2>
        <Button variant="outline" onClick={() => navigate('/property')}>
          {isRu ? 'К списку' : 'Back to listings'}
        </Button>
      </div>
    );
  }

  const images = (property.images && property.images.length > 0)
    ? property.images
    : [property.cover_image].filter(Boolean) as string[];
  const amenities = property.amenities || [];

  const pricePerNight = rentalTerms?.price_per_night || property.price || 0;
  const isSaleListing = property.listing_type === 'sale' || Boolean(property.is_for_sale);
  const salePrice = property.sale_price ?? (isSaleListing ? property.price : undefined) ?? 0;
  const viewTypes = normalizeViewTypes(property.view_type);
  const viewLabels = viewTypes.map((vt) => viewTypeLabels[vt]).filter(Boolean);

  const propertyTitle = isRu
    ? (property.title_ru || property.title_en)
    : (property.title_en || property.title_ru);
  const propertyDesc = isRu
    ? (property.description_ru || property.description_en || '')
    : (property.description_en || property.description_ru || '');

  const ownershipLabel = property.ownership_form
    ? (OWNERSHIP_LABELS[property.ownership_form] ?? {
        en: property.ownership_form,
        ru: property.ownership_form,
      })[isRu ? 'ru' : 'en']
    : undefined;

  const openLightbox = (startIndex: number) => {
    setLightboxIndex(startIndex);
    setShowAllPhotos(true);
  };

  const handleDateSheetConfirm = () => {
    setDateSheetOpen(false);
    if (dateRange?.from && dateRange?.to) {
      const params = new URLSearchParams({
        checkIn: format(dateRange.from, 'yyyy-MM-dd'),
        checkOut: format(dateRange.to, 'yyyy-MM-dd'),
        guests: guestCount.toString(),
      });
      navigate(`${APP_ROUTES.PROPERTY_INQUIRY(id)}?${params.toString()}`);
    }
  };

  return (
    <>
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
        <div className="sticky top-0 z-50 flex items-center justify-between px-4 md:px-0 py-3 bg-background/95 backdrop-blur-md border-b border-border/30">
          <BackButton fallbackPath="/property" variant="default" size="md" />
          <div className="flex items-center gap-1">
            <PropertyShareSheet
              title={isRu ? (property.title_ru || property.title_en) : property.title_en}
              image={images[0]}
              district={property.district}
            >
              <Button variant="ghost" size="sm" className="gap-2 text-sm">
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">{isRu ? 'Поделиться' : 'Share'}</span>
              </Button>
            </PropertyShareSheet>
            <CompareButton
              property={{
                id: id || '',
                title_en: property.title_en,
                title_ru: property.title_ru,
                cover_image: property.cover_image,
                property_type: property.property_type,
                district: property.district,
                bedrooms: property.bedrooms,
                bathrooms: property.bathrooms,
                area_sqm: property.area_sqm,
                max_guests: property.max_guests || rentalTerms?.max_guests,
                price: property.price,
                price_per_night: rentalTerms?.price_per_night || property.price,
                price_period: property.price_period,
                rating: property.rating,
                amenities: property.amenities,
              } as CompareProperty}
            />
            <PropertyPdfButton property={{ ...property, price_per_night: rentalTerms?.price_per_night }} />
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

        {/* Image Gallery */}
        <PropertyDetailGallery
          images={images}
          alt={(isRu ? property.title_ru : property.title_en) || ''}
          onOpenLightbox={openLightbox}
        />

        {/* Main Content with Sidebar Layout for Desktop */}
        <div className="px-4 md:px-0 py-6 lg:py-10">
          <div className="grid lg:grid-cols-[1fr,minmax(320px,420px)] xl:grid-cols-[1fr,minmax(360px,460px)] gap-8 lg:gap-10 xl:gap-12 items-start">
            <article className="space-y-6 min-w-0">
              {/* Title */}
              <div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-foreground leading-tight">
                  {isRu ? property.title_ru : property.title_en}
                </h1>
                {/* Hero facts — Airbnb-style sub-title (e.g. "4 guests · 2 bedrooms · 1 bath") */}
                <PropertyHeroFacts
                  bedrooms={property.bedrooms}
                  beds={(property as any).beds ?? null}
                  bathrooms={property.bathrooms}
                  maxGuests={property.max_guests || rentalTerms?.max_guests}
                />
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
                  <GuestFavoriteBadge
                    rating={property.rating}
                    reviewsCount={property.review_count}
                    variant="inline"
                  />
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

              {isSaleListing && (
                <>
                  <Separator />
                  <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-2">
                    <h2 className="text-lg font-semibold">{isRu ? 'Продажа' : 'For sale'}</h2>
                    <p className="text-2xl font-bold tracking-tight">{formatPrice(salePrice)}</p>
                    {ownershipLabel && (
                      <p className="text-sm text-muted-foreground">{ownershipLabel}</p>
                    )}
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {isRu
                        ? 'Запросите детали сделки, Due Diligence и варианты оплаты у менеджера.'
                        : 'Ask the manager for transaction details, due diligence, and payment options.'}
                    </p>
                  </div>
                </>
              )}

              <Separator />

              <PropertyDetailHighlights
                propertyType={property.property_type}
                viewLabels={viewLabels}
                instantBooking={rentalTerms?.instant_booking}
                project={property.project}
                floor={property.floor}
                unitNumber={property.unit_number}
              />

              <Separator />

              {/* Specs Grid */}
              <div className="grid grid-cols-2 xs:grid-cols-4 gap-2 lg:gap-4">
                {[
                  { icon: BedDouble, value: property.bedrooms || 0, label: isRu ? 'Спальни' : 'Beds' },
                  { icon: Bath, value: property.bathrooms || 0, label: isRu ? 'Ванные' : 'Baths' },
                  { icon: Maximize, value: property.area_sqm || 0, label: 'м²' },
                  { icon: Users, value: property.max_guests || rentalTerms?.max_guests || 0, label: isRu ? 'Гости' : 'Guests' },
                ].filter((spec) => spec.value > 0).map((spec, i) => (
                  <div key={i} className="flex flex-col items-center p-3 lg:p-5 rounded-xl bg-muted/50">
                    <spec.icon className="w-5 h-5 lg:w-6 lg:h-6 text-muted-foreground mb-1" />
                    <span className="text-lg lg:text-xl font-bold">{spec.value}</span>
                    <span className="text-xs lg:text-sm text-muted-foreground">{spec.label}</span>
                  </div>
                ))}
              </div>

              {/* Unit Specs */}
              <Separator />
              <div>
                <h2 className="text-xl lg:text-2xl font-semibold mb-4">
                  {isRu ? 'Что есть в жилье' : 'What this place offers'}
                </h2>
                <UnitSpecs
                  floor={property.floor}
                  unitNumber={property.unit_number}
                  viewTypes={viewTypes}
                  furnishingLevel={property.furnishing_level}
                  equipment={
                    (property.equipment && property.equipment.length > 0)
                      ? property.equipment
                      : amenities.length > 0 ? amenities as string[] : undefined
                  }
                  propertyType={property.property_type}
                />
              </div>

              {property.project && (
                <>
                  <Separator />
                  <ProjectInfoCard project={property.project} />
                </>
              )}

              {rentalTerms?.manager_name && (
                <>
                  <Separator />
                  <HostProfileSection rentalTerms={rentalTerms} isVerified={property.is_verified} />
                </>
              )}

              <Separator />

              <div>
                <h2 className="text-xl lg:text-2xl font-semibold mb-3 lg:mb-4">
                  {isRu ? 'Об этом жилье' : 'About this place'}
                </h2>
                <p className="text-muted-foreground leading-relaxed lg:text-base lg:leading-7">
                  {isRu ? property.description_ru : property.description_en}
                </p>
              </div>

              {/* Pricing breakdown intentionally not rendered publicly.
                  Base/seasonal pricing belongs to the host workspace.
                  Public sees only the calculated total in PropertyBookingCard
                  after selecting dates. */}

              {includedServices.length > 0 && (
                <>
                  <Separator />
                  <IncludedServices services={includedServices} />
                </>
              )}

              {extraServices.length > 0 && (
                <>
                  <Separator />
                  <ExtraServices services={extraServices} currency="THB" />
                </>
              )}

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

              {/* Guest extra fees — host-configurable: metered electricity/water,
                  internet, cleaning, etc. Informational only; settled at the moment
                  the host specifies (usually check-out). */}
              {(property as any).guest_extra_fees && (
                <>
                  <Separator />
                  <GuestExtraFeesDisplay fees={(property as any).guest_extra_fees} />
                </>
              )}

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
                    showPricingDeposit={Boolean(
                      rentalTerms.deposit_amount != null && rentalTerms.deposit_amount > 0,
                    )}
                  />
                  <GuestAssuranceCard compact className="lg:hidden mt-2" />
                </>
              )}

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
                    smoking={{ allowed: false, penalty: rentalTerms.smoking_penalty }}
                    emergencyContact={{
                      name: rentalTerms.emergency_contact_name,
                      phone: rentalTerms.emergency_contact_phone,
                    }}
                    cancellationPolicy={rentalTerms.cancellation_policy}
                  />
                </>
              )}

              <Separator />
              <ReviewsSection
                itemType="property"
                itemId={id || ''}
                itemName={isRu ? property.title_ru : property.title_en}
              />

              <Separator />
              <PropertyLocationMap
                lat={property.lat}
                lng={property.lng}
                district={property.district}
                address={property.address}
              />

              <Separator />
              <SimilarProperties
                propertyId={id || ''}
                district={property.district}
                propertyType={property.property_type}
                bedrooms={property.bedrooms}
                nights={
                  dateRange?.from && dateRange?.to
                    ? Math.max(0, Math.round((dateRange.to.getTime() - dateRange.from.getTime()) / 86_400_000))
                    : undefined
                }
              />
            </article>

            {/* Sidebar — sticky on desktop */}
            <aside
              className={cn(
                'hidden lg:flex lg:flex-col gap-4 w-full',
                'lg:sticky lg:top-[4.75rem] xl:top-[5.25rem] lg:self-start lg:z-10',
                'lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-1',
              )}
            >
              {isSaleListing ? (
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <p className="text-sm text-muted-foreground">{isRu ? 'Цена' : 'Asking price'}</p>
                    <p className="text-2xl font-bold">{formatPrice(salePrice)}</p>
                    {ownershipLabel && <p className="text-sm">{ownershipLabel}</p>}
                    <MessageHostButton
                      propertyId={id || 'prop-1'}
                      propertyTitle={property.title_en}
                      propertyTitleRu={property.title_ru}
                      ownerName={rentalTerms?.manager_name}
                      variant="default"
                      fullWidth
                      labelRu="Запросить консультацию"
                      labelEn="Request consultation"
                    />
                    <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground leading-snug">
                      <p>
                        {isRu
                          ? 'Консьерж myUNO поможет с трансфером, визой и вопросами по бронированию.'
                          : 'myUNO concierge can help with transfers, visas, and booking questions.'}
                      </p>
                      <Link
                        to={APP_ROUTES.SUPPORT}
                        className="mt-1.5 inline-flex font-medium text-primary hover:underline"
                      >
                        {isRu ? 'Связаться с поддержкой' : 'Contact myUNO support'}
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="flex flex-col gap-3 w-full min-w-0">
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
                  <MessageHostButton
                    propertyId={id || 'prop-1'}
                    propertyTitle={property.title_en}
                    propertyTitleRu={property.title_ru}
                    ownerName={rentalTerms?.manager_name}
                    variant="ghost"
                    size="sm"
                    fullWidth
                    labelRu="Написать менеджеру"
                    labelEn="Message manager"
                  />
                  <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground leading-snug">
                    <p>
                      {isRu
                        ? 'Консьерж myUNO поможет с трансфером, визой и вопросами по бронированию.'
                        : 'myUNO concierge can help with transfers, visas, and booking questions.'}
                    </p>
                    <Link
                      to={APP_ROUTES.SUPPORT}
                      className="mt-1.5 inline-flex font-medium text-primary hover:underline"
                    >
                      {isRu ? 'Связаться с поддержкой' : 'Contact myUNO support'}
                    </Link>
                  </div>
                  <GuestAssuranceCard />
                </div>
              )}
            </aside>
          </div>
        </div>

        {/* Mobile bottom CTA */}
        <PropertyDetailMobileBar
          propertyId={id || 'prop-1'}
          isSaleListing={isSaleListing}
          salePrice={salePrice}
          pricePerNight={pricePerNight}
          ownershipLabel={ownershipLabel}
          titleEn={property.title_en}
          titleRu={property.title_ru}
          managerPhone={rentalTerms?.manager_phone}
          instantBooking={rentalTerms?.instant_booking}
          dateRange={dateRange}
          guestCount={guestCount}
          onOpenDatePicker={() => setDateSheetOpen(true)}
        />

        {/* Mobile Date Picker Sheet */}
        <PropertyDetailDateSheet
          open={dateSheetOpen}
          onOpenChange={setDateSheetOpen}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          guestCount={guestCount}
          onGuestCountChange={setGuestCount}
          maxGuests={rentalTerms?.max_guests || 10}
          minStayNights={rentalTerms?.min_stay_nights}
          availability={availability as any}
          unavailableDates={unavailableDates}
          onConfirm={handleDateSheetConfirm}
        />
      </div>

      {/* Cross-sell */}
      <div className="px-4 md:px-0">
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
    </>
  );
}
