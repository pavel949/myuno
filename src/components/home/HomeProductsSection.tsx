import React, { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMarketplaceProducts } from '@/hooks/useMarketplace';
import { ProductSection } from '@/components/market/ProductSection';
import { QuickSolutionsGallery } from '@/components/home/QuickSolutionsGallery';
import { Surface } from '@/components/ui/surface';

// Expat-relevant food categories
const EXPAT_CATEGORIES = [
  'cheese', 'seafood_meat', 'poultry', 'fresh', 'processed',
  'pasta', 'beer', 'spirits', 'condiment', 'vegetables', 'fruit', 'rice',
];

export function HomeProductsSection() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const { products: allProducts, isLoading } = useMarketplaceProducts({});

  // Show products from expat-popular categories instead of is_new
  const expatProducts = useMemo(() => {
    return allProducts
      .filter(p => p.subcategory && EXPAT_CATEGORIES.includes(p.subcategory))
      .filter(p => !!p.cover_image) // Only show products with photos
      .slice(0, 8);
  }, [allProducts]);

  return (
    <Surface variant="page" bordered={false} padding="none" radius="none" className="space-y-5">
      {/* Quick Solutions Gallery */}
      <QuickSolutionsGallery />

      {/* Expat-popular products */}
      {(isLoading || expatProducts.length > 0) && (
        <ProductSection
          title="Popular with Expats"
          titleRu="Популярное у экспатов"
          products={expatProducts}
          seeAllPath="/market"
          maxItems={8}
          variant="scroll"
          isLoading={isLoading}
          icon="trending"
        />
      )}

    </Surface>
  );
}
