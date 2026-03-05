/**
 * @module App
 * @description Root application component for myUNO SuperApp.
 *
 * Provider tree (order matters — each provider can use contexts above it):
 * ErrorBoundary → HelmetProvider → QueryClientProvider → ThemeProvider →
 * MaintenanceProvider → LanguageProvider → LocationProvider → CurrencyProvider →
 * AuthProvider → CartProvider → PWAInstallProvider → LifeSituationProvider →
 * TooltipProvider → HintProvider → PrefetchProvider → AppContent
 *
 * @see docs/ARCHITECTURE.md for full architecture overview
 */
import { Toaster } from "@/components/ui/toaster";
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
import { defaultQueryClientOptions } from "@/lib/queryConfig";
import { HintProvider } from "@/components/hints/HintProvider";
import { UnderConstruction } from "@/components/maintenance/UnderConstruction";
import { PWAUpdatePrompt } from "@/components/pwa/PWAUpdatePrompt";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";

const queryClient = new QueryClient({
  defaultOptions: defaultQueryClientOptions,
});

/** Gate that shows Coming Soon for unauthenticated users (except /auth routes) */
function ComingSoonGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Allow auth-related routes through
  const isAuthRoute = location.pathname.startsWith('/auth');

  if (isAuthRoute || isLoading) return <>{children}</>;
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
        <Toaster />
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
        <ThemeProvider>
          <MaintenanceProvider>
            <LanguageProvider>
              <LocationProvider>
                <CurrencyProvider>
                  <AuthProvider>
                    <CartProvider>
                      <PWAInstallProvider>
                        <LifeSituationProvider>
                          <StorefrontProvider>
                            <TooltipProvider>
                              <HintProvider>
                                <PrefetchProvider>
                                  <AppContent />
                                </PrefetchProvider>
                              </HintProvider>
                            </TooltipProvider>
                          </StorefrontProvider>
                        </LifeSituationProvider>
                      </PWAInstallProvider>
                    </CartProvider>
                  </AuthProvider>
                </CurrencyProvider>
              </LocationProvider>
            </LanguageProvider>
          </MaintenanceProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
