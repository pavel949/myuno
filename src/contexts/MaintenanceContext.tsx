import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

interface MaintenanceContextType {
  isMaintenanceMode: boolean;
  setMaintenanceMode: (enabled: boolean) => void;
  canBypass: boolean;
  isAdminRoute: boolean;
}

const MaintenanceContext = createContext<MaintenanceContextType | undefined>(undefined);

const MAINTENANCE_KEY = 'myuno_maintenance_mode';
const BYPASS_KEY = 'myuno_maintenance_bypass';

// Admin routes that should always bypass maintenance
const ADMIN_ROUTE_PREFIXES = ['/admin', '/owner', '/vendor', '/team'];

export function MaintenanceProvider({ children }: { children: ReactNode }) {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(() => {
    const stored = localStorage.getItem(MAINTENANCE_KEY);
    return stored === null ? true : stored === 'true';
  });

  const [canBypass, setCanBypass] = useState(() => {
    // Check localStorage OR query param for bypass
    const urlParams = new URLSearchParams(window.location.search);
    const hasQueryBypass = urlParams.get('admin') === 'true';
    const hasStoredBypass = localStorage.getItem(BYPASS_KEY) === 'true';
    
    // If query param exists, persist it
    if (hasQueryBypass && !hasStoredBypass) {
      localStorage.setItem(BYPASS_KEY, 'true');
    }
    
    return hasQueryBypass || hasStoredBypass;
  });

  // Check if current route is an admin route (always bypass)
  const isAdminRoute = ADMIN_ROUTE_PREFIXES.some(prefix => 
    window.location.pathname.startsWith(prefix)
  );

  useEffect(() => {
    localStorage.setItem(MAINTENANCE_KEY, String(isMaintenanceMode));
  }, [isMaintenanceMode]);

  // Persist bypass when navigating to admin routes
  useEffect(() => {
    if (isAdminRoute && !canBypass) {
      localStorage.setItem(BYPASS_KEY, 'true');
      setCanBypass(true);
    }
  }, [isAdminRoute, canBypass]);

  const setMaintenanceMode = (enabled: boolean) => {
    setIsMaintenanceMode(enabled);
    // When enabling maintenance mode, automatically grant bypass to current user
    if (enabled) {
      localStorage.setItem(BYPASS_KEY, 'true');
      setCanBypass(true);
    }
  };

  // Effective bypass: can bypass OR is on admin route
  const effectiveBypass = canBypass || isAdminRoute;

  return (
    <MaintenanceContext.Provider value={{ 
      isMaintenanceMode, 
      setMaintenanceMode, 
      canBypass: effectiveBypass,
      isAdminRoute 
    }}>
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
