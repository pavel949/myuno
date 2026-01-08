import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Sparkles, Star, MapPin, Clock, ArrowRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { UnifiedCard } from '@/components/uno/UnifiedCard';
import { FilterChip } from '@/components/uno/FilterChip';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Demo salon data
const demoSalons = [
  {
    id: 'salon-1',
    name: 'Orchid Spa & Wellness',
    nameRu: 'Орхидея СПА и Велнес',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbec6c?w=600',
    rating: 4.9,
    reviewCount: 156,
    location: 'Kata Beach',
    locationRu: 'Ката Бич',
    isVerified: true,
    isFeatured: true,
    priceFrom: 1500,
    tags: ['Massage', 'Facial', 'Nail'],
    tagsRu: ['Массаж', 'Уход за лицом', 'Ногти'],
  },
  {
    id: 'salon-2',
    name: 'Zen Beauty Studio',
    nameRu: 'Зен Бьюти Студио',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600',
    rating: 4.8,
    reviewCount: 89,
    location: 'Patong',
    locationRu: 'Патонг',
    isVerified: true,
    isNew: true,
    priceFrom: 800,
    tags: ['Hair', 'Makeup', 'Nails'],
    tagsRu: ['Волосы', 'Макияж', 'Ногти'],
  },
  {
    id: 'salon-3',
    name: 'Thai Serenity Massage',
    nameRu: 'Тайский Массаж Серенити',
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600',
    rating: 4.7,
    reviewCount: 234,
    location: 'Kamala',
    locationRu: 'Камала',
    isVerified: false,
    priceFrom: 600,
    tags: ['Thai Massage', 'Oil Massage'],
    tagsRu: ['Тайский массаж', 'Масляный массаж'],
  },
  {
    id: 'salon-4',
    name: 'Luxe Nail Bar',
    nameRu: 'Люкс Нейл Бар',
    image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600',
    rating: 4.6,
    reviewCount: 67,
    location: 'Rawai',
    locationRu: 'Равай',
    isVerified: true,
    priceFrom: 500,
    tags: ['Manicure', 'Pedicure', 'Gel'],
    tagsRu: ['Маникюр', 'Педикюр', 'Гель'],
  },
];

const serviceCategories = [
  { id: 'all', labelEn: 'All', labelRu: 'Все', icon: '✨' },
  { id: 'massage', labelEn: 'Massage', labelRu: 'Массаж', icon: '💆' },
  { id: 'hair', labelEn: 'Hair', labelRu: 'Волосы', icon: '💇' },
  { id: 'nails', labelEn: 'Nails', labelRu: 'Ногти', icon: '💅' },
  { id: 'facial', labelEn: 'Facial', labelRu: 'Уход за лицом', icon: '🧖' },
  { id: 'makeup', labelEn: 'Makeup', labelRu: 'Макияж', icon: '💄' },
];

export default function BeautySpaIndex() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredSalons = demoSalons.filter(salon => {
    const name = language === 'ru' ? salon.nameRu : salon.name;
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
    // For now, all salons match all categories (would filter by actual data)
    return matchesSearch;
  });

  return (
    <AppLayout>
      <div className="px-4 py-6 space-y-6">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-primary/20 p-6">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800')] bg-cover bg-center opacity-10" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-6 h-6 text-primary" />
              <span className="text-sm font-medium text-primary">
                {language === 'ru' ? 'Красота и СПА' : 'Beauty & Spa'}
              </span>
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground mb-2">
              {language === 'ru' 
                ? 'Найдите идеальный салон' 
                : 'Find Your Perfect Salon'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {language === 'ru'
                ? 'Лучшие СПА и салоны красоты на Пхукете'
                : 'Best spas and beauty salons in Phuket'}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder={language === 'ru' ? 'Поиск салонов...' : 'Search salons...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 bg-card border-border/50"
          />
        </div>

        {/* Category filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {serviceCategories.map((cat) => (
            <FilterChip
              key={cat.id}
              label={`${cat.icon} ${language === 'ru' ? cat.labelRu : cat.labelEn}`}
              isActive={selectedCategory === cat.id}
              onToggle={() => setSelectedCategory(cat.id)}
            />
          ))}
        </div>

        {/* Quick Services */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {language === 'ru' ? 'Популярные услуги' : 'Popular Services'}
            </h2>
            <button 
              onClick={() => navigate('/beauty/services')}
              className="text-sm text-primary flex items-center gap-1"
            >
              {t('action.viewAll')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[
              { icon: '💆', label: language === 'ru' ? 'Массаж' : 'Massage', price: '฿600' },
              { icon: '💅', label: language === 'ru' ? 'Маникюр' : 'Manicure', price: '฿400' },
              { icon: '💇', label: language === 'ru' ? 'Стрижка' : 'Haircut', price: '฿500' },
              { icon: '🧖', label: language === 'ru' ? 'СПА' : 'Spa', price: '฿1,500' },
            ].map((service, i) => (
              <button
                key={i}
                onClick={() => navigate('/beauty/services')}
                className="flex flex-col items-center p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all"
              >
                <span className="text-2xl mb-1">{service.icon}</span>
                <span className="text-xs font-medium text-center">{service.label}</span>
                <span className="text-xs text-primary mt-1">{service.price}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Salons List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {language === 'ru' ? 'Салоны рядом' : 'Nearby Salons'}
            </h2>
            <span className="text-sm text-muted-foreground">
              {filteredSalons.length} {language === 'ru' ? 'найдено' : 'found'}
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredSalons.map((salon) => (
              <UnifiedCard
                key={salon.id}
                id={salon.id}
                image={salon.image}
                title={language === 'ru' ? salon.nameRu : salon.name}
                subtitle={`${t('label.from')} ฿${salon.priceFrom}`}
                rating={salon.rating}
                reviewCount={salon.reviewCount}
                location={language === 'ru' ? salon.locationRu : salon.location}
                isVerified={salon.isVerified}
                isNew={salon.isNew}
                isFeatured={salon.isFeatured}
                tags={language === 'ru' ? salon.tagsRu : salon.tags}
                onClick={() => navigate(`/beauty/salon/${salon.id}`)}
              />
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
