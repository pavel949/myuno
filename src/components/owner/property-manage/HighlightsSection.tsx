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
        {PROPERTY_FEATURE_GROUPS.map((group) => {
          const groupIds = group.features.map(f => f.id);
          const allSelected = groupIds.every(id => highlights.includes(id));
          const toggleAll = () => {
            if (allSelected) {
              onChange(highlights.filter(h => !groupIds.includes(h)));
            } else {
              onChange([...new Set([...highlights, ...groupIds])]);
            }
          };
          return (
            <div key={group.groupId}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {isRu ? group.labelRu : group.labelEn}
                </p>
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-[10px] font-medium text-primary hover:underline"
                >
                  {allSelected
                    ? (isRu ? 'Снять все' : 'Deselect all')
                    : (isRu ? 'Выбрать все' : 'Select all')}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {group.features.map((feat) => {
                  const Icon = feat.icon;
                  const isSelected = highlights.includes(feat.id);
                  return (
                    <Badge
                      key={feat.id}
                      variant={isSelected ? 'default' : 'outline'}
                      className={cn(
                        "cursor-pointer gap-1.5 py-1.5 px-2.5 transition-all text-xs",
                        isSelected && "ring-2 ring-primary/20"
                      )}
                      onClick={() => toggleHighlight(feat.id)}
                    >
                      <Icon className="w-3 h-3" />
                      {isRu ? feat.labelRu : feat.labelEn}
                    </Badge>
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default HighlightsSection;
