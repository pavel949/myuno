/**
 * AnimatedRoutes — P3 Consolidated
 * 
 * Route tree only. All lazy imports come from pageRegistry.ts.
 * ~500 lines (route definitions) vs ~980 lines before.
 */
import React, { Suspense } from 'react';
import { Routes, Route, useLocation, Navigate, Outlet, useParams } from 'react-router-dom';
import { ActiveCompanyProvider } from '@/hooks/useActiveCompany';
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from './PageTransition';
import { ScrollToTop } from './ScrollToTop';
import { LoadingState } from '@/components/uno/LoadingSpinner';
import { AdminGuard, VendorGuard, TeamGuard, AuthGuard, StaffGuard, MCGuard } from '@/components/auth';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdaptiveBottomNav } from './AdaptiveBottomNav';
import { MCLayout } from '@/components/mc/MCLayout';
import { VendorLayout } from '@/components/vendor/VendorLayout';
import { GuestLayout } from '@/components/guest/GuestLayout';
import { StaffLayout } from '@/components/staff/StaffLayout';
import { useNavigationDirection } from '@/hooks/useNavigationDirection';
import { APP_ROUTES } from '@/lib/config/routes';

// Core pages - eagerly loaded for fast initial navigation
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import NotFound from '@/pages/NotFound';

// All lazy page imports from centralized registry
import * as Pages from './pageRegistry';

// Property Hub wrapper
const PropertyHub = React.lazy(() => import('@/pages/property/PropertyHub'));

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

