import { useLanguage } from '@/contexts/LanguageContext';
import { OwnerProperty } from '@/hooks/usePropertyCare';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Building, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickPropertySelectorProps {
  properties: OwnerProperty[];
  selectedId: string;
  onSelect: (id: string) => void;
  isLoading?: boolean;
}

export function QuickPropertySelector({
  properties,
  selectedId,
  onSelect,
  isLoading
}: QuickPropertySelectorProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="w-32 h-28 rounded-xl shrink-0" />
        ))}
      </div>
    );
  }

  if (!properties.length) {
    return (
      <Card className="p-4 text-center text-muted-foreground">
        <Building className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">{isRu ? 'Нет объектов' : 'No properties'}</p>
      </Card>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
      {properties.map((property) => {
        const isSelected = selectedId === property.id;
        const title = isRu && property.title_ru ? property.title_ru : property.title;
        const coverImage = property.cover_image || property.images?.[0];

        return (
          <button
            key={property.id}
            type="button"
            onClick={() => onSelect(property.id)}
            className={cn(
              'relative w-32 h-28 rounded-xl overflow-hidden shrink-0 transition-all',
              'border-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              isSelected ? 'border-primary shadow-lg' : 'border-transparent'
            )}
          >
            {/* Background Image or Gradient */}
            {coverImage ? (
              <img
                src={coverImage}
                alt={title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Building className="h-8 w-8 text-primary/50" />
              </div>
            )}

            {/* Overlay */}
            <div className={cn(
              'absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent',
              isSelected && 'from-primary/80 via-primary/30'
            )} />

            {/* Selected Indicator */}
            {isSelected && (
              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <Check className="h-4 w-4 text-primary-foreground" />
              </div>
            )}

            {/* Title */}
            <div className="absolute bottom-0 left-0 right-0 p-2">
              <p className="text-white text-xs font-medium line-clamp-2 text-left">
                {title}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
