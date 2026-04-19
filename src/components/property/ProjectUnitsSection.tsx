/**
 * ProjectUnitsSection - Horizontal carousel of available units in a project
 * Shows PropertyCards with price statistics
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Property } from '@/hooks/useProperties';
import { PUBLIC_CATALOG_APPROVAL_STATUS } from '@/lib/real-estate/canonicalModel';
import { APP_ROUTES } from '@/lib/config/routes';
import { cn } from '@/lib/utils';

interface ProjectUnitsSectionProps {
  projectId: string;
  projectName: string;
  className?: string;
}

interface PriceStats {
  studio: { min: number | null; count: number };
  oneBed: { min: number | null; count: number };
  twoBed: { min: number | null; count: number };
  threePlus: { min: number | null; count: number };
  total: number;
}

export function ProjectUnitsSection({
  projectId,
  projectName,
  className,
}: ProjectUnitsSectionProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const isRu = language === 'ru';

  const { data: properties, isLoading } = useQuery({
    queryKey: ['properties-by-project', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_active', true)
        .eq('approval_status', PUBLIC_CATALOG_APPROVAL_STATUS)
        .order('price', { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as Property[];
    },
    enabled: !!projectId,
  });

  // Calculate price statistics
  const stats: PriceStats = React.useMemo(() => {
    if (!properties) return {
      studio: { min: null, count: 0 },
      oneBed: { min: null, count: 0 },
      twoBed: { min: null, count: 0 },
      threePlus: { min: null, count: 0 },
      total: 0,
    };

    const result: PriceStats = {
      studio: { min: null, count: 0 },
      oneBed: { min: null, count: 0 },
      twoBed: { min: null, count: 0 },
      threePlus: { min: null, count: 0 },
      total: properties.length,
    };

    properties.forEach(p => {
      const price = p.price || 0;
      const beds = p.bedrooms || 0;

      if (beds === 0) {
        result.studio.count++;
        if (!result.studio.min || price < result.studio.min) result.studio.min = price;
      } else if (beds === 1) {
        result.oneBed.count++;
        if (!result.oneBed.min || price < result.oneBed.min) result.oneBed.min = price;
      } else if (beds === 2) {
        result.twoBed.count++;
        if (!result.twoBed.min || price < result.twoBed.min) result.twoBed.min = price;
      } else {
        result.threePlus.count++;
        if (!result.threePlus.min || price < result.threePlus.min) result.threePlus.min = price;
      }
    });

    return result;
  }, [properties]);

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="w-72 h-64 flex-shrink-0 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!properties || properties.length === 0) {
    return (
      <div className={cn("py-8 text-center", className)}>
        <Home className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground">
          {isRu ? 'Нет доступных объектов в этом комплексе' : 'No available units in this complex'}
        </p>
      </div>
    );
  }

  return (
    <section className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">
            {isRu ? 'Доступные объекты' : 'Available Units'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {stats.total} {isRu ? 'вариантов' : 'options'} {isRu ? 'в' : 'in'} {projectName}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/property?project=${projectId}`)}
          className="gap-1"
        >
          {isRu ? 'Все' : 'View all'}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Price statistics */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
        {stats.studio.count > 0 && (
          <PriceBadge
            label="Studio"
            count={stats.studio.count}
            minPrice={stats.studio.min}
            formatPriceFn={formatPrice}
            isRu={isRu}
          />
        )}
        {stats.oneBed.count > 0 && (
          <PriceBadge
            label="1 BR"
            count={stats.oneBed.count}
            minPrice={stats.oneBed.min}
            formatPriceFn={formatPrice}
            isRu={isRu}
          />
        )}
        {stats.twoBed.count > 0 && (
          <PriceBadge
            label="2 BR"
            count={stats.twoBed.count}
            minPrice={stats.twoBed.min}
            formatPriceFn={formatPrice}
            isRu={isRu}
          />
        )}
        {stats.threePlus.count > 0 && (
          <PriceBadge
            label="3+ BR"
            count={stats.threePlus.count}
            minPrice={stats.threePlus.min}
            formatPriceFn={formatPrice}
            isRu={isRu}
          />
        )}
      </div>

      {/* Properties carousel */}
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 snap-x snap-mandatory">
        {properties.slice(0, 10).map((property) => (
          <div key={property.id} className="w-72 flex-shrink-0 snap-start">
            <SimplePropertyCard property={property} isRu={isRu} formatPrice={formatPrice} />
          </div>
        ))}
        
        {properties.length > 10 && (
          <div 
            className="w-72 flex-shrink-0 snap-start flex items-center justify-center rounded-2xl border-2 border-dashed border-border cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => navigate(`/property?project=${projectId}`)}
          >
            <div className="text-center p-6">
              <p className="font-medium">
                +{properties.length - 10} {isRu ? 'ещё' : 'more'}
              </p>
              <p className="text-sm text-muted-foreground">
                {isRu ? 'Смотреть все' : 'View all'}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

interface PriceBadgeProps {
  label: string;
  count: number;
  minPrice: number | null;
  formatPriceFn: (priceInTHB: number, showSymbol?: boolean) => string;
  isRu: boolean;
}

function PriceBadge({ label, count, minPrice, formatPriceFn, isRu }: PriceBadgeProps) {
  return (
    <div className="flex-shrink-0 px-4 py-2 rounded-xl bg-primary/5 border border-primary/20">
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs text-muted-foreground">
        {count} {isRu ? 'шт' : 'units'} • {isRu ? 'от' : 'from'} {minPrice ? formatPriceFn(minPrice) : '—'}
      </p>
    </div>
  );
}

// Simple property card for the carousel (inline to avoid complex type imports)
interface SimplePropertyCardProps {
  property: Property;
  isRu: boolean;
  formatPrice: (priceInTHB: number, showSymbol?: boolean) => string;
}

function SimplePropertyCard({ property, isRu, formatPrice }: SimplePropertyCardProps) {
  const navigate = useNavigate();
  const title = isRu ? property.title_ru : property.title_en;

  return (
    <div
      onClick={() => navigate(APP_ROUTES.PROPERTY_DETAIL(property.id))}
      className="overflow-hidden rounded-2xl bg-card border border-border cursor-pointer hover:border-primary/50 hover:shadow-lg transition-all group"
    >
      <AspectRatio ratio={4 / 3}>
        {property.cover_image ? (
          <img
            src={property.cover_image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Home className="h-8 w-8 text-muted-foreground/30" />
          </div>
        )}
        {property.is_featured && (
          <Badge className="absolute top-2 left-2 bg-warning text-warning-foreground border-none text-xs">
            Featured
          </Badge>
        )}
      </AspectRatio>
      <div className="p-3 space-y-1">
        <h4 className="font-medium text-sm line-clamp-1">{title}</h4>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {property.bedrooms !== undefined && property.bedrooms !== null && (
            <span>{property.bedrooms === 0 ? 'Studio' : `${property.bedrooms} BR`}</span>
          )}
          {property.area_sqm && <span>• {property.area_sqm} m²</span>}
        </div>
        {property.price && (
          <p className="font-semibold text-primary">
            {formatPrice(property.price)}
            {property.price_period && (
              <span className="text-xs font-normal text-muted-foreground">
                /{property.price_period === 'night' ? (isRu ? 'ночь' : 'night') : property.price_period}
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}

export default ProjectUnitsSection;
