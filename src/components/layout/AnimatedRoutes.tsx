/**
 * AnimatedRoutes — P3 Consolidated
 *
 * Route tree only. All lazy imports come from pageRegistry.ts.
 * ~500 lines (route definitions) vs ~980 lines before.
 *
 * Transitions: `ScrollToTop` on pathname; most routes use `LazyPage` → `PageTransition`
 * + Suspense. Layout shells (Admin/Vendor/MC/Guest) wrap `<Outlet />` with Suspense only
 * — avoid nesting another PageTransition inside their child pages.
 */
import React, { Suspense } from 'react';
import { Routes, Route, useLocation, Navigate, Outlet, useParams } from 'react-router-dom';
import { ActiveCompanyProvider } from '@/hooks/useActiveCompany';
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from './PageTransition';
import { ScrollToTop } from './ScrollToTop';
import { LoadingState } from '@/components/uno/LoadingSpinner';
import { AdminGuard, VendorGuard, TeamGuard, AuthGuard, StaffGuard, MCGuard } from '@/components/auth';
import { MCPortalGuard } from '@/components/auth/MCPortalGuard';

import { CapitalLayout } from '@/components/capital/CapitalLayout';
import { AdminLayout } from '@/components/admin/AdminLayout';

import { MCLayout } from '@/components/mc/MCLayout';
import { VendorLayout } from '@/components/vendor/VendorLayout';
import { GuestLayout } from '@/components/guest/GuestLayout';
import { StaffLayout } from '@/components/staff/StaffLayout';
import { useNavigationDirection } from '@/hooks/useNavigationDirection';
import { APP_ROUTES } from '@/lib/config/routes';
import { NewbuildProjectToOffplanRedirect } from '@/components/routing/NewbuildLegacyRedirects';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import ForBusinessSkeleton from '@/components/landings/ForBusinessSkeleton';
import { NbCompareProvider } from '@/components/newbuilds/NbCompareProvider';
import { adminRoutes } from './routes/adminRoutes';
import { mcRoutes } from './routes/mcRoutes';
import { propertyHubRoutes } from './routes/propertyHubRoutes';

const NewbuildsContextOutlet = () => (
  <NbCompareProvider>
    <Outlet />
  </NbCompareProvider>
);

// Alias: /life-flow/:code → /life/:code (preserves deep-link compatibility)
const LifeFlowAlias = () => {
  const { code } = useParams();
  return <Navigate to={`/life/${code ?? ''}`} replace />;
};

// PropertyHubIndex moved to ./routes/propertyHubRoutes.tsx

// Core pages — Auth/NotFound stay eager (small, on critical paths).
// Index and WelcomeLanding are lazy: home is by far the heaviest route
// (~30 home components + persona logic) and we don't want to block first
// paint on /auth, /property/:id, deep links, etc.
import Auth from '@/pages/Auth';
import NotFound from '@/pages/NotFound';
import Unsubscribe from '@/pages/Unsubscribe';
import { useAuth } from '@/contexts/AuthContext';

const Index = React.lazy(() => import('@/pages/Index'));
const WelcomeLanding = React.lazy(() => import('@/pages/WelcomeLanding'));


// All lazy page imports from centralized registry
import * as Pages from './pageRegistry';

// Property Hub wrapper
const PropertyHub = React.lazy(() => import('@/pages/property/PropertyHub'));

// M6 · Track B.4 — persona landing route `/for/:persona`
const PersonaLandingPage = React.lazy(() => import('@/pages/landings/PersonaLandingPage'));
const PersonaDirectoryPage = React.lazy(() => import('@/pages/landings/PersonaDirectoryPage'));
const PersonaAreaLandingPage = React.lazy(() => import('@/pages/landings/PersonaAreaLandingPage'));
// M6 · Track B.5 — cluster landing route `/cluster/:cluster`
const ClusterLandingPage = React.lazy(() => import('@/pages/landings/ClusterLandingPage'));
// M10b · IPP §4G — Deal Room stub
const MandateLanding = React.lazy(() => import('@/pages/property/MandateLanding'));
// Magnet visual-builder landings (`/l/:slug`)
const MagnetLandingPage = React.lazy(() => import('@/pages/landings/MagnetLandingPage'));

// Home router: guests see marketing landing, authed users see Index
const HomeRouter = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingState />;
  if (!user) {
    return <WelcomeLanding />;
  }
  return <Index />;
};

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
const InvestIdRedirect = () => { const { id } = useParams(); return <Navigate to={`/invest/${id}`} replace />; };

// ── Layout Wrappers ──

