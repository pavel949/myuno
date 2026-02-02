import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Calendar, Clock, Users, MapPin, Music, PartyPopper, Trophy, Sparkles, Wine } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useEvents } from '@/hooks/useEvents';
import { MiniAppLayout, ItemCard, MiniAppQuickGrid, type MiniAppCategory, type QuickGridItem } from '@/components/miniapp';
import { eventsFilterConfig, FilterValues } from '@/components/filters';
import { Badge } from '@/components/ui/badge';
import { matchesFilter, matchesPriceLevel } from '@/lib/filterUtils';
import { CrossSellSection } from '@/components/crosssell';

// Entertainment-focused categories (no tours/excursions)
const EVENT_CATEGORIES: MiniAppCategory[] = [
  { id: 'all', labelEn: 'All', labelRu: 'Все' },
  { id: 'concerts', labelEn: 'Concerts & Shows', labelRu: 'Концерты и шоу' },
  { id: 'parties', labelEn: 'Parties', labelRu: 'Вечеринки' },
  { id: 'clubs', labelEn: 'Clubs & Bars', labelRu: 'Клубы и бары' },
  { id: 'sports', labelEn: 'Sports', labelRu: 'Спорт' },
  { id: 'festivals', labelEn: 'Festivals', labelRu: 'Фестивали' },
];

// Only show entertainment events (exclude tours, boats, adventures)
const ENTERTAINMENT_CATEGORIES = ['concerts', 'parties', 'clubs', 'sports', 'festivals', 'shows', 'nightlife'];

