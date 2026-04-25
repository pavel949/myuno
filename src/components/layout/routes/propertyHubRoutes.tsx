/**
 * Property Hub child routes — extracted from AnimatedRoutes.
 * Rendered as nested children of /property under PropertyHub layout.
 */
import { Route, Navigate, useParams } from 'react-router-dom';
import { Suspense } from 'react';
import { LoadingState } from '@/components/uno/LoadingSpinner';
import { APP_ROUTES } from '@/lib/config/routes';
import * as Pages from '../pageRegistry';
import { PageTransition } from '../PageTransition';

const LazyPage = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingState />}>
    <PageTransition>{children}</PageTransition>
  </Suspense>
);

const PropertyProjectRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/property/offplan/${id}`} replace />;
};

const InvestIdRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/invest/${id}`} replace />;
};

// Property Hub index: legacy `/property?…` query bookmarks → /property/browse?…
const PropertyHubIndex = () => {
  const search = typeof window !== 'undefined' ? window.location.search : '';
  if (search && search.length > 1) {
    return <Navigate to={`${APP_ROUTES.PROPERTY_BROWSE}${search}`} replace />;
  }
  return <Pages.PropertyLanding />;
};

export const propertyHubRoutes = (
  <>
    <Route index element={<LazyPage><PropertyHubIndex /></LazyPage>} />
    <Route path="browse" element={<LazyPage><Pages.PropertyIndex /></LazyPage>} />
    <Route
      path="rent/short-term"
      element={<Navigate to={`${APP_ROUTES.PROPERTY_BROWSE}?mode=rent&tenancy=short`} replace />}
    />
    <Route
      path="rent/medium-term"
      element={<Navigate to={`${APP_ROUTES.PROPERTY_BROWSE}?mode=rent&tenancy=medium`} replace />}
    />
    <Route
      path="rent/long-term"
      element={<Navigate to={`${APP_ROUTES.PROPERTY_BROWSE}?mode=rent&tenancy=long`} replace />}
    />
    <Route
      path="quick-sale"
      element={<Navigate to={`${APP_ROUTES.PROPERTY_BROWSE}?mode=buy&intent=quick_sale`} replace />}
    />
    <Route path="search" element={<LazyPage><Pages.PropertySearchPage /></LazyPage>} />
    <Route path="consultation" element={<LazyPage><Pages.PropertyConsultation /></LazyPage>} />
    <Route path="deposit-success" element={<LazyPage><Pages.PropertyDepositSuccess /></LazyPage>} />
    <Route path="map" element={<LazyPage><Pages.PropertyMap /></LazyPage>} />
    {/* Legacy /property/project/:id → canonical /property/offplan/:id */}
    <Route path="project/:id" element={<PropertyProjectRedirect />} />

    {/* Off-Plan & Developers (moved from /offplan, /developers, /complexes) */}
    <Route path="offplan" element={<LazyPage><Pages.OffplanIndex /></LazyPage>} />
    <Route path="offplan/:id" element={<LazyPage><Pages.OffplanDetail /></LazyPage>} />
    <Route path="developers" element={<LazyPage><Pages.DevelopersIndex /></LazyPage>} />
    <Route path="developers/:id" element={<LazyPage><Pages.DeveloperDetail /></LazyPage>} />
    {/* Legacy /property/projects → canonical /property/offplan */}
    <Route path="projects" element={<Navigate to="/property/offplan" replace />} />

    {/* Resale / Secondary Market */}
    <Route path="resale" element={<LazyPage><Pages.ResaleIndex /></LazyPage>} />
    <Route path="resale/:id" element={<LazyPage><Pages.ResaleDetail /></LazyPage>} />

    {/* RE-first revenue engine — explainer + ClearView product landing */}
    <Route path="why-myuno" element={<LazyPage><Pages.WhyMyUno /></LazyPage>} />
    <Route path="clearview" element={<LazyPage><Pages.ClearViewLanding /></LazyPage>} />
    <Route path="clearview/apply" element={<LazyPage><Pages.ClearViewApplyPage /></LazyPage>} />

    {/* Commercial RE — persona-gated in nav, open via URL */}
    <Route path="commercial" element={<LazyPage><Pages.CommercialIndex /></LazyPage>} />
    <Route path="commercial/browse" element={<LazyPage><Pages.CommercialIndex /></LazyPage>} />
    <Route path="commercial/:id" element={<LazyPage><Pages.CommercialDetail /></LazyPage>} />

    {/* Land Plots — persona-gated in nav, open via URL */}
    <Route path="land" element={<LazyPage><Pages.LandIndex /></LazyPage>} />
    <Route path="land/browse" element={<LazyPage><Pages.LandIndex /></LazyPage>} />
    <Route path="land/:id" element={<LazyPage><Pages.LandDetail /></LazyPage>} />

    {/* Hotels — operational hospitality (uses CommercialDetail for individual listings) */}
    <Route path="hotels" element={<LazyPage><Pages.HotelsIndex /></LazyPage>} />
    <Route path="hotels/:id" element={<LazyPage><Pages.CommercialDetail /></LazyPage>} />

    {/* Legacy /property/invest/* → top-level /invest/* */}
    <Route path="invest" element={<Navigate to={APP_ROUTES.INVEST} replace />} />
    <Route path="invest/dashboard" element={<Navigate to={APP_ROUTES.INVEST_DASHBOARD} replace />} />
    <Route path="invest/raise" element={<Navigate to={APP_ROUTES.INVEST_RAISE} replace />} />
    <Route path="invest/market" element={<Navigate to={APP_ROUTES.INVEST_MARKET} replace />} />
    <Route path="invest/network" element={<Navigate to={APP_ROUTES.INVEST_NETWORK} replace />} />
    <Route path="invest/execution" element={<Navigate to={APP_ROUTES.INVEST_EXECUTION} replace />} />
    <Route path="invest/:id" element={<InvestIdRedirect />} />

    {/* My Property */}
    <Route path="my" element={<LazyPage><Pages.PropertyMySection /></LazyPage>} />

    {/* Property Detail (must be last — catches :id) */}
    <Route path=":id" element={<LazyPage><Pages.PropertyDetail /></LazyPage>} />
    <Route path=":id/inquiry" element={<LazyPage><Pages.PropertyInquiry /></LazyPage>} />
    <Route path="booking/manual-payment/:orderId" element={<LazyPage><Pages.ManualPaymentPending /></LazyPage>} />
  </>
);
