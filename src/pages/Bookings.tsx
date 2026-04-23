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
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedTimelines, setExpandedTimelines] = useState<Record<string, boolean>>({});
  const [highlightedEventIds, setHighlightedEventIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>('connecting');
  const highlightTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Session-level dedup set of every booking_status_history.id we've already
  // applied to state — from initial load, lazy load, cache hydration, OR a
  // prior realtime INSERT. Realtime can deliver the same row more than once
  // (reconnect/replay, multiple subscribers, optimistic + server echo), so we
  // gate every realtime update on this set BEFORE touching state, the cache,
  // expansion, highlight, or timers. Reset on user change / manual refresh.
  const seenEventIdsRef = useRef<Set<string>>(new Set());

  // Cleanup any pending highlight timers on unmount.
  useEffect(() => {
    return () => {
      highlightTimersRef.current.forEach((t) => clearTimeout(t));
      highlightTimersRef.current.clear();
    };
  }, []);

  // Reset the dedup set when the user changes — different account, different
  // history universe.
  useEffect(() => {
    seenEventIdsRef.current = new Set();
  }, [user?.id]);

  const loadBookings = useCallback(async (forceRefresh = false) => {
    if (!user) return;

    setIsLoading(true);
    setLoadError(false);

    // Hydrate from cache immediately on cache hit — avoids a flash of skeleton
    // and a refetch when the user returns to the screen within the TTL window.
    const cached = forceRefresh ? null : getCachedStatusHistory(user.id);
    if (cached) {
      setStatusHistory(cached);
      // Seed the dedup set from cache so realtime events for already-known
      // history rows are no-ops.
      for (const events of Object.values(cached)) {
        for (const e of events) seenEventIdsRef.current.add(e.id);
      }
      setHistoryLoading(false);
    } else {
      setStatusHistory({});
      setHistoryLoading(true);
    }

    // Forced refresh wipes the dedup set so the upcoming network fetch can
    // re-seed from authoritative server state.
    if (forceRefresh) {
      seenEventIdsRef.current = new Set();
    }

    try {
      // Phase 1: Load bookings — render cards as soon as this resolves.
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

      // Phase 2: Status history.
      const bookingIds = formattedBookings.map((b) => b.id);
      if (bookingIds.length === 0) {
        setCachedStatusHistory(user.id, {});
        setHistoryLoading(false);
        return;
      }

      // Cache hit and not a forced refresh → skip the network call entirely.
      if (cached && !forceRefresh) {
        return;
      }

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
          // Seed dedup set so realtime echoes of these rows are ignored.
          seenEventIdsRef.current.add(row.id);
        }
        setStatusHistory(grouped);
        setCachedStatusHistory(user.id, grouped);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      setLoadError(true);
      toast.error(language === 'ru' ? 'Не удалось загрузить бронирования' : 'Failed to load bookings');
      setIsLoading(false);
    } finally {
      setHistoryLoading(false);
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

          // Dedup gate: if we've already applied this status_history row in this
          // session (initial load, lazy load, cache hydration, or a prior
          // realtime delivery), drop the event entirely. This prevents duplicate
          // entries on reconnect/replay AND avoids re-triggering the highlight
          // animation, auto-expand, and timer churn on echoes.
          if (seenEventIdsRef.current.has(row.id)) return;
          seenEventIdsRef.current.add(row.id);

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
          // Resync trigger: if the channel was previously offline (error,
          // timeout, closed) and just came back, we may have missed INSERTs
          // entirely while disconnected. Force a fresh fetch of bookings +
          // history so the UI catches up. The dedup set is reset inside
          // resync() so authoritative server rows re-seed it cleanly.
          if (wasOfflineRef.current) {
            wasOfflineRef.current = false;
            void resyncRef.current?.();
          }
          setRealtimeStatus('live');
        } else if (
          status === 'CHANNEL_ERROR' ||
          status === 'TIMED_OUT' ||
          status === 'CLOSED'
        ) {
          wasOfflineRef.current = true;
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

  // Resync: invalidate cache + dedup set, then refetch bookings and history.
  // Used by realtime reconnect, the browser `online` event, and tab-visibility
  // recovery. Safe to call repeatedly — loadBookings(true) is idempotent.
  const resync = useCallback(async () => {
    if (!user) return;
    invalidateStatusHistoryCache(user.id);
    seenEventIdsRef.current = new Set();
    await loadBookings(true);
  }, [user, loadBookings]);

  // Stable ref so the realtime subscribe callback (captured once per channel)
  // can always reach the latest resync without resubscribing the channel.
  const resyncRef = useRef<typeof resync>();
  useEffect(() => {
    resyncRef.current = resync;
  }, [resync]);

  // Tracks whether the realtime channel was last seen offline, so the next
  // SUBSCRIBED transition is recognised as a recovery (not initial connect).
  const wasOfflineRef = useRef(false);

  // Browser-level network recovery: when the OS reports we're back online, or
  // the tab becomes visible again after being hidden, refetch. Catches cases
  // realtime alone wouldn't (laptop sleep, brief WiFi drop the channel
  // doesn't notice, mobile tab backgrounded for a while).
  useEffect(() => {
    if (!user) return;

    const handleOnline = () => {
      void resyncRef.current?.();
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        void resyncRef.current?.();
      }
    };

    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [user]);

  const handleRefresh = useCallback(async () => {
    // Pull-to-refresh bypasses the cache so users always get fresh data.
    if (user) invalidateStatusHistoryCache(user.id);
    await loadBookings(true);
  }, [loadBookings, user]);

  const handleRetry = useCallback(() => {
    if (user) invalidateStatusHistoryCache(user.id);
    void loadBookings(true);
  }, [loadBookings, user]);

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
