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
import { ExploreVerticalsSheet } from '@/components/shared/ExploreVerticalsSheet';

// Vertical-specific gradients
const VERTICAL_GRADIENTS: Record<string, string> = {
  yachts: 'from-primary to-primary',
  tours: 'from-accent to-accent',
  restaurants: 'from-accent to-accent',
  property: 'from-success to-success',
  transport: 'from-primary to-primary',
  home_services: 'from-accent to-accent',
  salons: 'from-accent to-primary',
  medical: 'from-success to-success',
  pets: 'from-accent to-accent',
  events: 'from-primary to-primary',
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
              <Skeleton className="w-12 h-12 rounded-none" />
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
        {featured.slice(0, 7).map((cat) => {
          const gradient = VERTICAL_GRADIENTS[cat.vertical] || 'from-primary to-accent';
          
          return (
            <button
              key={cat.id}
              onClick={() => navigate(cat.path)}
              className={cn(
                "flex flex-col items-center gap-1.5 p-2 rounded-none",
                "hover:bg-muted/50 active:bg-muted transition-all duration-200",
                "touch-manipulation "
              )}
            >
              <IconBadge 
                icon={cat.icon} 
                size="lg" 
                variant="gradient" 
                gradient={gradient}
                className="shadow-md"
              />
              <span className="text-[10px] font-medium text-center text-gray-900 dark:text-gray-100 leading-tight line-clamp-2">
                {cat.label}
              </span>
            </button>
          );
        })}
        {/* 8th slot: "More" button opening all verticals */}
        <ExploreVerticalsSheet />
      </div>
    </div>
  );
}
