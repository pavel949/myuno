import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  PawPrint, 
  MapPin, 
  Star, 
  Clock, 
  Phone, 
  MessageCircle,
  Shield,
  Check,
  ChevronRight,
  Heart,
  Share2,
  Calendar
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFavorites } from '@/hooks/useFavorites';
import { cn } from '@/lib/utils';

// Mock data - in production would come from API
const servicesData: Record<string, any> = {
  'pet-airways': {
    id: 'pet-airways',
    name: 'Pet Airways Thailand',
    nameRu: 'Pet Airways Таиланд',
    category: 'transport',
    description: 'International pet transport with care. Door-to-door delivery worldwide. We handle all documentation, customs, and quarantine requirements.',
    descriptionRu: 'Международная перевозка животных с заботой. Доставка от двери до двери по всему миру. Мы занимаемся всей документацией, таможней и карантинными требованиями.',
    image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800',
    gallery: [
      'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800',
      'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800',
      'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800',
    ],
    rating: 4.9,
    reviews: 156,
    priceFrom: 15000,
    location: 'Koh Samui & Bangkok',
    locationRu: 'Самуи и Бангкок',
    isVerified: true,
    phone: '+66 77 123 456',
    services: [
      { id: 's1', name: 'Domestic Flight', nameRu: 'Внутренний рейс', price: 5000, duration: '1-2 days' },
      { id: 's2', name: 'International (Asia)', nameRu: 'Международный (Азия)', price: 15000, duration: '3-5 days' },
      { id: 's3', name: 'International (Europe/US)', nameRu: 'Международный (Европа/США)', price: 35000, duration: '5-10 days' },
      { id: 's4', name: 'Documentation Only', nameRu: 'Только документы', price: 3000, duration: '2-3 days' },
    ],
    features: [
      { text: 'IATA Certified', textRu: 'Сертификат IATA' },
      { text: 'Insurance Included', textRu: 'Страховка включена' },
      { text: 'Door-to-door service', textRu: 'Доставка от двери до двери' },
      { text: 'Climate-controlled transport', textRu: 'Транспорт с климат-контролем' },
      { text: '24/7 Tracking', textRu: 'Отслеживание 24/7' },
    ],
    workingHours: '09:00 - 18:00',
    reviewsList: [
      { id: 'r1', author: 'Sarah M.', rating: 5, date: '2025-01-05', text: 'Excellent service! They transported my cat from Bangkok to London safely.' },
      { id: 'r2', author: 'Михаил К.', rating: 5, date: '2025-01-02', text: 'Профессионалы своего дела. Собака перенесла перелёт отлично.' },
    ],
  },
  'samui-vet': {
    id: 'samui-vet',
    name: 'Samui Veterinary Clinic',
    nameRu: 'Ветклиника Самуи',
    category: 'veterinary',
    description: 'Full-service veterinary clinic with modern equipment. Vaccinations, surgeries, emergency care, dental services, and more.',
    descriptionRu: 'Ветеринарная клиника полного цикла с современным оборудованием. Вакцинация, хирургия, экстренная помощь, стоматология и многое другое.',
    image: 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=800',
    gallery: [
      'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=800',
      'https://images.unsplash.com/photo-1612531386530-97286d97c2d2?w=800',
    ],
    rating: 4.8,
    reviews: 234,
    priceFrom: 500,
    location: 'Chaweng, Koh Samui',
    locationRu: 'Чавенг, Самуи',
    isVerified: true,
    is24h: true,
    phone: '+66 77 234 567',
    services: [
      { id: 's1', name: 'Consultation', nameRu: 'Консультация', price: 500, duration: '30 min' },
      { id: 's2', name: 'Vaccination Package', nameRu: 'Пакет вакцинации', price: 1500, duration: '45 min' },
      { id: 's3', name: 'Health Certificate', nameRu: 'Ветеринарный сертификат', price: 800, duration: '1 hour' },
      { id: 's4', name: 'Dental Cleaning', nameRu: 'Чистка зубов', price: 3000, duration: '2 hours' },
      { id: 's5', name: 'Sterilization', nameRu: 'Стерилизация', price: 5000, duration: '1 day' },
    ],
    features: [
      { text: '24/7 Emergency', textRu: 'Экстренная помощь 24/7' },
      { text: 'Modern Equipment', textRu: 'Современное оборудование' },
      { text: 'Experienced Vets', textRu: 'Опытные ветеринары' },
      { text: 'Pet Pharmacy', textRu: 'Зооаптека' },
    ],
    workingHours: '24/7',
    reviewsList: [
      { id: 'r1', author: 'John D.', rating: 5, date: '2025-01-08', text: 'Dr. Somchai is amazing! Saved my dog after an accident.' },
      { id: 'r2', author: 'Анна П.', rating: 4, date: '2025-01-03', text: 'Хорошая клиника, но цены выше среднего.' },
    ],
  },
};

