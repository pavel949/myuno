import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { 
  PROPERTY_HIGHLIGHTS
} from '@/lib/propertyTaxonomy';
import { cn } from '@/lib/utils';

interface PropertyHighlightsDisplayProps {
  highlights?: string[];
  className?: string;
  variant?: 'chips' | 'compact';
  maxItems?: number;
}

/**
 * Display-only component for showing property highlights on detail pages and cards
 */
export function PropertyHighlightsDisplay({ 
  highlights, 
  className, 
  variant = 'chips',
  maxItems 
}: PropertyHighlightsDisplayProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  if (!highlights || highlights.length === 0) return null;

  const displayHighlights = maxItems ? highlights.slice(0, maxItems) : highlights;
  const remaining = highlights.length - displayHighlights.length;

  if (variant === 'compact') {
    return (
      <div className={cn("flex flex-wrap gap-1", className)}>
        {displayHighlights.map(id => {
          const highlight = PROPERTY_HIGHLIGHTS.find(h => h.id === id);
          if (!highlight) return null;
          
          return (
            <Badge 
              key={id} 
              variant="secondary" 
              className="text-[10px] py-0.5 px-1.5 bg-background/80 backdrop-blur-sm"
            >
              {highlight.icon} {isRu ? highlight.labelRu : highlight.labelEn}
            </Badge>
          );
        })}
        {remaining > 0 && (
          <Badge variant="outline" className="text-[10px] py-0.5 px-1.5">
            +{remaining}
          </Badge>
        )}
      </div>
    );
  }

  // Default: chips
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {displayHighlights.map(id => {
        const highlight = PROPERTY_HIGHLIGHTS.find(h => h.id === id);
        if (!highlight) return null;
        
        return (
          <Badge 
            key={id} 
            variant="outline" 
            className="text-xs py-1 px-2"
          >
            {highlight.icon} {isRu ? highlight.labelRu : highlight.labelEn}
          </Badge>
        );
      })}
      {remaining > 0 && (
        <Badge variant="secondary" className="text-xs py-1 px-2">
          +{remaining}
        </Badge>
      )}
    </div>
  );
}
