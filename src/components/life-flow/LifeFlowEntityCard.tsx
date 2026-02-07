/**
 * LifeFlowEntityCard - Rich card with photo, badges, rating
 * Replaces generic icon+weight cards
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { getEntityType } from '@/lib/config/entityTypes';
import { Shield, Star, Award, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import type { EnrichedCatalogItem } from '@/hooks/useEnrichCatalogItems';

interface LifeFlowEntityCardProps {
  item: EnrichedCatalogItem;
  isPrimary: boolean;
  index: number;
}

function WeightBadge({ weight, isVerified }: { weight: number; isVerified: boolean }) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  if (weight >= 85) {
    return (
      <Badge variant="gold" className="text-[10px] px-1.5 py-0.5 gap-1">
        <Award className="w-2.5 h-2.5" />
        {isRu ? 'Топ' : 'Top Pick'}
      </Badge>
    );
  }
  if (weight >= 70) {
    return (
      <Badge variant="default" className="text-[10px] px-1.5 py-0.5 gap-1 bg-primary/10 text-primary border border-primary/20">
        <Star className="w-2.5 h-2.5" />
        {isRu ? 'Рекомендуем' : 'Recommended'}
      </Badge>
    );
  }
  if (isVerified) {
    return (
      <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 gap-1 bg-primary/5 text-primary border-primary/20">
        <Shield className="w-2.5 h-2.5" />
        {isRu ? 'Проверено' : 'Verified'}
      </Badge>
    );
  }
  return null;
}

export function LifeFlowEntityCard({ item, isPrimary, index }: LifeFlowEntityCardProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const entityConfig = getEntityType(item.entity_type);
  const EntityIcon = entityConfig.icon;

  const handleClick = () => {
    navigate(`${entityConfig.route}/${item.entity_id}`);
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={handleClick}
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card text-left transition-all duration-200 w-full",
        "hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5",
      )}
    >
      {/* Cover image or fallback */}
      <div className={cn(
        "relative overflow-hidden bg-muted",
        isPrimary ? "h-32" : "h-24"
      )}>
        {item.coverImage ? (
          <img
            src={item.coverImage}
            alt={item.title_localized || item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <EntityIcon className="w-8 h-8 text-muted-foreground/40" />
          </div>
        )}
        
        {/* Overlay badges */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          <WeightBadge weight={item.weight} isVerified={item.isVerified} />
          {item.is24h && (
            <Badge variant="success" className="text-[10px] px-1.5 py-0.5 gap-1">
              <Clock className="w-2.5 h-2.5" />
              24h
            </Badge>
          )}
        </div>

        {/* Rating pill */}
        {item.rating && item.rating > 0 && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-background/90 backdrop-blur-sm text-xs font-semibold">
            <Star className="w-3 h-3 text-warning fill-warning" />
            {item.rating.toFixed(1)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className={cn("p-3", isPrimary ? "space-y-1.5" : "space-y-1")}>
        <p className={cn(
          "font-medium line-clamp-2 leading-tight",
          isPrimary ? "text-sm" : "text-xs"
        )}>
          {item.title_localized || item.title}
        </p>

        <div className="flex items-center justify-between">
          {item.district && (
            <p className="text-[11px] text-muted-foreground truncate">
              {item.district}
            </p>
          )}
          {item.price && item.price > 0 && (
            <p className={cn(
              "font-semibold text-primary whitespace-nowrap",
              isPrimary ? "text-sm" : "text-xs"
            )}>
              {item.currency} {item.price.toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </motion.button>
  );
}
