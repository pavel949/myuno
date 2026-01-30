import React, { memo } from 'react';
import { Layers, Compass, Users, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AudienceFilter = 'all' | 'tourists' | 'residents' | 'owners';

// Category slugs for each audience
export const AUDIENCE_CATEGORIES: Record<AudienceFilter, Set<string>> = {
  all: new Set(), // empty means show all
  tourists: new Set(['yachts', 'tours', 'transport', 'events', 'water', 'restaurants', 'flowers', 'beauty', 'beauty-spa']),
  residents: new Set(['legal', 'insurance', 'medical', 'banking', 'property', 'real-estate', 'education', 'visa', 'pharmacy', 'fitness']),
  owners: new Set(['property', 'real-estate', 'cleaning', 'services', 'legal', 'insurance', 'babysitter']),
};

interface AudienceFilterTabsProps {
  value: AudienceFilter;
  onChange: (value: AudienceFilter) => void;
  language: string;
}

const TABS: { id: AudienceFilter; label: string; labelRu: string; icon: React.ElementType }[] = [
  { id: 'all', label: 'All', labelRu: 'Все', icon: Layers },
  { id: 'tourists', label: 'Tourists', labelRu: 'Туристам', icon: Compass },
  { id: 'residents', label: 'Residents', labelRu: 'Резидентам', icon: Users },
  { id: 'owners', label: 'Owners', labelRu: 'Владельцам', icon: Home },
];

export const AudienceFilterTabs = memo(function AudienceFilterTabs({ 
  value, 
  onChange, 
  language 
}: AudienceFilterTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = value === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
              isActive 
                ? "bg-primary text-primary-foreground shadow-md" 
                : "bg-card border border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            <Icon className="w-4 h-4" />
            {language === 'ru' ? tab.labelRu : tab.label}
          </button>
        );
      })}
    </div>
  );
});
