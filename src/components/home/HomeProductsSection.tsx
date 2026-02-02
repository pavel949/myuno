import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMarketplaceProducts } from '@/hooks/useMarketplace';
import { ProductSection } from '@/components/market/ProductSection';

export function HomeProductsSection() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  // Single query - useMarketplaceProducts now uses shared cache
  // Client-side filtering prevents duplicate API calls
  const { products: allProducts, isLoading } = useMarketplaceProducts({});

  // Derive popular and new products from the cached data
  const popularProducts = useMemo(() => {
    return allProducts.filter(p => p.is_popular).slice(0, 8);
  }, [allProducts]);

  const newArrivals = useMemo(() => {
    return allProducts.filter(p => p.is_new).slice(0, 8);
  }, [allProducts]);

  return (
    <div className="space-y-5">
      {/* Popular Products */}
      {(isLoading || popularProducts.length > 0) && (
        <ProductSection
          title="Bestsellers"
          titleRu="Хиты продаж"
          products={popularProducts}
          seeAllPath="/market?filter=popular"
          maxItems={8}
          variant="scroll"
          isLoading={isLoading}
          icon="trending"
        />
      )}

      {/* New Arrivals */}
      {(isLoading || newArrivals.length > 0) && (
        <ProductSection
          title="New Arrivals"
          titleRu="Новинки"
          products={newArrivals}
          seeAllPath="/market?filter=new"
          maxItems={8}
          variant="scroll"
          isLoading={isLoading}
          icon="sparkles"
        />
      )}

      {/* CTA to full marketplace */}
      <button
        onClick={() => navigate('/market')}
        className="w-full py-3 px-4 rounded-2xl bg-primary/10 hover:bg-primary/20 text-primary font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98]"
      >
        <span>{isRu ? 'Открыть весь каталог' : 'Browse Full Catalog'}</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
