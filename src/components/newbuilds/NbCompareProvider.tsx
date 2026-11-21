import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

export const MAX_NEWBUILD_COMPARISON = 3;
const STORAGE_KEY = 'myuno_compare_newbuilds';
interface CompareIdentity { id: string }
interface NbCompareContextType {
  items: CompareIdentity[];
  add: (project: CompareIdentity) => void;
  remove: (id: string) => void;
  clear: () => void;
  isInCompare: (id: string) => boolean;
}

const NbCompareContext = createContext<NbCompareContextType | null>(null);

export function useOptionalNbCompare() {
  return useContext(NbCompareContext);
}

export function useNbCompare() {
  const context = useOptionalNbCompare();
  if (!context) throw new Error('useNbCompare must be used within NbCompareProvider');
  return context;
}

export function NbCompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CompareIdentity[]>(() => {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
      if (!Array.isArray(stored)) return [];
      const identities = new Set<string>();
      for (const item of stored) {
        if (item && typeof item.id === 'string' && item.id.trim() && item.id.length <= 128) identities.add(item.id);
        if (identities.size === MAX_NEWBUILD_COMPARISON) break;
      }
      return [...identities].map(id => ({ id }));
    } catch { return []; }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }
    catch { /* Comparison continues in memory when storage is unavailable. */ }
  }, [items]);

  const add = useCallback(({ id }: CompareIdentity) => {
    setItems(prev => !id || prev.some(p => p.id === id) || prev.length >= MAX_NEWBUILD_COMPARISON ? prev : [...prev, { id }]);
  }, []);
  const remove = useCallback((id: string) => setItems(prev => prev.filter(p => p.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);
  const isInCompare = useCallback((id: string) => items.some(p => p.id === id), [items]);

  return <NbCompareContext.Provider value={{ items, add, remove, clear, isInCompare }}>{children}</NbCompareContext.Provider>;
}
