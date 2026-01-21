/**
 * Centralized order total calculation utility
 * Uses database function for consistent fee calculation across frontend and backend
 */

import { supabase } from '@/integrations/supabase/client';

export interface OrderTotals {
  baseAmount: number;
  commissionRate: number;
  platformFee: number;
  vendorAmount: number;
  serviceFee: number;
  totalCustomerPays: number;
}

/**
 * Calculate order totals using the database function for consistency
 * This ensures frontend and backend use the same calculation logic
 */
export async function calculateOrderTotals(
  baseAmount: number,
  vertical: string = 'service',
  providerId?: string,
  productId?: string
): Promise<OrderTotals> {
  try {
    const { data, error } = await supabase.rpc('calculate_order_totals', {
      p_base_amount: baseAmount,
      p_vertical: vertical,
      p_provider_id: providerId || null,
      p_product_id: productId || null,
    });

    if (error) {
      console.error('Error calculating order totals:', error);
      // Fallback to simple calculation
      return fallbackCalculation(baseAmount);
    }

    const result = data as {
      base_amount: number;
      commission_rate: number;
      platform_fee: number;
      vendor_amount: number;
      service_fee: number;
      total_customer_pays: number;
    };

    return {
      baseAmount: result.base_amount,
      commissionRate: result.commission_rate,
      platformFee: result.platform_fee,
      vendorAmount: result.vendor_amount,
      serviceFee: result.service_fee,
      totalCustomerPays: result.total_customer_pays,
    };
  } catch (error) {
    console.error('Error in calculateOrderTotals:', error);
    return fallbackCalculation(baseAmount);
  }
}

/**
 * Fallback calculation when RPC is unavailable
 */
function fallbackCalculation(baseAmount: number): OrderTotals {
  const commissionRate = 0.10; // 10% default
  const platformFee = Math.round(baseAmount * commissionRate * 100) / 100;
  const vendorAmount = baseAmount - platformFee;
  
  return {
    baseAmount,
    commissionRate,
    platformFee,
    vendorAmount,
    serviceFee: 0,
    totalCustomerPays: baseAmount,
  };
}

/**
 * Calculate cashback for an order using database function
 */
export async function calculateCashback(
  orderId: string,
  category: string = 'default'
): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('calculate_order_cashback', {
      p_order_id: orderId,
      p_category: category,
    });

    if (error) {
      console.error('Error calculating cashback:', error);
      return 0;
    }

    return data || 0;
  } catch (error) {
    console.error('Error in calculateCashback:', error);
    return 0;
  }
}

/**
 * Format currency amount for display
 */
export function formatCurrency(
  amount: number,
  currency: string = 'THB',
  locale: string = 'ru-RU'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
