import React, { forwardRef, useState } from 'react';
import { Plus, Minus, Star, Heart, ShoppingBag, Check, ChefHat, Clock, X, Plane } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { MarketplaceProduct } from '@/types/marketplace';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ShippableBadge } from './ShippableBadge';
import { formatProductUnit, formatPricePerUnit } from '@/utils/formatProductUnit';
interface ProductRecipe {
  dish: string;
  dish_ru: string;
  time_mins: number;
  difficulty: 'easy' | 'medium' | 'hard';
  image: string;
  tip: string;
  tip_ru: string;
}

interface ExtendedMarketplaceProduct extends MarketplaceProduct {
  recipe?: ProductRecipe | null;
}

interface ProfessionalProductCardProps {
  product: ExtendedMarketplaceProduct;
  quantity?: number;
  onAdd: () => void;
  onRemove: () => void;
  onClick?: () => void;
  variant?: 'grid' | 'horizontal' | 'featured';
  compact?: boolean;
}

// Recipe tooltip component with forwardRef to avoid React warnings
const RecipeBadge = forwardRef<HTMLDivElement, { recipe: ProductRecipe; language: string }>(
  ({ recipe, language }, ref) => {
    const [showTooltip, setShowTooltip] = useState(false);
    
    const difficultyColors = {
      easy: 'bg-green-500',
      medium: 'bg-amber-500', 
      hard: 'bg-red-500',
    };
    
    const difficultyLabels = {
      easy: language === 'ru' ? 'Легко' : 'Easy',
      medium: language === 'ru' ? 'Средне' : 'Medium',
      hard: language === 'ru' ? 'Сложно' : 'Hard',
    };

    return (
      <div ref={ref} className="relative">
        <button
          onClick={(e) => { e.stopPropagation(); setShowTooltip(!showTooltip); }}
          className="flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-md hover:bg-emerald-600 transition-colors"
        >
          <ChefHat className="w-3 h-3" />
          <span>{language === 'ru' ? recipe.dish_ru : recipe.dish}</span>
        </button>
        
        {showTooltip && (
          <div 
            className="absolute z-50 top-full left-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-xl p-3 animate-in fade-in slide-in-from-top-2 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowTooltip(false)}
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex gap-3">
              <img 
                src={recipe.image} 
                alt={recipe.dish}
                className="w-16 h-16 rounded-lg object-cover shrink-0"
              />
              <div className="min-w-0">
                <h4 className="font-bold text-sm text-foreground">
                  {language === 'ru' ? recipe.dish_ru : recipe.dish}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {recipe.time_mins} {language === 'ru' ? 'мин' : 'min'}
                  </span>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full text-white",
                    difficultyColors[recipe.difficulty]
                  )}>
                    {difficultyLabels[recipe.difficulty]}
                  </span>
                </div>
              </div>
            </div>
            
            <p className="mt-2 text-xs text-muted-foreground border-t border-border pt-2">
              💡 {language === 'ru' ? recipe.tip_ru : recipe.tip}
            </p>
          </div>
        )}
      </div>
    );
  }
);

RecipeBadge.displayName = 'RecipeBadge';

