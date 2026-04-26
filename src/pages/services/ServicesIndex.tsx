import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Wrench, Zap, ChevronRight } from "lucide-react";
import { MiniAppLayout } from "@/components/miniapp/MiniAppLayout";
import { EmptyState } from "@/components/uno/EmptyState";
import { useServiceFunctions, type LocalizedServiceFunction } from "@/hooks/useServiceFunctions";
import { ServiceFunctionCard } from "@/components/services";
import { CrossSellSection } from "@/components/crosssell";
import { SERVICE_CATEGORIES, type ServiceCategory } from "@/lib/config/homeServiceFunctions";
import { Badge } from "@/components/ui/badge";
import { usePersonaFilter } from "@/hooks/usePersonaFilter";

export default function ServicesIndex() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isRu = language === 'ru';

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { functions, categories, popular, search, getFunctionsByCategory } = useServiceFunctions();
  const { applyFilter: applyPersonaFilter } = usePersonaFilter();

  useEffect(() => {
    const categoryParam = searchParams.get('category');
    setSelectedCategory(categoryParam || 'all');
  }, [searchParams]);

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

    result = applyPersonaFilter(result, (fn) => {
      const raw = fn as unknown as Record<string, unknown>;
      const tags = (raw.tags as string[] | null) ?? [];
      return [...tags, fn.category, fn.id].filter(Boolean) as string[];
    });

    return result;
  }, [functions, selectedCategory, searchQuery, getFunctionsByCategory, search, applyPersonaFilter]);

  const categoryRibbon = useMemo(() => [
    { id: 'all', labelEn: 'All Services', labelRu: 'Все услуги' },
    ...categories.map(c => {
      const sc = SERVICE_CATEGORIES.find(sc => sc.id === c.id);
      return {
        id: c.id as string,
        labelEn: sc?.nameEn || c.name,
        labelRu: sc?.nameRu || c.name,
      };
    }),
  ], [categories]);

  const handleFunctionClick = (fn: LocalizedServiceFunction) => {
    navigate(`/services/order/${fn.id}`);
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    const newParams = new URLSearchParams(searchParams);
    if (cat === 'all') {
      newParams.delete('category');
    } else {
      newParams.set('category', cat);
    }
    setSearchParams(newParams);
  };

  return (
    <MiniAppLayout
      title={isRu ? 'Домашние услуги' : 'Home Services'}
      subtitle={`${filteredFunctions.length} ${isRu ? 'услуг' : 'services'}`}
      fallbackPath="/discover"
      categories={categoryRibbon}
      selectedCategory={selectedCategory}
      onCategoryChange={handleCategoryChange}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder={isRu ? 'Поиск услуг…' : 'Search services…'}
      showHero={false}
      showFilter={false}
    >
      {/* Popular Section */}
      {selectedCategory === 'all' && !searchQuery && (
        <div>
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
        <div className="flex items-center gap-2">
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

      {filteredFunctions.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title={isRu ? 'Услуги не найдены' : 'No services found'}
        />
      ) : (
        <>
          <div className="grid gap-3">
            {(selectedCategory === 'all' && !searchQuery ? filteredFunctions.slice(0, 10) : filteredFunctions).map((fn) => (
              <ServiceFunctionCard
                key={fn.id}
                fn={fn}
                onClick={() => handleFunctionClick(fn)}
              />
            ))}
          </div>

          {selectedCategory === 'all' && !searchQuery && (
            <div className="space-y-6">
              {categories.map(category => {
                const categoryFunctions = getFunctionsByCategory(category.id);
                if (categoryFunctions.length === 0) return null;

                return (
                  <div key={category.id}>
                    <button
                      onClick={() => handleCategoryChange(category.id)}
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
        </>
      )}

      <CrossSellSection currentVertical="services" />
    </MiniAppLayout>
  );
}
