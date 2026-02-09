/**
 * RouteRecommendedBlock - The ONE recommended path + max 2 alternatives
 * Takes responsibility for the recommendation. Calm, decisive.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { EnrichedCatalogItem } from '@/hooks/useEnrichCatalogItems';
import { getEntityType } from '@/lib/config/entityTypes';
import { useLanguage } from '@/contexts/LanguageContext';

interface RouteRecommendedBlockProps {
  title: string;
  why: string;
  ctaText: string;
  ctaType: string;
  ctaTarget: string | null;
  accentColor?: string;
  /** The recommended entity card (enriched), if available */
  recommendedItem?: EnrichedCatalogItem | null;
  /** Max 2 alternative entity cards */
  alternatives?: EnrichedCatalogItem[];
  alternativesLabel?: string;
}

export function RouteRecommendedBlock({
  title, why, ctaText, ctaType, ctaTarget, accentColor,
  recommendedItem, alternatives = [], alternativesLabel,
}: RouteRecommendedBlockProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const handleCta = () => {
    if (ctaType === 'phone' && ctaTarget) {
      window.location.href = ctaTarget;
    } else if (ctaType === 'navigate' && ctaTarget) {
      navigate(ctaTarget);
    } else if (recommendedItem) {
      const config = getEntityType(recommendedItem.entity_type);
      navigate(`${config.route}/${recommendedItem.entity_id}`);
    }
  };

  const handleAlternativeClick = (item: EnrichedCatalogItem) => {
    const config = getEntityType(item.entity_type);
    navigate(`${config.route}/${item.entity_id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="space-y-4"
    >
      {/* Section label */}
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {isRu ? 'Наша рекомендация' : 'Our recommendation'}
      </p>

      {/* Primary recommendation card — large, prominent */}
      <button
        onClick={handleCta}
        className={cn(
          "w-full text-left rounded-2xl border-2 overflow-hidden transition-all duration-200",
          "hover:shadow-lg hover:-translate-y-0.5 group"
        )}
        style={{ borderColor: accentColor ? `${accentColor}40` : 'hsl(var(--primary) / 0.25)' }}
      >
        {/* Cover image if available */}
        {recommendedItem?.coverImage && (
          <div className="relative h-40 overflow-hidden">
            <img
              src={recommendedItem.coverImage}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            {/* Trust badge */}
            <div className="absolute top-3 left-3">
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-background/90 backdrop-blur-sm text-xs font-semibold">
                <Shield className="w-3 h-3 text-primary" />
                {isRu ? 'Рекомендация UNO' : 'UNO Pick'}
              </div>
            </div>
            {/* Rating */}
            {recommendedItem.rating && recommendedItem.rating > 0 && (
              <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-background/90 backdrop-blur-sm text-xs font-semibold">
                <Star className="w-3 h-3 text-warning fill-warning" />
                {recommendedItem.rating.toFixed(1)}
              </div>
            )}
          </div>
        )}
        
        <div className="p-4 space-y-2">
          <h3 className="text-[15px] font-bold leading-tight">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{why}</p>
          
          {/* Price if available */}
          {recommendedItem?.price && recommendedItem.price > 0 && (
            <p className="text-sm font-semibold text-primary">
              {recommendedItem.currency} {recommendedItem.price.toLocaleString()}
            </p>
          )}

          <Button 
            className="w-full mt-2 gap-2"
            style={{ 
              backgroundColor: accentColor || undefined,
            }}
          >
            {ctaText}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </button>

      {/* Alternatives — max 2, small cards */}
      {alternatives.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-xs font-medium text-muted-foreground">
            {alternativesLabel || (isRu ? 'Или рассмотрите:' : 'Or consider:')}
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {alternatives.slice(0, 2).map((item) => {
              const config = getEntityType(item.entity_type);
              return (
                <button
                  key={item.entity_id}
                  onClick={() => handleAlternativeClick(item)}
                  className={cn(
                    "text-left rounded-xl border overflow-hidden transition-all duration-200",
                    "hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 group"
                  )}
                >
                  {item.coverImage && (
                    <div className="h-20 overflow-hidden">
                      <img
                        src={item.coverImage}
                        alt={item.title_localized || item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="p-2.5 space-y-1">
                    <p className="text-xs font-medium line-clamp-2 leading-tight">
                      {item.title_localized || item.title}
                    </p>
                    {item.price && item.price > 0 && (
                      <p className="text-[11px] font-semibold text-primary">
                        {item.currency} {item.price.toLocaleString()}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
