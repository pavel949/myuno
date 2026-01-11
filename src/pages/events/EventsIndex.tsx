import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Calendar, Clock, Users, MapPin, Music, Compass, PartyPopper, Ship, Mountain } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEvents } from '@/hooks/useEvents';
import { MiniAppLayout, ItemCard, MiniAppQuickGrid, type MiniAppCategory, type QuickGridItem } from '@/components/miniapp';
import { eventsFilterConfig, FilterValues } from '@/components/filters';
import { Badge } from '@/components/ui/badge';

const EVENT_CATEGORIES: MiniAppCategory[] = [
  { id: 'all', labelEn: 'All', labelRu: 'Все' },
  { id: 'concerts', labelEn: 'Shows', labelRu: 'Шоу' },
  { id: 'tours', labelEn: 'Tours', labelRu: 'Экскурсии' },
  { id: 'parties', labelEn: 'Parties', labelRu: 'Вечеринки' },
  { id: 'boats', labelEn: 'Boat Trips', labelRu: 'Морские прогулки' },
  { id: 'adventures', labelEn: 'Adventures', labelRu: 'Приключения' },
];

export default function EventsIndex() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  
  const { events, isLoading } = useEvents({ category: selectedCategory !== 'all' ? selectedCategory : undefined });

  const filteredEvents = events.filter(event => {
    const title = language === 'ru' ? event.title_ru : event.title_en;
    return title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const featuredEvent = events.find(e => e.is_featured);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', { 
      day: 'numeric', month: 'short', weekday: 'short'
    });
  };

  const quickItems: QuickGridItem[] = [
    { icon: '🎵', label: language === 'ru' ? 'Шоу' : 'Shows', onClick: () => setSelectedCategory('concerts') },
    { icon: '🎉', label: language === 'ru' ? 'Вечеринки' : 'Parties', onClick: () => setSelectedCategory('parties') },
    { icon: '⛵', label: language === 'ru' ? 'На лодке' : 'Boats', onClick: () => setSelectedCategory('boats') },
    { icon: '🏔️', label: language === 'ru' ? 'Приключения' : 'Adventures', onClick: () => setSelectedCategory('adventures') },
  ];

  return (
    <MiniAppLayout
      title={language === 'ru' ? 'События' : 'Events'}
      subtitle={language === 'ru' ? 'Концерты, туры, развлечения' : 'Concerts, tours, entertainment'}
      heroIcon={Ticket}
      heroTitle={language === 'ru' ? 'Лучшие события Пхукета' : 'Best Events in Phuket'}
      heroSubtitle={language === 'ru' ? 'Концерты, вечеринки, экскурсии' : 'Concerts, parties, excursions'}
      heroImage={featuredEvent?.cover_image || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800'}
      heroGradient={{ from: 'from-purple-500/20', via: 'via-pink-500/20', to: 'to-primary/20' }}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder={language === 'ru' ? 'Поиск событий...' : 'Search events...'}
      categories={EVENT_CATEGORIES}
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
      filterConfig={eventsFilterConfig}
      filterValues={filterValues}
      onFilterChange={setFilterValues}
      isLoading={isLoading}
      isEmpty={filteredEvents.length === 0}
      emptyIcon={Ticket}
      emptyText={language === 'ru' ? 'События не найдены' : 'No events found'}
    >
      <MiniAppQuickGrid items={quickItems} columns={4} className="mb-6" />

      {/* Featured Event Banner */}
      {selectedCategory === 'all' && featuredEvent && (
        <div 
          onClick={() => navigate(`/events/${featuredEvent.id}`)}
          className="relative h-40 rounded-2xl overflow-hidden cursor-pointer group mb-6"
        >
          <img
            src={featuredEvent.cover_image || ''}
            alt={featuredEvent.title_en}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <Badge className="bg-primary mb-2">
              {language === 'ru' ? 'Популярное' : 'Featured'}
            </Badge>
            <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">
              {language === 'ru' ? featuredEvent.title_ru : featuredEvent.title_en}
            </h3>
            <div className="flex items-center gap-3 text-white/80 text-sm">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(featuredEvent.event_date)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {featuredEvent.event_time}
              </span>
            </div>
          </div>
          <div className="absolute top-4 right-4">
            <Badge variant="secondary" className="bg-white/90 text-black">
              ฿{featuredEvent.price?.toLocaleString()}
            </Badge>
          </div>
        </div>
      )}
      
      <div className="grid gap-4">
        {filteredEvents.map((event) => (
          <ItemCard
            key={event.id}
            image={event.cover_image || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400'}
            title={language === 'ru' ? event.title_ru : event.title_en}
            rating={event.rating ?? undefined}
            price={event.price ?? undefined}
            originalPrice={event.original_price ?? undefined}
            currency="฿"
            location={language === 'ru' ? (event.location_ru ?? undefined) : (event.location_name ?? undefined)}
            badge={event.is_hot ? { text: '🔥 Hot', className: 'bg-red-500 text-white' } : undefined}
            meta={[
              { icon: Calendar, label: formatDate(event.event_date) },
              { icon: Clock, label: event.event_time ?? '' },
              { icon: Users, label: `${event.spots_left} ${language === 'ru' ? 'мест' : 'spots'}` },
            ]}
            onClick={() => navigate(`/events/${event.id}`)}
          />
        ))}
      </div>
    </MiniAppLayout>
  );
}