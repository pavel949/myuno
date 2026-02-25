import { createContext, useContext, useState, type ReactNode } from 'react';

interface DashboardFilterContextValue {
  selectedPropertyId: string | null; // null = all properties
  setSelectedPropertyId: (id: string | null) => void;
}

const DashboardFilterContext = createContext<DashboardFilterContextValue>({
  selectedPropertyId: null,
  setSelectedPropertyId: () => {},
});

export function DashboardFilterProvider({ children }: { children: ReactNode }) {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  return (
    <DashboardFilterContext.Provider value={{ selectedPropertyId, setSelectedPropertyId }}>
      {children}
    </DashboardFilterContext.Provider>
  );
}

export function useDashboardFilter() {
  return useContext(DashboardFilterContext);
}
