import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Star, MapPin, Clock, Calendar, Users,
  Share2, CheckCircle, AlertCircle, Building2, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEvent } from '@/hooks/useEvents';
import { useVenue, VENUE_TYPES } from '@/hooks/useVenues';
import { FavoriteButton } from '@/components/uno/FavoriteButton';
import { useViewHistory } from '@/hooks/useViewHistory';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { event, isLoading } = useEvent(id);
  const { venue } = useVenue(event?.venue_id || undefined);
  const [selectedImage, setSelectedImage] = useState(0);
  const [tickets, setTickets] = useState(1);
  const { trackView } = useViewHistory();

  useEffect(() => {
    if (event) {
      trackView(event.id, 'event', {
        name_en: event.title_en,
        name_ru: event.title_ru,
        image: event.cover_image,
        price: event.price,
        location: event.location_name,
      });
    }
  }, [event]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'long',
      year: 'numeric',
      weekday: 'long'
    };
    return date.toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', options);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Skeleton className="h-72 w-full" />
        <div className="p-4 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">
          {language === 'ru' ? 'Событие не найдено' : 'Event not found'}
        </p>
        <Button onClick={() => navigate('/events')}>
          {language === 'ru' ? 'К событиям' : 'Back to Events'}
        </Button>
      </div>
    );
  }

  const images = event.images.length > 0 ? event.images : [event.cover_image || ''];
  const totalPrice = (event.price || 0) * tickets;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header Image */}
      <div className="relative h-72">
        <img
          src={images[selectedImage]}
          alt={event.title_en}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Top Actions */}
        <div className="absolute top-4 left-4 right-4 flex justify-between">
          <Button variant="secondary" size="icon" onClick={() => navigate('/events')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex gap-2">
            <FavoriteButton
              itemType="event"
              itemId={event.id}
              itemData={{
                title_en: event.title_en,
                title_ru: event.title_ru,
                image: event.cover_image,
                price: event.price,
                category: event.category,
              }}
              variant="secondary"
            />
            <Button variant="secondary" size="icon">
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Image Thumbnails */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-4 right-4 flex gap-2 justify-center">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(idx)}
                className={`w-12 h-12 rounded-lg overflow-hidden border-2 ${
                  selectedImage === idx ? 'border-primary' : 'border-white/50'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-6 -mt-6 bg-background rounded-t-3xl relative z-10">
        {/* Title Section */}
        <div className="mb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-display font-bold">
                {language === 'ru' ? event.title_ru : event.title_en}
              </h1>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-bold">{event.rating}</span>
              </div>
              <p className="text-sm text-muted-foreground">{event.review_count} reviews</p>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-card rounded-xl p-3 border border-border text-center">
            <Calendar className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-xs font-medium">{formatDate(event.event_date).split(',')[0]}</p>
            <p className="text-xs text-muted-foreground">{event.event_time}</p>
          </div>
          <div className="bg-card rounded-xl p-3 border border-border text-center">
            <Clock className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-xs font-medium">
              {event.duration_hours} {language === 'ru' ? 'ч' : 'h'}
            </p>
          </div>
          <div className="bg-card rounded-xl p-3 border border-border text-center">
            <Users className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-xs font-medium">{event.spots_left}</p>
            <p className="text-xs text-muted-foreground">
              {language === 'ru' ? 'мест' : 'spots'}
            </p>
          </div>
        </div>

        {/* Location / Venue */}
        {venue ? (
          <Card 
            className="mb-6 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(`/venues/${venue.id}`)}
          >
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                <img 
                  src={venue.cover_image || '/placeholder.svg'} 
                  alt={language === 'ru' ? venue.name_ru : venue.name_en}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="w-4 h-4 text-primary" />
                  <p className="font-medium truncate">
                    {language === 'ru' ? venue.name_ru : venue.name_en}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {language === 'ru' ? (venue.address_ru || venue.address) : venue.address}
                </p>
                {venue.capacity && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Users className="w-3 h-3" />
                    {language === 'ru' ? 'Вместимость:' : 'Capacity:'} {venue.capacity.toLocaleString()}
                  </p>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            </CardContent>
          </Card>
        ) : (
          <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{language === 'ru' ? event.location_ru : event.location_name}</span>
          </div>
        )}

        {/* Description */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2">
            {language === 'ru' ? 'Описание' : 'Description'}
          </h3>
          <p className="text-muted-foreground text-sm">
            {language === 'ru' ? event.description_ru : event.description_en}
          </p>
        </div>

        {/* Itinerary */}
        {event.itinerary.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-3">
              {language === 'ru' ? 'Программа' : 'Itinerary'}
            </h3>
            <div className="space-y-3">
              {event.itinerary.map((item, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="text-sm font-medium text-primary w-12">{item.time}</div>
                  <div className="flex-1 text-sm pb-3 border-b border-border last:border-0">
                    {language === 'ru' ? item.ru : item.en}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Includes */}
        {event.includes.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              {language === 'ru' ? 'Включено' : 'Included'}
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {event.includes.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
                  <span>{language === 'ru' ? item.ru : item.en}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Excludes */}
        {event.excludes.length > 0 && (
          <div className="mb-24">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-500" />
              {language === 'ru' ? 'Не включено' : 'Not Included'}
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {event.excludes.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>•</span>
                  <span>{language === 'ru' ? item.ru : item.en}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center border border-border rounded-lg">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setTickets(Math.max(1, tickets - 1))}
                disabled={tickets <= 1}
              >
                -
              </Button>
              <span className="w-8 text-center font-medium">{tickets}</span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setTickets(Math.min(event.spots_left, tickets + 1))}
                disabled={tickets >= event.spots_left}
              >
                +
              </Button>
            </div>
            <div>
              <p className="text-xl font-bold text-primary">฿{totalPrice.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">
                {tickets} {language === 'ru' ? 'билет(ов)' : 'ticket(s)'}
              </p>
            </div>
          </div>
          <Button 
            size="lg"
            onClick={() => navigate(`/events/booking/${id}?tickets=${tickets}`)}
          >
            {language === 'ru' ? 'Забронировать' : 'Book Now'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
