import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarDays, User, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface OwnerBookingsTabProps {
  propertyId: string;
}

const STATUS_STYLES: Record<string, string> = {
  confirmed: 'bg-success/10 text-success',
  active: 'bg-info/10 text-info',
  completed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-destructive/10 text-destructive',
  pending: 'bg-warning/10 text-warning',
};

export function OwnerBookingsTab({ propertyId }: OwnerBookingsTabProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { user } = useAuth();

  const { data: bookings = [], isLoading } = useSupabaseQuery<any>({
    table: 'property_bookings',
    select: 'id, guest_name, check_in_date, check_out_date, total_price, currency, status, source, nights',
    filters: [{ column: 'property_id', value: propertyId }],
    orderBy: { column: 'check_in_date', ascending: false },
    limit: 50,
    enabled: !!user && !!propertyId,
  });

  if (isLoading) {
    return <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />)}</div>;
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        {isRu ? 'Нет бронирований' : 'No bookings'}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bookings.map((b: any) => (
        <Card key={b.id} variant="content">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{b.guest_name || (isRu ? 'Гость' : 'Guest')}</span>
              </div>
              <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", STATUS_STYLES[b.status] || STATUS_STYLES.pending)}>
                {b.status}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5" />
                {format(new Date(b.check_in_date), 'd MMM', { locale: isRu ? ru : undefined })} → {format(new Date(b.check_out_date), 'd MMM', { locale: isRu ? ru : undefined })}
                {b.nights && ` (${b.nights} ${isRu ? 'н.' : 'n.'})`}
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" />
                ฿{b.total_price?.toLocaleString()}
              </div>
              {b.source && <span className="text-[11px] bg-muted px-1.5 py-0.5 rounded">{b.source}</span>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
