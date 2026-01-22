import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { LocationProvider } from "@/contexts/LocationContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AnimatedRoutes } from "@/components/layout/AnimatedRoutes";
import { UnifiedChatFAB } from "@/components/chat/UnifiedChatFAB";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PrefetchProvider } from "@/components/providers/PrefetchProvider";
import { defaultQueryClientOptions } from "@/lib/queryConfig";

const queryClient = new QueryClient({
  defaultOptions: defaultQueryClientOptions,
});

const App = () => (
  <ErrorBoundary>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <LanguageProvider>
            <LocationProvider>
              <CurrencyProvider>
                <AuthProvider>
                  <CartProvider>
                    <TooltipProvider>
                      <PrefetchProvider>
                        <Toaster />
                        <Sonner />
                        <BrowserRouter>
                          <AnimatedRoutes />
                          <UnifiedChatFAB />
                        </BrowserRouter>
                      </PrefetchProvider>
                    </TooltipProvider>
                  </CartProvider>
                </AuthProvider>
              </CurrencyProvider>
            </LocationProvider>
          </LanguageProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
