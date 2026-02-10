import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { Home } from 'lucide-react';
import type { PropertyReference } from '@/types/property';

interface PropertyThumbnailSelectorProps {
  properties: PropertyReference[];
  selectedId: string;
  onSelect: (id: string) => void;
  isLoading?: boolean;
}

export function PropertyThumbnailSelector({
  properties,
  selectedId,
  onSelect,
  isLoading,
}: PropertyThumbnailSelectorProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  if (isLoading) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="flex-shrink-0 w-24 h-20 rounded-xl bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!properties?.length) {
    return (
      <div className="flex items-center justify-center h-20 text-muted-foreground text-sm">
        <Home className="h-4 w-4 mr-2" />
        {isRu ? 'Нет объектов' : 'No properties'}
      </div>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {properties.map(property => {
        const isSelected = selectedId === property.id;
        const title = isRu && property.title_ru ? property.title_ru : (property.title || '');
        
        return (
          <button
            key={property.id}
            onClick={() => onSelect(property.id)}
            className={cn(
              "flex-shrink-0 p-2 rounded-xl border-2 transition-all",
              "hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30",
              isSelected 
                ? "border-primary bg-primary/10 ring-2 ring-primary/20" 
                : "border-border bg-card"
            )}
          >
            {property.cover_image ? (
              <img 
                src={property.cover_image} 
                alt={title}
                className="w-20 h-12 rounded-lg object-cover"
              />
            ) : (
              <div className="w-20 h-12 rounded-lg bg-muted flex items-center justify-center">
                <Home className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <p className="text-xs font-medium mt-1.5 truncate max-w-[80px] text-center">
              {title}
            </p>
          </button>
        );
      })}
    </div>
  );
}
