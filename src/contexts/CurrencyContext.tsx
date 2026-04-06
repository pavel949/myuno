import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
    return (saved as Currency) || 'THB';
  });
  
  const [rates, setRates] = useState<Record<Currency, number>>(fallbackRates);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load rates from database with proper cancellation
  useEffect(() => {
    let cancelled = false;

    const doLoad = async () => {
      try {
        const { data, error } = await supabase.rpc('get_all_currency_rates');
        if (cancelled) return;
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
        if (!cancelled) errorLog.silent(error, 'load_currency_rates');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    doLoad();
    const interval = setInterval(doLoad, 60 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('myuno-currency', currency);
  }, [currency]);

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
  };

  // Build currencies object with current rates
  const currencies: Record<Currency, CurrencyInfo> = Object.entries(currencyMeta).reduce(
    (acc, [code, meta]) => ({
      ...acc,
      [code]: { ...meta, rate: rates[code as Currency] },
    }),
    {} as Record<Currency, CurrencyInfo>
  );

  const currencyInfo = currencies[currency];

  const convertPrice = (priceInTHB: number): number => {
    return Math.round(priceInTHB * currencyInfo.rate);
  };

  const formatPrice = (priceInTHB: number, showSymbol = true): string => {
    const converted = convertPrice(priceInTHB);
    return showSymbol 
      ? `${currencyInfo.symbol}${converted.toLocaleString()}`
      : converted.toLocaleString();
  };

  // Utility to get currency symbol by code (for UI components)
  // Use canonical getCurrencySymbol from currencies.ts
  const getCurrencySymbolFn = (code: string): string => {
    return getCurrencySymbol(code);
  };

  return (
    <CurrencyContext.Provider value={{ 
      currency, 
      setCurrency, 
      currencyInfo, 
      currencies,
      formatPrice, 
      convertPrice,
      getCurrencySymbol: getCurrencySymbolFn,
      isLoading,
      lastUpdated,
    }}>
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
