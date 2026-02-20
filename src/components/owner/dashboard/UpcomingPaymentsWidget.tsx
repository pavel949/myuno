import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, AlertTriangle } from 'lucide-react';
import { format, isPast, differenceInDays } from 'date-fns';

export function UpcomingPaymentsWidget() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';

  const { data: payments } = useQuery({
    queryKey: ['upcoming-payments', user?.id],
    queryFn: async () => {
      // Get properties owned by user
      const { data, error } = await supabase
        .from('property_financials')
        .select('id, category, amount, currency, due_date, status, property_id, description')
        .eq('status', 'pending')
        .not('due_date', 'is', null)
        .lte('due_date', new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0])
        .order('due_date', { ascending: true })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  if (!payments?.length) return null;

  const overdue = payments.filter(p => p.due_date && isPast(new Date(p.due_date)));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 text-amber-500" />
        <h3 className="font-semibold text-sm">
          {isRu ? 'Предстоящие платежи' : 'Upcoming Payments'}
        </h3>
        {overdue.length > 0 && (
          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
            {overdue.length} {isRu ? 'просрочен' : 'overdue'}
          </Badge>
        )}
      </div>

      <div className="space-y-2">
        {payments.slice(0, 5).map(p => {
          const isOverdue = p.due_date && isPast(new Date(p.due_date));
          const days = p.due_date ? differenceInDays(new Date(p.due_date), new Date()) : 0;

          return (
            <Card key={p.id} className={`p-3 flex items-center gap-3 ${isOverdue ? 'border-red-300 dark:border-red-800' : ''}`}>
              {isOverdue && <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {p.description || p.category}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isOverdue
                    ? (isRu ? `Просрочено ${Math.abs(days)} дн.` : `${Math.abs(days)}d overdue`)
                    : days === 0
                      ? (isRu ? 'Сегодня' : 'Today')
                      : (isRu ? `Через ${days} дн.` : `In ${days}d`)}
                </p>
              </div>
              <span className="font-bold text-sm whitespace-nowrap">
                {Number(p.amount).toLocaleString()} {p.currency || '฿'}
              </span>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
