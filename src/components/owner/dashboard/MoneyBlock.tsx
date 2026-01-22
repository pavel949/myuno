import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFinancialStats } from '@/hooks/usePropertyFinancials';
import { useDepositStats } from '@/hooks/useDepositStats';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Wallet, ArrowRight, TrendingUp, TrendingDown, Receipt, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MoneyBlock() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: stats, isLoading } = useFinancialStats();
  const { data: depositStats, isLoading: depositsLoading } = useDepositStats();

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `฿${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `฿${(value / 1000).toFixed(0)}K`;
    return `฿${value.toFixed(0)}`;
  };

  if (isLoading || depositsLoading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <Skeleton className="h-6 w-32 mb-3" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const income = stats?.thisMonthIncome || 0;
  const expenses = stats?.thisMonthExpenses || 0;
  const netProfit = income - expenses;
  const maxValue = Math.max(income, expenses) || 1;
  const incomePercent = (income / maxValue) * 100;
  const expensePercent = (expenses / maxValue) * 100;

  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate('/owner/financials')}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-muted-foreground" />
            <span className="font-semibold">{isRu ? 'Деньги' : 'Money'}</span>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Net profit */}
        <div className="mb-4">
          <p className={cn(
            "text-2xl font-bold",
            netProfit >= 0 ? "text-success" : "text-destructive"
          )}>
            {netProfit >= 0 ? '+' : ''}{formatCurrency(netProfit)}
          </p>
          <p className="text-xs text-muted-foreground">
            {isRu ? 'чистая прибыль за месяц' : 'net profit this month'}
          </p>
        </div>

        {/* Income/Expense bars */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-success shrink-0" />
            <div className="flex-1">
              <Progress value={incomePercent} className="h-2 bg-muted [&>div]:bg-success" />
            </div>
            <span className="text-xs font-medium w-16 text-right text-success">
              {formatCurrency(income)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingDown className="h-3.5 w-3.5 text-destructive shrink-0" />
            <div className="flex-1">
              <Progress value={expensePercent} className="h-2 bg-muted [&>div]:bg-destructive" />
            </div>
            <span className="text-xs font-medium w-16 text-right text-destructive">
              {formatCurrency(expenses)}
            </span>
          </div>
        </div>

        {/* Deposits indicator */}
        {depositStats && depositStats.totalHeld > 0 && (
          <div className="flex items-center gap-2 mb-4 p-2 rounded-lg bg-muted/50">
            <Shield className="h-4 w-4 text-info shrink-0" />
            <div className="flex-1">
              <span className="text-xs text-muted-foreground">
                {isRu ? 'Депозиты' : 'Deposits held'}
              </span>
            </div>
            <span className="text-sm font-medium">
              {formatCurrency(depositStats.totalHeld)}
            </span>
            {depositStats.pendingReturn > 0 && (
              <span className="text-xs text-warning">
                ({depositStats.pendingReturn} {isRu ? 'к возврату' : 'pending'})
              </span>
            )}
          </div>
        )}

        {/* Main action */}
        <Button 
          variant="outline"
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            navigate('/owner/expenses/quick');
          }}
        >
          <Receipt className="h-4 w-4 mr-2" />
          {isRu ? 'Записать расход' : 'Record expense'}
        </Button>
      </CardContent>
    </Card>
  );
}
