import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, MapPin, Star, Calendar, Clock, Users, 
  Ticket, Music, Compass, PartyPopper, Ship, Mountain,
  ArrowLeft
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEvents } from '@/hooks/useEvents';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { triggerRipple } from '@/hooks/useRipple';

const eventCategories = [
  { id: 'all', labelEn: 'All', labelRu: 'Все', icon: Ticket },
  { id: 'concerts', labelEn: 'Shows', labelRu: 'Шоу', icon: Music },
  { id: 'tours', labelEn: 'Tours', labelRu: 'Экскурсии', icon: Compass },
  { id: 'parties', labelEn: 'Parties', labelRu: 'Вечеринки', icon: PartyPopper },
  { id: 'boats', labelEn: 'Boat Trips', labelRu: 'Морские прогулки', icon: Ship },
  { id: 'adventures', labelEn: 'Adventures', labelRu: 'Приключения', icon: Mountain },
];

const EventsIndex = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const { events, isLoading } = useEvents({ category: selectedCategory !== 'all' ? selectedCategory : undefined });

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.title_ru.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const featuredEvent = events.find(e => e.is_featured);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'short',
      weekday: 'short'
    };
    return date.toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', options);
  };

  return (
    <AppLayout>
      <div className="flex flex-col min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="px-4 py-3">
            <div className="flex items-center gap-3 mb-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-display font-bold">
                  {language === 'ru' ? 'События' : 'Events'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {language === 'ru' ? 'Концерты, туры, развлечения' : 'Concerts, tours, entertainment'}
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={language === 'ru' ? 'Поиск событий...' : 'Search events...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Category Filters */}
          <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
            {eventCategories.map(cat => {
              const Icon = cat.icon;
              return (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.id)}
                  className="shrink-0 gap-1"
                >
                  <Icon className="w-3 h-3" />
                  {language === 'ru' ? cat.labelRu : cat.labelEn}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="px-4 py-4 space-y-4">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
        )}

        {/* Featured Banner */}
        {!isLoading && selectedCategory === 'all' && featuredEvent && (
          <div className="px-4 py-4">
            <div 
              onClick={() => navigate(`/events/${featuredEvent.id}`)}
              className="relative h-48 rounded-2xl overflow-hidden cursor-pointer group"
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
                <h3 className="text-xl font-bold text-white mb-1">
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
          </div>
        )}

        {/* Events List */}
        {!isLoading && (
          <div className="flex-1 px-4 pb-24 space-y-4">
            <h2 className="font-semibold">
              {language === 'ru' ? 'Все события' : 'All Events'} ({filteredEvents.length})
            </h2>
            
            {filteredEvents.map(event => (
              <div
                key={event.id}
                onClick={(e) => {
                  triggerRipple(e);
                  navigate(`/events/${event.id}`);
                }}
                className="relative overflow-hidden bg-card rounded-xl border border-border cursor-pointer hover:border-primary/30 transition-all active:scale-[0.98]"
              >
                <div className="flex">
                  <div className="w-28 h-28 shrink-0 relative">
                    <img
                      src={event.cover_image || ''}
                      alt={event.title_en}
                      className="w-full h-full object-cover"
                    />
                    {event.is_hot && (
                      <Badge className="absolute top-1 left-1 bg-red-500 text-xs px-1.5">
                        🔥 Hot
                      </Badge>
                    )}
                  </div>
                  <div className="flex-1 p-3">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-semibold text-sm line-clamp-1">
                        {language === 'ru' ? event.title_ru : event.title_en}
                      </h3>
                      <div className="flex items-center gap-1 text-xs shrink-0">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span>{event.rating}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(event.event_date)}
                      </span>
                      <span>•</span>
                      <span>{event.event_time}</span>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                      <MapPin className="w-3 h-3" />
                      <span>{language === 'ru' ? event.location_ru : event.location_name}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-orange-500">
                        <Users className="w-3 h-3" />
                        <span>
                          {event.spots_left} {language === 'ru' ? 'мест' : 'spots left'}
                        </span>
                      </div>
                      <div className="text-right">
                        {event.original_price && (
                          <span className="text-xs text-muted-foreground line-through mr-1">
                            ฿{event.original_price.toLocaleString()}
                          </span>
                        )}
                        <span className="font-bold text-primary">฿{event.price?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filteredEvents.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                {language === 'ru' ? 'События не найдены' : 'No events found'}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default EventsIndex;
