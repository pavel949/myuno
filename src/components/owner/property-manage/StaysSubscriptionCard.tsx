/**
 * StaysSubscriptionCard — per-property activation against the canonical
 * `mc_property_slots` model (the legacy per-property `stays_subscription_tiers`
 * flow has been retired).
 *
 * Behaviour:
 *  - If the property already occupies an active slot → green "Active" pill.
 *  - If unused slots are available → one-click activation.
 *  - If quota is exhausted → CTA to /mc/subscription to buy more slots.
 */
import { useNavigate } from 'react-router-dom';
import { Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMCSubscription } from '@/hooks/useMCSubscription';

interface StaysSubscriptionCardProps {
  propertyId: string;
  isRu: boolean;
}

export function StaysSubscriptionCard({ propertyId, isRu }: StaysSubscriptionCardProps) {
  const navigate = useNavigate();
  const {
    isLoading,
    isPropertyActive,
    activateProperty,
    paidSlots,
    usedSlots,
    canActivateMore,
  } = useMCSubscription();

  const isActive = isPropertyActive(propertyId);
  const slotsLeft = Math.max(paidSlots - usedSlots, 0);

  return (
    <div className="rounded-none border bg-card text-card-foreground shadow-sm p-4 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none bg-primary/10 text-primary">
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
            {!isLoading && (
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant={isActive ? 'default' : 'secondary'}>
                  {isActive
                    ? isRu ? 'Активен' : 'Active'
                    : isRu ? 'Не активен' : 'Inactive'}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {isRu
                    ? `Слоты: ${usedSlots}/${paidSlots}`
                    : `Slots: ${usedSlots}/${paidSlots}`}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : isActive ? (
            <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-success" />
              {isRu ? 'Подписка активна' : 'Subscription active'}
            </span>
          ) : canActivateMore && slotsLeft > 0 ? (
            <Button type="button" onClick={() => activateProperty(propertyId)} className="w-full sm:w-auto">
              {isRu ? `Активировать (${slotsLeft} слот.)` : `Activate (${slotsLeft} left)`}
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={() => navigate('/mc/subscription')} className="w-full sm:w-auto">
              {isRu ? 'Купить слоты' : 'Buy slots'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
