import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, MapPin, Star, Calendar, Clock, Users, 
  Ticket, Music, Compass, PartyPopper, Ship, Mountain,
  ArrowLeft, Filter
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { triggerRipple } from '@/hooks/useRipple';

const eventCategories = [
  { id: 'all', labelEn: 'All', labelRu: 'Все', icon: Ticket },
  { id: 'concerts', labelEn: 'Concerts', labelRu: 'Концерты', icon: Music },
  { id: 'tours', labelEn: 'Tours', labelRu: 'Экскурсии', icon: Compass },
  { id: 'parties', labelEn: 'Parties', labelRu: 'Вечеринки', icon: PartyPopper },
  { id: 'boats', labelEn: 'Boat Trips', labelRu: 'Морские прогулки', icon: Ship },
  { id: 'adventures', labelEn: 'Adventures', labelRu: 'Приключения', icon: Mountain },
];

const events = [
  {
    id: 'event-1',
    name: 'Full Moon Party',
    nameRu: 'Вечеринка Полнолуния',
    category: 'parties',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600',
    date: '2026-01-15',
    time: '20:00',
    location: 'Patong Beach',
    locationRu: 'Пляж Патонг',
    price: 1500,
    originalPrice: 2000,
    rating: 4.8,
    reviewCount: 234,
    spotsLeft: 45,
    isFeatured: true,
    isHot: true,
  },
  {
    id: 'event-2',
    name: 'Phi Phi Islands Tour',
    nameRu: 'Тур на острова Пхи-Пхи',
    category: 'tours',
    image: 'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=600',
    date: '2026-01-12',
    time: '08:00',
    location: 'Rassada Pier',
    locationRu: 'Пирс Рассада',
    price: 2500,
    rating: 4.9,
    reviewCount: 567,
    spotsLeft: 12,
    isFeatured: true,
  },
  {
    id: 'event-3',
    name: 'Thai Boxing Night',
    nameRu: 'Тайский бокс - Вечер',
    category: 'concerts',
    image: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=600',
    date: '2026-01-14',
    time: '19:00',
    location: 'Bangla Boxing Stadium',
    locationRu: 'Стадион Бангла',
    price: 1800,
    rating: 4.7,
    reviewCount: 189,
    spotsLeft: 78,
  },
  {
    id: 'event-4',
    name: 'Sunset Yacht Cruise',
    nameRu: 'Закатный круиз на яхте',
    category: 'boats',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600',
    date: '2026-01-13',
    time: '16:30',
    location: 'Royal Phuket Marina',
    locationRu: 'Роял Пхукет Марина',
    price: 4500,
    rating: 4.9,
    reviewCount: 145,
    spotsLeft: 8,
    isHot: true,
  },
  {
    id: 'event-5',
    name: 'ATV Jungle Adventure',
    nameRu: 'ATV Приключение в джунглях',
    category: 'adventures',
    image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600',
    date: '2026-01-11',
    time: '09:00',
    location: 'Chalong',
    locationRu: 'Чалонг',
    price: 2200,
    rating: 4.6,
    reviewCount: 98,
    spotsLeft: 20,
  },
  {
    id: 'event-6',
    name: 'Simon Cabaret Show',
    nameRu: 'Шоу Саймон Кабаре',
    category: 'concerts',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600',
    date: '2026-01-10',
    time: '21:00',
    location: 'Patong',
    locationRu: 'Патонг',
    price: 1200,
    rating: 4.5,
    reviewCount: 456,
    spotsLeft: 100,
  },
];

const EventsIndex = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.nameRu.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatDate = (dateStr: string) => {
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

        {/* Featured Banner */}
        {selectedCategory === 'all' && (
          <div className="px-4 py-4">
            <div 
              onClick={() => navigate(`/events/${events[0].id}`)}
              className="relative h-48 rounded-2xl overflow-hidden cursor-pointer group"
            >
              <img
                src={events[0].image}
                alt={events[0].name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <Badge className="bg-primary mb-2">
                  {language === 'ru' ? 'Популярное' : 'Featured'}
                </Badge>
                <h3 className="text-xl font-bold text-white mb-1">
                  {language === 'ru' ? events[0].nameRu : events[0].name}
                </h3>
                <div className="flex items-center gap-3 text-white/80 text-sm">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(events[0].date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {events[0].time}
                  </span>
                </div>
              </div>
              <div className="absolute top-4 right-4">
                <Badge variant="secondary" className="bg-white/90 text-black">
                  ฿{events[0].price}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Events List */}
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
                    src={event.image}
                    alt={event.name}
                    className="w-full h-full object-cover"
                  />
                  {event.isHot && (
                    <Badge className="absolute top-1 left-1 bg-red-500 text-xs px-1.5">
                      🔥 Hot
                    </Badge>
                  )}
                </div>
                <div className="flex-1 p-3">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold text-sm line-clamp-1">
                      {language === 'ru' ? event.nameRu : event.name}
                    </h3>
                    <div className="flex items-center gap-1 text-xs shrink-0">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span>{event.rating}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(event.date)}
                    </span>
                    <span>•</span>
                    <span>{event.time}</span>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                    <MapPin className="w-3 h-3" />
                    <span>{language === 'ru' ? event.locationRu : event.location}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-orange-500">
                      <Users className="w-3 h-3" />
                      <span>
                        {event.spotsLeft} {language === 'ru' ? 'мест' : 'spots left'}
                      </span>
                    </div>
                    <div className="text-right">
                      {event.originalPrice && (
                        <span className="text-xs text-muted-foreground line-through mr-1">
                          ฿{event.originalPrice}
                        </span>
                      )}
                      <span className="font-bold text-primary">฿{event.price}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default EventsIndex;