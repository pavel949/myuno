/**
 * ProviderReferralCard — B2B referral surface for the vendor dashboard.
 *
 * Lets a verified provider recommend the platform to other providers. When a
 * referred provider gets verified, the referrer earns a commission discount
 * (server-side trigger; see migration 20260625120000_provider_referral_program.sql).
 *
 * Reuses the referral-aware ShareCTA so the invite link carries the provider's
 * code + UTM. Gated by feature flag PROVIDER_REFERRAL.
 *
 * Doc: docs/canonical/research/no-budget-growth-playbook.md §7.
 */
import React from 'react';
import { Copy, Share2, Handshake, BadgePercent, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ShareCTA } from '@/components/share/ShareCTA';
import { useProviderReferral } from '@/hooks/useProviderReferral';
import { useLanguage } from '@/contexts/LanguageContext';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export const ProviderReferralCard: React.FC<{ className?: string }> = ({ className }) => {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { overview, stats, isProvider, referralCode, isLoading } = useProviderReferral();

  if (!isFeatureEnabled('PROVIDER_REFERRAL')) return null;
  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Skeleton className="h-32 w-full rounded-none" />
        </CardContent>
      </Card>
    );
  }
  // Only providers see the B2B card.
  if (!overview || !isProvider) return null;

  const perReferral = overview.per_referral_discount_percent;
  const months = overview.discount_months;
  const activeDiscount = overview.active_discount_percent;

  const handleCopy = async () => {
    if (!referralCode) return;
    try {
      await navigator.clipboard.writeText(referralCode);
      toast.success(isRu ? 'Код скопирован!' : 'Code copied!');
    } catch {
      toast.error(isRu ? 'Не удалось скопировать' : 'Failed to copy');
    }
  };

  // Referred providers land on the vendor pitch + signup with the code pre-filled.
  const shareUrl = `${window.location.origin}/auth`;
  const shareTitle = isRu
    ? `Присоединяйтесь к myUNO как поставщик`
    : `Join myUNO as a provider`;
  const shareText = isRu
    ? `Рекомендую myUNO для бизнеса на Пхукете. Зарегистрируйтесь как поставщик по моей ссылке.`
    : `I recommend myUNO for your business on Phuket. Register as a provider via my link.`;

  const steps = [
    isRu ? 'Поделитесь ссылкой с коллегой-поставщиком' : 'Share your link with a fellow provider',
    isRu ? 'Он регистрируется как поставщик на myUNO' : 'They register as a provider on myUNO',
    isRu
      ? `После его верификации ваша комиссия снижается на ${perReferral}% на ${months} мес.`
      : `Once they are verified, your commission drops by ${perReferral}% for ${months} months`,
  ];

  return (
    <Card className={cn('rounded-none', className)}>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-none bg-primary/10 flex items-center justify-center">
            <Handshake className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">
              {isRu ? 'Рекомендуйте коллегам' : 'Refer fellow providers'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {isRu
                ? 'Снижайте свою комиссию за каждого приведённого поставщика'
                : 'Lower your commission for every provider you bring'}
            </p>
          </div>
        </div>
        {activeDiscount > 0 && (
          <Badge className="bg-success/15 text-success border-0 gap-1">
            <BadgePercent className="w-3.5 h-3.5" />
            −{activeDiscount}%
          </Badge>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Earned discount summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-secondary/50 rounded-none p-3 text-center">
            <p className="text-2xl font-bold text-primary tabular-nums">{perReferral}%</p>
            <p className="text-xs text-muted-foreground">
              {isRu ? 'Скидка за поставщика' : 'Discount per provider'}
            </p>
          </div>
          <div className="bg-secondary/50 rounded-none p-3 text-center">
            <p className="text-2xl font-bold text-primary tabular-nums">−{activeDiscount}%</p>
            <p className="text-xs text-muted-foreground">
              {isRu ? 'Активно сейчас' : 'Active now'}
            </p>
          </div>
        </div>

        {/* Referral code */}
        {referralCode && (
          <div className="bg-muted/50 border border-border rounded-none p-4">
            <p className="text-xs text-muted-foreground mb-2 text-center">
              {isRu ? 'Ваш реферальный код' : 'Your referral code'}
            </p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl font-mono font-bold tracking-widest">{referralCode}</span>
              <button
                onClick={handleCopy}
                className="p-2 hover:bg-secondary rounded-none transition-colors"
                aria-label={isRu ? 'Скопировать код' : 'Copy code'}
              >
                <Copy className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>
        )}

        {/* Share */}
        <ShareCTA
          url={shareUrl}
          title={shareTitle}
          text={shareText}
          referralCode={referralCode}
          utmCampaign="provider_referral"
        >
          <Button className="w-full rounded-none" type="button">
            <Share2 className="w-4 h-4 mr-2" />
            {isRu ? 'Поделиться ссылкой' : 'Share link'}
          </Button>
        </ShareCTA>

        {/* How it works */}
        <div className="border-t border-border pt-4">
          <h4 className="text-sm font-medium mb-3">
            {isRu ? 'Как это работает' : 'How it works'}
          </h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Referred providers list */}
        {stats.totalReferred > 0 && (
          <div className="border-t border-border pt-4">
            <h4 className="text-sm font-medium mb-3">
              {isRu ? 'Приведённые поставщики' : 'Providers you referred'}
            </h4>
            <div className="space-y-2">
              {overview.referred.map((r, i) => {
                const isActive = r.status === 'active';
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-secondary/50 rounded-none"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {r.provider_name || (isRu ? 'Поставщик' : 'Provider')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isRu ? 'до' : 'until'} {new Date(r.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isActive ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-success" />
                          <span className="text-sm font-medium text-success">−{r.discount_percent}%</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {isRu ? 'Истёк' : 'Expired'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
