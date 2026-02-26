/**
 * PropertyCategoryIcons — Airbnb-style filter ribbon for property search.
 * Derives icons from the canonical PROPERTY_FEATURE_GROUPS taxonomy
 * so guest filters always match what owners/managers set on properties.
 */
import React from 'react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { PROPERTY_FEATURE_GROUPS, PROPERTY_FEATURE_MAP, type PropertyFeature } from '@/lib/config/propertyFeatures';

export interface PropertyCategory {
  id: string;
  icon: React.ElementType;
  labelEn: string;
  labelRu: string;
}

/**
 * Curated subset of the canonical feature taxonomy shown on the guest ribbon.
 * Every ID here MUST exist in PROPERTY_FEATURE_GROUPS so owner ↔ guest filters stay in sync.
 */
const RIBBON_FEATURE_IDS = [
  'beachfront',
  'walk_to_beach',
  'sea_view',
  'private_pool',
  'pool',
  'washer',
  'pet_friendly',
  'kid_friendly',
  'parking',
  'wifi',
  'luxury',
  'air_conditioning',
  'gym',
  'jacuzzi',
] as const;

/** Build the ribbon from the canonical map — guarantees IDs match */
const CATEGORIES: PropertyCategory[] = RIBBON_FEATURE_IDS
  .map(id => PROPERTY_FEATURE_MAP.get(id))
  .filter((f): f is PropertyFeature => !!f)
  .map(f => ({
    id: f.id,
    icon: f.icon as React.ElementType,
    labelEn: f.labelEn,
    labelRu: f.labelRu,
  }));

interface PropertyCategoryIconsProps {
  selected: string[];
  onSelect: (ids: string[]) => void;
  className?: string;
}

export function PropertyCategoryIcons({ selected, onSelect, className }: PropertyCategoryIconsProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const handleToggle = (id: string) => {
    onSelect(
      selected.includes(id)
        ? selected.filter(s => s !== id)
        : [...selected, id]
    );
  };

  return (
    <div className={cn("overflow-x-auto scrollbar-hide", className)}>
      <div className="flex items-end gap-4 px-4 min-w-max">
        {selected.length > 1 && (
          <button
            onClick={() => onSelect([])}
            className="flex flex-col items-center gap-1.5 pb-2 border-b-2 border-transparent text-primary hover:text-primary/80 min-w-[56px] transition-all"
          >
            <span className="text-[10px] font-medium whitespace-nowrap">
              {isRu ? 'Сброс' : 'Clear'}
            </span>
          </button>
        )}
        {CATEGORIES.map((cat) => {
          const isActive = selected.includes(cat.id);
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => handleToggle(cat.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 pb-2 border-b-2 transition-all min-w-[56px]",
                isActive
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium whitespace-nowrap">
                {isRu ? cat.labelRu : cat.labelEn}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Matches a property against a category by checking highlights and amenities.
 * Uses the canonical feature IDs from propertyFeatures.ts.
 */
export function matchesCategory(property: {
  amenities?: string[];
  highlights?: string[];
  view_type?: string;
  is_featured?: boolean;
  property_type?: string;
}, categoryId: string): boolean {
  const amenities = (property.amenities || []).map(a => a.toLowerCase());
  const highlights = (property.highlights || []).map(h => h.toLowerCase());
  const all = [...amenities, ...highlights];
  const viewType = (property.view_type || '').toLowerCase();

  // Direct match — owner chose this exact feature ID
  if (all.includes(categoryId)) return true;

  // Fuzzy fallback for legacy / free-text amenities
  switch (categoryId) {
    case 'beachfront':
      return all.some(a => a.includes('beach') && (a.includes('front') || a === 'beachfront'));
    case 'walk_to_beach':
      return all.some(a =>
        (a.includes('walk') && a.includes('beach')) ||
        a.includes('near beach') ||
        a.includes('close to beach')
      );
    case 'sea_view':
      return viewType.includes('sea') || viewType.includes('ocean') || all.some(a => a.includes('sea view'));
    case 'private_pool':
      return all.some(a => a.includes('private') && a.includes('pool'));
    case 'pool':
      return all.some(a => a.includes('pool') || a.includes('swimming'));
    case 'washer':
      return all.some(a => a.includes('washer') || a.includes('washing') || a.includes('laundry'));
    case 'pet_friendly':
      return all.some(a => a.includes('pet'));
    case 'kid_friendly':
      return all.some(a => a.includes('kid') || a.includes('child') || a.includes('family'));
    case 'parking':
      return all.some(a => a.includes('parking') || a.includes('garage'));
    case 'wifi':
      return all.some(a => a.includes('wifi') || a.includes('wi-fi') || a.includes('internet'));
    case 'luxury':
      return all.some(a => a.includes('luxury') || a.includes('premium'));
    case 'air_conditioning':
      return all.some(a => a.includes('air') || a.includes('ac') || a.includes('conditioning'));
    case 'gym':
      return all.some(a => a.includes('gym') || a.includes('fitness'));
    case 'jacuzzi':
      return all.some(a => a.includes('jacuzzi') || a.includes('hot tub'));
    default:
      return false;
  }
}
