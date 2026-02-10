/**
 * EventsIndex — Airbnb-style events catalog
 */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Star, Calendar, Clock, MapPin } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useEvents } from '@/hooks/useEvents';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/uno/BackButton';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/uno/EmptyState';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { cn } from '@/lib/utils';

const EVENT_CATEGORIES = [
  { id: 'all', labelEn: 'All', labelRu: 'Все' },
  { id: 'beach_club', labelEn: 'Beach Clubs', labelRu: 'Пляжные клубы' },
  { id: 'dj_party', labelEn: 'DJ Parties', labelRu: 'DJ вечеринки' },
  { id: 'cultural', labelEn: 'Shows', labelRu: 'Шоу' },
  { id: 'sports_fitness', labelEn: 'Sports', labelRu: 'Спорт' },
  { id: 'music_live', labelEn: 'Live Music', labelRu: 'Живая музыка' },
  { id: 'nightlife', labelEn: 'Nightlife', labelRu: 'Ночная жизнь' },
];

export default function EventsIndex() {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const isRu = language === 'ru';

  const { events, isLoading } = useEvents({ category: selectedCategory !== 'all' ? selectedCategory : undefined });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(isRu ? 'ru-RU' : 'en-US', {
      day: 'numeric', month: 'short', weekday: 'short',
    });
  };

  return (
    <AppLayout showHeader={false} showBottomNav>
      {/* Sticky header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <BackButton fallbackPath="/discover" variant="ghost" size="sm" />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">{isRu ? 'Афиша' : 'Events'}</h1>
            <p className="text-xs text-muted-foreground">{events.length} {isRu ? 'событий' : 'events'}</p>
          </div>
        </div>

        {/* Category ribbon */}
        <div className="max-w-7xl mx-auto px-4 pb-2.5 flex gap-2 overflow-x-auto scrollbar-hide">
          {EVENT_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border",
                selectedCategory === cat.id
                  ? "bg-foreground text-background border-foreground"
                  : "bg-secondary text-foreground border-border hover:border-foreground/30"
              )}
            >
              {isRu ? cat.labelRu : cat.labelEn}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-4 pb-24">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[4/3] rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            icon={Ticket}
            title={isRu ? 'Мероприятия не найдены' : 'No events found'}
            description={isRu ? 'Попробуйте изменить фильтры' : 'Try adjusting your filters'}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {events.map(event => {
              const title = isRu ? event.title_ru : event.title_en;
              const isFree = event.price === 0 || event.price === null;
              const location = isRu ? event.location_ru : event.location_name;
              return (
                <div
                  key={event.id}
                  className="cursor-pointer group"
                  onClick={() => navigate(`/events/${event.id}`)}
                >
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-2">
                    <OptimizedImage
                      src={event.cover_image || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400'}
                      alt={title}
                      width={400}
                      height={300}
                      className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                      quality={80}
                    />
                    {event.is_hot && (
                      <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-[10px]">
                        Hot
                      </Badge>
                    )}
                    {!event.is_hot && isFree && (
                      <Badge className="absolute top-2 left-2 bg-green-600 text-white text-[10px]">
                        {isRu ? 'Бесплатно' : 'Free'}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="font-semibold text-sm truncate">{title}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3 shrink-0" />
                      {formatDate(event.event_date)}
                      {event.event_time && ` · ${event.event_time}`}
                    </p>
                    {location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-0.5 truncate">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {location}
                      </p>
                    )}
                    <p className="text-sm font-semibold">
                      {isFree ? (isRu ? 'Бесплатно' : 'Free') : formatPrice(event.price ?? 0)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
