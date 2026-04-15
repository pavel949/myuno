import { DollarSign, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCommissionCalc } from '@/hooks/useDealCommission';

interface Props {
  deal: {
    budget_max?: number | null;
    budget_min?: number | null;
    commission_amount?: number | null;
    commission_rate?: number | null;
    deal_type?: string;
    currency?: string | null;
    stage?: string;
  } | null;
}

function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency === 'THB' ? 'THB' : currency === 'RUB' ? 'RUB' : currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function CommissionSummary({ deal }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const commission = useCommissionCalc(deal);

  if (!commission || commission.dealValue === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          {isRu ? 'Комиссия' : 'Commission'}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <p className="text-[11px] text-muted-foreground">{isRu ? 'Сумма сделки' : 'Deal Value'}</p>
          <p className="text-sm font-semibold">{formatMoney(commission.dealValue, commission.currency)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[11px] text-muted-foreground">{isRu ? 'Ставка' : 'Rate'}</p>
          <p className="text-sm font-semibold flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {commission.commissionRate}%
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[11px] text-muted-foreground">{isRu ? 'Ожидаемая' : 'Expected'}</p>
          <p className="text-sm font-bold text-primary">{formatMoney(commission.expectedAmount, commission.currency)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[11px] text-muted-foreground">{isRu ? 'Статус' : 'Status'}</p>
          <p className="text-sm font-medium flex items-center gap-1">
            {commission.isPaid ? (
              <><CheckCircle className="h-3 w-3 text-success" /><span className="text-success">{isRu ? 'Оплачено' : 'Paid'}</span></>
            ) : (
              <><Clock className="h-3 w-3 text-warning" /><span className="text-warning">{isRu ? 'Ожидание' : 'Pending'}</span></>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
