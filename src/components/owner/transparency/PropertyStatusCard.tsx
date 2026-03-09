import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { usePropertyActivityLog } from '@/hooks/usePropertyDelegates';
import { Card, CardContent } from '@/components/ui/card';
import { Home, User, CalendarDays, Wrench, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Props {
  propertyId: string;
}

export function PropertyStatusCard({ propertyId }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { user } = useAuth();
  const today = new Date().toISOString().slice(0, 10);

  // Current booking (active today)
  const { data: currentBookings = [] } = useSupabaseQuery<any>({
    table: 'property_bookings',
    select: 'id, guest_name, check_in, check_out, status',
    filters: [
      { column: 'property_id', value: propertyId },
      { column: 'check_in', value: today, operator: 'lte' },
      { column: 'check_out', value: today, operator: 'gte' },
    ],
    limit: 1,
    enabled: !!user && !!propertyId,
  });

  // Next upcoming booking
  const { data: nextBookings = [] } = useSupabaseQuery<any>({
    table: 'property_bookings',
    select: 'id, guest_name, check_in, status',
    filters: [
      { column: 'property_id', value: propertyId },
      { column: 'check_in', value: today, operator: 'gt' },
    ],
    orderBy: { column: 'check_in', ascending: true },
    limit: 1,
    enabled: !!user && !!propertyId,
  });

  // Open tasks count
  const { data: openTasks = [] } = useSupabaseQuery<any>({
    table: 'property_service_requests',
    select: 'id',
    filters: [
      { column: 'property_id', value: propertyId },
      { column: 'status', value: 'completed', operator: 'neq' },
    ],
    enabled: !!user && !!propertyId,
  });

  // Last activity
  const { data: activities = [] } = usePropertyActivityLog(propertyId, 1);

  const activeCurrent = currentBookings.filter((b: any) => b.status !== 'cancelled');
  const current = activeCurrent[0];
  const next = nextBookings.filter((b: any) => b.status !== 'cancelled')[0];
  const lastAction = activities[0];

  const isOccupied = !!current;

  return (
    <Card variant="elevated" className="overflow-hidden">
      {/* Status bar */}
      <div className={cn(
        "px-4 py-2.5 flex items-center gap-2",
        isOccupied ? "bg-success/15 text-success" : "bg-muted/50 text-muted-foreground"
      )}>
        <Home className="w-4 h-4" />
        <span className="text-sm font-semibold">
          {isOccupied
            ? (isRu ? 'Занят' : 'Occupied')
            : (isRu ? 'Свободен' : 'Vacant')}
        </span>
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Current guest */}
        {current && (
          <div className="flex items-center gap-2.5">
            <User className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{current.guest_name || (isRu ? 'Гость' : 'Guest')}</p>
              <p className="text-xs text-muted-foreground">
                {isRu ? 'до' : 'until'} {format(new Date(current.check_out_date), 'd MMM', { locale: isRu ? ru : undefined })}
              </p>
            </div>
          </div>
        )}

        {/* Next booking */}
        {next && (
          <div className="flex items-center gap-2.5">
            <CalendarDays className="w-4 h-4 text-info" />
            <div>
              <p className="text-xs text-muted-foreground">{isRu ? 'Следующее' : 'Next booking'}</p>
              <p className="text-sm font-medium">
                {next.guest_name} — {format(new Date(next.check_in_date), 'd MMM', { locale: isRu ? ru : undefined })}
              </p>
            </div>
          </div>
        )}

        {/* Open tasks */}
        <div className="flex items-center gap-2.5">
          <Wrench className="w-4 h-4 text-warning" />
          <p className="text-sm">
            <span className="font-semibold">{openTasks.length}</span>{' '}
            <span className="text-muted-foreground">{isRu ? 'открытых задач' : 'open tasks'}</span>
          </p>
        </div>

        {/* Last action */}
        {lastAction && (
          <div className="flex items-center gap-2.5 pt-2 border-t border-border/30">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">
                {isRu ? 'Последнее действие УК' : 'Last MC action'}
              </p>
              <p className="text-xs text-foreground truncate">
                {lastAction.action.replace(/_/g, ' ')} — {format(new Date(lastAction.created_at), 'd MMM HH:mm', { locale: isRu ? ru : undefined })}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