const LazyPage = ({ children }: { children: React.ReactNode }) => (
  <PageTransition>
    <Suspense fallback={<LoadingState />}>{children}</Suspense>
  </PageTransition>
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

// Prefetch popular routes on idle.
// Wrapped in .catch() so a transient HMR / chunk-load error in one module
// can't poison the SPA navigation. Failures are silent — these are
// best-effort warm-ups, not critical loads.
const safeImport = (loader: () => Promise<unknown>) => {
  try {
    loader().catch(() => { /* swallow — non-critical prefetch */ });
  } catch { /* swallow sync throws too */ }
};

const prefetchRoutes = () => {
  if (typeof window === 'undefined') return;
  const run = () => {
    safeImport(() => import('@/pages/property/PropertyIndex'));
    safeImport(() => import('@/pages/restaurants/RestaurantsIndex'));
    safeImport(() => import('@/pages/experiences/ExperiencesIndex'));
    safeImport(() => import('@/pages/beauty/BeautySpaIndex'));
  };
  if ('requestIdleCallback' in window) {
    (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(run);
  } else {
    setTimeout(run, 1500);
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
        <Route path={APP_ROUTES.HOME} element={<PageTransition><Suspense fallback={<LoadingState />}><HomeRouter /></Suspense></PageTransition>} />
        <Route path="/index" element={<Navigate to={APP_ROUTES.HOME} replace />} />
        <Route path={APP_ROUTES.PRICING} element={<LazyPage><Pages.PricingPage /></LazyPage>} />
        {/* Wave-1 IA cleanup: /welcome-landing → /welcome (single canonical guest landing). */}
        <Route path="/welcome-landing" element={<Navigate to="/welcome" replace />} />
        {/* Onboarding canonical: /start renders V2 (M5 3-question flow).
            /onboarding/* legacy and /start/v2 redirect to canonical /start. */}
        <Route path="/onboarding" element={<Navigate to="/start" replace />} />
        <Route path="/onboarding/destination" element={<Navigate to="/start" replace />} />
        <Route path="/onboarding/questions" element={<Navigate to="/start" replace />} />
        <Route path="/onboarding/map" element={<Navigate to="/start" replace />} />
        <Route path="/start" element={<LazyPage><Pages.StartOnboardingV2 /></LazyPage>} />
        <Route path="/start/v2" element={<Navigate to="/start" replace />} />
        <Route path={APP_ROUTES.AUTH} element={<PageTransition><Auth /></PageTransition>} />
        {/* OAuth providers may return to callback-style paths; render Auth instead of 404 */}
        <Route path="/auth/callback" element={<PageTransition><Auth /></PageTransition>} />
        <Route path="/auth/callback/*" element={<PageTransition><Auth /></PageTransition>} />
        <Route path="/oauth/callback" element={<PageTransition><Auth /></PageTransition>} />
        <Route path="/oauth/callback/*" element={<PageTransition><Auth /></PageTransition>} />
        <Route path={APP_ROUTES.AUTH_ACCOUNT_TYPE} element={<LazyPage><Pages.AccountTypeSelection /></LazyPage>} />
        <Route path={APP_ROUTES.AUTH_FORGOT_PASSWORD} element={<LazyPage><Pages.ForgotPassword /></LazyPage>} />
        <Route path={APP_ROUTES.AUTH_RESET_PASSWORD} element={<LazyPage><Pages.ResetPassword /></LazyPage>} />
        
        {/* ── User ── */}
        {/* Wave-1 IA cleanup: /discover — единственная каноническая «дверь» в каталог.
            /navigator, /catalog, /categories — все редиректят на /discover. */}
        <Route path={APP_ROUTES.DISCOVER} element={<LazyPage><Pages.Discover /></LazyPage>} />
        <Route path={`${APP_ROUTES.DISCOVER}/:code`} element={<LazyPage><Pages.SituationDetail /></LazyPage>} />
        <Route path={APP_ROUTES.NAVIGATOR} element={<Navigate to={APP_ROUTES.DISCOVER} replace />} />
        <Route path="/catalog" element={<Navigate to={APP_ROUTES.DISCOVER} replace />} />
        <Route path="/categories" element={<Navigate to={APP_ROUTES.DISCOVER} replace />} />
        {/* Bible-v2 audit A1: the duplicate LEGAL_CLUSTER redirect that used
            to live here was shadowing the real LegalClusterPage route declared
            further down in the LEGAL Cluster block. `/legal` is one of the six
            canonical surfaces (H01) and renders its own landing page. */}
        <Route path={APP_ROUTES.MAP} element={<LazyPage><Pages.MapView /></LazyPage>} />
        <Route path={APP_ROUTES.BOOKINGS} element={<LazyPage><Pages.Bookings /></LazyPage>} />
        <Route path="/bookings/:id" element={<LazyPage><Pages.BookingDetail /></LazyPage>} />
        <Route path="/orders/:id/tracking" element={<LazyPage><Pages.OrderTracking /></LazyPage>} />
        <Route path={APP_ROUTES.PROFILE} element={<LazyPage><Pages.Profile /></LazyPage>} />
        <Route path={APP_ROUTES.PROFILE_EDIT} element={<LazyPage><Pages.EditProfile /></LazyPage>} />
        <Route path={APP_ROUTES.PROFILE_SETTINGS} element={<LazyPage><Pages.ProfileSettings /></LazyPage>} />
        <Route path={APP_ROUTES.PROFILE_PERSONAL_DETAILS} element={<LazyPage><Pages.PersonalDetails /></LazyPage>} />
        <Route path="/profile/referral" element={<LazyPage><Pages.ReferralPage /></LazyPage>} />
        {/* ── PEYLAA premium sales funnel ── */}
        <Route path={APP_ROUTES.PEYLAA} element={<LazyPage><Pages.PeylaaLanding /></LazyPage>} />
        <Route path="/peylaa/unit/:unitNo" element={<Navigate to={APP_ROUTES.PEYLAA} replace />} />
        {/* /account deprecated → /me canonical hub */}
        <Route path={APP_ROUTES.ACCOUNT} element={<Navigate to={APP_ROUTES.ME} replace />} />
        {/* ── /me Universal Hub (Phase A5) ── */}
        <Route path={APP_ROUTES.ME_FEED} element={<LazyPage><Pages.MeFeed /></LazyPage>} />
        <Route path={APP_ROUTES.ME_SERVICES} element={<LazyPage><Pages.MeServices /></LazyPage>} />
        <Route path={APP_ROUTES.ME_DOCUMENTS} element={<LazyPage><Pages.MeDocuments /></LazyPage>} />
        <Route path={APP_ROUTES.ME_PAYMENTS} element={<LazyPage><Pages.MePayments /></LazyPage>} />
        <Route path={APP_ROUTES.ME_REQUESTS} element={<LazyPage><Pages.MeRequests /></LazyPage>} />
        <Route path={APP_ROUTES.ME_PROFILE} element={<LazyPage><Pages.MeProfile /></LazyPage>} />
        <Route path="/me/bookings" element={<LazyPage><Pages.MeBookings /></LazyPage>} />
        <Route path={APP_ROUTES.FAVORITES} element={<LazyPage><Pages.Favorites /></LazyPage>} />
        <Route path="/account/saved-searches" element={<LazyPage><Pages.SavedSearches /></LazyPage>} />
        <Route path="/account/newbuild-alerts" element={<LazyPage><Pages.NewbuildAlerts /></LazyPage>} />
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
        <Route path={APP_ROUTES.FOR_REAL_ESTATE_DEVELOPERS} element={<LazyPage><Pages.ForDevelopers /></LazyPage>} />
        <Route path={APP_ROUTES.FOR_LOCAL_SERVICE_PROVIDERS} element={<LazyPage><Pages.ForLocalServiceProviders /></LazyPage>} />
        <Route
          path={APP_ROUTES.FOR_BUSINESS}
          element={
            <PageTransition>
              <ErrorBoundary>
                <Suspense fallback={<ForBusinessSkeleton />}>
                  <Pages.ForBusinessPage />
                </Suspense>
              </ErrorBoundary>
            </PageTransition>
          }
        />
        <Route path={APP_ROUTES.DEVELOPER_PORTAL_APPLY} element={<LazyPage><Pages.DeveloperApply /></LazyPage>} />
        <Route path={APP_ROUTES.DEVELOPER_PORTAL_ONBOARDING} element={<LazyPage><Pages.DeveloperOnboarding /></LazyPage>} />
        <Route path="/developer-portal/onboarding/:step" element={<LazyPage><Pages.DeveloperOnboarding /></LazyPage>} />
        <Route path={APP_ROUTES.DEVELOPER_PORTAL_PENDING} element={<LazyPage><Pages.DeveloperPending /></LazyPage>} />
        <Route path={APP_ROUTES.DEVELOPER_PORTAL_ACCEPT_INVITE} element={<LazyPage><Pages.DeveloperAcceptInvite /></LazyPage>} />
        <Route path={APP_ROUTES.DEVELOPER_PORTAL_ACCEPT_CLAIM} element={<LazyPage><Pages.DeveloperAcceptClaim /></LazyPage>} />
        <Route path={APP_ROUTES.DEVELOPER_PORTAL_STRIPE_RETURN} element={<LazyPage><Pages.DeveloperStripeReturn /></LazyPage>} />
        <Route path="/b/:slug" element={<LazyPage><Pages.StorefrontPage /></LazyPage>} />
        
        {/* ── LifeOS ── */}
        {/* /life-flow/:code deprecated → /life/:code canonical */}
        <Route path="/life-flow/:code" element={<LifeFlowAlias />} />
        <Route path="/life/:code" element={<LazyPage><Pages.LifeFlowPage /></LazyPage>} />
        <Route path="/trip-planner" element={<LazyPage><Pages.TripPlannerPage /></LazyPage>} />
        <Route path="/list-with-us" element={<LazyPage><Pages.ListWithUsPage /></LazyPage>} />

        {/* ── Stage 4: Unified Outreach Hub ── */}
        <Route path="/outreach" element={<LazyPage><Pages.OutreachHub /></LazyPage>} />
        {/* Legacy entry: /mc/sequences → /outreach?audience=guest */}
        <Route path="/mc/sequences" element={<Navigate to="/outreach?audience=guest" replace />} />
        
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
        
        <Route
          path={APP_ROUTES.STAYS_SEARCH}
          element={<Navigate to={`${APP_ROUTES.PROPERTY_BROWSE}?mode=rent&tenancy=short`} replace />}
        />

        {/* ── Property Hub (child routes extracted to ./routes/propertyHubRoutes) ── */}
        <Route path="/properties" element={<Navigate to={APP_ROUTES.PROPERTY} replace />} />
        <Route path={APP_ROUTES.PROPERTY} element={<PageTransition><Suspense fallback={<LoadingState />}><PropertyHub /></Suspense></PageTransition>}>
          {propertyHubRoutes}
        </Route>
        <Route path="/company/:slug" element={<LazyPage><Pages.ManagementCompanyProfile /></LazyPage>} />
        
        {/* ── Legacy Property Hub Redirects ── */}
        <Route path="/offplan" element={<Navigate to={APP_ROUTES.OFFPLAN} replace />} />
        <Route path="/offplan/:id" element={<OffplanIdRedirect />} />
        <Route path="/developers" element={<Navigate to={APP_ROUTES.DEVELOPERS} replace />} />
        <Route path="/developers/:id" element={<DeveloperIdRedirect />} />
        <Route path="/complexes" element={<Navigate to={APP_ROUTES.COMPLEXES} replace />} />
        <Route path="/invest/market" element={<Navigate to={APP_ROUTES.INVEST_MARKET} replace />} />
        <Route path="/invest/network" element={<Navigate to={APP_ROUTES.INVEST_NETWORK} replace />} />
        <Route path="/invest/execution" element={<Navigate to={APP_ROUTES.INVEST_EXECUTION} replace />} />
        
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
        {/* Project microsite — standalone, no app shell, custom SEO */}
        <Route path="/p/:slug" element={<LazyPage><Pages.ProjectMicrosite /></LazyPage>} />
        <Route path={APP_ROUTES.NEWBUILDS} element={<LazyPage><Pages.NewbuildsLanding /></LazyPage>} />
        <Route path={APP_ROUTES.NEWBUILDS_PROJECTS} element={<Navigate to={APP_ROUTES.OFFPLAN} replace />} />
        <Route path="/newbuilds/projects/:slug" element={<NewbuildProjectToOffplanRedirect />} />
        <Route path={APP_ROUTES.NEWBUILDS_DEVELOPERS} element={<Navigate to={APP_ROUTES.DEVELOPERS} replace />} />
        <Route path="/newbuilds/developers/:slug" element={<Navigate to={APP_ROUTES.DEVELOPERS} replace />} />
        <Route element={<NewbuildsContextOutlet />}>
          <Route path={APP_ROUTES.NEWBUILDS_MAP} element={<LazyPage><Pages.NewbuildsMap /></LazyPage>} />
          <Route path={APP_ROUTES.NEWBUILDS_CALCULATOR} element={<LazyPage><Pages.NewbuildsCalculator /></LazyPage>} />
          <Route path={APP_ROUTES.NEWBUILDS_COMPARE} element={<LazyPage><Pages.NewbuildsCompare /></LazyPage>} />
          <Route path={APP_ROUTES.NEWBUILDS_AREAS} element={<LazyPage><Pages.NewbuildsAreaGuides /></LazyPage>} />
          <Route path="/newbuilds/areas/:slug" element={<LazyPage><Pages.NewbuildsAreaDetail /></LazyPage>} />
          <Route path={APP_ROUTES.NEWBUILDS_DUE_DILIGENCE} element={<LazyPage><Pages.NewbuildsDueDiligence /></LazyPage>} />
        </Route>

        {/* ── Developer Portal ── */}
        <Route path="/developer-portal" element={<PageTransition><Suspense fallback={<LoadingState />}><Pages.DeveloperPortalLayout /></Suspense></PageTransition>}>
          <Route index element={<LazyPage><Pages.DeveloperOverview /></LazyPage>} />
          <Route path="projects" element={<LazyPage><Pages.DeveloperProjects /></LazyPage>} />
          <Route path="projects/new" element={<LazyPage><Pages.DeveloperProjectEditor /></LazyPage>} />
          <Route path="projects/:id" element={<LazyPage><Pages.DeveloperProjectEditor /></LazyPage>} />
          <Route path="company" element={<LazyPage><Pages.DeveloperCompany /></LazyPage>} />
          <Route path="leads" element={<LazyPage><Pages.DeveloperLeads /></LazyPage>} />
          <Route path="leads/:id" element={<LazyPage><Pages.DeveloperLeadDetail /></LazyPage>} />
          <Route path="analytics" element={<LazyPage><Pages.DeveloperAnalytics /></LazyPage>} />
          <Route path="team" element={<LazyPage><Pages.DeveloperTeam /></LazyPage>} />
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
        <Route path={APP_ROUTES.VISA_COMPARE} element={<LazyPage><Pages.VisaComparePage /></LazyPage>} />
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
        <Route path={APP_ROUTES.FET_CHECK} element={<LazyPage><Pages.FETPage /></LazyPage>} />
        <Route path={APP_ROUTES.TAX_NAV} element={<LazyPage><Pages.TaxNavPage /></LazyPage>} />
        {/* Trust Stack §3 A-3: Deposit Vault + Dispute Pack + magnet quiz */}
        <Route path={APP_ROUTES.DEPOSIT_VAULT} element={<LazyPage><Pages.DepositVaultPage /></LazyPage>} />
        <Route path={APP_ROUTES.DEPOSIT_DISPUTE_NEW} element={<LazyPage><Pages.DepositDisputePage /></LazyPage>} />
        <Route path="/legal/deposit-vault/dispute/:packId" element={<LazyPage><Pages.DepositDisputePage /></LazyPage>} />
        <Route path={APP_ROUTES.DEPOSIT_RISK_QUIZ} element={<LazyPage><Pages.DepositRiskQuizPage /></LazyPage>} />
        <Route path={APP_ROUTES.TAX_STRUCTURING} element={<LazyPage><Pages.TaxStructuringLanding /></LazyPage>} />
        <Route path={APP_ROUTES.CLEARVIEW_FOR_DEVELOPERS} element={<LazyPage><Pages.ClearViewForDevelopersLanding /></LazyPage>} />
        
        {/* ── Investment Hub (top-level, multi-asset) ── */}
        <Route path={APP_ROUTES.INVEST} element={<LazyPage><Pages.InvestmentHubLanding /></LazyPage>} />
        <Route path={APP_ROUTES.INVEST_REAL_ESTATE} element={<LazyPage><Pages.InvestmentRealEstateZone /></LazyPage>} />
        <Route path={APP_ROUTES.INVEST_BUSINESS} element={<LazyPage><Pages.InvestmentBusinessZone /></LazyPage>} />
        <Route path={APP_ROUTES.INVEST_KNOWLEDGE} element={<LazyPage><Pages.InvestmentKnowledgeZone /></LazyPage>} />
        <Route path={APP_ROUTES.INVEST_SERVICES} element={<LazyPage><Pages.InvestmentServicesZone /></LazyPage>} />
        <Route path={APP_ROUTES.INVEST_QUIZ} element={<LazyPage><Pages.InvestorQuiz /></LazyPage>} />
        <Route path={APP_ROUTES.INVEST_DASHBOARD} element={<LazyPage><Pages.InvestorDashboard /></LazyPage>} />
        {/* Wave 1 IA consolidation: /invest/raise = canonical 5-step submit form.
            Legacy /invest/pitch and /invest/articles redirect to canonical entries. */}
        <Route path={APP_ROUTES.INVEST_RAISE} element={<LazyPage><Pages.InvestmentSubmit /></LazyPage>} />
        {/* Admin-only ops console (Market/Deals/Network/Execution shell) */}
        <Route path={APP_ROUTES.INVEST_OPS} element={<Navigate to={APP_ROUTES.INVEST_MARKET} replace />} />
        <Route path={APP_ROUTES.INVEST_MARKET} element={<AdminGuard><LazyPage><Pages.InvestmentOpsConsole /></LazyPage></AdminGuard>} />
        <Route path={APP_ROUTES.INVEST_DEALS} element={<AdminGuard><LazyPage><Pages.InvestmentOpsConsole /></LazyPage></AdminGuard>} />
        <Route path={APP_ROUTES.INVEST_NETWORK} element={<AdminGuard><LazyPage><Pages.InvestmentOpsConsole /></LazyPage></AdminGuard>} />
        <Route path={APP_ROUTES.INVEST_EXECUTION} element={<AdminGuard><LazyPage><Pages.InvestmentOpsConsole /></LazyPage></AdminGuard>} />
        {/* Specific invest sub-routes BEFORE catch-all :id */}
        <Route path="/invest/thailand" element={<LazyPage><Pages.InvestInThailand /></LazyPage>} />
        {/* Legacy: /invest/pitch → /invest/raise (single canonical raise funnel) */}
        <Route path="/invest/pitch" element={<Navigate to={APP_ROUTES.INVEST_RAISE} replace />} />
        {/* Phase 3 — universal capital marketplace public routes */}
        <Route path={APP_ROUTES.INVEST_SUBMIT} element={<LazyPage><Pages.InvestmentSubmit /></LazyPage>} />
        <Route path={APP_ROUTES.INVEST_DEALS_BOARD} element={<LazyPage><Pages.InvestmentDeals /></LazyPage>} />
        <Route path={APP_ROUTES.CAPITAL_DEAL_INTAKE} element={<LazyPage><Pages.CapitalDealIntake /></LazyPage>} />
        <Route path={APP_ROUTES.CAPITAL_ADVISORY} element={<LazyPage><Pages.CapitalAdvisoryLanding /></LazyPage>} />
        <Route path={APP_ROUTES.INVEST_CALCULATOR} element={<LazyPage><Pages.InvestmentCalculatorPage /></LazyPage>} />
        {/* Wave 2: unified tools hub (ClearView + Calculator + Advisory + DD) */}
        <Route path={APP_ROUTES.INVEST_TOOLS} element={<LazyPage><Pages.InvestmentToolsHub /></LazyPage>} />
        {/* Wave 2: /invest/clearview alias → canonical /property/clearview */}
        <Route path="/invest/clearview" element={<Navigate to={APP_ROUTES.CLEARVIEW} replace />} />
        <Route path="/invest/deal/:id" element={<LazyPage><Pages.InvestmentDealPublicDetail /></LazyPage>} />
        {/* Legacy: /invest/articles → /invest/knowledge (merged hub) */}
        <Route path="/invest/articles" element={<Navigate to={APP_ROUTES.INVEST_KNOWLEDGE} replace />} />
        <Route path="/invest/articles/:slug" element={<LazyPage><Pages.InvestmentArticleDetail /></LazyPage>} />
        <Route path="/invest/business/:slug" element={<LazyPage><Pages.InvestmentBusinessDetail /></LazyPage>} />
        <Route path={APP_ROUTES.INVEST_DETAIL(':id')} element={<LazyPage><Pages.InvestmentDetail /></LazyPage>} />
        {/* Legacy: /invest/:id → /invest/project/:id */}
        <Route path="/invest/:id" element={<LazyPage><Pages.InvestmentDetail /></LazyPage>} />
        {/* Legacy aliases */}
        <Route path={APP_ROUTES.INVEST_CLUSTER} element={<Navigate to={APP_ROUTES.INVEST} replace />} />
        <Route path="/invest-hub" element={<Navigate to={APP_ROUTES.INVEST} replace />} />
        
        {/* ── Knowledge ── */}
        <Route path={APP_ROUTES.KNOWLEDGE} element={<LazyPage><Pages.KnowledgeHub /></LazyPage>} />
        {/* Pillars must precede generic /knowledge/:section to take routing priority */}
        <Route path={APP_ROUTES.KNOWLEDGE_PILLARS} element={<LazyPage><Pages.KnowledgePillarsIndex /></LazyPage>} />
        <Route path="/knowledge/pillars/:slug" element={<LazyPage><Pages.KnowledgePillarPage /></LazyPage>} />
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
        
        {/* ── Market ── */}
        <Route path="/market" element={<LazyPage><Pages.MarketIndex /></LazyPage>} />
        <Route path="/market/categories" element={<LazyPage><Pages.MarketCatalogPage /></LazyPage>} />
        <Route path="/market/category/:categoryId" element={<LazyPage><Pages.MarketCategoryPage /></LazyPage>} />
        <Route path="/market/product/:productId" element={<LazyPage><Pages.ProductDetailPage /></LazyPage>} />
        <Route path="/market/vendor/:slug" element={<LazyPage><Pages.VendorPage /></LazyPage>} />
        <Route path="/market/wishlist" element={<LazyPage><Pages.WishlistPage /></LazyPage>} />
        <Route path="/market/store/:id" element={<LazyPage><Pages.StoreDetail /></LazyPage>} />
        <Route path="/market/checkout" element={<LazyPage><Pages.MarketCheckout /></LazyPage>} />
        <Route path="/market/success" element={<LazyPage><Pages.MarketSuccess /></LazyPage>} />
        <Route path="/sell" element={<AuthGuard><LazyPage><Pages.SellItemPage /></LazyPage></AuthGuard>} />
        
        {/* ── Classifieds (Барахолка) ── */}
        <Route path="/classifieds" element={<LazyPage><Pages.ClassifiedsIndex /></LazyPage>} />
        <Route path="/classifieds/sell" element={<AuthGuard><LazyPage><Pages.ClassifiedsSellPage /></LazyPage></AuthGuard>} />
        <Route path="/classifieds/:id" element={<LazyPage><Pages.ClassifiedDetailPage /></LazyPage>} />
        
        {/* ── Monetization Landing Pages ── */}
        <Route path={APP_ROUTES.RELOCATION_GUIDES} element={<LazyPage><Pages.RelocationGuidesHub /></LazyPage>} />
        <Route path={`${APP_ROUTES.RELOCATION_GUIDES}/:slug`} element={<LazyPage><Pages.RelocationGuideArticle /></LazyPage>} />
        <Route path={APP_ROUTES.RELOCATION_MY_PLAN} element={<LazyPage><Pages.RelocationDashboard /></LazyPage>} />
        <Route path={APP_ROUTES.RELOCATION_AREAS} element={<LazyPage><Pages.RelocationAreasPage /></LazyPage>} />
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
        
        {/* ── Admin (route definitions extracted to ./routes/adminRoutes) ── */}
        <Route element={<AdminRouteLayout />}>
          {adminRoutes}
        </Route>
        
        {/* ── Staff (dashboard removed 2026-06-05; HRIS out of Y1) ── */}
        
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
          <Route path="/vendor/pharmacy" element={<Pages.VendorPharmacy />} />
          <Route path="/vendor/insurance" element={<Pages.VendorInsurance />} />
          <Route path="/vendor/locations" element={<Pages.VendorLocations />} />
          <Route path="/vendor/products" element={<Pages.VendorProducts />} />
          <Route path="/vendor/orders" element={<Pages.VendorBookings />} />
          <Route path="/vendor/messages" element={<Pages.VendorMessages />} />
          <Route path="/vendor/settings" element={<Pages.VendorSettingsPage />} />
        </Route>
        
        {/* ── MC Onboarding (outside MCGuard, but requires auth) ── */}
        <Route path="/mc/onboarding" element={<LazyPage><AuthGuard><Pages.MCOnboarding /></AuthGuard></LazyPage>} />
        <Route path="/mc/register" element={<LazyPage><AuthGuard><Pages.MCRegistrationPage /></AuthGuard></LazyPage>} />
        
        {/* ── MC (Management Company) Workspace — child routes extracted to ./routes/mcRoutes ── */}
        <Route path="/mc" element={<ActiveCompanyProvider><MCGuard><MCLayout /></MCGuard></ActiveCompanyProvider>}>
          {mcRoutes}
        </Route>

        {/* ── Capital CRM ── */}
        <Route path="/capital" element={<AuthGuard><CapitalLayout /></AuthGuard>}>
          <Route index element={<LazyPage><Pages.CapitalDashboard /></LazyPage>} />
          <Route path="contacts" element={<LazyPage><Pages.CapitalContacts /></LazyPage>} />
          <Route path="contacts/:id" element={<LazyPage><Pages.CapitalContactDetail /></LazyPage>} />
          <Route path="projects" element={<LazyPage><Pages.CapitalProjects /></LazyPage>} />
          <Route path="campaigns" element={<LazyPage><Pages.CapitalCampaigns /></LazyPage>} />
          <Route path="campaigns/launch" element={<LazyPage><Pages.CapitalCampaignLaunch /></LazyPage>} />
          <Route path="outreach" element={<LazyPage><Pages.CapitalOutreach /></LazyPage>} />
          <Route path="pipeline" element={<LazyPage><Pages.CapitalPipeline /></LazyPage>} />
          <Route path="templates" element={<LazyPage><Pages.CapitalTemplates /></LazyPage>} />
          <Route path="deals/newbuilds" element={<LazyPage><Pages.CapitalNewbuildsDeals /></LazyPage>} />
          <Route path="investment-deals" element={<LazyPage><Pages.CapitalInvestmentDeals /></LazyPage>} />
          <Route path="investment-deals/:id" element={<LazyPage><Pages.CapitalInvestmentDealDetail /></LazyPage>} />
          <Route path="developers" element={<LazyPage><Pages.CapitalDevelopersPending /></LazyPage>} />
          {/* /capital/developers/pending removed — list page shows pending + approved via tabs */}
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
        <Route path={APP_ROUTES.OWNER_MANAGEMENT_LANDING} element={<LazyPage><Pages.OwnerManagementLanding /></LazyPage>} />
        <Route path={APP_ROUTES.STOREFRONT_DEMO} element={<LazyPage><Pages.StorefrontDemoLanding /></LazyPage>} />
        <Route path="/owner/full-management" element={<Navigate to="/mc/full-management" replace />} />
        <Route path="/owner" element={<Navigate to="/mc" replace />} />
        <Route path="/owner/*" element={<Navigate to="/mc" replace />} />
        
        {/* ── Owner Portal (property owner read-only) ── */}
        <Route path="/my-property" element={<AuthGuard><MCPortalGuard><LazyPage><Pages.OwnerPortalDashboard /></LazyPage></MCPortalGuard></AuthGuard>} />
        <Route path="/my-property/statements" element={<AuthGuard><MCPortalGuard><LazyPage><Pages.OwnerStatementsInbox /></LazyPage></MCPortalGuard></AuthGuard>} />
        <Route path="/my-property/signatures" element={<AuthGuard><MCPortalGuard><LazyPage><Pages.OwnerSignaturesInbox /></LazyPage></MCPortalGuard></AuthGuard>} />
       <Route path="/my-property/transparency/:propertyId" element={<AuthGuard><MCPortalGuard><LazyPage><Pages.OwnerTransparencyDashboard /></LazyPage></MCPortalGuard></AuthGuard>} />
        <Route path="/my-property/:propertyId" element={<AuthGuard><MCPortalGuard><LazyPage><Pages.OwnerPortalPropertyView /></LazyPage></MCPortalGuard></AuthGuard>} />

        {/* ── Operator confirmation landing (signed HMAC link, no auth gate) ── */}
        <Route path="/operate/transfers/confirm" element={<LazyPage><Pages.OperatorTransferConfirm /></LazyPage>} />
        <Route path="/operate/transfers" element={<LazyPage><AuthGuard><Pages.OperatorTransfers /></AuthGuard></LazyPage>} />



        {/* ── M6 Persona Landings (B.4) ── */}
        {/* Draft slugs and unknown slugs return 404 inside the page itself. */}
        <Route path="/for" element={<LazyPage><PersonaDirectoryPage /></LazyPage>} />
        {/* Wave 4 — geo long-tail: must precede `/for/:persona` to match first. */}
        <Route path="/for/:persona/in/:area" element={<LazyPage><PersonaAreaLandingPage /></LazyPage>} />
        <Route path="/for/:persona" element={<LazyPage><PersonaLandingPage /></LazyPage>} />

        {/* Magnet visual-builder landings */}
        <Route path="/l/:slug" element={<LazyPage><MagnetLandingPage /></LazyPage>} />

        {/* ── M10b · IPP — nested entry under Property Hub (ARCHITECTURE_V2 §13.1) ── */}
        {/* Same content as /for/:persona, accessible from PropertyHub navigation. */}
        <Route path="/property/for/:persona" element={<LazyPage><PersonaLandingPage /></LazyPage>} />

        {/* ── M10b · IPP §4G — Deal Room stub (P9 HNW invite-only) ── */}
        <Route path="/property/mandate" element={<LazyPage><MandateLanding /></LazyPage>} />
        <Route path={APP_ROUTES.RESALE_LANDING} element={<LazyPage><Pages.ResaleAssignmentLanding /></LazyPage>} />

        {/* ── M6 Cluster Landings (B.5) ── */}
        {/* Same 200/404 contract as `/for/:persona`. */}
        <Route path="/cluster/:cluster" element={<LazyPage><ClusterLandingPage /></LazyPage>} />

        {/* ── Area Landings (public, indexable) ── */}
        <Route path="/area" element={<LazyPage><Pages.AreaIndexPage /></LazyPage>} />
        <Route path="/area/:slug" element={<LazyPage><Pages.AreaLandingPage /></LazyPage>} />

        {/* ── Email unsubscribe (token-based) ── */}
        <Route path="/unsubscribe" element={<PageTransition><Unsubscribe /></PageTransition>} />

        {/* ── Catch-all ── */}
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
    </>
  );
};
