import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Currency = 'THB' | 'USD' | 'EUR' | 'RUB';

interface CurrencyInfo {
  code: Currency;
  symbol: string;
  name: string;
  nameRu: string;
  rate: number; // Rate relative to THB
}

// Exchange rates relative to THB (as of January 2026)
// To convert: priceInTHB * rate = priceInTargetCurrency
// Example: 1000 THB * 0.029 = 29 USD
export const currencies: Record<Currency, CurrencyInfo> = {
  THB: { code: 'THB', symbol: '฿', name: 'Thai Baht', nameRu: 'Тайский бат', rate: 1 },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', nameRu: 'Доллар США', rate: 0.029 },    // 1 USD ≈ 34 THB
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', nameRu: 'Евро', rate: 0.027 },              // 1 EUR ≈ 37 THB
  RUB: { code: 'RUB', symbol: '₽', name: 'Russian Ruble', nameRu: 'Российский рубль', rate: 2.7 }, // 1 THB ≈ 2.7 RUB
};

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  currencyInfo: CurrencyInfo;
  formatPrice: (priceInTHB: number) => string;
  convertPrice: (priceInTHB: number) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    const saved = localStorage.getItem('myuno-currency');
    return (saved as Currency) || 'THB';
  });

  useEffect(() => {
    localStorage.setItem('myuno-currency', currency);
  }, [currency]);

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
  };

  const currencyInfo = currencies[currency];

  const convertPrice = (priceInTHB: number): number => {
    return Math.round(priceInTHB * currencyInfo.rate);
  };

  const formatPrice = (priceInTHB: number): string => {
    const converted = convertPrice(priceInTHB);
    return `${currencyInfo.symbol}${converted.toLocaleString()}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, currencyInfo, formatPrice, convertPrice }}>
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
