import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PawPrint, 
  Plane, 
  Syringe, 
  Hotel, 
  Scissors, 
  GraduationCap,
  Heart,
  Stethoscope,
  Search,
  MapPin,
  Star,
  Clock,
  Shield,
  Filter
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface PetCategory {
  id: string;
  icon: React.ElementType;
  label: string;
  labelRu: string;
  color: string;
  count: number;
}

const categories: PetCategory[] = [
  { id: 'all', icon: PawPrint, label: 'All', labelRu: 'Все', color: 'from-amber-500 to-orange-500', count: 24 },
  { id: 'transport', icon: Plane, label: 'Transport', labelRu: 'Перевозка', color: 'from-blue-500 to-indigo-500', count: 6 },
  { id: 'veterinary', icon: Stethoscope, label: 'Veterinary', labelRu: 'Ветеринария', color: 'from-emerald-500 to-green-500', count: 8 },
  { id: 'hotel', icon: Hotel, label: 'Hotels', labelRu: 'Гостиницы', color: 'from-purple-500 to-pink-500', count: 5 },
  { id: 'grooming', icon: Scissors, label: 'Grooming', labelRu: 'Груминг', color: 'from-rose-500 to-red-500', count: 7 },
  { id: 'training', icon: GraduationCap, label: 'Training', labelRu: 'Дрессировка', color: 'from-cyan-500 to-blue-500', count: 4 },
];

interface PetService {
  id: string;
  name: string;
  nameRu: string;
  category: string;
  description: string;
  descriptionRu: string;
  image: string;
  rating: number;
  reviews: number;
  priceFrom: number;
  location: string;
  locationRu: string;
  isVerified: boolean;
  is24h?: boolean;
  badges: string[];
}

const petServices: PetService[] = [
  {
    id: 'pet-airways',
    name: 'Pet Airways Thailand',
    nameRu: 'Pet Airways Таиланд',
    category: 'transport',
    description: 'International pet transport with care. Door-to-door delivery worldwide.',
    descriptionRu: 'Международная перевозка животных с заботой. Доставка от двери до двери по всему миру.',
    image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800',
    rating: 4.9,
    reviews: 156,
    priceFrom: 15000,
    location: 'Koh Samui & Bangkok',
    locationRu: 'Самуи и Бангкок',
    isVerified: true,
    badges: ['IATA Certified', 'Insurance Included'],
  },
  {
    id: 'samui-vet',
    name: 'Samui Veterinary Clinic',
    nameRu: 'Ветклиника Самуи',
    category: 'veterinary',
    description: 'Full-service veterinary clinic. Vaccinations, surgeries, emergency care.',
    descriptionRu: 'Полный спектр ветеринарных услуг. Вакцинация, хирургия, экстренная помощь.',
    image: 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=800',
    rating: 4.8,
    reviews: 234,
    priceFrom: 500,
    location: 'Chaweng, Koh Samui',
    locationRu: 'Чавенг, Самуи',
    isVerified: true,
    is24h: true,
    badges: ['24/7', 'Emergency'],
  },
  {
    id: 'paradise-pet-hotel',
    name: 'Paradise Pet Hotel',
    nameRu: 'Райский Отель для Питомцев',
    category: 'hotel',
    description: 'Luxury pet boarding with swimming pool and daily activities.',
    descriptionRu: 'Люкс-пансион для питомцев с бассейном и ежедневными активностями.',
    image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800',
    rating: 4.7,
    reviews: 89,
    priceFrom: 800,
    location: 'Maenam, Koh Samui',
    locationRu: 'Маенам, Самуи',
    isVerified: true,
    badges: ['Pool', 'Webcam'],
  },
  {
    id: 'pawfect-grooming',
    name: 'Pawfect Grooming Salon',
    nameRu: 'Салон Груминга Pawfect',
    category: 'grooming',
    description: 'Professional grooming for dogs and cats. Spa treatments available.',
    descriptionRu: 'Профессиональный груминг для собак и кошек. СПА-процедуры.',
    image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=800',
    rating: 4.9,
    reviews: 178,
    priceFrom: 600,
    location: 'Lamai, Koh Samui',
    locationRu: 'Ламай, Самуи',
    isVerified: true,
    badges: ['Organic Products'],
  },
  {
    id: 'island-dog-training',
    name: 'Island Dog Training',
    nameRu: 'Островная Школа Дрессировки',
    category: 'training',
    description: 'Obedience training, behavior correction, puppy classes.',
    descriptionRu: 'Курсы послушания, коррекция поведения, занятия для щенков.',
    image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800',
    rating: 4.6,
    reviews: 67,
    priceFrom: 1500,
    location: 'Bophut, Koh Samui',
    locationRu: 'Бопут, Самуи',
    isVerified: true,
    badges: ['Certified Trainer'],
  },
  {
    id: 'pet-relocate-asia',
    name: 'Pet Relocate Asia',
    nameRu: 'Pet Relocate Asia',
    category: 'transport',
    description: 'Stress-free pet relocation. All paperwork handled.',
    descriptionRu: 'Релокация питомцев без стресса. Оформление всех документов.',
    image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800',
    rating: 4.8,
    reviews: 92,
    priceFrom: 12000,
    location: 'All Thailand',
    locationRu: 'Вся Таиланд',
    isVerified: true,
    badges: ['Documents', 'Quarantine Help'],
  },
  {
    id: 'animal-hospital',
    name: 'Samui Animal Hospital',
    nameRu: 'Госпиталь для Животных Самуи',
    category: 'veterinary',
    description: 'Modern hospital with surgery, x-ray, and laboratory.',
    descriptionRu: 'Современный госпиталь с хирургией, рентгеном и лабораторией.',
    image: 'https://images.unsplash.com/photo-1612531386530-97286d97c2d2?w=800',
    rating: 4.9,
    reviews: 312,
    priceFrom: 800,
    location: 'Nathon, Koh Samui',
    locationRu: 'Натон, Самуи',
    isVerified: true,
    is24h: true,
    badges: ['Surgery', 'X-Ray', '24/7'],
  },
  {
    id: 'happy-tails-hotel',
    name: 'Happy Tails Pet Resort',
    nameRu: 'Happy Tails Резорт',
    category: 'hotel',
    description: 'Family-run pet resort with garden and personal care.',
    descriptionRu: 'Семейный пансион с садом и персональным уходом.',
    image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800',
    rating: 4.8,
    reviews: 145,
    priceFrom: 600,
    location: 'Chaweng, Koh Samui',
    locationRu: 'Чавенг, Самуи',
    isVerified: true,
    badges: ['Garden', 'Pick-up'],
  },
];

