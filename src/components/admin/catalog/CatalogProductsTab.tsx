import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Grid3X3, List, BadgeCheck, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CatalogProductsTabProps {
  searchQuery: string;
  statusFilter: string;
}

const marketplaceCategories = [
  { key: 'products', label: 'Products', labelRu: 'Товары', icon: ShoppingCart, path: '/admin/marketplace/products', description: 'All marketplace products', descriptionRu: 'Все товары маркетплейса' },
  { key: 'categories', label: 'Categories', labelRu: 'Категории', icon: Grid3X3, path: '/admin/marketplace/categories', description: 'Product categories', descriptionRu: 'Категории товаров' },
  { key: 'subcategories', label: 'Subcategories', labelRu: 'Подкатегории', icon: List, path: '/admin/marketplace/subcategories', description: 'Product subcategories', descriptionRu: 'Подкатегории товаров' },
  { key: 'vendors', label: 'Vendors', labelRu: 'Продавцы', icon: BadgeCheck, path: '/admin/marketplace/vendors', description: 'Verified sellers', descriptionRu: 'Верифицированные продавцы' },
];

export function CatalogProductsTab({ searchQuery, statusFilter }: CatalogProductsTabProps) {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const navigate = useNavigate();

  const filteredCategories = marketplaceCategories.filter(cat => {
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      return cat.label.toLowerCase().includes(searchLower) || 
             cat.labelRu.toLowerCase().includes(searchLower);
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredCategories.map((cat) => (
          <Card 
            key={cat.key}
            className="cursor-pointer hover:shadow-md transition-shadow group"
            onClick={() => navigate(cat.path)}
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
                <cat.icon className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold">
                  {isRussian ? cat.labelRu : cat.label}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isRussian ? cat.descriptionRu : cat.description}
                </p>
              </div>
              <Button variant="ghost" size="sm" className="shrink-0 gap-1">
                <ExternalLink className="h-4 w-4" />
                {isRussian ? 'Открыть' : 'Open'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {isRussian ? 'Категории не найдены' : 'No categories found'}
        </div>
      )}
    </div>
  );
}
