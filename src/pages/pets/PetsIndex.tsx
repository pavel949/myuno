import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PawPrint, Plane, Syringe, Hotel, Scissors, GraduationCap, Star, Clock, MapPin, Shield } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { MiniAppLayout, ItemCard, MiniAppQuickGrid, type MiniAppCategory, type QuickGridItem } from '@/components/miniapp';
import { FilterValues, petsFilterConfig } from '@/components/filters';

const categories: MiniAppCategory[] = [
  { id: 'all', labelEn: 'All', labelRu: 'Все', icon: '🐾' },
  { id: 'transport', labelEn: 'Transport', labelRu: 'Перевозка', icon: '✈️' },
  { id: 'veterinary', labelEn: 'Veterinary', labelRu: 'Ветеринария', icon: '🏥' },
  { id: 'hotel', labelEn: 'Hotels', labelRu: 'Гостиницы', icon: '🏨' },
  { id: 'grooming', labelEn: 'Grooming', labelRu: 'Груминг', icon: '✂️' },
  { id: 'training', labelEn: 'Training', labelRu: 'Дрессировка', icon: '🎓' },
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
];

export default function PetsIndex() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filterValues, setFilterValues] = useState<FilterValues>({});

  const activeFilterCount = useMemo(() => {
    let count = 0;
    Object.entries(filterValues).forEach(([key, value]) => {
      if (key === 'priceLevel' && value) count++;
      else if (Array.isArray(value)) count += value.length;
      else if (value) count++;
    });
    return count;
  }, [filterValues]);

  const filteredServices = useMemo(() => {
    return petServices.filter(service => {
      const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.nameRu.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
      
      // Filter by service type
      const serviceTypes = filterValues.serviceType as string[] | undefined;
      if (serviceTypes?.length && !serviceTypes.includes(service.category)) return false;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory, filterValues]);

  const quickItems: QuickGridItem[] = [
    { icon: '✈️', label: language === 'ru' ? 'Перевозка' : 'Transport', sublabel: language === 'ru' ? 'По миру' : 'Worldwide', onClick: () => navigate('/pets/transport') },
    { icon: '💉', label: language === 'ru' ? 'Вакцинация' : 'Vaccination', sublabel: language === 'ru' ? 'Сертификаты' : 'Certificates', onClick: () => setSelectedCategory('veterinary') },
    { icon: '🏨', label: language === 'ru' ? 'Отели' : 'Hotels', onClick: () => setSelectedCategory('hotel') },
    { icon: '✂️', label: language === 'ru' ? 'Груминг' : 'Grooming', onClick: () => setSelectedCategory('grooming') },
  ];

  return (
    <MiniAppLayout
      title={language === 'ru' ? 'Питомцы' : 'Pets'}
      subtitle={language === 'ru' ? `${filteredServices.length} услуг` : `${filteredServices.length} services`}
      heroIcon={PawPrint}
      heroTitle={language === 'ru' ? 'Забота о вашем друге' : 'Care for Your Friend'}
      heroSubtitle={language === 'ru' ? 'Перевозка, ветеринария, гостиницы, груминг' : 'Transport, veterinary, hotels, grooming'}
      heroGradientFrom="from-amber-500/20"
      heroGradientVia="via-orange-500/20"
      heroGradientTo="to-primary/20"
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder={language === 'ru' ? 'Поиск услуг...' : 'Search services...'}
      categories={categories}
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
      filterConfig={petsFilterConfig}
      filterValues={filterValues}
      onFilterChange={setFilterValues}
      filterActiveCount={activeFilterCount}
      isEmpty={filteredServices.length === 0}
      emptyIcon={PawPrint}
      emptyText={language === 'ru' ? 'Услуги не найдены' : 'No services found'}
    >
      <MiniAppQuickGrid items={quickItems} columns={4} className="mb-6" />

      <div className="grid gap-4">
        {filteredServices.map((service) => (
          <ItemCard
            key={service.id}
            image={service.image}
            title={language === 'ru' ? service.nameRu : service.name}
            subtitle={language === 'ru' ? service.descriptionRu : service.description}
            rating={service.rating}
            reviewCount={service.reviews}
            location={language === 'ru' ? service.locationRu : service.location}
            price={service.priceFrom}
            pricePrefix={language === 'ru' ? 'от' : 'from'}
            currency="฿"
            isVerified={service.isVerified}
            badge={service.is24h ? { text: '24/7', className: 'bg-green-500 text-white' } : undefined}
            tags={service.badges.slice(0, 2)}
            onClick={() => navigate(`/pets/${service.id}`)}
          />
        ))}
      </div>
    </MiniAppLayout>
  );
}