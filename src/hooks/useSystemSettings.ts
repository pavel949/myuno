import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { createErrorHandler } from '@/lib/errorHandler';

const errorLog = createErrorHandler('useSystemSettings');

// Default values as fallbacks
const DEFAULTS = {
  platform_fee_percent: 10,
  default_deposit_percent: 10,
  min_booking_hours: 24,
  max_booking_days_ahead: 365,
} as const;

type SettingKey = keyof typeof DEFAULTS;

interface SystemSettings {
  platformFeePercent: number;
  defaultDepositPercent: number;
  minBookingHours: number;
  maxBookingDaysAhead: number;
}

export function useSystemSettings() {
  const [settings, setSettings] = useState<SystemSettings>({
    platformFeePercent: DEFAULTS.platform_fee_percent,
    defaultDepositPercent: DEFAULTS.default_deposit_percent,
    minBookingHours: DEFAULTS.min_booking_hours,
    maxBookingDaysAhead: DEFAULTS.max_booking_days_ahead,
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('key, value')
        .in('key', Object.keys(DEFAULTS));

      if (error) throw error;

      if (data && data.length > 0) {
        const newSettings = { ...settings };
        
        data.forEach((row) => {
          const key = row.key as SettingKey;
          const value = typeof row.value === 'number' 
            ? row.value 
            : Number(row.value);
          
          switch (key) {
            case 'platform_fee_percent':
              newSettings.platformFeePercent = value;
              break;
            case 'default_deposit_percent':
              newSettings.defaultDepositPercent = value;
              break;
            case 'min_booking_hours':
              newSettings.minBookingHours = value;
              break;
            case 'max_booking_days_ahead':
              newSettings.maxBookingDaysAhead = value;
              break;
          }
        });

        setSettings(newSettings);
      }
    } catch (error) {
      errorLog.silent(error, 'load_system_settings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Calculate fee from amount
  const calculatePlatformFee = useCallback((amount: number): number => {
    return Math.round(amount * (settings.platformFeePercent / 100));
  }, [settings.platformFeePercent]);

  // Calculate deposit from total
  const calculateDeposit = useCallback((total: number): number => {
    return Math.round(total * (settings.defaultDepositPercent / 100));
  }, [settings.defaultDepositPercent]);

  return {
    ...settings,
    isLoading,
    calculatePlatformFee,
    calculateDeposit,
    refetch: loadSettings,
  };
}

// Singleton fetcher for edge functions (non-hook usage)
export async function getSystemSetting(key: string): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .rpc('get_system_setting', { p_key: key });
    
    if (error) throw error;
    return data ? Number(data) : null;
  } catch {
    return null;
  }
}

export async function getPlatformFeePercent(): Promise<number> {
  const value = await getSystemSetting('platform_fee_percent');
  return (value ?? DEFAULTS.platform_fee_percent) / 100;
}
