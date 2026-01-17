import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SubscriptionPlan {
  id: string;
  name: string;
  name_ru: string;
  slug: string;
  description: string | null;
  description_ru: string | null;
  price_monthly: number;
  price_yearly: number | null;
  currency: string;
  features: string[];
  limits: {
    max_listings: number;
    commission_percent: number;
    featured_allowed?: boolean;
    api_access?: boolean;
  };
  is_popular: boolean;
}

export interface VendorSubscription {
  id: string;
  status: string;
  billing_cycle: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

export interface SubscriptionState {
  subscribed: boolean;
  subscription: VendorSubscription | null;
  plan: SubscriptionPlan | null;
  limits: SubscriptionPlan['limits'];
}

export function useVendorSubscription() {
  const { user } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    subscribed: false,
    subscription: null,
    plan: null,
    limits: { max_listings: 3, commission_percent: 15 },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      
      const { data, error: fnError } = await supabase.functions.invoke('check-vendor-subscription', {
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      });

      if (fnError) throw fnError;

      setState({
        subscribed: data.subscribed || false,
        subscription: data.subscription || null,
        plan: data.plan || null,
        limits: data.limits || { max_listings: 3, commission_percent: 15 },
      });
      setError(null);
    } catch (err) {
      console.error('Error checking subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to check subscription');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Auto-refresh every minute
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  const subscribe = async (planId: string, billingCycle: 'monthly' | 'yearly' = 'monthly') => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      const { data, error: fnError } = await supabase.functions.invoke('create-vendor-subscription', {
        body: { planId, billingCycle },
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      });

      if (fnError) throw fnError;

      if (data.free) {
        await checkSubscription();
        return { success: true };
      }

      if (data.url) {
        window.open(data.url, '_blank');
        return { success: true, redirected: true };
      }

      throw new Error('No checkout URL returned');
    } catch (err) {
      console.error('Error creating subscription:', err);
      throw err;
    }
  };

  const openPortal = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      const { data, error: fnError } = await supabase.functions.invoke('vendor-portal', {
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      });

      if (fnError) throw fnError;

      if (data.url) {
        window.open(data.url, '_blank');
        return { success: true };
      }

      throw new Error('No portal URL returned');
    } catch (err) {
      console.error('Error opening portal:', err);
      throw err;
    }
  };

  return {
    ...state,
    isLoading,
    error,
    checkSubscription,
    subscribe,
    openPortal,
  };
}

export function useSubscriptionPlans() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    async function fetchPlans() {
      try {
        const { data, error } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('is_active', true)
          .order('sort_order');

        if (error) throw error;

        const mappedPlans: SubscriptionPlan[] = (data || []).map(p => ({
          id: p.id,
          name: p.name,
          name_ru: p.name_ru,
          slug: p.slug,
          description: p.description,
          description_ru: p.description_ru,
          price_monthly: Number(p.price_monthly),
          price_yearly: p.price_yearly ? Number(p.price_yearly) : null,
          currency: p.currency,
          features: (p.features as string[]) || [],
          limits: (p.limits as SubscriptionPlan['limits']) || { max_listings: 3, commission_percent: 15 },
          is_popular: p.is_popular || false,
        }));

        if (isMounted) setPlans(mappedPlans);
      } catch (err) {
        console.error('Error fetching plans:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchPlans();
    return () => { isMounted = false; };
  }, []);

  return { plans, isLoading };
}
