/**
 * ProjectPromoSection - Persona-adaptive promo block with project carousel
 * Shows promotional headline + horizontal scrollable carousel of complexes
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserPersonas } from '@/hooks/useUserPersonas';
import { usePropertyProjectsWithStats } from '@/hooks/usePropertyProjectsWithStats';
import { ProjectCarouselCard } from './ProjectCarouselCard';
import { cn } from '@/lib/utils';

interface ProjectPromoSectionProps {
  className?: string;
  mode?: 'rent' | 'buy';
  onProjectSelect?: (id: string) => void;
  selectedProjectId?: string | null;
}

export function ProjectPromoSection({ className, mode = 'rent', onProjectSelect, selectedProjectId }: ProjectPromoSectionProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { personas } = useUserPersonas();
  const { data: projects, isLoading } = usePropertyProjectsWithStats();
  const isRu = language === 'ru';

  // Mode-adaptive promo text
  const getPromoText = () => {
    if (mode === 'rent') {
      return {
        title: isRu ? 'Лучшие комплексы для аренды' : 'Best Complexes for Rent',
        subtitle: isRu
          ? 'Проверенные резиденции с инфраструктурой'
          : 'Verified residences with full amenities',
      };
    }

    // Buy mode - show investment angle
    const isInvestor = personas.includes('property_owner') || personas.includes('investor');

    if (isInvestor) {
      return {
        title: isRu ? 'Инвестиционные проекты Пхукета' : 'Phuket Investment Projects',
        subtitle: isRu
          ? 'Выберите комплекс для прибыльных вложений'
          : 'Choose a complex for profitable investment',
      };
    }

    return {
      title: isRu ? 'Жилые комплексы Пхукета' : 'Phuket Residential Complexes',
      subtitle: isRu
        ? 'Посмотрите наши жилые комплексы!'
        : 'Check out our residential complexes!',
    };
  };

  const { title, subtitle } = getPromoText();

  // Sort based on mode — show ALL projects, prioritize those with listings
  const sortedProjects = React.useMemo(() => {
    if (!projects) return [];
    
    return [...projects].sort((a, b) => {
      // Featured first
      if (a.isFeatured !== b.isFeatured) return b.isFeatured ? 1 : -1;
      
      // Then by listing count (projects with listings first)
      if (mode === 'rent') {
        return b.rentCount - a.rentCount;
      }
      
      return (b.rentCount + b.saleCount) - (a.rentCount + a.saleCount);
    });
  }, [projects, mode]);

  // Don't show if no projects (check after all hooks)
  if (!isLoading && (!projects || projects.length === 0)) {
    return null;
  }

  return (
    <section
      className={cn(
        "rounded-2xl bg-gradient-to-br from-primary/5 via-background to-accent/5 border border-border/50 p-4",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 rounded-xl bg-primary/10">
          <Building2 className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            {title}
            <Sparkles className="w-4 h-4 text-accent-amber" />
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
      </div>

      {/* Carousel */}
      {isLoading ? (
        <div className="flex gap-3 overflow-hidden pb-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-[260px] flex-shrink-0">
              <Skeleton className="aspect-[16/10] rounded-t-2xl" />
              <div className="p-3 space-y-2 bg-card rounded-b-2xl border border-t-0">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 snap-x snap-mandatory touch-pan-y">
          {sortedProjects.map((project) => (
            <ProjectCarouselCard
              key={project.id}
              project={project}
              className="snap-start"
              onSelect={onProjectSelect ? (id) => {
                // Toggle: click again to deselect
                onProjectSelect(selectedProjectId === id ? '' : id);
              } : undefined}
              isSelected={selectedProjectId === project.id}
            />
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="mt-4 flex justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/property/projects')}
          className="gap-2 rounded-full"
        >
          {isRu ? 'Смотреть все комплексы' : 'View all complexes'}
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </section>
  );
}

export default ProjectPromoSection;
