import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVendorProfile } from '@/hooks/useVendor';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';

interface SubscriptionPlan {
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

interface VendorSubscriptionData {
  id: string;
  status: string;
  billing_cycle: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

interface SubscriptionState {
  subscribed: boolean;
  subscription: VendorSubscriptionData | null;
  plan: SubscriptionPlan | null;
  limits: SubscriptionPlan['limits'];
}

function useVendorSubscription() {
  const { user } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    subscribed: false,
    subscription: null,
    plan: null,
    limits: { max_listings: 3, commission_percent: 15 },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkSubscription = useCallback(async (isMounted?: () => boolean) => {
    const checkMounted = isMounted || (() => true);

    if (!user) {
      if (checkMounted()) setIsLoading(false);
      return;
    }

    try {
      if (checkMounted()) setIsLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();

      const { data, error: fnError } = await supabase.functions.invoke('check-vendor-subscription', {
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      });

      if (fnError) throw fnError;

      if (checkMounted()) {
        setState({
          subscribed: data.subscribed || false,
          subscription: data.subscription || null,
          plan: data.plan || null,
          limits: data.limits || { max_listings: 3, commission_percent: 15 },
        });
        setError(null);
      }
    } catch (err) {
      console.error('Error checking subscription:', err);
      if (checkMounted()) {
        setError(err instanceof Error ? err.message : 'Failed to check subscription');
      }
    } finally {
      if (checkMounted()) setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    checkSubscription(() => isMounted);
    return () => { isMounted = false; };
  }, [checkSubscription]);

  // Auto-refresh every minute
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => checkSubscription(), 60000);
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

function useSubscriptionPlans() {
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
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Check, 
  Zap, 
  Crown, 
  Building2, 
  CreditCard,
  Settings,
  Loader2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';

export default function VendorSubscription() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { profile, isLoading: profileLoading } = useVendorProfile();
  const { 
    subscribed, 
    subscription, 
    plan: currentPlan, 
    limits,
    isLoading: subLoading,
    checkSubscription,
    subscribe,
    openPortal 
  } = useVendorSubscription();
  const { plans, isLoading: plansLoading } = useSubscriptionPlans();
  
  const [yearlyBilling, setYearlyBilling] = useState(false);
  const [subscribingTo, setSubscribingTo] = useState<string | null>(null);

  const isRussian = language === 'ru';

  // Handle success/cancel from Stripe
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success(isRussian ? 'Подписка оформлена!' : 'Subscription activated!');
      checkSubscription();
    } else if (searchParams.get('canceled') === 'true') {
      toast.info(isRussian ? 'Оформление отменено' : 'Checkout canceled');
    }
  }, [searchParams, checkSubscription, isRussian]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!profileLoading && !profile && user) {
      navigate('/vendor/onboarding');
    }
  }, [profile, profileLoading, user, navigate]);

  const handleSubscribe = async (planId: string) => {
    try {
      setSubscribingTo(planId);
      await subscribe(planId, yearlyBilling ? 'yearly' : 'monthly');
      toast.success(isRussian ? 'Переход к оплате...' : 'Redirecting to checkout...');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to subscribe');
    } finally {
      setSubscribingTo(null);
    }
  };

  const handleManage = async () => {
    try {
      await openPortal();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to open portal');
    }
  };

  const getPlanIcon = (slug: string) => {
    switch (slug) {
      case 'free': return Zap;
      case 'pro': return Crown;
      case 'business': return Building2;
      default: return Zap;
    }
  };

  if (authLoading || profileLoading || subLoading || plansLoading) {
    return (
      <AppLayout>
        <PageContainer>
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <div className="grid gap-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader 
          title={isRussian ? 'Подписка' : 'Subscription'}
          showBack
        />

        {/* Current Plan Status */}
        {currentPlan && (
          <Card className="mb-6 border-primary/50 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isRussian ? 'Текущий план' : 'Current Plan'}
                  </p>
                  <p className="text-xl font-bold flex items-center gap-2">
                    {React.createElement(getPlanIcon(currentPlan.slug), { className: 'h-5 w-5' })}
                    {isRussian ? currentPlan.name_ru : currentPlan.name}
                  </p>
                  {subscription?.current_period_end && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {isRussian ? 'Активна до' : 'Active until'}: {format(new Date(subscription.current_period_end), 'dd.MM.yyyy')}
                    </p>
                  )}
                </div>
                {subscribed && currentPlan.slug !== 'free' && (
                  <Button variant="outline" size="sm" onClick={handleManage}>
                    <Settings className="h-4 w-4 mr-2" />
                    {isRussian ? 'Управление' : 'Manage'}
                  </Button>
                )}
              </div>
              
              <div className="mt-4 flex gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">{isRussian ? 'Лимит объявлений:' : 'Listings limit:'}</span>
                  <span className="ml-1 font-medium">
                    {limits.max_listings === -1 ? '∞' : limits.max_listings}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">{isRussian ? 'Условия:' : 'Terms:'}</span>
                  <span className="ml-1 font-medium">{isRussian ? 'Индивидуально' : 'Individual'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <Label htmlFor="yearly" className={!yearlyBilling ? 'font-semibold' : 'text-muted-foreground'}>
            {isRussian ? 'Помесячно' : 'Monthly'}
          </Label>
          <Switch
            id="yearly"
            checked={yearlyBilling}
            onCheckedChange={setYearlyBilling}
          />
          <Label htmlFor="yearly" className={yearlyBilling ? 'font-semibold' : 'text-muted-foreground'}>
            {isRussian ? 'Годовой' : 'Yearly'}
            <Badge variant="secondary" className="ml-2 text-xs">
              -20%
            </Badge>
          </Label>
        </div>

        {/* Plans Grid */}
        <div className="grid gap-4">
          {plans.map((plan) => {
            const Icon = getPlanIcon(plan.slug);
            const isCurrentPlan = currentPlan?.slug === plan.slug;
            const price = yearlyBilling ? (plan.price_yearly || plan.price_monthly * 12) : plan.price_monthly;
            const period = yearlyBilling 
              ? (isRussian ? '/год' : '/year') 
              : (isRussian ? '/мес' : '/mo');

            return (
              <Card 
                key={plan.id} 
                className={`relative overflow-hidden transition-all ${
                  plan.is_popular ? 'border-primary shadow-lg' : ''
                } ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}
              >
                {plan.is_popular && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-medium rounded-bl-lg">
                    <Sparkles className="h-3 w-3 inline mr-1" />
                    {isRussian ? 'Популярный' : 'Popular'}
                  </div>
                )}
                
                {isCurrentPlan && (
                  <Badge className="absolute top-2 left-2" variant="outline">
                    {isRussian ? 'Ваш план' : 'Your Plan'}
                  </Badge>
                )}

                <CardHeader className={isCurrentPlan ? 'pt-10' : ''}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      plan.slug === 'business' ? 'bg-accent-amber/10 text-accent-amber' :
                      plan.slug === 'pro' ? 'bg-accent-purple/10 text-accent-purple' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle>{isRussian ? plan.name_ru : plan.name}</CardTitle>
                      <CardDescription>
                        {isRussian ? plan.description_ru : plan.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="mb-4">
                    <span className="text-3xl font-bold">
                      ${price}
                    </span>
                    <span className="text-muted-foreground">{period}</span>
                  </div>

                  <ul className="space-y-2">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-success shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 pt-4 border-t flex gap-4 text-sm text-muted-foreground">
                    <span>
                      {isRussian ? 'Условия:' : 'Terms:'} {plan.slug === 'free' ? (isRussian ? 'Стандарт' : 'Standard') : (isRussian ? 'Улучшенные' : 'Improved')}
                    </span>
                    <span>
                      {isRussian ? 'Объявлений:' : 'Listings:'} {plan.limits.max_listings === -1 ? '∞' : plan.limits.max_listings}
                    </span>
                  </div>
                </CardContent>

                <CardFooter>
                  {isCurrentPlan ? (
                    <Button className="w-full" variant="outline" disabled>
                      <Check className="h-4 w-4 mr-2" />
                      {isRussian ? 'Текущий план' : 'Current Plan'}
                    </Button>
                  ) : (
                    <Button 
                      className="w-full" 
                      variant={plan.is_popular ? 'default' : 'outline'}
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={subscribingTo !== null}
                    >
                      {subscribingTo === plan.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <ArrowRight className="h-4 w-4 mr-2" />
                      )}
                      {plan.slug === 'free' 
                        ? (isRussian ? 'Выбрать бесплатный' : 'Choose Free')
                        : (isRussian ? 'Подписаться' : 'Subscribe')
                      }
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Manage Subscription */}
        {subscribed && currentPlan?.slug !== 'free' && (
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {isRussian ? 'Управление подпиской' : 'Manage Subscription'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isRussian 
                      ? 'Изменить способ оплаты, отменить или обновить план' 
                      : 'Update payment method, cancel, or change plan'}
                  </p>
                </div>
                <Button variant="outline" onClick={handleManage}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  {isRussian ? 'Открыть портал' : 'Open Portal'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </PageContainer>
    </AppLayout>
  );
}
