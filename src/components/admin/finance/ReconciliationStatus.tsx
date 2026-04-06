import React from 'react';
import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLedgerReconciliation } from '@/hooks/useLedgerReconciliation';
import { cn } from '@/lib/utils';

interface ReconciliationStatusProps {
  days?: number;
  compact?: boolean;
}

export function ReconciliationStatus({ days = 30, compact = false }: ReconciliationStatusProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data, isLoading } = useLedgerReconciliation(days);

  if (isLoading) {
    return (
      <Badge variant="outline" className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        {isRu ? 'Сверка...' : 'Reconciling...'}
      </Badge>
    );
  }

  if (!data || data.totalOrders === 0) {
    return compact ? null : (
      <Badge variant="outline" className="gap-1 text-muted-foreground">
        {isRu ? 'Нет данных для сверки' : 'No data to reconcile'}
      </Badge>
    );
  }

  if (data.isHealthy) {
    return compact ? (
      <Badge className="gap-1 bg-success/10 text-success border-success/20">
        <CheckCircle2 className="h-3 w-3" />
        {isRu ? 'Сверка OK' : 'Reconciled'}
      </Badge>
    ) : (
      <Card className="border-success/30 bg-success/5">
        <CardContent className="p-3 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
          <div>
            <p className="text-sm font-medium text-success">
              {isRu ? 'Сверка пройдена' : 'Reconciliation Passed'}
            </p>
            <p className="text-xs text-muted-foreground">
              {data.matchedOrders} / {data.totalOrders} {isRu ? 'заказов совпадают с записями в леджере' : 'orders match ledger entries'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return compact ? (
    <Badge className="gap-1 bg-destructive/10 text-destructive border-destructive/20">
      <AlertTriangle className="h-3 w-3" />
      {data.missingLedger + data.amountMismatch} {isRu ? 'расхождений' : 'issues'}
    </Badge>
  ) : (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardContent className="p-3 flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
        <div>
          <p className="text-sm font-medium text-destructive">
            {isRu ? 'Обнаружены расхождения' : 'Reconciliation Issues Found'}
          </p>
          <div className="text-xs text-muted-foreground space-y-0.5">
            {data.missingLedger > 0 && (
              <p>{data.missingLedger} {isRu ? 'заказов без записей в леджере' : 'orders missing ledger entries'}</p>
            )}
            {data.amountMismatch > 0 && (
              <p>{data.amountMismatch} {isRu ? 'заказов с несовпадением сумм' : 'orders with amount mismatch'}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
