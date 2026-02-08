import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { resolveIcon } from '@/lib/iconMap';

import { Badge } from '@/components/ui/badge';
import { ChevronRight } from 'lucide-react';
import { MarketplaceSubcategory } from '@/types/marketplace';

interface QuickSubcategoriesProps {
  subcategories: MarketplaceSubcategory[];
  categorySlug: string;
  productCounts?: Record<string, number>;
}

export const QuickSubcategories: React.FC<QuickSubcategoriesProps> = ({
  subcategories,
  categorySlug,
  productCounts = {},
}) => {
  const { language } = useLanguage();
  const navigate = useNavigate();

  if (subcategories.length === 0) return null;

  return (
    <div className="flex gap-2 pb-2 overflow-x-auto scrollbar-hide touch-pan-y snap-x snap-proximity">
      {subcategories.slice(0, 10).map((sub) => {
        const count = productCounts[sub.slug] || 0;
        return (
          <button
            key={sub.id}
            onClick={() => navigate(`/market/category/${categorySlug}?sub=${sub.slug}`)}
            className="flex items-center gap-2 px-3 py-2 rounded-full bg-muted/50 hover:bg-muted transition-colors whitespace-nowrap snap-start touch-manipulation"
          >
            {sub.icon && (() => { const Icon = resolveIcon(sub.icon); return <Icon className="w-4 h-4" />; })()}
            <span className="text-xs font-medium">
              {language === 'ru' ? sub.name_ru : sub.name_en}
            </span>
            {count > 0 && (
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
                {count}
              </Badge>
            )}
          </button>
        );
      })}
      
      {subcategories.length > 10 && (
        <button
          onClick={() => navigate(`/market/category/${categorySlug}`)}
          className="flex items-center gap-1 px-3 py-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors whitespace-nowrap snap-start touch-manipulation"
        >
          <span className="text-xs font-medium">
            {language === 'ru' ? 'Ещё' : 'More'}
          </span>
          <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};