// Default service for other IDs
const defaultService = {
  id: 'default',
  name: 'Pet Service',
  nameRu: 'Услуга для питомцев',
  category: 'general',
  description: 'Professional pet care service.',
  descriptionRu: 'Профессиональный уход за питомцами.',
  image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800',
  gallery: ['https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800'],
  rating: 4.5,
  reviews: 50,
  priceFrom: 1000,
  location: 'Koh Samui',
  locationRu: 'Самуи',
  isVerified: true,
  phone: '+66 77 000 000',
  services: [
    { id: 's1', name: 'Basic Service', nameRu: 'Базовая услуга', price: 1000, duration: '1 hour' },
  ],
  features: [
    { text: 'Professional Service', textRu: 'Профессиональный сервис' },
  ],
  workingHours: '09:00 - 18:00',
  reviewsList: [],
};

export default function PetServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [selectedService, setSelectedService] = useState<string | null>(null);

  const service = servicesData[id || ''] || { ...defaultService, id };
  const isFav = isFavorite(service.id, 'pet-service');

  const handleBooking = () => {
    navigate(`/pets/${id}/booking`, { 
      state: { selectedService: selectedService ? service.services.find((s: any) => s.id === selectedService) : null }
    });
  };

  return (
    <AppLayout title={language === 'ru' ? service.nameRu : service.name}>
      {/* Hero Image */}
      <div className="relative h-64">
        <img
          src={service.image}
          alt={service.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            size="icon"
            variant="secondary"
            className="rounded-full bg-white/20 backdrop-blur-sm"
            onClick={() => toggleFavorite(service.id, 'pet-service', service)}
          >
            <Heart className={cn("w-5 h-5", isFav && "fill-red-500 text-red-500")} />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="rounded-full bg-white/20 backdrop-blur-sm"
          >
            <Share2 className="w-5 h-5" />
          </Button>
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-2 text-white mb-1">
            {service.isVerified && (
              <Badge className="bg-emerald-500 text-white text-xs">
                <Shield className="w-3 h-3 mr-1" />
                {language === 'ru' ? 'Проверено' : 'Verified'}
              </Badge>
            )}
            {service.is24h && (
              <Badge className="bg-blue-500 text-white text-xs">
                <Clock className="w-3 h-3 mr-1" />
                24/7
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-32 -mt-4 relative">
        <div className="bg-background rounded-t-2xl pt-4">
          {/* Header */}
          <div className="mb-4">
            <h1 className="text-xl font-bold mb-2">
              {language === 'ru' ? service.nameRu : service.name}
            </h1>
            
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="font-medium">{service.rating}</span>
                <span className="text-muted-foreground">({service.reviews})</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{language === 'ru' ? service.locationRu : service.location}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 mb-6">
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <a href={`tel:${service.phone}`}>
                <Phone className="w-4 h-4 mr-2" />
                {language === 'ru' ? 'Позвонить' : 'Call'}
              </a>
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <MessageCircle className="w-4 h-4 mr-2" />
              {language === 'ru' ? 'Написать' : 'Message'}
            </Button>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="services" className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="services">
                {language === 'ru' ? 'Услуги' : 'Services'}
              </TabsTrigger>
              <TabsTrigger value="about">
                {language === 'ru' ? 'О нас' : 'About'}
              </TabsTrigger>
              <TabsTrigger value="reviews">
                {language === 'ru' ? 'Отзывы' : 'Reviews'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="services" className="mt-4 space-y-3">
              {service.services.map((s: any) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedService(selectedService === s.id ? null : s.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left",
                    selectedService === s.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  )}
                >
                  <div>
                    <div className="font-medium">
                      {language === 'ru' ? s.nameRu : s.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {s.duration}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">฿{s.price.toLocaleString()}</span>
                    {selectedService === s.id && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </TabsContent>

            <TabsContent value="about" className="mt-4 space-y-4">
              <div>
                <h3 className="font-semibold mb-2">
                  {language === 'ru' ? 'Описание' : 'Description'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {language === 'ru' ? service.descriptionRu : service.description}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">
                  {language === 'ru' ? 'Особенности' : 'Features'}
                </h3>
                <div className="space-y-2">
                  {service.features.map((f: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span>{language === 'ru' ? f.textRu : f.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">
                  {language === 'ru' ? 'Часы работы' : 'Working Hours'}
                </h3>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{service.workingHours}</span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="mt-4 space-y-4">
              {service.reviewsList.length > 0 ? (
                service.reviewsList.map((review: any) => (
                  <div key={review.id} className="p-4 rounded-xl bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{review.author}</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span className="text-sm">{review.rating}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{review.text}</p>
                    <div className="text-xs text-muted-foreground mt-2">{review.date}</div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  {language === 'ru' ? 'Пока нет отзывов' : 'No reviews yet'}
                </p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-50">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
          <div>
            <div className="text-sm text-muted-foreground">
              {language === 'ru' ? 'от' : 'from'}
            </div>
            <div className="text-xl font-bold">
              ฿{service.priceFrom.toLocaleString()}
            </div>
          </div>
          <Button onClick={handleBooking} size="lg" className="flex-1">
            <Calendar className="w-4 h-4 mr-2" />
            {language === 'ru' ? 'Записаться' : 'Book Now'}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
