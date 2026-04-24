import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Package } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCategories, Category, CategoryGroup } from '@/hooks/useCategories';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface CategoryGridProps {
  showAll?: boolean;
  compact?: boolean;
}

export function CategoryGrid({ showAll = false, compact = false }: CategoryGridProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { groups, flatCategories, getName, isLoading } = useCategories();

  // Loading state
  if (isLoading) {
    return (
      <div className={cn(
        "grid gap-2",
        compact ? "grid-cols-4 sm:grid-cols-6" : "grid-cols-2 sm:grid-cols-4"
      )}>
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-none" />
        ))}
      </div>
    );
  }

  const displayCategories = showAll ? flatCategories : flatCategories.slice(0, 12);

  if (compact) {
    return (
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {displayCategories.map((cat) => {
          const Icon = cat.icon || Package;
          return (
            <button
              key={cat.id}
              onClick={(e) => {
                navigate(cat.path);
              }}
              className="relative flex flex-col items-center p-2 rounded-none hover:bg-card/50 transition-all group "
            >
              {(cat.isNew || cat.isHot) && (
                <Badge 
                  className={cn(
                    "absolute -top-1 -right-1 text-[8px] px-1 py-0 h-4",
                    cat.isNew ? "bg-success" : "bg-warning",
                    "text-white border-0"
                  )}
                >
                  {cat.isNew ? 'NEW' : (language === 'ru' ? 'ТОП' : 'HOT')}
                </Badge>
              )}
              <div className={cn(
                "w-10 h-10 rounded-none flex items-center justify-center mb-1.5 bg-gradient-to-br",
                cat.color,
                "transition-transform"
              )}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-[11px] font-medium text-center leading-tight text-muted-foreground group-hover:text-foreground transition-colors line-clamp-2">
                {getName(cat)}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.id}>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            {getName(group)}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {group.categories.map((cat) => {
              const Icon = cat.icon || Package;
              return (
                <button
                  key={cat.id}
                  onClick={(e) => {
                    navigate(cat.path);
                  }}
                  className="relative flex items-center gap-3 p-3 rounded-none bg-card border border-border/50 hover:border-primary/30 transition-all group "
                >
                  {(cat.isNew || cat.isHot) && (
                    <Badge 
                      className={cn(
                        "absolute -top-1.5 -right-1.5 text-[8px] px-1.5 py-0.5",
                        cat.isNew ? "bg-success" : "bg-warning",
                        "text-white border-0"
                      )}
                    >
                      {cat.isNew ? 'NEW' : 'HOT'}
                    </Badge>
                  )}
                  <div className={cn(
                    "w-10 h-10 rounded-none flex items-center justify-center bg-gradient-to-br flex-shrink-0",
                    cat.color,
                    "transition-transform"
                  )}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-medium truncate">
                    {getName(cat)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
