import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  useStaysTiers,
  usePropertyStaysSubscription,
  useStaysSubscribeCheckout,
} from '@/hooks/useStaysSubscription';
import { cn } from '@/lib/utils';

interface StaysSubscriptionCardProps {
  propertyId: string;
  isRu: boolean;
}

const ACTIVE_LIKE = new Set(['active', 'trialing', 'past_due']);

export function StaysSubscriptionCard({ propertyId, isRu }: StaysSubscriptionCardProps) {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTierCode, setSelectedTierCode] = useState<string>('starter');

  const { data: tiers = [], isLoading: tiersLoading } = useStaysTiers();
  const { data: subscription, isLoading: subLoading } = usePropertyStaysSubscription(propertyId);
  const checkout = useStaysSubscribeCheckout();

  useEffect(() => {
    const flag = searchParams.get('stays_sub');
    if (flag === 'success') {
      toast({
        title: isRu ? 'Подписка Stays' : 'Stays subscription',
        description: isRu
          ? 'Оплата прошла успешно. Статус обновится через несколько секунд.'
          : 'Payment successful. Status will update shortly.',
      });
      const next = new URLSearchParams(searchParams);
      next.delete('stays_sub');
      setSearchParams(next, { replace: true });
    } else if (flag === 'cancelled') {
      toast({
        title: isRu ? 'Оплата отменена' : 'Checkout cancelled',
        variant: 'destructive',
      });
      const next = new URLSearchParams(searchParams);
      next.delete('stays_sub');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams, toast, isRu]);

  const loading = tiersLoading || subLoading;
  const status = subscription?.status ?? null;
  const isLocked = status != null && ACTIVE_LIKE.has(status);
  const tierName = subscription?.stays_subscription_tiers?.name;

  const handleSubscribe = async () => {
    try {
      const url = await checkout.mutateAsync({
        propertyId,
        tierCode: selectedTierCode,
      });
      window.location.href = url;
    } catch (e) {
      toast({
        title: isRu ? 'Ошибка' : 'Error',
        description: e instanceof Error ? e.message : 'Checkout failed',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">
                {isRu ? 'Подписка Stays' : 'Stays subscription'}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isRu
                  ? 'Каналы OTA, календарь и инструменты для краткосрочной аренды.'
                  : 'OTA channels, calendar, and tools for short-term rentals.'}
              </p>
              {subscription && (
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge variant={isLocked ? 'default' : 'secondary'}>
                    {status ?? '—'}
                  </Badge>
                  {tierName && (
                    <span className="text-xs text-muted-foreground">
                      {isRu ? 'Тариф:' : 'Plan:'} {tierName}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : isLocked ? (
              <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                {isRu ? 'Подписка активна' : 'Subscription active'}
              </span>
            ) : (
              <Button type="button" onClick={() => setDialogOpen(true)} className="w-full sm:w-auto">
                {isRu ? 'Подключить Stays' : 'Connect Stays'}
              </Button>
            )}
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{isRu ? 'Выберите тариф Stays' : 'Choose a Stays plan'}</DialogTitle>
            <DialogDescription>
              {isRu
                ? 'Ежемесячная оплата за объект. После оплаты вебхук Stripe обновит статус подписки.'
                : 'Monthly billing per property. Stripe will update subscription status via webhook.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-2">
            {tiers.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTierCode(t.code)}
                className={cn(
                  'rounded-lg border p-3 text-left transition-colors',
                  selectedTierCode === t.code
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border hover:bg-muted/50',
                )}
              >
                <div className="flex justify-between items-center gap-2">
                  <span className="font-medium">{t.name}</span>
                  <span className="text-sm font-semibold">
                    ฿{t.price_thb_monthly.toLocaleString()}
                    <span className="text-muted-foreground font-normal text-xs">
                      {' '}
                      /{isRu ? 'мес' : 'mo'}
                    </span>
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {isRu ? 'OTA ссылок:' : 'OTA links:'}{' '}
                  {t.max_ota_links != null && t.max_ota_links >= 999 ? '∞' : t.max_ota_links}
                  {t.dynamic_pricing ? ` · ${isRu ? 'динам. цены' : 'dynamic pricing'}` : ''}
                </p>
              </button>
            ))}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              {isRu ? 'Отмена' : 'Cancel'}
            </Button>
            <Button type="button" onClick={handleSubscribe} disabled={checkout.isPending}>
              {checkout.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {isRu ? 'Переход…' : 'Redirecting…'}
                </>
              ) : isRu ? (
                'Перейти к оплате'
              ) : (
                'Continue to checkout'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