export const ProfessionalProductCard = forwardRef<HTMLDivElement, ProfessionalProductCardProps>(({
  product,
  quantity = 0,
  onAdd,
  onRemove,
  onClick,
  variant = 'grid',
  compact = false,
}, ref) => {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();

  const name = language === 'ru' ? product.name_ru : product.name_en;
  const description = language === 'ru' ? product.description_ru : product.description_en;
  // Use new precise unit formatting
  const unitDisplay = formatProductUnit(product, language as 'en' | 'ru');
  const pricePerUnit = formatPricePerUnit(product, language as 'en' | 'ru');
  const vendorName = language === 'ru' ? (product.vendor_name_ru || product.vendor_name) : product.vendor_name;
  const recipe = product.recipe as ProductRecipe | null;

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
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
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
              <span className="text-lg font-bold text-foreground">{formatPrice(product.price)}</span>
              {product.original_price && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(product.original_price)}
                </span>
              )}
            </div>
            {unitDisplay && <span className="text-xs text-muted-foreground">{unitDisplay}</span>}
            {pricePerUnit && <span className="text-[10px] text-muted-foreground opacity-70">{pricePerUnit}</span>}
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
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
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
            {unitDisplay && <p className="text-xs text-muted-foreground">{unitDisplay}</p>}
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
              <span className="font-bold text-base">{formatPrice(product.price)}</span>
              {product.original_price && (
                <span className="text-xs text-muted-foreground line-through">
                  {formatPrice(product.original_price)}
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
    <div className={cn(
      "bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group",
      compact && "rounded-xl"
    )}>
      {/* Image Container */}
      <div 
        className="relative aspect-square cursor-pointer overflow-hidden"
        onClick={onClick}
      >
        <img
          src={product.cover_image || '/placeholder.svg'}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        
        {/* Subtle gradient for badges readability */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />
        
        {/* Badges Container */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {recipe && (
            <RecipeBadge recipe={recipe} language={language} />
          )}
          {product.is_shippable_international && !recipe && (
            <ShippableBadge />
          )}
          {product.is_new && !recipe && !product.is_shippable_international && (
            <Badge className="bg-blue-500 text-white text-[10px] font-semibold px-2 py-0.5 shadow-md">
              NEW
            </Badge>
          )}
          {product.is_popular && !product.is_new && !recipe && !product.is_shippable_international && (
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-semibold px-2 py-0.5 shadow-md">
              🔥 HIT
            </Badge>
          )}
        </div>
        
        {/* Right side badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
          {discount > 0 && (
            <Badge className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 shadow-md">
              -{discount}%
            </Badge>
          )}
          {product.is_shippable_international && (product.is_new || product.is_popular) && (
            <Badge className={cn(
              "text-white text-[10px] font-semibold px-2 py-0.5 shadow-md",
              product.is_new ? "bg-blue-500" : "bg-gradient-to-r from-amber-500 to-orange-500"
            )}>
              {product.is_new ? 'NEW' : '🔥 HIT'}
            </Badge>
          )}
        </div>

        {/* Quick add overlay on hover (desktop) */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none" />
      </div>

      {/* Content */}
      <div className={cn("p-3", compact && "p-2")}>
        {/* Vendor tag - hide in compact mode */}
        {vendorName && !compact && (
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-1 truncate">
            {vendorName}
          </p>
        )}
        
        <h3 className={cn(
          "font-semibold line-clamp-2 text-foreground leading-tight",
          compact ? "text-xs min-h-[2rem]" : "text-sm min-h-[2.5rem]"
        )}>
          {name}
        </h3>
        
        {/* Description - hide in compact mode */}
        {description && !compact && (
          <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 leading-snug">
            {description}
          </p>
        )}
        
        {unitDisplay && !compact && (
          <p className="text-xs text-muted-foreground mt-0.5">{unitDisplay}</p>
        )}
        {pricePerUnit && !compact && (
          <p className="text-[10px] text-muted-foreground opacity-70">{pricePerUnit}</p>
        )}
        
        {/* Rating - simplified in compact mode */}
        {product.rating && !compact && (
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
        <div className={cn(
          "flex items-end justify-between border-t border-border/50",
          compact ? "mt-2 pt-1.5" : "mt-3 pt-2"
        )}>
          <div className="flex flex-col">
            <span className={cn(
              "font-bold leading-none text-foreground",
              compact ? "text-sm" : "text-lg"
            )}>
              {formatPrice(product.price)}
            </span>
            {product.original_price && !compact && (
              <span className="text-xs text-muted-foreground line-through mt-0.5">
                {formatPrice(product.original_price)}
              </span>
            )}
          </div>
          
          {/* Cart Controls */}
          {quantity === 0 ? (
            <Button 
              size="icon" 
              className={cn(
                "rounded-full shadow-md shrink-0",
                compact ? "h-7 w-7" : "h-9 w-9"
              )}
              onClick={(e) => { e.stopPropagation(); onAdd(); }}
            >
              <Plus className={compact ? "h-3 w-3" : "h-4 w-4"} />
            </Button>
          ) : (
            <div className="flex items-center gap-1 bg-primary/10 rounded-full px-1">
              <Button 
                size="icon" 
                variant="ghost" 
                className={cn(
                  "rounded-full hover:bg-primary/20",
                  compact ? "h-6 w-6" : "h-7 w-7"
                )}
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
              >
                <Minus className={compact ? "h-2.5 w-2.5" : "h-3 w-3"} />
              </Button>
              <span className={cn(
                "font-bold text-center text-primary",
                compact ? "text-xs w-4" : "text-sm w-5"
              )}>{quantity}</span>
              <Button 
                size="icon" 
                className={cn(
                  "rounded-full",
                  compact ? "h-6 w-6" : "h-7 w-7"
                )}
                onClick={(e) => { e.stopPropagation(); onAdd(); }}
              >
                <Plus className={compact ? "h-2.5 w-2.5" : "h-3 w-3"} />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ProfessionalProductCard.displayName = 'ProfessionalProductCard';
