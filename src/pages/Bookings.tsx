import React, { useEffect, useCallback, useState, useRef } from 'react';
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
import { RealtimeIndicator, type RealtimeStatus } from '@/components/bookings/RealtimeIndicator';
import {
  getCachedStatusHistory,
  setCachedStatusHistory,
  updateCachedStatusHistory,
  invalidateStatusHistoryCache,
} from '@/lib/bookings/statusHistoryCache';
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
  // Per-booking loading: only the bookings whose ids are in this set show a
  // skeleton/spinner. Other timelines stay idle.
  const [loadingHistoryIds, setLoadingHistoryIds] = useState<Set<string>>(new Set());
  // Tracks which booking ids we've already fetched (or hydrated from cache),
  // so re-expanding a timeline doesn't trigger a refetch.
  const loadedHistoryIdsRef = useRef<Set<string>>(new Set());
  const [expandedTimelines, setExpandedTimelines] = useState<Record<string, boolean>>({});
  const [highlightedEventIds, setHighlightedEventIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>('connecting');
  const highlightTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Cleanup any pending highlight timers on unmount.
  useEffect(() => {
    return () => {
      highlightTimersRef.current.forEach((t) => clearTimeout(t));
      highlightTimersRef.current.clear();
    };
  }, []);

  const loadBookings = useCallback(async (forceRefresh = false) => {
    if (!user) return;

    setIsLoading(true);
    setLoadError(false);

    // Hydrate from cache immediately on cache hit — avoids a flash of skeleton
    // and a refetch when the user returns to the screen within the TTL window.
    const cached = forceRefresh ? null : getCachedStatusHistory(user.id);
    if (cached) {
      setStatusHistory(cached);
      // Mark every cached booking id as already-loaded so re-expanding skips
      // the network entirely.
      loadedHistoryIdsRef.current = new Set(Object.keys(cached));
    } else {
      setStatusHistory({});
      loadedHistoryIdsRef.current = new Set();
    }

    try {
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
      setIsLoading(false);
      // Status history is now fetched lazily per booking via loadHistoryFor()
      // when the user expands a timeline.
    } catch (error) {
      console.error('Error loading bookings:', error);
      setLoadError(true);
      toast.error(language === 'ru' ? 'Не удалось загрузить бронирования' : 'Failed to load bookings');
      setIsLoading(false);
    }
  }, [user, language]);

  /**
   * Lazily fetch status history for a single booking. No-op if we already have
   * it (either from a previous fetch or hydrated from the module-level cache).
   * Only this booking's loading flag flips — other timelines stay idle.
   */
  const loadHistoryFor = useCallback(async (bookingId: string) => {
    if (!user) return;
    if (loadedHistoryIdsRef.current.has(bookingId)) return;
    if (loadingHistoryIds.has(bookingId)) return;

    setLoadingHistoryIds((prev) => {
      if (prev.has(bookingId)) return prev;
      const next = new Set(prev);
      next.add(bookingId);
      return next;
    });

    try {
      const { data: historyRows, error } = await supabase
        .from('booking_status_history')
        .select('id, booking_id, from_status, to_status, notes, created_at')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const events: BookingStatusEvent[] = (historyRows || []).map((row) => ({
        id: row.id,
        from_status: row.from_status,
        to_status: row.to_status,
        notes: row.notes,
        created_at: row.created_at,
      }));

      setStatusHistory((prev) => ({ ...prev, [bookingId]: events }));
      // Mirror into the module-level cache so a remount skips the network.
      updateCachedStatusHistory(user.id, (prev) => ({ ...prev, [bookingId]: events }));
      loadedHistoryIdsRef.current.add(bookingId);
    } catch (error) {
      console.error('Error loading status history:', error);
    } finally {
      setLoadingHistoryIds((prev) => {
        if (!prev.has(bookingId)) return prev;
        const next = new Set(prev);
        next.delete(bookingId);
        return next;
      });
    }
  }, [user, loadingHistoryIds]);

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

  // Keep a stable ref to the latest bookings list for the realtime handlers
  // (so we can filter incoming events without resubscribing on every change).
  const bookingsRef = useRef<BookingItem[]>([]);
  useEffect(() => {
    bookingsRef.current = bookings;
  }, [bookings]);

  // Realtime: keep status history + booking status fresh while screen is open.
  useEffect(() => {
    if (!user) return;

    setRealtimeStatus('connecting');

    const channel = supabase
      .channel(`bookings-realtime-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'booking_status_history',
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            booking_id: string;
            from_status: string | null;
            to_status: string;
            notes: string | null;
            created_at: string;
          };
          // Only react to events for bookings currently rendered (RLS already
          // limits us to the user's own rows, but this avoids cross-user noise).
          if (!bookingsRef.current.some((b) => b.id === row.booking_id)) return;

          const newEvent: BookingStatusEvent = {
            id: row.id,
            from_status: row.from_status,
            to_status: row.to_status,
            notes: row.notes,
            created_at: row.created_at,
          };

          setStatusHistory((prev) => {
            const existing = prev[row.booking_id] ?? [];
            if (existing.some((e) => e.id === row.id)) return prev;
            const next = [...existing, newEvent].sort(
              (a, b) =>
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
            );
            return { ...prev, [row.booking_id]: next };
          });

          // Mirror the same merge into the module-level cache so the next
          // mount of the screen sees the realtime event without refetching.
          updateCachedStatusHistory(user.id, (prev) => {
            const existing = prev[row.booking_id] ?? [];
            if (existing.some((e) => e.id === row.id)) return prev;
            const next = [...existing, newEvent].sort(
              (a, b) =>
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
            );
            return { ...prev, [row.booking_id]: next };
          });

          // Auto-expand the timeline so the user can see the new event flash in.
          setExpandedTimelines((prev) =>
            prev[row.booking_id] ? prev : { ...prev, [row.booking_id]: true },
          );

          // Mark the new event as highlighted; clear after the animation completes.
          setHighlightedEventIds((prev) => {
            if (prev.has(row.id)) return prev;
            const next = new Set(prev);
            next.add(row.id);
            return next;
          });
          const existingTimer = highlightTimersRef.current.get(row.id);
          if (existingTimer) clearTimeout(existingTimer);
          const timer = setTimeout(() => {
            setHighlightedEventIds((prev) => {
              if (!prev.has(row.id)) return prev;
              const next = new Set(prev);
              next.delete(row.id);
              return next;
            });
            highlightTimersRef.current.delete(row.id);
          }, 2600);
          highlightTimersRef.current.set(row.id, timer);
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const row = payload.new as { id: string; status: string };
          setBookings((prev) =>
            prev.map((b) => (b.id === row.id ? { ...b, status: row.status } : b)),
          );
        },
      )
      .subscribe((status) => {
        // Map Supabase channel statuses to a simple 3-state UI indicator.
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('live');
        } else if (
          status === 'CHANNEL_ERROR' ||
          status === 'TIMED_OUT' ||
          status === 'CLOSED'
        ) {
          setRealtimeStatus('offline');
        } else {
          setRealtimeStatus('connecting');
        }
      });

    return () => {
      supabase.removeChannel(channel);
      setRealtimeStatus('connecting');
    };
  }, [user]);

  const handleRefresh = useCallback(async () => {
    // Pull-to-refresh bypasses the cache so users always get fresh data.
    if (user) invalidateStatusHistoryCache(user.id);
    loadedHistoryIdsRef.current = new Set();
    await loadBookings(true);
  }, [loadBookings, user]);

  const handleRetry = useCallback(() => {
    if (user) invalidateStatusHistoryCache(user.id);
    loadedHistoryIdsRef.current = new Set();
    void loadBookings(true);
  }, [loadBookings, user]);

  const toggleTimeline = useCallback((bookingId: string) => {
    setExpandedTimelines((prev) => {
      const next = { ...prev, [bookingId]: !prev[bookingId] };
      // If we're expanding, kick off a lazy fetch for this booking only.
      if (next[bookingId]) {
        void loadHistoryFor(bookingId);
      }
      return next;
    });
  }, [loadHistoryFor]);

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
          <PageHeader
            title={t('nav.bookings')}
            actions={<RealtimeIndicator status={realtimeStatus} language={language} />}
          />
          
          {loadError ? (
            <EmptyState
              icon={AlertCircle}
              title={language === 'ru' ? 'Ошибка загрузки' : 'Failed to load'}
              description={language === 'ru' ? 'Потяните вниз, чтобы повторить' : 'Pull down to retry'}
              action={
                <PremiumButton onClick={handleRetry}>
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
                const isHistoryLoading = loadingHistoryIds.has(booking.id);
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
                        <span className="uppercase tracking-[0.08em] flex items-center gap-1.5">
                          {language === 'ru' ? 'История статусов' : 'Status timeline'}
                          {historyLoading ? (
                            <span
                              className="inline-block h-3 w-3 rounded-full border border-muted-foreground/30 border-t-transparent animate-spin"
                              aria-hidden="true"
                            />
                          ) : events.length > 0 ? (
                            <span className="text-muted-foreground/60 normal-case tracking-normal">
                              · {events.length}
                            </span>
                          ) : null}
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
                            {historyLoading ? (
                              <BookingStatusTimelineSkeleton rows={3} compact />
                            ) : (
                              <BookingStatusTimeline
                                events={events}
                                currentStatus={booking.status}
                                createdAt={booking.createdAt}
                                compact
                                highlightIds={highlightedEventIds}
                              />
                            )}
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
