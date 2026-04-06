import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CashbackSettings {
  category: string;
  percentage: number;
  min_order_amount: number;
  max_cashback_amount: number | null;
}

export function useCashback() {
  const [settings, setSettings] = useState<CashbackSettings[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async (isMounted?: () => boolean) => {
    const checkMounted = isMounted || (() => true);
    if (checkMounted()) setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('cashback_settings')
        .select('category, percentage, min_order_amount, max_cashback_amount')
        .eq('is_active', true);

      if (error) throw error;
      if (checkMounted()) setSettings(data || []);
    } catch {
      // ignored — UI shows empty state when settings are unavailable
    } finally {
      if (checkMounted()) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetchSettings(() => isMounted);
    return () => { isMounted = false; };
  }, [fetchSettings]);


  const getCashbackPercentage = useCallback((category?: string): number => {
    // Find category-specific or default
    const categorySettings = settings.find(s => s.category === category);
    if (categorySettings) return categorySettings.percentage;
    
    const defaultSettings = settings.find(s => s.category === 'default');
    return defaultSettings?.percentage ?? 5;
  }, [settings]);

  const getCashbackAmount = useCallback((amount: number, category?: string): number => {
    const categorySettings = settings.find(s => s.category === category) 
      || settings.find(s => s.category === 'default');
    
    if (!categorySettings) return amount * 0.05; // Default 5%
    
    // Check minimum order
    if (amount < (categorySettings.min_order_amount || 0)) return 0;
    
    let cashback = amount * (categorySettings.percentage / 100);
    
    // Apply max limit
    if (categorySettings.max_cashback_amount && cashback > categorySettings.max_cashback_amount) {
      cashback = categorySettings.max_cashback_amount;
    }
    
    return Math.round(cashback * 100) / 100;
  }, [settings]);

  const getCashbackInfo = useCallback((category?: string): CashbackSettings | null => {
    return settings.find(s => s.category === category) 
      || settings.find(s => s.category === 'default') 
      || null;
  }, [settings]);

  return {
    settings,
    isLoading,
    getCashbackPercentage,
    getCashbackAmount,
    getCashbackInfo,
    refetch: fetchSettings,
  };
}
