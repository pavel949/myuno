import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Scale, Award } from "lucide-react";
import { MiniAppLayout, ItemCard, MiniAppQuickGrid, type MiniAppCategory, type QuickGridItem } from "@/components/miniapp";
import { FilterValues, legalFilterConfig } from "@/components/filters";
import { useLegalServices } from "@/hooks/useLegalServices";
import { VisaServicesSection } from "./VisaServicesSection";
import { matchesFilter, matchesPriceLevel } from '@/lib/filterUtils';

const categories: MiniAppCategory[] = [
  { id: 'all', labelEn: 'All', labelRu: 'Все' },
  { id: 'legal', labelEn: 'Legal', labelRu: 'Юридические', icon: '⚖️' },
  { id: 'accounting', labelEn: 'Accounting', labelRu: 'Бухгалтерия', icon: '📊' },
  { id: 'tax', labelEn: 'Tax', labelRu: 'Налоги', icon: '💰' },
  { id: 'visa', labelEn: 'Visa', labelRu: 'Визы', icon: '🛂' },
  { id: 'business', labelEn: 'Business', labelRu: 'Бизнес', icon: '🏢' },
  { id: 'insurance', labelEn: 'Insurance', labelRu: 'Страхование', icon: '🛡️' },
];

export default function LegalServicesIndex() {
  const { language, t } = useLanguage();
  const { currencyInfo } = useCurrency();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { services: legalServices, isLoading } = useLegalServices();
  const [searchQuery, setSearchQuery] = useState("");
  const initialCategory = searchParams.get('category') || 'all';
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
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

  const filteredProviders = useMemo(() => {
    return legalServices.filter((provider) => {
      const name = language === 'ru' ? provider.name_ru : provider.name_en;
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || provider.service_type === selectedCategory;
      
      if (!matchesSearch || !matchesCategory) return false;
      
      // Category filter from modal - using normalized comparison
      const cats = filterValues.category as string[] | undefined;
      if (cats?.length && !matchesFilter([provider.service_type || ''], cats)) return false;
      
      // Languages filter - using normalized comparison
      const langs = filterValues.languages as string[] | undefined;
      if (langs?.length && !matchesFilter(provider.languages || [], langs)) return false;
      
      // Price level filter
      const priceLevel = filterValues.priceLevel as string | undefined;
      if (priceLevel && !matchesPriceLevel(provider.price_consultation, priceLevel)) return false;
      
      // Features filter
      const features = filterValues.features as string[] | undefined;
      if (features?.length) {
        if (features.includes('verified') && !provider.is_verified) return false;
      }
      
      // Specialization filter
      const specializations = filterValues.specialization as string[] | undefined;
      if (specializations?.length && !matchesFilter(provider.specializations || [], specializations)) return false;
      
      // Rating filter
      const ratingFilter = filterValues.rating as string | undefined;
      if (ratingFilter) {
        const minRating = parseFloat(ratingFilter);
        if ((provider.rating || 0) < minRating) return false;
      }
      
      return true;
    });
  }, [legalServices, searchQuery, selectedCategory, filterValues, language]);

  const quickItems: QuickGridItem[] = [
    { icon: '⚖️', label: language === 'ru' ? 'Юрист' : 'Legal', onClick: () => setSelectedCategory('legal') },
    { icon: '🛂', label: language === 'ru' ? 'Визы' : 'Visa', onClick: () => setSelectedCategory('visa') },
    { icon: '💰', label: t('legal.tax'), onClick: () => setSelectedCategory('tax') },
    { icon: '🏢', label: t('legal.business'), onClick: () => setSelectedCategory('business') },
  ];

  return (
    <MiniAppLayout
      title={t('legal.businessTitle')}
      subtitle={`${filteredProviders.length} ${t('legal.providers')}`}
      heroIcon={Award}
      heroTitle={t('legal.heroTitle')}
      heroSubtitle={t('legal.heroSubtitle')}
      heroImage="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800"
      heroGradient={{ from: 'from-blue-600/20', via: 'via-indigo-600/20', to: 'to-purple-700/20' }}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder={t('legal.searchPlaceholder')}
      categories={categories}
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
      filterConfig={legalFilterConfig}
      filterValues={filterValues}
      onFilterChange={setFilterValues}
      filterActiveCount={activeFilterCount}
      isLoading={isLoading}
      isEmpty={filteredProviders.length === 0}
      emptyIcon={Scale}
      emptyText={t('legal.notFound')}
    >
      <MiniAppQuickGrid items={quickItems} columns={4} className="mb-6" />

      {/* Visa Services Section - показываем когда выбрана категория visa или all */}
      {(selectedCategory === 'visa' || selectedCategory === 'all') && (
        <div className="mb-6">
          <VisaServicesSection 
            limit={selectedCategory === 'visa' ? 20 : 4} 
            showTitle={selectedCategory === 'all'} 
          />
        </div>
      )}

      {/* Legal Providers - скрываем когда только визы */}
      {selectedCategory !== 'visa' && (
        <>
          <h2 className="text-lg font-semibold mb-3">
            {language === 'ru' ? 'Юридические компании' : 'Legal Companies'}
          </h2>
          <div className="space-y-4">
            {filteredProviders.map((provider) => (
              <ItemCard
                key={provider.id}
                image={provider.cover_image || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=200'}
                title={language === 'ru' ? provider.name_ru : provider.name_en}
                subtitle={language === 'ru' ? provider.description_ru : provider.description_en}
                rating={provider.rating}
                reviewCount={provider.review_count}
                price={provider.price_consultation ?? undefined}
                priceUnit={language === 'ru' ? '/консультация' : '/consultation'}
                currency={currencyInfo.symbol}
                isVerified={provider.is_verified}
                tags={provider.specializations?.slice(0, 2) || []}
                onClick={() => navigate(`/legal/provider/${provider.id}`)}
              />
            ))}
          </div>
        </>
      )}
    </MiniAppLayout>
  );
}
