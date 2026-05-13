/**
 * @module App
 * @description Root application component for myUNO SuperApp.
 *
 * Uses composeProviders to flatten the provider tree for better readability
 * and marginally improved re-render performance.
 *
 * @see docs/ARCHITECTURE.md for full architecture overview
 */
import React from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SkipToContent } from "@/components/a11y/SkipToContent";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { LocationProvider } from "@/contexts/LocationContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ImpersonationProvider } from "@/contexts/ImpersonationContext";
import { PlatformViewAsProvider } from "@/contexts/PlatformViewAsContext";
import { CartProvider } from "@/contexts/CartContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { MaintenanceProvider, useMaintenance } from "@/contexts/MaintenanceContext";
import { PWAInstallProvider } from "@/contexts/PWAInstallContext";
import { LifeSituationProvider } from "@/contexts/LifeSituationContext";
import { AnimatedRoutes } from "@/components/layout/AnimatedRoutes";
import { UnifiedChatFAB } from "@/components/chat/UnifiedChatFAB";

import { CookieConsentBanner } from "@/components/legal/CookieConsentBanner";
import { LegalComplianceModal } from "@/components/legal/LegalComplianceModal";
import { ErrorBoundary, useGlobalErrorHandler } from "@/components/ErrorBoundary";
import { PrefetchProvider } from "@/components/providers/PrefetchProvider";
import { StorefrontProvider } from "@/contexts/StorefrontContext";
import { GoogleMapsProvider } from "@/contexts/GoogleMapsContext";
import { defaultQueryClientOptions } from "@/lib/queryConfig";
import { HintProvider } from "@/components/hints/HintProvider";
import { AuthSheetProvider } from "@/contexts/AuthSheetContext";
import { UnderConstruction } from "@/components/maintenance/UnderConstruction";
import { PWAUpdatePrompt } from "@/components/pwa/PWAUpdatePrompt";
import { VersionWatcher } from "@/components/pwa/VersionWatcher";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { composeProviders } from "@/lib/composeProviders";
import { useEnsureMultiRoleQaBundle } from "@/hooks/useEnsureMultiRoleQaBundle";
import { PlatformViewAsBanner } from "@/components/layout/PlatformViewAsBanner";
import { LanguageProfileHydrate } from "@/components/providers/LanguageProfileHydrate";

const queryClient = new QueryClient({
  defaultOptions: defaultQueryClientOptions,
});

// ── Composed provider tree ──
// Order matters: each provider can use contexts from providers above it.
// Critical providers needed for first paint (auth, theme, language, currency,
// query) wrap the whole app; non-critical ones (maps, storefront, hints,
// install prompt, life-situation) are mounted via DeferredProviders after
// first paint to keep TTI low.
const QueryProviders = composeProviders([
  ThemeProvider,
  MaintenanceProvider,
  LanguageProvider,
  LocationProvider,
  CurrencyProvider,
  AuthProvider,
  ImpersonationProvider,
  PlatformViewAsProvider,
  CartProvider,
  // PWAInstallProvider stays eager: CompactFooter (rendered on every page)
  // calls usePWAInstallContext synchronously on mount.
  PWAInstallProvider,
  TooltipProvider,
  PrefetchProvider,
  AuthSheetProvider,
]);

const DeferredProviders = composeProviders([
  LifeSituationProvider,
  StorefrontProvider,
  GoogleMapsProvider,
  HintProvider,
]);

/**
 * Mounts secondary providers after first paint. Until then, children render
 * inside null-context fallbacks (each provider's `useX()` hook handles the
 * undefined-context case). Cuts ~5 wrappers and several module evaluations
 * out of the initial render path.
 */
function DeferredProvidersGate({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    // Wait one paint frame so the initial Index render commits before we
    // evaluate ~5 extra provider modules (GoogleMaps loader, etc.). All
    // routes that consume these providers are lazy-loaded — their chunks
    // can't arrive sooner than the next frame, so the gap is invisible.
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!mounted) return <>{children}</>;
  return <DeferredProviders>{children}</DeferredProviders>;
}

/** Gate that shows Coming Soon for unauthenticated users (except /auth routes). Set VITE_BYPASS_COMING_SOON=true to test app without login. */
function ComingSoonGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  // Production gate: only authenticated users + explicitly public marketing routes pass through.
  // To temporarily disable while testing locally, set VITE_BYPASS_COMING_SOON=true in .env.
  const bypassComingSoon = import.meta.env.VITE_BYPASS_COMING_SOON === 'true';

  // Allow auth and public marketing routes through
  const isPublicRoute = location.pathname.startsWith('/auth')
    || location.pathname.startsWith('/reset-password')
    || location.pathname.startsWith('/legal')
    || location.pathname.startsWith('/for-management-companies')
    || location.pathname.startsWith('/vendor/join')
    || location.pathname.startsWith('/vendor/onboarding')
    || location.pathname.startsWith('/developer-portal/apply')
    || location.pathname.startsWith('/ref/')
    || location.pathname.startsWith('/newbuilds')
    || location.pathname.startsWith('/capital')
    || location.pathname.startsWith('/clearview')
    || location.pathname === '/invest/capital-advisory'
    || location.pathname === '/invest/calculator'
    || location.pathname === '/property/resale-landing'
    || location.pathname === '/owner/management-landing'
    || location.pathname === '/owner/storefront-demo'
    || location.pathname === '/legal/tax-structuring'
    || location.pathname.startsWith('/for/')
    || location.pathname === '/for'
    || location.pathname.startsWith('/cluster/')
    || location.pathname.startsWith('/area/')
    || location.pathname === '/area';

  if (bypassComingSoon || isPublicRoute || isLoading) return <>{children}</>;
  if (!user) return <UnderConstruction />;
  return <>{children}</>;
}

// Inner component to use hooks
function AppContent() {
  useGlobalErrorHandler();
  useEnsureMultiRoleQaBundle();
  const { isMaintenanceMode, canBypass } = useMaintenance();
  
  // Show maintenance page if enabled and user can't bypass
  if (isMaintenanceMode && !canBypass) {
    return <UnderConstruction />;
  }
  
    return (
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <LanguageProfileHydrate />
        <SkipToContent />
        <PlatformViewAsBanner />
        <Sonner />
        <PWAUpdatePrompt />
        <VersionWatcher />
        <LegalComplianceModal />
        <BrowserRouter>
          <ComingSoonGate>
            <main
              id="main-content"
              tabIndex={-1}
              className="flex min-h-0 min-w-0 flex-1 flex-col outline-none focus:outline-none"
            >
              <AnimatedRoutes />
            </main>
            <UnifiedChatFAB />
            <CookieConsentBanner />
          </ComingSoonGate>
        </BrowserRouter>
      </div>
    );
}

const App = () => (
  <ErrorBoundary>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <QueryProviders>
          <DeferredProvidersGate>
            <AppContent />
          </DeferredProvidersGate>
        </QueryProviders>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
