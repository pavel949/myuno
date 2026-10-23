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
import { CommandPaletteMount } from "@/components/command/CommandPaletteMount";
import { InstallAppButton } from "@/components/pwa/InstallAppButton";
import { OrganizationJsonLdHydrator } from "@/components/seo/OrganizationJsonLdHydrator";

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
// query) wrap the whole app. Secondary wrappers also stay stable from the
// first render so mounting their effects cannot remount the router.
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

/** Stable wrappers from first render keep AppContent/router state mounted.
 * Provider modules are already imported eagerly; expensive provider effects may
 * schedule their own work without inserting a new ancestor around the app.
 */
function DeferredProvidersGate({ children }: { children: React.ReactNode }) {
  return <DeferredProviders>{children}</DeferredProviders>;
}

// Coming Soon gate retired on 2026-06-18 — the site is fully public.
// Any old `myuno_bypass_coming_soon` / `myuno_maintenance_mode` localStorage
// entries left over from earlier sessions are scrubbed on first load below.
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('myuno_bypass_coming_soon');
    if (localStorage.getItem('myuno_maintenance_mode') === 'true') {
      localStorage.setItem('myuno_maintenance_mode', 'false');
    }
  } catch { /* noop */ }
}




// Inner component to use hooks
function AppContent() {
  useGlobalErrorHandler();
  useEnsureMultiRoleQaBundle();
  // Coming Soon / maintenance gate retired 2026-06-18 — site is fully public.
  // Toggle preserved in admin UI for emergency only (no-op at the context level).
  
  
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
          {/*
            Coming Soon gate retired 2026-06-18 — site is fully public.
            Outer wrapper acts as the SkipToContent target. It's a <div>, NOT a <main>,
            because NavShell renders the canonical <main> landmark for every route
            that uses AppLayout/MCLayout/etc. (a11y: only one <main> per page).
          */}
          <div
            id="main-content"
            tabIndex={-1}
            className="flex min-h-0 min-w-0 flex-1 flex-col outline-none focus:outline-none"
          >
            <AnimatedRoutes />
          </div>
          <UnifiedChatFAB />
          <CommandPaletteMount />
          <InstallAppButton />
          <CookieConsentBanner />
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
            <OrganizationJsonLdHydrator />
            <AppContent />
          </DeferredProvidersGate>
        </QueryProviders>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
