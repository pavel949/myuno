// Application-wide constants to eliminate magic strings

export const STORAGE_KEYS = {
  CART: 'uno-cart',
  LANGUAGE: 'uno-language',
  CURRENCY: 'uno-currency',
  THEME: 'uno-theme',
  VIEW_HISTORY: 'uno-view-history',
  ONBOARDING_COMPLETED: 'uno-onboarding-completed',
  PIN_HASH: 'uno-pin-hash',
} as const;

export const CURRENCY = {
  DEFAULT: 'THB',
  SYMBOLS: {
    THB: '฿',
    USD: '$',
    EUR: '€',
    RUB: '₽',
    GBP: '£',
  },
} as const;

export const LANGUAGE = {
  DEFAULT: 'en',
  OPTIONS: ['en', 'ru'] as const,
} as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
} as const;

export const API = {
  DEFAULT_TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 6,
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 1000,
  PHONE_REGEX: /^\+?[\d\s-()]+$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  VENDOR: 'vendor',
  STAFF: 'staff',
  OWNER: 'owner',
  USER: 'user',
} as const;

export const DISTRICTS = [
  'Patong',
  'Kata',
  'Karon',
  'Kamala',
  'Surin',
  'Bang Tao',
  'Rawai',
  'Chalong',
  'Phuket Town',
  'Cherng Talay',
] as const;

export const CASHBACK = {
  DEFAULT_PERCENTAGE: 5,
  MAX_PERCENTAGE: 20,
} as const;
