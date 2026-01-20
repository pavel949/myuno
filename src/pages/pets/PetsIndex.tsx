import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PawPrint } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { MiniAppLayout, ItemCard, MiniAppQuickGrid, type MiniAppCategory, type QuickGridItem } from '@/components/miniapp';
import { FilterValues, petsFilterConfig } from '@/components/filters';
import { usePetServices } from '@/hooks/usePetServices';
import { matchesFilter, matchesPriceLevel } from '@/lib/filterUtils';

const categories: MiniAppCategory[] = [
  { id: 'all', labelEn: 'All', labelRu: 'Все', icon: '🐾' },
  { id: 'transport', labelEn: 'Transport', labelRu: 'Перевозка', icon: '✈️' },
  { id: 'veterinary', labelEn: 'Veterinary', labelRu: 'Ветеринария', icon: '🏥' },
  { id: 'hotel', labelEn: 'Hotels', labelRu: 'Гостиницы', icon: '🏨' },
  { id: 'grooming', labelEn: 'Grooming', labelRu: 'Груминг', icon: '✂️' },
  { id: 'training', labelEn: 'Training', labelRu: 'Дрессировка', icon: '🎓' },
];

export default function PetsIndex() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { services: petServices, isLoading } = usePetServices();
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
      const name = language === 'ru' ? service.name_ru : service.name_en;
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || service.service_type === selectedCategory;
      
      if (!matchesSearch || !matchesCategory) return false;
      
      // Service type filter from modal - using normalized comparison
      const serviceTypes = filterValues.serviceType as string[] | undefined;
      if (serviceTypes?.length && !matchesFilter([service.service_type || ''], serviceTypes)) return false;
      
      // Pet type filter
      const petTypes = filterValues.petType as string[] | undefined;
      if (petTypes?.length && !matchesFilter(service.pet_types || [], petTypes)) return false;
      
      // Price level filter
      const priceLevel = filterValues.priceLevel as string | undefined;
      if (priceLevel && !matchesPriceLevel(service.price_from, priceLevel)) return false;
      
      // Features filter
      const featuresFilter = filterValues.features as string[] | undefined;
      if (featuresFilter?.length && !matchesFilter(service.features || [], featuresFilter)) return false;
      
      // Verified filter
      const verifiedFeatures = filterValues.features as string[] | undefined;
      if (verifiedFeatures?.includes('verified') && !service.is_verified) return false;
      
      // Rating filter
      const ratingFilter = filterValues.rating as string | undefined;
      if (ratingFilter) {
        const minRating = parseFloat(ratingFilter);
        if ((service.rating || 0) < minRating) return false;
      }
      
      return true;
    });
  }, [petServices, searchQuery, selectedCategory, filterValues, language]);

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
      heroImage="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800"
      heroGradient={{ from: 'from-amber-500/20', via: 'via-orange-500/20', to: 'to-primary/20' }}
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
      isLoading={isLoading}
      isEmpty={filteredServices.length === 0}
      emptyIcon={PawPrint}
      emptyText={language === 'ru' ? 'Услуги не найдены' : 'No services found'}
    >
      <MiniAppQuickGrid items={quickItems} columns={4} className="mb-6" />

      <div className="grid gap-4">
        {filteredServices.map((service) => (
          <ItemCard
            key={service.id}
            image={service.cover_image || 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800'}
            title={language === 'ru' ? service.name_ru : service.name_en}
            subtitle={language === 'ru' ? service.description_ru : service.description_en}
            rating={service.rating}
            reviewCount={service.review_count}
            location={service.address ?? undefined}
            price={service.price_from ?? undefined}
            pricePrefix={language === 'ru' ? 'от' : 'from'}
            currency="฿"
            isVerified={service.is_verified}
            tags={service.features?.slice(0, 2) || []}
            onClick={() => navigate(`/pets/${service.id}`)}
          />
        ))}
      </div>
    </MiniAppLayout>
  );
}
