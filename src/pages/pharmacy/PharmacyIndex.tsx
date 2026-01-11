import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePharmacies } from "@/hooks/usePharmacy";
import { Pill, Clock, MapPin, Truck, Shield, Phone } from "lucide-react";
import { MiniAppLayout, ItemCard, MiniAppQuickGrid, type MiniAppCategory, type QuickGridItem } from "@/components/miniapp";
import { useState, useMemo } from "react";
import { FilterValues, pharmacyFilterConfig } from "@/components/filters";

const PHARMACY_CATEGORIES: MiniAppCategory[] = [
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

  const activeFilterCount = useMemo(() => {
    let count = 0;
    Object.entries(filterValues).forEach(([key, value]) => {
      if (key === 'priceLevel' && value) count++;
      else if (Array.isArray(value)) count += value.length;
      else if (value) count++;
    });
    return count;
  }, [filterValues]);

  const filteredPharmacies = pharmacies.filter(pharmacy => {
    const name = language === 'ru' ? pharmacy.name_ru : pharmacy.name_en;
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' 
      || (selectedCategory === '24h' && pharmacy.is_24h)
      || (selectedCategory === 'delivery' && pharmacy.delivery_available);
    
    // Filter by features
    const features = filterValues.features as string[] | undefined;
    if (features?.length) {
      if (features.includes('24h') && !pharmacy.is_24h) return false;
      if (features.includes('delivery') && !pharmacy.delivery_available) return false;
      if (features.includes('pharmacist') && !pharmacy.has_pharmacist) return false;
      if (features.includes('verified') && !pharmacy.is_verified) return false;
    }
    
    return matchesSearch && matchesCategory;
  });

  const quickItems: QuickGridItem[] = [
    { icon: '🕐', label: language === 'ru' ? '24/7' : '24/7', sublabel: language === 'ru' ? 'Круглосуточно' : 'Open now', onClick: () => setSelectedCategory('24h') },
    { icon: '🚚', label: language === 'ru' ? 'Доставка' : 'Delivery', sublabel: language === 'ru' ? 'от 30 мин' : 'from 30min', onClick: () => setSelectedCategory('delivery') },
    { icon: '💊', label: language === 'ru' ? 'Рецепты' : 'Prescriptions', onClick: () => {} },
    { icon: '👨‍⚕️', label: language === 'ru' ? 'Консультация' : 'Consult', onClick: () => {} },
  ];

  return (
    <MiniAppLayout
      title={t('pharmacy.title')}
      subtitle={language === 'ru' ? `${filteredPharmacies.length} аптек` : `${filteredPharmacies.length} pharmacies`}
      heroIcon={Pill}
      heroTitle={language === 'ru' ? 'Аптеки Пхукета' : 'Phuket Pharmacies'}
      heroSubtitle={language === 'ru' ? 'Лекарства, доставка, консультации' : 'Medicines, delivery, consultations'}
      heroImage="https://images.unsplash.com/photo-1576602976047-174e57a47881?w=800"
      heroGradient={{ from: 'from-green-500/20', via: 'via-emerald-500/20', to: 'to-primary/20' }}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder={language === 'ru' ? 'Поиск аптек...' : 'Search pharmacies...'}
      categories={PHARMACY_CATEGORIES}
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
      filterConfig={pharmacyFilterConfig}
      filterValues={filterValues}
      onFilterChange={setFilterValues}
      filterActiveCount={activeFilterCount}
      isLoading={isLoading}
      isEmpty={filteredPharmacies.length === 0}
      emptyIcon={Pill}
      emptyText={t('pharmacy.noPharmaciesFound')}
    >
      <MiniAppQuickGrid items={quickItems} columns={4} className="mb-6" />

      <div className="grid gap-4">
        {filteredPharmacies.map(pharmacy => (
          <ItemCard
            key={pharmacy.id}
            image={pharmacy.cover_image || 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=400'}
            title={language === 'ru' ? pharmacy.name_ru : pharmacy.name_en}
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
    </MiniAppLayout>
  );
}