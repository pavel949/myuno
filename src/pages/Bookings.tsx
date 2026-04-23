import React, { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Package, Scissors, Home, Car, Ship, Ticket, Flower2, Stethoscope, Clock, ChevronRight, Dumbbell, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { PremiumButton } from '@/components/uno/PremiumButton';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { BookingListSkeleton } from '@/components/ui/page-skeletons';
import { EmptyState } from '@/components/uno/EmptyState';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { toast } from 'sonner';
import { BookingStatusTimeline, BookingStatusTimelineSkeleton, type BookingStatusEvent } from '@/components/bookings/BookingStatusTimeline';
import { cn } from '@/lib/utils';

interface BookingItem {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  date: string;
  createdAt: string;
  status: string;
  total: number;
  currency: string;
  image?: string;
}

const getBookingIcon = (type: string) => {
  switch (type) {
    case 'beauty': return Scissors;
    case 'service': return Package;
    case 'food': return Package;
    case 'flower': return Flower2;
    case 'transport': return Car;
    case 'tour': return Ticket;
    case 'event': return Ticket;
    case 'property': return Home;
    case 'water': return Ship;
    case 'medical': return Stethoscope;
    case 'fitness': return Dumbbell;
    default: return Calendar;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed': return 'bg-success/10 text-success border-success/20';
    case 'pending':
    case 'submitted': return 'bg-warning/10 text-warning border-warning/20';
    case 'completed': return 'bg-info/10 text-info border-info/20';
    case 'cancelled':
    case 'cancelled_by_user':
    case 'cancelled_by_provider': return 'bg-destructive/10 text-destructive border-destructive/20';
    default: return 'bg-muted text-muted-foreground';
  }
};

const getStatusLabel = (status: string, language: string) => {
  const labels: Record<string, { en: string; ru: string }> = {
    pending: { en: 'Pending', ru: 'Ожидает' },
    submitted: { en: 'Submitted', ru: 'Отправлено' },
    confirmed: { en: 'Confirmed', ru: 'Подтверждено' },
    completed: { en: 'Completed', ru: 'Завершено' },
    cancelled: { en: 'Cancelled', ru: 'Отменено' },
    cancelled_by_user: { en: 'Cancelled', ru: 'Отменено' },
    cancelled_by_provider: { en: 'Declined', ru: 'Отклонено' },
    in_progress: { en: 'In Progress', ru: 'В процессе' },
  };
  return labels[status]?.[language === 'ru' ? 'ru' : 'en'] || status;
};

const getBookingTypeLabel = (type: string, language: string) => {
  const labels: Record<string, { en: string; ru: string }> = {
    beauty: { en: 'Beauty', ru: 'Красота' },
    service: { en: 'Service', ru: 'Услуга' },
    food: { en: 'Food', ru: 'Еда' },
    flower: { en: 'Flowers', ru: 'Цветы' },
    transport: { en: 'Transport', ru: 'Транспорт' },
    tour: { en: 'Tour', ru: 'Тур' },
    event: { en: 'Event', ru: 'Событие' },
    property: { en: 'Property', ru: 'Недвижимость' },
    water: { en: 'Water', ru: 'Водный спорт' },
    medical: { en: 'Medical', ru: 'Медицина' },
    fitness: { en: 'Fitness', ru: 'Фитнес' },
  };
  return labels[type]?.[language === 'ru' ? 'ru' : 'en'] || type;
};

export default function Bookings() {
  const { t, language } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [statusHistory, setStatusHistory] = useState<Record<string, BookingStatusEvent[]>>({});
  const [expandedTimelines, setExpandedTimelines] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const loadBookings = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    setLoadError(false);
    try {
      // Load ALL bookings from unified table only
      const { data: allBookingsData, error } = await supabase
        .from('bookings')
        .select('*, booking_items(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedBookings: BookingItem[] = (allBookingsData || []).map((b) => {
        const items = b.booking_items || [];
        const firstItem = items[0];
        return {
          id: b.id,
          type: b.booking_type,
          title: firstItem?.item_name || getBookingTypeLabel(b.booking_type, language),
          subtitle: getBookingTypeLabel(b.booking_type, language),
          date: b.scheduled_at || b.created_at,
          createdAt: b.created_at,
          status: b.status,
          total: b.total_amount || 0,
          currency: b.currency || 'THB',
        };
      });

      setBookings(formattedBookings);

      // Batch-fetch status history for all bookings (RLS limits to user's own).
      const bookingIds = formattedBookings.map((b) => b.id);
      if (bookingIds.length > 0) {
        const { data: historyRows, error: historyError } = await supabase
          .from('booking_status_history')
          .select('id, booking_id, from_status, to_status, notes, created_at')
          .in('booking_id', bookingIds)
          .order('created_at', { ascending: true });

        if (!historyError && historyRows) {
          const grouped: Record<string, BookingStatusEvent[]> = {};
          for (const row of historyRows) {
            if (!grouped[row.booking_id]) grouped[row.booking_id] = [];
            grouped[row.booking_id].push({
              id: row.id,
              from_status: row.from_status,
              to_status: row.to_status,
              notes: row.notes,
              created_at: row.created_at,
            });
          }
          setStatusHistory(grouped);
        }
      } else {
        setStatusHistory({});
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      setLoadError(true);
      toast.error(language === 'ru' ? 'Не удалось загрузить бронирования' : 'Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  }, [user, language]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadBookings();
    }
  }, [user, loadBookings]);

  const handleRefresh = useCallback(async () => {
    await loadBookings();
  }, [loadBookings]);

  const toggleTimeline = useCallback((bookingId: string) => {
    setExpandedTimelines((prev) => ({ ...prev, [bookingId]: !prev[bookingId] }));
  }, []);

  if (authLoading || isLoading) {
    return (
      <AppLayout>
        <BookingListSkeleton />
      </AppLayout>
    );
  }

  if (!user) {
    return null;
  }

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, 'd MMM yyyy', { locale: language === 'ru' ? ru : enUS });
    } catch {
      return dateStr;
    }
  };

  return (
    <AppLayout>
      <PullToRefresh onRefresh={handleRefresh} className="min-h-0 flex-1 h-[calc(100vh-8rem)]">
        <PageContainer>
          <PageHeader title={t('nav.bookings')} />
          
          {loadError ? (
            <EmptyState
              icon={AlertCircle}
              title={language === 'ru' ? 'Ошибка загрузки' : 'Failed to load'}
              description={language === 'ru' ? 'Потяните вниз, чтобы повторить' : 'Pull down to retry'}
              action={
                <PremiumButton onClick={loadBookings}>
                  {language === 'ru' ? 'Повторить' : 'Retry'}
                </PremiumButton>
              }
            />
          ) : bookings.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title={t('booking.noBookings')}
              description={t('booking.noBookingsDesc')}
              action={
                <PremiumButton onClick={() => navigate('/discover')}>
                  {t('nav.discover')}
                </PremiumButton>
              }
            />
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => {
                const Icon = getBookingIcon(booking.type);
                const isExpanded = !!expandedTimelines[booking.id];
                const events = statusHistory[booking.id] ?? [];
                return (
                  <div
                    key={booking.id}
                    className="bg-card border border-border rounded-xl hover:border-primary/30 transition-all"
                  >
                    {/* Card body */}
                    <div
                      onClick={() => navigate(`/bookings/${booking.id}`)}
                      className="p-4 cursor-pointer"
                    >
                      <div className="flex gap-3">
                        <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-medium truncate">{booking.title}</h3>
                            <Badge className={`shrink-0 ${getStatusColor(booking.status)}`}>
                              {getStatusLabel(booking.status, language)}
                            </Badge>
                          </div>
                          {booking.subtitle && (
                            <p className="text-sm text-muted-foreground capitalize">{booking.subtitle}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{formatDate(booking.date)}</span>
                            </div>
                            {booking.total > 0 && (
                              <span className="font-medium text-foreground">
                                ฿{booking.total.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 self-center" />
                      </div>
                    </div>

                    {/* Timeline toggle + content */}
                    <div className="border-t border-border/60">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTimeline(booking.id);
                        }}
                        aria-expanded={isExpanded}
                        aria-controls={`timeline-${booking.id}`}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors min-h-[44px]"
                      >
                        <span className="uppercase tracking-[0.08em]">
                          {language === 'ru' ? 'История статусов' : 'Status timeline'}
                          {events.length > 0 && (
                            <span className="ml-1.5 text-muted-foreground/60 normal-case tracking-normal">
                              · {events.length}
                            </span>
                          )}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" aria-hidden="true" />
                        ) : (
                          <ChevronDown className="w-4 h-4" aria-hidden="true" />
                        )}
                      </button>
                      <div
                        id={`timeline-${booking.id}`}
                        className={cn(
                          'grid transition-[grid-template-rows] duration-200 ease-out',
                          isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                        )}
                      >
                        <div className="overflow-hidden">
                          <div className="px-4 pb-4 pt-1">
                            <BookingStatusTimeline
                              events={events}
                              currentStatus={booking.status}
                              createdAt={booking.createdAt}
                              compact
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </PageContainer>
      </PullToRefresh>
    </AppLayout>
  );
}
