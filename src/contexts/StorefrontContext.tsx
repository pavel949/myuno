/**
 * @module StorefrontContext
 * @description Provides storefront context for private MC branded links (/b/:slug).
 * When active, catalogs filter to only show properties of that MC.
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface StorefrontData {
  id: string;
  company_id: string;
  slug: string;
  mode: 'private' | 'marketplace' | 'hybrid';
  allow_cross_sell: boolean;
  allowed_company_ids: string[] | null;
  brand: Record<string, any> | null;
  company_name_en?: string;
  company_name_ru?: string;
  company_logo?: string;
}

interface StorefrontContextType {
  storefront: StorefrontData | null;
  isStorefrontMode: boolean;
  isPrivateMode: boolean;
  setStorefront: (data: StorefrontData | null) => void;
  clearStorefront: () => void;
}

const StorefrontContext = createContext<StorefrontContextType>({
  storefront: null,
  isStorefrontMode: false,
  isPrivateMode: false,
  setStorefront: () => {},
  clearStorefront: () => {},
});

const STORAGE_KEY = 'myuno_storefront';

export function StorefrontProvider({ children }: { children: ReactNode }) {
  const [storefront, setStorefrontState] = useState<StorefrontData | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const setStorefront = (data: StorefrontData | null) => {
    setStorefrontState(data);
    if (data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const clearStorefront = () => setStorefront(null);

  const isStorefrontMode = !!storefront;
  const isPrivateMode = storefront?.mode === 'private';

  return (
    <StorefrontContext.Provider value={{ storefront, isStorefrontMode, isPrivateMode, setStorefront, clearStorefront }}>
      {children}
    </StorefrontContext.Provider>
  );
}

export function useStorefront() {
  return useContext(StorefrontContext);
}
