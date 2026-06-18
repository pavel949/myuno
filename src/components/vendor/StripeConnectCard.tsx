/**
 * StripeConnectCard — Vendor Stripe Connect onboarding & status.
 * Shown in /vendor/payouts (Methods tab).
 */
import { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Loader2, ExternalLink, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

type Status = {
  connected: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  account_id: string | null;
  details_submitted?: boolean;
};

export function StripeConnectCard() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const [status, setStatus] = useState<Status | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpening, setIsOpening] = useState(false);

  const loadStatus = useCallback(async (): Promise<Status | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('vendor-stripe-onboard', {
        body: { action: 'status' },
      });
      if (error) throw error;
      const next = data as Status;
      setStatus(next);
      return next;
    } catch (err) {
      console.error('[StripeConnect] status error', err);
      setStatus({ connected: false, charges_enabled: false, payouts_enabled: false, account_id: null });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Poll status a few times after returning from Stripe — capabilities
  // can take a few seconds to propagate after onboarding completes.
  const pollStatus = useCallback(async () => {
    setIsLoading(true);
    const delays = [0, 1500, 3000, 5000, 8000];
    let last: Status | null = null;
    for (const ms of delays) {
      if (ms) await new Promise((r) => setTimeout(r, ms));
      last = await loadStatus();
      if (last?.charges_enabled && last?.payouts_enabled) break;
    }
    if (last?.charges_enabled && last?.payouts_enabled) {
      toast.success(isRu ? 'Stripe подключён' : 'Stripe connected', {
        description: isRu
          ? 'Платежи и выплаты активированы.'
          : 'Charges and payouts are now enabled.',
      });
    } else if (last?.connected) {
      toast.message(isRu ? 'Onboarding не завершён' : 'Onboarding incomplete', {
        description: isRu
          ? 'Stripe ещё проверяет данные или запросил дополнительные документы.'
          : 'Stripe is still verifying or has requested more details.',
      });
    }
  }, [loadStatus, isRu]);

  useEffect(() => {
    // Handle return from Stripe onboarding redirect
    const params = new URLSearchParams(window.location.search);
    const stripeParam = params.get('stripe');
    if (stripeParam === 'return' || stripeParam === 'refresh') {
      // Clean URL so reloads don't re-trigger polling
      params.delete('stripe');
      const qs = params.toString();
      window.history.replaceState(
        {},
        '',
        window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash,
      );
      pollStatus();
    } else {
      loadStatus();
    }

    // Refresh when tab regains focus (covers manual back-navigation cases)
    const onFocus = () => loadStatus();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') loadStatus();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [loadStatus, pollStatus]);


  const handleConnect = async () => {
    setIsOpening(true);
    try {
      const origin = window.location.origin;
      const { data, error } = await supabase.functions.invoke('vendor-stripe-onboard', {
        body: {
          action: 'create_link',
          return_url: `${origin}/vendor/payouts?stripe=return`,
          refresh_url: `${origin}/vendor/payouts?stripe=refresh`,
        },
      });
      if (error) throw error;
      const url = (data as { url?: string })?.url;
      if (!url) throw new Error('No onboarding URL returned');
      window.location.href = url;
    } catch (err) {
      console.error('[StripeConnect] create_link error', err);
      toast.error(isRu ? 'Не удалось открыть Stripe' : 'Could not open Stripe', {
        description: err instanceof Error ? err.message : undefined,
      });
      setIsOpening(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="mb-4">
        <CardContent className="p-5 flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {isRu ? 'Проверяем Stripe…' : 'Checking Stripe…'}
          </span>
        </CardContent>
      </Card>
    );
  }

  const ready = !!status?.charges_enabled && !!status?.payouts_enabled;
  const inProgress = !!status?.connected && !ready;

  return (
    <Card className="mb-4 border-primary/20">
      <CardContent className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <div
            className={`p-2 rounded-full shrink-0 ${
              ready ? 'bg-success/10' : inProgress ? 'bg-warning/10' : 'bg-primary/10'
            }`}
          >
            {ready ? (
              <CheckCircle2 className="h-5 w-5 text-success" />
            ) : inProgress ? (
              <AlertCircle className="h-5 w-5 text-warning" />
            ) : (
              <ExternalLink className="h-5 w-5 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1">
              {isRu ? 'Автоматические выплаты через Stripe' : 'Automated payouts via Stripe'}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {ready
                ? isRu
                  ? 'Аккаунт подключён. Выплаты будут приходить автоматически после каждой оплаты клиента.'
                  : 'Account connected. Payouts will be sent automatically after each customer payment.'
                : inProgress
                  ? isRu
                    ? 'Onboarding начат, но не завершён. Stripe запросил дополнительные документы — продолжите проверку.'
                    : 'Onboarding started but incomplete. Stripe requested more details — please finish verification.'
                  : isRu
                    ? 'Подключите Stripe Express за 2 минуты, чтобы получать выплаты на банковский счёт без ручных заявок.'
                    : 'Connect Stripe Express in 2 minutes to receive payouts to your bank account without manual requests.'}
            </p>
          </div>
        </div>

        {ready ? (
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-3 text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                {isRu ? 'Платежи' : 'Charges'}
              </span>
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                {isRu ? 'Выплаты' : 'Payouts'}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={loadStatus} className="h-8 gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" />
              {isRu ? 'Обновить' : 'Refresh'}
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleConnect}
            disabled={isOpening}
            className="w-full"
            size="lg"
          >
            {isOpening ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ExternalLink className="h-4 w-4 mr-2" />
            )}
            {inProgress
              ? isRu ? 'Продолжить onboarding' : 'Continue onboarding'
              : isRu ? 'Подключить Stripe' : 'Connect Stripe'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
