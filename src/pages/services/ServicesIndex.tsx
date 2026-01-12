import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Wrench } from "lucide-react";
import { MiniAppLayout, ItemCard, MiniAppQuickGrid, type MiniAppCategory, type QuickGridItem } from "@/components/miniapp";
import { servicesFilterConfig, FilterValues } from "@/components/filters";
import { useHomeServices } from "@/hooks/useHomeServices";

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
  const { language } = useLanguage();
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
      
      const features = filterValues.features as string[] || [];
      if (features.includes('verified') && !provider.is_verified) return false;
      
      return matchesSearch && matchesCategory;
    });
  }, [providers, searchQuery, selectedCategory, filterValues]);

  const quickItems: QuickGridItem[] = categories.slice(0, 4).map(c => ({
    icon: c.icon,
    label: language === 'ru' ? c.nameRu : c.name,
    onClick: () => setSelectedCategory(c.id),
  }));

  return (
    <MiniAppLayout
      title={language === "ru" ? "Домашние услуги" : "Home Services"}
      subtitle={language === 'ru' ? `${filteredProviders.length} мастеров` : `${filteredProviders.length} professionals`}
      heroIcon={Wrench}
      heroTitle={language === 'ru' ? 'Мастера на все руки' : 'Professional Services'}
      heroSubtitle={language === 'ru' ? 'Сантехники, электрики, уборка и многое другое' : 'Plumbers, electricians, cleaning and more'}
      heroImage="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800"
      heroGradient={{ from: 'from-amber-500/20', via: 'via-orange-500/20', to: 'to-primary/20' }}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder={language === "ru" ? "Найти услугу или мастера..." : "Find service or professional..."}
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
      emptyText={language === 'ru' ? 'Мастера не найдены' : 'No professionals found'}
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
    </MiniAppLayout>
  );
}
