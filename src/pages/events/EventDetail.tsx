import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Star, MapPin, Clock, Calendar, Users,
  Share2, CheckCircle, AlertCircle, Building2, ChevronRight,
  ExternalLink, ShieldCheck, Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useEvent } from '@/hooks/useEvents';
import { useVenue, VENUE_TYPES } from '@/hooks/useVenues';
import { FavoriteButton } from '@/components/uno/FavoriteButton';
import { useViewHistory } from '@/hooks/useViewHistory';
import { AppLayout } from '@/components/layout/AppLayout';

const AGE_POLICY_LABELS: Record<string, { en: string; ru: string }> = {
  'all_ages': { en: 'All Ages', ru: 'Все возрасты' },
  '18+': { en: '18+ Only', ru: 'Только 18+' },
  '20+': { en: '20+ Only', ru: 'Только 20+' },
  'unknown': { en: 'Check with organizer', ru: 'Уточняйте у организатора' },
};

const DRESS_CODE_LABELS: Record<string, { en: string; ru: string }> = {
  'none': { en: 'No dress code', ru: 'Без дресс-кода' },
  'smart_casual': { en: 'Smart Casual', ru: 'Смарт-кэжуал' },
  'beach': { en: 'Beach / Casual', ru: 'Пляжный / повседневный' },
};

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { currencyInfo } = useCurrency();
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
    return date.toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', { 
      day: 'numeric', month: 'long', year: 'numeric', weekday: 'long'
    });
  };

  if (isLoading) {
    return (
      <AppLayout showHeader={false} showBottomNav>
        <Skeleton className="h-72 w-full" />
        <div className="p-4 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!event) {
    return (
      <AppLayout showHeader={false} showBottomNav>
        <div className="flex flex-col items-center justify-center p-4 min-h-[60vh]">
          <p className="text-muted-foreground mb-4">
            {language === 'ru' ? 'Событие не найдено' : 'Event not found'}
          </p>
          <Button onClick={() => navigate('/events')}>
            {language === 'ru' ? 'К событиям' : 'Back to Events'}
          </Button>
        </div>
      </AppLayout>
    );
  }

  const images = event.images.length > 0 ? event.images : [event.cover_image || ''];
  const isFree = event.price === 0 || event.price === null;
  const totalPrice = (event.price || 0) * tickets;
  const hasTicketUrl = event.ticket_url && event.ticket_url.length > 0;

  return (
    <AppLayout showHeader={false} showBottomNav>
      <div className="flex flex-col">
        {/* Header Image */}
        <div className="relative h-72">
        <img src={images[selectedImage]} alt={event.title_en} className="w-full h-full object-cover" />
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

        {/* Badges overlay */}
        <div className="absolute bottom-4 left-4 flex gap-2 flex-wrap">
          {event.is_hot && <Badge className="bg-destructive text-destructive-foreground">🔥 Hot</Badge>}
          {event.is_recurring && <Badge variant="secondary">🔄 {language === 'ru' ? 'Еженедельно' : 'Weekly'}</Badge>}
          {event.age_policy && event.age_policy !== 'all_ages' && (
            <Badge className="bg-warning text-warning-foreground">{event.age_policy}</Badge>
          )}
          {isFree && <Badge className="bg-success text-success-foreground">🆓 {language === 'ru' ? 'Бесплатно' : 'Free Entry'}</Badge>}
        </div>

        {/* Image Thumbnails */}
        {images.length > 1 && (
          <div className="absolute bottom-4 right-4 flex gap-2">
            {images.slice(0, 4).map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(idx)}
                className={`w-10 h-10 rounded-none overflow-hidden border-2 ${selectedImage === idx ? 'border-primary' : 'border-white/50'}`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-6 -mt-6 bg-background rounded-none relative z-10">
        {/* Title */}
        <div className="mb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-display font-bold">
                {language === 'ru' ? event.title_ru : event.title_en}
              </h1>
            </div>
            {event.rating > 0 && (
              <div className="text-right">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-accent text-accent" />
                  <span className="font-bold">{event.rating}</span>
                </div>
                <p className="text-sm text-muted-foreground">{event.review_count} reviews</p>
              </div>
            )}
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-card rounded-none p-3 border border-border text-center">
            <Calendar className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-xs font-medium">{formatDate(event.event_date).split(',')[0]}</p>
            <p className="text-xs text-muted-foreground">{event.event_time}</p>
          </div>
          <div className="bg-card rounded-none p-3 border border-border text-center">
            <Clock className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-xs font-medium">
              {event.duration_hours ? `${event.duration_hours}${language === 'ru' ? 'ч' : 'h'}` : '—'}
            </p>
          </div>
          <div className="bg-card rounded-none p-3 border border-border text-center">
            <Tag className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-xs font-medium">
              {isFree ? (language === 'ru' ? 'Бесплатно' : 'Free') : `${currencyInfo.symbol}${event.price?.toLocaleString()}`}
            </p>
          </div>
        </div>

        {/* Age Policy & Dress Code */}
        {(event.age_policy !== 'all_ages' || (event.dress_code && event.dress_code !== 'none')) && (
          <div className="flex gap-3 mb-6">
            {event.age_policy && event.age_policy !== 'all_ages' && (
              <div className="flex items-center gap-2 bg-accent/10 dark:bg-accent/30 text-accent dark:text-accent rounded-none px-3 py-2 text-sm">
                <ShieldCheck className="w-4 h-4" />
                {AGE_POLICY_LABELS[event.age_policy]?.[language === 'ru' ? 'ru' : 'en'] || event.age_policy}
              </div>
            )}
            {event.dress_code && event.dress_code !== 'none' && (
              <div className="flex items-center gap-2 bg-primary/10 dark:bg-primary/30 text-primary dark:text-primary rounded-none px-3 py-2 text-sm">
                👔 {DRESS_CODE_LABELS[event.dress_code]?.[language === 'ru' ? 'ru' : 'en'] || event.dress_code}
              </div>
            )}
          </div>
        )}

        {/* Venue Card */}
        {venue ? (
          <Card className="mb-6 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/venues/${venue.id}`)}>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-16 h-16 rounded-none overflow-hidden flex-shrink-0">
                <img src={venue.cover_image || '/placeholder.svg'} alt={language === 'ru' ? venue.name_ru : venue.name_en} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="w-4 h-4 text-primary" />
                  <p className="font-medium truncate">{language === 'ru' ? venue.name_ru : venue.name_en}</p>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {language === 'ru' ? (venue.address_ru || venue.address) : venue.address}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            </CardContent>
          </Card>
        ) : event.location_name && (
          <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{language === 'ru' ? event.location_ru : event.location_name}</span>
          </div>
        )}

        {/* Description */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2">{language === 'ru' ? 'Описание' : 'Description'}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {language === 'ru' ? event.description_ru : event.description_en}
          </p>
        </div>

        {/* Marketing Tags */}
        {event.marketing_tags && event.marketing_tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {event.marketing_tags.map((tag, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">#{tag}</Badge>
            ))}
          </div>
        )}

        {/* Itinerary */}
        {event.itinerary.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-3">{language === 'ru' ? 'Программа' : 'Itinerary'}</h3>
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
              <CheckCircle className="w-4 h-4 text-success" />
              {language === 'ru' ? 'Включено' : 'Included'}
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {event.includes.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-3 h-3 text-success shrink-0" />
                  <span>{language === 'ru' ? item.ru : item.en}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Excludes */}
        {event.excludes.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-accent" />
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

        {/* Source verification */}
        {event.source_urls && event.source_urls.length > 0 && (
          <div className="mb-24 p-3 rounded-none bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
              <ShieldCheck className="w-3 h-3" />
              {language === 'ru' ? 'Данные от организатора' : 'Data from organizer'}
            </p>
            {event.source_urls.map((url, idx) => (
              <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                <ExternalLink className="w-3 h-3" />
                {new URL(url).hostname}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 border-t border-border">
        <div className="flex items-center justify-between gap-4">
          {!isFree && (
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-border rounded-none">
                <Button variant="ghost" size="sm" onClick={() => setTickets(Math.max(1, tickets - 1))} disabled={tickets <= 1}>-</Button>
                <span className="w-8 text-center font-medium">{tickets}</span>
                <Button variant="ghost" size="sm" onClick={() => setTickets(Math.min(event.spots_left || 10, tickets + 1))}>+</Button>
              </div>
              <div>
                <p className="text-xl font-bold text-primary">{currencyInfo.symbol}{totalPrice.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{tickets} {language === 'ru' ? 'билет(ов)' : 'ticket(s)'}</p>
              </div>
            </div>
          )}
          
          {hasTicketUrl ? (
            <Button size="lg" className="flex-1" asChild>
              <a href={event.ticket_url!} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                {language === 'ru' ? 'Купить билет' : 'Get Tickets'}
              </a>
            </Button>
          ) : isFree ? (
            <Button size="lg" className="flex-1" onClick={() => navigate(`/events/booking/${id}?tickets=1`)}>
              {language === 'ru' ? 'Зарегистрироваться' : 'Register'}
            </Button>
          ) : (
            <Button size="lg" onClick={() => navigate(`/events/booking/${id}?tickets=${tickets}`)}>
              {language === 'ru' ? 'Забронировать' : 'Book Now'}
            </Button>
          )}
        </div>
      </div>
      </div>
    </AppLayout>
  );
};

export default EventDetail;
