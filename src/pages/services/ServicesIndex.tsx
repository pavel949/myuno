import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Wrench } from "lucide-react";
import { MiniAppLayout, MiniAppQuickGrid, type MiniAppCategory, type QuickGridItem } from "@/components/miniapp";
import { servicesFilterConfig, FilterValues } from "@/components/filters";
import { useHomeServices } from "@/hooks/useHomeServices";
import { DomainTabs, ProviderTypeToggle, HomeServiceProviderCard } from "@/components/services";
import { CrossSellSection } from "@/components/crosssell";
import { 
  SERVICE_DOMAINS, 
  getCategoriesByDomain, 
  ALL_SERVICE_CATEGORIES,
} from "@/lib/taxonomies";
import type { ServiceDomain, ProviderType } from "@/lib/config/homeServicesTaxonomy";

export default function ServicesIndex() {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<ServiceDomain | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProviderType, setSelectedProviderType] = useState<ProviderType | 'all'>('all');
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  
  const { providers, isLoading, getProviderImage } = useHomeServices({
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    domain: selectedDomain,
    providerType: selectedProviderType,
  });

  // Sync URL params on mount and when URL changes
  useEffect(() => {
    const domainParam = searchParams.get('domain') as ServiceDomain | null;
    const categoryParam = searchParams.get('category');
    
    // Set domain from URL
    if (domainParam && SERVICE_DOMAINS.some(d => d.id === domainParam)) {
      setSelectedDomain(domainParam);
    } else if (!domainParam) {
      setSelectedDomain('all');
    }
    
    // Set category from URL - this is critical for direct links like /services?category=electrical
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    } else {
      setSelectedCategory('all');
    }
  }, [searchParams]);

  // Update URL when domain changes
  const handleDomainChange = (domain: ServiceDomain | 'all') => {
    setSelectedDomain(domain);
    setSelectedCategory('all');
    
    const newParams = new URLSearchParams(searchParams);
    if (domain === 'all') {
      newParams.delete('domain');
    } else {
      newParams.set('domain', domain);
    }
    newParams.delete('category');
    setSearchParams(newParams);
  };

  // Filter providers by search
  const filteredProviders = useMemo(() => {
    return providers.filter((provider) => {
      const matchesSearch = provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (provider.description_en?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (provider.description_ru?.toLowerCase().includes(searchQuery.toLowerCase()));
      
      if (!matchesSearch) return false;
      
      // Apply modal filter values
      const features = filterValues.features as string[] || [];
      if (features.includes('verified') && !provider.is_verified) return false;
      if (features.includes('insured') && !provider.has_insurance) return false;
      if (features.includes('guaranteed') && !provider.has_guarantee) return false;
      if (features.includes('fast-response') && (!provider.response_time_minutes || provider.response_time_minutes > 30)) return false;
      
      // Provider type from modal
      const modalProviderType = filterValues.providerType as string | undefined;
      if (modalProviderType && provider.provider_type !== modalProviderType) return false;
      
      return true;
    });
  }, [providers, searchQuery, filterValues]);

  // Get categories for current domain
  const currentCategories = useMemo(() => {
    if (selectedDomain === 'all') {
      return ALL_SERVICE_CATEGORIES;
    }
    return getCategoriesByDomain(selectedDomain);
  }, [selectedDomain]);

  // Build MiniApp categories for ribbon
  const categoryRibbon: MiniAppCategory[] = useMemo(() => [
    { id: 'all', labelEn: 'All', labelRu: 'Все' },
    ...currentCategories.map(c => ({
      id: c.id,
      labelEn: c.labelEn,
      labelRu: c.labelRu,
    })),
  ], [currentCategories]);

  // Quick grid items (first 4 categories of current domain)
  const quickItems: QuickGridItem[] = currentCategories.slice(0, 4).map(c => ({
    icon: c.icon,
    label: language === 'ru' ? c.labelRu : c.labelEn,
    onClick: () => {
      setSelectedCategory(c.id);
      const newParams = new URLSearchParams(searchParams);
      newParams.set('category', c.id);
      setSearchParams(newParams);
    },
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
      categories={categoryRibbon}
      selectedCategory={selectedCategory}
      onCategoryChange={(cat) => {
        setSelectedCategory(cat);
        const newParams = new URLSearchParams(searchParams);
        if (cat === 'all') {
          newParams.delete('category');
        } else {
          newParams.set('category', cat);
        }
        setSearchParams(newParams);
      }}
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
      {/* Domain Tabs */}
      <DomainTabs 
        selectedDomain={selectedDomain} 
        onDomainChange={handleDomainChange}
        className="mb-4"
      />
      
      {/* Quick Grid */}
      <MiniAppQuickGrid items={quickItems} columns={4} className="mb-4" />
      
      {/* Provider Type Toggle */}
      <ProviderTypeToggle 
        selectedType={selectedProviderType}
        onTypeChange={setSelectedProviderType}
        className="mb-4"
      />
      
      {/* Provider Cards */}
      <div className="grid gap-3">
        {filteredProviders.map((provider) => (
          <HomeServiceProviderCard
            key={provider.id}
            provider={provider}
            imageUrl={getProviderImage(provider)}
            onClick={() => navigate(`/services/provider/${provider.id}?category=${provider.business_category}`)}
          />
        ))}
      </div>

      <CrossSellSection currentVertical="services" />
    </MiniAppLayout>
  );
}
