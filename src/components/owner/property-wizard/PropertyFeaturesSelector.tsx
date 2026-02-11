/**
 * PropertyFeaturesSelector — Reusable grid of tappable feature chips
 * Uses PROPERTY_CATEGORIES from the search ribbon as single source of truth
 */
import { memo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PROPERTY_CATEGORIES } from '@/components/property/PropertyCategoryIcons.ribbon';
import { Sparkles } from 'lucide-react';

interface PropertyFeaturesSelectorProps {
  highlights: string[];
  onChange: (highlights: string[]) => void;
  maxHighlights?: number;
  className?: string;
}

function PropertyFeaturesSelectorInner({
  highlights,
  onChange,
  maxHighlights = 6,
  className,
}: PropertyFeaturesSelectorProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const toggle = (id: string) => {
    if (highlights.includes(id)) {
      onChange(highlights.filter(h => h !== id));
    } else if (highlights.length < maxHighlights) {
      onChange([...highlights, id]);
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          {isRu ? 'Особенности объекта' : 'Property Features'}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {isRu
            ? `Выберите до ${maxHighlights} (${highlights.length}/${maxHighlights})`
            : `Select up to ${maxHighlights} (${highlights.length}/${maxHighlights})`}
        </p>
      </CardHeader>
      <CardContent>
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
                  'cursor-pointer gap-1.5 py-1.5 px-3 transition-all text-sm',
                  isDisabled && 'opacity-50 cursor-not-allowed',
                  isSelected && 'ring-2 ring-primary/20',
                )}
                onClick={() => !isDisabled && toggle(cat.id)}
              >
                <Icon className="w-3.5 h-3.5" />
                {isRu ? cat.labelRu : cat.labelEn}
              </Badge>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export const PropertyFeaturesSelector = memo(PropertyFeaturesSelectorInner);
