import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Wrench, Zap, Clock, ChevronRight } from "lucide-react";
import { MiniAppLayout, MiniAppQuickGrid, type MiniAppCategory, type QuickGridItem } from "@/components/miniapp";
import { servicesFilterConfig, FilterValues } from "@/components/filters";
import { useServiceFunctions, type LocalizedServiceFunction } from "@/hooks/useServiceFunctions";
import { ServiceFunctionCard } from "@/components/services";
import { CrossSellSection } from "@/components/crosssell";
import { SERVICE_CATEGORIES, type ServiceCategory } from "@/lib/config/homeServiceFunctions";
import { Badge } from "@/components/ui/badge";

export default function ServicesIndex() {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isRu = language === 'ru';
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  
  const { functions, categories, byCategory, popular, search, getFunctionsByCategory } = useServiceFunctions();

  // Sync URL params on mount and when URL changes
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    } else {
      setSelectedCategory('all');
    }
  }, [searchParams]);

  // Filter functions by search and category
  const filteredFunctions = useMemo(() => {
    let result: LocalizedServiceFunction[] = [];
    
    if (selectedCategory === 'all') {
      result = functions;
    } else {
      result = getFunctionsByCategory(selectedCategory as ServiceCategory);
    }
    
    if (searchQuery.trim()) {
      result = search(searchQuery);
    }
    
    // Filter by urgency if set
    const urgentOnly = String(filterValues.urgentOnly) === 'true';
    if (urgentOnly) {
      result = result.filter(f => f.isUrgent);
    }
    
    return result;
  }, [functions, selectedCategory, searchQuery, filterValues, getFunctionsByCategory, search]);

  // Build MiniApp categories for ribbon
  const categoryRibbon: MiniAppCategory[] = useMemo(() => [
    { id: 'all', labelEn: 'All Services', labelRu: 'Все услуги' },
    ...categories.map(c => ({
      id: c.id as string,
      labelEn: SERVICE_CATEGORIES.find(sc => sc.id === c.id)?.nameEn || c.name,
      labelRu: SERVICE_CATEGORIES.find(sc => sc.id === c.id)?.nameRu || c.name,
    })),
  ], [categories]);

  // Quick grid items (popular functions)
  const quickItems: QuickGridItem[] = popular.slice(0, 4).map(fn => ({
    icon: fn.icon,
    label: fn.name,
    onClick: () => {
      navigate(`/services/order/${fn.id}`);
    },
  }));

  const handleFunctionClick = (fn: LocalizedServiceFunction) => {
    navigate(`/services/order/${fn.id}`);
  };

  return (
    <MiniAppLayout
      title={isRu ? 'Домашние услуги' : 'Home Services'}
      subtitle={`${filteredFunctions.length} ${isRu ? 'услуг' : 'services'}`}
      heroIcon={Wrench}
      heroTitle={isRu ? 'Решим любую проблему' : 'We Fix Any Problem'}
      heroSubtitle={isRu ? 'Мастера на все руки' : 'Professional home services'}
      heroImage="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800"
      heroGradient={{ from: 'from-amber-500/20', via: 'via-orange-500/20', to: 'to-primary/20' }}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder={isRu ? 'Поиск услуг...' : 'Search services...'}
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
      isLoading={false}
      isEmpty={filteredFunctions.length === 0}
      emptyIcon={Wrench}
      emptyText={isRu ? 'Услуги не найдены' : 'No services found'}
    >
      {/* Quick Grid */}
      <MiniAppQuickGrid items={quickItems} columns={4} className="mb-4" />
      
      {/* Popular Section */}
      {selectedCategory === 'all' && !searchQuery && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">
              {isRu ? 'Популярные услуги' : 'Popular Services'}
            </h3>
          </div>
          <div className="grid gap-2">
            {popular.slice(0, 4).map((fn) => (
              <ServiceFunctionCard
                key={fn.id}
                fn={fn}
                onClick={() => handleFunctionClick(fn)}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Category Header when filtered */}
      {selectedCategory !== 'all' && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">
            {categories.find(c => c.id === selectedCategory)?.icon}
          </span>
          <h3 className="font-semibold">
            {categories.find(c => c.id === selectedCategory)?.name}
          </h3>
          <Badge variant="secondary" className="ml-auto">
            {filteredFunctions.length} {isRu ? 'услуг' : 'services'}
          </Badge>
        </div>
      )}
      
      {/* Function Cards */}
      <div className="grid gap-3 mb-6">
        {(selectedCategory === 'all' && !searchQuery ? filteredFunctions.slice(0, 10) : filteredFunctions).map((fn) => (
          <ServiceFunctionCard
            key={fn.id}
            fn={fn}
            onClick={() => handleFunctionClick(fn)}
          />
        ))}
      </div>
      
      {/* Show all categories when in "all" view */}
      {selectedCategory === 'all' && !searchQuery && (
        <div className="space-y-6">
          {categories.map(category => {
            const categoryFunctions = getFunctionsByCategory(category.id);
            if (categoryFunctions.length === 0) return null;
            
            return (
              <div key={category.id}>
                <button
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setSearchParams(new URLSearchParams({ category: category.id }));
                  }}
                  className="flex items-center gap-2 mb-3 w-full"
                >
                  <span className="text-lg">{category.icon}</span>
                  <h3 className="font-semibold text-sm">{category.name}</h3>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {categoryFunctions.length}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                </button>
                <div className="grid gap-2">
                  {categoryFunctions.slice(0, 3).map((fn) => (
                    <ServiceFunctionCard
                      key={fn.id}
                      fn={fn}
                      onClick={() => handleFunctionClick(fn)}
                      compact
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CrossSellSection currentVertical="services" />
    </MiniAppLayout>
  );
}
