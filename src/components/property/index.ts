/**
 * Canonical property cards — keep this list small and intentional:
 *  - PropertyCard        → admin/owner dashboards (hero/list/compact variants)
 *  - PropertyListingCard → public marketplace (rent/buy), Airbnb-style
 *  - ResalePropertyCard  → secondary-market listings (distinct `ResaleProperty`
 *                          entity: asking price, assignment premium, ROI)
 *  - commercial/*, HotelPropertyCard, LandPlotCard, OffplanProjectCard,
 *    ProjectInfoCard     → asset-class-specific, distinct data shapes
 * Removed: PropertyPreviewCard (unused duplicate of PropertyListingCard).
 */

// Unified admin/owner Property Card
export {
  PropertyCard,
  PropertyCardSkeleton,
  type PropertyCardProps,
  type PropertyCardVariant,
  type PropertyCardMode,
  type PropertyCardStats,
} from './PropertyCard';

// Canonical public marketplace card
export { PropertyListingCard } from './PropertyListingCard';

// Other exports
export { IncludedServices } from './IncludedServices';
export { ExtraServices } from './ExtraServices';
export { UtilitiesInfo } from './UtilitiesInfo';
export { CheckInDetails } from './CheckInDetails';
export { GuestAssuranceCard } from './GuestAssuranceCard';
export { HouseRules } from './HouseRules';
export { PropertyPriceBreakdown } from './PropertyPriceBreakdown';
export { PropertyBookingCard } from './PropertyBookingCard';
export { PropertyRooms } from './PropertyRooms';
export { PropertyCalendar } from './PropertyCalendar';
export { SeasonalPricing } from './SeasonalPricing';
export { GuestPropertyChat } from './GuestPropertyChat';
export { MessageHostButton } from './MessageHostButton';
export { CancellationPolicySelector } from './CancellationPolicySelector';
export { TripServicesGrid } from './TripServicesGrid';
export { BookingTermsCard } from './BookingTermsCard';
export { BookingConditionsChips } from './BookingConditionsChips';
export { PhotoLightbox } from './PhotoLightbox';
export { PropertySortSelect } from './PropertySortSelect';
// ProjectCarouselCard / ProjectPromoSection removed — superseded by OffplanProjectCard / OffplanPromoSection
export { OffplanProjectCard } from './OffplanProjectCard';
export { OffplanPromoSection } from './OffplanPromoSection';
export { DeveloperBadge } from './DeveloperBadge';
export { PricingRulesSection } from './PricingRulesSection';
export { PaymentPolicySection } from './PaymentPolicySection';
export { GuestExtraFeesSection } from './GuestExtraFeesSection';
export { GuestExtraFeesDisplay } from './GuestExtraFeesDisplay';
export { NegotiationPanel } from './NegotiationPanel';
export { GuestPriceProposal } from './GuestPriceProposal';

// Canonical Property Form (shared across Admin/Vendor/Owner)
export { CanonicalPropertyForm } from './canonical-form';
export type { CanonicalPropertyFormData } from './canonical-form';

// Listing-quality blocks (Zillow/Airbnb parity, phase 1)
export { PropertyAmenitiesSection } from './PropertyAmenitiesSection';
export { PropertySleepingArrangements } from './PropertySleepingArrangements';
export { PropertyReviewRatings } from './PropertyReviewRatings';
export { StayRulesSection } from './StayRulesSection';
