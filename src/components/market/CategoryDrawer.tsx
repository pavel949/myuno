import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Menu, Search, ChevronRight } from 'lucide-react';
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

interface CategoryDrawerProps {
  trigger?: React.ReactNode;
}

export function CategoryDrawer({ trigger }: CategoryDrawerProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
    setOpen(false);
    navigate(`/market/category/${slug}`);
  };

  const handleSubcategoryClick = (categorySlug: string, subcategorySlug: string) => {
    setOpen(false);
    navigate(`/market/category/${categorySlug}?sub=${subcategorySlug}`);
  };

  const defaultTrigger = (
    <Button variant="ghost" size="icon" className="shrink-0">
      <Menu className="w-5 h-5" />
    </Button>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || defaultTrigger}
      </SheetTrigger>
      
      <SheetContent 
        side="left" 
        className="w-[85vw] max-w-[320px] p-0 flex flex-col"
      >
        {/* Header */}
        <SheetHeader className="px-4 py-4 border-b border-border">
          <SheetTitle className="text-left flex items-center gap-2">
            <Menu className="w-5 h-5" />
            {language === 'ru' ? 'Каталог' : 'Catalog'}
          </SheetTitle>
        </SheetHeader>

        {/* Search */}
        <div className="px-4 py-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={language === 'ru' ? 'Поиск категории...' : 'Search category...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 rounded-lg bg-muted border-0"
            />
          </div>
        </div>

        {/* Categories List */}
        <ScrollArea className="flex-1">
          <div className="py-2">
            {filteredCategories.length === 0 ? (
              <div className="px-4 py-8 text-center text-muted-foreground">
                {language === 'ru' ? 'Ничего не найдено' : 'Nothing found'}
              </div>
            ) : (
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
                            className="w-8 h-8 rounded-lg object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-lg shrink-0">
                            {category.icon || getCategoryIcon(category.slug)}
                          </div>
                        )}
                        
                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-sm">
                            {language === 'ru' ? category.name_ru : category.name_en}
                          </span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {count}
                          </span>
                        </div>
                        
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
                              className="w-8 h-8 rounded-lg object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-lg shrink-0">
                              {category.icon || getCategoryIcon(category.slug)}
                            </div>
                          )}
                          
                          {/* Text */}
                          <span className="font-medium text-sm">
                            {language === 'ru' ? category.name_ru : category.name_en}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {count}
                          </span>
                        </div>
                      </AccordionTrigger>
                      
                      <AccordionContent className="pb-0">
                        <div className="pl-4 border-l-2 border-muted ml-8 space-y-0.5">
                          {/* "All" option */}
                          <button
                            onClick={() => handleCategoryClick(category.slug)}
                            className={cn(
                              "w-full flex items-center justify-between px-3 py-2.5",
                              "hover:bg-muted/50 active:bg-muted rounded-lg transition-colors",
                              "text-left text-sm"
                            )}
                          >
                            <span className="font-medium">
                              {language === 'ru' ? 'Все' : 'All'}
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
                                  "hover:bg-muted/50 active:bg-muted rounded-lg transition-colors",
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
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
