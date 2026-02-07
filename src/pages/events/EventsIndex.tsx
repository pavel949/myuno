import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Calendar, Clock, Users, MapPin, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useEvents } from '@/hooks/useEvents';
import { MiniAppLayout, ItemCard, MiniAppQuickGrid, type MiniAppCategory, type QuickGridItem } from '@/components/miniapp';
import { eventsFilterConfig, FilterValues } from '@/components/filters';
import { Badge } from '@/components/ui/badge';
import { matchesPriceLevel } from '@/lib/filterUtils';
import { CrossSellSection } from '@/components/crosssell';

const EVENT_CATEGORIES: MiniAppCategory[] = [
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
  const { currencyInfo } = useCurrency();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  
  const { events, isLoading } = useEvents({ category: selectedCategory !== 'all' ? selectedCategory : undefined });

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
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
      
      // Age policy filter
      const agePolicy = filterValues.agePolicy as string | undefined;
      if (agePolicy && event.age_policy !== agePolicy) return false;
      
      // Features filter
      const features = filterValues.features as string[] | undefined;
      if (features?.length) {
        if (features.includes('hot') && !event.is_hot) return false;
        if (features.includes('featured') && !event.is_featured) return false;
        if (features.includes('global') && !event.is_global) return false;
        if (features.includes('recurring') && !event.is_recurring) return false;
        if (features.includes('last-minute') && !event.is_last_minute) return false;
        if (features.includes('free') && event.price !== null && event.price > 0) return false;
        if (features.includes('vip') && !event.marketing_tags?.includes('vip')) return false;
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
    { icon: '🏖️', label: language === 'ru' ? 'Пляжные клубы' : 'Beach Clubs', onClick: () => setSelectedCategory('beach_club') },
    { icon: '🎧', label: language === 'ru' ? 'DJ вечеринки' : 'DJ Parties', onClick: () => setSelectedCategory('dj_party') },
    { icon: '🎭', label: language === 'ru' ? 'Шоу' : 'Shows', onClick: () => setSelectedCategory('cultural') },
    { icon: '🥊', label: language === 'ru' ? 'Спорт' : 'Sports', onClick: () => setSelectedCategory('sports_fitness') },
  ];

  const quickItems2: QuickGridItem[] = [
    { icon: '🎵', label: language === 'ru' ? 'Музыка' : 'Live Music', onClick: () => setSelectedCategory('music_live') },
    { icon: '🌙', label: language === 'ru' ? 'Ночная жизнь' : 'Nightlife', onClick: () => setSelectedCategory('nightlife') },
    { icon: '🔥', label: language === 'ru' ? 'Hot' : 'Hot', onClick: () => setFilterValues(v => ({ ...v, features: ['hot'] })) },
    { icon: '🎲', label: language === 'ru' ? 'Всё' : 'All', onClick: () => { setSelectedCategory('all'); setFilterValues({}); } },
  ];

  const getAgePolicyBadge = (policy: string | null) => {
    if (!policy || policy === 'all_ages') return null;
    return policy;
  };

  return (
    <MiniAppLayout
      title={language === 'ru' ? 'Афиша' : 'Events'}
      subtitle={language === 'ru' ? 'Пляжные клубы, шоу, вечеринки, спорт' : 'Beach clubs, shows, parties, sports'}
      heroIcon={Ticket}
      heroTitle={language === 'ru' ? 'Афиша Пхукета' : 'Phuket Events'}
      heroSubtitle={language === 'ru' ? 'Реальные события от проверенных организаторов' : 'Real events from verified organizers'}
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
              {featuredEvent.is_hot && (
                <Badge className="bg-red-500 text-white">🔥 Hot</Badge>
              )}
              {featuredEvent.age_policy && featuredEvent.age_policy !== 'all_ages' && (
                <Badge variant="outline" className="border-white/50 text-white">{featuredEvent.age_policy}</Badge>
              )}
              {featuredEvent.price === 0 || featuredEvent.price === null ? (
                <Badge className="bg-green-500 text-white">🆓 {language === 'ru' ? 'Бесплатно' : 'Free'}</Badge>
              ) : (
                <Badge className="bg-primary">{currencyInfo.symbol}{featuredEvent.price?.toLocaleString()}</Badge>
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
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {language === 'ru' ? featuredEvent.location_ru : featuredEvent.location_name}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Events List */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          {language === 'ru' ? '📅 Ближайшие события' : '📅 Upcoming Events'}
        </h2>
        <span className="text-sm text-muted-foreground">
          {filteredEvents.length} {language === 'ru' ? 'событий' : 'events'}
        </span>
      </div>
      
      <div className="grid gap-4">
        {filteredEvents.map((event) => {
          const ageBadge = getAgePolicyBadge(event.age_policy);
          const isFree = event.price === 0 || event.price === null;
          
          return (
            <ItemCard
              key={event.id}
              image={event.cover_image || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400'}
              title={language === 'ru' ? event.title_ru : event.title_en}
              rating={event.rating ?? undefined}
              price={isFree ? undefined : (event.price ?? undefined)}
              originalPrice={event.original_price ?? undefined}
              currency={currencyInfo.symbol}
              location={language === 'ru' ? (event.location_ru ?? undefined) : (event.location_name ?? undefined)}
              badge={
                event.is_hot ? { text: '🔥 Hot', className: 'bg-red-500 text-white' } : 
                isFree ? { text: '🆓 Free', className: 'bg-green-500 text-white' } :
                event.is_featured ? { text: '⭐ Featured', className: 'bg-primary text-primary-foreground' } : 
                ageBadge ? { text: ageBadge, className: 'bg-orange-500 text-white' } :
                undefined
              }
              meta={[
                { icon: Calendar, label: formatDate(event.event_date) },
                { icon: Clock, label: event.event_time ?? '' },
                ...(event.is_recurring ? [{ icon: Users, label: language === 'ru' ? 'Еженедельно' : 'Weekly' }] : []),
              ]}
              onClick={() => navigate(`/events/${event.id}`)}
              ctaLabel={language === 'ru' ? 'Билеты' : 'Get Tickets'}
            />
          );
        })}
      </div>

      <CrossSellSection currentVertical="events" />
    </MiniAppLayout>
  );
}
