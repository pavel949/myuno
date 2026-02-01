import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Waves, Sunrise, TreePine, Mountain, Building2, 
  Sparkles, Wifi, Car, Utensils, Dumbbell,
  ShieldCheck, Baby, Dog, Accessibility, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PROPERTY_HIGHLIGHTS } from '@/lib/propertyTaxonomy';
import type { LucideIcon } from 'lucide-react';

interface PropertyHighlightsProps {
  highlights: string[];
  onChange: (highlights: string[]) => void;
  className?: string;
}

// Map taxonomy icons to Lucide components
const iconMap: Record<string, LucideIcon> = {
  beach_close: Waves,
  beachfront: Waves,
  city_center: Building2,
  sea_view: Waves,
  ocean_view: Sunrise,
  amazing_view: Sunrise,
  mountain_view: Mountain,
  private_pool: Waves,
  infinity_pool: Waves,
  fast_wifi: Wifi,
  luxury: Sparkles,
  superhost: ShieldCheck,
  verified: ShieldCheck,
  instant_book: Clock,
  family_friendly: Baby,
  pet_friendly: Dog,
  accessible: Accessibility,
  parking: Car,
  full_kitchen: Utensils,
  gym: Dumbbell,
  garden: TreePine,
};

// Convert taxonomy to legacy format for editor
const highlightOptions = PROPERTY_HIGHLIGHTS.map(h => ({
  value: h.id,
  labelEn: h.labelEn,
  labelRu: h.labelRu,
  icon: iconMap[h.id] || Sparkles,
  category: h.category,
}));

const categories = [
  { value: 'location', labelEn: 'Location', labelRu: 'Расположение' },
  { value: 'view', labelEn: 'Views', labelRu: 'Виды' },
  { value: 'amenity', labelEn: 'Amenities', labelRu: 'Удобства' },
  { value: 'trust', labelEn: 'Trust & Safety', labelRu: 'Доверие' },
];

export function PropertyHighlights({ highlights, onChange, className }: PropertyHighlightsProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const toggleHighlight = (value: string) => {
    if (highlights.includes(value)) {
      onChange(highlights.filter(h => h !== value));
    } else {
      // Limit to 6 highlights
      if (highlights.length < 6) {
        onChange([...highlights, value]);
      }
    }
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">
              {isRu ? 'Особенности объекта' : 'Property Highlights'}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {isRu 
                ? `Выберите до 6 ключевых особенностей (${highlights.length}/6)` 
                : `Select up to 6 key highlights (${highlights.length}/6)`}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {categories.map(category => {
          const categoryHighlights = highlightOptions.filter(h => h.category === category.value);
          
          return (
            <div key={category.value}>
              <h4 className="text-sm font-medium mb-3">
                {isRu ? category.labelRu : category.labelEn}
              </h4>
              <div className="flex flex-wrap gap-2">
                {categoryHighlights.map(highlight => {
                  const Icon = highlight.icon;
                  const isSelected = highlights.includes(highlight.value);
                  const isDisabled = !isSelected && highlights.length >= 6;
                  
                  return (
                    <Badge
                      key={highlight.value}
                      variant={isSelected ? 'default' : 'outline'}
                      className={cn(
                        "cursor-pointer gap-1.5 py-1.5 px-3 transition-all",
                        isDisabled && "opacity-50 cursor-not-allowed",
                        isSelected && "ring-2 ring-primary/20"
                      )}
                      onClick={() => !isDisabled && toggleHighlight(highlight.value)}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {isRu ? highlight.labelRu : highlight.labelEn}
                    </Badge>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Selected Summary */}
        {highlights.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">
              {isRu ? 'Выбранные особенности:' : 'Selected highlights:'}
            </h4>
            <div className="flex flex-wrap gap-2">
              {highlights.map(value => {
                const highlight = highlightOptions.find(h => h.value === value);
                if (!highlight) return null;
                const Icon = highlight.icon;
                
                return (
                  <Badge key={value} variant="secondary" className="gap-1.5">
                    <Icon className="h-3.5 w-3.5" />
                    {isRu ? highlight.labelRu : highlight.labelEn}
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
