import React from 'react';
import { Plus, Minus, Star, Heart, ShoppingBag, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { MarketplaceProduct } from '@/types/marketplace';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ProfessionalProductCardProps {
  product: MarketplaceProduct;
  quantity?: number;
  onAdd: () => void;
  onRemove: () => void;
  onClick?: () => void;
  variant?: 'grid' | 'horizontal' | 'featured';
}

export const ProfessionalProductCard: React.FC<ProfessionalProductCardProps> = ({
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
  const vendorName = language === 'ru' ? (product.vendor_name_ru || product.vendor_name) : product.vendor_name;

  const discount = product.original_price 
    ? Math.round((1 - product.price / product.original_price) * 100) 
    : 0;

  // Featured variant - large hero card
  if (variant === 'featured') {
    return (
      <div 
        className="relative rounded-2xl overflow-hidden bg-card border border-border shadow-lg cursor-pointer group"
        onClick={onClick}
      >
        {/* Image Section */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={product.cover_image || '/placeholder.svg'}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Top badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {product.is_new && (
              <Badge className="bg-blue-500 text-white text-xs font-medium px-2.5 py-0.5 shadow-lg">
                NEW
              </Badge>
            )}
            {product.is_popular && (
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-medium px-2.5 py-0.5 shadow-lg">
                🔥 BESTSELLER
              </Badge>
            )}
          </div>
          
          {discount > 0 && (
            <Badge className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2.5 py-0.5 shadow-lg">
              -{discount}%
            </Badge>
          )}
          
          {/* Bottom content overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <h3 className="font-semibold text-base line-clamp-2 mb-1">{name}</h3>
            {vendorName && (
              <p className="text-white/70 text-xs">{vendorName}</p>
            )}
          </div>
        </div>

        {/* Bottom info bar */}
        <div className="p-4 flex items-center justify-between bg-card">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-foreground">฿{product.price.toLocaleString()}</span>
              {product.original_price && (
                <span className="text-sm text-muted-foreground line-through">
                  ฿{product.original_price.toLocaleString()}
                </span>
              )}
            </div>
            {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
          </div>
          
          {quantity === 0 ? (
            <Button 
              size="lg"
              className="rounded-full gap-2 shadow-md"
              onClick={(e) => { e.stopPropagation(); onAdd(); }}
            >
              <ShoppingBag className="h-4 w-4" />
              {language === 'ru' ? 'В корзину' : 'Add to cart'}
            </Button>
          ) : (
            <div className="flex items-center gap-2 bg-primary/10 rounded-full px-2" onClick={(e) => e.stopPropagation()}>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-9 w-9 rounded-full hover:bg-primary/20"
                onClick={onRemove}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-base font-semibold w-6 text-center">{quantity}</span>
              <Button 
                size="icon" 
                className="h-9 w-9 rounded-full"
                onClick={onAdd}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Horizontal variant
  if (variant === 'horizontal') {
    return (
      <div 
        className="flex gap-4 p-3 bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
        onClick={onClick}
      >
        {/* Image */}
        <div className="relative w-28 h-28 shrink-0 rounded-xl overflow-hidden">
          <img
            src={product.cover_image || '/placeholder.svg'}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {product.is_new && (
            <Badge className="absolute top-1.5 left-1.5 bg-blue-500 text-white text-[10px] px-1.5 py-0">
              NEW
            </Badge>
          )}
          {discount > 0 && (
            <Badge className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[10px] px-1.5 py-0">
              -{discount}%
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div>
            <h3 className="font-semibold text-sm line-clamp-2 text-foreground">{name}</h3>
            {vendorName && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{vendorName}</p>
            )}
            {unit && <p className="text-xs text-muted-foreground">{unit}</p>}
          </div>
          
          {product.rating && (
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-0.5 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-full">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                  {product.rating}
                </span>
              </div>
              {product.review_count && (
                <span className="text-xs text-muted-foreground">
                  ({product.review_count})
                </span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-base">฿{product.price.toLocaleString()}</span>
              {product.original_price && (
                <span className="text-xs text-muted-foreground line-through">
                  ฿{product.original_price.toLocaleString()}
                </span>
              )}
            </div>
            
            {/* Cart Controls */}
            {quantity === 0 ? (
              <Button 
                size="sm" 
                className="h-8 px-4 rounded-full shadow-sm"
                onClick={(e) => { e.stopPropagation(); onAdd(); }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            ) : (
              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <Button 
                  size="icon" 
                  variant="outline" 
                  className="h-7 w-7 rounded-full"
                  onClick={onRemove}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="text-sm font-semibold w-5 text-center">{quantity}</span>
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

  // Grid variant (default) - Professional card design
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group">
      {/* Image Container */}
      <div 
        className="relative aspect-square cursor-pointer overflow-hidden"
        onClick={onClick}
      >
        <img
          src={product.cover_image || '/placeholder.svg'}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Subtle gradient for badges readability */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />
        
        {/* Badges Container */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.is_new && (
            <Badge className="bg-blue-500 text-white text-[10px] font-semibold px-2 py-0.5 shadow-md">
              NEW
            </Badge>
          )}
          {product.is_popular && !product.is_new && (
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-semibold px-2 py-0.5 shadow-md">
              🔥 HIT
            </Badge>
          )}
        </div>
        
        {discount > 0 && (
          <Badge className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 shadow-md">
            -{discount}%
          </Badge>
        )}

        {/* Quick add overlay on hover (desktop) */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none" />
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Vendor tag */}
        {vendorName && (
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-1 truncate">
            {vendorName}
          </p>
        )}
        
        <h3 className="text-sm font-semibold line-clamp-2 min-h-[2.5rem] text-foreground leading-tight">
          {name}
        </h3>
        
        {unit && (
          <p className="text-xs text-muted-foreground mt-0.5">{unit}</p>
        )}
        
        {/* Rating */}
        {product.rating && (
          <div className="flex items-center gap-1 mt-1.5">
            <div className="flex items-center gap-0.5 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-full">
              <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
              <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                {product.rating}
              </span>
            </div>
            {product.review_count && (
              <span className="text-[10px] text-muted-foreground">
                {product.review_count} {language === 'ru' ? 'отз.' : 'reviews'}
              </span>
            )}
          </div>
        )}

        {/* Price & Cart */}
        <div className="flex items-end justify-between mt-3 pt-2 border-t border-border/50">
          <div className="flex flex-col">
            <span className="font-bold text-lg leading-none text-foreground">
              ฿{product.price.toLocaleString()}
            </span>
            {product.original_price && (
              <span className="text-xs text-muted-foreground line-through mt-0.5">
                ฿{product.original_price.toLocaleString()}
              </span>
            )}
          </div>
          
          {/* Cart Controls */}
          {quantity === 0 ? (
            <Button 
              size="icon" 
              className="h-9 w-9 rounded-full shadow-md shrink-0"
              onClick={(e) => { e.stopPropagation(); onAdd(); }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          ) : (
            <div className="flex items-center gap-1 bg-primary/10 rounded-full px-1">
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-7 w-7 rounded-full hover:bg-primary/20"
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="text-sm font-bold w-5 text-center text-primary">{quantity}</span>
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
