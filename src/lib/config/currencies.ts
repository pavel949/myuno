 /**
  * @module Currencies
  * @description Canonical currency definitions
  * 
  * This is the SINGLE SOURCE OF TRUTH for currency metadata.
  * All components must use these definitions instead of hardcoding symbols.
  */
 
 export interface CurrencyDefinition {
   code: string;
   symbol: string;
   flag: string;
   nameEn: string;
   nameRu: string;
   /** Number of decimal places (0 for THB, 2 for USD, etc.) */
   decimals: number;
   /** Thousand separator for this currency */
   thousandSep: string;
   /** Decimal separator for this currency */
   decimalSep: string;
 }
 
 export const CURRENCIES = {
   THB: {
     code: 'THB',
     symbol: '฿',
     flag: '🇹🇭',
     nameEn: 'Thai Baht',
     nameRu: 'Тайский бат',
     decimals: 0,
     thousandSep: ',',
     decimalSep: '.',
   },
   USD: {
     code: 'USD',
     symbol: '$',
     flag: '🇺🇸',
     nameEn: 'US Dollar',
     nameRu: 'Доллар США',
     decimals: 2,
     thousandSep: ',',
     decimalSep: '.',
   },
   EUR: {
     code: 'EUR',
     symbol: '€',
     flag: '🇪🇺',
     nameEn: 'Euro',
     nameRu: 'Евро',
     decimals: 2,
     thousandSep: ' ',
     decimalSep: ',',
   },
   RUB: {
     code: 'RUB',
     symbol: '₽',
     flag: '🇷🇺',
     nameEn: 'Russian Ruble',
     nameRu: 'Российский рубль',
     decimals: 0,
     thousandSep: ' ',
     decimalSep: ',',
   },
   GBP: {
     code: 'GBP',
     symbol: '£',
     flag: '🇬🇧',
     nameEn: 'British Pound',
     nameRu: 'Британский фунт',
     decimals: 2,
     thousandSep: ',',
     decimalSep: '.',
   },
 } as const;
 
 export type CurrencyCode = keyof typeof CURRENCIES;
 
 /** Default currency for the platform */
 export const DEFAULT_CURRENCY: CurrencyCode = 'THB';
 
 // Helper functions
 export function getCurrencyByCode(code: string): CurrencyDefinition | undefined {
   return CURRENCIES[code as CurrencyCode];
 }
 
 export function getCurrencySymbol(code: string): string {
   return getCurrencyByCode(code)?.symbol || code;
 }
 
 export function getAllCurrencyCodes(): CurrencyCode[] {
   return Object.keys(CURRENCIES) as CurrencyCode[];
 }
 
 export function formatCurrencyAmount(
   amount: number,
   currencyCode: string,
   showSymbol = true
 ): string {
   const currency = getCurrencyByCode(currencyCode);
   if (!currency) {
     return showSymbol ? `${currencyCode} ${amount.toLocaleString()}` : amount.toLocaleString();
   }
   
   const formatted = amount.toLocaleString('en-US', {
     minimumFractionDigits: currency.decimals,
     maximumFractionDigits: currency.decimals,
   });
   
   return showSymbol ? `${currency.symbol}${formatted}` : formatted;
 }