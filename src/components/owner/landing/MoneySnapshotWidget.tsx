import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useFinancialStats } from '@/hooks/usePropertyFinancials';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Wallet, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MoneySnapshotWidget() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { currencyInfo, convertPrice } = useCurrency();
  const isRu = language === 'ru';
  const { data: stats, isLoading } = useFinancialStats();

  const formatCurrency = (valueInTHB: number) => {
    const converted = convertPrice(valueInTHB);
    const symbol = currencyInfo.symbol;
    if (converted >= 1000000) return `${symbol}${(converted / 1000000).toFixed(1)}M`;
    if (converted >= 1000) return `${symbol}${(converted / 1000).toFixed(0)}K`;
    return `${symbol}${converted.toFixed(0)}`;
  };

  if (isLoading) {
    return (
      <Card className="cursor-pointer">
        <CardContent className="p-4">
          <Skeleton className="h-5 w-32 mb-3" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const income = stats?.thisMonthIncome || 0;
  const expenses = stats?.thisMonthExpenses || 0;
  const netProfit = income - expenses;

  const currentMonth = new Date().toLocaleDateString(isRu ? 'ru-RU' : 'en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all active:scale-[0.99]"
      onClick={() => navigate('/owner/financials')}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium capitalize">{currentMonth}</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Income & Expenses */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="p-3 rounded-xl bg-success/10 border border-success/20">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-success" />
              <span className="text-xs text-muted-foreground">
                {isRu ? 'Доход' : 'Income'}
              </span>
            </div>
            <p className="text-lg font-bold text-success">{formatCurrency(income)}</p>
          </div>
          
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown className="h-3.5 w-3.5 text-destructive" />
              <span className="text-xs text-muted-foreground">
                {isRu ? 'Расходы' : 'Expenses'}
              </span>
            </div>
            <p className="text-lg font-bold text-destructive">{formatCurrency(expenses)}</p>
          </div>
        </div>

        {/* Net Profit */}
        <div className={cn(
          "p-3 rounded-xl text-center",
          netProfit >= 0 ? "bg-primary/10" : "bg-destructive/10"
        )}>
          <span className="text-xs text-muted-foreground">
            {isRu ? 'Чистая прибыль' : 'Net Profit'}
          </span>
          <p className={cn(
            "text-xl font-bold",
            netProfit >= 0 ? "text-primary" : "text-destructive"
          )}>
            {netProfit >= 0 ? '+' : ''}{formatCurrency(netProfit)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
