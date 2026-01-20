import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSalons } from '@/hooks/useSalons';
import { MiniAppLayout, ItemCard, MiniAppQuickGrid, type MiniAppCategory, type QuickGridItem } from '@/components/miniapp';
import { beautyFilterConfig, FilterValues } from '@/components/filters';
import { matchesFilter, matchesPriceLevel, isOpenNow } from '@/lib/filterUtils';

const SERVICE_CATEGORIES: MiniAppCategory[] = [
  { id: 'all', labelEn: 'All', labelRu: 'Все' },
  { id: 'spa', labelEn: 'Spa', labelRu: 'Спа' },
  { id: 'massage', labelEn: 'Massage', labelRu: 'Массаж' },
  { id: 'beauty_salon', labelEn: 'Beauty', labelRu: 'Красота' },
  { id: 'hair_salon', labelEn: 'Hair', labelRu: 'Волосы' },
  { id: 'nail_salon', labelEn: 'Nails', labelRu: 'Ногти' },
  { id: 'barber', labelEn: 'Barber', labelRu: 'Барбер' },
];

export default function BeautySpaIndex() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filterValues, setFilterValues] = useState<FilterValues>({});

  // Fetch salons from database
  const { salons, isLoading } = useSalons(selectedCategory === 'all' ? undefined : selectedCategory);

  // Filter salons based on search query and filters
  const filteredSalons = useMemo(() => {
    return salons.filter(salon => {
      // Search filter
      const name = language === 'ru' ? salon.name_ru : salon.name_en;
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Price level filter
      const matchesPrice = matchesPriceLevel(salon.price_from, filterValues.priceLevel as string);
      
      // Rating filter
      const minRating = typeof filterValues.rating === 'number' ? filterValues.rating : undefined;
      const matchesRating = !minRating || (salon.rating ?? 0) >= minRating;
      
      // Verified filter
      const verifiedOnly = typeof filterValues.verified === 'boolean' ? filterValues.verified : false;
      const matchesVerified = !verifiedOnly || salon.is_verified;
      
      // Services filter (multi-select)
      const servicesFilter = Array.isArray(filterValues.services) ? filterValues.services : [];
      const matchesServices = matchesFilter(salon.services, servicesFilter);
      
      // Features/amenities filter (multi-select)
      const featuresFilter = Array.isArray(filterValues.features) ? filterValues.features : [];
      const matchesFeatures = matchesFilter(salon.amenities, featuresFilter);
      
      // Availability filter
      const availabilityFilter = Array.isArray(filterValues.availability) ? filterValues.availability : [];
      let matchesAvailability = true;
      if (availabilityFilter.includes('open-now')) {
        matchesAvailability = isOpenNow(salon.working_hours);
      }
      
      return matchesSearch && matchesPrice && matchesRating && matchesVerified && 
             matchesServices && matchesFeatures && matchesAvailability;
    });
  }, [salons, searchQuery, language, filterValues]);

  const quickItems: QuickGridItem[] = [
    { icon: '💆', label: language === 'ru' ? 'Массаж' : 'Massage', sublabel: '฿600', onClick: () => setSelectedCategory('massage') },
    { icon: '💅', label: language === 'ru' ? 'Ногти' : 'Nails', sublabel: '฿400', onClick: () => setSelectedCategory('nail_salon') },
    { icon: '💇', label: language === 'ru' ? 'Волосы' : 'Hair', sublabel: '฿500', onClick: () => setSelectedCategory('hair_salon') },
    { icon: '🧖', label: language === 'ru' ? 'СПА' : 'Spa', sublabel: '฿1,500', onClick: () => setSelectedCategory('spa') },
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
      isLoading={isLoading}
      isEmpty={!isLoading && filteredSalons.length === 0}
      emptyIcon={Sparkles}
      emptyText={language === 'ru' ? 'Салоны не найдены' : 'No salons found'}
    >
      <MiniAppQuickGrid items={quickItems} columns={4} className="mb-6" />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredSalons.map((salon) => (
          <ItemCard
            key={salon.id}
            variant="vertical"
            image={salon.cover_image || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600'}
            title={language === 'ru' ? salon.name_ru : salon.name_en}
            rating={salon.rating}
            reviewCount={salon.review_count}
            price={salon.price_from ?? undefined}
            pricePrefix={t('label.from')}
            currency="฿"
            location={salon.district || salon.address || ''}
            isVerified={salon.is_verified}
            isFeatured={salon.is_featured}
            tags={(salon.services || []).slice(0, 2)}
            onClick={() => navigate(`/beauty/salon/${salon.id}`)}
          />
        ))}
      </div>
    </MiniAppLayout>
  );
}
