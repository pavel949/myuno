import { useLanguage } from '@/contexts/LanguageContext';
import { useDashboardFilter } from '@/contexts/DashboardFilterContext';
import { useMyProperties } from '@/hooks/useMyProperties';
import { Building2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

export function DashboardPropertyFilter() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { selectedPropertyId, setSelectedPropertyId } = useDashboardFilter();
  const { allProperties, isLoading } = useMyProperties();

  if (isLoading || allProperties.length <= 1) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 px-1">
        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">
          {isRu ? 'Фильтр по объекту' : 'Filter by property'}
        </span>
        {selectedPropertyId && (
          <button
            onClick={() => setSelectedPropertyId(null)}
            className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3 w-3" />
            {isRu ? 'Сбросить' : 'Clear'}
          </button>
        )}
      </div>
      <ScrollArea className="w-full">
        <div className="flex gap-1.5 pb-1">
          <button
            onClick={() => setSelectedPropertyId(null)}
            className={cn(
              'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
              !selectedPropertyId
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card border-border text-muted-foreground hover:border-primary/50'
            )}
          >
            {isRu ? 'Все' : 'All'}
            <Badge variant="secondary" className="ml-1.5 text-[10px] px-1 py-0">
              {allProperties.length}
            </Badge>
          </button>
          {allProperties.map((property) => {
            const isSelected = selectedPropertyId === property.property_id;
            const title = isRu ? property.title_ru : property.title;
            return (
              <button
                key={property.property_id}
                onClick={() => setSelectedPropertyId(isSelected ? null : property.property_id)}
                className={cn(
                  'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-border text-foreground hover:border-primary/50'
                )}
              >
                {property.cover_image ? (
                  <img
                    src={property.cover_image}
                    alt={title}
                    className="w-4 h-4 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center">
                    <Building2 className="h-2.5 w-2.5 text-muted-foreground" />
                  </div>
                )}
                <span className="truncate max-w-[100px]">{title}</span>
              </button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
