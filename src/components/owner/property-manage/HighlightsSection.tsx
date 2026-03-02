/**
 * HighlightsSection - Property highlights editor for owners
 * Uses comprehensive taxonomy from propertyFeatures.ts
 */

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PROPERTY_FEATURE_GROUPS, PROPERTY_FEATURE_MAP } from '@/lib/config/propertyFeatures';
import { Sparkles } from 'lucide-react';

interface HighlightsSectionProps {
  highlights: string[];
  onChange: (highlights: string[]) => void;
  className?: string;
}

export function HighlightsSection({ 
  highlights, 
  onChange, 
  className,
}: HighlightsSectionProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const toggleHighlight = (id: string) => {
    if (highlights.includes(id)) {
      onChange(highlights.filter(h => h !== id));
    } else {
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
                ? `Выбрано: ${highlights.length}` 
                : `Selected: ${highlights.length}`}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selected Summary */}
        {highlights.length > 0 && (
          <div className="pb-3 border-b">
            <h4 className="text-sm font-medium mb-2">
              {isRu ? 'Выбранные особенности:' : 'Selected highlights:'}
            </h4>
            <div className="flex flex-wrap gap-2">
              {highlights.map(id => {
                const feat = PROPERTY_FEATURE_MAP.get(id);
                if (!feat) return null;
                const Icon = feat.icon;
                
                return (
                  <Badge 
                    key={id} 
                    variant="secondary" 
                    className="gap-1.5 cursor-pointer hover:bg-destructive/10"
                    onClick={() => toggleHighlight(id)}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {isRu ? feat.labelRu : feat.labelEn}
                    <span className="ml-1 text-muted-foreground">×</span>
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Grouped features */}
        {PROPERTY_FEATURE_GROUPS.map((group) => (
          <div key={group.groupId}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              {isRu ? group.labelRu : group.labelEn}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {group.features.map((feat) => {
                const Icon = feat.icon;
                const isSelected = highlights.includes(feat.id);
                const isDisabled = false;
                
                return (
                  <Badge
                    key={feat.id}
                    variant={isSelected ? 'default' : 'outline'}
                    className={cn(
                      "cursor-pointer gap-1.5 py-1.5 px-2.5 transition-all text-xs",
                      isDisabled && "opacity-40 cursor-not-allowed",
                      isSelected && "ring-2 ring-primary/20"
                    )}
                    onClick={() => !isDisabled && toggleHighlight(feat.id)}
                  >
                    <Icon className="w-3 h-3" />
                    {isRu ? feat.labelRu : feat.labelEn}
                  </Badge>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default HighlightsSection;
