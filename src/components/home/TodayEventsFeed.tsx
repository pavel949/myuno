/**
 * TodayEventsFeed — Public events & experiences feed for unauthenticated users.
 * Shows upcoming events from the events table, replacing the empty "Your Day" feed.
 */
import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEvents } from '@/hooks/useEvents';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { CalendarDays, MapPin, Clock, ChevronRight, Sparkles, ArrowRight } from 'lucide-react';
import { SectionHeader } from '@/components/ds';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { ru as ruLocale } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface TodayEventsFeedProps {
  compact?: boolean;
}

export const TodayEventsFeed = memo(function TodayEventsFeed({ compact }: TodayEventsFeedProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const { events, isLoading } = useEvents({ limit: 8 });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-5 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-[140px] w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Filter to upcoming events (today or future)
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const upcoming = (events || [])
    .filter(e => {
      if (!e.event_date) return true; // recurring / no date
      return new Date(e.event_date) >= now;
    })
    .slice(0, 6);

  if (upcoming.length === 0) return null;

  const formatEventDate = (dateStr: string | null) => {
    if (!dateStr) return isRu ? 'Регулярно' : 'Recurring';
    try {
      const d = parseISO(dateStr);
      if (isToday(d)) return isRu ? 'Сегодня' : 'Today';
      if (isTomorrow(d)) return isRu ? 'Завтра' : 'Tomorrow';
      return format(d, 'd MMM', { locale: isRu ? ruLocale : undefined });
    } catch {
      return dateStr;
    }
  };

  return (
    <motion.section
      className={cn('space-y-4', compact && 'space-y-3')}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* DS2.0 SectionHeader */}
      <SectionHeader
        title={isRu ? 'События сегодня' : "Today's Events"}
        subtitle={`${upcoming.length} ${isRu ? 'событий' : 'events'}`}
        icon={CalendarDays}
        size={compact ? 'sm' : 'md'}
        action={{ label: isRu ? 'Все события' : 'All events', onClick: () => navigate('/events') }}
      />

      {/* Events grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {upcoming.map((event, i) => {
          const dateLabel = formatEventDate(event.event_date);
          const isHot = event.is_hot || event.is_last_minute;

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            >
              <Card
                className="overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 group"
                onClick={() => navigate(`/events/${event.id}`)}
              >
                <div className="flex h-full">
                  {/* Image */}
                  {event.cover_image && (
                    <div className="w-24 sm:w-28 shrink-0 relative overflow-hidden">
                      <img
                        src={event.cover_image}
                        alt={isRu ? event.title_ru : event.title_en}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      {isHot && (
                        <div className="absolute top-1.5 left-1.5">
                          <Badge className="text-[9px] bg-destructive text-destructive-foreground px-1.5 py-0">
                            🔥 HOT
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Content */}
                  <CardContent className="p-3 flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <p className="font-medium text-sm leading-tight line-clamp-2">
                        {isRu ? event.title_ru : event.title_en}
                      </p>

                      <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {dateLabel}
                        </span>
                        {event.event_time && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {event.event_time.slice(0, 5)}
                          </span>
                        )}
                      </div>

                      {event.location_name && (
                        <p className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1 truncate">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {isRu ? (event.location_ru || event.location_name) : event.location_name}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      {event.price != null && event.price > 0 ? (
                        <span className="text-sm font-bold text-foreground">
                          ฿{event.price.toLocaleString()}
                        </span>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">
                          {isRu ? 'Бесплатно' : 'Free'}
                        </Badge>
                      )}
                      {event.spots_left > 0 && event.spots_left <= 5 && (
                        <Badge variant="secondary" className="text-[10px]">
                          {event.spots_left} {isRu ? 'мест' : 'left'}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
});
