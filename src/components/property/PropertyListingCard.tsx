/**
 * PropertyListingCard - Airbnb-style public marketplace card
 * Used in: PropertyIndex grid, search results
 * NOT for admin/owner dashboards (use PropertyCard instead)
 */

import React, { useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Star, Zap, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { FavoriteButton } from '@/components/uno/FavoriteButton';
import { PropertyImageCarousel } from './PropertyImageCarousel';
import { GuestFavoriteBadge, isGuestFavorite } from './GuestFavoriteBadge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { getDistrictLabel, getPropertyTypeLabel, getHighlightLabel, getViewTypeLabel } from '@/lib/taxonomies';
import { normalizeViewTypes } from '@/lib/propertyFormNormalizers';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/config/routes';
import { propertyDetailHref, propertySaleAskingPrice } from '@/lib/real-estate/propertyDetailIntent';
import { surfaceFromProperty } from '@/lib/real-estate/listingViewModel';
import type { Property } from '@/hooks/useProperties';
import { TrustStrip } from './TrustStrip';
import { StayRulesInline } from './StayRulesInline';
import { PropertyOfferLinks } from './PropertyJourney';
import { propertyArea } from '@/lib/real-estate/propertyJourney';

import { ClearViewBadge } from '@/components/clearview/ClearViewBadge';

interface PropertyListingCardProps {
  property: Property;
  mode?: 'rent' | 'buy';
  isHovered?: boolean;
  onHover?: (id: string | null) => void;
  isSelected?: boolean;
  onSelect?: (id: string | null) => void;
  companyName?: string;
  companySlug?: string;
  className?: string;
  /** Number of nights selected (to show total price) */
  nights?: number;
}



const formatPriceLabel = (period: string, lang: string) => {
  const labels: Record<string, { en: string; ru: string; th: string }> = {
    night: { en: ' night', ru: ' ночь', th: ' / คืน' },
    week: { en: ' week', ru: ' нед.', th: ' / สัปดาห์' },
    month: { en: ' month', ru: ' мес.', th: ' / เดือน' },
    year: { en: ' year', ru: ' год', th: ' / ปี' },
    total: { en: '', ru: '', th: '' },
  };
  return labels[period]?.[lang as 'en' | 'ru' | 'th'] || '';
};

function PropertyListingCardBase({
  property,
  mode = 'rent',
  isHovered = false,
  onHover,
  isSelected = false,
  onSelect,
  companyName,
  companySlug,
  className,
  nights,
}: PropertyListingCardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const detailHref = propertyDetailHref(property.id, mode, location.search);
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const isRu = language === 'ru';
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  const surface = useMemo(() => surfaceFromProperty(property, mode), [property, mode]);
  const title = isRu ? surface.titleRu : surface.titleEn;
  const images = [...(property.images || []), ...(property.cover_image ? [property.cover_image] : [])];

  const viewIds = useMemo(() => normalizeViewTypes(property.view_type), [property.view_type]);
  const primaryViewLabel =
    viewIds.length > 0 ? getViewTypeLabel(viewIds[0], isRu ? 'ru' : 'en') : null;

  const highlightChips = useMemo(() => {
    const ids = (property.highlights || []).filter(Boolean).slice(0, 3);
    return ids.map((id) => ({
      id,
      label: getHighlightLabel(id, isRu ? 'ru' : 'en'),
    }));
  }, [property.highlights, isRu]);

  // Format district using taxonomy for proper capitalization & localization
  const guideArea = propertyArea(property.district);
  const districtDisplay = property.district
    ? getDistrictLabel(property.district, isRu ? 'ru' : 'en')
    : 'Phuket';

  // Keep each displayed amount paired with its own billing period.
  const nightlyPrice = typeof property.price_per_night === 'number' && Number.isFinite(property.price_per_night) && property.price_per_night > 0 ? property.price_per_night : null;
  const legacyPrice = typeof property.price === 'number' && Number.isFinite(property.price) && property.price > 0 ? property.price : null;
  const unitPrice = nightlyPrice ?? legacyPrice;
  const pricePeriod = nightlyPrice !== null ? 'night' : property.price_period || 'night';
  const salePrice = propertySaleAskingPrice(property);
  const priceOnRequest = isRu ? 'Цена по запросу' : language === 'th' ? 'สอบถามราคา' : 'Price on request';
  const totalPrice = nights && nights > 0 && pricePeriod === 'night' && unitPrice !== null
    ? unitPrice * nights
    : null;

  // Scroll into view when selected externally (e.g. pin click on map).
  React.useEffect(() => {
    if (isSelected && rootRef.current) {
      rootRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isSelected]);

  const handleClick = () => {
    if (onSelect) {
      // In split/map mode, primary action is to select on the map, not navigate.
      onSelect(property.id);
    } else {
      navigate(detailHref);
    }
  };

  return (
    <div
      ref={rootRef}
      data-catalog-kind={surface.kind}
      data-listing-id={surface.id}
      aria-selected={isSelected}
      className={cn(
        "property-premium-listing group min-w-0 cursor-pointer transition-shadow",
        isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background rounded-sm",
        className,
      )}
      onClick={handleClick}
      onMouseEnter={() => onHover?.(property.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      {/* Image Carousel — Airbnb style */}
      <div className="relative">
        <PropertyImageCarousel
          key={property.id}
          images={images}
          alt={title}
          isHovered={isHovered}
          aspectClass="aspect-[4/3] sm:aspect-square"
        />


        {/* Favorite — Airbnb heart */}
        <div className="absolute top-2 right-2 z-10">
          <FavoriteButton
            itemType="property"
            itemId={property.id}
            itemData={{
              title_en: property.title_en,
              title_ru: property.title_ru,
              cover_image: property.cover_image || images[0],
              price: property.price,
              district: property.district,
            }}
            size="sm"
            variant="ghost"
            className="bg-transparent hover:bg-transparent p-0 h-auto [&_svg]:w-5 [&_svg]:h-5 sm:[&_svg]:w-6 sm:[&_svg]:h-6 [&_svg]:drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
          />
        </div>

        {/* Badges — top left.
            "Guest favorite" supersedes the legacy `is_featured` badge when
            the property meets the rating + review threshold (Airbnb pattern). */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {isGuestFavorite(property.rating, property.review_count) ? (
            <GuestFavoriteBadge
              rating={property.rating}
              reviewsCount={property.review_count}
            />
          ) : property.is_featured ? (
            <Badge className="bg-background text-foreground border-0 shadow-sm text-[11px] font-semibold px-2 py-0.5 rounded-full">
              {isRu ? 'Популярное' : 'Popular'}
            </Badge>
          ) : null}
          {primaryViewLabel && (
            <Badge className="bg-background/90 text-foreground border-0 shadow-sm text-[10px] font-medium px-2 py-0.5 rounded-full max-w-[140px] truncate">
              {primaryViewLabel}
            </Badge>
          )}
          {property.instant_booking && (
            <Badge className="bg-accent-amber text-white border-0 text-[11px] gap-1 rounded-full px-2 py-0.5">
              <Zap className="w-3 h-3" />
              {isRu ? 'Мгновенное' : 'Instant'}
            </Badge>
          )}
        </div>

        {/* ClearView grade overlay — bottom-left of image */}
        {(() => {
          const grade = (property as unknown as { clearview_badge?: string | null }).clearview_badge;
          if (!grade) return null;
          return (
            <div className="absolute bottom-2 left-2 z-10">
              <ClearViewBadge grade={grade as 'AAA' | 'AA' | 'A' | 'BBB' | 'BB'} size="xs" isRu={isRu} className="shadow-sm" />
            </div>
          );
        })()}
      </div>

      {/* Content — Airbnb compact style */}
      <div className="mt-3 space-y-1.5">
        {/* Listing name is the primary destination; district and rating are secondary. */}
        <div className="flex items-start justify-between gap-1">
          <h3 className="min-w-0 font-sans text-base font-semibold leading-snug text-foreground">
            <Link to={detailHref} onClick={(event) => event.stopPropagation()} className="line-clamp-2 break-words focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              {title || districtDisplay}
            </Link>
          </h3>
          {property.rating != null && property.rating > 0 && (
            <div className="flex items-center gap-0.5 shrink-0">
              <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-foreground text-foreground" />
              <span className="text-sm text-foreground">
                {property.rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {title && title !== districtDisplay && (
          <p className="text-sm leading-snug text-muted-foreground break-words">{guideArea ? <Link to={`/area/${guideArea.slug}`} state={{ propertyJourney: { href: detailHref, title: title || districtDisplay } }} onClick={event => event.stopPropagation()} className="property-area-link">{districtDisplay}</Link> : districtDisplay}</p>
        )}

        {/* Row 2: Property type · bedrooms */}
        <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
          {property.property_type
            ? getPropertyTypeLabel(property.property_type, isRu ? 'ru' : 'en')
            : title}
          {property.bedrooms != null && property.bedrooms > 0 && (
            <> · {property.bedrooms} {isRu ? (property.bedrooms === 1 ? 'сп.' : 'сп.') : (property.bedrooms === 1 ? 'bed' : 'beds')}</>
          )}
          {property.bathrooms != null && property.bathrooms > 0 && (
            <span className="hidden sm:inline"> · {property.bathrooms} {isRu ? (property.bathrooms === 1 ? 'ванная' : 'ванных') : (property.bathrooms === 1 ? 'bath' : 'baths')}</span>
          )}
          {property.area_sqm != null && property.area_sqm > 0 && (
            <span> · {Math.round(property.area_sqm)} m²</span>
          )}
          {property.max_guests != null && property.max_guests > 0 && (
            <span className="hidden sm:inline"> · {isRu ? `до ${property.max_guests} гостей` : `up to ${property.max_guests} guests`}</span>
          )}
        </p>

        {highlightChips.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {highlightChips.map((h) => (
              <span
                key={h.id}
                className="text-xs px-2 py-1 rounded-none bg-muted/80 text-muted-foreground line-clamp-1 max-w-full"
              >
                {h.label}
              </span>
            ))}
          </div>
        )}

        {mode === 'rent' && (
          <StayRulesInline
            minStayNights={property.min_stay_nights}
            maxStayNights={property.max_stay_nights}
            advanceNoticeHours={property.advance_notice_hours}
            preparationDays={property.preparation_days}
            bookingWindowMonths={property.booking_window_months}
            maxItems={3}
            className="mt-1"
          />
        )}



        {/* Row 3: Price */}
        <div className="pt-0.5 sm:pt-1">
          <p className="text-base leading-snug text-foreground">
            {mode === 'buy' ? (
              <span className="font-semibold">
                {salePrice !== null ? formatPrice(salePrice) : priceOnRequest}
              </span>
            ) : (
              <>
                <span className="font-semibold">{unitPrice !== null ? formatPrice(unitPrice) : priceOnRequest}</span>
                <span className="font-normal text-muted-foreground">
                  {unitPrice !== null && formatPriceLabel(pricePeriod, language)}
                </span>
              </>
            )}
          </p>
          {totalPrice && nights && mode !== 'buy' && (
            <p className="text-sm text-muted-foreground mt-1 underline decoration-muted-foreground/50">
              {isRu ? 'Ориентировочно' : language === 'th' ? 'ประมาณ' : 'Estimated'}: {formatPrice(totalPrice)}
            </p>
          )}
        </div>

        <div onClick={event => event.stopPropagation()}><PropertyOfferLinks property={property} mode={mode} search={location.search} /></div>

        {/* Trust signals — collapses if no data */}
        <TrustStrip
          titleDeedType={(property as unknown as { title_deed_type?: string | null }).title_deed_type ?? null}
          escrowOffered={(property as unknown as { escrow_offered?: boolean | null }).escrow_offered ?? null}
          clearviewBadge={(property as unknown as { clearview_badge?: string | null }).clearview_badge ?? null}
          floodRisk={(property as unknown as { flood_risk?: string | null }).flood_risk ?? null}
          ownerVerified={property.is_verified ?? null}
          isRu={isRu}
          className="mt-1.5 [&>div]:text-[10px] [&>div]:px-1.5 [&>div]:py-0.5 [&_svg]:w-3 [&_svg]:h-3"
        />

        {/* Managed by — links to the public management-company profile */}
        {companySlug && companyName && (
          <Link
            to={APP_ROUTES.MANAGEMENT_COMPANY(companySlug)}
            onClick={(e) => e.stopPropagation()}
            className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground hover:underline"
          >
            <Building2 className="w-3 h-3 shrink-0" />
            <span className="line-clamp-1">
              {isRu ? 'Управляет' : 'Managed by'} {companyName}
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}

// Memoized: the parent grid (PropertySearchPage) holds hover state, so without
// memo every card re-renders on each hover. onHover/onSelect are stable setters,
// so memo cuts hover re-renders from O(gridSize) to the two cards that changed.
export const PropertyListingCard = React.memo(PropertyListingCardBase);

export default PropertyListingCard;
