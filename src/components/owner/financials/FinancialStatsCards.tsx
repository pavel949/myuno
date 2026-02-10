import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface FinancialStatsCardsProps {
  stats: {
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
    thisMonthIncome: number;
    thisMonthExpenses: number;
  } | undefined;
  isRu: boolean;
}

export function FinancialStatsCards({ stats, isRu }: FinancialStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 mb-6">
      <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-500/20">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-green-600">
                ฿{((stats?.totalIncome || 0) / 1000).toFixed(1)}k
              </p>
              <p className="text-xs text-muted-foreground">
                {isRu ? 'Всего доходов' : 'Total Income'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-500/20">
              <TrendingDown className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-red-600">
                ฿{((stats?.totalExpenses || 0) / 1000).toFixed(1)}k
              </p>
              <p className="text-xs text-muted-foreground">
                {isRu ? 'Всего расходов' : 'Total Expenses'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-2 bg-gradient-to-br from-primary/10 to-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/20">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className={`text-2xl font-bold ${(stats?.netIncome || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ฿{((stats?.netIncome || 0) / 1000).toFixed(1)}k
                </p>
                <p className="text-xs text-muted-foreground">
                  {isRu ? 'Чистый доход' : 'Net Income'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">
                {isRu ? 'Этот месяц' : 'This Month'}
              </p>
              <p className="text-xs text-green-600">+฿{((stats?.thisMonthIncome || 0) / 1000).toFixed(1)}k</p>
              <p className="text-xs text-red-600">-฿{((stats?.thisMonthExpenses || 0) / 1000).toFixed(1)}k</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
