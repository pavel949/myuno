import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, CreditCard, Wallet } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function ControlFinanceTab() {
  const { language } = useLanguage();
  const isRussian = language === 'ru';

  const { data: financeStats } = useQuery({
    queryKey: ['admin-finance-overview'],
    queryFn: async () => {
      // Get property financials instead of platform orders for proper MC revenue tracking
      const { data: financials } = await supabase
        .from('property_financials')
        .select('amount, transaction_type, currency');
      
      const totalRevenue = financials
        ?.filter(f => f.transaction_type === 'income')
        .reduce((sum, f) => sum + (f.amount || 0), 0) || 0;
      
      const totalExpenses = financials
        ?.filter(f => f.transaction_type === 'expense')
        .reduce((sum, f) => sum + (f.amount || 0), 0) || 0;
      
      return {
        revenue: totalRevenue,
        expenses: totalExpenses,
        transactions: financials?.length || 0,
      };
    }
  });

  const metrics = [
    { 
      label: isRussian ? 'Общий доход' : 'Total Revenue', 
      value: `$${(financeStats?.revenue || 0).toLocaleString()}`, 
      icon: DollarSign, 
      color: 'text-success' 
    },
    { 
      label: isRussian ? 'Транзакции' : 'Transactions', 
      value: financeStats?.transactions || 0, 
      icon: CreditCard, 
      color: 'text-info' 
    },
    { 
      label: isRussian ? 'Комиссия' : 'Commission', 
      value: `$${Math.round((financeStats?.revenue || 0) * 0.1).toLocaleString()}`, 
      icon: TrendingUp, 
      color: 'text-accent-purple' 
    },
    { 
      label: isRussian ? 'Выплаты' : 'Payouts', 
      value: `$${Math.round((financeStats?.revenue || 0) * 0.9).toLocaleString()}`, 
      icon: Wallet, 
      color: 'text-accent-amber' 
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                  <metric.icon className={`h-5 w-5 ${metric.color}`} />
                </div>
                <div>
                  <p className="text-xl font-bold">{metric.value}</p>
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {isRussian ? 'Финансовый обзор' : 'Finance Overview'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            {isRussian 
              ? 'Подробная финансовая аналитика' 
              : 'Detailed financial analytics'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
