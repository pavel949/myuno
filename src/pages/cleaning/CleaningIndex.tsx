import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { MiniAppLayout, ItemCard, MiniAppQuickGrid, type MiniAppCategory, type QuickGridItem } from '@/components/miniapp';
import { FilterValues, cleaningFilterConfig } from '@/components/filters';
import { useCleaningServices } from '@/hooks/useCleaningServices';
import { matchesFilter, matchesPriceLevel } from '@/lib/filterUtils';

const serviceTypes: MiniAppCategory[] = [
  { id: 'all', labelEn: 'All', labelRu: 'Все', icon: '✨' },
  { id: 'home', labelEn: 'Home', labelRu: 'Дом', icon: '🏠' },
  { id: 'laundry', labelEn: 'Laundry', labelRu: 'Прачечная', icon: '👔' },
  { id: 'office', labelEn: 'Office', labelRu: 'Офис', icon: '🏢' },
  { id: 'deep', labelEn: 'Deep Clean', labelRu: 'Генеральная', icon: '🧹' },
];

export default function CleaningIndex() {
  const { language } = useLanguage();
  const { currencyInfo } = useCurrency();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  
  const { services, isLoading } = useCleaningServices(selectedType);

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
    return services.filter(s => {
      const name = language === 'ru' ? s.name_ru : s.name_en;
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      
      // Service type filter from filters panel
      const filterServiceTypes = filterValues.serviceType as string[] | undefined;
      if (filterServiceTypes?.length && !matchesFilter([s.service_type || ''], filterServiceTypes)) return false;
      
      // Price level filter
      const priceLevel = filterValues.priceLevel as string | undefined;
      const price = s.price_fixed || s.price_per_hour || 0;
      if (priceLevel && !matchesPriceLevel(price, priceLevel)) return false;
      
      // Features filter
      const featuresFilter = filterValues.features as string[] | undefined;
      if (featuresFilter?.length) {
        if (!matchesFilter(s.features || [], featuresFilter)) return false;
      }
      
      // Verified filter - check if in features array
      const featuresArr = filterValues.features as string[] | undefined;
      if (featuresArr?.includes('verified') && !s.is_verified) return false;
      
      // Rating filter
      const ratingFilter = filterValues.rating as string | undefined;
      if (ratingFilter) {
        const minRating = parseFloat(ratingFilter);
        if ((s.rating || 0) < minRating) return false;
      }
      
      return true;
    });
  }, [searchQuery, filterValues, language, services]);

  const quickItems: QuickGridItem[] = [
    { icon: '🏠', label: language === 'ru' ? 'Заказать' : 'Book', sublabel: language === 'ru' ? 'Уборку' : 'Cleaning', onClick: () => setSelectedType('home') },
    { icon: '👔', label: language === 'ru' ? 'Прачечная' : 'Laundry', sublabel: language === 'ru' ? 'Забор' : 'Pickup', onClick: () => setSelectedType('laundry') },
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
        {filteredServices.map((service) => {
          const price = service.price_fixed || (service.price_per_hour ? service.price_per_hour : 0);
          const duration = service.duration_hours ? `${service.duration_hours}h` : undefined;
          
          return (
            <ItemCard
              key={service.id}
              image={service.cover_image || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600'}
              title={language === 'ru' ? service.name_ru : service.name_en}
              subtitle={language === 'ru' ? (service.description_ru || '') : (service.description_en || '')}
              rating={service.rating}
              reviewCount={service.review_count}
              price={price}
              priceUnit={service.price_per_hour ? '/hr' : ''}
              currency={currencyInfo.symbol}
              badge={service.is_verified 
                ? { text: language === 'ru' ? 'Проверено' : 'Verified', className: 'bg-primary text-primary-foreground' }
                : undefined
              }
              tags={[service.service_type, duration].filter(Boolean) as string[]}
              onClick={() => navigate(`/cleaning/${service.id}`)}
            />
          );
        })}
      </div>
    </MiniAppLayout>
  );
}