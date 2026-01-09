import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Star, MapPin, Clock, Calendar, Users,
  Share2, CheckCircle, Info, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { FavoriteButton } from '@/components/uno/FavoriteButton';
import { useViewHistory } from '@/hooks/useViewHistory';

const eventData = {
  id: 'event-2',
  name: 'Phi Phi Islands Tour',
  nameRu: 'Тур на острова Пхи-Пхи',
  category: 'tours',
  images: [
    'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=800',
    'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800',
    'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=800',
  ],
  date: '2026-01-12',
  time: '08:00',
  duration: '8 hours',
  durationRu: '8 часов',
  location: 'Rassada Pier',
  locationRu: 'Пирс Рассада',
  address: 'Rassada Pier, Phuket Town',
  price: 2500,
  rating: 4.9,
  reviewCount: 567,
  spotsLeft: 12,
  maxSpots: 30,
  descriptionEn: 'Experience the breathtaking beauty of Phi Phi Islands on this full-day tour. Visit Maya Bay, swim in crystal-clear waters, snorkel with tropical fish, and enjoy a delicious Thai lunch on the beach.',
  descriptionRu: 'Испытайте захватывающую красоту островов Пхи-Пхи в этом полнодневном туре. Посетите бухту Майя, плавайте в кристально чистых водах, сноркелинг с тропическими рыбами и насладитесь вкусным тайским обедом на пляже.',
  includes: [
    { en: 'Hotel pickup & drop-off', ru: 'Трансфер из отеля' },
    { en: 'Speedboat transportation', ru: 'Скоростной катер' },
    { en: 'Thai lunch buffet', ru: 'Шведский стол тайской кухни' },
    { en: 'Snorkeling equipment', ru: 'Снаряжение для сноркелинга' },
    { en: 'National park fees', ru: 'Входные билеты' },
    { en: 'English-speaking guide', ru: 'Гид на английском' },
  ],
  excludes: [
    { en: 'Personal expenses', ru: 'Личные расходы' },
    { en: 'Travel insurance', ru: 'Страховка' },
  ],
  itinerary: [
    { time: '07:00', en: 'Hotel pickup', ru: 'Забор из отеля' },
    { time: '08:30', en: 'Departure from Rassada Pier', ru: 'Отправление с пирса' },
    { time: '09:30', en: 'Phi Phi Ley - Maya Bay', ru: 'Пхи-Пхи Лей - бухта Майя' },
    { time: '11:00', en: 'Snorkeling at Pileh Lagoon', ru: 'Сноркелинг в лагуне Пиле' },
    { time: '12:30', en: 'Lunch at Phi Phi Don', ru: 'Обед на Пхи-Пхи Дон' },
    { time: '14:00', en: 'Free time & beach', ru: 'Свободное время и пляж' },
    { time: '15:30', en: 'Monkey Beach visit', ru: 'Пляж обезьян' },
    { time: '17:00', en: 'Return to Phuket', ru: 'Возвращение на Пхукет' },
  ],
  organizer: {
    name: 'Phuket Tours Co.',
    rating: 4.8,
    tours: 156,
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
  },
};

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [selectedImage, setSelectedImage] = useState(0);
  const [tickets, setTickets] = useState(1);
  const { trackView } = useViewHistory();

  useEffect(() => {
    trackView(id || eventData.id, 'event', {
      name_en: eventData.name,
      name_ru: eventData.nameRu,
      image: eventData.images[0],
      price: eventData.price,
      location: eventData.location,
    });
  }, [id]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'long',
      year: 'numeric',
      weekday: 'long'
    };
    return date.toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', options);
  };

  const totalPrice = eventData.price * tickets;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header Image */}
      <div className="relative h-72">
        <img
          src={eventData.images[selectedImage]}
          alt={eventData.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Top Actions */}
        <div className="absolute top-4 left-4 right-4 flex justify-between">
          <Button variant="secondary" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex gap-2">
            <FavoriteButton
              itemType="event"
              itemId={id || 'event-2'}
              itemData={{
                title_en: eventData.name,
                title_ru: eventData.nameRu,
                image: eventData.images[0],
                price: eventData.price,
                category: eventData.category,
              }}
              variant="secondary"
            />
            <Button variant="secondary" size="icon">
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Image Thumbnails */}
        <div className="absolute bottom-4 left-4 right-4 flex gap-2 justify-center">
          {eventData.images.map((img, idx) => (
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
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-6 -mt-6 bg-background rounded-t-3xl relative z-10">
        {/* Title Section */}
        <div className="mb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-display font-bold">
                {language === 'ru' ? eventData.nameRu : eventData.name}
              </h1>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-bold">{eventData.rating}</span>
              </div>
              <p className="text-sm text-muted-foreground">{eventData.reviewCount} reviews</p>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-card rounded-xl p-3 border border-border text-center">
            <Calendar className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-xs font-medium">{formatDate(eventData.date).split(',')[0]}</p>
            <p className="text-xs text-muted-foreground">{eventData.time}</p>
          </div>
          <div className="bg-card rounded-xl p-3 border border-border text-center">
            <Clock className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-xs font-medium">
              {language === 'ru' ? eventData.durationRu : eventData.duration}
            </p>
          </div>
          <div className="bg-card rounded-xl p-3 border border-border text-center">
            <Users className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-xs font-medium">{eventData.spotsLeft}</p>
            <p className="text-xs text-muted-foreground">
              {language === 'ru' ? 'мест' : 'spots'}
            </p>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span>{language === 'ru' ? eventData.locationRu : eventData.location}</span>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2">
            {language === 'ru' ? 'Описание' : 'Description'}
          </h3>
          <p className="text-muted-foreground text-sm">
            {language === 'ru' ? eventData.descriptionRu : eventData.descriptionEn}
          </p>
        </div>

        {/* Itinerary */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3">
            {language === 'ru' ? 'Программа' : 'Itinerary'}
          </h3>
          <div className="space-y-3">
            {eventData.itinerary.map((item, idx) => (
              <div key={idx} className="flex gap-3">
                <div className="text-sm font-medium text-primary w-12">{item.time}</div>
                <div className="flex-1 text-sm pb-3 border-b border-border last:border-0">
                  {language === 'ru' ? item.ru : item.en}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Includes */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            {language === 'ru' ? 'Включено' : 'Included'}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {eventData.includes.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span>{language === 'ru' ? item.ru : item.en}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Excludes */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-orange-500" />
            {language === 'ru' ? 'Не включено' : 'Not Included'}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {eventData.excludes.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>•</span>
                <span>{language === 'ru' ? item.ru : item.en}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Organizer */}
        <div className="mb-24 p-4 bg-card rounded-xl border border-border">
          <h3 className="font-semibold mb-3">
            {language === 'ru' ? 'Организатор' : 'Organizer'}
          </h3>
          <div className="flex items-center gap-3">
            <img
              src={eventData.organizer.image}
              alt={eventData.organizer.name}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div className="flex-1">
              <p className="font-medium">{eventData.organizer.name}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span>{eventData.organizer.rating}</span>
                <span>•</span>
                <span>{eventData.organizer.tours} tours</span>
              </div>
            </div>
            <Button variant="outline" size="sm">
              {language === 'ru' ? 'Связаться' : 'Contact'}
            </Button>
          </div>
        </div>
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
                onClick={() => setTickets(Math.min(eventData.spotsLeft, tickets + 1))}
                disabled={tickets >= eventData.spotsLeft}
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