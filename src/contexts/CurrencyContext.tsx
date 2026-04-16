import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { createErrorHandler } from '@/lib/errorHandler';
import { CURRENCIES, getCurrencySymbol, type CurrencyCode } from '@/lib/config/currencies';

const errorLog = createErrorHandler('CurrencyContext');

// Subset of currencies supported for user display/conversion
export type Currency = 'THB' | 'USD' | 'EUR' | 'RUB';

interface CurrencyInfo {
  code: Currency;
  symbol: string;
  name: string;
  nameRu: string;
  rate: number;
  updatedAt?: string;
}

// Use canonical currency definitions from src/lib/config/currencies.ts
const currencyMeta: Record<Currency, Omit<CurrencyInfo, 'rate' | 'updatedAt'>> = {
  THB: { code: 'THB', symbol: CURRENCIES.THB.symbol, name: CURRENCIES.THB.nameEn, nameRu: CURRENCIES.THB.nameRu },
  USD: { code: 'USD', symbol: CURRENCIES.USD.symbol, name: CURRENCIES.USD.nameEn, nameRu: CURRENCIES.USD.nameRu },
  EUR: { code: 'EUR', symbol: CURRENCIES.EUR.symbol, name: CURRENCIES.EUR.nameEn, nameRu: CURRENCIES.EUR.nameRu },
  RUB: { code: 'RUB', symbol: CURRENCIES.RUB.symbol, name: CURRENCIES.RUB.nameEn, nameRu: CURRENCIES.RUB.nameRu },
};

// Fallback rates if DB fetch fails
const fallbackRates: Record<Currency, number> = {
  THB: 1,
  USD: 0.029,
  EUR: 0.027,
  RUB: 2.7,
};

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  currencyInfo: CurrencyInfo;
  currencies: Record<Currency, CurrencyInfo>;
  formatPrice: (priceInTHB: number, showSymbol?: boolean) => string;
  convertPrice: (priceInTHB: number) => number;
  getCurrencySymbol: (code: string) => string;
  isLoading: boolean;
  lastUpdated: string | null;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    const saved = localStorage.getItem('myuno-currency');
    return saved === 'THB' || saved === 'USD' || saved === 'EUR' || saved === 'RUB'
      ? saved
      : 'THB';
  });
  
  const [rates, setRates] = useState<Record<Currency, number>>(fallbackRates);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load rates from database
  const loadRates = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_all_currency_rates');

      if (error) throw error;

      if (data && typeof data === 'object') {
        const ratesData = data as Record<string, { rate: number; updated_at: string }>;
        const newRates: Record<Currency, number> = { ...fallbackRates };
        let latestUpdate: string | null = null;

        Object.entries(ratesData).forEach(([code, info]) => {
          if (code in currencyMeta) {
            newRates[code as Currency] = info.rate;
            if (!latestUpdate || info.updated_at > latestUpdate) {
              latestUpdate = info.updated_at;
            }
          }
        });

        setRates(newRates);
        setLastUpdated(latestUpdate);
      }
    } catch (error) {
      errorLog.silent(error, 'load_currency_rates');
      // Keep using fallback rates
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadRates().then(() => {
      if (cancelled) return;
    });
    // Refresh rates every hour
    const interval = setInterval(loadRates, 60 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [loadRates]);

  useEffect(() => {
    localStorage.setItem('myuno-currency', currency);
  }, [currency]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== 'myuno-currency') return;
      const next = event.newValue;
      if (next === 'THB' || next === 'USD' || next === 'EUR' || next === 'RUB') {
        setCurrencyState(next);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const setCurrency = useCallback((newCurrency: Currency) => {
    setCurrencyState(newCurrency);
  }, []);

  // Build currencies object with current rates — memoize to avoid recreating every render
  const currencies = useMemo<Record<Currency, CurrencyInfo>>(() =>
    Object.entries(currencyMeta).reduce(
      (acc, [code, meta]) => ({
        ...acc,
        [code]: { ...meta, rate: rates[code as Currency] },
      }),
      {} as Record<Currency, CurrencyInfo>
    ), [rates]);

  const currencyInfo = currencies[currency];

  const convertPrice = useCallback((priceInTHB: number): number => {
    return Math.round(priceInTHB * currencyInfo.rate);
  }, [currencyInfo.rate]);

  const formatPrice = useCallback((priceInTHB: number, showSymbol = true): string => {
    const converted = Math.round(priceInTHB * currencyInfo.rate);
    return showSymbol
      ? `${currencyInfo.symbol}${converted.toLocaleString()}`
      : converted.toLocaleString();
  }, [currencyInfo.rate, currencyInfo.symbol]);

  const getCurrencySymbolFn = useCallback((code: string): string => {
    return getCurrencySymbol(code);
  }, []);

  const value = useMemo(() => ({
    currency, setCurrency, currencyInfo, currencies,
    formatPrice, convertPrice, getCurrencySymbol: getCurrencySymbolFn,
    isLoading, lastUpdated,
  }), [currency, setCurrency, currencyInfo, currencies, formatPrice, convertPrice,
       getCurrencySymbolFn, isLoading, lastUpdated]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}

// Re-export for backward compatibility
export { currencyMeta as currencies };
