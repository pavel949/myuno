/**
 * UnifiedSuccessLayout — single canonical success page for all verticals.
 *
 * Tone (mem://style/calm-vertical-tone-standard):
 *  - "Оплата подтверждена." — point, not exclamation.
 *  - Nominal CTAs ("Мои заказы", "Вернуться в каталог").
 *  - No animate-ping, no celebratory copy.
 */
import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface UnifiedSuccessLayoutProps {
  isLoading?: boolean;
  orderNumber?: string;
  /** Block of order facts (lines, addresses, totals). */
  details?: ReactNode;
  /** Cross-sell / next-step content shown below details. */
  extras?: ReactNode;
  /** Primary action — typically "My orders". */
  primaryHref: string;
  primaryLabel?: { ru: string; en: string };
  /** Secondary action — typically "Back to catalog". */
  secondaryHref: string;
  secondaryLabel?: { ru: string; en: string };
  /** Optional one-line note shown under the title. */
  note?: { ru: string; en: string };
}

const DEFAULT_PRIMARY = { ru: 'Мои заказы', en: 'My orders' };
const DEFAULT_SECONDARY = { ru: 'Вернуться в каталог', en: 'Back to catalog' };

export function UnifiedSuccessLayout({
  isLoading = false,
  orderNumber,
  details,
  extras,
  primaryHref,
  primaryLabel = DEFAULT_PRIMARY,
  secondaryHref,
  secondaryLabel = DEFAULT_SECONDARY,
  note,
}: UnifiedSuccessLayoutProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  if (isLoading) {
    return (
      <AppLayout showHeader={false}>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showHeader={false}>
      <div className="min-h-screen bg-background flex items-start justify-center p-4 pt-10">
        <div className="w-full max-w-md space-y-5">
          {/* Status block */}
          <div className="rounded-none border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <Check className="w-5 h-5 text-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base font-semibold text-foreground leading-tight">
                  {isRu ? 'Оплата подтверждена.' : 'Payment confirmed.'}
                </h1>
                {orderNumber && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isRu ? 'Номер заказа' : 'Order number'}: {orderNumber}
                  </p>
                )}
                {note && (
                  <p className="text-xs text-muted-foreground mt-1 leading-snug">
                    {isRu ? note.ru : note.en}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Order details */}
          {details && (
            <div className="rounded-none border border-border bg-card p-5">{details}</div>
          )}

          {/* Cross-sell, etc. */}
          {extras}

          {/* Actions */}
          <div className="space-y-2 pt-1">
            <Button onClick={() => navigate(primaryHref)} className="w-full">
              {isRu ? primaryLabel.ru : primaryLabel.en}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(secondaryHref)}
              className="w-full"
            >
              {isRu ? secondaryLabel.ru : secondaryLabel.en}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
