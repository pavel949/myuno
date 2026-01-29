import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Package } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCategories } from '@/hooks/useCategories';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface CategoryGroupsSectionProps {
  expanded?: boolean;
  showAll?: boolean;
}

export function CategoryGroupsSection({ expanded = false, showAll = false }: CategoryGroupsSectionProps) {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const { groups, getName, isLoading } = useCategories();

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, gi) => (
          <div key={gi}>
            <Skeleton className="h-4 w-32 mb-3" />
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 4 }).map((_, ci) => (
                <Skeleton key={ci} className="h-20 rounded-xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const displayGroups = showAll ? groups : groups.slice(0, 3);

  return (
    <div className="space-y-6">
      {displayGroups.map((group) => (
        <div key={group.id}>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">
            {getName(group)}
          </h3>
          <div className={cn(
            "grid gap-2",
            expanded ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-5" : "grid-cols-4"
          )}>
            {(group.categories || []).map((cat) => {
              const Icon = cat.icon || Package;
              return (
                <button
                  key={cat.id}
                  onClick={() => navigate(cat.path)}
                  className={cn(
                    "relative flex flex-col items-center p-3 rounded-xl",
                    "bg-card border border-border/50",
                    "hover:border-primary/30 hover:shadow-sm",
                    "transition-all active:scale-[0.97] group"
                  )}
                >
                  {(cat.isNew || cat.isHot) && (
                    <span className={cn(
                      "absolute -top-1 -right-1 text-[8px] px-1.5 py-0.5 rounded-full font-medium",
                      cat.isNew ? "bg-primary text-primary-foreground" : "bg-amber-500 text-white"
                    )}>
                      {cat.isNew ? 'NEW' : (language === 'ru' ? 'ТОП' : 'HOT')}
                    </span>
                  )}
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center mb-1.5",
                    "bg-gradient-to-br shadow-sm",
                    cat.color,
                    "group-hover:scale-110 transition-transform"
                  )}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[10px] font-medium text-center leading-tight line-clamp-2">
                    {getName(cat)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
      
      {!showAll && (
        <button
          onClick={() => navigate('/discover')}
          className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-primary hover:underline"
        >
          {t('booking.allCategories')}
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
