import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFeaturedCategories } from '@/hooks/useSuperAppCatalog';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export function QuickServiceIcons() {
  const navigate = useNavigate();
  const { featured, isLoading } = useFeaturedCategories();

  if (isLoading) {
    return (
      <div className="px-4 py-3">
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 p-2">
              <Skeleton className="w-12 h-12 rounded-xl" />
              <Skeleton className="h-3 w-10" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-3">
      <div className="grid grid-cols-4 gap-2">
        {featured.slice(0, 8).map((cat) => (
          <button
            key={cat.id}
            onClick={() => navigate(cat.path)}
            className={cn(
              "flex flex-col items-center gap-1.5 p-2 rounded-xl",
              "hover:bg-muted/50 active:bg-muted transition-colors",
              "touch-manipulation"
            )}
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-amber-500/10 flex items-center justify-center">
              <span className="text-2xl">{cat.icon}</span>
            </div>
            <span className="text-[10px] font-medium text-center text-muted-foreground leading-tight line-clamp-2">
              {cat.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
