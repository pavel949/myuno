/**
 * OffplanPromoSection - Premium carousel for Phuket off-plan projects
 * Shows on main screen with developer info, progress, muUNO scores
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ChevronRight, Sparkles, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOffplanProjects } from '@/hooks/useOffplanProjects';
import { OffplanProjectCard } from './OffplanProjectCard';
import { cn } from '@/lib/utils';

interface OffplanPromoSectionProps {
  className?: string;
  maxItems?: number;
  showInvestmentOnly?: boolean;
}

export function OffplanPromoSection({ 
  className, 
  maxItems = 10,
  showInvestmentOnly = false 
}: OffplanPromoSectionProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const { data: projects, isLoading } = useOffplanProjects({
    status: ['offplan', 'under_construction'],
    investmentOnly: showInvestmentOnly,
  });

  // Don't show if no projects
  if (!isLoading && (!projects || projects.length === 0)) {
    return null;
  }

  const displayProjects = projects?.slice(0, maxItems) || [];

  return (
    <section className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-lg flex items-center gap-2">
              {isRu ? 'Новостройки Пхукета' : 'Phuket New Developments'}
              <Sparkles className="w-4 h-4 text-amber-500" />
            </h2>
            <p className="text-xs text-muted-foreground">
              {isRu 
                ? 'Инвестируйте в лучшие проекты с экспертизой muUNO' 
                : 'Invest in top projects with muUNO expertise'}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/offplan')}
          className="gap-1 text-primary hover:text-primary"
        >
          {isRu ? 'Все' : 'All'}
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Stats ribbon */}
      {!isLoading && projects && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            <span>{projects.length} {isRu ? 'проектов' : 'projects'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-green-500" />
            <span>
              {isRu ? 'до' : 'up to'} {Math.max(...projects.map(p => p.roiProjected || 0))}% ROI
            </span>
          </div>
        </div>
      )}

      {/* Carousel */}
      {isLoading ? (
        <div className="flex gap-4 overflow-hidden pb-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-[280px] flex-shrink-0">
              <Skeleton className="aspect-[16/10] rounded-t-2xl" />
              <div className="p-4 space-y-3 bg-card rounded-b-2xl border border-t-0">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div 
          className={cn(
            "flex gap-4 overflow-x-auto scrollbar-hide pb-4",
            "-mx-4 px-4 snap-x snap-mandatory touch-pan-x"
          )}
        >
          {displayProjects.map((project) => (
            <OffplanProjectCard
              key={project.id}
              project={project}
              variant="carousel"
              className="snap-start"
            />
          ))}

          {/* View All card */}
          {projects && projects.length > maxItems && (
            <div
              onClick={() => navigate('/offplan')}
              className={cn(
                "flex-shrink-0 w-[200px] rounded-2xl",
                "bg-gradient-to-br from-primary/10 to-primary/5",
                "border border-primary/20",
                "flex flex-col items-center justify-center gap-3",
                "cursor-pointer hover:border-primary/40 transition-colors",
                "snap-start"
              )}
            >
              <div className="p-4 rounded-full bg-primary/10">
                <ChevronRight className="w-6 h-6 text-primary" />
              </div>
              <span className="font-medium text-sm text-primary">
                {isRu ? 'Смотреть все' : 'View all'}
              </span>
              <span className="text-xs text-muted-foreground">
                {projects.length - maxItems}+ {isRu ? 'ещё' : 'more'}
              </span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default OffplanPromoSection;
