import React from 'react';
import { Plus, Minus, Star } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { MarketplaceProduct } from '@/types/marketplace';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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

  const name = language === 'ru' ? product.name_ru : product.name_en;
  const unit = language === 'ru' ? product.unit_ru : product.unit;

  const discount = product.original_price 
    ? Math.round((1 - product.price / product.original_price) * 100) 
    : 0;

  if (variant === 'horizontal') {
    return (
      <div 
        className="flex gap-3 p-3 bg-card rounded-xl border border-border"
        onClick={onClick}
      >
        {/* Image */}
        <div className="relative w-24 h-24 shrink-0 rounded-lg overflow-hidden">
          <img
            src={product.cover_image || '/placeholder.svg'}
            alt={name}
            className="w-full h-full object-cover"
          />
          {product.is_new && (
            <Badge className="absolute top-1 left-1 bg-blue-500 text-[10px] px-1.5 py-0">
              NEW
            </Badge>
          )}
          {discount > 0 && (
            <Badge className="absolute top-1 right-1 bg-red-500 text-[10px] px-1.5 py-0">
              -{discount}%
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm line-clamp-2">{name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{unit}</p>
          
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
              <span className="font-bold">฿{product.price}</span>
              {product.original_price && (
                <span className="text-xs text-muted-foreground line-through ml-1">
                  ฿{product.original_price}
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
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Image */}
      <div 
        className="relative aspect-square cursor-pointer"
        onClick={onClick}
      >
        <img
          src={product.cover_image || '/placeholder.svg'}
          alt={name}
          className="w-full h-full object-cover"
        />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.is_new && (
            <Badge className="bg-blue-500 text-white text-[10px] px-1.5 py-0">
              NEW
            </Badge>
          )}
          {product.is_popular && !product.is_new && (
            <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0">
              🔥 HIT
            </Badge>
          )}
        </div>
        
        {discount > 0 && (
          <Badge className="absolute top-2 right-2 bg-red-500 text-white text-[10px] px-1.5 py-0">
            -{discount}%
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="text-sm font-medium line-clamp-2 min-h-[2.5rem]">
          {name}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">{unit}</p>
        
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
            <span className="font-bold text-base">฿{product.price}</span>
            {product.original_price && (
              <span className="text-xs text-muted-foreground line-through">
                ฿{product.original_price}
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
