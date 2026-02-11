/**
 * AnimatedRoutes — P3 Consolidated
 * 
 * Route tree only. All lazy imports come from pageRegistry.ts.
 * ~500 lines (route definitions) vs ~980 lines before.
 */
import React, { Suspense } from 'react';
import { Routes, Route, useLocation, Navigate, Outlet, useParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from './PageTransition';
import { ScrollToTop } from './ScrollToTop';
import { LoadingState } from '@/components/uno/LoadingSpinner';
import { AdminGuard, VendorGuard, OwnerGuard, TeamGuard, AuthGuard } from '@/components/auth';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdaptiveBottomNav } from './AdaptiveBottomNav';
import { OwnerLayout } from '@/components/owner/OwnerLayout';
import { VendorLayout } from '@/components/vendor/VendorLayout';
import { GuestLayout } from '@/components/guest/GuestLayout';
import { useNavigationDirection } from '@/hooks/useNavigationDirection';

// Core pages - eagerly loaded for fast initial navigation
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import NotFound from '@/pages/NotFound';

// All lazy page imports from centralized registry
import * as Pages from './pageRegistry';

// ── Redirect Helpers ──

const TransportIdRedirect = () => {
  const { id } = useParams();
  if (id === 'vehicle' || id === 'booking' || id === 'airport-transfer' || id === 'transfer-success' || id === 'airport' || id === 'taxi' || id === 'fast-track') {
    return null;
  }
  return <Navigate to={`/transport/vehicle/${id}`} replace />;
};

const TourRedirect = () => { const { id } = useParams(); return <Navigate to={`/experiences/${id}`} replace />; };
const TourBookRedirect = () => { const { id } = useParams(); return <Navigate to={`/experiences/${id}/book`} replace />; };
const WaterDetailRedirect = () => { const { id } = useParams(); return <Navigate to={`/experiences/${id}`} replace />; };
const WaterBookRedirect = () => { const { id } = useParams(); return <Navigate to={`/experiences/${id}/book`} replace />; };

// ── Layout Wrappers ──

const LazyPage = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingState />}>
    <PageTransition>{children}</PageTransition>
  </Suspense>
);

const AdminRouteLayout = () => (
  <AdminGuard>
    <AdminLayout>
      <Suspense fallback={<LoadingState />}>
        <Outlet />
      </Suspense>
    </AdminLayout>
  </AdminGuard>
);

const VendorRouteLayout = () => (
  <VendorGuard>
    <VendorLayout>
      <Suspense fallback={<LoadingState />}>
        <Outlet />
      </Suspense>
    </VendorLayout>
  </VendorGuard>
);


const GuestRouteLayout = () => (
  <AuthGuard>
    <GuestLayout>
      <Suspense fallback={<LoadingState />}>
        <Outlet />
      </Suspense>
    </GuestLayout>
  </AuthGuard>
);

// Prefetch popular routes on idle
const prefetchRoutes = () => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      import('@/pages/property/PropertyIndex');
      import('@/pages/restaurants/RestaurantsIndex');
      import('@/pages/experiences/ExperiencesIndex');
      import('@/pages/beauty/BeautySpaIndex');
    });
  }
};

