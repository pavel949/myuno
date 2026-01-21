/**
 * @module OrderUtils
 * @description Utility functions for order display and formatting
 */

import { format, formatDistanceToNow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import type { OrderStatus, OrderType } from '@/types/orders';

/**
 * Format order date for display
 * @param date - ISO date string or Date object
 * @param language - Language code ('en' or 'ru')
 * @param includeTime - Whether to include time
 */
export function formatOrderDate(
  date: string | Date,
  language: string = 'en',
  includeTime: boolean = true
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const locale = language === 'ru' ? ru : enUS;
  const pattern = includeTime ? 'dd MMM yyyy, HH:mm' : 'dd MMM yyyy';
  return format(d, pattern, { locale });
}

/**
 * Get relative time for order (e.g., "2 hours ago")
 * @param date - ISO date string
 * @param language - Language code
 */
export function getOrderRelativeTime(date: string, language: string = 'en'): string {
  return formatDistanceToNow(new Date(date), {
    addSuffix: true,
    locale: language === 'ru' ? ru : enUS,
  });
}

/**
 * Format currency amount
 * @param amount - Numeric amount
 * @param currency - Currency code (THB, USD, etc.)
 * @param locale - Locale for number formatting
 */
export function formatAmount(
  amount: number,
  currency: string = 'THB',
  locale: string = 'en-US'
): string {
  // For THB, use simpler formatting
  if (currency === 'THB') {
    return `฿${amount.toLocaleString(locale)}`;
  }
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Get human-readable order type label
 * @param orderType - Order type enum value
 * @param language - Language code
 */
export function getOrderTypeLabel(orderType: OrderType, language: string = 'en'): string {
  const labels: Record<OrderType, { en: string; ru: string }> = {
    service: { en: 'Service', ru: 'Услуга' },
    tour: { en: 'Tour', ru: 'Тур' },
    property: { en: 'Property Rental', ru: 'Аренда жилья' },
    yacht: { en: 'Yacht Charter', ru: 'Аренда яхты' },
    vehicle: { en: 'Vehicle Rental', ru: 'Аренда авто' },
    event: { en: 'Event', ru: 'Мероприятие' },
    activity: { en: 'Activity', ru: 'Активность' },
    beauty: { en: 'Beauty & Spa', ru: 'Красота и спа' },
    cleaning: { en: 'Cleaning', ru: 'Уборка' },
    babysitter: { en: 'Babysitter', ru: 'Няня' },
    education: { en: 'Education', ru: 'Обучение' },
    medical: { en: 'Medical', ru: 'Медицина' },
    legal: { en: 'Legal Services', ru: 'Юридические услуги' },
    pet_service: { en: 'Pet Service', ru: 'Услуги для питомцев' },
    flowers: { en: 'Flowers', ru: 'Цветы' },
    food: { en: 'Food & Dining', ru: 'Еда и рестораны' },
    mixed: { en: 'Mixed Order', ru: 'Смешанный заказ' },
  };
  
  return labels[orderType]?.[language as 'en' | 'ru'] || orderType;
}

/**
 * Get status color classes for styling
 * @param status - Order status
 */
export function getStatusColorClasses(status: OrderStatus): {
  bg: string;
  text: string;
  border: string;
} {
  const colors: Record<OrderStatus, { bg: string; text: string; border: string }> = {
    draft: { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-muted' },
    pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-600', border: 'border-yellow-500/30' },
    confirmed: { bg: 'bg-blue-500/20', text: 'text-blue-600', border: 'border-blue-500/30' },
    in_progress: { bg: 'bg-purple-500/20', text: 'text-purple-600', border: 'border-purple-500/30' },
    completed: { bg: 'bg-green-500/20', text: 'text-green-600', border: 'border-green-500/30' },
    cancelled: { bg: 'bg-red-500/20', text: 'text-red-600', border: 'border-red-500/30' },
    refunded: { bg: 'bg-orange-500/20', text: 'text-orange-600', border: 'border-orange-500/30' },
    disputed: { bg: 'bg-red-500/20', text: 'text-red-600', border: 'border-red-500/30' },
  };
  
  return colors[status] || colors.pending;
}

/**
 * Check if an order can be cancelled
 * @param status - Current order status
 */
export function canCancelOrder(status: OrderStatus): boolean {
  return ['draft', 'pending', 'confirmed'].includes(status);
}

/**
 * Check if an order can be modified
 * @param status - Current order status
 */
export function canModifyOrder(status: OrderStatus): boolean {
  return ['draft', 'pending'].includes(status);
}

/**
 * Generate a short order ID for display
 * @param orderId - Full UUID
 */
export function getShortOrderId(orderId: string): string {
  return orderId.slice(0, 8).toUpperCase();
}
