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
import { AnimatedRoutes } from "@/components/layout/AnimatedRoutes";
import { UnifiedChatFAB } from "@/components/chat/UnifiedChatFAB";
import { ErrorBoundary, useGlobalErrorHandler } from "@/components/ErrorBoundary";
import { PrefetchProvider } from "@/components/providers/PrefetchProvider";
import { defaultQueryClientOptions } from "@/lib/queryConfig";
import { HintProvider } from "@/components/hints/HintProvider";
import { UnderConstruction } from "@/components/maintenance/UnderConstruction";
import { PWAUpdatePrompt } from "@/components/pwa/PWAUpdatePrompt";

const queryClient = new QueryClient({
  defaultOptions: defaultQueryClientOptions,
});

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
      <BrowserRouter>
        <AnimatedRoutes />
        <UnifiedChatFAB />
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
                        <TooltipProvider>
                          <HintProvider>
                            <PrefetchProvider>
                              <AppContent />
                            </PrefetchProvider>
                          </HintProvider>
                        </TooltipProvider>
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
