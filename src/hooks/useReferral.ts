import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ReferralSettings {
  referrer_bonus: number;
  referred_bonus: number;
  min_booking_amount: number;
}

interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  referrer_bonus: number;
  referred_bonus: number;
  status: string;
  bonus_paid_at: string | null;
  created_at: string;
}

export const useReferral = () => {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [settings, setSettings] = useState<ReferralSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalReferrals: 0,
    completedReferrals: 0,
    totalEarned: 0,
  });

  const loadReferralCode = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .rpc('generate_referral_code', { p_user_id: user.id });

      if (error) throw error;
      setReferralCode(data);
    } catch (error) {
      console.error('Error loading referral code:', error);
    }
  }, [user]);

  const loadReferrals = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const referralData = data || [];
      setReferrals(referralData);
      
      // Calculate stats
      const completed = referralData.filter(r => r.status === 'completed');
      setStats({
        totalReferrals: referralData.length,
        completedReferrals: completed.length,
        totalEarned: completed.reduce((sum, r) => sum + Number(r.referrer_bonus), 0),
      });
    } catch (error) {
      console.error('Error loading referrals:', error);
    }
  }, [user]);

  const loadSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('referral_settings')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) throw error;
      setSettings(data);
    } catch (error) {
      console.error('Error loading referral settings:', error);
    }
  }, []);

  const applyReferralCode = useCallback(async (code: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .rpc('apply_referral_code', { 
          p_referred_id: user.id, 
          p_code: code.toUpperCase() 
        });

      if (error) throw error;
      return data === true;
    } catch (error) {
      console.error('Error applying referral code:', error);
      return false;
    }
  }, [user]);

  const getShareLink = useCallback(() => {
    if (!referralCode) return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}/auth?ref=${referralCode}`;
  }, [referralCode]);

  const copyReferralCode = useCallback(async () => {
    if (!referralCode) return false;
    try {
      await navigator.clipboard.writeText(referralCode);
      return true;
    } catch {
      return false;
    }
  }, [referralCode]);

  const copyShareLink = useCallback(async () => {
    const link = getShareLink();
    if (!link) return false;
    try {
      await navigator.clipboard.writeText(link);
      return true;
    } catch {
      return false;
    }
  }, [getShareLink]);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      
      try {
        // Load referral code
        const { data: codeData, error: codeError } = await supabase
          .rpc('generate_referral_code', { p_user_id: user.id });
        
        if (!codeError && isMounted) {
          setReferralCode(codeData);
        }
        
        // Load referrals
        const { data: referralData, error: referralError } = await supabase
          .from('referrals')
          .select('*')
          .eq('referrer_id', user.id)
          .order('created_at', { ascending: false });
        
        if (!referralError && isMounted) {
          const referrals = referralData || [];
          setReferrals(referrals);
          
          const completed = referrals.filter(r => r.status === 'completed');
          setStats({
            totalReferrals: referrals.length,
            completedReferrals: completed.length,
            totalEarned: completed.reduce((sum, r) => sum + Number(r.referrer_bonus), 0),
          });
        }
        
        // Load settings
        const { data: settingsData, error: settingsError } = await supabase
          .from('referral_settings')
          .select('*')
          .eq('is_active', true)
          .single();
        
        if (!settingsError && isMounted) {
          setSettings(settingsData);
        }
      } catch (error) {
        console.error('Error loading referral data:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [user]);

  return {
    referralCode,
    referrals,
    settings,
    stats,
    isLoading,
    applyReferralCode,
    getShareLink,
    copyReferralCode,
    copyShareLink,
    refetch: () => Promise.all([loadReferralCode(), loadReferrals()]),
  };
};
