/**
 * ClearViewPaywall — gate that wraps full-report sections.
 * Shows a teaser + CTA to buy access via Stripe.
 */

import React from 'react';
import { Lock, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  useClearViewAccess,
  useClearViewCheckout,
} from '@/hooks/useClearViewPurchase';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthSheet } from '@/contexts/AuthSheetContext';
import { CLEARVIEW_PRICING } from '@/lib/clearview/methodology';
import { cn } from '@/lib/utils';

interface Props {
  projectId: string;
  isRu: boolean;
  /** If true, current user is project owner / admin and should bypass paywall */
  bypass?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function ClearViewPaywall({
  projectId,
  isRu,
  bypass = false,
  children,
  className,
}: Props) {
  const { user } = useAuth();
  const { openAuthSheet } = useAuthSheet();
  const { data: access, isLoading } = useClearViewAccess(projectId);
  const { purchase, isProcessing } = useClearViewCheckout();

  if (bypass || access?.hasAccess) {
    return <div className={className}>{children}</div>;
  }

  const handleBuy = async () => {
    if (!user) {
      openAuthSheet({
        intent: 'clearview',
        onSuccess: () => purchase({ projectId, tier: 'single' }),
      });
      return;
    }
    await purchase({ projectId, tier: 'single' });
  };

  const priceLabel = `฿${(CLEARVIEW_PRICING.SINGLE_REPORT_THB_CENTS / 100).toLocaleString('en-US')}`;

  return (
    <div className={cn('relative', className)}>
      {/* Teaser preview */}
      <div className="pointer-events-none select-none blur-sm opacity-40 max-h-72 overflow-hidden">
        {children}
      </div>

      {/* Paywall overlay */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-card border border-border rounded-none p-5 text-center space-y-3 shadow-lg">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-none border border-border bg-muted">
            <Lock className="w-5 h-5 text-foreground" aria-hidden />
          </div>
          <div>
            <h4 className="font-display text-base font-semibold text-foreground">
              {isRu ? 'Полный отчёт ClearView™' : 'Full ClearView™ report'}
            </h4>
            <p className="text-xs text-muted-foreground mt-1 leading-snug">
              {isRu
                ? 'Полный анализ по 8 категориям, evidence gaps, modifiers и PDF-выгрузка. Доступ — 12 месяцев.'
                : 'Full 8-category analysis, evidence gaps, modifiers and PDF export. 12-month access.'}
            </p>
          </div>
          <Button
            onClick={handleBuy}
            disabled={isLoading || isProcessing}
            className="w-full rounded-none"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isRu ? 'Открываем оплату…' : 'Opening checkout…'}
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                {isRu ? `Открыть отчёт · ${priceLabel}` : `Unlock report · ${priceLabel}`}
              </>
            )}
          </Button>
          <p className="text-[10px] text-muted-foreground">
            {isRu
              ? 'Stripe · безопасная оплата картой · моментальный доступ'
              : 'Stripe · secure card payment · instant access'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ClearViewPaywall;
