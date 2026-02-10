import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { ItemCondition, CONDITION_LABELS } from '@/types/userListing';
import { Search, X } from 'lucide-react';

interface ClassifiedFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCondition?: ItemCondition;
  onConditionChange: (condition?: ItemCondition) => void;
}

const CONDITIONS: ItemCondition[] = ['new', 'like_new', 'good', 'fair', 'for_parts'];

export function ClassifiedFilters({
  searchQuery,
  onSearchChange,
  selectedCondition,
  onConditionChange,
}: ClassifiedFiltersProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <div className="space-y-3 mt-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={isRu ? 'Найти товар...' : 'Search items...'}
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className="pl-9 pr-8 h-10 bg-muted/30"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Condition chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        <button
          onClick={() => onConditionChange(undefined)}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            !selectedCondition
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          {isRu ? 'Любое' : 'Any'}
        </button>
        {CONDITIONS.map(c => (
          <button
            key={c}
            onClick={() => onConditionChange(selectedCondition === c ? undefined : c)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedCondition === c
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {CONDITION_LABELS[c][isRu ? 'ru' : 'en']}
          </button>
        ))}
      </div>
    </div>
  );
}
