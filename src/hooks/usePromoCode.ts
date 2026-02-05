import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCurrencySymbol } from '@/lib/config/currencies';

export interface PromoCode {
  id: string;
  code: string;
  description_en: string | null;
  description_ru: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  usage_limit: number | null;
  used_count: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
}

export function usePromoCode() {
  const { language } = useLanguage();
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validatePromoCode = useCallback(async (code: string, orderAmount: number): Promise<PromoCode | null> => {
    setIsValidating(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('marketplace_promo_codes')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (queryError || !data) {
        setError(language === 'ru' ? 'Промокод не найден' : 'Promo code not found');
        return null;
      }

      const promo = data as PromoCode;

      // Check validity period
      const now = new Date();
      if (promo.valid_until && new Date(promo.valid_until) < now) {
        setError(language === 'ru' ? 'Промокод истёк' : 'Promo code expired');
        return null;
      }

      // Check min order amount
      if (orderAmount < promo.min_order_amount) {
        const symbol = getCurrencySymbol('THB');
        setError(
          language === 'ru' 
            ? `Минимальная сумма заказа: ${symbol}${promo.min_order_amount}` 
            : `Minimum order: ${symbol}${promo.min_order_amount}`
        );
        return null;
      }

      // Check usage limit
      if (promo.usage_limit && promo.used_count >= promo.usage_limit) {
        setError(language === 'ru' ? 'Промокод исчерпан' : 'Promo code limit reached');
        return null;
      }

      setAppliedPromo(promo);
      return promo;
    } catch (err) {
      setError(language === 'ru' ? 'Ошибка проверки' : 'Validation error');
      return null;
    } finally {
      setIsValidating(false);
    }
  }, [language]);

  const calculateDiscount = useCallback((subtotal: number): number => {
    if (!appliedPromo) return 0;

    let discount = 0;
    if (appliedPromo.discount_type === 'percentage') {
      discount = subtotal * (appliedPromo.discount_value / 100);
    } else {
      discount = appliedPromo.discount_value;
    }

    // Apply max discount cap
    if (appliedPromo.max_discount_amount) {
      discount = Math.min(discount, appliedPromo.max_discount_amount);
    }

    return Math.round(discount);
  }, [appliedPromo]);

  const clearPromo = useCallback(() => {
    setAppliedPromo(null);
    setError(null);
  }, []);

  return {
    appliedPromo,
    isValidating,
    error,
    validatePromoCode,
    calculateDiscount,
    clearPromo
  };
}
