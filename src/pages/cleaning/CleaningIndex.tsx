import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Shirt, Home, Building, Sofa } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { MiniAppLayout, ItemCard, MiniAppQuickGrid, type MiniAppCategory, type QuickGridItem } from '@/components/miniapp';
import { FilterValues, cleaningFilterConfig } from '@/components/filters';
import { Button } from '@/components/ui/button';

const serviceTypes: MiniAppCategory[] = [
  { id: 'all', labelEn: 'All', labelRu: 'Все', icon: '✨' },
  { id: 'home', labelEn: 'Home', labelRu: 'Дом', icon: '🏠' },
  { id: 'laundry', labelEn: 'Laundry', labelRu: 'Прачечная', icon: '👔' },
  { id: 'office', labelEn: 'Office', labelRu: 'Офис', icon: '🏢' },
  { id: 'deep', labelEn: 'Deep Clean', labelRu: 'Генеральная', icon: '🧹' },
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
];

export default function CleaningIndex() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
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
    return cleaningServices.filter(s => {
      const name = language === 'ru' ? s.nameRu : s.nameEn;
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === 'all' || s.type === selectedType;
      
      // Service type filter
      const serviceTypes = filterValues.serviceType as string[] | undefined;
      if (serviceTypes?.length && !serviceTypes.includes(s.type)) return false;
      
      return matchesSearch && matchesType;
    });
  }, [searchQuery, selectedType, filterValues, language]);

  const quickItems: QuickGridItem[] = [
    { icon: '🏠', label: language === 'ru' ? 'Заказать' : 'Book', sublabel: language === 'ru' ? 'Уборку' : 'Cleaning', onClick: () => navigate('/services/booking/cleaning') },
    { icon: '👔', label: language === 'ru' ? 'Прачечная' : 'Laundry', sublabel: language === 'ru' ? 'Забор' : 'Pickup', onClick: () => navigate('/services/booking/laundry') },
    { icon: '✨', label: language === 'ru' ? 'Генеральная' : 'Deep', onClick: () => setSelectedType('deep') },
    { icon: '🏢', label: language === 'ru' ? 'Офис' : 'Office', onClick: () => setSelectedType('office') },
  ];

  return (
    <MiniAppLayout
      title={language === 'ru' ? 'Уборка и прачечная' : 'Cleaning & Laundry'}
      subtitle={language === 'ru' ? `${filteredServices.length} услуг` : `${filteredServices.length} services`}
      heroIcon={Sparkles}
      heroTitle={language === 'ru' ? 'Чистота и свежесть' : 'Clean & Fresh'}
      heroSubtitle={language === 'ru' ? 'Профессиональная уборка и услуги прачечной' : 'Professional cleaning and laundry services'}
      heroImage="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800"
      heroGradient={{ from: 'from-emerald-500/20', via: 'via-green-500/20', to: 'to-primary/20' }}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder={language === 'ru' ? 'Поиск услуг...' : 'Search services...'}
      categories={serviceTypes}
      selectedCategory={selectedType}
      onCategoryChange={setSelectedType}
      filterConfig={cleaningFilterConfig}
      filterValues={filterValues}
      onFilterChange={setFilterValues}
      filterActiveCount={activeFilterCount}
      isEmpty={filteredServices.length === 0}
      emptyIcon={Sparkles}
      emptyText={language === 'ru' ? 'Услуги не найдены' : 'No services found'}
    >
      <MiniAppQuickGrid items={quickItems} columns={4} className="mb-6" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredServices.map((service) => (
          <ItemCard
            key={service.id}
            image={service.image}
            title={language === 'ru' ? service.nameRu : service.nameEn}
            subtitle={language === 'ru' ? service.descRu : service.descEn}
            rating={service.rating}
            reviewCount={service.reviewCount}
            price={service.priceFrom}
            priceUnit={`+`}
            currency="฿"
            badge={service.isPopular 
              ? { text: language === 'ru' ? 'Популярно' : 'Popular', className: 'bg-amber-500 text-white' }
              : service.isNew 
                ? { text: language === 'ru' ? 'Новое' : 'New', className: 'bg-green-500 text-white' }
                : undefined
            }
            tags={[service.provider, service.duration]}
            onClick={() => navigate(`/cleaning/${service.id}`)}
          />
        ))}
      </div>
    </MiniAppLayout>
  );
}