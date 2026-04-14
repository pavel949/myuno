import { createContext, useContext, useState, useMemo, type ReactNode } from 'react';

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
  const value = useMemo(() => ({ selectedPropertyId, setSelectedPropertyId }), [selectedPropertyId]);
  return (
    <DashboardFilterContext.Provider value={value}>
      {children}
    </DashboardFilterContext.Provider>
  );
}

export function useDashboardFilter() {
  return useContext(DashboardFilterContext);
}
