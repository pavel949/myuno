import { useCallback, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProviderMinOrder {
  providerId: string;
  providerName: string;
  minOrderAmount: number;
  currency: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: {
    providerId: string;
    providerName: string;
    currentAmount: number;
    minAmount: number;
    currency: string;
    shortfall: number;
  }[];
}

interface CartItemForValidation {
  providerId?: string;
  providerName?: string;
  price: number;
  quantity: number;
  currency: string;
  type: string;
}

/**
 * Hook to validate minimum order amounts per provider
 */
export function useMinOrderValidation() {
  const { language } = useLanguage();
  const [providerMinOrders, setProviderMinOrders] = useState<Map<string, ProviderMinOrder>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  const t = useCallback((key: string, params?: Record<string, string | number>) => {
    const translations: Record<string, Record<string, string>> = {
      'minOrder.belowMinimum': { 
        en: 'Order from {provider} must be at least {currency} {amount}',
        ru: 'Заказ от {provider} должен быть минимум {currency} {amount}',
      },
      'minOrder.addMore': {
        en: 'Add {currency} {amount} more to checkout',
        ru: 'Добавьте ещё {currency} {amount} для оформления',
      },
    };
    let text = translations[key]?.[language] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  }, [language]);

  // Fetch minimum order amounts for specific providers
  const fetchMinOrderAmounts = useCallback(async (providerIds: string[]) => {
    if (providerIds.length === 0) return;
    
    setIsLoading(true);
    try {
      // Check flower_shops for min_order_amount
      const { data: flowerShops } = await supabase
        .from('flower_shops')
        .select('id, name_en, name_ru, min_order_amount')
        .in('provider_id', providerIds);

      // Check restaurants for min_order_amount (from listings)
      const { data: restaurants } = await supabase
        .from('listings')
        .select('id, name_en, name_ru, attributes')
        .eq('vertical', 'restaurant')
        .in('provider_id', providerIds);

      const newMinOrders = new Map<string, ProviderMinOrder>();

      flowerShops?.forEach(shop => {
        if (shop.min_order_amount && shop.min_order_amount > 0) {
          newMinOrders.set(shop.id, {
            providerId: shop.id,
            providerName: language === 'ru' ? shop.name_ru : shop.name_en,
            minOrderAmount: shop.min_order_amount,
            currency: 'THB',
          });
        }
      });

      restaurants?.forEach(restaurant => {
        const attrs = (restaurant.attributes || {}) as Record<string, any>;
        const minOrder = attrs.min_order_amount as number | undefined;
        if (minOrder && minOrder > 0) {
          newMinOrders.set(restaurant.id, {
            providerId: restaurant.id,
            providerName: language === 'ru' ? restaurant.name_ru : restaurant.name_en,
            minOrderAmount: minOrder,
            currency: 'THB',
          });
        }
      });

      setProviderMinOrders(newMinOrders);
    } catch { /* errors surfaced via empty state */ } finally {
      setIsLoading(false);
    }
  }, [language]);

  // Validate cart items against minimum order amounts
  const validateCart = useCallback((items: CartItemForValidation[]): ValidationResult => {
    // Group items by provider
    const providerTotals = new Map<string, { total: number; name: string; currency: string }>();
    
    items.forEach(item => {
      if (item.providerId) {
        const existing = providerTotals.get(item.providerId);
        const itemTotal = item.price * item.quantity;
        
        if (existing) {
          existing.total += itemTotal;
        } else {
          providerTotals.set(item.providerId, {
            total: itemTotal,
            name: item.providerName || item.providerId,
            currency: item.currency,
          });
        }
      }
    });

    const errors: ValidationResult['errors'] = [];

    providerTotals.forEach((data, providerId) => {
      const minOrder = providerMinOrders.get(providerId);
      if (minOrder && data.total < minOrder.minOrderAmount) {
        errors.push({
          providerId,
          providerName: minOrder.providerName,
          currentAmount: data.total,
          minAmount: minOrder.minOrderAmount,
          currency: minOrder.currency,
          shortfall: minOrder.minOrderAmount - data.total,
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [providerMinOrders]);

  // Get formatted error messages
  const getErrorMessages = useCallback((result: ValidationResult): string[] => {
    return result.errors.map(error => 
      t('minOrder.belowMinimum', {
        provider: error.providerName,
        currency: error.currency,
        amount: error.minAmount.toLocaleString(),
      })
    );
  }, [t]);

  // Get shortfall message
  const getShortfallMessage = useCallback((result: ValidationResult): string | null => {
    if (result.errors.length === 0) return null;
    
    const totalShortfall = result.errors.reduce((sum, e) => sum + e.shortfall, 0);
    const currency = result.errors[0]?.currency || 'THB';
    
    return t('minOrder.addMore', {
      currency,
      amount: Math.ceil(totalShortfall).toLocaleString(),
    });
  }, [t]);

  return {
    fetchMinOrderAmounts,
    validateCart,
    getErrorMessages,
    getShortfallMessage,
    providerMinOrders,
    isLoading,
  };
}
