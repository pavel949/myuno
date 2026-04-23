/**
 * CategorySelector — Hierarchical sector → domain → category picker
 * 
 * UX: Two-level tabs. First select a sector (vertical), then pick specific category.
 * Home Services sector drills into domains (Repair, Cleaning, etc.) with sub-categories.
 */
import React, { useState, useMemo } from 'react';
import { Check, ChevronRight, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useLanguage } from '@/contexts/LanguageContext';
import { ALL_SERVICE_CATEGORIES, SERVICE_DOMAINS } from '@/lib/taxonomies';

// ====== Canonical Sector definitions ======
export interface Sector {
  id: string;
  labelEn: string;
  labelRu: string;
  icon: string;
  categories: CategoryItem[];
  /** If true, categories are grouped by domain */
  hasDomains?: boolean;
}

interface CategoryItem {
  id: string;
  labelEn: string;
  labelRu: string;
  icon: string;
  domain?: string;
  domainLabelEn?: string;
  domainLabelRu?: string;
}

// General business categories (non-home-services)
const GENERAL_CATEGORIES = [
  { id: 'beauty', labelEn: 'Beauty & Spa', labelRu: 'Красота и спа', icon: '💆' },
  { id: 'food', labelEn: 'Food & Restaurants', labelRu: 'Еда и рестораны', icon: '🍽️' },
  { id: 'transport', labelEn: 'Transport', labelRu: 'Транспорт', icon: '🚗' },
  { id: 'medical', labelEn: 'Medical', labelRu: 'Медицина', icon: '🏥' },
  { id: 'fitness', labelEn: 'Fitness', labelRu: 'Фитнес', icon: '🏋️' },
  { id: 'education', labelEn: 'Education', labelRu: 'Образование', icon: '📚' },
  { id: 'tours', labelEn: 'Tours & Excursions', labelRu: 'Туры и экскурсии', icon: '🗺️' },
  { id: 'water', labelEn: 'Water Activities', labelRu: 'Водные развлечения', icon: '🌊' },
  { id: 'property', labelEn: 'Property', labelRu: 'Недвижимость', icon: '🏠' },
  { id: 'legal', labelEn: 'Legal Services', labelRu: 'Юридические услуги', icon: '⚖️' },
  { id: 'pets', labelEn: 'Pet Services', labelRu: 'Услуги для питомцев', icon: '🐕' },
  { id: 'events', labelEn: 'Events', labelRu: 'Мероприятия', icon: '🎉' },
  { id: 'yachts', labelEn: 'Boat Charters', labelRu: 'Чартер', icon: '⛵' },
  { id: 'flowers', labelEn: 'Flowers', labelRu: 'Цветы', icon: '💐' },
  { id: 'insurance', labelEn: 'Insurance', labelRu: 'Страхование', icon: '🛡️' },
];

// Build sectors
const HOME_SERVICES_CATEGORIES: CategoryItem[] = SERVICE_DOMAINS.flatMap(d =>
  d.categories.map(cat => ({
    id: cat.id,
    labelEn: cat.labelEn,
    labelRu: cat.labelRu,
    icon: cat.icon,
    domain: d.id,
    domainLabelEn: d.labelEn,
    domainLabelRu: d.labelRu,
  }))
);

const SECTORS: Sector[] = [
  {
    id: 'home_services',
    labelEn: 'Home Services',
    labelRu: 'Домашние услуги',
    icon: '🏠',
    hasDomains: true,
    categories: HOME_SERVICES_CATEGORIES,
  },
  {
    id: 'lifestyle',
    labelEn: 'Lifestyle',
    labelRu: 'Лайфстайл',
    icon: '✨',
    categories: GENERAL_CATEGORIES.filter(c => 
      ['beauty', 'fitness', 'food', 'events', 'flowers'].includes(c.id)
    ),
  },
  {
    id: 'travel',
    labelEn: 'Travel & Activities',
    labelRu: 'Путешествия',
    icon: '✈️',
    categories: GENERAL_CATEGORIES.filter(c => 
      ['tours', 'water', 'yachts', 'transport'].includes(c.id)
    ),
  },
  {
    id: 'living',
    labelEn: 'Living & Property',
    labelRu: 'Жизнь и недвижимость',
    icon: '🏡',
    categories: GENERAL_CATEGORIES.filter(c => 
      ['property', 'legal', 'insurance', 'education'].includes(c.id)
    ),
  },
  {
    id: 'other',
    labelEn: 'Other',
    labelRu: 'Другое',
    icon: '📦',
    categories: GENERAL_CATEGORIES.filter(c => 
      ['medical', 'pets'].includes(c.id)
    ),
  },
];

// Flatten all for lookup
const ALL_FLAT: CategoryItem[] = [
  ...HOME_SERVICES_CATEGORIES,
  ...GENERAL_CATEGORIES,
];

// ====== Component ======
interface CategorySelectorProps {
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  placeholder?: string;
  className?: string;
}

