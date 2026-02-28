import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useFinancialStats } from '@/hooks/usePropertyFinancials';
import { useDepositStats } from '@/hooks/useDepositStats';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, ArrowRight, TrendingUp, TrendingDown, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MoneyBlock() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { currencyInfo, convertPrice } = useCurrency();
  const isRu = language === 'ru';
  const { data: stats, isLoading } = useFinancialStats();
  const { data: depositStats, isLoading: depositsLoading } = useDepositStats();

  const formatCurrency = (valueInTHB: number) => {
    const converted = convertPrice(valueInTHB);
    const symbol = currencyInfo.symbol;
    if (converted >= 1000000) return `${symbol}${(converted / 1000000).toFixed(1)}M`;
    if (converted >= 1000) return `${symbol}${(converted / 1000).toFixed(0)}K`;
    return `${symbol}${converted.toFixed(0)}`;
  };

  if (isLoading || depositsLoading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-3">
          <Skeleton className="h-5 w-24 mb-2" />
          <Skeleton className="h-10 w-32 mb-3" />
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const income = stats?.thisMonthIncome || 0;
  const expenses = stats?.thisMonthExpenses || 0;
  const netProfit = income - expenses;

  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-md transition-all"
      onClick={() => navigate('/owner/financials')}
    >
      <CardContent className="p-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">{isRu ? 'ФИНАНСЫ' : 'FINANCES'}</span>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
        </div>

        {/* Net profit - hero metric */}
        <div className="mb-3">
          <p className={cn(
            "text-3xl font-bold tracking-tight",
            netProfit >= 0 ? "text-success" : "text-destructive"
          )}>
            {netProfit >= 0 ? '+' : ''}{formatCurrency(netProfit)}
          </p>
          <p className="text-xs text-muted-foreground">
            {isRu ? 'чистая прибыль' : 'net profit'}
          </p>
        </div>

        {/* Stats grid - 3 columns */}
        <div className="grid grid-cols-3 gap-2">
          {/* Income */}
          <div className="p-2 rounded-lg bg-success/5 border border-success/10">
            <div className="flex items-center gap-1 mb-0.5">
              <TrendingUp className="h-3 w-3 text-success" />
              <span className="text-[10px] text-muted-foreground uppercase">{isRu ? 'Доход' : 'Income'}</span>
            </div>
            <p className="text-sm font-semibold text-success">{formatCurrency(income)}</p>
          </div>

          {/* Expenses */}
          <div className="p-2 rounded-lg bg-destructive/5 border border-destructive/10">
            <div className="flex items-center gap-1 mb-0.5">
              <TrendingDown className="h-3 w-3 text-destructive" />
              <span className="text-[10px] text-muted-foreground uppercase">{isRu ? 'Расход' : 'Expenses'}</span>
            </div>
            <p className="text-sm font-semibold text-destructive">{formatCurrency(expenses)}</p>
          </div>

          {/* Deposits */}
          <div className="p-2 rounded-lg bg-info/5 border border-info/10">
            <div className="flex items-center gap-1 mb-0.5">
              <Shield className="h-3 w-3 text-info" />
              <span className="text-[10px] text-muted-foreground uppercase">{isRu ? 'Депозит' : 'Deposits'}</span>
            </div>
            <p className="text-sm font-semibold">
              {depositStats ? formatCurrency(depositStats.totalHeld) : `${currencyInfo.symbol}0`}
            </p>
            {depositStats && depositStats.pendingReturn > 0 && (
              <p className="text-[10px] text-warning">{depositStats.pendingReturn} {isRu ? 'к возврату' : 'pending'}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
