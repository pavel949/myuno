import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePharmacies } from "@/hooks/usePharmacy";
import { Pill } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { CatalogHeader } from "@/components/shared/CatalogHeader";
import { ItemCard } from "@/components/miniapp";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/uno/EmptyState";
import { FilterValues, pharmacyFilterConfig } from "@/components/filters";

const PHARMACY_CATEGORIES = [
  { id: 'all', labelEn: 'All Pharmacies', labelRu: 'Все аптеки' },
  { id: '24h', labelEn: '24/7 Open', labelRu: 'Круглосуточные' },
  { id: 'delivery', labelEn: 'With Delivery', labelRu: 'С доставкой' },
];

export default function PharmacyIndex() {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const { pharmacies, isLoading } = usePharmacies();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const isRu = language === 'ru';

  const filteredPharmacies = useMemo(() => {
    return pharmacies.filter(pharmacy => {
      const name = isRu ? pharmacy.name_ru : pharmacy.name_en;
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' 
        || (selectedCategory === '24h' && pharmacy.is_24h)
        || (selectedCategory === 'delivery' && pharmacy.delivery_available);
      
      if (!matchesSearch || !matchesCategory) return false;
      
      const features = filterValues.features as string[] | undefined;
      if (features?.length) {
        if (features.includes('24h') && !pharmacy.is_24h) return false;
        if (features.includes('delivery') && !pharmacy.delivery_available) return false;
        if (features.includes('pharmacist') && !pharmacy.has_pharmacist) return false;
        if (features.includes('verified') && !pharmacy.is_verified) return false;
      }
      
      const ratingFilter = filterValues.rating as string | undefined;
      if (ratingFilter) {
        const minRating = parseFloat(ratingFilter);
        if ((pharmacy.rating || 0) < minRating) return false;
      }
      
      return true;
    });
  }, [pharmacies, searchQuery, selectedCategory, filterValues, isRu]);

  return (
    <AppLayout showHeader={false} showBottomNav>
      <div className="min-h-screen bg-background">
        <CatalogHeader
          title={isRu ? 'Аптеки' : 'Pharmacies'}
          subtitle={`${filteredPharmacies.length} ${isRu ? 'аптек' : 'pharmacies'}`}
          fallbackPath="/discover"
          categories={PHARMACY_CATEGORIES.map(c => ({ id: c.id, label: isRu ? c.labelRu : c.labelEn }))}
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
          ) : filteredPharmacies.length === 0 ? (
            <EmptyState
              icon={Pill}
              title={t('pharmacy.noPharmaciesFound')}
              description={isRu ? 'Попробуйте изменить фильтры' : 'Try adjusting filters'}
            />
          ) : (
            <div className="grid gap-4">
              {filteredPharmacies.map(pharmacy => (
                <ItemCard
                  key={pharmacy.id}
                  image={pharmacy.cover_image || 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=400'}
                  title={isRu ? pharmacy.name_ru : pharmacy.name_en}
                  rating={pharmacy.rating ?? undefined}
                  reviewCount={pharmacy.review_count ?? undefined}
                  location={pharmacy.address ?? undefined}
                  isVerified={pharmacy.is_verified ?? undefined}
                  badge={pharmacy.is_24h 
                    ? { text: '24/7', className: 'bg-green-500 text-white' }
                    : undefined
                  }
                  tags={[
                    ...(pharmacy.delivery_available ? [t('pharmacy.delivery')] : []),
                    ...(pharmacy.has_pharmacist ? [t('pharmacy.consultation')] : []),
                  ]}
                  onClick={() => navigate(`/pharmacy/${pharmacy.id}`)}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </AppLayout>
  );
}
