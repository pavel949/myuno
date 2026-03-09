import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, TrendingDown, CalendarCheck, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OwnerKPISummaryProps {
  propertyId: string;
}

export function OwnerKPISummary({ propertyId }: OwnerKPISummaryProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { user } = useAuth();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

  // Fetch financials for this property this month
  const { data: financials = [] } = useSupabaseQuery<any>({
    table: 'property_financials',
    select: 'transaction_type, amount',
    filters: [
      { column: 'property_id', value: propertyId },
      { column: 'transaction_date', value: monthStart, operator: 'gte' },
      { column: 'transaction_date', value: monthEnd, operator: 'lte' },
    ],
    enabled: !!user && !!propertyId,
  });

  // Fetch bookings for occupancy
  const { data: bookings = [] } = useSupabaseQuery<any>({
    table: 'property_bookings',
    select: 'check_in, check_out, status',
    filters: [
      { column: 'property_id', value: propertyId },
      { column: 'check_in', value: monthEnd, operator: 'lte' },
      { column: 'check_out', value: monthStart, operator: 'gte' },
    ],
    enabled: !!user && !!propertyId,
  });

  const totalIncome = financials
    .filter((f: any) => f.transaction_type === 'income')
    .reduce((sum: number, f: any) => sum + Number(f.amount || 0), 0);

  const totalExpenses = financials
    .filter((f: any) => f.transaction_type === 'expense')
    .reduce((sum: number, f: any) => sum + Number(f.amount || 0), 0);

  // Simple occupancy: count days booked / days in month
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const bookedDays = bookings
    .filter((b: any) => b.status !== 'cancelled')
    .reduce((days: number, b: any) => {
      const ci = new Date(Math.max(new Date(b.check_in).getTime(), new Date(monthStart).getTime()));
      const co = new Date(Math.min(new Date(b.check_out).getTime(), new Date(monthEnd).getTime()));
      return days + Math.max(0, Math.ceil((co.getTime() - ci.getTime()) / 86400000));
    }, 0);
  const occupancy = daysInMonth > 0 ? Math.round((bookedDays / daysInMonth) * 100) : 0;

  const cards = [
    {
      icon: DollarSign,
      label: isRu ? 'Доход' : 'Revenue',
      value: `฿${totalIncome.toLocaleString()}`,
      color: 'text-success bg-success/15',
    },
    {
      icon: TrendingDown,
      label: isRu ? 'Расходы' : 'Expenses',
      value: `฿${totalExpenses.toLocaleString()}`,
      color: 'text-destructive bg-destructive/15',
    },
    {
      icon: CalendarCheck,
      label: isRu ? 'Загрузка' : 'Occupancy',
      value: `${occupancy}%`,
      color: 'text-info bg-info/15',
    },
    {
      icon: Star,
      label: isRu ? 'Рейтинг' : 'Rating',
      value: '—',
      color: 'text-warning bg-warning/15',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label} variant="content" className="p-0">
            <CardContent className="p-3 flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", card.color)}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="text-lg font-bold text-foreground leading-tight">{card.value}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
