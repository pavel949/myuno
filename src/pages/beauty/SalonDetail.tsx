import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Star, MapPin, Clock, Phone, Globe, 
  BadgeCheck, Heart, Share2, Calendar
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PremiumButton } from '@/components/uno/PremiumButton';
import { useViewHistory } from '@/hooks/useViewHistory';
import { cn } from '@/lib/utils';
import { BackButton } from '@/components/uno/BackButton';

// Demo salon details
const salonDetails = {
  'salon-1': {
    id: 'salon-1',
    name: 'Orchid Spa & Wellness',
    nameRu: 'Орхидея СПА и Велнес',
    description: 'A luxurious spa retreat offering traditional Thai treatments and modern wellness therapies in a serene tropical setting.',
    descriptionRu: 'Роскошный СПА-курорт, предлагающий традиционные тайские процедуры и современные велнес-терапии в безмятежной тропической обстановке.',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbec6c?w=800',
    gallery: [
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600',
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600',
      'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600',
    ],
    rating: 4.9,
    reviewCount: 156,
    location: 'Kata Beach, Phuket',
    locationRu: 'Ката Бич, Пхукет',
    address: '123 Kata Road, Kata Beach',
    phone: '+66 76 123 456',
    website: 'www.orchidspa.com',
    hours: '10:00 - 22:00',
    isVerified: true,
    services: [
      { id: 's1', name: 'Thai Massage', nameRu: 'Тайский массаж', price: 800, duration: 60 },
      { id: 's2', name: 'Aromatherapy Massage', nameRu: 'Ароматерапевтический массаж', price: 1200, duration: 90 },
      { id: 's3', name: 'Hot Stone Therapy', nameRu: 'Терапия горячими камнями', price: 1500, duration: 90 },
      { id: 's4', name: 'Facial Treatment', nameRu: 'Уход за лицом', price: 1800, duration: 60 },
      { id: 's5', name: 'Body Scrub', nameRu: 'Скраб для тела', price: 1000, duration: 45 },
      { id: 's6', name: 'Manicure & Pedicure', nameRu: 'Маникюр и педикюр', price: 800, duration: 60 },
    ],
  },
};

// Default salon for demo
const defaultSalon = {
  id: 'salon-default',
  name: 'Zen Beauty Studio',
  nameRu: 'Зен Бьюти Студио',
  description: 'Modern beauty salon with experienced stylists and latest treatments.',
  descriptionRu: 'Современный салон красоты с опытными стилистами и новейшими процедурами.',
  image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800',
  gallery: [],
  rating: 4.8,
  reviewCount: 89,
  location: 'Patong, Phuket',
  locationRu: 'Патонг, Пхукет',
  address: '45 Beach Road, Patong',
  phone: '+66 76 987 654',
  hours: '09:00 - 21:00',
  isVerified: true,
  services: [
    { id: 's1', name: 'Hair Cut', nameRu: 'Стрижка', price: 500, duration: 45 },
    { id: 's2', name: 'Hair Coloring', nameRu: 'Окрашивание', price: 2000, duration: 120 },
    { id: 's3', name: 'Manicure', nameRu: 'Маникюр', price: 400, duration: 45 },
    { id: 's4', name: 'Pedicure', nameRu: 'Педикюр', price: 500, duration: 60 },
  ],
};

export default function SalonDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { trackView } = useViewHistory();
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);

  const salon = salonDetails[id as keyof typeof salonDetails] || defaultSalon;

  // Track view when page loads
  useEffect(() => {
    if (id) {
      trackView(id, 'salon', {
        name: salon.name,
        name_en: salon.name,
        name_ru: salon.nameRu,
        image: salon.image,
        rating: salon.rating,
        location: salon.location,
      });
    }
  }, [id]);

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(s => s !== serviceId)
        : [...prev, serviceId]
    );
  };

  const totalPrice = salon.services
    .filter(s => selectedServices.includes(s.id))
    .reduce((sum, s) => sum + s.price, 0);

  const totalDuration = salon.services
    .filter(s => selectedServices.includes(s.id))
    .reduce((sum, s) => sum + s.duration, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Image */}
      <div className="relative h-72 sm:h-96">
        <img
          src={salon.image}
          alt={language === 'ru' ? salon.nameRu : salon.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        
        {/* Header actions */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <BackButton fallbackPath="/beauty" variant="overlay" />
          <div className="flex gap-2">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className={cn(
                "w-10 h-10 rounded-full glass flex items-center justify-center",
                isFavorite && "text-red-500"
              )}
            >
              <Heart className={cn("w-5 h-5", isFavorite && "fill-current")} />
            </button>
            <button className="w-10 h-10 rounded-full glass flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 -mt-8 relative z-10 space-y-6 pb-32">
        {/* Title Card */}
        <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-lg">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h1 className="text-xl font-display font-bold flex items-center gap-2">
                {language === 'ru' ? salon.nameRu : salon.name}
                {salon.isVerified && (
                  <BadgeCheck className="w-5 h-5 text-primary" />
                )}
              </h1>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{language === 'ru' ? salon.locationRu : salon.location}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-lg">
              <Star className="w-4 h-4 fill-primary text-primary" />
              <span className="font-semibold">{salon.rating}</span>
              <span className="text-xs text-muted-foreground">({salon.reviewCount})</span>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground">
            {language === 'ru' ? salon.descriptionRu : salon.description}
          </p>

          {/* Quick info */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-primary" />
              <span>{salon.hours}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-primary" />
              <span>{salon.phone}</span>
            </div>
          </div>
        </div>

        {/* Services */}
        <div>
          <h2 className="text-lg font-semibold mb-4">
            {language === 'ru' ? 'Выберите услуги' : 'Select Services'}
          </h2>
          <div className="space-y-3">
            {salon.services.map((service) => {
              const isSelected = selectedServices.includes(service.id);
              return (
                <button
                  key={service.id}
                  onClick={() => toggleService(service.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-xl border transition-all",
                    isSelected 
                      ? "bg-primary/10 border-primary" 
                      : "bg-card border-border/50 hover:border-primary/30"
                  )}
                >
                  <div className="text-left">
                    <h3 className="font-medium">
                      {language === 'ru' ? service.nameRu : service.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{service.duration} {language === 'ru' ? 'мин' : 'min'}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-primary">฿{service.price.toLocaleString()}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom booking bar */}
      {selectedServices.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border/50 z-50">
          <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                {selectedServices.length} {language === 'ru' ? 'услуг' : 'services'} • {totalDuration} {language === 'ru' ? 'мин' : 'min'}
              </p>
              <p className="text-xl font-bold text-primary">฿{totalPrice.toLocaleString()}</p>
            </div>
            <PremiumButton
              onClick={() => navigate(`/beauty/booking/${salon.id}`, { 
                state: { selectedServices, salon } 
              })}
              className="flex-1 max-w-[200px]"
            >
              <Calendar className="w-4 h-4 mr-2" />
              {t('action.book')}
            </PremiumButton>
          </div>
        </div>
      )}
    </div>
  );
}
