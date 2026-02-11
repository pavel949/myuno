/**
 * HighlightsSection - Property highlights editor for owners
 * Uses PROPERTY_CATEGORIES from search ribbon as single source of truth
 */

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PROPERTY_CATEGORIES } from '@/components/property/PropertyCategoryIcons.ribbon';
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

  const toggleHighlight = (id: string) => {
    if (highlights.includes(id)) {
      onChange(highlights.filter(h => h !== id));
    } else if (highlights.length < maxHighlights) {
      onChange([...highlights, id]);
    }
  };

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
          {PROPERTY_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = highlights.includes(cat.id);
            const isDisabled = !isSelected && highlights.length >= maxHighlights;
            
            return (
              <Badge
                key={cat.id}
                variant={isSelected ? 'default' : 'outline'}
                className={cn(
                  "cursor-pointer gap-1.5 py-1.5 px-3 transition-all text-sm",
                  isDisabled && "opacity-50 cursor-not-allowed",
                  isSelected && "ring-2 ring-primary/20"
                )}
                onClick={() => !isDisabled && toggleHighlight(cat.id)}
              >
                <Icon className="w-3.5 h-3.5" />
                {isRu ? cat.labelRu : cat.labelEn}
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
                const cat = PROPERTY_CATEGORIES.find(c => c.id === id);
                if (!cat) return null;
                const Icon = cat.icon;
                
                return (
                  <Badge 
                    key={id} 
                    variant="secondary" 
                    className="gap-1.5 cursor-pointer hover:bg-destructive/10"
                    onClick={() => toggleHighlight(id)}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {isRu ? cat.labelRu : cat.labelEn}
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
