/**
 * PropertyFeaturesSelector — Grouped feature chips for property wizard
 * Uses comprehensive taxonomy from propertyFeatures.ts
 */
import { memo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PROPERTY_FEATURE_GROUPS } from '@/lib/config/propertyFeatures';
import { Sparkles } from 'lucide-react';

interface PropertyFeaturesSelectorProps {
  highlights: string[];
  onChange: (highlights: string[]) => void;
  className?: string;
}

function PropertyFeaturesSelectorInner({
  highlights,
  onChange,
  className,
}: PropertyFeaturesSelectorProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const toggle = (id: string) => {
    if (highlights.includes(id)) {
      onChange(highlights.filter(h => h !== id));
    } else {
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
            ? `Выбрано: ${highlights.length}`
            : `Selected: ${highlights.length}`}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
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
                      'cursor-pointer gap-1.5 py-1.5 px-2.5 transition-all text-xs',
                      isDisabled && 'opacity-40 cursor-not-allowed',
                      isSelected && 'ring-2 ring-primary/20',
                    )}
                    onClick={() => !isDisabled && toggle(feat.id)}
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

export const PropertyFeaturesSelector = memo(PropertyFeaturesSelectorInner);
