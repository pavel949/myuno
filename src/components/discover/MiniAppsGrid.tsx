import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LucideIcon, Layers, Crown, Sparkles, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Category, CategoryGroup } from '@/hooks/useCategories';

interface MiniAppsGridProps {
  groups: CategoryGroup[];
  getName: (item: Category | CategoryGroup) => string;
  language: string;
  isFeatured?: (entityId: string, entityType?: string) => boolean;
  getCount?: (slugOrType: string) => number | undefined;
}

export const MiniAppsGrid = memo(function MiniAppsGrid({
  groups,
  getName,
  language,
  isFeatured,
  getCount,
}: MiniAppsGridProps) {
  const navigate = useNavigate();
  
  // Flatten all mini-app categories
  const miniApps = groups
    .flatMap(g => g.categories || [])
    .filter(cat => cat.hasMiniApp)
    .sort((a, b) => {
      // Featured first, then by sort order
      const aFeatured = isFeatured?.(a.id, 'category') ? 1 : 0;
      const bFeatured = isFeatured?.(b.id, 'category') ? 1 : 0;
      if (aFeatured !== bFeatured) return bFeatured - aFeatured;
      return a.sortOrder - b.sortOrder;
    });

  if (miniApps.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl">
          <Layers className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold">
            {language === 'ru' ? 'Мини-приложения' : 'Mini-Apps'}
          </h2>
          <p className="text-xs text-muted-foreground">
            {language === 'ru' ? 'Полный функционал бронирования' : 'Full booking experience'}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 gap-3">
        {miniApps.map((cat) => {
          const Icon = cat.icon;
          const featured = isFeatured?.(cat.id, 'category');
          const count = getCount?.(cat.slug) ?? getCount?.(cat.miniAppType || '');
          
          return (
            <MiniAppCard
              key={cat.id}
              icon={Icon}
              name={getName(cat)}
              color={cat.color}
              path={cat.path}
              isFeatured={featured}
              isNew={cat.isNew}
              isHot={cat.isHot}
              count={count}
              language={language}
              onClick={() => navigate(cat.path)}
            />
          );
        })}
      </div>
    </section>
  );
});

interface MiniAppCardProps {
  icon: LucideIcon;
  name: string;
  color: string;
  path: string;
  isFeatured?: boolean;
  isNew?: boolean;
  isHot?: boolean;
  count?: number;
  language: string;
  onClick: () => void;
}

const MiniAppCard = memo(function MiniAppCard({
  icon: Icon,
  name,
  color,
  isFeatured,
  isNew,
  isHot,
  count,
  language,
  onClick,
}: MiniAppCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center justify-start",
        "rounded-2xl p-3 min-h-[100px]",
        "bg-card/80 backdrop-blur-sm border",
        isFeatured
          ? "border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.15)]"
          : "border-primary/20 shadow-[0_0_10px_rgba(var(--primary),0.05)]",
        "hover:border-primary/40 hover:bg-card hover:shadow-lg hover:-translate-y-1",
        "active:scale-95",
        "transition-all duration-200",
        "group"
      )}
    >
      {/* Badges */}
      {isFeatured && (
        <div className="absolute -top-1 -right-1 flex items-center gap-0.5 text-[8px] px-1.5 py-0.5 rounded-full font-bold bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-sm">
          <Crown className="w-2.5 h-2.5" />
          PRO
        </div>
      )}
      
      {!isFeatured && isNew && (
        <div className="absolute -top-1 -right-1 text-[8px] px-1.5 py-0.5 rounded-full font-bold bg-emerald-500 text-white shadow-sm">
          <Sparkles className="w-2.5 h-2.5 inline mr-0.5" />
          NEW
        </div>
      )}
      
      {!isFeatured && !isNew && isHot && (
        <div className="absolute -top-1 -right-1 text-[8px] px-1.5 py-0.5 rounded-full font-bold bg-gradient-to-r from-orange-400 to-red-500 text-white shadow-sm">
          <Flame className="w-2.5 h-2.5 inline" />
        </div>
      )}
      
      {/* Icon */}
      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center mb-2",
        "bg-gradient-to-br shadow-md",
        color || "from-primary/80 to-primary",
        "group-hover:scale-110 group-hover:shadow-lg transition-all duration-200"
      )}>
        <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-white/15 to-transparent" />
        <Icon className="w-6 h-6 text-white drop-shadow-sm relative z-10" />
      </div>
      
      {/* Name */}
      <span className="text-[10px] sm:text-[11px] font-medium text-center leading-tight line-clamp-2 px-0.5 text-foreground/80 group-hover:text-foreground transition-colors">
        {name}
      </span>
      
      {/* Count */}
      {count !== undefined && count > 0 && (
        <span className="text-[9px] text-muted-foreground mt-auto pt-1">
          {count}
        </span>
      )}
    </button>
  );
});
