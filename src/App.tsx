/**
 * @module App
 * @description Root application component for myUNO SuperApp.
 *
 * Uses composeProviders to flatten the provider tree for better readability
 * and marginally improved re-render performance.
 *
 * @see docs/ARCHITECTURE.md for full architecture overview
 */
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
import { UnderConstruction } from "@/components/maintenance/UnderConstruction";
import { PWAUpdatePrompt } from "@/components/pwa/PWAUpdatePrompt";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { composeProviders } from "@/lib/composeProviders";

const queryClient = new QueryClient({
  defaultOptions: defaultQueryClientOptions,
});

// ── Composed provider tree ──
// Order matters: each provider can use contexts from providers above it.
// QueryClientProvider wraps everything that needs react-query.
const QueryProviders = composeProviders([
  ThemeProvider,
  MaintenanceProvider,
  LanguageProvider,
  LocationProvider,
  CurrencyProvider,
  AuthProvider,
  CartProvider,
  PWAInstallProvider,
  LifeSituationProvider,
  StorefrontProvider,
  GoogleMapsProvider,
  TooltipProvider,
  HintProvider,
  PrefetchProvider,
]);

/** Gate that shows Coming Soon for unauthenticated users (except /auth routes). Set VITE_BYPASS_COMING_SOON=true to test app without login. */
function ComingSoonGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const bypassComingSoon = import.meta.env.VITE_BYPASS_COMING_SOON === 'true';

  // Allow auth and public marketing routes through
  const isPublicRoute = location.pathname.startsWith('/auth')
    || location.pathname.startsWith('/for-management-companies')
    || location.pathname.startsWith('/vendor/join')
    || location.pathname.startsWith('/vendor/onboarding')
    || location.pathname.startsWith('/ref/')
    || location.pathname.startsWith('/newbuilds')
    || location.pathname.startsWith('/capital');

  if (bypassComingSoon || isPublicRoute || isLoading) return <>{children}</>;
  if (!user) return <UnderConstruction />;
  return <>{children}</>;
}

// Inner component to use hooks
function AppContent() {
  useGlobalErrorHandler();
  const { isMaintenanceMode, canBypass } = useMaintenance();
  
  // Show maintenance page if enabled and user can't bypass
  if (isMaintenanceMode && !canBypass) {
    return <UnderConstruction />;
  }
  
    return (
      <>
        <SkipToContent />
        <Sonner />
        <PWAUpdatePrompt />
        <LegalComplianceModal />
        <BrowserRouter>
          <ComingSoonGate>
            <AnimatedRoutes />
            <UnifiedChatFAB />
            
            <CookieConsentBanner />
          </ComingSoonGate>
        </BrowserRouter>
      </>
    );
}

const App = () => (
  <ErrorBoundary>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <QueryProviders>
          <AppContent />
        </QueryProviders>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
