import React, { createContext, useContext, useEffect, useCallback, useMemo, ReactNode } from 'react';

interface MaintenanceContextType {
  isMaintenanceMode: boolean;
  setMaintenanceMode: (enabled: boolean) => void;
  canBypass: boolean;
  isAdminRoute: boolean;
}

const MaintenanceContext = createContext<MaintenanceContextType | undefined>(undefined);

const MAINTENANCE_KEY = 'myuno_maintenance_mode';
const BYPASS_KEY = 'myuno_maintenance_bypass';
const SIMULATION_BYPASS_KEY = 'myuno_simulation_mode';

// Admin routes that should always bypass maintenance
const ADMIN_ROUTE_PREFIXES = ['/admin', '/owner', '/vendor', '/team'];

// Check if running in simulation mode (for Wave testing)
const isSimulationMode = () => {
  return localStorage.getItem(SIMULATION_BYPASS_KEY) === 'true' ||
         new URLSearchParams(window.location.search).get('simulation') === 'true';
};

// Check if running in Lovable preview environment
const isLovablePreview = () => {
  return window.location.hostname.includes('lovable.app') || 
         window.location.hostname.includes('lovable.dev') ||
         window.location.hostname === 'localhost';
};

export function MaintenanceProvider({ children }: { children: ReactNode }) {
  // Coming Soon / maintenance gate retired 2026-06-18 — site is fully public.
  // The provider stays mounted so legacy `useMaintenance()` callers keep working,
  // but the mode is hardcoded OFF and the setter is a no-op. Any stale
  // localStorage flags from earlier sessions are scrubbed once on mount.
  useEffect(() => {
    try {
      localStorage.removeItem(MAINTENANCE_KEY);
      localStorage.removeItem(BYPASS_KEY);
      localStorage.removeItem(SIMULATION_BYPASS_KEY);
    } catch { /* noop */ }
  }, []);

  const isAdminRoute = ADMIN_ROUTE_PREFIXES.some(prefix =>
    window.location.pathname.startsWith(prefix)
  );

  const setMaintenanceMode = useCallback((_enabled: boolean) => {
    // No-op: maintenance gate is permanently disabled.
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn('[MaintenanceContext] setMaintenanceMode is a no-op — gate retired.');
    }
  }, []);

  const value = useMemo(() => ({
    isMaintenanceMode: false,
    setMaintenanceMode,
    canBypass: true,
    isAdminRoute,
  }), [setMaintenanceMode, isAdminRoute]);

  // Suppress unused-var warnings for legacy helpers kept for reference.
  void isSimulationMode; void isLovablePreview;

  return (
    <MaintenanceContext.Provider value={value}>
      {children}
    </MaintenanceContext.Provider>
  );
}

export function useMaintenance() {
  const context = useContext(MaintenanceContext);
  if (context === undefined) {
    throw new Error('useMaintenance must be used within a MaintenanceProvider');
  }
  return context;
}
