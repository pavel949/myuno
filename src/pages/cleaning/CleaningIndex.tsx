import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, Shirt, Home, Building, Sofa, Trash2, 
  Star, Clock, MapPin, Check, Shield, Calendar
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { FilterChip } from '@/components/uno/FilterChip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const serviceTypes = [
  { id: 'all', labelEn: 'All', labelRu: 'Все', icon: Sparkles },
  { id: 'home', labelEn: 'Home', labelRu: 'Дом', icon: Home },
  { id: 'laundry', labelEn: 'Laundry', labelRu: 'Прачечная', icon: Shirt },
  { id: 'office', labelEn: 'Office', labelRu: 'Офис', icon: Building },
  { id: 'deep', labelEn: 'Deep Clean', labelRu: 'Генеральная', icon: Sofa },
];

const cleaningServices = [
  {
    id: 'clean-1',
    type: 'home',
    nameEn: 'Regular Home Cleaning',
    nameRu: 'Регулярная уборка',
    descEn: 'Weekly or bi-weekly home cleaning service',
    descRu: 'Еженедельная уборка дома',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600',
    priceFrom: 800,
    duration: '2-3h',
    rating: 4.9,
    reviewCount: 234,
    provider: 'Clean House Phuket',
    isPopular: true,
  },
  {
    id: 'clean-2',
    type: 'deep',
    nameEn: 'Deep Cleaning',
    nameRu: 'Генеральная уборка',
    descEn: 'Complete deep clean of your entire home',
    descRu: 'Полная генеральная уборка',
    image: 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=600',
    priceFrom: 2500,
    duration: '4-6h',
    rating: 4.8,
    reviewCount: 156,
    provider: 'Pro Cleaners',
  },
  {
    id: 'clean-3',
    type: 'laundry',
    nameEn: 'Laundry & Ironing',
    nameRu: 'Стирка и глажка',
    descEn: 'Pickup, wash, iron and deliver',
    descRu: 'Заберём, постираем, погладим',
    image: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=600',
    priceFrom: 200,
    duration: '24h',
    rating: 4.7,
    reviewCount: 312,
    provider: 'Fresh Laundry',
    isNew: true,
  },
  {
    id: 'clean-4',
    type: 'office',
    nameEn: 'Office Cleaning',
    nameRu: 'Уборка офиса',
    descEn: 'Professional office cleaning services',
    descRu: 'Профессиональная уборка офисов',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600',
    priceFrom: 1500,
    duration: '3-4h',
    rating: 4.9,
    reviewCount: 89,
    provider: 'Corporate Clean',
  },
  {
    id: 'clean-5',
    type: 'home',
    nameEn: 'Move-in/out Cleaning',
    nameRu: 'Уборка при въезде/выезде',
    descEn: 'Perfect for moving apartments',
    descRu: 'Идеально при смене квартиры',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
    priceFrom: 3000,
    duration: '5-7h',
    rating: 4.8,
    reviewCount: 78,
    provider: 'Clean House Phuket',
  },
  {
    id: 'clean-6',
    type: 'laundry',
    nameEn: 'Dry Cleaning',
    nameRu: 'Химчистка',
    descEn: 'Premium dry cleaning for delicate items',
    descRu: 'Химчистка деликатных вещей',
    image: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=600',
    priceFrom: 300,
    duration: '48h',
    rating: 4.6,
    reviewCount: 145,
    provider: 'Deluxe Dry Clean',
  },
];

export default function CleaningIndex() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState('all');

  const filteredServices = cleaningServices.filter(s => 
    selectedType === 'all' || s.type === selectedType
  );

  return (
    <AppLayout>
      <div className="px-4 py-6 space-y-6">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/20 via-green-500/20 to-primary/20 p-6">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800')] bg-cover bg-center opacity-10" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-6 h-6 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-600">
                {language === 'ru' ? 'Уборка и прачечная' : 'Cleaning & Laundry'}
              </span>
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground mb-2">
              {language === 'ru' ? 'Чистота и свежесть' : 'Clean & Fresh'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {language === 'ru'
                ? 'Профессиональная уборка и услуги прачечной'
                : 'Professional cleaning and laundry services'}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            className="h-auto py-4 flex-col gap-2"
            onClick={() => navigate('/services/booking/cleaning')}
          >
            <Home className="w-6 h-6 text-emerald-500" />
            <span className="text-sm font-medium">
              {language === 'ru' ? 'Заказать уборку' : 'Book Cleaning'}
            </span>
          </Button>
          <Button 
            variant="outline" 
            className="h-auto py-4 flex-col gap-2"
            onClick={() => navigate('/services/booking/laundry')}
          >
            <Shirt className="w-6 h-6 text-blue-500" />
            <span className="text-sm font-medium">
              {language === 'ru' ? 'Сдать в стирку' : 'Laundry Pickup'}
            </span>
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {serviceTypes.map((type) => {
            const Icon = type.icon;
            return (
              <FilterChip
                key={type.id}
                label={language === 'ru' ? type.labelRu : type.labelEn}
                isActive={selectedType === type.id}
                onToggle={() => setSelectedType(type.id)}
                icon={<Icon className="w-4 h-4" />}
              />
            );
          })}
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              onClick={() => navigate(`/cleaning/${service.id}`)}
              className="bg-card rounded-2xl overflow-hidden border border-border/50 hover:border-primary/30 transition-all cursor-pointer"
            >
              <div className="relative h-36">
                <img
                  src={service.image}
                  alt={language === 'ru' ? service.nameRu : service.nameEn}
                  className="w-full h-full object-cover"
                />
                {service.isPopular && (
                  <Badge className="absolute top-2 left-2 bg-amber-500 text-white">
                    {language === 'ru' ? 'Популярно' : 'Popular'}
                  </Badge>
                )}
                {service.isNew && (
                  <Badge className="absolute top-2 left-2 bg-green-500 text-white">
                    {language === 'ru' ? 'Новое' : 'New'}
                  </Badge>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold truncate">
                  {language === 'ru' ? service.nameRu : service.nameEn}
                </h3>
                <p className="text-sm text-muted-foreground truncate mt-1">
                  {language === 'ru' ? service.descRu : service.descEn}
                </p>
                
                <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>{service.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{service.duration}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                  <span className="text-sm text-muted-foreground">{service.provider}</span>
                  <span className="text-lg font-bold text-primary">
                    ฿{service.priceFrom}+
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