export function CategorySelector({
  value,
  onChange,
  multiple = false,
  placeholder,
  className,
}: CategorySelectorProps) {
  const [open, setOpen] = useState(false);
  const [activeSector, setActiveSector] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const selectedValues = Array.isArray(value) ? value : value ? [value] : [];

  // Find which sector the current value belongs to (for auto-expand)
  const autoSector = useMemo(() => {
    if (activeSector) return activeSector;
    if (selectedValues.length > 0) {
      const v = selectedValues[0];
      for (const s of SECTORS) {
        if (s.categories.some(c => c.id === v)) return s.id;
      }
    }
    return null;
  }, [activeSector, selectedValues]);

  // Search filtering
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return ALL_FLAT.filter(c =>
      c.labelEn.toLowerCase().includes(q) ||
      c.labelRu.toLowerCase().includes(q) ||
      c.id.includes(q)
    );
  }, [searchQuery]);

  const handleSelect = (categoryId: string) => {
    if (multiple) {
      const newValues = selectedValues.includes(categoryId)
        ? selectedValues.filter(v => v !== categoryId)
        : [...selectedValues, categoryId];
      onChange(newValues);
    } else {
      onChange(categoryId);
      setOpen(false);
    }
  };

  const getDisplayValue = () => {
    if (selectedValues.length === 0) {
      return placeholder || (isRu ? 'Выберите категорию...' : 'Select category...');
    }
    if (multiple && selectedValues.length > 2) {
      return isRu
        ? `${selectedValues.length} категорий выбрано`
        : `${selectedValues.length} categories selected`;
    }
    return selectedValues
      .map(v => {
        const cat = ALL_FLAT.find(c => c.id === v);
        return cat ? `${cat.icon} ${isRu ? cat.labelRu : cat.labelEn}`.trim() : v;
      })
      .join(', ');
  };

  const currentSector = SECTORS.find(s => s.id === autoSector);

  // Group categories by domain within a sector
  const domainGroups = useMemo(() => {
    if (!currentSector?.hasDomains) return null;
    const groups = new Map<string, { labelEn: string; labelRu: string; icon: string; items: CategoryItem[] }>();
    for (const d of SERVICE_DOMAINS) {
      groups.set(d.id, {
        labelEn: d.labelEn,
        labelRu: d.labelRu,
        icon: d.icon,
        items: currentSector.categories.filter(c => c.domain === d.id),
      });
    }
    return groups;
  }, [currentSector]);

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSearchQuery(''); }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between font-normal h-auto min-h-10 py-2', className)}
        >
          <span className="truncate text-left">{getDisplayValue()}</span>
          <ChevronRight className={cn("ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform", open && "rotate-90")} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[420px] p-0"
        align="start"
        side="bottom"
        sideOffset={4}
      >
        {/* Search */}
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder={isRu ? 'Быстрый поиск...' : 'Quick search...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-sm"
            />
          </div>
        </div>

        {/* Search results mode */}
        {searchResults ? (
          <ScrollArea className="max-h-[320px]">
            <div className="p-1">
              {searchResults.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  {isRu ? 'Ничего не найдено' : 'No results'}
                </p>
              ) : (
                searchResults.map(cat => (
                  <CategoryRow
                    key={cat.id}
                    category={cat}
                    isRu={isRu}
                    isSelected={selectedValues.includes(cat.id)}
                    onSelect={() => handleSelect(cat.id)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex" style={{ minHeight: 280 }}>
            {/* Left: Sectors */}
            <div className="w-[140px] border-r bg-muted/30 py-1">
              <ScrollArea className="h-[320px]">
                {SECTORS.map(sector => (
                  <button
                    key={sector.id}
                    onClick={() => setActiveSector(sector.id)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 text-sm flex items-center gap-2 transition-colors hover:bg-accent/50",
                      autoSector === sector.id && "bg-accent text-accent-foreground font-medium"
                    )}
                  >
                    <span className="text-base">{sector.icon}</span>
                    <span className="truncate text-xs leading-tight">
                      {isRu ? sector.labelRu : sector.labelEn}
                    </span>
                    {sector.categories.some(c => selectedValues.includes(c.id)) && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    )}
                  </button>
                ))}
              </ScrollArea>
            </div>

            {/* Right: Categories */}
            <div className="flex-1">
              <ScrollArea className="h-[320px]">
                {!currentSector ? (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground p-4">
                    {isRu ? '← Выберите сектор' : '← Select a sector'}
                  </div>
                ) : domainGroups ? (
                  /* Home services with domain sub-groups */
                  <div className="p-1 space-y-1">
                    {Array.from(domainGroups.entries()).map(([domainId, group]) => (
                      <div key={domainId}>
                        <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <span>{group.icon}</span>
                          {isRu ? group.labelRu : group.labelEn}
                          <Badge variant="secondary" className="ml-auto h-4 px-1 text-[10px]">
                            {group.items.length}
                          </Badge>
                        </div>
                        {group.items.map(cat => (
                          <CategoryRow
                            key={cat.id}
                            category={cat}
                            isRu={isRu}
                            isSelected={selectedValues.includes(cat.id)}
                            onSelect={() => handleSelect(cat.id)}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Flat categories */
                  <div className="p-1">
                    {currentSector.categories.map(cat => (
                      <CategoryRow
                        key={cat.id}
                        category={cat}
                        isRu={isRu}
                        isSelected={selectedValues.includes(cat.id)}
                        onSelect={() => handleSelect(cat.id)}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

/** Single category row */
function CategoryRow({
  category,
  isRu,
  isSelected,
  onSelect,
}: {
  category: CategoryItem;
  isRu: boolean;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-none transition-colors",
        "hover:bg-accent/50",
        isSelected && "bg-primary/10 text-primary font-medium"
      )}
    >
      <Check className={cn("h-3.5 w-3.5 shrink-0", isSelected ? "opacity-100 text-primary" : "opacity-0")} />
      <span className="text-base leading-none">{category.icon}</span>
      <span className="truncate">{isRu ? category.labelRu : category.labelEn}</span>
    </button>
  );
}

// Export for backward compat
export { GENERAL_CATEGORIES };
