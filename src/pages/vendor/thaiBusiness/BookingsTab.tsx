/**
 * BookingsTab — owner views/acts on incoming bookings (confirm / decline /
 * reschedule). Grouped by date as a lightweight calendar view.
 */
import { useMemo, useState } from 'react';
import { Check, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBusinessBookings, useUpdateThaiBookingStatus } from '@/hooks/thaiServices/useThaiServices';
import { THAI_BOOKING_STATUS_LABELS, canTransition } from '@/lib/thaiServices/booking';
import type { ThaiBooking, ThaiBookingStatus } from '@/types/thaiBusiness';

export function BookingsTab({ businessId }: { businessId: string }) {
  const { t, language } = useLanguage();
  const { data: bookings = [], isLoading } = useBusinessBookings(businessId);
  const update = useUpdateThaiBookingStatus();
  const [statusFilter, setStatusFilter] = useState<ThaiBookingStatus | 'all'>('all');
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [newTime, setNewTime] = useState('');

  const filtered = bookings.filter((b) => statusFilter === 'all' || b.status === statusFilter);
  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  if (isLoading) return <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>;

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex flex-wrap gap-2">
        {(['all', 'requested', 'confirmed', 'completed', 'cancelled'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`text-sm rounded-full border px-3 py-1.5 ${statusFilter === f ? 'border-primary bg-primary/10 text-primary' : 'border-border text-foreground'}`}
          >
            {f === 'all' ? 'Все' : (language === 'ru' ? THAI_BOOKING_STATUS_LABELS[f].ru : THAI_BOOKING_STATUS_LABELS[f].en)}
          </button>
        ))}
      </div>

      {grouped.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">{t('thai.empty')}</p>
      ) : (
        grouped.map(([date, items]) => (
          <div key={date} className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase">{date}</p>
            {items.map((b) => {
              const status = THAI_BOOKING_STATUS_LABELS[b.status];
              return (
                <div key={b.id} className="border border-border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant={b.status === 'cancelled' ? 'destructive' : 'secondary'}>
                      {language === 'ru' ? status.ru : status.en}
                    </Badge>
                    <span className="font-mono text-sm">฿{b.total_amount_thb.toLocaleString()}</span>
                  </div>
                  {b.date_time && <p className="text-sm text-muted-foreground">{new Date(b.date_time).toLocaleString()}</p>}
                  {b.notes && <p className="text-xs text-muted-foreground">{b.notes}</p>}

                  {rescheduleId === b.id ? (
                    <div className="flex gap-2">
                      <Input type="datetime-local" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="flex-1" />
                      <Button size="sm" disabled={!newTime} onClick={() => { update.mutate({ id: b.id, date_time: new Date(newTime).toISOString() }); setRescheduleId(null); }}>OK</Button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {canTransition(b.status, 'confirmed') && (
                        <Button size="sm" onClick={() => update.mutate({ id: b.id, status: 'confirmed' })}>
                          <Check className="w-4 h-4 mr-1" />{t('thai.owner.bookings.confirm')}
                        </Button>
                      )}
                      {canTransition(b.status, 'completed') && (
                        <Button size="sm" variant="outline" onClick={() => update.mutate({ id: b.id, status: 'completed' })}>
                          {language === 'ru' ? 'Завершить' : 'Complete'}
                        </Button>
                      )}
                      {canTransition(b.status, 'cancelled') && (
                        <Button size="sm" variant="ghost" onClick={() => update.mutate({ id: b.id, status: 'cancelled' })}>
                          <X className="w-4 h-4 mr-1" />{t('thai.owner.bookings.decline')}
                        </Button>
                      )}
                      {b.status !== 'cancelled' && b.status !== 'completed' && (
                        <Button size="sm" variant="ghost" onClick={() => { setRescheduleId(b.id); setNewTime(''); }}>
                          <Clock className="w-4 h-4 mr-1" />{t('thai.owner.bookings.reschedule')}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}

function groupByDate(bookings: ThaiBooking[]): [string, ThaiBooking[]][] {
  const map = new Map<string, ThaiBooking[]>();
  for (const b of bookings) {
    const key = b.date_time ? new Date(b.date_time).toLocaleDateString() : '—';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(b);
  }
  return Array.from(map.entries());
}
