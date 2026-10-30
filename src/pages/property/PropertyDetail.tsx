import { PropertyRentalRateSummary } from '@/components/property/PropertyRentalRateSummary';
import '@/styles/public-commerce.css';
import '@/styles/premium-public.css';
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import {
  ChevronLeft, MapPin, Star, BedDouble, Bath, Users, Maximize,
  Share2, Loader2, Home, Sofa, Building2, Shield,
} from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { PropertyShareSheet } from '@/components/property/PropertyShareSheet';
import { CompareButton, PropertyCompareTrigger, type CompareProperty } from '@/components/property/PropertyCompare';
import { PropertyPdfButton } from '@/components/property/PropertyPdfBrochure';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { readPropertyGuestContext } from '@/lib/real-estate/propertyGuestContext';
import { propertyCatalogHref, propertyDetailHref, propertyDetailPricing, propertySupportsMode } from '@/lib/real-estate/propertyDetailIntent';
import { publicJourneyState, publicJourneyReturn, propertyAreaHref } from '@/lib/real-estate/publicJourney';
import { APP_ROUTES } from '@/lib/config/routes';
import { FavoriteButton } from '@/components/uno/FavoriteButton';
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
import { usePropertyUnavailableDates } from '@/hooks/usePropertyUnavailableDates';
import { normalizeViewTypes } from '@/lib/propertyFormNormalizers';
import { TrustStrip } from '@/components/property/TrustStrip';
import { InstallmentTimeline } from '@/components/property/InstallmentTimeline';
import { getInstallmentPreset, type InstallmentMilestone } from '@/lib/real-estate/installmentPresets';
import {
  mediaAlt,
  mediaCaption,
  usePropertyMedia,
  type MediaLocale,
} from '@/hooks/usePropertyListingQuality';
import { PropertyAmenitiesSection } from '@/components/property/PropertyAmenitiesSection';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PropertySleepingArrangements } from '@/components/property/PropertySleepingArrangements';
import { PropertyReviewRatings } from '@/components/property/PropertyReviewRatings';
import { StayRulesSection } from '@/components/property/StayRulesSection';
import { RoomCategoryOffers } from '@/components/property/RoomCategoryOffers';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

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
  const location = useLocation();
  const returnToResults = () => {
    const plan = publicJourneyReturn(location, propertyCatalogHref(searchParams.get('mode') === 'buy' ? 'buy' : 'rent', searchParams.toString()));
    if ('delta' in plan) navigate(plan.delta);
    else navigate(plan.href, { replace: plan.replace, state: plan.state });
  };
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const isRu = language === 'ru';
  const multiUnitEnabled = useFeatureFlag('multi_unit_properties');


  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [dateSheetOpen, setDateSheetOpen] = useState(false);
  const [editedDates, setEditedDates] = useState<{ id?: string; value?: DateRange }>();
  const [editedGuests, setEditedGuests] = useState<{ id?: string; value: number }>();

  const { data: mediaItems = [] } = usePropertyMedia(id);
  const availabilityQuery = usePropertyUnavailableDates(id);
  const availability = useMemo(() => (availabilityQuery.data ?? []).map(entry => ({
    date: entry.date, status: entry.kind,
  })), [availabilityQuery.data]);
  const unavailableDates = useMemo(
    () =>
      new Set(
        availability
          .filter((a) => a.status === 'blocked' || a.status === 'booked')
          .map((a) => {
            const d = a.date instanceof Date ? a.date : new Date(a.date);
            return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
          }),
      ),
    [availability],
  );

  const { data: property, isLoading, isError, refetch } = usePropertyWithRentalTerms(id);
  const rentalTerms = property?.rentalTerms;
  const knownCapacities = [rentalTerms?.max_guests, property?.max_guests].filter((value): value is number => typeof value === 'number' && value >= 1);
  const initialGuestContext = readPropertyGuestContext(searchParams.toString(), knownCapacities.length ? Math.min(...knownCapacities) : undefined);
  const dateRange = editedDates?.id === id ? editedDates.value : initialGuestContext.dateRange;
  const guestCount = editedGuests?.id === id ? editedGuests.value : initialGuestContext.guests;
  const setDateRange = (value: DateRange | undefined) => setEditedDates({ id, value });
  const setGuestCount = (value: number) => setEditedGuests({ id, value });

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
      <div className="premium-property premium-load-state" role="status" aria-label={isRu ? 'Загружаем объект' : 'Loading home'}><div className="h-8 w-2/3 bg-muted motion-safe:animate-pulse" /><div className="aspect-[4/3] md:aspect-[2/1] bg-muted motion-safe:animate-pulse" /><span className="sr-only">{isRu ? 'Загружаем объект…' : 'Loading home…'}</span></div>
    );
  }

  if (isError) return <div className="premium-property premium-load-state" role="alert"><h1>{isRu ? 'Не удалось загрузить объект' : 'Could not load this home'}</h1><p>{isRu ? 'Параметры поиска сохранены. Попробуйте ещё раз.' : 'Your search criteria are preserved. Please try again.'}</p><Button onClick={() => refetch()}>{isRu ? 'Повторить' : 'Try again'}</Button><Button variant="ghost" onClick={returnToResults}>{isRu ? 'К результатам' : 'Back to results'}</Button></div>;
  if (!property) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Home className="w-16 h-16 text-muted-foreground/50" />
        <h2 className="text-xl font-semibold">{isRu ? 'Объект не найден' : 'Property not found'}</h2>
        <Button variant="outline" onClick={returnToResults}>
          {isRu ? 'К списку' : 'Back to listings'}
        </Button>
      </div>
    );
  }

  // Loose extension for property fields not yet in generated DB types.
  // `rooms`, `beds` and the stay-rule fields now live on the Property model
  // (see useProperties.ts) — keep only what is still untyped here.
  type GuestExtraFee = { name?: string; amount?: number; per?: string };
  type PropertyExt = {
    tenancy_modes?: string[] | null;
    title_deed_type?: string | null;
    escrow_offered?: boolean | null;
    installment_plan?: { milestones?: InstallmentMilestone[]; preset_id?: string } | null;
    guest_extra_fees?: GuestExtraFee[] | null;
    price_per_month?: number | null;
    min_lease_months?: number | null;
  };
  const propertyExt = property as unknown as typeof property & PropertyExt;

  // Structured gallery (property_media) wins over the legacy images array; the
  // legacy array stays as a fallback for listings not migrated yet.
  const mediaLocale: MediaLocale = language === 'ru' ? 'ru' : language === 'th' ? 'th' : 'en';
  const legacyImages = (property.images && property.images.length > 0)
    ? property.images
    : [property.cover_image].filter(Boolean) as string[];
  const photoMedia = mediaItems.filter((m) => m.kind === 'photo' || m.kind === 'image');
  const galleryMedia = photoMedia.length > 0 ? photoMedia : [];
  const images = galleryMedia.length > 0 ? galleryMedia.map((m) => m.url) : legacyImages;
  const galleryFallbackAlt = ((isRu ? property.title_ru : property.title_en) || '') as string;
  const imageCaptions = galleryMedia.map((m) => mediaCaption(m, mediaLocale));
  const imageAlts = galleryMedia.map((m) => mediaAlt(m, mediaLocale, galleryFallbackAlt));
  const amenities = property.amenities || [];


  const pricing = propertyDetailPricing(property, rentalTerms, searchParams.get('mode'), searchParams.get('tenancy'));
  const isSaleListing = pricing.mode === 'buy';
  const requiresRentalRequest = !pricing.canQuoteShortStay;
  const pricePerNight = pricing.pricePerNight;
  const listingCurrency = property.currency?.trim().toUpperCase() ?? '';
  const priceOnRequest = isRu ? 'Цена по запросу' : 'Price on request';
  const salePrice = isSaleListing ? pricing.amount : null;
  const salePriceLabel = salePrice !== null ? formatPrice(salePrice) : priceOnRequest;
  const periodLabel = ({ night: isRu ? 'ночь' : 'night', week: isRu ? 'нед.' : 'week', month: isRu ? 'мес.' : 'month', year: isRu ? 'год' : 'year', total: '' } as Record<string, string>)[pricing.period ?? ''];
  const rentalPriceLabel = pricing.amount !== null ? `${formatPrice(pricing.amount)}${periodLabel ? ` / ${periodLabel}` : ''}` : priceOnRequest;
  const tenancyLabel = pricing.requestedTenancy === 'long' ? (isRu ? 'Долгосрочная аренда' : 'Long-term rental')
    : pricing.requestedTenancy === 'medium' ? (isRu ? 'Среднесрочная аренда' : 'Medium-term rental')
    : (isRu ? 'Условия аренды' : 'Rental terms');
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

  const offerChoices = <div className="premium-offer-choices" role="group" aria-label={isRu ? 'Предложение' : 'Offer'}>{(['rent', 'buy'] as const).filter(mode => propertySupportsMode(property, mode)).map(mode => <Link key={mode} replace state={location.state} aria-current={pricing.mode === mode ? 'true' : undefined} to={propertyDetailHref(id || '', mode, searchParams.toString())} onClick={event => { if (pricing.mode === mode) event.preventDefault(); }}>{mode === 'rent' ? (isRu ? 'Аренда' : 'Rent') : (isRu ? 'Покупка' : 'Buy')}</Link>)}</div>;
  const rentalTenancies = !isSaleListing && Array.isArray(property.tenancy_modes) && property.tenancy_modes.length > 1 ? <div className="premium-offer-choices" role="group" aria-label={isRu ? 'Срок аренды' : 'Rental duration'}>{property.tenancy_modes.filter(mode => ['short', 'medium', 'long'].includes(mode)).map(tenancy => { const params = new URLSearchParams(searchParams); params.set('tenancy', tenancy); return <Link key={tenancy} replace state={location.state} aria-current={searchParams.get('tenancy') === tenancy ? 'true' : undefined} to={propertyDetailHref(id || '', 'rent', params.toString())}>{({ short: isRu ? 'Поездка' : 'Short stay', medium: isRu ? 'Несколько месяцев' : 'A few months', long: isRu ? 'Надолго' : 'Long stay' } as Record<string, string>)[tenancy]}</Link>; })}</div> : null;
  const depositKnown = rentalTerms?.deposit_amount != null && Number.isFinite(rentalTerms.deposit_amount) && rentalTerms.deposit_amount > 0;
  const depositLabel = depositKnown && rentalTerms?.deposit_currency ? `${new Intl.NumberFormat(language).format(rentalTerms.deposit_amount!)} ${rentalTerms.deposit_currency}` : (isRu ? 'Уточните условия депозита' : 'Confirm deposit terms');

  const handleDateSheetConfirm = () => {
    if (!pricing.canQuoteShortStay || !availabilityQuery.isSuccess || availabilityQuery.isError) return;
    setDateSheetOpen(false);
    if (dateRange?.from && dateRange?.to) {
      const params = new URLSearchParams(propertyDetailHref(id || '', 'rent', searchParams.toString()).split('?')[1]);
      params.set('checkIn', format(dateRange.from, 'yyyy-MM-dd'));
      params.set('checkOut', format(dateRange.to, 'yyyy-MM-dd'));
      params.set('guests', guestCount.toString());
      navigate(`${APP_ROUTES.PROPERTY_INQUIRY(id)}?${params.toString()}`);
    }
  };

  const handleViewPricing = () => {
    if (!pricing.canQuoteShortStay) return;
    const panel = document.getElementById('property-pricing');
    if (panel && panel.getClientRects().length > 0) {
      panel.scrollIntoView({ block: 'start', behavior: 'smooth' });
      panel.focus({ preventScroll: true });
    } else {
      setDateSheetOpen(true);
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
          price: isSaleListing ? salePrice ?? undefined : undefined,
          currency: isSaleListing && salePrice !== null ? 'THB' : undefined,
          image: property.cover_image || undefined,
          url: `https://www.myuno.app/property/${id}`,
          bedrooms: property.bedrooms || undefined,
          bathrooms: property.bathrooms || undefined,
          area: property.area_sqm || undefined,
          address: property.district || undefined,
        })}
      />
      <div className="public-commerce public-commerce--property premium-property pb-28">
        {/* Property identity and secondary actions */}
        <div className="premium-property-identity flex flex-wrap items-start gap-4 py-5 md:py-7">
          <button type="button" className="premium-return home-text-link" onClick={returnToResults}><ChevronLeft className="h-4 w-4" aria-hidden="true" />{isRu ? 'К результатам' : 'Back to results'}</button>
          {/* Title */}
          <div className="min-w-0 flex-1 basis-[calc(100%-3.5rem)] md:basis-0" data-testid="property-identity">
            <h1 className="public-commerce-title text-foreground break-words">
              {propertyTitle}
            </h1>
            {/* Hero facts — Airbnb-style sub-title (e.g. "4 guests · 2 bedrooms · 1 bath") */}
            <PropertyHeroFacts
              bedrooms={property.bedrooms}
              beds={propertyExt.beds ?? null}
              bathrooms={property.bathrooms}
              maxGuests={property.max_guests || rentalTerms?.max_guests}
            />
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm lg:text-base">
              {property.rating != null && property.rating > 0 && property.review_count != null && property.review_count > 0 && (
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
              <span className="text-muted-foreground">
                · <MapPin className="w-3.5 h-3.5 inline" /> {property.district}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 ml-auto">
            <PropertyShareSheet
              title={isRu ? (property.title_ru || property.title_en) : property.title_en}
              image={images[0]}
              district={property.district}
            >
              <Button variant="ghost" size="sm" className="gap-2 text-sm" aria-label={isRu ? 'Поделиться' : 'Share'}>
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">{isRu ? 'Поделиться' : 'Share'}</span>
              </Button>
            </PropertyShareSheet>
            <details className="relative">
              <summary className="cursor-pointer list-none px-3 py-2 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{isRu ? 'Ещё' : 'More'}</summary>
              <div className="absolute right-0 top-full z-30 flex flex-col items-start gap-1 border border-border bg-background p-2 shadow-md min-w-40">
                <CompareButton className="[&>span]:inline min-h-11"
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
                    mode: isSaleListing ? 'buy' : 'rent',
                    guestSearch: propertyDetailHref(id || '', isSaleListing ? 'buy' : 'rent', searchParams.toString()).split('?')[1],
                    listing_type: property.listing_type,
                    sale_price: property.sale_price,
                    currency: property.currency,
                    sale_currency: (property as typeof property & { sale_currency?: string | null }).sale_currency,
                    price: property.price,
                    price_per_night: rentalTerms?.price_per_night || property.price_per_night,
                    price_period: property.price_period,
                    rating: property.rating,
                    amenities: property.amenities,
                  } as CompareProperty}
                />
                <PropertyPdfButton className="[&>span]:inline min-h-11" property={{ ...property, price_per_night: rentalTerms?.price_per_night }} />
                <PropertyCompareTrigger />
              </div>
            </details>
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
        <PropertyDetailGallery key={id}
          images={images}
          alt={galleryFallbackAlt}
          onOpenLightbox={openLightbox}
        />

        {pricing.hasOffer && <section className="premium-offer-mobile" aria-label={isRu ? 'Условия предложения' : 'Offer summary'}>{offerChoices}{rentalTenancies}<p>{isSaleListing ? salePriceLabel : pricing.canQuoteShortStay ? (isRu ? 'Выберите даты для расчёта стоимости' : 'Choose dates to see the total price') : rentalPriceLabel}</p>{!isSaleListing && depositKnown && <p>{isRu ? 'Депозит' : 'Deposit'}: {depositLabel}</p>}{!isSaleListing && propertyExt.min_lease_months && <p>{isRu ? 'Минимальный срок' : 'Minimum lease'}: {propertyExt.min_lease_months} {isRu ? 'мес.' : 'months'}</p>}</section>}
        {/* Main Content with Sidebar Layout for Desktop */}
        <div>
          <div className="premium-detail-grid">
            <article className="premium-property-content min-w-0">

              {!isSaleListing && pricing.hasOffer && <PropertyRentalRateSummary property={property} rentalTerms={rentalTerms} />}

              {/* Trust signals: title deed, escrow, ClearView, owner verified */}
              <TrustStrip
                titleDeedType={propertyExt.title_deed_type}
                escrowOffered={propertyExt.escrow_offered}
                ownerVerified={null}
                isRu={isRu}
              />

              {/* Payment schedule (sale / assignment) */}
              {(() => {
                const plan = propertyExt.installment_plan as { milestones?: InstallmentMilestone[]; preset_id?: string } | null;
                if (!plan || !Array.isArray(plan.milestones) || plan.milestones.length === 0) return null;
                const preset = plan.preset_id ? getInstallmentPreset(plan.preset_id) : null;
                const presetLabel = preset ? (isRu ? preset.labelRu : preset.labelEn) : undefined;
                return (
                  <InstallmentTimeline
                    milestones={plan.milestones}
                    totalPrice={salePrice ?? null}
                    presetLabel={presetLabel}
                    isRu={isRu}
                  />
                );
              })()}

              <Separator />

              {multiUnitEnabled && !isSaleListing && id && (
                <RoomCategoryOffers propertyId={id} dateRange={dateRange} guests={guestCount}
                  onDateRangeChange={setDateRange} onGuestsChange={setGuestCount} />
              )}

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
                  <div key={i} className="flex flex-col items-center p-3 lg:p-5 rounded-none bg-muted/50">
                    <spec.icon className="w-5 h-5 lg:w-6 lg:h-6 text-muted-foreground mb-1" />
                    <span className="text-lg lg:text-xl font-bold">{spec.value}</span>
                    <span className="text-xs lg:text-sm text-muted-foreground">{spec.label}</span>
                  </div>
                ))}
              </div>

              {(property.description_ru || property.description_en) && <div>
                <h2 className="text-xl lg:text-2xl font-semibold mb-3 lg:mb-4">
                  {isRu ? 'Об этом жилье' : 'About this place'}
                </h2>
                <p className="text-muted-foreground leading-relaxed lg:text-base lg:leading-7">
                  {isRu ? property.description_ru || property.description_en : property.description_en || property.description_ru}
                </p>
              </div>}

              {/* Unit Specs */}
              <Separator />
              {(property.floor || property.unit_number || viewTypes.length || property.furnishing_level || property.equipment?.length) ? <div>
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
                      : undefined
                  }
                  propertyType={property.property_type}
                />
              </div> : null}

              {/* Structured amenities (catalogue-backed, grouped by category) */}
              <Separator />
              <PropertyAmenitiesSection
                propertyId={id}
                fallbackAmenities={amenities as string[]}
              />

              {/* Sleeping arrangements from structured rooms data.
                  Both blocks self-hide when data is missing; the boundary keeps a
                  malformed jsonb payload from taking the whole page down. */}
              <ErrorBoundary fallback={null}>
                <PropertySleepingArrangements rooms={propertyExt?.rooms ?? null} />
              </ErrorBoundary>

              {/* Booking-window rules */}
              <ErrorBoundary fallback={null}>
                <StayRulesSection
                  minStayNights={rentalTerms?.min_stay_nights ?? propertyExt?.min_stay_nights ?? null}
                  maxStayNights={rentalTerms?.max_stay_nights ?? propertyExt?.max_stay_nights ?? null}
                  advanceNoticeHours={rentalTerms?.advance_notice_hours ?? propertyExt?.advance_notice_hours ?? null}
                  preparationDays={rentalTerms?.preparation_days ?? propertyExt?.preparation_days ?? null}
                  bookingWindowMonths={rentalTerms?.booking_window_months ?? propertyExt?.booking_window_months ?? null}
                />
              </ErrorBoundary>


              {property.project && (
                <>
                  <Separator />
                  <ProjectInfoCard project={property.project} mode={isSaleListing ? 'buy' : 'rent'} />
                </>
              )}

              {rentalTerms?.manager_name && (
                <>
                  <Separator />
                  <HostProfileSection rentalTerms={rentalTerms} />
                </>
              )}

              <Separator />


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
                  <ExtraServices services={extraServices} currency={listingCurrency} />
                </>
              )}

              {!isSaleListing && rentalTerms && (
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
              {propertyExt.guest_extra_fees && (
                <>
                  <Separator />
                  <GuestExtraFeesDisplay fees={propertyExt.guest_extra_fees} />
                </>
              )}

              {!isSaleListing && rentalTerms && (
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
                    currency={listingCurrency}

                    showPricingDeposit={Boolean(
                      rentalTerms.deposit_amount != null && rentalTerms.deposit_amount > 0,
                    )}
                    onViewPricing={pricing.canQuoteShortStay ? handleViewPricing : undefined}
                  />
                  <GuestAssuranceCard compact className="lg:hidden mt-2" />
                </>
              )}

              {!isSaleListing && rentalTerms && (
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
                      friendly: rentalTerms.children_friendly,
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
              <PropertyReviewRatings propertyId={id} />
              <ReviewsSection
                itemType="property"
                itemId={id || ''}
                itemName={isRu ? property.title_ru : property.title_en}
              />

              <Separator />
              {propertyAreaHref(property.district) && (
                <Link to={propertyAreaHref(property.district)!} state={publicJourneyState(location)} className="inline-flex min-h-11 items-center gap-2 text-primary underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-ring">
                  <MapPin className="h-4 w-4" aria-hidden />
                  {isRu ? `О районе ${property.district}` : `Explore ${property.district}`}
                </Link>
              )}
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
              id="property-pricing"
              tabIndex={-1}
              className={cn(
                'premium-offer hidden flex-col gap-4 w-full',
                'lg:sticky lg:top-[4.75rem] xl:top-[5.25rem] lg:self-start lg:z-10',
                'lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-1',
              )}
            >
              {offerChoices}
              {rentalTenancies}
              {!pricing.hasOffer ? (
                <p role="status">{isRu ? 'Предложение недоступно' : 'Offer unavailable'}</p>
              ) : (isSaleListing || requiresRentalRequest) ? (
                <Card>
                  <CardContent className="p-4 space-y-3">
                    {isSaleListing ? (
                      <>
                        <p className="text-sm text-muted-foreground">{isRu ? 'Цена' : 'Asking price'}</p>
                        <p className="text-2xl font-bold">{salePriceLabel}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground">
                          {tenancyLabel}
                        </p>
                        <p className="text-2xl font-bold">{rentalPriceLabel}</p>
                        {propertyExt.min_lease_months && (
                          <p className="text-xs text-muted-foreground">
                            {isRu
                              ? `Минимальный срок: ${propertyExt.min_lease_months} мес.`
                              : `Minimum lease: ${propertyExt.min_lease_months} months`}
                          </p>
                        )}
                      </>
                    )}
                    {ownershipLabel && <p className="text-sm">{ownershipLabel}</p>}
                    <MessageHostButton
                      propertyId={id || 'prop-1'}
                      propertyTitle={property.title_en}
                      propertyTitleRu={property.title_ru}
                      ownerName={rentalTerms?.manager_name}
                      variant="default"
                      fullWidth
                      labelRu={isSaleListing ? 'Запросить консультацию' : 'Запросить аренду'}
                      labelEn={isSaleListing ? 'Request consultation' : 'Request rental'}
                    />
                    <div className="rounded-none border border-border/60 bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground leading-snug">
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
                    key={id}
                    initialGuestContext={initialGuestContext}
                    guestSearch={propertyDetailHref(id || '', 'rent', searchParams.toString()).split('?')[1]}
                    propertyId={id || 'prop-1'}
                    pricePerNight={pricePerNight!}
                    rentalTerms={rentalTerms}
                    currency={listingCurrency}
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
                  <div className="rounded-none border border-border/60 bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground leading-snug">
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
        {pricing.hasOffer && !dateSheetOpen && <PropertyDetailMobileBar
          propertyId={id || 'prop-1'}
          isSaleListing={isSaleListing}
          isLongStayOnly={requiresRentalRequest}
          salePrice={salePrice}
          rentalPriceLabel={rentalPriceLabel}
          guestSearch={propertyDetailHref(id || '', pricing.mode, searchParams.toString()).split('?')[1]}
          pricePerNight={pricePerNight}
          ownershipLabel={ownershipLabel}
          titleEn={property.title_en}
          titleRu={property.title_ru}
          managerPhone={rentalTerms?.manager_phone}
          instantBooking={rentalTerms?.instant_booking}
          dateRange={dateRange}
          guestCount={guestCount}
          onOpenDatePicker={() => { if (pricing.canQuoteShortStay) setDateSheetOpen(true); }}
        />}

        {/* Mobile Date Picker Sheet */}
        {pricing.canQuoteShortStay && <PropertyDetailDateSheet
          open={dateSheetOpen}
          onOpenChange={setDateSheetOpen}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          guestCount={guestCount}
          onGuestCountChange={setGuestCount}
          maxGuests={rentalTerms?.max_guests || 10}
          minStayNights={rentalTerms?.min_stay_nights}
          availability={availability}
          availabilityReady={availabilityQuery.isSuccess && !availabilityQuery.isError}
          availabilityError={availabilityQuery.isError}
          onRetryAvailability={() => { void availabilityQuery.refetch(); }}
          unavailableDates={unavailableDates}
          onConfirm={handleDateSheetConfirm}
        />}
      </div>

      {/* Cross-sell */}
      <div className="px-4 md:px-0">
        <RelatedServicesSection currentVertical="property" />
      </div>

      {/* Photo Lightbox */}
      <PhotoLightbox
        images={images}
        captions={imageCaptions.length > 0 ? imageCaptions : undefined}
        alts={imageAlts.length > 0 ? imageAlts : undefined}
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
