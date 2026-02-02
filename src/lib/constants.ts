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

// Extended booking statuses for reliable booking flow
export const BOOKING_STATUS = {
  PENDING: 'pending',
  PENDING_DEPOSIT: 'pending_deposit',
  DEPOSIT_PAID: 'deposit_paid',
  CONFIRMED: 'confirmed',
  CHECKED_IN: 'checked_in',
  CHECKED_OUT: 'checked_out',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  CANCELLED_BY_GUEST: 'cancelled_by_guest',
  CANCELLED_BY_HOST: 'cancelled_by_host',
  NO_SHOW: 'no_show',
} as const;

// Airbnb-style cancellation policies
export const CANCELLATION_POLICY = {
  FLEXIBLE: 'flexible',
  MODERATE: 'moderate',
  STRICT: 'strict',
  SUPER_STRICT: 'super_strict',
  NON_REFUNDABLE: 'non_refundable',
} as const;

// Cancellation policy details for UI display
export const CANCELLATION_POLICY_DETAILS = {
  flexible: {
    nameEn: 'Flexible',
    nameRu: 'Гибкая',
    descEn: 'Full refund up to 24 hours before check-in',
    descRu: 'Полный возврат до 24 часов перед заездом',
    fullRefundHours: 24,
    partialRefundPercent: 0,
    color: 'green',
  },
  moderate: {
    nameEn: 'Moderate',
    nameRu: 'Умеренная',
    descEn: 'Full refund up to 5 days before check-in, 50% up to 24h',
    descRu: 'Полный возврат до 5 дней перед заездом, 50% до 24ч',
    fullRefundHours: 120,
    partialRefundPercent: 50,
    color: 'yellow',
  },
  strict: {
    nameEn: 'Strict',
    nameRu: 'Строгая',
    descEn: '50% refund up to 7 days before check-in, no refund after',
    descRu: '50% возврат до 7 дней перед заездом, далее без возврата',
    fullRefundHours: 168,
    partialRefundPercent: 0,
    color: 'orange',
  },
  super_strict: {
    nameEn: 'Super Strict',
    nameRu: 'Очень строгая',
    descEn: '50% refund up to 30 days before check-in, no refund after',
    descRu: '50% возврат до 30 дней перед заездом, далее без возврата',
    fullRefundHours: 720,
    partialRefundPercent: 0,
    color: 'red',
  },
  non_refundable: {
    nameEn: 'Non-refundable',
    nameRu: 'Невозвратная',
    descEn: 'No refund, but 10% discount on booking',
    descRu: 'Без возврата, но скидка 10% на бронирование',
    fullRefundHours: 0,
    partialRefundPercent: 0,
    discount: 10,
    color: 'destructive',
  },
} as const;

export const REFUND_STATUS = {
  PENDING: 'pending',
  PROCESSED: 'processed',
  DECLINED: 'declined',
  PARTIAL: 'partial',
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

// DISTRICTS removed - use PHUKET_DISTRICTS from src/lib/propertyTaxonomy.ts instead
// This prevents data inconsistency between forms and filters

export const CASHBACK = {
  DEFAULT_PERCENTAGE: 5,
  MAX_PERCENTAGE: 20,
} as const;

export const OWNER_COMMISSION = {
  SELF_MANAGEMENT: {
    rate: 10,
    labelEn: '10%',
    labelRu: '10%',
    descEn: 'on bookings via myUNO',
    descRu: 'с бронирований через myUNO',
    toolsFreeEn: 'Free tools',
    toolsFreeRu: 'Бесплатные инструменты',
  },
  FULL_MANAGEMENT: {
    ownerShare: 70,
    platformShare: 30,
    labelEn: '70/30',
    labelRu: '70/30',
    descEn: 'to you after expenses',
    descRu: 'вам после расходов',
  },
  CHANNEL_MANAGER: {
    basic: 5,
    premium: 10,
  },
} as const;
