import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFinancialStats } from '@/hooks/usePropertyFinancials';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function FinancesSummary() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const isTh = language === 'th';
  const { data: stats, isLoading } = useFinancialStats();

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `฿${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `฿${Math.round(value / 1000)}K`;
    return `฿${Math.round(value)}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      </div>
    );
  }

  const income = stats?.thisMonthIncome || 0;
  const expenses = stats?.thisMonthExpenses || 0;
  const netProfit = income - expenses;

  return (
    <div data-tour="finances" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-base">
          {isRu ? 'Финансы' : isTh ? 'การเงิน' : 'Finances'}
        </h2>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate('/mc/financials')}>
          {isRu ? 'Подробнее' : isTh ? 'รายละเอียด' : 'Details'}
          <ChevronRight className="h-3 w-3 ml-1" />
        </Button>
      </div>

      {/* Main metrics */}
      <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
        {/* Income */}
        <Card className="p-4 bg-gradient-to-br from-success/5 to-transparent border-success/20">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="h-4 w-4 text-success" />
            <span className="text-xs text-muted-foreground">
              {isRu ? 'Доход' : isTh ? 'รายได้' : 'Income'}
            </span>
          </div>
          <p className="text-xl font-bold text-success">
            {formatCurrency(income)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isRu ? 'за месяц' : isTh ? 'เดือนนี้' : 'this month'}
          </p>
        </Card>

        {/* Expenses */}
        <Card className="p-4 bg-gradient-to-br from-destructive/5 to-transparent border-destructive/20">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingDown className="h-4 w-4 text-destructive" />
            <span className="text-xs text-muted-foreground">
              {isRu ? 'Расходы' : isTh ? 'รายจ่าย' : 'Expenses'}
            </span>
          </div>
          <p className="text-xl font-bold text-destructive">
            {formatCurrency(expenses)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isRu ? 'за месяц' : isTh ? 'เดือนนี้' : 'this month'}
          </p>
        </Card>
      </div>

      {/* Net profit bar */}
      <Card className={cn(
        "p-3 flex items-center justify-between",
        netProfit >= 0 ? "border-success/20" : "border-destructive/20"
      )}>
        <div>
          <span className="text-xs text-muted-foreground">
            {isRu ? 'Чистая прибыль' : isTh ? 'กำไรสุทธิ' : 'Net Profit'}
          </span>
          <p className={cn(
            "text-lg font-bold",
            netProfit >= 0 ? "text-success" : "text-destructive"
          )}>
            {netProfit >= 0 ? '+' : ''}{formatCurrency(netProfit)}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8"
          onClick={() => navigate('/mc/quick-expense')}
        >
          {isRu ? '+ Расход' : isTh ? '+ รายจ่าย' : '+ Expense'}
        </Button>
      </Card>
    </div>
  );
}
