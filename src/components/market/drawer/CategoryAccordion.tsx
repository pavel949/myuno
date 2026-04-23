import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useMarketplaceCategories,
  useMarketplaceSubcategories,
  useMarketplaceProducts,
} from '@/hooks/useMarketplace';

// Fallback icons
const getCategoryIcon = (slug: string): string => {
  const icons: Record<string, string> = {
    'fruits-vegetables': '🥬',
    'dairy-eggs': '🥛',
    'meat': '🥩',
    'seafood': '🦐',
    'bakery': '🥖',
    'beverages': '🥤',
    'snacks': '🍿',
    'organic': '🌿',
    'frozen': '❄️',
    'pantry': '🏺',
    'baby': '👶',
    'household': '🏠',
    'personal-care': '🧴',
    'pet-supplies': '🐕',
    'electronics': '📱',
    'fashion': '👔',
  };
  return icons[slug] || '📦';
};

interface CategoryAccordionProps {
  searchQuery: string;
  onNavigate: () => void;
}

export function CategoryAccordion({ searchQuery, onNavigate }: CategoryAccordionProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const { categories } = useMarketplaceCategories();
  const { subcategories } = useMarketplaceSubcategories();
  const { products } = useMarketplaceProducts();

  // Count products per category
  const productCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(p => {
      counts[p.category_slug] = (counts[p.category_slug] || 0) + 1;
    });
    return counts;
  }, [products]);

  // Count products per subcategory
  const subcategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(p => {
      if (p.subcategory) {
        counts[p.subcategory] = (counts[p.subcategory] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

  // Group subcategories by category
  const subcategoriesByCategory = useMemo(() => {
    const grouped: Record<string, typeof subcategories> = {};
    subcategories.forEach(sub => {
      if (!grouped[sub.category_slug]) {
        grouped[sub.category_slug] = [];
      }
      grouped[sub.category_slug].push(sub);
    });
    return grouped;
  }, [subcategories]);

  // Filter categories and subcategories by search
  const filteredCategories = useMemo(() => {
    const active = categories.filter(c => c.is_active);
    
    if (!searchQuery.trim()) return active;
    
    const query = searchQuery.toLowerCase();
    return active.filter(c => {
      const categoryMatch = 
        c.name_en.toLowerCase().includes(query) ||
        c.name_ru.toLowerCase().includes(query);
      
      const subs = subcategoriesByCategory[c.slug] || [];
      const subMatch = subs.some(s => 
        s.name_en.toLowerCase().includes(query) ||
        s.name_ru.toLowerCase().includes(query)
      );
      
      return categoryMatch || subMatch;
    });
  }, [categories, subcategoriesByCategory, searchQuery]);

  const handleCategoryClick = (slug: string) => {
    onNavigate();
    navigate(`/market/category/${slug}`);
  };

  const handleSubcategoryClick = (categorySlug: string, subcategorySlug: string) => {
    onNavigate();
    navigate(`/market/category/${categorySlug}?sub=${subcategorySlug}`);
  };

  if (filteredCategories.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-muted-foreground text-sm">
        {language === 'ru' ? 'Ничего не найдено' : 'Nothing found'}
      </div>
    );
  }

  return (
    <Accordion type="multiple" className="w-full">
      {filteredCategories.map((category) => {
        const subs = subcategoriesByCategory[category.slug] || [];
        const count = productCounts[category.slug] || 0;
        const hasSubcategories = subs.length > 0;

        if (!hasSubcategories) {
          // Simple category without subcategories
          return (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.slug)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3",
                "hover:bg-muted/50 active:bg-muted transition-colors",
                "text-left"
              )}
            >
              {/* Icon */}
              {category.image_url ? (
                <img 
                  src={category.image_url} 
                  alt=""
                  className="w-9 h-9 rounded-none object-cover shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-none bg-muted flex items-center justify-center text-lg shrink-0">
                  {category.icon || getCategoryIcon(category.slug)}
                </div>
              )}
              
              {/* Text */}
              <div className="flex-1 min-w-0">
                <span className="font-medium text-sm">
                  {language === 'ru' ? category.name_ru : category.name_en}
                </span>
              </div>
              
              <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded-full">
                {count}
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          );
        }

        // Category with subcategories
        return (
          <AccordionItem 
            key={category.id} 
            value={category.slug}
            className="border-0"
          >
            <AccordionTrigger 
              className={cn(
                "px-4 py-3 hover:bg-muted/50 hover:no-underline",
                "[&>svg]:text-muted-foreground"
              )}
            >
              <div className="flex items-center gap-3 flex-1">
                {/* Icon */}
                {category.image_url ? (
                  <img 
                    src={category.image_url} 
                    alt=""
                    className="w-9 h-9 rounded-none object-cover shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-none bg-muted flex items-center justify-center text-lg shrink-0">
                    {category.icon || getCategoryIcon(category.slug)}
                  </div>
                )}
                
                {/* Text */}
                <span className="font-medium text-sm">
                  {language === 'ru' ? category.name_ru : category.name_en}
                </span>
                <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded-full">
                  {count}
                </span>
              </div>
            </AccordionTrigger>
            
            <AccordionContent className="pb-0">
              <div className="pl-4 border-l-2 border-primary/20 ml-8 space-y-0.5 py-1">
                {/* "All" option */}
                <button
                  onClick={() => handleCategoryClick(category.slug)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5",
                    "hover:bg-muted/50 active:bg-muted rounded-none transition-colors",
                    "text-left text-sm font-medium text-primary"
                  )}
                >
                  <span>
                    {language === 'ru' ? 'Все товары' : 'All items'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {count}
                  </span>
                </button>
                
                {/* Subcategories */}
                {subs.map((sub) => {
                  const subCount = subcategoryCounts[sub.slug] || 0;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => handleSubcategoryClick(category.slug, sub.slug)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2.5",
                        "hover:bg-muted/50 active:bg-muted rounded-none transition-colors",
                        "text-left text-sm text-muted-foreground"
                      )}
                    >
                      <span>
                        {language === 'ru' ? sub.name_ru : sub.name_en}
                      </span>
                      <span className="text-xs">
                        {subCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
