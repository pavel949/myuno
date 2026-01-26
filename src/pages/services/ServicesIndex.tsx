import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Wrench } from "lucide-react";
import { MiniAppLayout, ItemCard, MiniAppQuickGrid, type MiniAppCategory, type QuickGridItem } from "@/components/miniapp";
import { servicesFilterConfig, FilterValues } from "@/components/filters";
import { useHomeServices } from "@/hooks/useHomeServices";
import { matchesFilter, matchesPriceLevel, isOpenNow } from '@/lib/filterUtils';
import { CrossSellSection } from '@/components/crosssell';

const categories = [
  { id: "water-delivery", icon: '💧', name: 'Water', nameRu: 'Вода' },
  { id: "plumbing", icon: '🔧', name: 'Plumbing', nameRu: 'Сантехник' },
  { id: "electrical", icon: '⚡', name: 'Electrical', nameRu: 'Электрик' },
  { id: "cleaning", icon: '✨', name: 'Cleaning', nameRu: 'Уборка' },
  { id: "repair", icon: '🔨', name: 'Repair', nameRu: 'Ремонт' },
  { id: "ac", icon: '❄️', name: 'AC', nameRu: 'Кондиционеры' },
  { id: "moving", icon: '🚚', name: 'Moving', nameRu: 'Переезд' },
  { id: "road-assistance", icon: '🚗', name: 'Road Help', nameRu: 'Помощь на дороге' },
];

const SERVICE_CATEGORIES: MiniAppCategory[] = [
  { id: 'all', labelEn: 'All', labelRu: 'Все' },
  ...categories.map(c => ({ id: c.id, labelEn: c.name, labelRu: c.nameRu })),
];

export default function ServicesIndex() {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  
  const { providers, isLoading, getProviderImage } = useHomeServices();

  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) setSelectedCategory(categoryParam);
  }, [searchParams]);

  const filteredProviders = useMemo(() => {
    return providers.filter((provider) => {
      const matchesSearch = provider.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || provider.business_category === selectedCategory;
      
      if (!matchesSearch || !matchesCategory) return false;
      
      // Features filter
      const features = filterValues.features as string[] || [];
      if (features.includes('verified') && !provider.is_verified) return false;
      
      // Price level filter - use price_per_hour or similar if available
      const priceLevel = filterValues.priceLevel as string | undefined;
      if (priceLevel) {
        const priceMap: Record<string, [number, number]> = {
          'budget': [0, 500],
          'mid': [500, 1500],
          'premium': [1500, 5000],
          'luxury': [5000, Infinity],
        };
        const range = priceMap[priceLevel.toLowerCase()];
        // Skip price filter if provider doesn't have pricing info
      }
      
      // Service category filter from modal
      const categoryFilter = filterValues.category as string[] | undefined;
      if (categoryFilter?.length) {
        if (!matchesFilter([provider.business_category || ''], categoryFilter)) return false;
      }
      
      // Rating filter
      const ratingFilter = filterValues.rating as string | undefined;
      if (ratingFilter) {
        const minRating = parseFloat(ratingFilter);
        if ((provider.rating || 0) < minRating) return false;
      }
      
      return true;
    });
  }, [providers, searchQuery, selectedCategory, filterValues]);

  const quickItems: QuickGridItem[] = categories.slice(0, 4).map(c => ({
    icon: c.icon,
    label: language === 'ru' ? c.nameRu : c.name,
    onClick: () => setSelectedCategory(c.id),
  }));

  return (
    <MiniAppLayout
      title={t('services.homeTitle')}
      subtitle={`${filteredProviders.length} ${t('services.professionals')}`}
      heroIcon={Wrench}
      heroTitle={t('services.heroTitle')}
      heroSubtitle={t('services.heroSubtitle')}
      heroImage="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800"
      heroGradient={{ from: 'from-amber-500/20', via: 'via-orange-500/20', to: 'to-primary/20' }}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder={t('services.searchPlaceholder')}
      categories={SERVICE_CATEGORIES}
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
      filterConfig={servicesFilterConfig}
      filterValues={filterValues}
      onFilterChange={setFilterValues}
      showMapButton
      onMapClick={() => navigate("/services/map")}
      isLoading={isLoading}
      isEmpty={filteredProviders.length === 0}
      emptyIcon={Wrench}
      emptyText={t('services.notFound')}
    >
      <MiniAppQuickGrid items={quickItems} columns={4} className="mb-6" />
      
      <div className="grid gap-4">
        {filteredProviders.map((provider) => (
          <ItemCard
            key={provider.id}
            image={getProviderImage(provider)}
            title={provider.name}
            subtitle={language === 'ru' ? provider.description_ru || '' : provider.description_en || ''}
            rating={provider.rating || 0}
            reviewCount={provider.review_count || 0}
            location={provider.address || ''}
            isVerified={provider.is_verified || false}
            badge={{ 
              text: language === 'ru' ? 'Доступен' : 'Available', 
              className: 'bg-green-500 text-white' 
            }}
            onClick={() => navigate(`/services/provider/${provider.id}?category=${provider.business_category}`)}
          />
        ))}
      </div>

      <CrossSellSection currentVertical="services" />
    </MiniAppLayout>
  );
}
