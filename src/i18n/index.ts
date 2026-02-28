/**
 * @module i18n
 * @description Centralized translation exports
 * 
 * Static translations split by language for maintainability.
 * LanguageContext imports from here instead of inlining 1300+ lines.
 */
import { ru } from './ru';
import { en } from './en';
import { th } from './th';

export type Language = 'ru' | 'en' | 'th';

export const translations: Record<Language, Record<string, string>> = {
  ru,
  en,
  th,
};
