import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Scale } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { CatalogHeader } from "@/components/shared/CatalogHeader";
import { ItemCard } from "@/components/miniapp";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/uno/EmptyState";
import { FilterValues, legalFilterConfig } from "@/components/filters";
import { useLegalServices } from "@/hooks/useLegalServices";
import { VisaServicesSection } from "./VisaServicesSection";
import { matchesFilter, matchesPriceLevel } from '@/lib/filterUtils';
import { VerticalCTA } from '@/components/leads/VerticalCTA';
import { PLACEHOLDER_IMAGES } from '@/lib/config/placeholders';

const categories = [
  { id: 'all', labelEn: 'All', labelRu: 'Все' },
  { id: 'legal', labelEn: 'Legal', labelRu: 'Юридические' },
  { id: 'accounting', labelEn: 'Accounting', labelRu: 'Бухгалтерия' },
  { id: 'tax', labelEn: 'Tax', labelRu: 'Налоги' },
  { id: 'visa', labelEn: 'Visa', labelRu: 'Визы' },
  { id: 'business', labelEn: 'Business', labelRu: 'Бизнес' },
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
  const isRu = language === 'ru';

  const filteredProviders = useMemo(() => {
    return legalServices.filter((provider) => {
      const name = isRu ? provider.name_ru : provider.name_en;
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || provider.service_type === selectedCategory;
      
      if (!matchesSearch || !matchesCategory) return false;
      
      const cats = filterValues.category as string[] | undefined;
      if (cats?.length && !matchesFilter([provider.service_type || ''], cats)) return false;
      
      const langs = filterValues.languages as string[] | undefined;
      if (langs?.length && !matchesFilter(provider.languages || [], langs)) return false;
      
      const priceLevel = filterValues.priceLevel as string | undefined;
      if (priceLevel && !matchesPriceLevel(provider.price_consultation, priceLevel)) return false;
      
      const features = filterValues.features as string[] | undefined;
      if (features?.length) {
        if (features.includes('verified') && !provider.is_verified) return false;
      }
      
      const specializations = filterValues.specialization as string[] | undefined;
      if (specializations?.length && !matchesFilter(provider.specializations || [], specializations)) return false;
      
      const ratingFilter = filterValues.rating as string | undefined;
      if (ratingFilter) {
        const minRating = parseFloat(ratingFilter);
        if ((provider.rating || 0) < minRating) return false;
      }
      
      return true;
    });
  }, [legalServices, searchQuery, selectedCategory, filterValues, isRu]);

  return (
    <AppLayout showHeader={false} showBottomNav>
      <div className="min-h-screen bg-background">
        <CatalogHeader
          title={t('legal.businessTitle')}
          subtitle={`${filteredProviders.length} ${t('legal.providers')}`}
          fallbackPath="/discover"
          categories={categories.map(c => ({ id: c.id, label: isRu ? c.labelRu : c.labelEn }))}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        <main className="container max-w-[1536px] mx-auto px-4 py-4 pb-24">
          {isLoading ? (
            <div className="grid gap-4">
              {[1,2,3].map(i => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="w-24 h-24 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Visa Services Section */}
              {(selectedCategory === 'visa' || selectedCategory === 'all') && (
                <div className="mb-6">
                  <VisaServicesSection 
                    limit={selectedCategory === 'visa' ? 20 : 4} 
                    showTitle={selectedCategory === 'all'} 
                  />
                </div>
              )}

              {/* Legal Providers */}
              {selectedCategory !== 'visa' && (
                <>
                  {filteredProviders.length === 0 ? (
                    <EmptyState
                      icon={Scale}
                      title={t('legal.notFound')}
                    />
                  ) : (
                    <>
                      <h2 className="text-lg font-semibold mb-3">
                        {isRu ? 'Юридические компании' : 'Legal Companies'}
                      </h2>
                      <div className="space-y-4">
                        {filteredProviders.map((provider) => (
                          <ItemCard
                            key={provider.id}
                            image={provider.cover_image || PLACEHOLDER_IMAGES.legal}
                            title={isRu ? provider.name_ru : provider.name_en}
                            subtitle={isRu ? provider.description_ru : provider.description_en}
                            rating={provider.rating}
                            reviewCount={provider.review_count}
                            price={provider.price_consultation ?? undefined}
                            priceUnit={isRu ? '/консультация' : '/consultation'}
                            currency={currencyInfo.symbol}
                            isVerified={provider.is_verified}
                            tags={provider.specializations?.slice(0, 2) || []}
                            onClick={() => navigate(`/legal/provider/${provider.id}`)}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}

              <VerticalCTA vertical="legal" className="my-6" />
            </>
          )}
        </main>
      </div>
    </AppLayout>
  );
}
