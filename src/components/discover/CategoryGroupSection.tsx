import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LucideIcon, ChevronRight, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Category, CategoryGroup } from '@/hooks/useCategories';

interface CategoryGroupSectionProps {
  group: CategoryGroup;
  getName: (item: Category | CategoryGroup) => string;
  language: string;
  getCount?: (slugOrType: string) => number | undefined;
  /** Filter out mini-apps from this section (they're shown separately) */
  excludeMiniApps?: boolean;
}

export const CategoryGroupSection = memo(function CategoryGroupSection({
  group,
  getName,
  language,
  getCount,
  excludeMiniApps = true,
}: CategoryGroupSectionProps) {
  const navigate = useNavigate();
  
  // Filter categories
  const categories = (group.categories || []).filter(cat => 
    !excludeMiniApps || !cat.hasMiniApp
  );
  
  // Skip if no categories after filtering
  if (categories.length === 0) return null;

  return (
    <section className="space-y-3">
      {/* Group Header */}
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
          {getName(group)}
        </h3>
        <div className="h-px flex-1 bg-border/50" />
        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {categories.length}
        </span>
      </div>
      
      {/* Category List */}
      <div className="grid grid-cols-1 gap-2">
        {categories.map((cat) => (
          <CategoryRow
            key={cat.id}
            icon={cat.icon}
            name={getName(cat)}
            color={cat.color}
            count={getCount?.(cat.slug) ?? getCount?.(cat.miniAppType || '')}
            language={language}
            onClick={() => navigate(cat.path)}
          />
        ))}
      </div>
    </section>
  );
});

interface CategoryRowProps {
  icon: LucideIcon;
  name: string;
  color: string;
  count?: number;
  language: string;
  onClick: () => void;
}

const CategoryRow = memo(function CategoryRow({
  icon: Icon,
  name,
  color,
  count,
  language,
  onClick,
}: CategoryRowProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl",
        "bg-card/60 border border-border/30",
        "hover:bg-card hover:border-border hover:shadow-sm",
        "active:scale-[0.99]",
        "transition-all duration-150",
        "group text-left"
      )}
    >
      {/* Icon */}
      <div className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
        "bg-gradient-to-br shadow-sm",
        color || "from-muted to-muted"
      )}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      
      {/* Name */}
      <span className="flex-1 text-sm font-medium group-hover:text-primary transition-colors">
        {name}
      </span>
      
      {/* Count */}
      {count !== undefined && count > 0 && (
        <span className="text-xs text-muted-foreground">
          {count}
        </span>
      )}
      
      {/* Arrow */}
      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
    </button>
  );
});
