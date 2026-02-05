import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface MaintenanceContextType {
  isMaintenanceMode: boolean;
  setMaintenanceMode: (enabled: boolean) => void;
  canBypass: boolean;
}

const MaintenanceContext = createContext<MaintenanceContextType | undefined>(undefined);

const MAINTENANCE_KEY = 'myuno_maintenance_mode';
const BYPASS_KEY = 'myuno_maintenance_bypass';

export function MaintenanceProvider({ children }: { children: ReactNode }) {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(() => {
    // Check localStorage for maintenance mode state, default to TRUE (Coming Soon)
    const stored = localStorage.getItem(MAINTENANCE_KEY);
    // If never set, default to maintenance mode ON
    return stored === null ? true : stored === 'true';
  });

  const [canBypass, setCanBypass] = useState(() => {
    // Admin can bypass with special key
    return localStorage.getItem(BYPASS_KEY) === 'true';
  });

  useEffect(() => {
    localStorage.setItem(MAINTENANCE_KEY, String(isMaintenanceMode));
  }, [isMaintenanceMode]);

  const setMaintenanceMode = (enabled: boolean) => {
    setIsMaintenanceMode(enabled);
    // When enabling maintenance mode, automatically grant bypass to current user
    if (enabled) {
      localStorage.setItem(BYPASS_KEY, 'true');
      setCanBypass(true);
    }
  };

  return (
    <MaintenanceContext.Provider value={{ isMaintenanceMode, setMaintenanceMode, canBypass }}>
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
