import React from 'react';
import { Plus, Minus, Star } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { MarketplaceProduct } from '@/types/marketplace';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatProductUnit, formatPricePerUnit } from '@/utils/formatProductUnit';
import { BADGE_STYLES } from '@/lib/designTokens';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: MarketplaceProduct;
  quantity?: number;
  onAdd: () => void;
  onRemove: () => void;
  onClick?: () => void;
  variant?: 'grid' | 'horizontal';
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  quantity = 0,
  onAdd,
  onRemove,
  onClick,
  variant = 'grid',
}) => {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();

  const name = language === 'ru' ? product.name_ru : product.name_en;
  // Use new precise unit formatting
  const unitDisplay = formatProductUnit(product, language as 'en' | 'ru');
  const pricePerUnit = formatPricePerUnit(product, language as 'en' | 'ru');

  const discount = product.original_price 
    ? Math.round((1 - product.price / product.original_price) * 100) 
    : 0;

  if (variant === 'horizontal') {
    return (
      <div 
        className="flex gap-3 p-3 bg-card rounded-2xl border border-border group hover:shadow-md transition-all"
        onClick={onClick}
      >
        {/* Image */}
        <div className="relative w-24 h-24 shrink-0 rounded-lg overflow-hidden">
          <img
            src={product.cover_image || '/placeholder.svg'}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
          {product.is_new && (
            <Badge className={cn("absolute top-1 left-1 text-[10px] px-1.5 py-0", BADGE_STYLES.new)}>
              NEW
            </Badge>
          )}
          {discount > 0 && (
            <Badge className={cn("absolute top-1 right-1 text-[10px] px-1.5 py-0", BADGE_STYLES.discount)}>
              -{discount}%
            </Badge>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm line-clamp-2">{name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{unitDisplay}</p>
          
          {product.rating && (
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-xs text-muted-foreground">
                {product.rating} ({product.review_count})
              </span>
            </div>
          )}

          <div className="flex items-center justify-between mt-2">
            <div>
              <span className="font-bold">{formatPrice(product.price)}</span>
              {product.original_price && (
                <span className="text-xs text-muted-foreground line-through ml-1">
                  {formatPrice(product.original_price)}
                </span>
              )}
            </div>
            
            {/* Cart Controls */}
            {quantity === 0 ? (
              <Button 
                size="sm" 
                className="h-8 px-3 rounded-full"
                onClick={(e) => { e.stopPropagation(); onAdd(); }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            ) : (
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Button 
                  size="icon" 
                  variant="outline" 
                  className="h-7 w-7 rounded-full"
                  onClick={onRemove}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="text-sm font-medium w-4 text-center">{quantity}</span>
                <Button 
                  size="icon" 
                  className="h-7 w-7 rounded-full"
                  onClick={onAdd}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Grid variant (default)
  return (
    <div 
      className="bg-card rounded-2xl border border-border overflow-hidden group hover:shadow-md transition-all cursor-pointer"
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden"
      >
        <img
          src={product.cover_image || '/placeholder.svg'}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.is_new && (
            <Badge className={cn("text-[10px] px-1.5 py-0", BADGE_STYLES.new)}>
              NEW
            </Badge>
          )}
          {product.is_popular && !product.is_new && (
            <Badge className={cn("text-[10px] px-1.5 py-0", BADGE_STYLES.hot)}>
              🔥 HIT
            </Badge>
          )}
        </div>
        
        {discount > 0 && (
          <Badge className={cn("absolute top-2 right-2 text-[10px] px-1.5 py-0", BADGE_STYLES.discount)}>
            -{discount}%
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="text-sm font-medium line-clamp-2 min-h-[2.5rem]">
          {name}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">{unitDisplay}</p>
        
        {product.rating && (
          <div className="flex items-center gap-1 mt-1">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-xs text-muted-foreground">
              {product.rating}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between mt-2">
          <div className="flex flex-col">
            <span className="font-bold text-base">{formatPrice(product.price)}</span>
            {pricePerUnit && (
              <span className="text-[10px] text-muted-foreground">
                {pricePerUnit}
              </span>
            )}
            {product.original_price && !pricePerUnit && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(product.original_price)}
              </span>
            )}
          </div>
          
          {/* Cart Controls */}
          {quantity === 0 ? (
            <Button 
              size="icon" 
              className="h-8 w-8 rounded-full shrink-0"
              onClick={(e) => { e.stopPropagation(); onAdd(); }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          ) : (
            <div className="flex items-center gap-1.5">
              <Button 
                size="icon" 
                variant="outline" 
                className="h-7 w-7 rounded-full"
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="text-sm font-medium w-4 text-center">{quantity}</span>
              <Button 
                size="icon" 
                className="h-7 w-7 rounded-full"
                onClick={(e) => { e.stopPropagation(); onAdd(); }}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
