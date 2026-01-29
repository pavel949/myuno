import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Sparkles, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMarketplaceProducts } from '@/hooks/useMarketplace';
import { ProductSection } from '@/components/market/ProductSection';

export function HomeProductsSection() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  // Fetch popular products
  const { products: popularProducts, isLoading: popularLoading } = useMarketplaceProducts({
    popularOnly: true,
    limit: 8,
  });

  // Fetch new arrivals (products marked as new)
  const { products: newProducts, isLoading: newLoading } = useMarketplaceProducts({
    limit: 8,
  });

  // Filter products marked as new
  const newArrivals = React.useMemo(() => {
    return newProducts.filter(p => p.is_new).slice(0, 8);
  }, [newProducts]);

  return (
    <div className="space-y-5">
      {/* Popular Products */}
      {(popularLoading || popularProducts.length > 0) && (
        <ProductSection
          title="Bestsellers"
          titleRu="Хиты продаж"
          products={popularProducts}
          seeAllPath="/market?filter=popular"
          maxItems={8}
          variant="scroll"
          isLoading={popularLoading}
          icon="trending"
        />
      )}

      {/* New Arrivals */}
      {(newLoading || newArrivals.length > 0) && (
        <ProductSection
          title="New Arrivals"
          titleRu="Новинки"
          products={newArrivals}
          seeAllPath="/market?filter=new"
          maxItems={8}
          variant="scroll"
          isLoading={newLoading}
          icon="sparkles"
        />
      )}

      {/* CTA to full marketplace */}
      <button
        onClick={() => navigate('/market')}
        className="w-full py-3 px-4 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-medium text-sm flex items-center justify-center gap-2 transition-colors"
      >
        <span>{isRu ? 'Открыть весь каталог' : 'Browse Full Catalog'}</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
