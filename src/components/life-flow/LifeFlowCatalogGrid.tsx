/**
 * LifeFlowCatalogGrid - Grouped catalog cards from catalog_life_map
 * Groups enriched items by entity_type, renders sections with horizontal scroll
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Star, Shield, Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getEntityType, getEntityTypePluralLabel } from '@/lib/config/entityTypes';
import { cn } from '@/lib/utils';
import type { EnrichedCatalogItem } from '@/hooks/useEnrichCatalogItems';

interface LifeFlowCatalogGridProps {
  items: EnrichedCatalogItem[];
  accentColor?: string;
}

interface GroupedSection {
  entityType: string;
  label: string;
  route: string;
  items: EnrichedCatalogItem[];
}

function CatalogCard({ item, index }: { item: EnrichedCatalogItem; index: number }) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const config = getEntityType(item.entity_type);

  const handleClick = () => {
    navigate(`${config.route}/${item.entity_id}`);
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={handleClick}
      className="w-[160px] shrink-0 text-left rounded-xl border border-border/60 overflow-hidden bg-card hover:shadow-sm active:scale-[0.98] transition-all touch-manipulation group"
    >
      {/* Cover */}
      <div className="relative h-24 overflow-hidden bg-muted">
        {item.coverImage ? (
          <img
            src={item.coverImage}
            alt={item.title_localized || item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <config.icon className="w-6 h-6 text-muted-foreground/30" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-1.5 left-1.5 flex gap-1">
          {item.isVerified && (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-background/90 text-[10px] font-medium">
              <Shield className="w-2.5 h-2.5 text-primary" />
            </span>
          )}
          {item.is24h && (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-background/90 text-[10px] font-medium">
              <Clock className="w-2.5 h-2.5" />
              24h
            </span>
          )}
        </div>

        {/* Rating */}
        {item.rating != null && item.rating > 0 && (
          <div className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-background/90 text-[10px] font-semibold">
            <Star className="w-2.5 h-2.5 text-warning fill-warning" />
            {item.rating.toFixed(1)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5 space-y-1">
        <p className="text-xs font-medium line-clamp-2 leading-tight">
          {item.title_localized || item.title}
        </p>
        <div className="flex items-center justify-between">
          {item.district && (
            <p className="text-[10px] text-muted-foreground truncate">{item.district}</p>
          )}
          {item.price != null && item.price > 0 && (
            <p className="text-[11px] font-semibold text-primary whitespace-nowrap">
              {item.currency} {item.price.toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </motion.button>
  );
}

export function LifeFlowCatalogGrid({ items, accentColor }: LifeFlowCatalogGridProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  // Filter out non-renderable entity types
  const HIDDEN_ENTITY_TYPES = new Set(['page', 'insurance', 'airport_service']);

  // Group items by entity_type, sorted by weight desc
  const sections: GroupedSection[] = React.useMemo(() => {
    if (!items?.length) return [];

    const grouped: Record<string, EnrichedCatalogItem[]> = {};
    for (const item of items) {
      if (HIDDEN_ENTITY_TYPES.has(item.entity_type)) continue;
      if (!grouped[item.entity_type]) grouped[item.entity_type] = [];
      grouped[item.entity_type].push(item);
    }

    // Sort groups: highest avg weight first
    return Object.entries(grouped)
      .map(([entityType, groupItems]) => {
        const config = getEntityType(entityType);
        return {
          entityType,
          label: getEntityTypePluralLabel(entityType, isRu ? 'ru' : 'en'),
          route: config.route,
          items: groupItems.sort((a, b) => b.weight - a.weight),
        };
      })
      .sort((a, b) => {
        const avgA = a.items.reduce((s, i) => s + i.weight, 0) / a.items.length;
        const avgB = b.items.reduce((s, i) => s + i.weight, 0) / b.items.length;
        return avgB - avgA;
      });
  }, [items, isRu]);

  if (!sections.length) return null;

  return (
    <div className="space-y-5">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {isRu ? 'Подобрано для вас' : 'Selected for you'}
      </p>

      {sections.map((section, sIdx) => (
        <motion.div
          key={section.entityType}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + sIdx * 0.05 }}
          className="space-y-2.5"
        >
          {/* Section header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{section.label}</h3>
            <button
              onClick={() => navigate(section.route)}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              {isRu ? 'Все' : 'All'}
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Horizontal scroll */}
          <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
            {section.items.slice(0, 8).map((item, i) => (
              <CatalogCard key={item.entity_id} item={item} index={i} />
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
