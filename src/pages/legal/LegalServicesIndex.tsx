import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Scale, Award } from "lucide-react";
import { MiniAppLayout, ItemCard, MiniAppQuickGrid, type MiniAppCategory, type QuickGridItem } from "@/components/miniapp";
import { FilterValues, legalFilterConfig } from "@/components/filters";
import { useLegalServices } from "@/hooks/useLegalServices";

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
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { services: legalServices, isLoading } = useLegalServices();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
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
      
      const cats = filterValues.category as string[] | undefined;
      if (cats?.length && !cats.includes(provider.service_type || '')) return false;
      
      const langs = filterValues.languages as string[] | undefined;
      if (langs?.length) {
        const provLangs = (provider.languages || []).map(l => l.toLowerCase());
        if (!langs.some(l => provLangs.includes(l.substring(0, 2)))) return false;
      }
      
      return matchesSearch && matchesCategory;
    });
  }, [legalServices, searchQuery, selectedCategory, filterValues, language]);

  const quickItems: QuickGridItem[] = [
    { icon: '⚖️', label: language === 'ru' ? 'Юрист' : 'Legal', onClick: () => setSelectedCategory('legal') },
    { icon: '🛂', label: language === 'ru' ? 'Визы' : 'Visa', onClick: () => setSelectedCategory('visa') },
    { icon: '💰', label: language === 'ru' ? 'Налоги' : 'Tax', onClick: () => setSelectedCategory('tax') },
    { icon: '🏢', label: language === 'ru' ? 'Бизнес' : 'Business', onClick: () => setSelectedCategory('business') },
  ];

  return (
    <MiniAppLayout
      title={language === "ru" ? "Бизнес-услуги" : "Business Services"}
      subtitle={language === "ru" ? `${filteredProviders.length} компаний` : `${filteredProviders.length} providers`}
      heroIcon={Award}
      heroTitle={language === "ru" ? "Юридические и бизнес-услуги" : "Legal & Business Services"}
      heroSubtitle={language === "ru" ? "Проверенные специалисты для вашего бизнеса в Таиланде" : "Verified professionals for your business in Thailand"}
      heroGradientFrom="from-blue-600/20"
      heroGradientVia="via-indigo-600/20"
      heroGradientTo="to-purple-700/20"
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder={language === "ru" ? "Найти услугу или компанию..." : "Find service or company..."}
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
      emptyText={language === "ru" ? "Компании не найдены" : "No providers found"}
    >
      <MiniAppQuickGrid items={quickItems} columns={4} className="mb-6" />

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
            currency="฿"
            isVerified={provider.is_verified}
            tags={provider.specializations?.slice(0, 2) || []}
            onClick={() => navigate(`/legal/provider/${provider.id}`)}
          />
        ))}
      </div>
    </MiniAppLayout>
  );
}