// Legacy redirect helpers for Property Hub migration
const FoodRestaurantIdRedirect = () => { const { id } = useParams(); return <Navigate to={`/restaurants/${id}`} replace />; };
const OffplanIdRedirect = () => { const { id } = useParams(); return <Navigate to={`/property/offplan/${id}`} replace />; };
const DeveloperIdRedirect = () => { const { id } = useParams(); return <Navigate to={`/property/developers/${id}`} replace />; };
const InvestIdRedirect = () => { const { id } = useParams(); return <Navigate to={`/property/invest/${id}`} replace />; };

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
        <Route path={APP_ROUTES.HOME} element={<PageTransition><Index /></PageTransition>} />
        <Route path={APP_ROUTES.AUTH} element={<PageTransition><Auth /></PageTransition>} />
        <Route path={APP_ROUTES.AUTH_ACCOUNT_TYPE} element={<LazyPage><Pages.AccountTypeSelection /></LazyPage>} />
        <Route path={APP_ROUTES.AUTH_FORGOT_PASSWORD} element={<LazyPage><Pages.ForgotPassword /></LazyPage>} />
        <Route path={APP_ROUTES.AUTH_RESET_PASSWORD} element={<LazyPage><Pages.ResetPassword /></LazyPage>} />
        
        {/* ── User ── */}
        <Route path={APP_ROUTES.DISCOVER} element={<LazyPage><Pages.Discover /></LazyPage>} />
        <Route path="/catalog" element={<LazyPage><Pages.PlatformCatalog /></LazyPage>} />
        <Route path="/categories" element={<Navigate to={APP_ROUTES.DISCOVER} replace />} />
        <Route path={APP_ROUTES.MAP} element={<LazyPage><Pages.MapView /></LazyPage>} />
        <Route path={APP_ROUTES.BOOKINGS} element={<LazyPage><Pages.Bookings /></LazyPage>} />
        <Route path="/bookings/:id" element={<LazyPage><Pages.BookingDetail /></LazyPage>} />
        <Route path="/orders/:id/tracking" element={<LazyPage><Pages.OrderTracking /></LazyPage>} />
        <Route path={APP_ROUTES.PROFILE} element={<LazyPage><Pages.Profile /></LazyPage>} />
        <Route path={APP_ROUTES.PROFILE_EDIT} element={<LazyPage><Pages.EditProfile /></LazyPage>} />
        <Route path={APP_ROUTES.PROFILE_SETTINGS} element={<LazyPage><Pages.ProfileSettings /></LazyPage>} />
        <Route path="/profile/referral" element={<LazyPage><Pages.ReferralPage /></LazyPage>} />
        <Route path={APP_ROUTES.ACCOUNT} element={<LazyPage><Pages.UserAccountDashboard /></LazyPage>} />
        <Route path={APP_ROUTES.FAVORITES} element={<LazyPage><Pages.Favorites /></LazyPage>} />
        <Route path={APP_ROUTES.SEARCH} element={<LazyPage><Pages.Search /></LazyPage>} />
        <Route path={APP_ROUTES.NOTIFICATIONS} element={<LazyPage><Pages.Notifications /></LazyPage>} />
        <Route path={APP_ROUTES.NOTIFICATION_SETTINGS} element={<LazyPage><Pages.NotificationSettingsEnhanced /></LazyPage>} />
        <Route path={APP_ROUTES.MESSAGES} element={<LazyPage><Pages.GuestMessages /></LazyPage>} />
        <Route path="/trip/:id" element={<LazyPage><Pages.GuestTripDetail /></LazyPage>} />
        <Route path={APP_ROUTES.VIEW_HISTORY} element={<LazyPage><Pages.ViewHistory /></LazyPage>} />
        <Route path={APP_ROUTES.CART} element={<LazyPage><Pages.Cart /></LazyPage>} />
        <Route path={APP_ROUTES.WALLET} element={<LazyPage><Pages.Wallet /></LazyPage>} />
        <Route path={APP_ROUTES.WALLET_HISTORY} element={<LazyPage><Pages.TransactionHistory /></LazyPage>} />
        <Route path={APP_ROUTES.WALLET_CARDS} element={<LazyPage><Pages.WalletCards /></LazyPage>} />
        <Route path={APP_ROUTES.SOS} element={<LazyPage><Pages.SOS /></LazyPage>} />
        <Route path={APP_ROUTES.VIP_CONCIERGE} element={<LazyPage><Pages.VipConcierge /></LazyPage>} />
        <Route path={APP_ROUTES.SUPPORT} element={<LazyPage><Pages.Support /></LazyPage>} />
        <Route path={APP_ROUTES.SUPPORT_NEW_TICKET} element={<LazyPage><Pages.NewTicket /></LazyPage>} />
        <Route path={APP_ROUTES.SUPPORT_TICKETS} element={<LazyPage><Pages.MyTickets /></LazyPage>} />
        <Route path="/support/tickets/:ticketId" element={<LazyPage><Pages.TicketDetail /></LazyPage>} />
        <Route path={APP_ROUTES.INSTALL} element={<LazyPage><Pages.Install /></LazyPage>} />
        <Route path={APP_ROUTES.BOOKING_ADVANCE_REQUESTED} element={<LazyPage><Pages.AdvanceRequested /></LazyPage>} />
        <Route path="/ref/:code" element={<LazyPage><Pages.ReferralLanding /></LazyPage>} />
        <Route path="/for-management-companies" element={<LazyPage><Pages.ForManagementCompanies /></LazyPage>} />
        <Route path="/b/:slug" element={<LazyPage><Pages.StorefrontPage /></LazyPage>} />
        
        {/* ── LifeOS ── */}
        <Route path="/life-flow/:code" element={<LazyPage><Pages.LifeFlowPage /></LazyPage>} />
        <Route path="/life/:code" element={<LazyPage><Pages.LifeFlowPage /></LazyPage>} />
        <Route path="/trip-planner" element={<LazyPage><Pages.TripPlannerPage /></LazyPage>} />
        <Route path="/list-with-us" element={<LazyPage><Pages.ListWithUsPage /></LazyPage>} />
        
        {/* ── Beauty & Spa ── */}
        <Route path={APP_ROUTES.BEAUTY} element={<LazyPage><Pages.BeautySpaIndex /></LazyPage>} />
        <Route path="/beauty/salon/:id" element={<LazyPage><Pages.SalonDetail /></LazyPage>} />
        <Route path="/beauty/booking/:id" element={<LazyPage><Pages.BeautyBooking /></LazyPage>} />
        <Route path={APP_ROUTES.BEAUTY_SERVICES} element={<LazyPage><Pages.BeautyServices /></LazyPage>} />
        <Route path={APP_ROUTES.BEAUTY_MAP} element={<LazyPage><Pages.BeautyMap /></LazyPage>} />
        <Route path="/salons" element={<Navigate to={APP_ROUTES.BEAUTY} replace />} />
        <Route path="/spa" element={<Navigate to={APP_ROUTES.BEAUTY} replace />} />
        <Route path="/gyms" element={<Navigate to={APP_ROUTES.FITNESS} replace />} />
        <Route path="/clinics" element={<Navigate to={APP_ROUTES.MEDICAL} replace />} />
        <Route path="/water_activities" element={<Navigate to={`${APP_ROUTES.EXPERIENCES}?type=activity`} replace />} />
        
        <Route path={APP_ROUTES.STAYS_SEARCH} element={<LazyPage><Pages.StaysSearchPage /></LazyPage>} />

        {/* ── Property Hub ── */}
        <Route path="/properties" element={<Navigate to={APP_ROUTES.PROPERTY} replace />} />
        <Route path={APP_ROUTES.PROPERTY} element={<Suspense fallback={<LoadingState />}><PropertyHub /></Suspense>}>
          <Route index element={<LazyPage><Pages.PropertyIndex /></LazyPage>} />
          <Route path="search" element={<LazyPage><Pages.PropertySearchPage /></LazyPage>} />
          <Route path="consultation" element={<LazyPage><Pages.PropertyConsultation /></LazyPage>} />
          <Route path="deposit-success" element={<LazyPage><Pages.PropertyDepositSuccess /></LazyPage>} />
          <Route path="map" element={<LazyPage><Pages.PropertyMap /></LazyPage>} />
          <Route path="project/:id" element={<LazyPage><Pages.ProjectDetail /></LazyPage>} />
          
          {/* Off-Plan & Developers (moved from /offplan, /developers, /complexes) */}
          <Route path="offplan" element={<LazyPage><Pages.OffplanIndex /></LazyPage>} />
          <Route path="offplan/:id" element={<LazyPage><Pages.OffplanDetail /></LazyPage>} />
          <Route path="developers" element={<LazyPage><Pages.DevelopersIndex /></LazyPage>} />
          <Route path="developers/:id" element={<LazyPage><Pages.DeveloperDetail /></LazyPage>} />
          <Route path="projects" element={<LazyPage><Pages.ProjectsIndex /></LazyPage>} />
          
          {/* Resale / Secondary Market */}
          <Route path="resale" element={<LazyPage><Pages.ResaleIndex /></LazyPage>} />
          <Route path="resale/:id" element={<LazyPage><Pages.ResaleDetail /></LazyPage>} />
          
          {/* Investment (moved from /invest) */}
          <Route path="invest" element={<LazyPage><Pages.InvestmentIndex /></LazyPage>} />
          <Route path="invest/dashboard" element={<LazyPage><Pages.InvestorDashboard /></LazyPage>} />
          <Route path="invest/raise" element={<LazyPage><Pages.RaiseFunding /></LazyPage>} />
          <Route path="invest/:id" element={<LazyPage><Pages.InvestmentDetail /></LazyPage>} />
          
          {/* My Property */}
          <Route path="my" element={<LazyPage><Pages.PropertyMySection /></LazyPage>} />
          
          {/* Property Detail (must be last — catches :id) */}
          <Route path=":id" element={<LazyPage><Pages.PropertyDetail /></LazyPage>} />
          <Route path=":id/inquiry" element={<LazyPage><Pages.PropertyInquiry /></LazyPage>} />
        </Route>
        <Route path="/company/:slug" element={<LazyPage><Pages.ManagementCompanyProfile /></LazyPage>} />
        
        {/* ── Legacy Property Hub Redirects ── */}
        <Route path="/offplan" element={<Navigate to={APP_ROUTES.OFFPLAN} replace />} />
        <Route path="/offplan/:id" element={<OffplanIdRedirect />} />
        <Route path="/developers" element={<Navigate to={APP_ROUTES.DEVELOPERS} replace />} />
        <Route path="/developers/:id" element={<DeveloperIdRedirect />} />
        <Route path="/complexes" element={<Navigate to={APP_ROUTES.COMPLEXES} replace />} />
        <Route path="/invest" element={<Navigate to={APP_ROUTES.INVEST} replace />} />
        <Route path="/invest/dashboard" element={<Navigate to={APP_ROUTES.INVEST_DASHBOARD} replace />} />
        <Route path="/invest/raise" element={<Navigate to={APP_ROUTES.INVEST_RAISE} replace />} />
        <Route path="/invest/:id" element={<InvestIdRedirect />} />
        
        {/* ── Restaurants ── */}
        <Route path="/food" element={<Navigate to={APP_ROUTES.RESTAURANTS} replace />} />
        <Route path="/food/restaurant/:id" element={<FoodRestaurantIdRedirect />} />
        <Route path="/food/checkout" element={<Navigate to={APP_ROUTES.RESTAURANTS} replace />} />
        <Route path={APP_ROUTES.RESTAURANTS} element={<LazyPage><Pages.RestaurantsIndex /></LazyPage>} />
        <Route path={APP_ROUTES.RESTAURANT_MAP} element={<LazyPage><Pages.RestaurantMap /></LazyPage>} />
        <Route path="/restaurants/:id" element={<LazyPage><Pages.RestaurantDetail /></LazyPage>} />
        <Route path="/restaurants/:id/reserve" element={<LazyPage><Pages.TableReservation /></LazyPage>} />
        <Route path="/restaurants/:id/delivery" element={<LazyPage><Pages.DeliveryCheckout /></LazyPage>} />
        <Route path="/restaurants/:id/experience/:setId" element={<LazyPage><Pages.SetMenuBooking /></LazyPage>} />
        
        {/* ── Transport ── */}
        <Route path={APP_ROUTES.TRANSPORT} element={<LazyPage><Pages.TransportIndex /></LazyPage>} />
        <Route path="/transport/vehicle/:id" element={<LazyPage><Pages.VehicleDetail /></LazyPage>} />
        <Route path="/transport/booking/:id" element={<LazyPage><Pages.TransportBooking /></LazyPage>} />
        <Route path={APP_ROUTES.AIRPORT_TRANSFER} element={<LazyPage><Pages.AirportTransferBooking /></LazyPage>} />
        <Route path={APP_ROUTES.TRANSFER_SUCCESS} element={<LazyPage><Pages.TransferSuccess /></LazyPage>} />
        <Route path={APP_ROUTES.FAST_TRACK} element={<LazyPage><Pages.AirportFastTrackPage /></LazyPage>} />
        <Route path="/transport/airport" element={<Navigate to={APP_ROUTES.AIRPORT_TRANSFER} replace />} />
        <Route path="/airport-transfer" element={<Navigate to={APP_ROUTES.AIRPORT_TRANSFER} replace />} />
        <Route path={APP_ROUTES.LANDING_AIRPORT_TRANSFER} element={<LazyPage><Pages.AirportTransferLanding /></LazyPage>} />
        <Route path={APP_ROUTES.LANDING_FLOWER_DELIVERY} element={<LazyPage><Pages.FlowerDeliveryLanding /></LazyPage>} />
        <Route path={APP_ROUTES.LANDING_RENTAL} element={<LazyPage><Pages.RentalLanding /></LazyPage>} />
        <Route path={APP_ROUTES.LANDING_NEW_DEVELOPMENTS} element={<Navigate to={APP_ROUTES.NEWBUILDS} replace />} />
        
        {/* ── Newbuilds (Premium New Developments) ── */}
        <Route path={APP_ROUTES.NEWBUILDS} element={<LazyPage><Pages.NewbuildsLanding /></LazyPage>} />
        <Route path={APP_ROUTES.NEWBUILDS_PROJECTS} element={<LazyPage><Pages.NewbuildsCatalog /></LazyPage>} />
        <Route path="/newbuilds/projects/:slug" element={<LazyPage><Pages.NewbuildDetail /></LazyPage>} />
        <Route path={APP_ROUTES.NEWBUILDS_DEVELOPERS} element={<LazyPage><Pages.NewbuildsDevelopers /></LazyPage>} />
        <Route path="/newbuilds/developers/:slug" element={<LazyPage><Pages.NewbuildDeveloperDetail /></LazyPage>} />
        <Route path={APP_ROUTES.NEWBUILDS_MAP} element={<LazyPage><Pages.NewbuildsMap /></LazyPage>} />
        <Route path={APP_ROUTES.NEWBUILDS_CALCULATOR} element={<LazyPage><Pages.NewbuildsCalculator /></LazyPage>} />
        <Route path={APP_ROUTES.NEWBUILDS_COMPARE} element={<LazyPage><Pages.NewbuildsCompare /></LazyPage>} />
        <Route path={APP_ROUTES.NEWBUILDS_AREAS} element={<LazyPage><Pages.NewbuildsAreaGuides /></LazyPage>} />
        <Route path="/newbuilds/areas/:slug" element={<LazyPage><Pages.NewbuildsAreaDetail /></LazyPage>} />
        <Route path={APP_ROUTES.NEWBUILDS_DUE_DILIGENCE} element={<LazyPage><Pages.NewbuildsDueDiligence /></LazyPage>} />

        {/* ── Developer Portal ── */}
        <Route path="/developer-portal" element={<Suspense fallback={<LoadingState />}><Pages.DeveloperPortalLayout /></Suspense>}>
          <Route index element={<LazyPage><Pages.DeveloperOverview /></LazyPage>} />
          <Route path="projects" element={<LazyPage><Pages.DeveloperProjects /></LazyPage>} />
          <Route path="projects/new" element={<LazyPage><Pages.DeveloperProjectEditor /></LazyPage>} />
          <Route path="projects/:id" element={<LazyPage><Pages.DeveloperProjectEditor /></LazyPage>} />
          <Route path="leads" element={<LazyPage><Pages.DeveloperLeads /></LazyPage>} />
          <Route path="analytics" element={<LazyPage><Pages.DeveloperAnalytics /></LazyPage>} />
        </Route>
        <Route path={APP_ROUTES.TAXI} element={<LazyPage><Pages.TaxiBooking /></LazyPage>} />
        <Route path="/taxi-booking" element={<Navigate to={APP_ROUTES.TAXI} replace />} />
        <Route path="/transfers" element={<Navigate to={APP_ROUTES.LANDING_AIRPORT_TRANSFER} replace />} />
        <Route path="/life" element={<Navigate to={APP_ROUTES.DISCOVER} replace />} />
        <Route path="/transport/:id" element={<TransportIdRedirect />} />
        
        {/* ── Fitness ── */}
        <Route path={APP_ROUTES.FITNESS} element={<LazyPage><Pages.FitnessIndex /></LazyPage>} />
        <Route path="/fitness/gym/:id" element={<LazyPage><Pages.GymDetail /></LazyPage>} />
        <Route path="/fitness/booking/:id" element={<LazyPage><Pages.FitnessBooking /></LazyPage>} />
        
        {/* ── Medical ── */}
        <Route path={APP_ROUTES.MEDICAL} element={<LazyPage><Pages.MedicalIndex /></LazyPage>} />
        <Route path="/medical/clinic/:id" element={<LazyPage><Pages.ClinicDetail /></LazyPage>} />
        <Route path="/medical/appointment/:id" element={<LazyPage><Pages.MedicalAppointment /></LazyPage>} />
        
        {/* ── Wellness (shared) ── */}
        <Route path={APP_ROUTES.WELLNESS_ORDER_SUCCESS} element={<LazyPage><Pages.WellnessOrderSuccess /></LazyPage>} />
        
        {/* ── Events ── */}
        <Route path={APP_ROUTES.EVENTS} element={<LazyPage><Pages.EventsIndex /></LazyPage>} />
        <Route path="/events/:id" element={<LazyPage><Pages.EventDetail /></LazyPage>} />
        <Route path="/events/booking/:id" element={<LazyPage><Pages.EventBooking /></LazyPage>} />
        <Route path="/events/success" element={<LazyPage><Pages.EventSuccess /></LazyPage>} />
        <Route path="/venues/:id" element={<LazyPage><Pages.VenueDetail /></LazyPage>} />
        
        {/* ── Education ── */}
        <Route path={APP_ROUTES.EDUCATION} element={<LazyPage><Pages.EducationIndex /></LazyPage>} />
        <Route path="/education/course/:id" element={<LazyPage><Pages.CourseDetail /></LazyPage>} />
        <Route path="/education/tutor/:id" element={<LazyPage><Pages.TutorDetail /></LazyPage>} />
        <Route path="/education/booking/:id" element={<LazyPage><Pages.EducationBooking /></LazyPage>} />
        
        {/* ── Flowers ── */}
        <Route path={APP_ROUTES.FLOWERS} element={<LazyPage><Pages.FlowersIndex /></LazyPage>} />
        <Route path="/flowers/bouquet/:id" element={<LazyPage><Pages.BouquetDetail /></LazyPage>} />
        <Route path="/flowers/shop" element={<Navigate to={APP_ROUTES.FLOWERS} replace />} />
        <Route path="/flowers/shop/:id" element={<LazyPage><Pages.FlowerShopDetail /></LazyPage>} />
        <Route path="/flowers/order" element={<LazyPage><Pages.FlowersOrder /></LazyPage>} />
        <Route path="/flowers/order/:id" element={<LazyPage><Pages.FlowersOrder /></LazyPage>} />
        <Route path="/flowers/success" element={<LazyPage><Pages.FlowersSuccess /></LazyPage>} />
        
        {/* ── Home Services ── */}
        <Route path={APP_ROUTES.SERVICES} element={<LazyPage><Pages.ServicesIndex /></LazyPage>} />
        <Route path="/services/provider/:id" element={<LazyPage><Pages.ServiceProviderDetail /></LazyPage>} />
        <Route path="/services/booking/:id" element={<LazyPage><Pages.ServiceBooking /></LazyPage>} />
        <Route path={APP_ROUTES.SERVICES_MAP} element={<LazyPage><Pages.ServicesMap /></LazyPage>} />
        <Route path="/services/order/:functionId" element={<LazyPage><Pages.ServiceFunctionOrder /></LazyPage>} />
        <Route path="/services/order/success" element={<LazyPage><Pages.ServiceOrderSuccess /></LazyPage>} />
        
        {/* ── Legal ── */}
        <Route path={APP_ROUTES.LEGAL} element={<LazyPage><Pages.LegalServicesIndex /></LazyPage>} />
        <Route path="/legal/provider/:id" element={<LazyPage><Pages.LegalProviderDetail /></LazyPage>} />
        <Route path="/legal/visa/:id" element={<LazyPage><Pages.VisaServiceDetail /></LazyPage>} />
        <Route path="/legal/booking/:id" element={<LazyPage><Pages.LegalBooking /></LazyPage>} />
        <Route path={APP_ROUTES.VISA_IMMIGRATION} element={<LazyPage><Pages.VisaImmigrationPage /></LazyPage>} />
        
        {/* ── Insurance ── */}
        <Route path={APP_ROUTES.INSURANCE} element={<LazyPage><Pages.InsuranceIndex /></LazyPage>} />
        <Route path={APP_ROUTES.INSURANCE_TRAVEL} element={<LazyPage><Pages.TravelInsurance /></LazyPage>} />
        <Route path="/insurance/plan/:planId" element={<LazyPage><Pages.InsurancePlanDetail /></LazyPage>} />
        <Route path="/insurance/:id" element={<LazyPage><Pages.InsuranceDetail /></LazyPage>} />
        <Route path="/insurance/:id/quote" element={<LazyPage><Pages.InsuranceQuote /></LazyPage>} />
        
        {/* ── Expat ── */}
        <Route path={APP_ROUTES.BANKING} element={<LazyPage><Pages.BankingPage /></LazyPage>} />
        <Route path={APP_ROUTES.VETERINARY} element={<LazyPage><Pages.VeterinaryPage /></LazyPage>} />
        
        {/* ── ARRIVE Cluster ── */}
        <Route path={APP_ROUTES.ARRIVE_CLUSTER} element={<LazyPage><Pages.ArriveClusterPage /></LazyPage>} />
        <Route path={APP_ROUTES.SIM_START} element={<LazyPage><Pages.SIMStartPage /></LazyPage>} />
        <Route path={APP_ROUTES.EXCHANGE} element={<LazyPage><Pages.ExchangeBotPage /></LazyPage>} />
        
        {/* ── Utility Micro-apps ── */}
        <Route path={APP_ROUTES.VISA_QUIZ} element={<LazyPage><Pages.VisaQuizPage /></LazyPage>} />
        <Route path={APP_ROUTES.SCHOOL_FINDER} element={<LazyPage><Pages.SchoolFinderPage /></LazyPage>} />
        <Route path={APP_ROUTES.COST_OF_LIVING} element={<LazyPage><Pages.CostOfLivingPage /></LazyPage>} />
        
        {/* ── LEGAL Cluster ── */}
        <Route path={APP_ROUTES.LEGAL_CLUSTER} element={<LazyPage><Pages.LegalClusterPage /></LazyPage>} />
        <Route path={APP_ROUTES.CONTRACT_ANALYSIS} element={<LazyPage><Pages.ContractAnalysisPage /></LazyPage>} />
        <Route path={APP_ROUTES.TAX_NAV} element={<LazyPage><Pages.TaxNavPage /></LazyPage>} />
        
        {/* ── INVEST Cluster ── */}
        <Route path={APP_ROUTES.INVEST_CLUSTER} element={<LazyPage><Pages.InvestClusterPage /></LazyPage>} />
        
        {/* ── Knowledge ── */}
        <Route path={APP_ROUTES.KNOWLEDGE} element={<LazyPage><Pages.KnowledgeHub /></LazyPage>} />
        <Route path="/knowledge/:section" element={<LazyPage><Pages.KnowledgeSectionPage /></LazyPage>} />
        <Route path="/knowledge/:section/:slug" element={<LazyPage><Pages.KnowledgeArticlePage /></LazyPage>} />
        
        {/* ── Experiences ── */}
        <Route path={APP_ROUTES.EXPERIENCES} element={<LazyPage><Pages.ExperiencesIndex /></LazyPage>} />
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
        <Route path="/babysitters" element={<Navigate to="/babysitter" replace />} />
        <Route path="/babysitter" element={<LazyPage><Pages.BabysitterIndex /></LazyPage>} />
        <Route path="/babysitter/:id" element={<LazyPage><Pages.BabysitterDetail /></LazyPage>} />
        <Route path="/babysitter/:id/book" element={<LazyPage><Pages.BabysitterBooking /></LazyPage>} />
        
        {/* ── Delivery ── */}
        <Route path="/delivery" element={<LazyPage><Pages.DeliveryIndex /></LazyPage>} />
        
        
        {/* ── Classifieds (Барахолка) ── */}
        <Route path="/classifieds" element={<LazyPage><Pages.ClassifiedsIndex /></LazyPage>} />
        <Route path="/classifieds/sell" element={<AuthGuard><LazyPage><Pages.ClassifiedsSellPage /></LazyPage></AuthGuard>} />
        <Route path="/classifieds/:id" element={<LazyPage><Pages.ClassifiedDetailPage /></LazyPage>} />
        
        {/* ── Monetization Landing Pages ── */}
        <Route path={APP_ROUTES.RELOCATE} element={<LazyPage><Pages.RelocateLandingPage /></LazyPage>} />
        <Route path={APP_ROUTES.WEDDING} element={<LazyPage><Pages.WeddingLandingPage /></LazyPage>} />
        <Route path={APP_ROUTES.KIDS} element={<LazyPage><Pages.KidsLandingPage /></LazyPage>} />
        <Route path={APP_ROUTES.NOMAD_GUIDE} element={<LazyPage><Pages.NomadGuidePage /></LazyPage>} />
        
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
        <Route path="/guide/:token" element={<LazyPage><Pages.PublicGuidebook /></LazyPage>} />
        
        {/* ── Legacy redirects ── */}
        <Route path="/demo" element={<Navigate to="/" replace />} />
        <Route path="/demo/*" element={<Navigate to="/" replace />} />
        
        {/* ── Admin ── */}
        <Route element={<AdminRouteLayout />}>
          <Route path="/admin" element={<Pages.AdminDashboard />} />
          <Route path="/admin/users" element={<Pages.AdminUsersAccess />} />
          <Route path="/admin/catalog" element={<Pages.AdminUnifiedCatalog />} />
          <Route path="/admin/trash" element={<Pages.AdminTrash />} />
          <Route path="/admin/control" element={<Pages.AdminControlCenter />} />
          <Route path="/admin/vendor-content" element={<Pages.AdminVendorContentCreator />} />
          <Route path="/admin/analytics" element={<Navigate to="/admin/control" replace />} />
          <Route path="/admin/providers" element={<Pages.AdminProviders />} />
          <Route path="/admin/providers/:id" element={<Pages.AdminProviderDetail />} />
          <Route path="/admin/services" element={<Pages.AdminServices />} />
          <Route path="/admin/partner-applications" element={<Pages.PartnerApplicationsAdmin />} />
          <Route path="/admin/pitch-deck" element={<Navigate to="/admin" replace />} />
          <Route path="/admin/investor-demo" element={<Navigate to="/admin" replace />} />
          <Route path="/admin/operations" element={<Pages.AdminOperations />} />
          <Route path="/admin/yachts" element={<Pages.AdminYachts />} />
          <Route path="/admin/tours" element={<Navigate to="/admin/experiences" replace />} />
          <Route path="/admin/activities" element={<Pages.AdminActivities />} />
          <Route path="/admin/properties" element={<Pages.AdminProperties />} />
          <Route path="/admin/projects" element={<Pages.AdminProjects />} />
          <Route path="/admin/investments" element={<Pages.AdminInvestments />} />
          <Route path="/admin/developers" element={<Pages.AdminDevelopers />} />
          <Route path="/admin/pm-companies" element={<Pages.AdminPMCompanies />} />
          <Route path="/admin/mc-dashboard" element={<Pages.AdminMCDashboard />} />
          <Route path="/admin/contracts" element={<Pages.AdminContracts />} />
          <Route path="/admin/restaurants" element={<Pages.AdminRestaurants />} />
          <Route path="/admin/restaurants/data-quality" element={<Pages.AdminRestaurantDataQuality />} />
          <Route path="/admin/salons" element={<Pages.AdminSalons />} />
          <Route path="/admin/clinics" element={<Pages.AdminClinics />} />
          <Route path="/admin/gyms" element={<Pages.AdminGyms />} />
          <Route path="/admin/vehicles" element={<Pages.AdminVehicles />} />
          <Route path="/admin/transfers" element={<Pages.AdminTransfers />} />
          <Route path="/admin/events" element={<Pages.AdminEvents />} />
          <Route path="/admin/education" element={<Pages.AdminEducation />} />
          <Route path="/admin/legal" element={<Pages.AdminLegal />} />
          <Route path="/admin/pets" element={<Pages.AdminPets />} />
          <Route path="/admin/cleaning" element={<Pages.AdminCleaning />} />
          <Route path="/admin/babysitters" element={<Pages.AdminBabysitters />} />
          <Route path="/admin/flowers" element={<Pages.AdminFlowers />} />
          <Route path="/admin/bouquets" element={<Navigate to="/admin/flowers" replace />} />
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
          <Route path="/admin/moderation" element={<Navigate to="/admin/operations?tab=moderation" replace />} />
          <Route path="/admin/consultations" element={<Pages.AdminConsultations />} />
          <Route path="/admin/uno-team" element={<Pages.AdminUnoTeam />} />
          <Route path="/admin/leads" element={<Navigate to="/admin/operations" replace />} />
          <Route path="/admin/finance" element={<Pages.AdminFinance />} />
          <Route path="/admin/disputes" element={<Pages.AdminDisputes />} />
          <Route path="/admin/investor-metrics" element={<Pages.AdminInvestorMetrics />} />
          <Route path="/admin/settings" element={<Pages.AdminSystemSettings />} />
          <Route path="/admin/cities" element={<Pages.AdminCities />} />
          <Route path="/admin/translations" element={<Pages.AdminTranslations />} />
          <Route path="/admin/location-knowledge" element={<Pages.AdminLocationKnowledge />} />
          <Route path="/admin/user-analytics" element={<Navigate to="/admin/control" replace />} />
          <Route path="/admin/marketplace/products" element={<Navigate to="/admin/catalog" replace />} />
          <Route path="/admin/marketplace/categories" element={<Navigate to="/admin/catalog" replace />} />
          <Route path="/admin/marketplace/subcategories" element={<Navigate to="/admin/catalog" replace />} />
          <Route path="/admin/marketplace/vendors" element={<Navigate to="/admin/catalog" replace />} />
          <Route path="/admin/data-import" element={<Pages.AdminDataImport />} />
           <Route path="/admin/ai-agents" element={<Pages.AdminAIAgents />} />
           <Route path="/admin/ai-ops" element={<Pages.AdminAIOps />} />
           <Route path="/admin/ai-agents/:id" element={<Pages.AdminAIAgentEditor />} />
          <Route path="/admin/intake" element={<Pages.AdminIntake />} />
          <Route path="/admin/intake-configs" element={<Pages.AdminIntakeConfigs />} />
          <Route path="/admin/lead-configs" element={<Pages.AdminLeadConfigs />} />
          <Route path="/admin/vendor-prospects" element={<Pages.AdminVendorProspects />} />
          <Route path="/admin/crm" element={<Pages.AdminCRM />} />
          <Route path="/admin/marketing" element={<Pages.MarketingDashboard />} />
          <Route path="/admin/lifecycle-messaging" element={<Pages.LifecycleMessaging />} />
          <Route path="/admin/experience-categories" element={<Pages.ExperienceCategoriesPage />} />
          <Route path="/admin/life-situations" element={<Pages.AdminLifeOS />} />
           <Route path="/admin/lifeos" element={<Navigate to="/admin/life-situations" replace />} />
           <Route path="/admin/legal-documents" element={<Pages.AdminLegalDocuments />} />
           <Route path="/admin/qa-test-runner" element={<Pages.AdminQATestRunner />} />
           <Route path="/admin/api-keys" element={<Pages.AdminApiKeys />} />
           <Route path="/admin/newbuilds" element={<Pages.AdminNewbuilds />} />
        </Route>
        
        {/* ── Staff ── */}
        <Route path="/staff" element={<StaffGuard><StaffLayout /></StaffGuard>}>
          <Route index element={<LazyPage><Pages.StaffDashboard /></LazyPage>} />
        </Route>
        
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
        
        {/* ── Manager → MC Redirects ── */}
        <Route path="/manager" element={<Navigate to="/mc" replace />} />
        <Route path="/manager/properties" element={<Navigate to="/mc/properties" replace />} />
        <Route path="/manager/properties/:id" element={<Navigate to="/mc/properties" replace />} />
        <Route path="/manager/calendar" element={<Navigate to="/mc/calendar" replace />} />
        
        {/* ── Guest ── */}
        <Route element={<GuestRouteLayout />}>
          <Route path="/my-stay" element={<Pages.MyStay />} />
          <Route path="/guest/check-in/:bookingId" element={<Pages.GuestCheckIn />} />
          <Route path="/guest/guidebook/:propertyId" element={<Pages.GuestGuidebook />} />
          <Route path="/guest/profile" element={<Pages.GuestProfile />} />
        </Route>
        
        {/* Welcome Flow — public, no auth required */}
        <Route path="/welcome" element={<LazyPage><Pages.WelcomeFlow /></LazyPage>} />
        <Route path="/welcome/:bookingId" element={<LazyPage><Pages.WelcomeFlow /></LazyPage>} />
        
        {/* ── Provider/Vendor ── */}
        <Route path="/provider/onboarding" element={<LazyPage><AuthGuard><Pages.ProviderOnboarding /></AuthGuard></LazyPage>} />
        <Route path="/vendor/join" element={<LazyPage><Pages.VendorLanding /></LazyPage>} />
        <Route path="/vendor/onboarding" element={<LazyPage><AuthGuard><Pages.VendorOnboarding /></AuthGuard></LazyPage>} />
        
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
        
        {/* ── MC Onboarding (outside MCGuard, but requires auth) ── */}
        <Route path="/mc/onboarding" element={<LazyPage><AuthGuard><Pages.MCOnboarding /></AuthGuard></LazyPage>} />
        <Route path="/mc/register" element={<LazyPage><AuthGuard><Pages.MCRegistrationPage /></AuthGuard></LazyPage>} />
        
        {/* ── MC (Management Company) Workspace ── */}
        <Route path="/mc" element={<ActiveCompanyProvider><MCGuard><MCLayout /></MCGuard></ActiveCompanyProvider>}>
          <Route index element={<LazyPage><Pages.OwnerDashboard /></LazyPage>} />
          <Route path="modules" element={<LazyPage><Pages.OwnerModulesPage /></LazyPage>} />
          <Route path="properties" element={<LazyPage><Pages.OwnerProperties /></LazyPage>} />
          <Route path="complexes" element={<LazyPage><Pages.ComplexesPage /></LazyPage>} />
          <Route path="projects" element={<LazyPage><Pages.MCProjectsPage /></LazyPage>} />
          <Route path="properties/new" element={<LazyPage><Pages.AddProperty /></LazyPage>} />
          <Route path="properties/import" element={<LazyPage><Pages.OwnerPropertyImport /></LazyPage>} />
          <Route path="properties/:id" element={<LazyPage><Pages.OwnerPropertyDetail /></LazyPage>} />
          <Route path="properties/:id/terms" element={<LazyPage><Pages.OwnerRentalTerms /></LazyPage>} />
          <Route path="properties/:id/setup" element={<LazyPage><Pages.PropertyQuickSetup /></LazyPage>} />
          <Route path="properties/:id/guidebook" element={<LazyPage><Pages.OwnerGuidebookEdit /></LazyPage>} />
          <Route path="properties/:id/editor" element={<LazyPage><Pages.PropertyEditor /></LazyPage>} />
          <Route path="properties/:id/manage" element={<LazyPage><Pages.PropertyManage /></LazyPage>} />
          <Route path="properties/:id/inventory" element={<LazyPage><Pages.InventoryPage /></LazyPage>} />
          <Route path="properties/:id/juristic-requests" element={<LazyPage><Pages.JuristicRequestsPage /></LazyPage>} />
          <Route path="properties/:id/portal-settings" element={<LazyPage><Pages.OwnerPortalSettingsPage /></LazyPage>} />
          <Route path="calendar" element={<LazyPage><Pages.OwnerCalendar /></LazyPage>} />
          <Route path="bookings" element={<Navigate to="/mc/bookings-list" replace />} />
          <Route path="operations" element={<LazyPage><Pages.OwnerOperations /></LazyPage>} />
          <Route path="finance" element={<LazyPage><Pages.FinanceOverview /></LazyPage>} />
          <Route path="financials" element={<LazyPage><Pages.OwnerFinancials /></LazyPage>} />
          <Route path="financials/new" element={<LazyPage><Pages.OwnerFinancialForm /></LazyPage>} />
          <Route path="financials/:id" element={<LazyPage><Pages.OwnerFinancialForm /></LazyPage>} />
          <Route path="budget" element={<LazyPage><Pages.BudgetPage /></LazyPage>} />
          <Route path="quick-expense" element={<LazyPage><Pages.QuickExpense /></LazyPage>} />
          <Route path="expenses/quick" element={<LazyPage><Pages.QuickExpense /></LazyPage>} />
          <Route path="income/quick" element={<LazyPage><Pages.QuickIncome /></LazyPage>} />
          <Route path="messages" element={<LazyPage><Pages.OwnerMessages /></LazyPage>} />
          <Route path="auto-messaging" element={<LazyPage><Pages.OwnerAutoMessaging /></LazyPage>} />
          <Route path="chat/:type/:id" element={<LazyPage><Pages.OwnerChatRoom /></LazyPage>} />
          <Route path="support-chat" element={<LazyPage><Pages.OwnerSupportChat /></LazyPage>} />
          <Route path="message-templates" element={<LazyPage><Pages.MessageTemplates /></LazyPage>} />
          <Route path="channels" element={<LazyPage><Pages.ChannelManager /></LazyPage>} />
          <Route path="team" element={<Navigate to="/mc/staff" replace />} />
          <Route path="reports" element={<LazyPage><Pages.ReportsPage /></LazyPage>} />
          <Route path="transparency/:propertyId" element={<LazyPage><Pages.OwnerTransparencyDashboard /></LazyPage>} />
          <Route path="maintenance-plan" element={<LazyPage><Pages.MaintenancePlan /></LazyPage>} />
          <Route path="management-terms" element={<LazyPage><Pages.ManagementPortfolio /></LazyPage>} />
          <Route path="staff" element={<LazyPage><Pages.StaffPage /></LazyPage>} />
          <Route path="subscription" element={<LazyPage><Pages.MCSubscriptionPage /></LazyPage>} />
          <Route path="sales" element={<LazyPage><Pages.SalesPipeline /></LazyPage>} />
          <Route path="sales/new" element={<LazyPage><Pages.NewDealPage /></LazyPage>} />
          <Route path="sales/analytics" element={<LazyPage><Pages.SalesAnalytics /></LazyPage>} />
          <Route path="sales/settings" element={<Navigate to="/mc/settings?tab=crm" replace />} />
          <Route path="settings" element={<LazyPage><Pages.MCSettingsPage /></LazyPage>} />
          <Route path="help" element={<LazyPage><Pages.MCHelpPage /></LazyPage>} />
          <Route path="sales/:id" element={<LazyPage><Pages.SalesDealDetail /></LazyPage>} />
          <Route path="contacts" element={<LazyPage><Pages.ContactsList /></LazyPage>} />
          <Route path="contacts/:id" element={<LazyPage><Pages.ContactDetail /></LazyPage>} />
          <Route path="contacts/import" element={<LazyPage><Pages.ContactImportPage /></LazyPage>} />
          <Route path="contacts/import-odoo" element={<LazyPage><Pages.ImportOdooContactsPage /></LazyPage>} />
          <Route path="invoices" element={<LazyPage><Pages.InvoicesPage /></LazyPage>} />
          <Route path="tasks" element={<LazyPage><Pages.CrmTasksPage /></LazyPage>} />
          <Route path="crm-dashboard" element={<LazyPage><Pages.CrmDashboardPage /></LazyPage>} />
          <Route path="sequences" element={<LazyPage><Pages.CrmSequencesPage /></LazyPage>} />
          <Route path="quotes" element={<LazyPage><Pages.CrmQuotesPage /></LazyPage>} />
          <Route path="meetings" element={<LazyPage><Pages.CrmMeetingsPage /></LazyPage>} />
          <Route path="crm-emails" element={<LazyPage><Pages.CrmEmailsPage /></LazyPage>} />
          <Route path="automations" element={<LazyPage><Pages.CrmWorkflowsPage /></LazyPage>} />
          <Route path="crm-templates" element={<LazyPage><Pages.CrmTemplatesPage /></LazyPage>} />
          <Route path="duplicates" element={<LazyPage><Pages.CrmDuplicatesPage /></LazyPage>} />
          <Route path="companies" element={<LazyPage><Pages.CrmCompaniesPage /></LazyPage>} />
          <Route path="forms" element={<LazyPage><Pages.CrmWebFormsPage /></LazyPage>} />
          <Route path="assignment" element={<LazyPage><Pages.CrmAssignmentRulesPage /></LazyPage>} />
          <Route path="vendors" element={<LazyPage><Pages.VendorDirectoryPage /></LazyPage>} />
          <Route path="inventory" element={<LazyPage><Pages.InventoryPage /></LazyPage>} />
          <Route path="documents" element={<LazyPage><Pages.DocumentTemplatesPage /></LazyPage>} />
          <Route path="marketing" element={<LazyPage><Pages.MarketingHubPage /></LazyPage>} />
          <Route path="vendor-acquisition" element={<LazyPage><Pages.AdminVendorProspects /></LazyPage>} />
          <Route path="vault" element={<LazyPage><Pages.OwnerVaultPage /></LazyPage>} />
          <Route path="rates" element={<LazyPage><Pages.RateManagementPage /></LazyPage>} />
          <Route path="reviews-management" element={<LazyPage><Pages.ReviewsManagementPage /></LazyPage>} />
          <Route path="insurance" element={<LazyPage><Pages.DocumentsInsurancePage /></LazyPage>} />
          <Route path="owners" element={<LazyPage><Pages.OwnerOwnersPage /></LazyPage>} />
          <Route path="owners/:id" element={<LazyPage><Pages.OwnerDetailPage /></LazyPage>} />
          <Route path="bookings-list" element={<LazyPage><Pages.MCBookingsPage /></LazyPage>} />
          <Route path="performance" element={<LazyPage><Pages.OwnerPerformance /></LazyPage>} />
          <Route path="trends" element={<LazyPage><Pages.OwnerTrendsAndTips /></LazyPage>} />
          <Route path="account-settings" element={<LazyPage><Pages.OwnerAccountSettings /></LazyPage>} />
          <Route path="superhost" element={<LazyPage><Pages.OwnerSuperhost /></LazyPage>} />
          {/* Pages moved from /owner */}
          <Route path="portfolio" element={<LazyPage><Pages.OwnerPortfolio /></LazyPage>} />
          <Route path="guide" element={<LazyPage><Pages.OwnerGuidePage /></LazyPage>} />
          <Route path="setup" element={<LazyPage><Pages.OwnerSetupWizard /></LazyPage>} />
          <Route path="service-request" element={<LazyPage><Pages.ServiceRequest /></LazyPage>} />
          <Route path="inspection" element={<LazyPage><Pages.InspectionRequest /></LazyPage>} />
          <Route path="full-management" element={<LazyPage><Pages.FullManagement /></LazyPage>} />
        </Route>

        {/* ── Owner → MC Redirects (legacy backward compat) ── */}
        <Route path="/owner/landing" element={<Navigate to="/mc" replace />} />
        <Route path="/owner/onboarding" element={<Navigate to="/mc/setup" replace />} />
        <Route path="/owner/guide" element={<Navigate to="/mc/guide" replace />} />
        <Route path="/owner/setup" element={<Navigate to="/mc/setup" replace />} />
        <Route path="/owner/portfolio" element={<Navigate to="/mc/portfolio" replace />} />
        <Route path="/owner/finance" element={<Navigate to="/mc/finance" replace />} />
        <Route path="/owner/service-request" element={<Navigate to="/mc/service-request" replace />} />
        <Route path="/owner/inspection" element={<Navigate to="/mc/inspection" replace />} />
        <Route path="/owner/full-management" element={<Navigate to="/mc/full-management" replace />} />
        <Route path="/owner" element={<Navigate to="/mc" replace />} />
        <Route path="/owner/*" element={<Navigate to="/mc" replace />} />
        
        {/* ── Owner Portal (property owner read-only) ── */}
        <Route path="/my-property" element={<AuthGuard><LazyPage><Pages.OwnerPortalDashboard /></LazyPage></AuthGuard>} />
        <Route path="/my-property/:propertyId" element={<AuthGuard><LazyPage><Pages.OwnerPortalPropertyView /></LazyPage></AuthGuard>} />
        
        {/* ── Catch-all ── */}
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
    
    <AdaptiveBottomNav />
    </>
  );
};
