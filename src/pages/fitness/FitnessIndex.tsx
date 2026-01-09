import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, MapPin, Star, Clock, Users, Dumbbell, 
  Heart, Flame, Trophy, ArrowLeft, Filter
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { triggerRipple } from '@/hooks/useRipple';

const gymTypes = [
  { id: 'all', labelEn: 'All', labelRu: 'Все' },
  { id: 'gym', labelEn: 'Gym', labelRu: 'Зал' },
  { id: 'yoga', labelEn: 'Yoga', labelRu: 'Йога' },
  { id: 'muay-thai', labelEn: 'Muay Thai', labelRu: 'Муай Тай' },
  { id: 'crossfit', labelEn: 'CrossFit', labelRu: 'Кроссфит' },
  { id: 'swimming', labelEn: 'Swimming', labelRu: 'Бассейн' },
];

const gyms = [
  {
    id: 'gym-1',
    name: 'Tiger Muay Thai',
    nameRu: 'Тигр Муай Тай',
    type: 'muay-thai',
    image: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=600',
    rating: 4.9,
    reviewCount: 456,
    location: 'Chalong',
    locationRu: 'Чалонг',
    price: 800,
    priceType: 'day',
    isVerified: true,
    isFeatured: true,
    amenities: ['Trainers', 'Showers', 'Equipment'],
  },
  {
    id: 'gym-2',
    name: 'Phuket Fit Resort',
    nameRu: 'Пхукет Фит Резорт',
    type: 'gym',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600',
    rating: 4.8,
    reviewCount: 234,
    location: 'Rawai',
    locationRu: 'Равай',
    price: 2500,
    priceType: 'month',
    isVerified: true,
    amenities: ['Pool', 'Sauna', 'Restaurant'],
  },
  {
    id: 'gym-3',
    name: 'Yoga Republic',
    nameRu: 'Йога Репаблик',
    type: 'yoga',
    image: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=600',
    rating: 4.9,
    reviewCount: 189,
    location: 'Kata',
    locationRu: 'Ката',
    price: 500,
    priceType: 'class',
    isNew: true,
    amenities: ['Mats', 'Props', 'Tea'],
  },
  {
    id: 'gym-4',
    name: 'CrossFit Phuket',
    nameRu: 'Кроссфит Пхукет',
    type: 'crossfit',
    image: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=600',
    rating: 4.7,
    reviewCount: 156,
    location: 'Patong',
    locationRu: 'Патонг',
    price: 600,
    priceType: 'class',
    isVerified: true,
    amenities: ['Coaches', 'Equipment', 'Community'],
  },
  {
    id: 'gym-5',
    name: 'Aqua Fitness Center',
    nameRu: 'Аква Фитнес Центр',
    type: 'swimming',
    image: 'https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=600',
    rating: 4.6,
    reviewCount: 98,
    location: 'Phuket Town',
    locationRu: 'Пхукет Таун',
    price: 300,
    priceType: 'day',
    amenities: ['Olympic Pool', 'Kids Pool', 'Jacuzzi'],
  },
];

const FitnessIndex = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  const filteredGyms = gyms.filter(gym => {
    const matchesSearch = gym.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         gym.nameRu.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || gym.type === selectedType;
    return matchesSearch && matchesType;
  });

  const getPriceLabel = (type: string) => {
    const labels: Record<string, { en: string; ru: string }> = {
      day: { en: '/day', ru: '/день' },
      month: { en: '/month', ru: '/мес' },
      class: { en: '/class', ru: '/занятие' },
    };
    return language === 'ru' ? labels[type]?.ru : labels[type]?.en;
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
                  {language === 'ru' ? 'Фитнес и Спорт' : 'Fitness & Sports'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {language === 'ru' ? 'Залы, тренеры, занятия' : 'Gyms, trainers, classes'}
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={language === 'ru' ? 'Поиск залов...' : 'Search gyms...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Type Filters */}
          <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
            {gymTypes.map(type => (
              <Button
                key={type.id}
                variant={selectedType === type.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType(type.id)}
                className="shrink-0"
              >
                {language === 'ru' ? type.labelRu : type.labelEn}
              </Button>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="px-4 py-4 grid grid-cols-3 gap-3">
          <div className="bg-card rounded-xl p-3 border border-border text-center">
            <Dumbbell className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold">{gyms.length}</p>
            <p className="text-xs text-muted-foreground">
              {language === 'ru' ? 'Залов' : 'Gyms'}
            </p>
          </div>
          <div className="bg-card rounded-xl p-3 border border-border text-center">
            <Users className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold">50+</p>
            <p className="text-xs text-muted-foreground">
              {language === 'ru' ? 'Тренеров' : 'Trainers'}
            </p>
          </div>
          <div className="bg-card rounded-xl p-3 border border-border text-center">
            <Flame className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold">100+</p>
            <p className="text-xs text-muted-foreground">
              {language === 'ru' ? 'Занятий' : 'Classes'}
            </p>
          </div>
        </div>

        {/* Gyms List */}
        <div className="flex-1 px-4 pb-24 space-y-4">
          {filteredGyms.map(gym => (
            <div
              key={gym.id}
              onClick={(e) => {
                triggerRipple(e);
                navigate(`/fitness/gym/${gym.id}`);
              }}
              className="relative overflow-hidden bg-card rounded-xl border border-border cursor-pointer hover:border-primary/30 transition-all active:scale-[0.98]"
            >
              <div className="relative h-40">
                <img
                  src={gym.image}
                  alt={gym.name}
                  className="w-full h-full object-cover"
                />
                {gym.isFeatured && (
                  <Badge className="absolute top-2 left-2 bg-primary">
                    {language === 'ru' ? 'Топ' : 'Featured'}
                  </Badge>
                )}
                {gym.isNew && (
                  <Badge className="absolute top-2 left-2 bg-green-500">
                    {language === 'ru' ? 'Новый' : 'New'}
                  </Badge>
                )}
                {gym.isVerified && (
                  <Badge className="absolute top-2 right-2" variant="secondary">
                    ✓ {language === 'ru' ? 'Проверен' : 'Verified'}
                  </Badge>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">
                    {language === 'ru' ? gym.nameRu : gym.name}
                  </h3>
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>{gym.rating}</span>
                    <span className="text-muted-foreground">({gym.reviewCount})</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                  <MapPin className="w-3 h-3" />
                  <span>{language === 'ru' ? gym.locationRu : gym.location}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {gym.amenities.slice(0, 3).map(amenity => (
                      <Badge key={amenity} variant="outline" className="text-xs">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                  <p className="font-semibold text-primary">
                    ฿{gym.price}{getPriceLabel(gym.priceType)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default FitnessIndex;