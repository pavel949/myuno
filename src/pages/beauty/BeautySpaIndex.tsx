import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, MapPin, Star } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { MiniAppLayout, ItemCard, MiniAppQuickGrid, type MiniAppCategory, type QuickGridItem } from '@/components/miniapp';
import { beautyFilterConfig, FilterValues } from '@/components/filters';
import { Button } from '@/components/ui/button';

const demoSalons = [
  {
    id: 'salon-1',
    name: 'Orchid Spa & Wellness',
    nameRu: 'Орхидея СПА и Велнес',
    image: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=600',
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

const SERVICE_CATEGORIES: MiniAppCategory[] = [
  { id: 'all', labelEn: 'All', labelRu: 'Все' },
  { id: 'massage', labelEn: 'Massage', labelRu: 'Массаж' },
  { id: 'hair', labelEn: 'Hair', labelRu: 'Волосы' },
  { id: 'nails', labelEn: 'Nails', labelRu: 'Ногти' },
  { id: 'facial', labelEn: 'Facial', labelRu: 'Уход за лицом' },
  { id: 'makeup', labelEn: 'Makeup', labelRu: 'Макияж' },
];

export default function BeautySpaIndex() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filterValues, setFilterValues] = useState<FilterValues>({});

  const filteredSalons = demoSalons.filter(salon => {
    const name = language === 'ru' ? salon.nameRu : salon.name;
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const quickItems: QuickGridItem[] = [
    { icon: '💆', label: language === 'ru' ? 'Массаж' : 'Massage', sublabel: '฿600', onClick: () => navigate('/beauty/services') },
    { icon: '💅', label: language === 'ru' ? 'Маникюр' : 'Manicure', sublabel: '฿400', onClick: () => navigate('/beauty/services') },
    { icon: '💇', label: language === 'ru' ? 'Стрижка' : 'Haircut', sublabel: '฿500', onClick: () => navigate('/beauty/services') },
    { icon: '🧖', label: language === 'ru' ? 'СПА' : 'Spa', sublabel: '฿1,500', onClick: () => navigate('/beauty/services') },
  ];

  return (
    <MiniAppLayout
      title={language === 'ru' ? 'Красота и СПА' : 'Beauty & Spa'}
      subtitle={language === 'ru' ? `${filteredSalons.length} салонов` : `${filteredSalons.length} salons`}
      heroIcon={Sparkles}
      heroTitle={language === 'ru' ? 'Найдите идеальный салон' : 'Find Your Perfect Salon'}
      heroSubtitle={language === 'ru' ? 'Лучшие СПА и салоны красоты на Пхукете' : 'Best spas and beauty salons in Phuket'}
      heroImage="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800"
      heroGradient={{ from: 'from-pink-500/20', via: 'via-purple-500/20', to: 'to-primary/20' }}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder={language === 'ru' ? 'Поиск салонов...' : 'Search salons...'}
      categories={SERVICE_CATEGORIES}
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
      filterConfig={beautyFilterConfig}
      filterValues={filterValues}
      onFilterChange={setFilterValues}
      showMapButton
      onMapClick={() => navigate('/beauty/map')}
      isLoading={false}
      isEmpty={filteredSalons.length === 0}
      emptyIcon={Sparkles}
      emptyText={language === 'ru' ? 'Салоны не найдены' : 'No salons found'}
    >
      <MiniAppQuickGrid items={quickItems} columns={4} className="mb-6" />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredSalons.map((salon) => (
          <ItemCard
            key={salon.id}
            variant="vertical"
            image={salon.image}
            title={language === 'ru' ? salon.nameRu : salon.name}
            rating={salon.rating}
            reviewCount={salon.reviewCount}
            price={salon.priceFrom}
            pricePrefix={t('label.from')}
            currency="฿"
            location={language === 'ru' ? salon.locationRu : salon.location}
            isVerified={salon.isVerified}
            isFeatured={salon.isFeatured}
            tags={(language === 'ru' ? salon.tagsRu : salon.tags).slice(0, 2)}
            onClick={() => navigate(`/beauty/salon/${salon.id}`)}
          />
        ))}
      </div>
    </MiniAppLayout>
  );
}