export default function PetsIndex() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredServices = petServices.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.nameRu.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <AppLayout title={language === 'ru' ? 'Питомцы' : 'Pets'}>
      <PageContainer className="pb-24">
        {/* Hero Section */}
        <div className="relative rounded-2xl overflow-hidden mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/90 to-orange-600/90" />
          <div className="relative p-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              <PawPrint className="w-6 h-6" />
              <span className="text-sm font-medium opacity-90">
                {language === 'ru' ? 'Всё для питомцев' : 'Everything for Pets'}
              </span>
            </div>
            <h1 className="text-2xl font-bold mb-2">
              {language === 'ru' ? 'Забота о вашем друге' : 'Care for Your Friend'}
            </h1>
            <p className="text-sm opacity-90">
              {language === 'ru' 
                ? 'Перевозка, ветеринария, гостиницы, груминг' 
                : 'Transport, veterinary, hotels, grooming'}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder={language === 'ru' ? 'Поиск услуг...' : 'Search services...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 rounded-xl"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap transition-all",
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-card border border-border hover:border-primary/30"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {language === 'ru' ? cat.labelRu : cat.label}
                </span>
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full",
                  isSelected ? "bg-white/20" : "bg-muted"
                )}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => navigate('/pets/transport')}
            className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white"
          >
            <Plane className="w-8 h-8" />
            <div className="text-left">
              <div className="font-semibold">
                {language === 'ru' ? 'Перевозка' : 'Transport'}
              </div>
              <div className="text-xs opacity-80">
                {language === 'ru' ? 'По всему миру' : 'Worldwide'}
              </div>
            </div>
          </button>
          <button
            onClick={() => setSelectedCategory('veterinary')}
            className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white"
          >
            <Syringe className="w-8 h-8" />
            <div className="text-left">
              <div className="font-semibold">
                {language === 'ru' ? 'Вакцинация' : 'Vaccination'}
              </div>
              <div className="text-xs opacity-80">
                {language === 'ru' ? 'Сертификаты' : 'Certificates'}
              </div>
            </div>
          </button>
        </div>

        {/* Services List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">
              {language === 'ru' ? 'Услуги' : 'Services'}
              <span className="text-muted-foreground font-normal ml-2">
                ({filteredServices.length})
              </span>
            </h2>
            <Button variant="ghost" size="sm">
              <Filter className="w-4 h-4 mr-1" />
              {language === 'ru' ? 'Фильтр' : 'Filter'}
            </Button>
          </div>

          {filteredServices.map((service) => (
            <button
              key={service.id}
              onClick={() => navigate(`/pets/${service.id}`)}
              className="w-full flex gap-4 p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-all text-left"
            >
              <img
                src={service.image}
                alt={service.name}
                className="w-24 h-24 rounded-lg object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold line-clamp-1">
                    {language === 'ru' ? service.nameRu : service.name}
                  </h3>
                  {service.isVerified && (
                    <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                  {language === 'ru' ? service.descriptionRu : service.description}
                </p>

                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <div className="flex items-center gap-1 text-xs">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span className="font-medium">{service.rating}</span>
                    <span className="text-muted-foreground">({service.reviews})</span>
                  </div>
                  {service.is24h && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      <Clock className="w-3 h-3 mr-0.5" />
                      24/7
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span className="line-clamp-1">
                      {language === 'ru' ? service.locationRu : service.location}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-primary">
                    {language === 'ru' ? 'от' : 'from'} ฿{service.priceFrom.toLocaleString()}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </PageContainer>
    </AppLayout>
  );
}
