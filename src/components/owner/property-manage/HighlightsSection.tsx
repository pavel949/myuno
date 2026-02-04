/**
 * HighlightsSection - Property highlights editor for owners
 * Allows selecting up to 6 property highlights from lookup_values
 */

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { usePropertyQuickFilters, QuickFilter } from '@/hooks/usePropertyQuickFilters';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles } from 'lucide-react';

interface HighlightsSectionProps {
  highlights: string[];
  onChange: (highlights: string[]) => void;
  className?: string;
  maxHighlights?: number;
}

export function HighlightsSection({ 
  highlights, 
  onChange, 
  className,
  maxHighlights = 6 
}: HighlightsSectionProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { quickFilters, isLoading } = usePropertyQuickFilters();

  // Filter to only show highlight-type filters (not boolean or computed)
  const selectableHighlights = quickFilters.filter(
    f => f.type === 'highlight' || f.type === 'amenity'
  );

  const toggleHighlight = (id: string) => {
    if (highlights.includes(id)) {
      onChange(highlights.filter(h => h !== id));
    } else if (highlights.length < maxHighlights) {
      onChange([...highlights, id]);
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            {isRu ? 'Особенности объекта' : 'Property Highlights'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-8 w-24 rounded-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              {isRu ? 'Особенности объекта' : 'Property Highlights'}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {isRu 
                ? `Выберите до ${maxHighlights} ключевых особенностей (${highlights.length}/${maxHighlights})` 
                : `Select up to ${maxHighlights} key highlights (${highlights.length}/${maxHighlights})`}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Available Highlights */}
        <div className="flex flex-wrap gap-2">
          {selectableHighlights.map((highlight) => {
            const isSelected = highlights.includes(highlight.id);
            const isDisabled = !isSelected && highlights.length >= maxHighlights;
            
            return (
              <Badge
                key={highlight.id}
                variant={isSelected ? 'default' : 'outline'}
                className={cn(
                  "cursor-pointer gap-1.5 py-1.5 px-3 transition-all text-sm",
                  isDisabled && "opacity-50 cursor-not-allowed",
                  isSelected && "ring-2 ring-primary/20"
                )}
                onClick={() => !isDisabled && toggleHighlight(highlight.id)}
              >
                <span>{highlight.icon}</span>
                {isRu ? highlight.labelRu : highlight.labelEn}
              </Badge>
            );
          })}
        </div>

        {/* Selected Summary */}
        {highlights.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">
              {isRu ? 'Выбранные особенности:' : 'Selected highlights:'}
            </h4>
            <div className="flex flex-wrap gap-2">
              {highlights.map(id => {
                const highlight = quickFilters.find(h => h.id === id);
                if (!highlight) return null;
                
                return (
                  <Badge 
                    key={id} 
                    variant="secondary" 
                    className="gap-1.5 cursor-pointer hover:bg-destructive/10"
                    onClick={() => toggleHighlight(id)}
                  >
                    <span>{highlight.icon}</span>
                    {isRu ? highlight.labelRu : highlight.labelEn}
                    <span className="ml-1 text-muted-foreground">×</span>
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default HighlightsSection;