export const AnimatedRoutes: React.FC = () => {
  const location = useLocation();
  useNavigationDirection();

  React.useEffect(() => { prefetchRoutes(); }, []);

  return (
    <>
      <ScrollToTop />
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
        {/* ── Core ── */}
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
        <Route path="/auth/account-type" element={<LazyPage><Pages.AccountTypeSelection /></LazyPage>} />
        <Route path="/auth/forgot-password" element={<LazyPage><Pages.ForgotPassword /></LazyPage>} />
        <Route path="/auth/reset-password" element={<LazyPage><Pages.ResetPassword /></LazyPage>} />
        
        {/* ── User ── */}
        <Route path="/discover" element={<LazyPage><Pages.Discover /></LazyPage>} />
        <Route path="/catalog" element={<LazyPage><Pages.PlatformCatalog /></LazyPage>} />
        <Route path="/categories" element={<Navigate to="/discover" replace />} />
        <Route path="/map" element={<LazyPage><Pages.MapView /></LazyPage>} />
        <Route path="/bookings" element={<LazyPage><Pages.Bookings /></LazyPage>} />
        <Route path="/bookings/:id" element={<LazyPage><Pages.BookingDetail /></LazyPage>} />
        <Route path="/orders/:id/tracking" element={<LazyPage><Pages.OrderTracking /></LazyPage>} />
        <Route path="/profile" element={<LazyPage><Pages.Profile /></LazyPage>} />
        <Route path="/profile/edit" element={<LazyPage><Pages.EditProfile /></LazyPage>} />
        <Route path="/profile/settings" element={<LazyPage><Pages.ProfileSettings /></LazyPage>} />
        <Route path="/profile/referral" element={<LazyPage><Pages.ReferralPage /></LazyPage>} />
        <Route path="/account" element={<LazyPage><Pages.UserAccountDashboard /></LazyPage>} />
        <Route path="/favorites" element={<LazyPage><Pages.Favorites /></LazyPage>} />
        <Route path="/search" element={<LazyPage><Pages.Search /></LazyPage>} />
        <Route path="/notifications" element={<LazyPage><Pages.Notifications /></LazyPage>} />
        <Route path="/profile/notifications" element={<LazyPage><Pages.NotificationSettingsEnhanced /></LazyPage>} />
        <Route path="/messages" element={<LazyPage><Pages.GuestMessages /></LazyPage>} />
        <Route path="/trip/:id" element={<LazyPage><Pages.GuestTripDetail /></LazyPage>} />
        <Route path="/history" element={<LazyPage><Pages.ViewHistory /></LazyPage>} />
        <Route path="/cart" element={<LazyPage><Pages.Cart /></LazyPage>} />
        <Route path="/wallet" element={<LazyPage><Pages.Wallet /></LazyPage>} />
        <Route path="/wallet/history" element={<LazyPage><Pages.TransactionHistory /></LazyPage>} />
        <Route path="/wallet/cards" element={<LazyPage><Pages.WalletCards /></LazyPage>} />
        <Route path="/sos" element={<LazyPage><Pages.SOS /></LazyPage>} />
        <Route path="/vip-concierge" element={<LazyPage><Pages.VipConcierge /></LazyPage>} />
        <Route path="/support" element={<LazyPage><Pages.Support /></LazyPage>} />
        <Route path="/support/new-ticket" element={<LazyPage><Pages.NewTicket /></LazyPage>} />
        <Route path="/support/tickets" element={<LazyPage><Pages.MyTickets /></LazyPage>} />
        <Route path="/support/tickets/:ticketId" element={<LazyPage><Pages.TicketDetail /></LazyPage>} />
        <Route path="/install" element={<LazyPage><Pages.Install /></LazyPage>} />
        <Route path="/booking/advance-requested" element={<LazyPage><Pages.AdvanceRequested /></LazyPage>} />
        
        {/* ── LifeOS ── */}
        <Route path="/life-flow/:code" element={<LazyPage><Pages.LifeFlowPage /></LazyPage>} />
        <Route path="/life/:code" element={<LazyPage><Pages.LifeFlowPage /></LazyPage>} />
        <Route path="/trip-planner" element={<LazyPage><Pages.TripPlannerPage /></LazyPage>} />
        <Route path="/list-with-us" element={<Pages.ListWithUsPage />} />
        
        {/* ── Beauty & Spa ── */}
        <Route path="/beauty" element={<LazyPage><Pages.BeautySpaIndex /></LazyPage>} />
        <Route path="/beauty/salon/:id" element={<LazyPage><Pages.SalonDetail /></LazyPage>} />
        <Route path="/beauty/booking/:id" element={<LazyPage><Pages.BeautyBooking /></LazyPage>} />
        <Route path="/beauty/services" element={<LazyPage><Pages.BeautyServices /></LazyPage>} />
        <Route path="/beauty/map" element={<LazyPage><Pages.BeautyMap /></LazyPage>} />
        <Route path="/salons" element={<Navigate to="/beauty" replace />} />
        <Route path="/spa" element={<Navigate to="/beauty" replace />} />
        
        {/* ── Property ── */}
        <Route path="/properties" element={<Navigate to="/property" replace />} />
        <Route path="/property" element={<LazyPage><Pages.PropertyIndex /></LazyPage>} />
        <Route path="/property/search" element={<LazyPage><Pages.PropertySearchPage /></LazyPage>} />
        <Route path="/property/consultation" element={<LazyPage><Pages.PropertyConsultation /></LazyPage>} />
        <Route path="/property/deposit-success" element={<LazyPage><Pages.PropertyDepositSuccess /></LazyPage>} />
        <Route path="/property/project/:id" element={<LazyPage><Pages.ProjectDetail /></LazyPage>} />
        <Route path="/property/:id" element={<LazyPage><Pages.PropertyDetail /></LazyPage>} />
        <Route path="/property/:id/inquiry" element={<LazyPage><Pages.PropertyInquiry /></LazyPage>} />
        <Route path="/property/map" element={<LazyPage><Pages.PropertyMap /></LazyPage>} />
        <Route path="/complexes" element={<LazyPage><Pages.ProjectsIndex /></LazyPage>} />
        <Route path="/company/:slug" element={<LazyPage><Pages.ManagementCompanyProfile /></LazyPage>} />
        
        {/* ── Offplan & Developers ── */}
        <Route path="/offplan" element={<LazyPage><Pages.OffplanIndex /></LazyPage>} />
        <Route path="/offplan/:id" element={<LazyPage><Pages.OffplanDetail /></LazyPage>} />
        <Route path="/developers" element={<LazyPage><Pages.DevelopersIndex /></LazyPage>} />
        <Route path="/developers/:id" element={<LazyPage><Pages.DeveloperDetail /></LazyPage>} />
        
        {/* ── Investment ── */}
        <Route path="/invest" element={<LazyPage><Pages.InvestmentIndex /></LazyPage>} />
        <Route path="/invest/dashboard" element={<LazyPage><Pages.InvestorDashboard /></LazyPage>} />
        <Route path="/invest/raise" element={<LazyPage><Pages.RaiseFunding /></LazyPage>} />
        <Route path="/invest/:id" element={<LazyPage><Pages.InvestmentDetail /></LazyPage>} />
        
        {/* ── Restaurants ── */}
        <Route path="/food" element={<Navigate to="/restaurants" replace />} />
        <Route path="/food/restaurant/:id" element={<Navigate to="/restaurants" replace />} />
        <Route path="/food/checkout" element={<Navigate to="/restaurants" replace />} />
        <Route path="/restaurants" element={<LazyPage><Pages.RestaurantsIndex /></LazyPage>} />
        <Route path="/restaurants/map" element={<LazyPage><Pages.RestaurantMap /></LazyPage>} />
        <Route path="/restaurants/:id" element={<LazyPage><Pages.RestaurantDetail /></LazyPage>} />
        <Route path="/restaurants/:id/reserve" element={<LazyPage><Pages.TableReservation /></LazyPage>} />
        <Route path="/restaurants/:id/delivery" element={<LazyPage><Pages.DeliveryCheckout /></LazyPage>} />
        <Route path="/restaurants/:id/experience/:setId" element={<LazyPage><Pages.SetMenuBooking /></LazyPage>} />
        
        {/* ── Transport ── */}
        <Route path="/transport" element={<LazyPage><Pages.TransportIndex /></LazyPage>} />
        <Route path="/transport/vehicle/:id" element={<LazyPage><Pages.VehicleDetail /></LazyPage>} />
        <Route path="/transport/booking/:id" element={<LazyPage><Pages.TransportBooking /></LazyPage>} />
        <Route path="/transport/airport-transfer" element={<LazyPage><Pages.AirportTransferBooking /></LazyPage>} />
        <Route path="/transport/transfer-success" element={<LazyPage><Pages.TransferSuccess /></LazyPage>} />
        <Route path="/transport/fast-track" element={<LazyPage><Pages.AirportFastTrackPage /></LazyPage>} />
        <Route path="/transport/airport" element={<Navigate to="/transport/airport-transfer" replace />} />
        <Route path="/airport-transfer" element={<Navigate to="/transport/airport-transfer" replace />} />
        <Route path="/transfer" element={<LazyPage><Pages.AirportTransferLanding /></LazyPage>} />
        <Route path="/flower-delivery" element={<LazyPage><Pages.FlowerDeliveryLanding /></LazyPage>} />
        <Route path="/rent-phuket" element={<LazyPage><Pages.RentalLanding /></LazyPage>} />
        <Route path="/new-developments" element={<LazyPage><Pages.NewDevelopmentsLanding /></LazyPage>} />
        <Route path="/transport/taxi" element={<LazyPage><Pages.TaxiBooking /></LazyPage>} />
        <Route path="/taxi-booking" element={<Navigate to="/transport/taxi" replace />} />
        <Route path="/transfers" element={<Navigate to="/transfer" replace />} />
        <Route path="/life" element={<Navigate to="/discover" replace />} />
        <Route path="/transport/:id" element={<TransportIdRedirect />} />
        
        {/* ── Fitness ── */}
        <Route path="/fitness" element={<LazyPage><Pages.FitnessIndex /></LazyPage>} />
        <Route path="/fitness/gym/:id" element={<LazyPage><Pages.GymDetail /></LazyPage>} />
        <Route path="/fitness/booking/:id" element={<LazyPage><Pages.FitnessBooking /></LazyPage>} />
        
        {/* ── Medical ── */}
        <Route path="/medical" element={<LazyPage><Pages.MedicalIndex /></LazyPage>} />
        <Route path="/medical/clinic/:id" element={<LazyPage><Pages.ClinicDetail /></LazyPage>} />
        <Route path="/medical/appointment/:id" element={<LazyPage><Pages.MedicalAppointment /></LazyPage>} />
        
        {/* ── Events ── */}
        <Route path="/events" element={<LazyPage><Pages.EventsIndex /></LazyPage>} />
        <Route path="/events/:id" element={<LazyPage><Pages.EventDetail /></LazyPage>} />
        <Route path="/events/booking/:id" element={<LazyPage><Pages.EventBooking /></LazyPage>} />
        <Route path="/venues/:id" element={<LazyPage><Pages.VenueDetail /></LazyPage>} />
        
        {/* ── Education ── */}
        <Route path="/education" element={<LazyPage><Pages.EducationIndex /></LazyPage>} />
        <Route path="/education/course/:id" element={<LazyPage><Pages.CourseDetail /></LazyPage>} />
        <Route path="/education/tutor/:id" element={<LazyPage><Pages.TutorDetail /></LazyPage>} />
        <Route path="/education/booking/:id" element={<LazyPage><Pages.EducationBooking /></LazyPage>} />
        
        {/* ── Flowers ── */}
        <Route path="/flowers" element={<LazyPage><Pages.FlowersIndex /></LazyPage>} />
        <Route path="/flowers/bouquet/:id" element={<LazyPage><Pages.BouquetDetail /></LazyPage>} />
        <Route path="/flowers/shop" element={<Navigate to="/flowers" replace />} />
        <Route path="/flowers/shop/:id" element={<LazyPage><Pages.FlowerShopDetail /></LazyPage>} />
        <Route path="/flowers/order" element={<LazyPage><Pages.FlowersOrder /></LazyPage>} />
        <Route path="/flowers/order/:id" element={<LazyPage><Pages.FlowersOrder /></LazyPage>} />
        <Route path="/flowers/success" element={<LazyPage><Pages.FlowersSuccess /></LazyPage>} />
        
        {/* ── Home Services ── */}
        <Route path="/services" element={<LazyPage><Pages.ServicesIndex /></LazyPage>} />
        <Route path="/services/provider/:id" element={<LazyPage><Pages.ServiceProviderDetail /></LazyPage>} />
        <Route path="/services/booking/:id" element={<LazyPage><Pages.ServiceBooking /></LazyPage>} />
        <Route path="/services/map" element={<LazyPage><Pages.ServicesMap /></LazyPage>} />
        <Route path="/services/order/:functionId" element={<LazyPage><Pages.ServiceFunctionOrder /></LazyPage>} />
        <Route path="/services/order/success" element={<LazyPage><Pages.ServiceOrderSuccess /></LazyPage>} />
        
        {/* ── Legal ── */}
        <Route path="/legal" element={<LazyPage><Pages.LegalServicesIndex /></LazyPage>} />
        <Route path="/legal/provider/:id" element={<LazyPage><Pages.LegalProviderDetail /></LazyPage>} />
        <Route path="/legal/visa/:id" element={<LazyPage><Pages.VisaServiceDetail /></LazyPage>} />
        <Route path="/legal/booking/:id" element={<LazyPage><Pages.LegalBooking /></LazyPage>} />
        <Route path="/visa" element={<LazyPage><Pages.VisaImmigrationPage /></LazyPage>} />
        
        {/* ── Insurance ── */}
        <Route path="/insurance" element={<LazyPage><Pages.InsuranceIndex /></LazyPage>} />
        <Route path="/insurance/travel" element={<LazyPage><Pages.TravelInsurance /></LazyPage>} />
        <Route path="/insurance/plan/:planId" element={<LazyPage><Pages.InsurancePlanDetail /></LazyPage>} />
        <Route path="/insurance/:id" element={<LazyPage><Pages.InsuranceDetail /></LazyPage>} />
        <Route path="/insurance/:id/quote" element={<LazyPage><Pages.InsuranceQuote /></LazyPage>} />
        
        {/* ── Expat ── */}
        <Route path="/banking" element={<LazyPage><Pages.BankingPage /></LazyPage>} />
        <Route path="/veterinary" element={<LazyPage><Pages.VeterinaryPage /></LazyPage>} />
        
        {/* ── Knowledge ── */}
        <Route path="/knowledge" element={<LazyPage><Pages.KnowledgeHub /></LazyPage>} />
        <Route path="/knowledge/:section" element={<LazyPage><Pages.KnowledgeSectionPage /></LazyPage>} />
        <Route path="/knowledge/:section/:slug" element={<LazyPage><Pages.KnowledgeArticlePage /></LazyPage>} />
        
        {/* ── Experiences ── */}
        <Route path="/experiences" element={<LazyPage><Pages.ExperiencesIndex /></LazyPage>} />
        <Route path="/experiences/:id" element={<LazyPage><Pages.ExperienceDetail /></LazyPage>} />
        <Route path="/experiences/:id/book" element={<LazyPage><Pages.ExperienceBooking /></LazyPage>} />
        
        {/* Legacy Tours/Water */}
        <Route path="/tours" element={<Navigate to="/experiences?type=tour" replace />} />
        <Route path="/tours/:id" element={<TourRedirect />} />
        <Route path="/tours/:id/book" element={<TourBookRedirect />} />
        <Route path="/water" element={<Navigate to="/experiences?type=activity" replace />} />
        <Route path="/water/:id" element={<WaterDetailRedirect />} />
        <Route path="/water/:id/book" element={<WaterBookRedirect />} />
        
        {/* ── Pharmacy ── */}
        <Route path="/pharmacy" element={<LazyPage><Pages.PharmacyIndex /></LazyPage>} />
        <Route path="/pharmacy/:id" element={<LazyPage><Pages.PharmacyDetail /></LazyPage>} />
        
        {/* ── Pets ── */}
        <Route path="/pets" element={<LazyPage><Pages.PetsIndex /></LazyPage>} />
        <Route path="/pets/transport" element={<LazyPage><Pages.PetTransport /></LazyPage>} />
        <Route path="/pets/:id" element={<LazyPage><Pages.PetServiceDetail /></LazyPage>} />
        <Route path="/pets/:id/booking" element={<LazyPage><Pages.PetServiceBooking /></LazyPage>} />
        
        {/* ── Yachts ── */}
        <Route path="/yachts" element={<LazyPage><Pages.YachtsIndex /></LazyPage>} />
        <Route path="/yachts/:id" element={<LazyPage><Pages.YachtDetail /></LazyPage>} />
        <Route path="/yachts/:id/booking" element={<LazyPage><Pages.YachtBooking /></LazyPage>} />
        
        {/* ── Cleaning ── */}
        <Route path="/cleaning" element={<LazyPage><Pages.CleaningIndex /></LazyPage>} />
        <Route path="/cleaning/:id" element={<LazyPage><Pages.CleaningDetail /></LazyPage>} />
        <Route path="/cleaning/:id/book" element={<LazyPage><Pages.CleaningBooking /></LazyPage>} />
        
        {/* ── Babysitter ── */}
        <Route path="/babysitter" element={<LazyPage><Pages.BabysitterIndex /></LazyPage>} />
        <Route path="/babysitter/:id" element={<LazyPage><Pages.BabysitterDetail /></LazyPage>} />
        <Route path="/babysitter/:id/book" element={<LazyPage><Pages.BabysitterBooking /></LazyPage>} />
        
        {/* ── Delivery ── */}
        <Route path="/delivery" element={<LazyPage><Pages.DeliveryIndex /></LazyPage>} />
        
        {/* ── Market ── */}
        <Route path="/market" element={<LazyPage><Pages.MarketIndex /></LazyPage>} />
        <Route path="/market/categories" element={<LazyPage><Pages.MarketCatalogPage /></LazyPage>} />
        <Route path="/market/category/:categoryId" element={<LazyPage><Pages.MarketCategoryPage /></LazyPage>} />
        <Route path="/market/product/:productId" element={<LazyPage><Pages.ProductDetailPage /></LazyPage>} />
        <Route path="/market/vendor/:slug" element={<LazyPage><Pages.VendorPage /></LazyPage>} />
        <Route path="/market/wishlist" element={<LazyPage><Pages.WishlistPage /></LazyPage>} />
        <Route path="/market/store/:id" element={<LazyPage><Pages.StoreDetail /></LazyPage>} />
        <Route path="/market/checkout" element={<LazyPage><Pages.MarketCheckout /></LazyPage>} />
        <Route path="/sell" element={<AuthGuard><LazyPage><Pages.SellItemPage /></LazyPage></AuthGuard>} />
        
        {/* ── Classifieds (Барахолка) ── */}
        <Route path="/classifieds" element={<LazyPage><Pages.ClassifiedsIndex /></LazyPage>} />
        <Route path="/classifieds/sell" element={<AuthGuard><LazyPage><Pages.ClassifiedsSellPage /></LazyPage></AuthGuard>} />
        <Route path="/classifieds/:id" element={<LazyPage><Pages.ClassifiedDetailPage /></LazyPage>} />
        
        {/* ── Info ── */}
        <Route path="/about" element={<LazyPage><Pages.AboutPage /></LazyPage>} />
        <Route path="/how-it-works" element={<LazyPage><Pages.HowItWorksPage /></LazyPage>} />
        <Route path="/faq" element={<LazyPage><Pages.FAQPage /></LazyPage>} />
        <Route path="/partners" element={<LazyPage><Pages.PartnersPage /></LazyPage>} />
        <Route path="/privacy" element={<LazyPage><Pages.PrivacyPage /></LazyPage>} />
        <Route path="/terms" element={<LazyPage><Pages.TermsPage /></LazyPage>} />
        <Route path="/become-partner" element={<LazyPage><Pages.BecomePartnerPage /></LazyPage>} />
        <Route path="/cookies" element={<LazyPage><Pages.CookiePolicyPage /></LazyPage>} />
        <Route path="/refund-policy" element={<LazyPage><Pages.RefundPolicyPage /></LazyPage>} />
        <Route path="/contact" element={<LazyPage><Pages.ContactPage /></LazyPage>} />
        <Route path="/g-trust" element={<LazyPage><Pages.GTrustPage /></LazyPage>} />
        <Route path="/ip-policy" element={<LazyPage><Pages.IPPolicyPage /></LazyPage>} />
        <Route path="/partner-agreement" element={<LazyPage><Pages.PartnerAgreementPage /></LazyPage>} />
        <Route path="/partner-terms" element={<LazyPage><Pages.PartnerAgreementPage /></LazyPage>} />
        <Route path="/dispute-resolution" element={<LazyPage><Pages.DisputeResolutionPage /></LazyPage>} />
        <Route path="/view-history" element={<Navigate to="/history" replace />} />
        
        {/* ── Legacy redirects ── */}
        <Route path="/demo" element={<Navigate to="/" replace />} />
        <Route path="/demo/*" element={<Navigate to="/" replace />} />
        
        {/* ── Admin ── */}
        <Route element={<AdminRouteLayout />}>
          <Route path="/admin" element={<Pages.AdminDashboard />} />
          <Route path="/admin/catalog" element={<Pages.AdminUnifiedCatalog />} />
          <Route path="/admin/control" element={<Pages.AdminControlCenter />} />
          <Route path="/admin/vendor-content" element={<Pages.AdminVendorContentCreator />} />
          <Route path="/admin/analytics" element={<Pages.AdminAnalytics />} />
          <Route path="/admin/providers" element={<Pages.AdminProviders />} />
          <Route path="/admin/providers/:id" element={<Pages.AdminProviderDetail />} />
          <Route path="/admin/services" element={<Pages.AdminServices />} />
          <Route path="/admin/partner-applications" element={<Pages.PartnerApplicationsAdmin />} />
          <Route path="/admin/pitch-deck" element={<Pages.InvestorPitchDeck />} />
          <Route path="/admin/investor-demo" element={<Pages.InvestorDemo />} />
          <Route path="/admin/operations" element={<Pages.AdminOperations />} />
          <Route path="/admin/yachts" element={<Pages.AdminYachts />} />
          <Route path="/admin/tours" element={<Navigate to="/admin/experiences" replace />} />
          <Route path="/admin/activities" element={<Pages.AdminActivities />} />
          <Route path="/admin/properties" element={<Pages.AdminProperties />} />
          <Route path="/admin/projects" element={<Pages.AdminProjects />} />
          <Route path="/admin/investments" element={<Pages.AdminInvestments />} />
          <Route path="/admin/developers" element={<Pages.AdminDevelopers />} />
          <Route path="/admin/pm-companies" element={<Pages.AdminPMCompanies />} />
          <Route path="/admin/contracts" element={<Pages.AdminContracts />} />
          <Route path="/admin/restaurants" element={<Pages.AdminRestaurants />} />
          <Route path="/admin/restaurants/data-quality" element={<Pages.AdminRestaurantDataQuality />} />
          <Route path="/admin/salons" element={<Pages.AdminSalons />} />
          <Route path="/admin/clinics" element={<Pages.AdminClinics />} />
          <Route path="/admin/gyms" element={<Pages.AdminGyms />} />
          <Route path="/admin/vehicles" element={<Pages.AdminVehicles />} />
          <Route path="/admin/events" element={<Pages.AdminEvents />} />
          <Route path="/admin/education" element={<Pages.AdminEducation />} />
          <Route path="/admin/legal" element={<Pages.AdminLegal />} />
          <Route path="/admin/pets" element={<Pages.AdminPets />} />
          <Route path="/admin/cleaning" element={<Pages.AdminCleaning />} />
          <Route path="/admin/babysitters" element={<Pages.AdminBabysitters />} />
          <Route path="/admin/flowers" element={<Pages.AdminFlowers />} />
          <Route path="/admin/bouquets" element={<Pages.AdminBouquets />} />
          <Route path="/admin/lookups" element={<Pages.AdminLookups />} />
          <Route path="/admin/taxonomy" element={<Pages.AdminTaxonomyManager />} />
          <Route path="/admin/acquisition-metrics" element={<Pages.AcquisitionMetrics />} />
          <Route path="/admin/tickets" element={<Pages.AdminTickets />} />
          <Route path="/admin/tickets/:ticketId" element={<Pages.AdminTicketDetail />} />
          <Route path="/admin/pharmacies" element={<Pages.AdminPharmacies />} />
          <Route path="/admin/stores" element={<Pages.AdminStores />} />
          <Route path="/admin/insurance" element={<Pages.AdminInsurance />} />
          <Route path="/admin/quick-listings" element={<Pages.AdminQuickListings />} />
          <Route path="/admin/water-activities" element={<Pages.AdminWaterActivities />} />
          <Route path="/admin/experiences" element={<Pages.AdminExperiences />} />
          <Route path="/admin/moderation" element={<Pages.AdminContentModeration />} />
          <Route path="/admin/consultations" element={<Pages.AdminConsultations />} />
          <Route path="/admin/uno-team" element={<Pages.AdminUnoTeam />} />
          <Route path="/admin/leads" element={<Pages.AdminLeadsDashboard />} />
          <Route path="/admin/finance" element={<Pages.AdminFinance />} />
          <Route path="/admin/cities" element={<Pages.AdminCities />} />
          <Route path="/admin/translations" element={<Pages.AdminTranslations />} />
          <Route path="/admin/location-knowledge" element={<Pages.AdminLocationKnowledge />} />
          <Route path="/admin/user-analytics" element={<Pages.UserAnalyticsDashboard />} />
          <Route path="/admin/marketplace/products" element={<Pages.AdminMarketplaceProducts />} />
          <Route path="/admin/marketplace/categories" element={<Pages.AdminMarketplaceCategories />} />
          <Route path="/admin/marketplace/subcategories" element={<Pages.AdminMarketplaceSubcategories />} />
          <Route path="/admin/marketplace/vendors" element={<Pages.AdminMarketplaceVendors />} />
          <Route path="/admin/data-import" element={<Pages.AdminDataImport />} />
          <Route path="/admin/ai-agents" element={<Pages.AdminAIAgents />} />
          <Route path="/admin/ai-agents/:id" element={<Pages.AdminAIAgentEditor />} />
          <Route path="/admin/intake" element={<Pages.AdminIntake />} />
          <Route path="/admin/intake-configs" element={<Pages.AdminIntakeConfigs />} />
          <Route path="/admin/lead-configs" element={<Pages.AdminLeadConfigs />} />
          <Route path="/admin/vendor-prospects" element={<Pages.AdminVendorProspects />} />
          <Route path="/admin/marketing" element={<Pages.MarketingDashboard />} />
          <Route path="/admin/experience-categories" element={<Pages.ExperienceCategoriesPage />} />
          <Route path="/admin/life-situations" element={<Pages.AdminLifeOS />} />
          <Route path="/admin/lifeos" element={<Pages.AdminLifeOS />} />
        </Route>
        
        {/* ── Staff ── */}
        <Route path="/staff" element={<LazyPage><AdminGuard><Pages.StaffDashboard /></AdminGuard></LazyPage>} />
        
        {/* ── Team ── */}
        <Route path="/team" element={<LazyPage><TeamGuard><Pages.TeamDashboard /></TeamGuard></LazyPage>} />
        <Route path="/team/content" element={<LazyPage><TeamGuard><Pages.TeamContentHub /></TeamGuard></LazyPage>} />
        <Route path="/team/chat" element={<LazyPage><TeamGuard><Pages.TeamChatPage /></TeamGuard></LazyPage>} />
        <Route path="/team/leaderboard" element={<LazyPage><TeamGuard><Pages.TeamLeaderboardPage /></TeamGuard></LazyPage>} />
        <Route path="/team/my-profile" element={<LazyPage><TeamGuard><Pages.TeamProfilePage /></TeamGuard></LazyPage>} />
        <Route path="/team/inbox" element={<LazyPage><TeamGuard><Pages.TeamInboxPage /></TeamGuard></LazyPage>} />
        <Route path="/team/support" element={<LazyPage><TeamGuard><Pages.TeamSupportPage /></TeamGuard></LazyPage>} />
        <Route path="/team/leads" element={<LazyPage><TeamGuard><Pages.TeamLeadsPage /></TeamGuard></LazyPage>} />
        <Route path="/team/moderation" element={<LazyPage><TeamGuard><Pages.TeamModerationPage /></TeamGuard></LazyPage>} />
        
        {/* ── Manager → Owner Redirects ── */}
        <Route path="/manager" element={<Navigate to="/owner" replace />} />
        <Route path="/manager/properties" element={<Navigate to="/owner/properties" replace />} />
        <Route path="/manager/properties/:id" element={<Navigate to="/owner/properties" replace />} />
        <Route path="/manager/calendar" element={<Navigate to="/owner/calendar" replace />} />
        
        {/* ── Guest ── */}
        <Route element={<GuestRouteLayout />}>
          <Route path="/my-stay" element={<Pages.MyStay />} />
          <Route path="/guest/check-in/:bookingId" element={<Pages.GuestCheckIn />} />
          <Route path="/guest/guidebook/:propertyId" element={<Pages.GuestGuidebook />} />
        </Route>
        
        {/* ── Provider/Vendor ── */}
        <Route path="/provider/onboarding" element={<LazyPage><Pages.ProviderOnboarding /></LazyPage>} />
        <Route path="/vendor/onboarding" element={<LazyPage><Pages.VendorOnboarding /></LazyPage>} />
        
        <Route element={<VendorRouteLayout />}>
          <Route path="/vendor" element={<Pages.VendorDashboard />} />
          <Route path="/vendor/bookings" element={<Pages.VendorBookings />} />
          <Route path="/vendor/services" element={<Pages.VendorServices />} />
          <Route path="/vendor/analytics" element={<Pages.VendorAnalytics />} />
          <Route path="/vendor/payouts" element={<Pages.VendorPayouts />} />
          <Route path="/vendor/properties" element={<Pages.VendorProperties />} />
          <Route path="/vendor/tours" element={<Navigate to="/vendor/experiences" replace />} />
          <Route path="/vendor/activities" element={<Pages.VendorActivities />} />
          <Route path="/vendor/experiences" element={<Pages.VendorExperiences />} />
          <Route path="/vendor/yachts" element={<Pages.VendorYachts />} />
          <Route path="/vendor/yachts/:id/calendar" element={<Pages.VendorYachtCalendar />} />
          <Route path="/vendor/transport" element={<Pages.VendorTransport />} />
          <Route path="/vendor/beauty" element={<Pages.VendorBeauty />} />
          <Route path="/vendor/fitness" element={<Pages.VendorFitness />} />
          <Route path="/vendor/clinics" element={<Pages.VendorClinics />} />
          <Route path="/vendor/subscription" element={<Pages.VendorSubscription />} />
          <Route path="/vendor/restaurants" element={<Pages.VendorRestaurants />} />
          <Route path="/vendor/events" element={<Pages.VendorEvents />} />
          <Route path="/vendor/education" element={<Pages.VendorEducation />} />
          <Route path="/vendor/legal" element={<Pages.VendorLegal />} />
          <Route path="/vendor/pets" element={<Pages.VendorPets />} />
          <Route path="/vendor/cleaning" element={<Pages.VendorCleaning />} />
          <Route path="/vendor/babysitters" element={<Pages.VendorBabysitters />} />
          <Route path="/vendor/flowers" element={<Pages.VendorFlowers />} />
          <Route path="/vendor/locations" element={<Pages.VendorLocations />} />
          <Route path="/vendor/products" element={<Pages.VendorProducts />} />
          <Route path="/vendor/orders" element={<Pages.VendorBookings />} />
          <Route path="/vendor/messages" element={<Pages.VendorMessages />} />
          <Route path="/vendor/settings" element={<Pages.VendorSettingsPage />} />
        </Route>
        
        {/* ── Owner ── */}
        <Route path="/owner/landing" element={<Navigate to="/owner" replace />} />
        <Route path="/owner/guide" element={<LazyPage><Pages.OwnerGuidePage /></LazyPage>} />
        
        <Route path="/owner" element={<OwnerGuard><OwnerLayout /></OwnerGuard>}>
          <Route index element={<LazyPage><Pages.OwnerDashboard /></LazyPage>} />
          <Route path="portfolio" element={<LazyPage><Pages.OwnerPortfolio /></LazyPage>} />
          <Route path="superhost" element={<LazyPage><Pages.OwnerSuperhost /></LazyPage>} />
          <Route path="properties" element={<LazyPage><Pages.OwnerProperties /></LazyPage>} />
          <Route path="properties/new" element={<LazyPage><Pages.AddProperty /></LazyPage>} />
          <Route path="properties/import" element={<LazyPage><Pages.OwnerPropertyImport /></LazyPage>} />
          <Route path="properties/:id" element={<LazyPage><Pages.OwnerPropertyDetail /></LazyPage>} />
          <Route path="properties/:id/terms" element={<LazyPage><Pages.OwnerRentalTerms /></LazyPage>} />
          <Route path="properties/:id/setup" element={<LazyPage><Pages.PropertyQuickSetup /></LazyPage>} />
          <Route path="properties/:id/edit" element={<LazyPage><Pages.EditProperty /></LazyPage>} />
          <Route path="properties/:id/guidebook" element={<LazyPage><Pages.OwnerGuidebookEdit /></LazyPage>} />
          <Route path="properties/:id/editor" element={<LazyPage><Pages.PropertyEditor /></LazyPage>} />
          <Route path="properties/:id/manage" element={<LazyPage><Pages.PropertyManage /></LazyPage>} />
          <Route path="properties/:id/juristic-requests" element={<LazyPage><Pages.JuristicRequestsPage /></LazyPage>} />
          <Route path="calendar" element={<LazyPage><Pages.OwnerCalendar /></LazyPage>} />
          <Route path="operations" element={<LazyPage><Pages.OwnerOperations /></LazyPage>} />
          <Route path="financials" element={<LazyPage><Pages.OwnerFinancials /></LazyPage>} />
          <Route path="financials/new" element={<LazyPage><Pages.OwnerFinancialForm /></LazyPage>} />
          <Route path="financials/:id" element={<LazyPage><Pages.OwnerFinancialForm /></LazyPage>} />
          <Route path="quick-expense" element={<LazyPage><Pages.QuickExpense /></LazyPage>} />
          <Route path="messages" element={<LazyPage><Pages.OwnerMessages /></LazyPage>} />
          <Route path="chat/:type/:id" element={<LazyPage><Pages.OwnerChatRoom /></LazyPage>} />
          <Route path="support-chat" element={<LazyPage><Pages.OwnerSupportChat /></LazyPage>} />
          <Route path="message-templates" element={<LazyPage><Pages.MessageTemplates /></LazyPage>} />
          <Route path="reviews" element={<LazyPage><Pages.OwnerReviews /></LazyPage>} />
          <Route path="service-request" element={<LazyPage><Pages.ServiceRequest /></LazyPage>} />
          <Route path="inspection" element={<LazyPage><Pages.InspectionRequest /></LazyPage>} />
          <Route path="full-management" element={<LazyPage><Pages.FullManagement /></LazyPage>} />
          <Route path="channels" element={<LazyPage><Pages.ChannelManager /></LazyPage>} />
          <Route path="team" element={<LazyPage><Pages.TeamPage /></LazyPage>} />
          <Route path="reports" element={<LazyPage><Pages.ReportsPage /></LazyPage>} />
        </Route>
        
        {/* ── Catch-all ── */}
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
    
    <AdaptiveBottomNav />
    </>
  );
};
