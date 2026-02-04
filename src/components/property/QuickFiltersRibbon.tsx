/**
 * QuickFiltersRibbon - Agoda/Airbnb style horizontal filter chips
 * Dynamic filters loaded from lookup_values + property_projects
 */

import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { usePropertyQuickFilters, QuickFilter, PropertyProject } from '@/hooks/usePropertyQuickFilters';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, ChevronRight } from 'lucide-react';

interface QuickFiltersRibbonProps {
  selectedFilters: string[];
  selectedProjectId?: string | null;
  onFilterToggle: (filterId: string) => void;
  onProjectSelect: (projectId: string | null) => void;
  className?: string;
}

export function QuickFiltersRibbon({
  selectedFilters,
  selectedProjectId,
  onFilterToggle,
  onProjectSelect,
  className,
}: QuickFiltersRibbonProps) {
  const { language } = useLanguage();
  const { quickFilters, projects, isLoading } = usePropertyQuickFilters();

  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-9 w-28 rounded-full flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Quick Filter Chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 touch-pan-x">
        {quickFilters.map((filter) => (
          <FilterChip
            key={filter.id}
            filter={filter}
            isSelected={selectedFilters.includes(filter.id)}
            onClick={() => onFilterToggle(filter.id)}
            language={language}
          />
        ))}
      </div>

      {/* Projects / Complexes Section */}
      {projects.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Building2 className="w-4 h-4" />
              {language === 'ru' ? 'Комплексы' : 'Residences'}
            </h4>
            {selectedProjectId && (
              <button
                onClick={() => onProjectSelect(null)}
                className="text-xs text-primary hover:underline"
              >
                {language === 'ru' ? 'Показать все' : 'Show all'}
              </button>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 touch-pan-x snap-x snap-mandatory">
            {projects.map((project) => (
              <ProjectChip
                key={project.id}
                project={project}
                isSelected={selectedProjectId === project.id}
                onClick={() => onProjectSelect(selectedProjectId === project.id ? null : project.id)}
                language={language}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface FilterChipProps {
  filter: QuickFilter;
  isSelected: boolean;
  onClick: () => void;
  language: string;
}

function FilterChip({ filter, isSelected, onClick, language }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border flex-shrink-0 touch-manipulation",
        isSelected
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-border bg-background hover:border-primary/50 hover:bg-accent/50 text-foreground"
      )}
    >
      <span className="text-base">{filter.icon}</span>
      <span>{language === 'ru' ? filter.labelRu : filter.labelEn}</span>
    </button>
  );
}

interface ProjectChipProps {
  project: PropertyProject;
  isSelected: boolean;
  onClick: () => void;
  language: string;
}

function ProjectChip({ project, isSelected, onClick, language }: ProjectChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all border flex-shrink-0 snap-start touch-manipulation min-w-[140px]",
        isSelected
          ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
          : "border-border bg-background hover:border-primary/50 hover:bg-accent/50 text-foreground"
      )}
    >
      {project.coverImage ? (
        <img 
          src={project.coverImage} 
          alt="" 
          className="w-8 h-8 rounded-lg object-cover"
        />
      ) : (
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
          <Building2 className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
      <div className="flex flex-col items-start">
        <span className="font-medium text-xs line-clamp-1">
          {language === 'ru' ? project.nameRu : project.nameEn}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {project.propertyCount} {language === 'ru' ? 'объектов' : 'units'}
        </span>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
    </button>
  );
}

export default QuickFiltersRibbon;
