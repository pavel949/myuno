import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Wrench, Zap, ChevronRight } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { CatalogHeader } from "@/components/shared/CatalogHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/uno/EmptyState";
import { useServiceFunctions, type LocalizedServiceFunction } from "@/hooks/useServiceFunctions";
import { ServiceFunctionCard } from "@/components/services";
import { CrossSellSection } from "@/components/crosssell";
import { SERVICE_CATEGORIES, type ServiceCategory } from "@/lib/config/homeServiceFunctions";
import { Badge } from "@/components/ui/badge";

export default function ServicesIndex() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isRu = language === 'ru';
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const { functions, categories, popular, search, getFunctionsByCategory } = useServiceFunctions();

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
    
    return result;
  }, [functions, selectedCategory, searchQuery, getFunctionsByCategory, search]);

  const categoryRibbon = useMemo(() => [
    { id: 'all', label: isRu ? 'Все услуги' : 'All Services' },
    ...categories.map(c => ({
      id: c.id as string,
      label: isRu
        ? (SERVICE_CATEGORIES.find(sc => sc.id === c.id)?.nameRu || c.name)
        : (SERVICE_CATEGORIES.find(sc => sc.id === c.id)?.nameEn || c.name),
    })),
  ], [categories, isRu]);

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
    <AppLayout showHeader={false} showBottomNav>
      <div className="min-h-screen bg-background">
        <CatalogHeader
          title={isRu ? 'Домашние услуги' : 'Home Services'}
          subtitle={`${filteredFunctions.length} ${isRu ? 'услуг' : 'services'}`}
          fallbackPath="/discover"
          categories={categoryRibbon}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
        />

        <main className="container max-w-[1536px] mx-auto px-4 py-4 pb-24">
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
          
          {filteredFunctions.length === 0 ? (
            <EmptyState
              icon={Wrench}
              title={isRu ? 'Услуги не найдены' : 'No services found'}
            />
          ) : (
            <>
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
        </main>
      </div>
    </AppLayout>
  );
}
