/**
 * QuickServiceIcons - Professional icon grid for Super-App verticals
 * Uses IconBadge for consistent Lucide icons with gradients
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFeaturedCategories } from '@/hooks/useSuperAppCatalog';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { IconBadge } from '@/components/ui/IconBadge';

// Vertical-specific gradients
const VERTICAL_GRADIENTS: Record<string, string> = {
  yachts: 'from-blue-500 to-cyan-400',
  tours: 'from-amber-500 to-orange-400',
  restaurants: 'from-rose-500 to-pink-400',
  property: 'from-emerald-500 to-green-400',
  transport: 'from-indigo-500 to-violet-400',
  home_services: 'from-amber-500 to-yellow-400',
  salons: 'from-pink-500 to-purple-400',
  medical: 'from-teal-500 to-emerald-400',
  pets: 'from-orange-500 to-amber-400',
  events: 'from-purple-500 to-indigo-400',
};

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
        {featured.slice(0, 8).map((cat) => {
          const gradient = VERTICAL_GRADIENTS[cat.vertical] || 'from-primary to-accent';
          
          return (
            <button
              key={cat.id}
              onClick={() => navigate(cat.path)}
              className={cn(
                "flex flex-col items-center gap-1.5 p-2 rounded-xl",
                "hover:bg-muted/50 active:bg-muted transition-all duration-200",
                "touch-manipulation active:scale-95"
              )}
            >
              <IconBadge 
                icon={cat.icon} 
                size="lg" 
                variant="gradient" 
                gradient={gradient}
                className="shadow-md"
              />
              <span className="text-[10px] font-medium text-center text-muted-foreground leading-tight line-clamp-2">
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
