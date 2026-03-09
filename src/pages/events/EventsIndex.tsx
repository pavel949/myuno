/**
 * EventsIndex — Airbnb-style events catalog
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Star, Calendar, Clock, MapPin } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useEvents } from '@/hooks/useEvents';
import { AppLayout } from '@/components/layout/AppLayout';
import { CatalogHeader } from '@/components/shared/CatalogHeader';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/uno/EmptyState';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { PLACEHOLDER_IMAGES } from '@/lib/config/placeholders';

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

  const categories = EVENT_CATEGORIES.map(c => ({ id: c.id, label: isRu ? c.labelRu : c.labelEn }));

  return (
    <AppLayout showHeader={false} showBottomNav>
      <CatalogHeader
        title={isRu ? 'Афиша' : 'Events'}
        subtitle={`${events.length} ${isRu ? 'событий' : 'events'}`}
        fallbackPath="/discover"
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* Content */}
      <div className="max-w-[1536px] mx-auto px-4 py-4 pb-24">
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
            title={isRu ? 'События не найдены' : 'No events found'}
            description={isRu ? 'Попробуйте изменить фильтры' : 'Try adjusting your filters'}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {events.map(event => {
              const name = isRu ? event.title_ru : event.title_en;
              return (
                <div
                  key={event.id}
                  className="cursor-pointer group"
                  onClick={() => navigate(`/events/${event.id}`)}
                >
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-2">
                    <OptimizedImage
                      src={event.cover_image || PLACEHOLDER_IMAGES.event}
                      alt={name}
                      width={400}
                      height={300}
                      className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                      quality={80}
                    />
                    {event.is_featured && (
                      <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px]">
                        <Star className="w-3 h-3 mr-0.5 fill-current" />
                        {isRu ? 'Топ' : 'Featured'}
                      </Badge>
                    )}
                    {event.event_date && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2.5 pt-6">
                        <span className="text-white text-xs font-medium flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(event.event_date)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="font-semibold text-sm truncate">{name}</h3>
                    {event.location_name && (
                      <p className="text-xs text-muted-foreground flex items-center gap-0.5 truncate">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {event.location_name}
                      </p>
                    )}
                    <p className="text-sm font-semibold">
                      {event.price ? `${isRu ? 'от' : 'from'} ${formatPrice(event.price)}` : (isRu ? 'Бесплатно' : 'Free')}
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