export default function EventsIndex() {
  const { language } = useLanguage();
  const { currencyInfo } = useCurrency();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  
  const { events, isLoading } = useEvents({ category: selectedCategory !== 'all' ? selectedCategory : undefined });

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Only entertainment events - exclude tours, boats, adventures
      const category = event.category?.toLowerCase() || '';
      if (selectedCategory === 'all') {
        // Filter out tour-related categories
        if (['tours', 'boats', 'adventures', 'excursions'].some(c => category.includes(c))) {
          return false;
        }
      }
      
      // Search filter
      const title = language === 'ru' ? event.title_ru : event.title_en;
      if (searchQuery && !title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      
      // Price level filter
      const priceLevel = filterValues.priceLevel as string | undefined;
      if (priceLevel && !matchesPriceLevel(event.price, priceLevel)) return false;
      
      // Date filter
      const dateFilter = filterValues.date as string | undefined;
      if (dateFilter && event.event_date) {
        const eventDate = new Date(event.event_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() + 7);
        const monthEnd = new Date(today);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        
        switch (dateFilter) {
          case 'today':
            if (eventDate.toDateString() !== today.toDateString()) return false;
            break;
          case 'tomorrow':
            if (eventDate.toDateString() !== tomorrow.toDateString()) return false;
            break;
          case 'this-week':
            if (eventDate < today || eventDate > weekEnd) return false;
            break;
          case 'this-month':
            if (eventDate < today || eventDate > monthEnd) return false;
            break;
        }
      }
      
      // Time filter
      const timeFilter = filterValues.time as string | undefined;
      if (timeFilter && event.event_time) {
        const hour = parseInt(event.event_time.split(':')[0]);
        switch (timeFilter) {
          case 'daytime':
            if (hour < 10 || hour >= 18) return false;
            break;
          case 'evening':
            if (hour < 18 || hour >= 22) return false;
            break;
          case 'night':
            if (hour < 22 && hour >= 6) return false;
            break;
        }
      }
      
      // Features filter
      const features = filterValues.features as string[] | undefined;
      if (features?.length) {
        if (features.includes('hot') && !event.is_hot) return false;
        if (features.includes('featured') && !event.is_featured) return false;
        if (features.includes('global') && !event.is_global) return false;
        if (features.includes('recurring') && !event.is_recurring) return false;
        if (features.includes('last-minute') && !event.is_last_minute) return false;
      }
      
      // Rating filter
      const ratingFilter = filterValues.rating as string | undefined;
      if (ratingFilter) {
        const minRating = parseFloat(ratingFilter);
        if ((event.rating || 0) < minRating) return false;
      }
      
      return true;
    });
  }, [events, searchQuery, filterValues, language, selectedCategory]);

  const featuredEvent = filteredEvents.find(e => e.is_featured) || filteredEvents[0];

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', { 
      day: 'numeric', month: 'short', weekday: 'short'
    });
  };

  const quickItems: QuickGridItem[] = [
    { 
      icon: '🎤', 
      label: language === 'ru' ? 'Концерты' : 'Concerts', 
      onClick: () => setSelectedCategory('concerts') 
    },
    { 
      icon: '🎉', 
      label: language === 'ru' ? 'Вечеринки' : 'Parties', 
      onClick: () => setSelectedCategory('parties') 
    },
    { 
      icon: '🍸', 
      label: language === 'ru' ? 'Клубы' : 'Clubs', 
      onClick: () => setSelectedCategory('clubs') 
    },
    { 
      icon: '🥊', 
      label: language === 'ru' ? 'Спорт' : 'Sports', 
      onClick: () => setSelectedCategory('sports') 
    },
  ];

  // Secondary quick items
  const quickItems2: QuickGridItem[] = [
    { 
      icon: '🎭', 
      label: language === 'ru' ? 'Шоу' : 'Shows', 
      onClick: () => setSelectedCategory('concerts') 
    },
    { 
      icon: '🎪', 
      label: language === 'ru' ? 'Фестивали' : 'Festivals', 
      onClick: () => setSelectedCategory('festivals') 
    },
    { 
      icon: '🎬', 
      label: language === 'ru' ? 'Кино' : 'Cinema', 
      onClick: () => setSelectedCategory('concerts') 
    },
    { 
      icon: '🎲', 
      label: language === 'ru' ? 'Всё' : 'All', 
      onClick: () => setSelectedCategory('all') 
    },
  ];

  return (
    <MiniAppLayout
      title={language === 'ru' ? 'Афиша' : 'Playbill'}
      subtitle={language === 'ru' ? 'Концерты, шоу, вечеринки' : 'Concerts, shows, parties'}
      heroIcon={Ticket}
      heroTitle={language === 'ru' ? 'Афиша Пхукета' : 'Phuket Playbill'}
      heroSubtitle={language === 'ru' ? 'Билеты на концерты, шоу и мероприятия' : 'Tickets for concerts, shows & events'}
      heroImage={featuredEvent?.cover_image || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800'}
      heroGradient={{ from: 'from-purple-500/20', via: 'via-pink-500/20', to: 'to-primary/20' }}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder={language === 'ru' ? 'Поиск мероприятий...' : 'Search events...'}
      categories={EVENT_CATEGORIES}
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
      filterConfig={eventsFilterConfig}
      filterValues={filterValues}
      onFilterChange={setFilterValues}
      isLoading={isLoading}
      isEmpty={filteredEvents.length === 0}
      emptyIcon={Ticket}
      emptyText={language === 'ru' ? 'Мероприятия не найдены' : 'No events found'}
    >
      {/* Quick Categories Grid */}
      <MiniAppQuickGrid items={quickItems} columns={4} className="mb-3" />
      <MiniAppQuickGrid items={quickItems2} columns={4} className="mb-6" />

      {/* Featured Event Banner */}
      {selectedCategory === 'all' && featuredEvent && (
        <div 
          onClick={() => navigate(`/events/${featuredEvent.id}`)}
          className="relative h-48 rounded-2xl overflow-hidden cursor-pointer group mb-6"
        >
          <img
            src={featuredEvent.cover_image || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800'}
            alt={featuredEvent.title_en}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex gap-2 mb-2">
              <Badge className="bg-primary">
                {language === 'ru' ? '🎫 Билеты' : '🎫 Tickets'}
              </Badge>
              {featuredEvent.is_hot && (
                <Badge className="bg-red-500 text-white">🔥 Hot</Badge>
              )}
            </div>
            <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
              {language === 'ru' ? featuredEvent.title_ru : featuredEvent.title_en}
            </h3>
            <div className="flex items-center gap-4 text-white/80 text-sm">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(featuredEvent.event_date)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {featuredEvent.event_time}
              </span>
              {featuredEvent.spots_left && (
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {featuredEvent.spots_left} {language === 'ru' ? 'мест' : 'left'}
                </span>
              )}
            </div>
          </div>
          <div className="absolute top-4 right-4">
          <Badge variant="secondary" className="bg-white/95 text-black font-bold text-lg px-3 py-1">
            {currencyInfo.symbol}{featuredEvent.price?.toLocaleString()}
            </Badge>
          </div>
        </div>
      )}

      {/* Upcoming Events Section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          {language === 'ru' ? '📅 Ближайшие события' : '📅 Upcoming Events'}
        </h2>
        <span className="text-sm text-muted-foreground">
          {filteredEvents.length} {language === 'ru' ? 'событий' : 'events'}
        </span>
      </div>
      
      <div className="grid gap-4">
        {filteredEvents.map((event) => (
          <ItemCard
            key={event.id}
            image={event.cover_image || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400'}
            title={language === 'ru' ? event.title_ru : event.title_en}
            rating={event.rating ?? undefined}
            price={event.price ?? undefined}
            originalPrice={event.original_price ?? undefined}
            currency={currencyInfo.symbol}
            location={language === 'ru' ? (event.location_ru ?? undefined) : (event.location_name ?? undefined)}
            badge={event.is_hot ? { text: '🔥 Hot', className: 'bg-red-500 text-white' } : 
                   event.is_featured ? { text: '⭐ Featured', className: 'bg-primary text-primary-foreground' } : undefined}
            meta={[
              { icon: Calendar, label: formatDate(event.event_date) },
              { icon: Clock, label: event.event_time ?? '' },
              { icon: Users, label: `${event.spots_left || '∞'} ${language === 'ru' ? 'мест' : 'spots'}` },
            ]}
            onClick={() => navigate(`/events/${event.id}`)}
          />
        ))}
      </div>

      <CrossSellSection currentVertical="events" />
    </MiniAppLayout>
  );
}
